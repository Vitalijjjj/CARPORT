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
  {
    id: 2, brand: 'Mercedes-Benz', model: 'EQS', version: '450+ AMG Line',
    year: 2022, price: 89990, mileage: 18500,
    fuel_type: 'electric', transmission: 'automatic', power: 333,
    battery_capacity: 107.8, battery_health: 97, electric_range: 784,
    drive_type: 'RWD', exterior_color: 'Obsidian Black', interior_color: 'Neva Grey',
    location: 'Porto, Portugal', status: 'reserved',
    warranty_available: true, warranty_term: '24 months',
    financing_available: true, trade_in_available: true,
    service_history_available: true, delivery_available_portugal: true,
    short_description: 'Ultra-luxury Mercedes-Benz EQS 450+ with MBUX Hyperscreen and massaging seats.',
    full_description: '', equipment: '', features: ['MBUX Hyperscreen', 'Massaging seats', 'Burmester 3D'],
    gallery: [], main_image: '',
    meta_title: '', meta_description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 3, brand: 'BMW', model: 'iX3', version: 'M Sport',
    year: 2024, price: 61500, mileage: 4200,
    fuel_type: 'electric', transmission: 'automatic', power: 286,
    battery_capacity: 80, battery_health: 99, electric_range: 461,
    drive_type: 'RWD', exterior_color: 'Phytonic Blue', interior_color: 'Oyster',
    location: 'Lisbon, Portugal', status: 'available',
    warranty_available: false, warranty_term: '',
    financing_available: true, trade_in_available: false,
    service_history_available: true, delivery_available_portugal: true,
    short_description: 'Nearly new BMW iX3 M Sport — demonstrator with 4,200 km, full warranty.',
    full_description: '', equipment: '', features: ['Parking Assistant', 'Adaptive LED'],
    gallery: [], main_image: '',
    meta_title: '', meta_description: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
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

// ── Image upload ───────────────────────────────────────────────────

export async function apiUploadImage(file) {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 600))
    // Return a local blob URL for preview during mock testing
    const url = URL.createObjectURL(file)
    return { url, filename: file.name }
  }

  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE}/upload.php`, {
    method:  'POST',
    headers: getAuthHeaders(true),
    body:    formData,
  })
  return handleResponse(res)
}
