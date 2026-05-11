/**
 * Public (unauthenticated) API for car listings.
 *
 * Mock mode (VITE_MOCK_ADMIN=true): returns OLIMP_CARS from cars-data.js
 * Production: fetches from /api/public_cars.php
 */

import { OLIMP_CARS } from './cars-data'

const IS_MOCK  = import.meta.env.VITE_MOCK_PUBLIC === 'true'
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

function normalizeBrand(brand) {
  const s = (brand ?? '').toLowerCase()
  if (s.includes('mercedes')) return 'mercedes'
  if (s.includes('bmw'))      return 'bmw'
  return s
}

const STATUS_MAP = { available: 'in_stock', reserved: 'reserved' }

function normalizeCar(raw) {
  return {
    id:          String(raw.id),
    brand:       normalizeBrand(raw.brand),
    name:        [raw.brand, raw.model, raw.version].filter(Boolean).join(' '),
    tagline:     raw.short_description ?? '',
    description: raw.full_description  || raw.short_description || '',
    year:        raw.year,
    price:       raw.price,
    priceUnit:   'unit',
    mileageNum:  raw.mileage ?? 0,
    mileage:     raw.mileage ? `${Number(raw.mileage).toLocaleString('de-DE')} km` : '',
    fuelType:    raw.fuel_type ?? 'electric',
    hp:          raw.power ? `${raw.power} HP` : '',
    engine:      raw.fuel_type === 'electric' ? 'Electric' : raw.fuel_type === 'hybrid' ? 'Hybrid' : '',
    drivetrain:  raw.drive_type ?? '',
    topSpeed:    '',
    seats:       5,
    gearbox:     raw.transmission === 'automatic' ? 'Automatic' : 'Manual',
    luggage:     '',
    financing:   !!raw.financing_available,
    warranty:    !!raw.warranty_available,
    status:      STATUS_MAP[raw.status] ?? raw.status,
    img:         raw.main_image ?? '',
    gallery:     Array.isArray(raw.gallery)  ? raw.gallery  : [],
    features:    Array.isArray(raw.features) ? raw.features : [],
    range:               raw.electric_range ? `${raw.electric_range} km` : '',
    equipment:           Array.isArray(raw.equipment)    ? raw.equipment    : [],
    equipment_en:        Array.isArray(raw.equipment_en) ? raw.equipment_en : [],
    equipment_uk:        Array.isArray(raw.equipment_uk) ? raw.equipment_uk : [],
    full_description_en: raw.full_description_en ?? '',
    full_description_uk: raw.full_description_uk ?? '',
    youtube_url:         raw.youtube_url ?? '',
  }
}

export async function fetchPublicCars() {
  if (IS_MOCK) return [...OLIMP_CARS]
  const res = await fetch(`${API_BASE}/public_cars.php`)
  if (!res.ok) throw new Error('Failed to load cars')
  return (await res.json()).map(normalizeCar)
}

export async function fetchPublicCar(id) {
  if (IS_MOCK) {
    const car = OLIMP_CARS.find(c => c.id === id)
    if (!car) throw new Error('Car not found')
    return { ...car }
  }
  const res = await fetch(`${API_BASE}/public_cars.php?id=${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Car not found')
  return normalizeCar(await res.json())
}
