import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiGetCar, apiCreateCar, apiUpdateCar, apiUploadImage } from '../adminApi'
import a from '../adminLang'

/* ── Option lists ──────────────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear()

const STATUS_OPTIONS = [
  { value: 'available', label: () => a.form.statusAvailable },
  { value: 'reserved',  label: () => a.form.statusReserved },
  { value: 'sold',      label: () => a.form.statusSold },
  { value: 'hidden',    label: () => a.form.statusHidden },
]

const FUEL_OPTIONS = [
  { value: 'electric', label: () => a.form.fuelElectric },
  { value: 'hybrid',   label: () => a.form.fuelHybrid },
  { value: 'petrol',   label: () => a.form.fuelPetrol },
  { value: 'diesel',   label: () => a.form.fuelDiesel },
]

const TRANSMISSION_OPTIONS = [
  { value: 'automatic', label: () => a.form.transAutomatic },
  { value: 'manual',    label: () => a.form.transManual },
]

const DRIVE_TYPE_OPTIONS = [
  { value: 'AWD', label: () => a.form.driveAWD },
  { value: 'RWD', label: () => a.form.driveRWD },
  { value: 'FWD', label: () => a.form.driveFWD },
  { value: '4WD', label: () => a.form.drive4WD },
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
    errors.brand = a.form.errBrand
  }

  if (!form.model.trim()) {
    errors.model = a.form.errModel
  }

  const year = parseInt(form.year)
  if (!year || year < 1980 || year > CURRENT_YEAR + 1) {
    errors.year = a.form.errYear(CURRENT_YEAR + 1)
  }

  const price = parseFloat(form.price)
  if (!form.price || isNaN(price) || price <= 0) {
    errors.price = a.form.errPrice
  }

  const mileage = parseInt(form.mileage)
  if (form.mileage === '' || isNaN(mileage) || mileage < 0) {
    errors.mileage = a.form.errMileage
  }

  if (!form.fuel_type) {
    errors.fuel_type = a.form.errFuel
  }

  if (!form.transmission) {
    errors.transmission = a.form.errTransmission
  }

  if (!form.status) {
    errors.status = a.form.errStatus
  }

  if (!form.short_description.trim()) {
    errors.short_description = a.form.errShortDesc
  } else if (form.short_description.trim().length > 250) {
    errors.short_description = a.form.errShortDescLen
  }

  if (form.power !== '') {
    const p = parseInt(form.power)
    if (isNaN(p) || p <= 0) {
      errors.power = a.form.errPower
    }
  }

  const isEV = form.fuel_type === 'electric' || form.fuel_type === 'hybrid'

  if (isEV && form.battery_capacity !== '') {
    const bc = parseFloat(form.battery_capacity)
    if (isNaN(bc) || bc <= 0) {
      errors.battery_capacity = a.form.errBattery
    }
  }

  if (isEV && form.battery_health !== '') {
    const bh = parseInt(form.battery_health)
    if (isNaN(bh) || bh < 0 || bh > 100) {
      errors.battery_health = a.form.errBatteryHealth
    }
  }

  if (isEV && form.electric_range !== '') {
    const er = parseInt(form.electric_range)
    if (isNaN(er) || er <= 0) {
      errors.electric_range = a.form.errRange
    }
  }

  if (form.meta_title && form.meta_title.length > 60) {
    errors.meta_title = a.form.errMetaTitle
  }

  if (form.meta_description && form.meta_description.length > 160) {
    errors.meta_description = a.form.errMetaDesc
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

  // Auto-fill meta_title for new cars when brand/model/year are set
  useEffect(() => {
    if (isEdit) return
    if (form.meta_title) return
    if (!form.brand && !form.model) return
    const parts = [form.brand, form.model, form.year].filter(Boolean)
    setForm(f => ({ ...f, meta_title: `${parts.join(' ')} – TURBOEAGLE`.slice(0, 60) }))
  }, [form.brand, form.model, form.year, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast helper ────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Field updater from DOM events ────────────────────────────────
  function generateMetaTitle() {
    const parts = [form.brand, form.model, form.year].filter(Boolean)
    if (!parts.length) return
    const title = `${parts.join(' ')} – TURBOEAGLE`.slice(0, 60)
    setVal('meta_title', title)
  }

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
        showToast(a.form.savedOk)
      } else {
        const { id: newId } = await apiCreateCar(payload)
        navigate(`/admin/cars/${newId}/edit`)
      }
    } catch (err) {
      showToast(err.message || a.form.saveFailed, 'error')
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
        showToast(a.form.uploadFailed(err.message), 'error')
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
        <p>{a.form.loading}</p>
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
            {a.form.backToCars}
          </Link>
          <h1 className="af-title">{isEdit ? a.form.titleEdit : a.form.titleAdd}</h1>
        </div>
        <div className="af-header-actions">
          {errorCount > 0 && (
            <span className="af-error-count">
              {a.form.errorCount(errorCount)}
            </span>
          )}
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={() => navigate('/admin/cars')}
            disabled={saving}
          >
            {a.form.cancel}
          </button>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={handleSubmit}
            disabled={saving || uploading}
          >
            {saving ? a.form.saving : isEdit ? a.form.save : a.form.create}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 1 — Basic Info
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sBasicInfo}>
          <div className="af-grid af-grid-3">

            <Field label={a.form.brand} required error={errors.brand}>
              <input
                list="brand-suggestions"
                className={`af-input${errors.brand ? ' af-input--error' : ''}`}
                value={form.brand}
                onChange={set('brand')}
                placeholder={a.form.brandPlaceholder}
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

            <Field label={a.form.model} required error={errors.model}>
              <input
                className={`af-input${errors.model ? ' af-input--error' : ''}`}
                value={form.model}
                onChange={set('model')}
                placeholder={a.form.modelPlaceholder}
              />
            </Field>

            <Field label={a.form.version} error={errors.version}>
              <input
                className="af-input"
                value={form.version}
                onChange={set('version')}
                placeholder={a.form.versionPlaceholder}
              />
            </Field>

            <Field label={a.form.year} required error={errors.year}>
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

            <Field label={a.form.status} required error={errors.status}>
              <select
                className={`af-input${errors.status ? ' af-input--error' : ''}`}
                value={form.status}
                onChange={set('status')}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label()}</option>
                ))}
              </select>
            </Field>

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 2 — Pricing
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sPricing}>
          <div className="af-grid af-grid-2">
            <Field label={a.form.price} required error={errors.price}>
              <input
                type="number"
                className={`af-input${errors.price ? ' af-input--error' : ''}`}
                value={form.price}
                onChange={set('price')}
                min="0"
                step="100"
                placeholder={a.form.pricePlaceholder}
              />
            </Field>

            <Field label={a.form.mileage} required error={errors.mileage}>
              <input
                type="number"
                className={`af-input${errors.mileage ? ' af-input--error' : ''}`}
                value={form.mileage}
                onChange={set('mileage')}
                min="0"
                placeholder={a.form.mileagePlaceholder}
              />
            </Field>
          </div>

        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 3 — Technical Specifications
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sTech}>
          <div className="af-grid af-grid-3">

            <Field label={a.form.fuelType} required error={errors.fuel_type}>
              <select
                className={`af-input${errors.fuel_type ? ' af-input--error' : ''}`}
                value={form.fuel_type}
                onChange={set('fuel_type')}
              >
                {FUEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label()}</option>
                ))}
              </select>
            </Field>

            <Field label={a.form.transmission} required error={errors.transmission}>
              <select
                className={`af-input${errors.transmission ? ' af-input--error' : ''}`}
                value={form.transmission}
                onChange={set('transmission')}
              >
                {TRANSMISSION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label()}</option>
                ))}
              </select>
            </Field>

            <Field label={a.form.power} error={errors.power}>
              <input
                type="number"
                className={`af-input${errors.power ? ' af-input--error' : ''}`}
                value={form.power}
                onChange={set('power')}
                min="0"
                placeholder={a.form.powerPlaceholder}
              />
            </Field>

            <Field label={a.form.drive} error={errors.drive_type}>
              <select
                className="af-input"
                value={form.drive_type}
                onChange={set('drive_type')}
              >
                {DRIVE_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label()}</option>
                ))}
              </select>
            </Field>

            {/* Battery fields — only relevant for EV and hybrid */}
            {isEV && (
              <>
                <Field
                  label={a.form.battery}
                  error={errors.battery_capacity}
                >
                  <input
                    type="number"
                    className={`af-input${errors.battery_capacity ? ' af-input--error' : ''}`}
                    value={form.battery_capacity}
                    onChange={set('battery_capacity')}
                    min="0"
                    step="0.1"
                    placeholder={a.form.batteryPlaceholder}
                  />
                </Field>

                <Field
                  label={a.form.batteryHealth}
                  error={errors.battery_health}
                  hint={a.form.batteryHealthHint}
                >
                  <input
                    type="number"
                    className={`af-input${errors.battery_health ? ' af-input--error' : ''}`}
                    value={form.battery_health}
                    onChange={set('battery_health')}
                    min="0"
                    max="100"
                    placeholder={a.form.batteryHealthPlaceholder}
                  />
                </Field>

                <Field
                  label={a.form.range}
                  error={errors.electric_range}
                >
                  <input
                    type="number"
                    className={`af-input${errors.electric_range ? ' af-input--error' : ''}`}
                    value={form.electric_range}
                    onChange={set('electric_range')}
                    min="0"
                    placeholder={a.form.rangePlaceholder}
                  />
                </Field>
              </>
            )}

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 4 — Appearance
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sAppearance}>
          <div className="af-grid af-grid-2">
            <Field label={a.form.exterior} error={errors.exterior_color}>
              <input
                className="af-input"
                value={form.exterior_color}
                onChange={set('exterior_color')}
                placeholder={a.form.exteriorPlaceholder}
              />
            </Field>

            <Field label={a.form.interior} error={errors.interior_color}>
              <input
                className="af-input"
                value={form.interior_color}
                onChange={set('interior_color')}
                placeholder={a.form.interiorPlaceholder}
              />
            </Field>
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 5 — Options & Services
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sOptions}>
          <div className="af-options-grid">
            <Toggle
              label={a.form.warranty}
              checked={form.warranty_available}
              onChange={v => setVal('warranty_available', v)}
            />
            <Toggle
              label={a.form.serviceHistory}
              checked={form.service_history_available}
              onChange={v => setVal('service_history_available', v)}
            />
            <Toggle
              label={a.form.delivery}
              checked={form.delivery_available_portugal}
              onChange={v => setVal('delivery_available_portugal', v)}
            />
          </div>

          {form.warranty_available && (
            <div className="af-grid af-grid-2" style={{ marginTop: 20 }}>
              <Field
                label={a.form.warrantyTerm}
                error={errors.warranty_term}
                hint={a.form.warrantyTermHint}
              >
                <input
                  className="af-input"
                  value={form.warranty_term}
                  onChange={set('warranty_term')}
                  placeholder={a.form.warrantyTermPlaceholder}
                />
              </Field>
            </div>
          )}
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 6 — Descriptions
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sDescriptions}>
          <div className="af-lang-tabs">
            {['pt', 'en', 'uk'].map(l => (
              <button key={l} type="button" className={`af-lang-tab${contentLang === l ? ' active' : ''}`} onClick={() => setContentLang(l)}>
                {l === 'pt' ? a.form.tabPT : l === 'en' ? a.form.tabEN : a.form.tabUA}
              </button>
            ))}
          </div>
          <div className="af-grid af-grid-1">

            {contentLang === 'pt' && (
              <>
                <Field
                  label={a.form.shortDesc}
                  required
                  error={errors.short_description}
                  hint={a.form.shortDescHint(form.short_description.length)}
                >
                  <textarea
                    className={`af-input af-textarea${errors.short_description ? ' af-input--error' : ''}`}
                    value={form.short_description}
                    onChange={set('short_description')}
                    maxLength={250}
                    rows={3}
                    placeholder={a.form.shortDescPlaceholder}
                  />
                </Field>
                <Field
                  label={a.form.fullDesc}
                  error={errors.full_description}
                  hint={a.form.fullDescHint}
                >
                  <textarea
                    className="af-input af-textarea af-textarea--tall"
                    value={form.full_description}
                    onChange={set('full_description')}
                    rows={8}
                    placeholder={a.form.fullDescPlaceholder}
                  />
                </Field>
              </>
            )}

            {contentLang === 'en' && (
              <>
                <Field
                  label={a.form.shortDescEN}
                  error={errors.short_description_en}
                  hint={a.form.shortDescENHint(form.short_description_en.length)}
                >
                  <textarea
                    className="af-input af-textarea"
                    value={form.short_description_en}
                    onChange={set('short_description_en')}
                    maxLength={250}
                    rows={3}
                    placeholder={a.form.shortDescENPlaceholder}
                  />
                </Field>
                <Field
                  label={a.form.fullDescEN}
                  error={errors.full_description_en}
                  hint={a.form.fullDescENHint}
                >
                  <textarea
                    className="af-input af-textarea af-textarea--tall"
                    value={form.full_description_en}
                    onChange={set('full_description_en')}
                    rows={8}
                    placeholder={a.form.fullDescENPlaceholder}
                  />
                </Field>
              </>
            )}

            {contentLang === 'uk' && (
              <>
                <Field
                  label={a.form.shortDescUA}
                  error={errors.short_description_uk}
                  hint={a.form.shortDescUAHint(form.short_description_uk.length)}
                >
                  <textarea
                    className="af-input af-textarea"
                    value={form.short_description_uk}
                    onChange={set('short_description_uk')}
                    maxLength={250}
                    rows={3}
                    placeholder={a.form.shortDescUAPlaceholder}
                  />
                </Field>
                <Field
                  label={a.form.fullDescUA}
                  error={errors.full_description_uk}
                  hint={a.form.fullDescUAHint}
                >
                  <textarea
                    className="af-input af-textarea af-textarea--tall"
                    value={form.full_description_uk}
                    onChange={set('full_description_uk')}
                    rows={8}
                    placeholder={a.form.fullDescUAPlaceholder}
                  />
                </Field>
              </>
            )}

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 7 — Equipment & Feature Tags
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sEquipment}>
          <div className="af-lang-tabs">
            {['pt', 'en', 'uk'].map(l => (
              <button key={l} type="button" className={`af-lang-tab${contentLang === l ? ' active' : ''}`} onClick={() => setContentLang(l)}>
                {l === 'pt' ? a.form.tabPT : l === 'en' ? a.form.tabEN : a.form.tabUA}
              </button>
            ))}
          </div>
          <div className="af-grid af-grid-1">

            {contentLang === 'pt' && (
              <Field
                label={a.form.equipmentList}
                hint={a.form.equipmentHint}
              >
                <textarea
                  className="af-input af-textarea"
                  value={form.equipment}
                  onChange={set('equipment')}
                  rows={7}
                  placeholder={'Aquecimento dos bancos dianteiros e traseiros\nTecto panorâmico\nCarregamento sem fios\nSom Harman Kardon\nHead-up display\nCruise control adaptativo com stop & go'}
                />
              </Field>
            )}

            {contentLang === 'en' && (
              <Field
                label={a.form.equipmentListEN}
                hint={a.form.equipmentENHint}
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
                label={a.form.equipmentListUA}
                hint={a.form.equipmentUAHint}
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
              label={a.form.featureTags}
              hint={a.form.featureTagsHint}
            >
              <div className="af-features-wrap">
                {form.features.map((feature, index) => (
                  <span key={index} className="af-feature-tag">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      aria-label={`${a.form.remove} ${feature}`}
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
                    placeholder={a.form.featureTagsPlaceholder}
                  />
                  <button
                    type="button"
                    className="btn-admin-secondary btn-sm"
                    onClick={addFeature}
                  >
                    {a.form.add}
                  </button>
                </div>
              </div>
            </Field>

          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 8 — Gallery & Images
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section title={a.form.sGallery}>

          <Field label={a.form.youtubeUrl}>
            <input
              className="af-input"
              type="url"
              placeholder={a.form.youtubePlaceholder}
              value={form.youtube_url}
              onChange={set('youtube_url')}
            />
            {form.youtube_url && (() => {
              const m = form.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
              return m ? (
                <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxWidth: 320 }}>
                  <img src={`https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`} alt="YouTube preview" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>{a.form.invalidYoutube}</span>
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
                <><span className="admin-spinner-sm" /> {a.form.uploading}</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {a.form.uploadImages}
                </>
              )}
            </button>
            <span className="af-gallery-hint">
              {form.gallery.length > 0
                ? a.form.imageCount(form.gallery.length)
                : a.form.noImages
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
                    <span className="af-gallery-main-badge">{a.form.mainBadge}</span>
                  )}
                  <div className="af-gallery-overlay">
                    {form.main_image !== url && (
                      <button
                        type="button"
                        className="af-gallery-btn"
                        onClick={() => setMainImage(url)}
                      >
                        {a.form.setMain}
                      </button>
                    )}
                    <button
                      type="button"
                      className="af-gallery-btn af-gallery-btn--delete"
                      onClick={() => removeGalleryImage(url)}
                    >
                      {a.form.remove}
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
        <Section title={a.form.sSEO}>
          <div className="af-grid af-grid-1">

            <Field
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {a.form.metaTitle}
                  <button
                    type="button"
                    className="btn-admin-secondary"
                    style={{ padding: '2px 10px', fontSize: '12px', lineHeight: '1.6' }}
                    onClick={generateMetaTitle}
                  >
                    {a.form.generate}
                  </button>
                </span>
              }
              error={errors.meta_title}
              hint={a.form.metaTitleHint(form.meta_title.length)}
            >
              <input
                className={`af-input${errors.meta_title ? ' af-input--error' : ''}`}
                value={form.meta_title}
                onChange={set('meta_title')}
                maxLength={80}
                placeholder={a.form.metaTitlePlaceholder}
              />
            </Field>

            <Field
              label={a.form.metaDesc}
              error={errors.meta_description}
              hint={a.form.metaDescHint(form.meta_description.length)}
            >
              <textarea
                className={`af-input af-textarea${errors.meta_description ? ' af-input--error' : ''}`}
                value={form.meta_description}
                onChange={set('meta_description')}
                maxLength={200}
                rows={3}
                placeholder={a.form.metaDescPlaceholder}
              />
            </Field>

          </div>
        </Section>

        {/* ── Sticky bottom save bar ──────────────────────────────── */}
        <div className="af-save-bar">
          <div className="af-save-bar-inner">
            {errorCount > 0 && (
              <span className="af-error-count">
                {a.form.errorCount(errorCount)}
              </span>
            )}
            <span className="af-save-bar-spacer" />
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={() => navigate('/admin/cars')}
              disabled={saving}
            >
              {a.form.cancel}
            </button>
            <button
              type="submit"
              className="btn-admin-primary"
              disabled={saving || uploading}
            >
              {saving ? a.form.saving : isEdit ? a.form.save : a.form.create}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
