/**
 * TURBOEAGLE Admin API client
 *
 * Mock mode: set VITE_MOCK_ADMIN=true in .env.local to run without a PHP backend.
 *   Login: test@test.com / test123
 *
 * Production: set VITE_API_URL if the API lives on a different domain,
 * otherwise '/api' resolves to public_html/api/ on Hostinger.
 */

const IS_MOCK  = import.meta.env.VITE_MOCK_ADMIN === 'true'
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

// ── Mock helpers ───────────────────────────────────────────────────

function makeMockToken() {
  const payload = btoa(JSON.stringify({
    uid: 1,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  }))
  return `${payload}.mock-dev-only`
}

const MOCK_USER = { id: 1, email: 'test@test.com', name: 'Test Admin' }

let mockCars = [
  {
    id: 1, brand: 'BMW', model: 'i4', version: 'eDrive40 M Sport',
    year: 2023, price: 54990, mileage: 32000,
    fuel_type: 'electric', transmission: 'automatic', power: 340,
    battery_capacity: 83.9, battery_health: 94, electric_range: 521,
    drive_type: 'RWD', exterior_color: 'Mineral White', interior_color: 'Black Sensatec',
    location: 'Lisbon, Portugal', status: 'available',
    warranty_available: true, warranty_term: '12 months',
    financing_available: true, trade_in_available: false,
    service_history_available: true, delivery_available_portugal: true,
    short_description: 'Pristine BMW i4 eDrive40 M Sport with full dealer history and panoramic roof.',
    full_description: '', equipment: '', features: ['Apple CarPlay', 'Heated seats', 'Panoramic roof'],
    gallery: [], main_image: '',
    meta_title: 'BMW i4 eDrive40 M Sport 2023 – TurboEagle',
    meta_description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

let mockNextId = mockCars.length + 1

// ── Real API helpers ───────────────────────────────────────────────

function getAuthHeaders(isMultipart = false) {
  const token   = localStorage.getItem('admin_token')
  const headers = {}
  if (!isMultipart) headers['Content-Type'] = 'application/json'
  if (token)        headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handleResponse(res) {
  const text = await res.text()
  let data
  try   { data = JSON.parse(text) }
  catch { data = { error: text || `HTTP ${res.status}` } }
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`)
  return data
}

// ── Auth ───────────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    if (email === 'test@test.com' && password === 'test123') {
      return { token: makeMockToken(), admin: MOCK_USER }
    }
    throw new Error('Invalid email or password')
  }

  const res = await fetch(`${API_BASE}/auth.php`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  })
  return handleResponse(res)
}

export async function apiLogout() {
  if (IS_MOCK) return { ok: true }

  const res = await fetch(`${API_BASE}/auth.php`, {
    method:  'DELETE',
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

// ── Cars ───────────────────────────────────────────────────────────

export async function apiGetCars() {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return [...mockCars]
  }

  const res = await fetch(`${API_BASE}/cars.php`, { headers: getAuthHeaders() })
  return handleResponse(res)
}

export async function apiGetCar(id) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const car = mockCars.find(c => c.id === Number(id))
    if (!car) throw new Error('Car not found')
    return { ...car }
  }

  const res = await fetch(`${API_BASE}/cars.php?id=${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

export async function apiCreateCar(data) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const newCar = { ...data, id: mockNextId++, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    mockCars.unshift(newCar)
    return { id: newCar.id, ok: true }
  }

  const res = await fetch(`${API_BASE}/cars.php`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function apiUpdateCar(id, data) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    mockCars = mockCars.map(c => c.id === Number(id) ? { ...c, ...data, updated_at: new Date().toISOString() } : c)
    return { ok: true }
  }

  const res = await fetch(`${API_BASE}/cars.php?id=${encodeURIComponent(id)}`, {
    method:  'PUT',
    headers: getAuthHeaders(),
    body:    JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function apiUpdateCarStatus(id, status) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    mockCars = mockCars.map(c => c.id === Number(id) ? { ...c, status } : c)
    return { ok: true }
  }

  const res = await fetch(`${API_BASE}/cars.php?id=${encodeURIComponent(id)}`, {
    method:  'PATCH',
    headers: getAuthHeaders(),
    body:    JSON.stringify({ status }),
  })
  return handleResponse(res)
}

export async function apiDeleteCar(id) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    mockCars = mockCars.filter(c => c.id !== Number(id))
    return { ok: true }
  }

  const res = await fetch(`${API_BASE}/cars.php?id=${encodeURIComponent(id)}`, {
    method:  'DELETE',
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

// ── Reviews ─────────────────────────────────────────────────────────

let mockReviews = [
  {
    id: 1, name: 'R. & A. M.', location: 'Lisboa, Portugal', title: 'Mercedes-Benz delivered in Lisbon',
    quote: 'We were very happy with the whole process.', rating: 5, image: '', badge: 'Mercedes-Benz · Lisboa',
    lang: 'all', status: 'visible', sort_order: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]
let mockNextReviewId = mockReviews.length + 1

export async function apiGetReviews() {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return [...mockReviews]
  }
  const res = await fetch(`${API_BASE}/reviews.php`, { headers: getAuthHeaders() })
  return handleResponse(res)
}

export async function apiCreateReview(data) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const review = { ...data, id: mockNextReviewId++, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    mockReviews.push(review)
    return { id: review.id, ok: true }
  }
  const res = await fetch(`${API_BASE}/reviews.php`, {
    method:  'POST',
    headers: getAuthHeaders(),
    body:    JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function apiUpdateReview(id, data) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 350))
    mockReviews = mockReviews.map(r => r.id === Number(id) ? { ...r, ...data, updated_at: new Date().toISOString() } : r)
    return { ok: true }
  }
  const res = await fetch(`${API_BASE}/reviews.php?id=${encodeURIComponent(id)}`, {
    method:  'PUT',
    headers: getAuthHeaders(),
    body:    JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function apiDeleteReview(id) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    mockReviews = mockReviews.filter(r => r.id !== Number(id))
    return { ok: true }
  }
  const res = await fetch(`${API_BASE}/reviews.php?id=${encodeURIComponent(id)}`, {
    method:  'DELETE',
    headers: getAuthHeaders(),
  })
  return handleResponse(res)
}

// ── Image upload ───────────────────────────────────────────────────

// Default compression for stored photos — smaller = faster catalog/hero load
const IMG_MAX_W   = 1280
const IMG_QUALITY = 0.72

// Resize/compress any image src (object URL or data URL) to a JPEG data URL
function compressImageSrc(src, { maxW = IMG_MAX_W, quality = IMG_QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export async function apiUploadImage(file) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const url = URL.createObjectURL(file)
    return { url, filename: file.name }
  }

  // Resize client-side and return as base64 data URL — no filesystem dependency
  const objectUrl = URL.createObjectURL(file)
  try {
    const url = await compressImageSrc(objectUrl)
    return { url, filename: file.name }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

// Re-compress an already-stored base64 image (used by the "optimize photos" tool).
// Non-base64 values (e.g. /uploads/... or /assets/... URLs) are returned unchanged.
export async function apiRecompressDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return dataUrl
  try { return await compressImageSrc(dataUrl) }
  catch { return dataUrl }
}
