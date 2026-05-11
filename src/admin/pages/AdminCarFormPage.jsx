import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiGetCar, apiCreateCar, apiUpdateCar, apiUploadImage } from '../adminApi'

/* ── Option lists ──────────────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear()

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available — visible in catalog' },
  { value: 'reserved',  label: 'Reserved — still visible, marked reserved' },
  { value: 'sold',      label: 'Sold — still visible, marked sold' },
  { value: 'hidden',    label: 'Hidden — not visible to visitors' },
]

const FUEL_OPTIONS = [
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid',   label: 'Hybrid (PHEV / MHEV)' },
  { value: 'petrol',   label: 'Petrol' },
  { value: 'diesel',   label: 'Diesel' },
]

const TRANSMISSION_OPTIONS = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual',    label: 'Manual' },
]

const DRIVE_TYPE_OPTIONS = [
  { value: 'AWD', label: 'AWD — All-Wheel Drive' },
  { value: 'RWD', label: 'RWD — Rear-Wheel Drive' },
  { value: 'FWD', label: 'FWD — Front-Wheel Drive' },
  { value: '4WD', label: '4WD — Four-Wheel Drive' },
]

/* ── Empty form defaults ───────────────────────────────────────────── */
const EMPTY_FORM = {
  brand:                       '',
  model:                       '',
  version:                     '',
  year:                        String(CURRENT_YEAR),
  price:                       '',
  mileage:                     '',
  fuel_type:                   'electric',
  transmission:                'automatic',
  power:                       '',
  battery_capacity:            '',
  battery_health:              '',
  electric_range:              '',
  drive_type:                  'AWD',
  exterior_color:              '',
  interior_color:              '',
  location:                    'Portugal',
  status:                      'available',
  warranty_available:          false,
  warranty_term:               '',
  financing_available:         false,
  trade_in_available:          false,
  service_history_available:   false,
  delivery_available_portugal: false,
  short_description:           '',
  short_description_en:        '',
  short_description_uk:        '',
  full_description:            '',
  full_description_en:         '',
  full_description_uk:         '',
  equipment:                   '',
  equipment_en:                '',
  equipment_uk:                '',
  features:                    [],
  gallery:                     [],
  main_image:                  '',
  youtube_url:                 '',
  meta_title:                  '',
  meta_description:            '',
}

/* ── Client-side validation ─────────────────────────────────────────── */
function validate(form) {
  const errors = {}

  if (!form.brand.trim()) {
    errors.brand = 'Brand is required'
  }

  if (!form.model.trim()) {
    errors.model = 'Model is required'
  }

  const year = parseInt(form.year)
  if (!year || year < 1980 || year > CURRENT_YEAR + 1) {
    errors.year = `Enter a valid year between 1980 and ${CURRENT_YEAR + 1}`
  }

  const price = parseFloat(form.price)
  if (!form.price || isNaN(price) || price <= 0) {
    errors.price = 'Enter a valid price greater than 0'
  }

  const mileage = parseInt(form.mileage)
  if (form.mileage === '' || isNaN(mileage) || mileage < 0) {
    errors.mileage = 'Enter valid mileage — 0 or more km'
  }

  if (!form.fuel_type) {
    errors.fuel_type = 'Select a fuel type'
  }

  if (!form.transmission) {
    errors.transmission = 'Select a transmission'
  }

  if (!form.status) {
    errors.status = 'Select a status'
  }

  if (!form.short_description.trim()) {
    errors.short_description = 'Short description is required'
  } else if (form.short_description.trim().length > 250) {
    errors.short_description = 'Short description must be 250 characters or less'
  }

  if (form.power !== '') {
    const p = parseInt(form.power)
    if (isNaN(p) || p <= 0) {
      errors.power = 'Power must be a positive number'
    }
  }

  const isEV = form.fuel_type === 'electric' || form.fuel_type === 'hybrid'

  if (isEV && form.battery_capacity !== '') {
    const bc = parseFloat(form.battery_capacity)
    if (isNaN(bc) || bc <= 0) {
      errors.battery_capacity = 'Battery capacity must be greater than 0'
    }
  }

  if (isEV && form.battery_health !== '') {
    const bh = parseInt(form.battery_health)
    if (isNaN(bh) || bh < 0 || bh > 100) {
      errors.battery_health = 'Battery health must be between 0 and 100'
    }
  }

  if (isEV && form.electric_range !== '') {
    const er = parseInt(form.electric_range)
    if (isNaN(er) || er <= 0) {
      errors.electric_range = 'Electric range must be greater than 0'
    }
  }

  if (form.meta_title && form.meta_title.length > 60) {
    errors.meta_title = 'Meta title must be 60 characters or less'
  }

  if (form.meta_description && form.meta_description.length > 160) {
    errors.meta_description = 'Meta description must be 160 characters or less'
  }

  return errors
}

/* ── UI sub-components ───────────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="af-section">
      <h2 className="af-section-title">{title}</h2>
      <div className="af-section-body">{children}</div>
    </div>
  )
}

function Field({ label, required = false, error, hint, children, span = 1 }) {
  return (
    <div className={`af-field af-span-${span}`}>
      <label className="af-label">
        {label}
        {required && <span className="af-required"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="af-hint">{hint}</span>}
      {error && <span className="af-error-msg" role="alert">{error}</span>}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="af-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={`af-toggle-track${checked ? ' on' : ''}`}>
        <span className="af-toggle-thumb" />
      </span>
      <span className="af-toggle-label">{label}</span>
    </label>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function AdminCarFormPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = Boolean(id)
  const fileRef   = useRef(null)

  const [form,         setForm]         = useState(EMPTY_FORM)
  const [errors,       setErrors]       = useState({})
  const [loading,      setLoading]      = useState(isEdit)
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [featureInput, setFeatureInput] = useState('')
  const [toast,        setToast]        = useState(null)
  const [contentLang,  setContentLang]  = useState('pt')

  // ── Load existing car when editing ──────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    apiGetCar(id)
      .then(car => {
        setForm({
          ...EMPTY_FORM,
          ...car,
          year:             String(car.year ?? CURRENT_YEAR),
          price:            car.price      != null ? String(car.price)            : '',
          mileage:          car.mileage    != null ? String(car.mileage)          : '',
          power:            car.power      != null ? String(car.power)            : '',
          battery_capacity: car.battery_capacity != null ? String(car.battery_capacity) : '',
          battery_health:   car.battery_health   != null ? String(car.battery_health)   : '',
          electric_range:   car.electric_range   != null ? String(car.electric_range)   : '',
          equipment:        Array.isArray(car.equipment) ? car.equipment.join('\n') : (car.equipment ?? ''),
          features:         Array.isArray(car.features) ? car.features : [],
          gallery:          Array.isArray(car.gallery)  ? car.gallery  : [],
          main_image:            car.main_image         ?? '',
          warranty_term:         car.warranty_term      ?? '',
          meta_title:            car.meta_title         ?? '',
          meta_description:      car.meta_description   ?? '',
          short_description_en:  car.short_description_en ?? '',
          short_description_uk:  car.short_description_uk ?? '',
          full_description_en:   car.full_description_en  ?? '',
          full_description_uk:   car.full_description_uk  ?? '',
          equipment_en:          Array.isArray(car.equipment_en) ? car.equipment_en.join('\n') : (car.equipment_en ?? ''),
          equipment_uk:          Array.isArray(car.equipment_uk) ? car.equipment_uk.join('\n') : (car.equipment_uk ?? ''),
        })
        setLoading(false)
      })
      .catch(() => navigate('/admin/cars'))
  }, [id, isEdit, navigate])

  // ── Toast helper ────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Field updater from DOM events ────────────────────────────────
  function set(field) {
    return e => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm(f => ({ ...f, [field]: value }))
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  // ── Field updater for direct values ─────────────────────────────
  function setVal(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  // ── Form submit ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        year:             parseInt(form.year),
        price:            parseFloat(form.price),
        mileage:          parseInt(form.mileage),
        power:            form.power            !== '' ? parseInt(form.power)                : null,
        battery_capacity: form.battery_capacity !== '' ? parseFloat(form.battery_capacity)  : null,
        battery_health:   form.battery_health   !== '' ? parseInt(form.battery_health)      : null,
        electric_range:   form.electric_range   !== '' ? parseInt(form.electric_range)      : null,
      }

      if (isEdit) {
        await apiUpdateCar(id, payload)
        showToast('Car saved successfully')
      } else {
        const { id: newId } = await apiCreateCar(payload)
        navigate(`/admin/cars/${newId}/edit`)
      }
    } catch (err) {
      showToast(err.message || 'Failed to save car', 'error')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    setSaving(false)
  }

  // ── Image upload ─────────────────────────────────────────────────
  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)

    for (const file of files) {
      try {
        const { url } = await apiUploadImage(file)
        setForm(f => ({
          ...f,
          gallery:    [...f.gallery, url],
          main_image: f.main_image || url, // first upload becomes main image
        }))
      } catch (err) {
        showToast(`Upload failed: ${err.message}`, 'error')
      }
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function setMainImage(url) {
    setVal('main_image', url)
  }

  function removeGalleryImage(url) {
    setForm(f => ({
      ...f,
      gallery:    f.gallery.filter(u => u !== url),
      main_image: f.main_image === url
        ? (f.gallery.find(u => u !== url) ?? '')
        : f.main_image,
    }))
  }

  // ── Feature tags ─────────────────────────────────────────────────
  function addFeature() {
    const val = featureInput.trim()
    if (!val || form.features.includes(val)) {
      setFeatureInput('')
      return
    }
    setVal('features', [...form.features, val])
    setFeatureInput('')
  }

  function removeFeature(index) {
    setVal('features', form.features.filter((_, i) => i !== index))
  }

  function handleFeatureKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addFeature() }
  }

  // ── Derived helpers ──────────────────────────────────────────────
  const isEV       = form.fuel_type === 'electric' || form.fuel_type === 'hybrid'
  const errorCount = Object.keys(errors).length

  // ── Loading screen ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-loading" style={{ paddingTop: 80 }}>
        <div className="admin-spinner" />
        <p>Loading car data…</p>
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="af-page">

      {/* Toast */}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`} role="alert">
          {toast.type === 'success'
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          }
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="af-header">
        <div className="af-header-left">
          <Link to="/admin/cars" className="af-back-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Cars
          </Link>
          <h1 className="af-title">{isEdit ? 'Edit Car' : 'Add New Car'}</h1>
        </div>
        <div className="af-header-actions">
          {errorCount > 0 && (
            <span className="af-error-count">
              ⚠ {errorCount} field{errorCount !== 1 ? 's' : ''} need attention
            </span>
          )}
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={() => navigate('/admin/cars')}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={handleSubmit}
            disabled={saving || uploading}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Car'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 1 — Basic Info
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Basic Info">
          <div className="af-grid af-grid-3">

            <Field label="Brand" required error={errors.brand}>
              <input
                list="brand-suggestions"
                className={`af-input${errors.brand ? ' af-input--error' : ''}`}
                value={form.brand}
                onChange={set('brand')}
                placeholder="e.g. BMW"
                autoComplete="off"
              />
              <datalist id="brand-suggestions">
                <option value="BMW" />
                <option value="Mercedes-Benz" />
                <option value="Audi" />
                <option value="Volvo" />
                <option value="Polestar" />
                <option value="Tesla" />
                <option value="Porsche" />
                <option value="Volkswagen" />
                <option value="Renault" />
              </datalist>
            </Field>

            <Field label="Model" required error={errors.model}>
              <input
                className={`af-input${errors.model ? ' af-input--error' : ''}`}
                value={form.model}
                onChange={set('model')}
                placeholder="e.g. i4"
              />
            </Field>

            <Field label="Version / Trim" error={errors.version}>
              <input
                className="af-input"
                value={form.version}
                onChange={set('version')}
                placeholder="e.g. eDrive40 M Sport"
              />
            </Field>

            <Field label="Year" required error={errors.year}>
              <input
                type="number"
                className={`af-input${errors.year ? ' af-input--error' : ''}`}
                value={form.year}
                onChange={set('year')}
                min="1980"
                max={CURRENT_YEAR + 1}
                placeholder={String(CURRENT_YEAR)}
              />
            </Field>

            <Field label="Status" required error={errors.status}>
              <select
                className={`af-input${errors.status ? ' af-input--error' : ''}`}
                value={form.status}
                onChange={set('status')}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Location" error={errors.location}>
              <input
                className="af-input"
                value={form.location}
                onChange={set('location')}
                placeholder="e.g. Lisbon, Portugal"
              />
            </Field>

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 2 — Pricing
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Pricing">
          <div className="af-grid af-grid-2">
            <Field label="Price (€)" required error={errors.price}>
              <input
                type="number"
                className={`af-input${errors.price ? ' af-input--error' : ''}`}
                value={form.price}
                onChange={set('price')}
                min="0"
                step="100"
                placeholder="e.g. 54990"
              />
            </Field>

            <Field label="Mileage (km)" required error={errors.mileage}>
              <input
                type="number"
                className={`af-input${errors.mileage ? ' af-input--error' : ''}`}
                value={form.mileage}
                onChange={set('mileage')}
                min="0"
                placeholder="e.g. 32000"
              />
            </Field>
          </div>

          <div className="af-toggles-row">
            <Toggle
              label="Financing available"
              checked={form.financing_available}
              onChange={v => setVal('financing_available', v)}
            />
            <Toggle
              label="Trade-in accepted"
              checked={form.trade_in_available}
              onChange={v => setVal('trade_in_available', v)}
            />
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 3 — Technical Specifications
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Technical Specifications">
          <div className="af-grid af-grid-3">

            <Field label="Fuel Type" required error={errors.fuel_type}>
              <select
                className={`af-input${errors.fuel_type ? ' af-input--error' : ''}`}
                value={form.fuel_type}
                onChange={set('fuel_type')}
              >
                {FUEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Transmission" required error={errors.transmission}>
              <select
                className={`af-input${errors.transmission ? ' af-input--error' : ''}`}
                value={form.transmission}
                onChange={set('transmission')}
              >
                {TRANSMISSION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Power (hp)" error={errors.power}>
              <input
                type="number"
                className={`af-input${errors.power ? ' af-input--error' : ''}`}
                value={form.power}
                onChange={set('power')}
                min="0"
                placeholder="e.g. 286"
              />
            </Field>

            <Field label="Drive Type" error={errors.drive_type}>
              <select
                className="af-input"
                value={form.drive_type}
                onChange={set('drive_type')}
              >
                {DRIVE_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* Battery fields — only relevant for EV and hybrid */}
            {isEV && (
              <>
                <Field
                  label="Battery Capacity (kWh)"
                  error={errors.battery_capacity}
                >
                  <input
                    type="number"
                    className={`af-input${errors.battery_capacity ? ' af-input--error' : ''}`}
                    value={form.battery_capacity}
                    onChange={set('battery_capacity')}
                    min="0"
                    step="0.1"
                    placeholder="e.g. 83.9"
                  />
                </Field>

                <Field
                  label="Battery Health (%)"
                  error={errors.battery_health}
                  hint="0 – 100"
                >
                  <input
                    type="number"
                    className={`af-input${errors.battery_health ? ' af-input--error' : ''}`}
                    value={form.battery_health}
                    onChange={set('battery_health')}
                    min="0"
                    max="100"
                    placeholder="e.g. 94"
                  />
                </Field>

                <Field
                  label="Electric Range (km WLTP)"
                  error={errors.electric_range}
                >
                  <input
                    type="number"
                    className={`af-input${errors.electric_range ? ' af-input--error' : ''}`}
                    value={form.electric_range}
                    onChange={set('electric_range')}
                    min="0"
                    placeholder="e.g. 521"
                  />
                </Field>
              </>
            )}

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 4 — Appearance
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Appearance">
          <div className="af-grid af-grid-2">
            <Field label="Exterior Color" error={errors.exterior_color}>
              <input
                className="af-input"
                value={form.exterior_color}
                onChange={set('exterior_color')}
                placeholder="e.g. Mineral White Metallic"
              />
            </Field>

            <Field label="Interior Color" error={errors.interior_color}>
              <input
                className="af-input"
                value={form.interior_color}
                onChange={set('interior_color')}
                placeholder="e.g. Black Sensatec"
              />
            </Field>
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 5 — Options & Services
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Options &amp; Services">
          <div className="af-options-grid">
            <Toggle
              label="Warranty available"
              checked={form.warranty_available}
              onChange={v => setVal('warranty_available', v)}
            />
            <Toggle
              label="Service history available"
              checked={form.service_history_available}
              onChange={v => setVal('service_history_available', v)}
            />
            <Toggle
              label="Delivery across Portugal"
              checked={form.delivery_available_portugal}
              onChange={v => setVal('delivery_available_portugal', v)}
            />
          </div>

          {form.warranty_available && (
            <div className="af-grid af-grid-2" style={{ marginTop: 20 }}>
              <Field
                label="Warranty Term"
                error={errors.warranty_term}
                hint="e.g. 12 months, 2 years"
              >
                <input
                  className="af-input"
                  value={form.warranty_term}
                  onChange={set('warranty_term')}
                  placeholder="e.g. 24 months"
                />
              </Field>
            </div>
          )}
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 6 — Descriptions
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Descriptions">
          <div className="af-lang-tabs">
            {['pt', 'en', 'uk'].map(l => (
              <button key={l} type="button" className={`af-lang-tab${contentLang === l ? ' active' : ''}`} onClick={() => setContentLang(l)}>
                {l === 'pt' ? 'PT (main)' : l === 'en' ? 'EN' : 'UA'}
              </button>
            ))}
          </div>
          <div className="af-grid af-grid-1">

            {contentLang === 'pt' && (
              <>
                <Field
                  label="Short Description"
                  required
                  error={errors.short_description}
                  hint={`${form.short_description.length}/250 characters — shown in catalog cards and previews`}
                >
                  <textarea
                    className={`af-input af-textarea${errors.short_description ? ' af-input--error' : ''}`}
                    value={form.short_description}
                    onChange={set('short_description')}
                    maxLength={250}
                    rows={3}
                    placeholder="Brief summary shown in listing cards and search previews…"
                  />
                </Field>
                <Field
                  label="Full Description"
                  error={errors.full_description}
                  hint="Displayed on the car detail page — supports plain text"
                >
                  <textarea
                    className="af-input af-textarea af-textarea--tall"
                    value={form.full_description}
                    onChange={set('full_description')}
                    rows={8}
                    placeholder="Full car description with all relevant details, history and highlights…"
                  />
                </Field>
              </>
            )}

            {contentLang === 'en' && (
              <>
                <Field
                  label="Short Description (English)"
                  error={errors.short_description_en}
                  hint={`${form.short_description_en.length}/250 characters`}
                >
                  <textarea
                    className="af-input af-textarea"
                    value={form.short_description_en}
                    onChange={set('short_description_en')}
                    maxLength={250}
                    rows={3}
                    placeholder="English version of the short description…"
                  />
                </Field>
                <Field
                  label="Full Description (English)"
                  error={errors.full_description_en}
                  hint="Displayed when site language is set to English"
                >
                  <textarea
                    className="af-input af-textarea af-textarea--tall"
                    value={form.full_description_en}
                    onChange={set('full_description_en')}
                    rows={8}
                    placeholder="English version of the full description…"
                  />
                </Field>
              </>
            )}

            {contentLang === 'uk' && (
              <>
                <Field
                  label="Short Description (Ukrainian)"
                  error={errors.short_description_uk}
                  hint={`${form.short_description_uk.length}/250 characters`}
                >
                  <textarea
                    className="af-input af-textarea"
                    value={form.short_description_uk}
                    onChange={set('short_description_uk')}
                    maxLength={250}
                    rows={3}
                    placeholder="Ukrainian version of the short description…"
                  />
                </Field>
                <Field
                  label="Full Description (Ukrainian)"
                  error={errors.full_description_uk}
                  hint="Displayed when site language is set to Ukrainian"
                >
                  <textarea
                    className="af-input af-textarea af-textarea--tall"
                    value={form.full_description_uk}
                    onChange={set('full_description_uk')}
                    rows={8}
                    placeholder="Ukrainian version of the full description…"
                  />
                </Field>
              </>
            )}

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 7 — Equipment & Feature Tags
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Equipment &amp; Feature Tags">
          <div className="af-lang-tabs">
            {['pt', 'en', 'uk'].map(l => (
              <button key={l} type="button" className={`af-lang-tab${contentLang === l ? ' active' : ''}`} onClick={() => setContentLang(l)}>
                {l === 'pt' ? 'PT (main)' : l === 'en' ? 'EN' : 'UA'}
              </button>
            ))}
          </div>
          <div className="af-grid af-grid-1">

            {contentLang === 'pt' && (
              <Field
                label="Equipment List"
                hint="Full OEM equipment — one item per line"
              >
                <textarea
                  className="af-input af-textarea"
                  value={form.equipment}
                  onChange={set('equipment')}
                  rows={7}
                  placeholder={'Heated front and rear seats\nPanoramic glass roof\nWireless charging pad\nHarman Kardon surround sound\nHead-up display\nAdaptive cruise control with stop & go'}
                />
              </Field>
            )}

            {contentLang === 'en' && (
              <Field
                label="Equipment List (English)"
                hint="English translation of equipment — one item per line"
              >
                <textarea
                  className="af-input af-textarea"
                  value={form.equipment_en}
                  onChange={set('equipment_en')}
                  rows={7}
                  placeholder={'Heated front and rear seats\nPanoramic glass roof\nWireless charging pad\nHarman Kardon surround sound\nHead-up display\nAdaptive cruise control with stop & go'}
                />
              </Field>
            )}

            {contentLang === 'uk' && (
              <Field
                label="Equipment List (Ukrainian)"
                hint="Ukrainian translation of equipment — one item per line"
              >
                <textarea
                  className="af-input af-textarea"
                  value={form.equipment_uk}
                  onChange={set('equipment_uk')}
                  rows={7}
                  placeholder={'Підігрів передніх і задніх сидінь\nПанорамний скляний дах\nБездротова зарядка\nAharman Kardon об\'ємний звук\nHead-up дисплей\nАдаптивний круїз-контроль'}
                />
              </Field>
            )}

            <Field
              label="Feature Tags"
              hint="Short highlights shown as badges on the listing (press Enter or click Add)"
            >
              <div className="af-features-wrap">
                {form.features.map((feature, index) => (
                  <span key={index} className="af-feature-tag">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      aria-label={`Remove ${feature}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                ))}
                <div className="af-feature-add">
                  <input
                    className="af-input af-input--inline"
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={handleFeatureKeyDown}
                    placeholder="e.g. Apple CarPlay, 360° Camera…"
                  />
                  <button
                    type="button"
                    className="btn-admin-secondary btn-sm"
                    onClick={addFeature}
                  >
                    Add
                  </button>
                </div>
              </div>
            </Field>

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 8 — Gallery & Images
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="Gallery &amp; Images">

          <Field label="YouTube Video URL">
            <input
              className="af-input"
              type="url"
              placeholder="https://youtu.be/... або https://youtube.com/watch?v=..."
              value={form.youtube_url}
              onChange={set('youtube_url')}
            />
            {form.youtube_url && (() => {
              const m = form.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
              return m ? (
                <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 320 }}>
                  <img src={`https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`} alt="YouTube preview" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>Невалідне посилання YouTube</span>
            })()}
          </Field>

          <div className="af-gallery-upload-bar">
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><span className="admin-spinner-sm" /> Uploading…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Images
                </>
              )}
            </button>
            <span className="af-gallery-hint">
              {form.gallery.length > 0
                ? `${form.gallery.length} image${form.gallery.length !== 1 ? 's' : ''} — hover to set main or remove`
                : 'No images yet — JPEG, PNG or WebP, max 10 MB each'
              }
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          {form.gallery.length > 0 && (
            <div className="af-gallery-grid">
              {form.gallery.map(url => (
                <div
                  key={url}
                  className={`af-gallery-item${form.main_image === url ? ' af-gallery-item--main' : ''}`}
                >
                  <img src={url} alt="" loading="lazy" />
                  {form.main_image === url && (
                    <span className="af-gallery-main-badge">Main</span>
                  )}
                  <div className="af-gallery-overlay">
                    {form.main_image !== url && (
                      <button
                        type="button"
                        className="af-gallery-btn"
                        onClick={() => setMainImage(url)}
                      >
                        Set as Main
                      </button>
                    )}
                    <button
                      type="button"
                      className="af-gallery-btn af-gallery-btn--delete"
                      onClick={() => removeGalleryImage(url)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 9 — SEO
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title="SEO">
          <div className="af-grid af-grid-1">

            <Field
              label="Meta Title"
              error={errors.meta_title}
              hint={`${form.meta_title.length}/60 characters — shown in browser tab and Google results`}
            >
              <input
                className={`af-input${errors.meta_title ? ' af-input--error' : ''}`}
                value={form.meta_title}
                onChange={set('meta_title')}
                maxLength={80}
                placeholder="e.g. BMW i4 eDrive40 M Sport 2023 – TurboEagle"
              />
            </Field>

            <Field
              label="Meta Description"
              error={errors.meta_description}
              hint={`${form.meta_description.length}/160 characters — shown in Google search snippets`}
            >
              <textarea
                className={`af-input af-textarea${errors.meta_description ? ' af-input--error' : ''}`}
                value={form.meta_description}
                onChange={set('meta_description')}
                maxLength={200}
                rows={3}
                placeholder="e.g. Buy a BMW i4 eDrive40 M Sport 2023, 32,000 km, 286 hp. Full history, warranty available. Delivery across Portugal."
              />
            </Field>

          </div>
        </Section>

        {/* ── Sticky bottom save bar ──────────────────────────────── */}
        <div className="af-save-bar">
          <div className="af-save-bar-inner">
            {errorCount > 0 && (
              <span className="af-error-count">
                ⚠ {errorCount} field{errorCount !== 1 ? 's' : ''} need attention
              </span>
            )}
            <span className="af-save-bar-spacer" />
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={() => navigate('/admin/cars')}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-admin-primary"
              disabled={saving || uploading}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Car'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
