import express from 'express'
import mysql from 'mysql2/promise'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, renameSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }))
app.use(express.json({ limit: '13mb' }))
app.use(express.urlencoded({ extended: true, limit: '13mb' }))

// ── Database pool ─────────────────────────────────────────────────
// On Hostinger, 127.0.0.1 uses TCP but MySQL only allows Unix socket (localhost)
const rawHost = process.env.DATABASE_HOST || 'localhost'
const dbHost  = rawHost === '127.0.0.1' ? 'localhost' : rawHost

const db = mysql.createPool({
  host:               dbHost,
  database:           process.env.DATABASE_NAME,
  user:               process.env.DATABASE_USER,
  password:           process.env.DATABASE_PASSWORD,
  waitForConnections: true,
  connectionLimit:    10,
})

// ── Auto-init: create tables + first admin on first boot ──────────
async function initDb() {
  console.log('Initializing database…')
  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      email         VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name          VARCHAR(100) NOT NULL DEFAULT 'Admin',
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY admins_email_unique (email)
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
      main_image                  VARCHAR(500) DEFAULT NULL,
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

  // Create first admin if none exist
  const [existing] = await db.query('SELECT id FROM admins LIMIT 1')
  if (existing.length === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@carrai.com'
    const pass  = process.env.ADMIN_PASS  || 'Admin123!'
    const hash  = await bcrypt.hash(pass, 12)
    await db.query('INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)', [email, hash, 'Admin'])
    console.log(`✓ Admin created: ${email}`)
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

function decodeCar(row) {
  return { ...row, price: Number(row.price), features: parseJson(row.features, []), gallery: parseJson(row.gallery, []) }
}

function carFields(body) {
  const bool = k => (body[k] ? 1 : 0)
  return {
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
    full_description:            body.full_description         || null,
    equipment:                   body.equipment                || null,
    features:                    body.features  ? JSON.stringify(body.features)  : null,
    gallery:                     body.gallery   ? JSON.stringify(body.gallery)   : null,
    main_image:                  body.main_image               || null,
    meta_title:                  body.meta_title               || null,
    meta_description:            body.meta_description         || null,
    updated_at:                  new Date(),
  }
}

// ── POST /api/auth.php — login ────────────────────────────────────
app.post('/api/auth.php', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email])
    const admin = rows[0]
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = makeToken({ uid: admin.id, email: admin.email })
    res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name } })
  } catch (err) { res.status(500).json({ error: err.message }) }
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
    const [rows] = await db.query("SELECT * FROM cars WHERE status NOT IN ('hidden','sold') ORDER BY created_at DESC")
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
      ? 'SELECT * FROM cars ORDER BY created_at DESC'
      : "SELECT * FROM cars WHERE status NOT IN ('hidden','sold') ORDER BY created_at DESC"
    const [rows] = await db.query(sql)
    res.json(rows.map(decodeCar))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const [result] = await db.query('INSERT INTO cars SET ?', [carFields(req.body)])
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
  res.json({ success: true, message: 'Thank you! We will contact you soon.' })
})

// ── POST /api/quiz.php ────────────────────────────────────────────
app.post('/api/quiz.php', async (req, res) => {
  const { name, phone, email, message, answers } = req.body
  if (!name && !phone && !email) return res.status(400).json({ error: 'At least name, phone, or email is required' })
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
initDb()
  .then(() => app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`)))
  .catch(err => { console.error('Fatal: DB init failed:', err.message); process.exit(1) })
