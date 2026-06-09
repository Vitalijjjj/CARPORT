import dns from 'dns'
dns.setDefaultResultOrder('ipv4first') // Force IPv4 so MySQL sees our IPv4 address (not IPv6)

import express from 'express'
import mysql from 'mysql2/promise'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, renameSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { createRequire } from 'module'

// Optional dependency — if nodemailer isn't installed, lead email is just disabled.
// Loaded synchronously (no top-level await) for maximum Node-version compatibility.
const require = createRequire(import.meta.url)
let nodemailer = null
try { nodemailer = require('nodemailer') } catch { /* lead email disabled */ }

const __dirname = dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3000

// Build React frontend if dist/ doesn't exist (Hostinger doesn't run npm run build)
if (!existsSync(join(__dirname, 'dist', 'index.html'))) {
  console.log('Building React frontend...')
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname })
    console.log('✓ Frontend built')
  } catch (e) {
    console.error('Frontend build failed:', e.message)
  }
}

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }))
// Cars can carry up to 25 gallery photos as base64 data URLs — allow a large body
app.use(express.json({ limit: '60mb' }))
app.use(express.urlencoded({ extended: true, limit: '60mb' }))

// ── Database pool ─────────────────────────────────────────────────
// Hostinger Node.js and MySQL are on the same machine.
// MySQL grants 'user'@'localhost' (Unix socket), not 'user'@'127.0.0.1' (TCP).
// Use socketPath so MySQL sees the connection as localhost.
const SOCKET_PATHS = [
  '/var/run/mysqld/mysqld.sock',
  '/tmp/mysql.sock',
  '/var/lib/mysql/mysql.sock',
]
const socketPath = SOCKET_PATHS.find(p => { try { statSync(p); return true } catch { return false } })
const dbConfig = socketPath
  ? { socketPath }
  : { host: process.env.DATABASE_HOST || 'auth-db1729.hstgr.io' }
console.log('DB connect via:', socketPath || dbConfig.host)

// Hostinger escapes '#' as '\#' in env vars — unescape for the real value
const dbPassword = (process.env.DATABASE_PASSWORD || '').replace(/\\#/g, '#')

const db = mysql.createPool({
  ...dbConfig,
  database:           process.env.DATABASE_NAME,
  user:               process.env.DATABASE_USER,
  password:           dbPassword,
  waitForConnections: true,
  connectionLimit:    10,
})

// ── Lead email (SMTP) ─────────────────────────────────────────────
// Configure via env vars: SMTP_USER + SMTP_PASS (Hostinger mailbox).
// Optional: SMTP_HOST, SMTP_PORT, LEAD_EMAIL_TO, LEAD_EMAIL_FROM.
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 465
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\\#/g, '#')
const LEAD_TO   = process.env.LEAD_EMAIL_TO   || 'info@turboeagleauto.com'
const LEAD_FROM = process.env.LEAD_EMAIL_FROM || SMTP_USER || 'info@turboeagleauto.com'

// Easiest option: Web3Forms (no mailbox/SMTP needed — just one access key).
// Leads go to the email you registered the key with. https://web3forms.com
const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY || ''

let mailer = null
if (WEB3FORMS_KEY) {
  console.log('✉ Lead email enabled via Web3Forms')
} else if (nodemailer && SMTP_USER && SMTP_PASS) {
  mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  console.log('✉ Lead email enabled via SMTP →', LEAD_TO)
} else {
  console.log('✉ Lead email disabled (set WEB3FORMS_KEY, or SMTP_USER + SMTP_PASS, to enable)')
}

const SOURCE_LABELS = {
  form:   'Pedido de contacto',
  import: 'Pedido de importação da Alemanha',
  quiz:   'Questionário de seleção',
  popup:  'Oferta especial (popup)',
  widget: 'Widget de ajuda',
  car:    'Interesse numa viatura',
}

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function formatQuizAnswers(answers) {
  let a = answers
  if (typeof a === 'string') { try { a = JSON.parse(a) } catch { return escHtml(a) } }
  if (Array.isArray(a)) {
    return a.map((item, i) => {
      if (item && typeof item === 'object') {
        const q = item.question || item.q || `#${i + 1}`
        const v = item.answer ?? item.a ?? item.value ?? ''
        return `${escHtml(q)}: <b>${escHtml(v)}</b>`
      }
      return `${i + 1}. ${escHtml(item)}`
    }).join('<br>')
  }
  if (a && typeof a === 'object') {
    return Object.entries(a).map(([k, v]) => `${escHtml(k)}: <b>${escHtml(v)}</b>`).join('<br>')
  }
  return escHtml(a)
}

function leadEmailHtml(lead) {
  const sourceLabel = SOURCE_LABELS[lead.source] || 'Novo contacto'
  const when = new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })
  const rows = []
  const add = (label, html) => {
    if (html === undefined || html === null || html === '') return
    rows.push(`<tr>
      <td style="padding:11px 16px;color:#64748b;font:600 12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #eef2f6;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:11px 16px;color:#0f172a;font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;border-bottom:1px solid #eef2f6">${html}</td>
    </tr>`)
  }
  add('Nome', escHtml(lead.name))
  if (lead.phone) add('Telefone', `<a href="tel:${escHtml(lead.phone)}" style="color:#006be6;text-decoration:none">${escHtml(lead.phone)}</a>`)
  if (lead.email) add('Email', `<a href="mailto:${escHtml(lead.email)}" style="color:#006be6;text-decoration:none">${escHtml(lead.email)}</a>`)
  if (lead.message) add('Mensagem', escHtml(lead.message).replace(/\n/g, '<br>'))
  if (lead.car_id)  add('Viatura', `ID #${escHtml(lead.car_id)}`)
  if (lead.quiz_answers) add('Respostas', formatQuizAnswers(lead.quiz_answers))

  return `<!DOCTYPE html>
<html><body style="margin:0;background:#f1f5f9;padding:24px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,.08)">
        <tr><td style="background:#0b1220;padding:22px 24px">
          <div style="color:#fff;font:700 18px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.06em">TURBOEAGLE</div>
          <div style="color:#7c8aa0;font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;margin-top:6px">${escHtml(sourceLabel)} · ${escHtml(when)}</div>
        </td></tr>
        <tr><td style="padding:8px 8px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>
        </td></tr>
        <tr><td style="padding:16px 24px 22px;color:#94a3b8;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif">
          Mensagem automática do site turboeagleauto.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// Plain-text quiz answers (for the Web3Forms field list)
function quizAnswersText(answers) {
  let a = answers
  if (typeof a === 'string') { try { a = JSON.parse(a) } catch { return a } }
  if (Array.isArray(a)) {
    return a.map((item, i) => {
      if (item && typeof item === 'object') {
        const q = item.question || item.q || `#${i + 1}`
        const v = item.answer ?? item.a ?? item.value ?? ''
        return `${q}: ${v}`
      }
      return `${i + 1}. ${item}`
    }).join('\n')
  }
  if (a && typeof a === 'object') {
    return Object.entries(a).map(([k, v]) => `${k}: ${v}`).join('\n')
  }
  return String(a ?? '')
}

async function sendViaWeb3Forms(lead) {
  const sourceLabel = SOURCE_LABELS[lead.source] || 'Novo contacto'
  const payload = {
    access_key: WEB3FORMS_KEY,
    subject:    `🚗 ${sourceLabel}${lead.name ? ` — ${lead.name}` : ''}`,
    from_name:  'TURBOEAGLE Site',
    Origem:     sourceLabel,
    Nome:       lead.name    || '—',
    Telefone:   lead.phone   || '—',
    Email:      lead.email   || '—',
    Mensagem:   lead.message || '—',
  }
  if (lead.car_id)       payload['Viatura ID'] = String(lead.car_id)
  if (lead.quiz_answers) payload['Respostas']  = quizAnswersText(lead.quiz_answers)
  if (lead.email)        payload.replyto       = lead.email

  const res = await fetch('https://api.web3forms.com/submit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Web3Forms HTTP ${res.status}`)
}

async function sendViaSmtp(lead) {
  const sourceLabel = SOURCE_LABELS[lead.source] || 'Novo contacto'
  await mailer.sendMail({
    from:    `"TURBOEAGLE Site" <${LEAD_FROM}>`,
    to:      LEAD_TO,
    replyTo: lead.email || undefined,
    subject: `🚗 ${sourceLabel}${lead.name ? ` — ${lead.name}` : ''}`,
    html:    leadEmailHtml(lead),
  })
}

async function sendLeadEmail(lead) {
  try {
    if (WEB3FORMS_KEY)   return await sendViaWeb3Forms(lead)
    if (mailer)          return await sendViaSmtp(lead)
  } catch (err) {
    console.error('Lead email failed:', err.message)
  }
}

// ── Auto-init: create tables + first admin on first boot ──────────
async function initDb() {
  console.log('Initializing database…')
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      email         VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name          VARCHAR(100) NOT NULL DEFAULT 'Admin',
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY admin_users_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS cars (
      id                          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      brand                       VARCHAR(100) NOT NULL,
      model                       VARCHAR(100) NOT NULL,
      version                     VARCHAR(150) DEFAULT NULL,
      year                        SMALLINT UNSIGNED NOT NULL,
      price                       DECIMAL(10,2) NOT NULL,
      mileage                     INT UNSIGNED NOT NULL DEFAULT 0,
      fuel_type                   ENUM('electric','hybrid','petrol','diesel') NOT NULL DEFAULT 'electric',
      transmission                ENUM('automatic','manual') NOT NULL DEFAULT 'automatic',
      power                       SMALLINT UNSIGNED DEFAULT NULL,
      battery_capacity            DECIMAL(5,1) DEFAULT NULL,
      battery_health              TINYINT UNSIGNED DEFAULT NULL,
      electric_range              SMALLINT UNSIGNED DEFAULT NULL,
      drive_type                  VARCHAR(10) DEFAULT NULL,
      exterior_color              VARCHAR(100) DEFAULT NULL,
      interior_color              VARCHAR(100) DEFAULT NULL,
      location                    VARCHAR(200) DEFAULT NULL,
      status                      ENUM('available','reserved','sold','hidden') NOT NULL DEFAULT 'available',
      warranty_available          TINYINT(1) NOT NULL DEFAULT 0,
      warranty_term               VARCHAR(100) DEFAULT NULL,
      financing_available         TINYINT(1) NOT NULL DEFAULT 0,
      trade_in_available          TINYINT(1) NOT NULL DEFAULT 0,
      service_history_available   TINYINT(1) NOT NULL DEFAULT 0,
      delivery_available_portugal TINYINT(1) NOT NULL DEFAULT 0,
      short_description           TEXT DEFAULT NULL,
      full_description            MEDIUMTEXT DEFAULT NULL,
      equipment                   TEXT DEFAULT NULL,
      features                    JSON DEFAULT NULL,
      gallery                     JSON DEFAULT NULL,
      main_image                  MEDIUMTEXT DEFAULT NULL,
      meta_title                  VARCHAR(200) DEFAULT NULL,
      meta_description            TEXT DEFAULT NULL,
      created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY cars_status_idx (status),
      KEY cars_brand_idx  (brand),
      KEY cars_price_idx  (price)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  // Schema migration: add columns that may be missing from older table versions
  for (const sql of [
    "ALTER TABLE cars ADD COLUMN features JSON DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN gallery JSON DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN main_image VARCHAR(500) DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN meta_title VARCHAR(200) DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN meta_description TEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN short_description_en TEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN short_description_uk TEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN full_description_en MEDIUMTEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN full_description_uk MEDIUMTEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN equipment_en TEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN equipment_uk TEXT DEFAULT NULL",
    "ALTER TABLE cars ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL",
  ]) {
    try { await db.query(sql) } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e }
  }
  // Widen main_image to hold base64 data URLs
  for (const sql of [
    "ALTER TABLE cars MODIFY COLUMN main_image MEDIUMTEXT DEFAULT NULL",
  ]) {
    try { await db.query(sql) } catch (e) { /* ignore if already correct type */ }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name         VARCHAR(200) DEFAULT NULL,
      phone        VARCHAR(50)  DEFAULT NULL,
      email        VARCHAR(255) DEFAULT NULL,
      message      TEXT         DEFAULT NULL,
      source       VARCHAR(50)  NOT NULL DEFAULT 'form',
      car_id       INT UNSIGNED DEFAULT NULL,
      quiz_answers JSON         DEFAULT NULL,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name        VARCHAR(150) NOT NULL DEFAULT '',
      location    VARCHAR(150) DEFAULT NULL,
      title       VARCHAR(200) DEFAULT NULL,
      quote       TEXT         DEFAULT NULL,
      rating      TINYINT UNSIGNED NOT NULL DEFAULT 5,
      image       MEDIUMTEXT   DEFAULT NULL,
      badge       VARCHAR(150) DEFAULT NULL,
      lang        VARCHAR(5)   NOT NULL DEFAULT 'all',
      status      ENUM('visible','hidden') NOT NULL DEFAULT 'visible',
      sort_order  INT NOT NULL DEFAULT 0,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY reviews_status_idx (status),
      KEY reviews_lang_idx   (lang)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  // Per-language text columns (one review row holds all translations)
  for (const sql of [
    "ALTER TABLE reviews ADD COLUMN title_en VARCHAR(200) DEFAULT NULL",
    "ALTER TABLE reviews ADD COLUMN quote_en TEXT DEFAULT NULL",
    "ALTER TABLE reviews ADD COLUMN title_uk VARCHAR(200) DEFAULT NULL",
    "ALTER TABLE reviews ADD COLUMN quote_uk TEXT DEFAULT NULL",
  ]) {
    try { await db.query(sql) } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e }
  }

  // Default reviews shown on the site — ONE entry each, with PT/EN/UK text in the
  // same row (no per-language duplicate rows).
  const SEED_REVIEWS = [
    { name: 'R. & A. M.', location: 'Lisboa, Portugal', badge: 'Mercedes-Benz · Lisboa', image: '/assets/review-1.jpg',
      pt: ['Mercedes-Benz entregue em Lisboa', 'Ficámos muito satisfeitos com todo o processo. A equipa guiou-nos em cada etapa e o carro superou as nossas expectativas. Entrega impecável ao pôr do sol!'],
      en: ['Mercedes-Benz delivered in Lisbon', 'We were very happy with the whole process. The team guided us at every step and the car exceeded our expectations. A perfect sunset delivery!'],
      uk: ['Mercedes-Benz доставлено в Лісабон', 'Ми дуже задоволені всім процесом. Команда супроводжувала нас на кожному кроці, а авто перевершило наші очікування. Ідеальна передача на заході сонця!'] },
    { name: 'D. F.', location: 'Porto, Portugal', badge: 'BMW · Porto', image: '/assets/review-2.jpg',
      pt: ['BMW encontrado e entregue no Porto', 'Processo rápido e completamente transparente. Conseguiram encontrar exatamente o BMW que procurava. Recomendo sem hesitar a qualquer pessoa.'],
      en: ['BMW found and delivered in Porto', 'Fast and completely transparent process. They found exactly the BMW I was looking for. I would recommend TURBOEAGLE to anyone without hesitation.'],
      uk: ['BMW знайдено і доставлено в Порту', 'Швидкий і повністю прозорий процес. Знайшли саме той BMW, який я шукав. Рекомендую TURBOEAGLE без вагань.'] },
    { name: 'M. & J. P.', location: 'Setúbal, Portugal', badge: 'BMW 3 · Setúbal', image: '/assets/review-3.jpg',
      pt: ['BMW 3 Series — casal feliz em Setúbal', 'Atendimento excelente do início ao fim. Entregaram o BMW dos nossos sonhos dentro do prazo prometido. A equipa está sempre disponível para ajudar.'],
      en: ['BMW 3 Series — happy couple in Setúbal', 'Excellent service from start to finish. They delivered our dream BMW within the promised timeframe. The team is always available to help.'],
      uk: ['BMW 3 Series — щаслива пара в Сетубалі', 'Відмінний сервіс від початку до кінця. Доставили BMW нашої мрії в обіцяний термін. Команда завжди готова допомогти.'] },
    { name: 'S. C.', location: 'Cascais, Portugal', badge: 'Mercedes-Benz · Cascais', image: '/assets/review-4.jpg',
      pt: ['Mercedes-Benz em Cascais — entrega no próprio dia', 'Equipa profissional e muito transparente. Encontraram o Mercedes perfeito para mim e todo o processo foi simples e sem surpresas. Muito obrigada!'],
      en: ['Mercedes-Benz in Cascais — same-day delivery', 'Very professional and transparent team. They found the perfect Mercedes for me and the whole process was straightforward with no surprises. Thank you!'],
      uk: ['Mercedes-Benz у Кашкайші — передача того ж дня', 'Дуже професійна та прозора команда. Знайшли ідеальний Mercedes для мене, весь процес пройшов легко і без жодних сюрпризів. Дуже дякую!'] },
  ]
  const SEED_IMAGES = SEED_REVIEWS.map(r => r.image)
  const seedRows    = () => SEED_REVIEWS.map((r, i) =>
    [r.name, r.location, r.pt[0], r.pt[1], r.en[0], r.en[1], r.uk[0], r.uk[1], 5, r.image, r.badge, 'all', 'visible', i])
  const SEED_INSERT = 'INSERT INTO reviews (name, location, title, quote, title_en, quote_en, title_uk, quote_uk, rating, image, badge, lang, status, sort_order) VALUES ?'

  const [revCount] = await db.query('SELECT COUNT(*) AS n FROM reviews')
  if (revCount[0].n === 0) {
    await db.query(SEED_INSERT, [seedRows()])
    console.log('✓ Seeded default reviews')
  } else {
    // One-time cleanup: replace earlier seed variants (per-language rows, or single
    // rows without translations) with one multilingual entry per review.
    const [needs] = await db.query(
      "SELECT COUNT(*) AS n FROM reviews WHERE image IN (?) AND (lang <> 'all' OR title_en IS NULL)",
      [SEED_IMAGES]
    )
    if (needs[0].n > 0) {
      await db.query('DELETE FROM reviews WHERE image IN (?)', [SEED_IMAGES])
      await db.query(SEED_INSERT, [seedRows()])
      console.log('✓ Rebuilt seeded reviews with translations')
    }
  }

  // Create first admin if none exist; if ADMIN_PASS is set, always sync the password
  const [existing] = await db.query('SELECT id FROM admin_users LIMIT 1')
  const email = process.env.ADMIN_EMAIL || 'admin@carrai.com'
  const pass  = (process.env.ADMIN_PASS || '').replace(/\\#/g, '#') || 'Admin123!'
  if (existing.length === 0) {
    const hash = await bcrypt.hash(pass, 12)
    await db.query('INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)', [email, hash, 'Admin'])
    console.log(`✓ Admin created: ${email}`)
  } else if (process.env.ADMIN_PASS) {
    const hash = await bcrypt.hash(pass, 12)
    await db.query('UPDATE admin_users SET email = ?, password_hash = ? WHERE id = ?', [email, hash, existing[0].id])
    console.log(`✓ Admin password synced: ${email}`)
  }
  console.log('✓ Database ready')
}

// ── Auth helpers ──────────────────────────────────────────────────
const SECRET = process.env.JWT_SECRET || 'change-before-deploy-50-chars-minimum-please'
const TTL    = 86400 * 30

function makeToken(payload) { return jwt.sign(payload, SECRET, { expiresIn: TTL }) }

function readToken(req) {
  const auth = req.headers.authorization || ''
  const t = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!t) return null
  try { return jwt.verify(t, SECRET) } catch { return null }
}

function requireAuth(req, res) {
  const p = readToken(req)
  if (!p) { res.status(401).json({ error: 'Unauthorized' }); return null }
  return p
}

// ── DB helpers ────────────────────────────────────────────────────
function parseJson(val, fallback) {
  if (Array.isArray(val)) return val
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

// Columns returned for list endpoints — excludes the heavy base64 `gallery`
// and long text blobs so the catalog/hero load fast. Single-car fetches use SELECT *.
const CAR_LIST_COLUMNS = [
  'id', 'brand', 'model', 'version', 'year', 'price', 'mileage',
  'fuel_type', 'transmission', 'power', 'battery_capacity', 'battery_health',
  'electric_range', 'drive_type', 'exterior_color', 'interior_color', 'location',
  'status', 'warranty_available', 'warranty_term', 'financing_available',
  'trade_in_available', 'service_history_available', 'delivery_available_portugal',
  'short_description', 'short_description_en', 'short_description_uk',
  'features', 'main_image', 'youtube_url', 'meta_title', 'created_at', 'updated_at',
].join(', ')

function decodeCar(row) {
  return {
    ...row,
    price:         Number(row.price),
    equipment:     parseJson(row.equipment,    []),
    equipment_en:  parseJson(row.equipment_en, []),
    equipment_uk:  parseJson(row.equipment_uk, []),
    features:      parseJson(row.features,     []),
    gallery:       parseJson(row.gallery,      []),
  }
}

function toJsonField(val) {
  if (!val) return null
  if (Array.isArray(val)) return JSON.stringify(val)
  if (typeof val === 'string') {
    try { JSON.parse(val); return val } catch { return JSON.stringify(val.split(',').map(s => s.trim()).filter(Boolean)) }
  }
  return JSON.stringify(val)
}

function makeSlug(body) {
  const base = [body.brand, body.model, body.year]
    .filter(Boolean).join('-')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base + '-' + Math.random().toString(36).slice(2, 7)
}

function carFields(body, isInsert = false) {
  const bool = k => (body[k] ? 1 : 0)
  const fields = {
    brand:                       body.brand                    || null,
    model:                       body.model                    || null,
    version:                     body.version                  || null,
    year:                        body.year                     || null,
    price:                       body.price                    || 0,
    mileage:                     body.mileage                  || 0,
    fuel_type:                   body.fuel_type                || 'electric',
    transmission:                body.transmission             || 'automatic',
    power:                       body.power                    || null,
    battery_capacity:            body.battery_capacity         || null,
    battery_health:              body.battery_health           || null,
    electric_range:              body.electric_range           || null,
    drive_type:                  body.drive_type               || null,
    exterior_color:              body.exterior_color           || null,
    interior_color:              body.interior_color           || null,
    location:                    body.location                 || null,
    status:                      body.status                   || 'available',
    warranty_available:          bool('warranty_available'),
    warranty_term:               body.warranty_term            || null,
    financing_available:         bool('financing_available'),
    trade_in_available:          bool('trade_in_available'),
    service_history_available:   bool('service_history_available'),
    delivery_available_portugal: bool('delivery_available_portugal'),
    short_description:           body.short_description        || null,
    short_description_en:        body.short_description_en     || null,
    short_description_uk:        body.short_description_uk     || null,
    full_description:            body.full_description         || null,
    full_description_en:         body.full_description_en      || null,
    full_description_uk:         body.full_description_uk      || null,
    equipment:                   toJsonField(body.equipment),
    equipment_en:                toJsonField(body.equipment_en),
    equipment_uk:                toJsonField(body.equipment_uk),
    features:                    toJsonField(body.features),
    gallery:                     toJsonField(body.gallery),
    main_image:                  body.main_image               || null,
    youtube_url:                 body.youtube_url              || null,
    meta_title:                  body.meta_title               || null,
    meta_description:            body.meta_description         || null,
    updated_at:                  new Date(),
  }
  if (isInsert) fields.slug = body.slug || makeSlug(body)
  return fields
}

// ── POST /api/auth.php — login ────────────────────────────────────
app.post('/api/auth.php', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const [rows] = await db.query('SELECT * FROM admin_users WHERE email = ?', [email])
    const admin = rows[0]
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = makeToken({ uid: admin.id, email: admin.email })
    res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name } })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/magic-login.php?key=... — one-time auto-login link (temporary)
app.get('/api/magic-login.php', async (req, res) => {
  if (req.query.key !== 'olimp-eagle-7x2k') return res.status(403).send('Forbidden')
  const [rows] = await db.query('SELECT * FROM admin_users WHERE email = ? LIMIT 1', ['admin@carrai.com'])
  const admin = rows[0]
  if (!admin) return res.status(404).send('Admin not found')
  const token = makeToken({ uid: admin.id, email: admin.email })
  const adminJson = JSON.stringify({ id: admin.id, email: admin.email, name: admin.name })
  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logging in...</title></head><body><p>Logging in...</p><script>
localStorage.setItem('admin_token','${token}');
localStorage.setItem('admin_user',${adminJson});
window.location.href='/admin';
</script></body></html>`)
})

// DELETE /api/auth.php — logout
app.delete('/api/auth.php', (_req, res) => res.json({ ok: true }))

// ── GET /api/public_cars.php — public catalog ─────────────────────
app.get('/api/public_cars.php', async (req, res) => {
  try {
    const { id } = req.query
    if (id) {
      const [rows] = await db.query("SELECT * FROM cars WHERE id = ? AND status NOT IN ('hidden','sold')", [id])
      if (!rows[0]) return res.status(404).json({ error: 'Car not found' })
      return res.json(decodeCar(rows[0]))
    }
    const [rows] = await db.query(`SELECT ${CAR_LIST_COLUMNS} FROM cars WHERE status NOT IN ('hidden','sold') ORDER BY created_at DESC`)
    res.json(rows.map(decodeCar))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── /api/cars.php — admin CRUD ────────────────────────────────────
app.get('/api/cars.php', async (req, res) => {
  try {
    const auth = readToken(req)
    const { id } = req.query
    if (id) {
      const [rows] = await db.query('SELECT * FROM cars WHERE id = ?', [id])
      if (!rows[0]) return res.status(404).json({ error: 'Car not found' })
      return res.json(decodeCar(rows[0]))
    }
    const sql = auth
      ? `SELECT ${CAR_LIST_COLUMNS} FROM cars ORDER BY created_at DESC`
      : `SELECT ${CAR_LIST_COLUMNS} FROM cars WHERE status NOT IN ('hidden','sold') ORDER BY created_at DESC`
    const [rows] = await db.query(sql)
    res.json(rows.map(decodeCar))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const [result] = await db.query('INSERT INTO cars SET ?', [carFields(req.body, true)])
    res.json({ success: true, id: result.insertId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    await db.query('UPDATE cars SET ? WHERE id = ?', [carFields(req.body), id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'status required' })
    await db.query('UPDATE cars SET status = ?, updated_at = NOW() WHERE id = ?', [status, id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    await db.query('DELETE FROM cars WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/upload.php — image upload ──────────────────────────
const UPLOAD_DIR = join(__dirname, 'uploads')
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)),
})

app.post('/api/upload.php', upload.single('image'), async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    if (!req.file) return res.status(400).json({ error: 'No valid image uploaded (JPEG/PNG/WebP, max 12 MB)' })
    const extMap = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    const ext = extMap[req.file.mimetype]
    const filename = `car_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    renameSync(req.file.path, join(UPLOAD_DIR, filename))
    res.json({ success: true, url: `/uploads/${filename}`, filename })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/leads.php — admin only ──────────────────────────────
app.get('/api/leads.php', async (req, res) => {
  if (!requireAuth(req, res)) return
  try {
    const [rows] = await db.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/leads.php ───────────────────────────────────────────
app.post('/api/leads.php', async (req, res) => {
  const { name, phone, email, message, source, car_id } = req.body
  if (!name && !phone && !email) return res.status(400).json({ error: 'At least name, phone, or email is required' })
  try {
    await db.query(
      'INSERT INTO leads (name, phone, email, message, source, car_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, phone || null, email || null, message || null, source || 'form', car_id || null]
    )
  } catch { /* ignore if table missing */ }
  sendLeadEmail({ name, phone, email, message, source: source || 'form', car_id })
  res.json({ success: true, message: 'Thank you! We will contact you soon.' })
})

// ── Reviews ───────────────────────────────────────────────────────
function reviewFields(body) {
  let rating = parseInt(body.rating)
  if (isNaN(rating)) rating = 5
  rating = Math.max(1, Math.min(5, rating))
  return {
    name:       body.name      || '',
    location:   body.location  || null,
    title:      body.title     || null,   // PT (primary)
    quote:      body.quote     || null,
    title_en:   body.title_en  || null,
    quote_en:   body.quote_en  || null,
    title_uk:   body.title_uk  || null,
    quote_uk:   body.quote_uk  || null,
    rating,
    image:      body.image     || null,
    badge:      body.badge     || null,
    lang:       'all',
    status:     body.status === 'hidden' ? 'hidden' : 'visible',
    sort_order: parseInt(body.sort_order) || 0,
    updated_at: new Date(),
  }
}

// GET /api/public_reviews.php?lang=xx — visible reviews, text resolved for the language
app.get('/api/public_reviews.php', async (req, res) => {
  try {
    const lang = ['pt', 'en', 'uk'].includes(req.query.lang) ? req.query.lang : 'pt'
    const [rows] = await db.query(
      "SELECT * FROM reviews WHERE status = 'visible' ORDER BY sort_order ASC, created_at DESC"
    )
    const out = rows.map(r => ({
      id:       r.id,
      name:     r.name,
      location: r.location,
      rating:   r.rating,
      image:    r.image,
      badge:    r.badge,
      // Fall back to PT when a translation is empty
      title:    (lang === 'en' ? r.title_en : lang === 'uk' ? r.title_uk : r.title) || r.title,
      quote:    (lang === 'en' ? r.quote_en : lang === 'uk' ? r.quote_uk : r.quote) || r.quote,
    }))
    res.json(out)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/reviews.php — admin list (auth)
app.get('/api/reviews.php', async (req, res) => {
  if (!requireAuth(req, res)) return
  try {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY sort_order ASC, created_at DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/reviews.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const [result] = await db.query('INSERT INTO reviews SET ?', [reviewFields(req.body)])
    res.json({ success: true, id: result.insertId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/reviews.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    await db.query('UPDATE reviews SET ? WHERE id = ?', [reviewFields(req.body), id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/reviews.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    await db.query('DELETE FROM reviews WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/quiz.php ────────────────────────────────────────────
app.post('/api/quiz.php', async (req, res) => {
  const { name, phone, email, message, answers } = req.body
  if (!name && !phone && !email) return res.status(400).json({ error: 'At least name, phone, or email is required' })
  sendLeadEmail({ name, phone, email, message, source: 'quiz', quiz_answers: answers })
  try {
    await db.query(
      'INSERT INTO leads (name, phone, email, message, source, quiz_answers) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, phone || null, email || null, message || null, 'quiz', answers ? JSON.stringify(answers) : null]
    )
  } catch {
    try {
      await db.query(
        'INSERT INTO leads (name, phone, email, message, source) VALUES (?, ?, ?, ?, ?)',
        [name || null, phone || null, email || null, message || null, 'quiz']
      )
    } catch { /* ignore */ }
  }
  res.json({ success: true, message: 'Quiz submitted successfully. We will be in touch soon!' })
})

// ── GET /api/health.php ───────────────────────────────────────────
app.get('/api/health.php', async (_req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ success: true, message: 'API is working', db: 'connected', time: new Date().toISOString() })
  } catch (err) {
    res.json({ success: false, message: 'API is working', db: 'error: ' + err.message })
  }
})

// ── Static files + SPA fallback ───────────────────────────────────
app.use('/uploads', express.static(join(__dirname, 'uploads')))
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

// ── Start ─────────────────────────────────────────────────────────
// Start serving immediately; retry DB init until it succeeds.
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`))

async function initDbWithRetry(delayMs = 10000) {
  try {
    await initDb()
  } catch (err) {
    console.error('DB init failed, retrying in', delayMs / 1000, 's:', err.message)
    setTimeout(() => initDbWithRetry(delayMs), delayMs)
  }
}
initDbWithRetry()
