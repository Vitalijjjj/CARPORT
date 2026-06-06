import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGetCars, apiGetCar, apiUpdateCar, apiUpdateCarStatus, apiDeleteCar, apiRecompressDataUrl } from '../adminApi'
import a from '../adminLang'

const STATUS_COLORS = {
  available: 'green',
  reserved:  'amber',
  sold:      'slate',
  hidden:    'red',
}

const STATUS_KEYS = ['available', 'reserved', 'sold', 'hidden']

/* ── Delete confirmation modal ─────────────────────────────────── */
function DeleteModal({ car, onConfirm, onCancel }) {
  return (
    <div className="admin-modal-backdrop" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{a.list.deleteTitle}</h3>
        <p>
          {a.list.deleteConfirm(
            <strong key="name">{car.brand} {car.model}{car.version ? ` ${car.version}` : ''}</strong>
          )}
        </p>
        <p className="admin-modal-warn">{a.list.deleteWarning}</p>
        <div className="admin-modal-actions">
          <button className="btn-admin-secondary" onClick={onCancel}>
            {a.list.cancel}
          </button>
          <button className="btn-admin-danger" onClick={onConfirm}>
            {a.list.deletePermanently}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function AdminCarsListPage() {
  const [cars,           setCars]           = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [statusChanging, setStatusChanging] = useState(null)
  const [toast,          setToast]          = useState(null)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [optimizing,     setOptimizing]     = useState(false)
  const [optDone,        setOptDone]        = useState(0)
  const [optTotal,       setOptTotal]       = useState(0)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    apiGetCars()
      .then(data => { setCars(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [])

  async function handleStatusChange(carId, newStatus) {
    setStatusChanging(carId)
    try {
      await apiUpdateCarStatus(carId, newStatus)
      setCars(prev => prev.map(c => c.id === carId ? { ...c, status: newStatus } : c))
      showToast(a.list.statusUpdated)
    } catch (err) {
      showToast(err.message || a.list.statusFailed, 'error')
    }
    setStatusChanging(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    setDeleteTarget(null)
    try {
      await apiDeleteCar(targetId)
      setCars(prev => prev.filter(c => c.id !== targetId))
      showToast(a.list.carDeleted)
    } catch (err) {
      showToast(err.message || a.list.deleteFailed, 'error')
    }
  }

  // One-time maintenance: re-compress every stored photo to shrink payload sizes
  async function handleOptimizePhotos() {
    if (optimizing || cars.length === 0) return
    setOptimizing(true)
    setOptDone(0)
    setOptTotal(cars.length)
    let updated = 0
    for (const c of cars) {
      try {
        const full = await apiGetCar(c.id)
        const map = new Map()
        const gallery = []
        for (const img of (full.gallery || [])) {
          const out = await apiRecompressDataUrl(img)
          map.set(img, out)
          gallery.push(out)
        }
        const main_image = full.main_image
          ? (map.get(full.main_image) || await apiRecompressDataUrl(full.main_image))
          : (full.main_image || '')
        await apiUpdateCar(c.id, { ...full, gallery, main_image })
        updated++
      } catch { /* skip cars that fail, continue */ }
      setOptDone(d => d + 1)
    }
    setOptimizing(false)
    showToast(a.list.optimizeDone(updated))
  }

  // Client-side filter + search
  const filtered = cars.filter(car => {
    if (statusFilter !== 'all' && car.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matches =
        car.brand?.toLowerCase().includes(q)   ||
        car.model?.toLowerCase().includes(q)   ||
        car.version?.toLowerCase().includes(q) ||
        String(car.year).includes(q)
      if (!matches) return false
    }
    return true
  })

  return (
    <div className="admin-page">

      {/* ── Toast notification ─────────────────────────────────── */}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`} role="alert">
          {toast.type === 'success'
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          }
          {toast.message}
        </div>
      )}

      {/* ── Delete confirmation ─────────────────────────────────── */}
      {deleteTarget && (
        <DeleteModal
          car={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{a.list.title}</h1>
          <p className="admin-page-sub">
            {a.list.subtitle(cars.length)}
            {statusFilter !== 'all' && a.list.filterActive(a.status[statusFilter])}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={handleOptimizePhotos}
            disabled={optimizing || loading || cars.length === 0}
            title={a.list.optimizeHint}
          >
            {optimizing
              ? <><span className="admin-spinner-sm" /> {a.list.optimizing(optDone, optTotal)}</>
              : a.list.optimize}
          </button>
          <Link to="/admin/cars/create" className="btn-admin-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {a.list.addCar}
          </Link>
        </div>
      </div>

      {/* ── Toolbar: search + status filter ─────────────────────── */}
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder={a.list.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="admin-toolbar-filters">
          <button
            className={`admin-filter-pill${statusFilter === 'all' ? ' active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            {a.list.all}
          </button>
          {STATUS_KEYS.map(s => (
            <button
              key={s}
              className={`admin-filter-pill${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {a.status[s]}
              <span className="admin-filter-pill-count">
                {cars.filter(c => c.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Error state ─────────────────────────────────────────── */}
      {error && (
        <div className="admin-error-banner">
          {a.list.failedToLoad} {error}
        </div>
      )}

      {/* ── Loading state ───────────────────────────────────────── */}
      {loading && (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>{a.list.loading}</p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="admin-empty">
              {search || statusFilter !== 'all'
                ? a.list.noMatch
                : a.list.noCars
              }
              {!search && statusFilter === 'all' && (
                <Link
                  to="/admin/cars/create"
                  className="btn-admin-primary"
                  style={{ marginTop: 16 }}
                >
                  {a.list.addFirst}
                </Link>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{a.list.colCar}</th>
                    <th>{a.list.colYear}</th>
                    <th>{a.list.colPrice}</th>
                    <th>{a.list.colMileage}</th>
                    <th>{a.list.colStatus}</th>
                    <th style={{ width: 140 }}>{a.list.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(car => (
                    <tr key={car.id}>
                      <td>
                        <div className="admin-car-cell">
                          {car.main_image ? (
                            <img
                              src={car.main_image}
                              alt=""
                              className="admin-car-thumb"
                            />
                          ) : (
                            <div className="admin-car-thumb-placeholder">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-5-5L5 21"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="admin-car-name">
                              {car.brand} {car.model}
                              {car.version && (
                                <span className="admin-car-version"> {car.version}</span>
                              )}
                            </div>
                            <div className="admin-car-meta">
                              {car.fuel_type} · {car.transmission}
                              {car.power ? ` · ${car.power} hp` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{car.year}</td>
                      <td>€ {Number(car.price).toLocaleString('de-DE')}</td>
                      <td>{Number(car.mileage).toLocaleString('de-DE')} km</td>
                      <td>
                        <select
                          className={`admin-status-select admin-status-select--${STATUS_COLORS[car.status] || 'slate'}`}
                          value={car.status}
                          disabled={statusChanging === car.id}
                          onChange={e => handleStatusChange(car.id, e.target.value)}
                          aria-label={a.list.colStatus}
                        >
                          {STATUS_KEYS.map(s => (
                            <option key={s} value={s}>{a.status[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <Link
                            to={`/admin/cars/${car.id}/edit`}
                            className="admin-action-btn admin-action-btn--edit"
                          >
                            {a.list.edit}
                          </Link>
                          <button
                            className="admin-action-btn admin-action-btn--delete"
                            onClick={() => setDeleteTarget(car)}
                          >
                            {a.list.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

    </div>
  )
}
