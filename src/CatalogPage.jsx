import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchPublicCars } from './publicApi'
import Modal from './Modal'
import Navbar from './Navbar'
import { useLang } from './lang/LangContext'
import './CatalogPage.css'

function fmt(n) { return n.toLocaleString('de-DE') }

/* ─── Brand logos ───────────────────────────────────────────────── */
function BmwLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#1c1c1c"/>
      <circle cx="20" cy="20" r="14" fill="#fff"/>
      <path d="M20 6 A14 14 0 0 1 34 20 L20 20 Z" fill="#1c69d4"/>
      <path d="M20 34 A14 14 0 0 0 6 20 L20 20 Z" fill="#1c69d4"/>
      <line x1="20" y1="6" x2="20" y2="34" stroke="#fff" strokeWidth="1.5"/>
      <line x1="6" y1="20" x2="34" y2="20" stroke="#fff" strokeWidth="1.5"/>
    </svg>
  )
}

function MercedesLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="#fff" stroke="#888" strokeWidth="1.5"/>
      <path d="M20 3 L20 20" stroke="#555" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 20 L34.7 28.5" stroke="#555" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 20 L5.3 28.5" stroke="#555" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="2" fill="#555"/>
    </svg>
  )
}

/* BRAND_META is the single source of truth for brand display info.
   Admin panel should extend this object when adding new brands. */
const BRAND_META = {
  bmw:      { label: 'BMW',           Logo: BmwLogo },
  mercedes: { label: 'Mercedes-Benz', Logo: MercedesLogo },
}

function BrandSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { t } = useLang()

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const options = [
    { key: 'all', label: t.catalog.allBrands, Logo: null },
    ...Object.entries(BRAND_META).map(([key, { label, Logo }]) => ({ key, label, Logo })),
  ]
  const selected = options.find(o => o.key === value) ?? options[0]

  const AllIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" strokeDasharray="3 2"/>
    </svg>
  )

  return (
    <div className="cat-brand-sel" ref={ref}>
      <button
        className={`cat-brand-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="cat-brand-icon">
          {selected.Logo ? <selected.Logo /> : <AllIcon />}
        </span>
        <span className="cat-brand-trigger-label">{selected.label}</span>
        <svg className={`cat-brand-chevron${open ? ' open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="cat-brand-dropdown">
          {options.map(({ key, label, Logo }) => (
            <button
              key={key}
              className={`cat-brand-opt${value === key ? ' active' : ''}`}
              onClick={() => { onChange(key); setOpen(false) }}
            >
              <span className="cat-brand-icon">
                {Logo ? <Logo /> : <AllIcon />}
              </span>
              <span className="cat-brand-opt-label">{label}</span>
              {value === key && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 12 5 5 9-10"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── CatalogCard ───────────────────────────────────────────────── */
function CatalogCard({ car, onRequest }) {
  const navigate   = useNavigate()
  const { t }      = useLang()
  const brandLabel = BRAND_META[car.brand]?.label ?? car.brand
  const fuelLabel  = car.fuelType === 'electric' ? t.car.electric : t.car.hybrid
  const statusLabels = { in_stock: t.car.available, reserved: t.car.reserved, incoming: t.car.incoming }
  const imgSrc     = car.img
    ? (car.img.startsWith('data:') || car.img.startsWith('/') || car.img.startsWith('http') ? car.img : `/${car.img}`)
    : ''

  return (
    <article className="cc" onClick={() => navigate(`/car/${car.id}`)} style={{ cursor: 'pointer' }}>
      <div className="cc-img-wrap">
        {imgSrc
          ? <div className="cc-img" style={{ backgroundImage: `url('${imgSrc}')` }} />
          : <div className="cc-img cc-img--placeholder" />
        }
        <span className={`cc-status-badge cc-status--${car.status}`}>
          {statusLabels[car.status] ?? car.status}
        </span>
        <span className="cc-brand-badge">{brandLabel}</span>
      </div>

      <div className="cc-body">
        <div className="cc-top">
          <div className="cc-meta">{brandLabel} · {car.year} · {fuelLabel}</div>
          <h3 className="cc-name">{car.name}</h3>
          <p className="cc-tagline">{car.tagline}</p>
        </div>

        <div className="cc-specs">
          <div className="cc-spec">
            <span className="cc-sk">{t.car.power}</span>
            <span className="cc-sv">{car.hp}</span>
          </div>
          <div className="cc-spec">
            <span className="cc-sk">{t.car.mileage}</span>
            <span className="cc-sv">{car.mileage}</span>
          </div>
          <div className="cc-spec">
            <span className="cc-sk">{t.car.drive}</span>
            <span className="cc-sv">{car.drivetrain}</span>
          </div>
          <div className="cc-spec">
            <span className="cc-sk">{t.car.engine}</span>
            <span className="cc-sv">{car.engine}</span>
          </div>
        </div>

        <div className="cc-foot">
          <div className="cc-price-col">
            <span className="cc-price">€ {fmt(car.price)}</span>
            <div className="cc-badges">
              {car.financing && <span className="cc-badge">{t.catalog.financing}</span>}
              {car.warranty  && <span className="cc-badge">{t.catalog.warranty}</span>}
            </div>
          </div>
          <div className="cc-actions">
            <button className="cc-btn-request" onClick={e => { e.stopPropagation(); onRequest() }}>{t.catalog.request}</button>
            <Link className="cc-btn-view" to={`/car/${car.id}`} onClick={e => e.stopPropagation()}>
              {t.catalog.view}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ─── Sidebar ───────────────────────────────────────────────────── */
function Sidebar({ filters, set, reset, activeCount, onClose, priceMin, priceMax, yearMin, yearMax, milMax }) {
  const { t } = useLang()
  return (
    <aside className="cat-sidebar">
      <div className="cat-sb-head">
        <span className="cat-sb-title">
          {t.catalog.filtersTitle}
          {activeCount > 0 && <em className="cat-sb-count">{activeCount}</em>}
        </span>
        <div className="cat-sb-head-right">
          {activeCount > 0 && (
            <button className="cat-sb-clear" onClick={reset}>{t.catalog.clearAll}</button>
          )}
          <button className="cat-sb-x" onClick={onClose} aria-label="Close filters">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Brand */}
      <FilterGroup label={t.catalog.brand}>
        <BrandSelect value={filters.brand} onChange={v => set('brand', v)} />
      </FilterGroup>

      {/* Fuel type */}
      <FilterGroup label={t.catalog.fuelType}>
        <Pills
          options={[['all', t.catalog.allFuelTypes], ['electric', t.car.electric], ['hybrid', t.car.hybrid]]}
          value={filters.fuelType}
          onChange={v => set('fuelType', v)}
        />
      </FilterGroup>

      {/* Price */}
      <FilterGroup label={`${t.catalog.price} — ${t.catalog.upTo} € ${fmt(filters.priceMax)}`}>
        <input
          type="range"
          className="cat-range"
          min={priceMin} max={priceMax} step={1000}
          value={filters.priceMax}
          onChange={e => set('priceMax', +e.target.value)}
        />
      </FilterGroup>

      {/* Year */}
      <FilterGroup label={`${t.catalog.year} — ${t.catalog.from} ${filters.yearMin}`}>
        <input
          type="range"
          className="cat-range"
          min={yearMin} max={yearMax} step={1}
          value={filters.yearMin}
          onChange={e => set('yearMin', +e.target.value)}
        />
      </FilterGroup>

      {/* Mileage */}
      <FilterGroup label={`${t.catalog.mileage} — ${t.catalog.upTo} ${fmt(filters.mileageMax)} km`}>
        <input
          type="range"
          className="cat-range"
          min={0} max={milMax} step={5000}
          value={filters.mileageMax}
          onChange={e => set('mileageMax', +e.target.value)}
        />
      </FilterGroup>

      {/* Status */}
      <FilterGroup label={t.catalog.availability} defaultOpen={false}>
        <Pills
          options={[['all', t.catalog.allStatus], ['in_stock', t.car.available], ['reserved', t.car.reserved]]}
          value={filters.status}
          onChange={v => set('status', v)}
        />
      </FilterGroup>

      {/* Toggles */}
      <FilterGroup label={t.catalog.options} defaultOpen={false}>
        <Toggle label={t.catalog.financing} checked={filters.financing} onChange={v => set('financing', v)} />
        <Toggle label={t.catalog.warranty}  checked={filters.warranty}  onChange={v => set('warranty', v)} />
      </FilterGroup>
    </aside>
  )
}

function FilterGroup({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="cat-fg">
      <button className="cat-fg-head" onClick={() => setOpen(o => !o)}>
        <span className="cat-fg-label">{label}</span>
        <svg
          className={`cat-fg-chevron${open ? ' open' : ''}`}
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && <div className="cat-fg-body">{children}</div>}
    </div>
  )
}

function Pills({ options, value, onChange }) {
  return (
    <div className="cat-pills">
      {options.map(([v, l]) => (
        <button
          key={v}
          className={`cat-pill${value === v ? ' active' : ''}`}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="cat-toggle">
      <span className={`cat-toggle-track${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <span className="cat-toggle-thumb" />
      </span>
      <span className="cat-toggle-label">{label}</span>
    </label>
  )
}

/* ─── CatalogPage ───────────────────────────────────────────────── */
export default function CatalogPage() {
  const { t } = useLang()
  const [cars,       setCars]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filters,    setFilters]    = useState({
    brand: 'all', fuelType: 'all',
    priceMax: 200000, yearMin: 2018, mileageMax: 200000,
    status: 'all', financing: false, warranty: false,
  })
  const [sort,       setSort]       = useState('newest')
  const [modal,      setModal]      = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initDone = useRef(false)

  // Derived ranges from actual loaded data
  const PRICE_MIN = cars.length ? Math.min(...cars.map(c => c.price))      : 0
  const PRICE_MAX = cars.length ? Math.max(...cars.map(c => c.price))      : 200000
  const YEAR_MIN  = cars.length ? Math.min(...cars.map(c => c.year))       : 2018
  const YEAR_MAX  = cars.length ? Math.max(...cars.map(c => c.year))       : 2025
  const MIL_MAX   = cars.length ? Math.max(...cars.map(c => c.mileageNum)) : 200000

  useEffect(() => {
    fetchPublicCars()
      .then(data => {
        setCars(data)
        if (!initDone.current && data.length) {
          initDone.current = true
          setFilters(f => ({
            ...f,
            priceMax:   Math.max(...data.map(c => c.price)),
            yearMin:    Math.min(...data.map(c => c.year)),
            mileageMax: Math.max(...data.map(c => c.mileageNum)),
          }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function set(key, val) { setFilters(f => ({ ...f, [key]: val })) }
  function reset() {
    setFilters({
      brand: 'all', fuelType: 'all',
      priceMax: PRICE_MAX, yearMin: YEAR_MIN, mileageMax: MIL_MAX,
      status: 'all', financing: false, warranty: false,
    })
  }

  const activeCount = [
    filters.brand     !== 'all',
    filters.fuelType  !== 'all',
    filters.priceMax  < PRICE_MAX,
    filters.yearMin   > YEAR_MIN,
    filters.mileageMax < MIL_MAX,
    filters.status    !== 'all',
    filters.financing,
    filters.warranty,
  ].filter(Boolean).length

  const results = useMemo(() => {
    const filtered = cars.filter(c => {
      if (filters.brand     !== 'all' && c.brand    !== filters.brand)    return false
      if (filters.fuelType  !== 'all' && c.fuelType !== filters.fuelType) return false
      if (filters.status    !== 'all' && c.status   !== filters.status)   return false
      if (c.price      > filters.priceMax)   return false
      if (c.year       < filters.yearMin)    return false
      if (c.mileageNum > filters.mileageMax) return false
      if (filters.financing && !c.financing) return false
      if (filters.warranty  && !c.warranty)  return false
      return true
    })
    switch (sort) {
      case 'price_asc':   return [...filtered].sort((a, b) => a.price      - b.price)
      case 'price_desc':  return [...filtered].sort((a, b) => b.price      - a.price)
      case 'mileage_asc': return [...filtered].sort((a, b) => a.mileageNum - b.mileageNum)
      default:            return [...filtered].sort((a, b) => b.year       - a.year)
    }
  }, [cars, filters, sort])

  const sidebarProps = {
    filters, set, reset, activeCount,
    priceMin: PRICE_MIN, priceMax: PRICE_MAX,
    yearMin: YEAR_MIN, yearMax: YEAR_MAX,
    milMax: MIL_MAX,
  }

  return (
    <div className="cat-page">

      {/* ── NAV ── */}
      <Navbar onCta={() => setModal(true)} />

      {/* ── PAGE HEADER ── */}
      <header className="cat-hero">
        <div className="cat-wrap">
          <nav className="cat-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
            <span>Catalog</span>
          </nav>
          <h1 className="cat-hero-title">Our Fleet</h1>
          <p className="cat-hero-sub">
            Selected BMW and Mercedes-Benz electric &amp; hybrid vehicles — in stock or available for import from Germany.
          </p>
          <div className="cat-hero-stats">
            <div className="cat-hs"><span className="cat-hs-n">{cars.length || '—'}</span><span className="cat-hs-l">Cars listed</span></div>
            <div className="cat-hs-div" />
            <div className="cat-hs"><span className="cat-hs-n">2</span><span className="cat-hs-l">Brands</span></div>
            <div className="cat-hs-div" />
            <div className="cat-hs"><span className="cat-hs-n">100%</span><span className="cat-hs-l">Verified</span></div>
          </div>
        </div>
      </header>

      {/* ── LAYOUT ── */}
      <div className="cat-layout cat-wrap">

        {/* Desktop sidebar */}
        <Sidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} />

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="cat-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
            <div className="cat-drawer" onClick={e => e.stopPropagation()}>
              <Sidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <main className="cat-main">

          {/* Toolbar */}
          <div className="cat-toolbar">
            <button className="cat-filter-btn" onClick={() => setDrawerOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
              </svg>
              {t.catalog.filtersTitle}
              {activeCount > 0 && <span className="cat-filter-badge">{activeCount}</span>}
            </button>
            <span className="cat-count">
              {loading ? '…' : `${results.length} ${t.catalog.results}`}
            </span>
            <div className="cat-sort-wrap">
              <select className="cat-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">{t.catalog.sortNewest}</option>
                <option value="price_asc">{t.catalog.sortPriceAsc}</option>
                <option value="price_desc">{t.catalog.sortPriceDesc}</option>
                <option value="mileage_asc">{t.catalog.sortMileage}</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="cat-active-chips">
              {filters.brand !== 'all' && (
                <Chip label={BRAND_META[filters.brand]?.label ?? filters.brand} onRemove={() => set('brand', 'all')} />
              )}
              {filters.fuelType !== 'all' && (
                <Chip label={filters.fuelType === 'electric' ? t.car.electric : t.car.hybrid} onRemove={() => set('fuelType', 'all')} />
              )}
              {filters.priceMax < PRICE_MAX && (
                <Chip label={`${t.catalog.upTo} € ${fmt(filters.priceMax)}`} onRemove={() => set('priceMax', PRICE_MAX)} />
              )}
              {filters.yearMin > YEAR_MIN && (
                <Chip label={`${t.catalog.from} ${filters.yearMin}`} onRemove={() => set('yearMin', YEAR_MIN)} />
              )}
              {filters.mileageMax < MIL_MAX && (
                <Chip label={`${t.catalog.upTo} ${fmt(filters.mileageMax)} km`} onRemove={() => set('mileageMax', MIL_MAX)} />
              )}
              {filters.status !== 'all' && (
                <Chip label={filters.status === 'in_stock' ? t.car.available : t.car.reserved} onRemove={() => set('status', 'all')} />
              )}
              {filters.financing && <Chip label={t.catalog.financing} onRemove={() => set('financing', false)} />}
              {filters.warranty  && <Chip label={t.catalog.warranty}  onRemove={() => set('warranty',  false)} />}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="cat-loading">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'cat-spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <span>Loading cars…</span>
            </div>
          ) : results.length === 0 ? (
            <div className="cat-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p>{t.catalog.noResults}</p>
              <button onClick={reset}>{t.catalog.clearAll}</button>
            </div>
          ) : (
            <div className="cat-grid">
              {results.map(car => (
                <CatalogCard key={car.id} car={car} onRequest={() => setModal(true)} />
              ))}
            </div>
          )}

          {/* Import CTA */}
          <div className="cat-import">
            <div className="cat-import-glow" />
            <div className="cat-import-content">
              <div className="cat-import-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="cat-import-text">
                <h2>Looking for a specific BMW or Mercedes?</h2>
                <p>We can import it directly from Germany — with full history, battery health check, warranty and delivery across Portugal.</p>
                <ul className="cat-import-perks">
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                    Personal car search in Germany
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                    Full history &amp; inspection report
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                    Financing &amp; warranty available
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                    Delivery anywhere in Portugal
                  </li>
                </ul>
              </div>
              <div className="cat-import-actions">
                <button className="cat-import-btn-pri" onClick={() => setModal(true)}>
                  Request Import
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
                </button>
                <a
                  className="cat-import-btn-sec"
                  href="https://www.instagram.com/turboeagle.pt?igsh=MWVscmNnNXo5cWUyeQ%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>

        </main>
      </div>

      {modal && <Modal onClose={() => setModal(false)} />}
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span className="cat-chip">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </span>
  )
}
