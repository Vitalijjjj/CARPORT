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

// ── Database ──────────────────────────────────────────────────────
const db = mysql.createPool({
  host:               process.env.DB_HOST || '127.0.0.1',
  database:           process.env.DB_NAME,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  waitForConnections: true,
  connectionLimit:    10,
})

// ── Auth helpers ──────────────────────────────────────────────────
const SECRET  = process.env.JWT_SECRET || 'change-before-deploy'
const TTL     = 86400 * 30

function makeToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TTL })
}

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

// DELETE /api/auth.php — logout (stateless: just acknowledge)
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

// ── GET /api/cars.php — admin car list ───────────────────────────
app.get('/api/cars.php', async (req, res) => {
  try {
    const auth  = readToken(req)
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

// POST /api/cars.php — create car
app.post('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const [result] = await db.query('INSERT INTO cars SET ?', [carFields(req.body)])
    res.json({ success: true, id: result.insertId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/cars.php?id= — update car
app.put('/api/cars.php', async (req, res) => {
  try {
    if (!requireAuth(req, res)) return
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id required' })
    await db.query('UPDATE cars SET ? WHERE id = ?', [carFields(req.body), id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/cars.php?id= — update status only
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

// DELETE /api/cars.php?id= — delete car
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

// ── POST /api/leads.php — contact form ───────────────────────────
app.post('/api/leads.php', async (req, res) => {
  const { name, phone, email, message, source, car_id } = req.body
  if (!name && !phone && !email) return res.status(400).json({ error: 'At least name, phone, or email is required' })
  try {
    await db.query(
      'INSERT INTO leads (name, phone, email, message, source, car_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, phone || null, email || null, message || null, source || 'form', car_id || null]
    )
  } catch { /* leads table may not exist yet — still return success */ }
  res.json({ success: true, message: 'Thank you! We will contact you soon.' })
})

// ── POST /api/quiz.php — quiz widget ─────────────────────────────
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
    } catch { /* leads table may not exist yet */ }
  }
  res.json({ success: true, message: 'Quiz submitted successfully. We will be in touch soon!' })
})

// ── GET /api/health.php ───────────────────────────────────────────
app.get('/api/health.php', async (_req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ success: true, message: 'API is working', db: 'connected', time: new Date().toISOString() })
  } catch (err) {
    res.json({ success: true, message: 'API is working', db: 'error: ' + err.message })
  }
})

// ── Static files ──────────────────────────────────────────────────
app.use('/uploads', express.static(join(__dirname, 'uploads')))
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
