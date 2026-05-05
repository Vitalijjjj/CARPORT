import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGetCars, apiUpdateCarStatus, apiDeleteCar } from '../adminApi'

const STATUS_LABELS = {
  available: 'Available',
  reserved:  'Reserved',
  sold:      'Sold',
  hidden:    'Hidden',
}

const STATUS_COLORS = {
  available: 'green',
  reserved:  'amber',
  sold:      'slate',
  hidden:    'red',
}

/* ── Delete confirmation modal ─────────────────────────────────── */
function DeleteModal({ car, onConfirm, onCancel }) {
  return (
    <div className="admin-modal-backdrop" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>Delete Car</h3>
        <p>
          Are you sure you want to permanently delete{' '}
          <strong>{car.brand} {car.model}{car.version ? ` ${car.version}` : ''}</strong>?
        </p>
        <p className="admin-modal-warn">This action cannot be undone.</p>
        <div className="admin-modal-actions">
          <button className="btn-admin-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-admin-danger" onClick={onConfirm}>
            Delete permanently
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
      showToast('Status updated')
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error')
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
      showToast('Car deleted')
    } catch (err) {
      showToast(err.message || 'Failed to delete car', 'error')
    }
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
          <h1 className="admin-page-title">Cars</h1>
          <p className="admin-page-sub">
            {cars.length} car{cars.length !== 1 ? 's' : ''} in database
            {statusFilter !== 'all' && ` · ${STATUS_LABELS[statusFilter]} filter active`}
          </p>
        </div>
        <Link to="/admin/cars/create" className="btn-admin-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Car
        </Link>
      </div>

      {/* ── Toolbar: search + status filter ─────────────────────── */}
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Search brand, model, year…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="admin-toolbar-filters">
          {['all', 'available', 'reserved', 'sold', 'hidden'].map(s => (
            <button
              key={s}
              className={`admin-filter-pill${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
              {s !== 'all' && (
                <span className="admin-filter-pill-count">
                  {cars.filter(c => c.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error state ─────────────────────────────────────────── */}
      {error && (
        <div className="admin-error-banner">
          Failed to load cars: {error}
        </div>
      )}

      {/* ── Loading state ───────────────────────────────────────── */}
      {loading && (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading cars…</p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="admin-empty">
              {search || statusFilter !== 'all'
                ? 'No cars match your filters.'
                : 'No cars yet.'
              }
              {!search && statusFilter === 'all' && (
                <Link
                  to="/admin/cars/create"
                  className="btn-admin-primary"
                  style={{ marginTop: 16 }}
                >
                  Add your first car
                </Link>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Car</th>
                    <th>Year</th>
                    <th>Price</th>
                    <th>Mileage</th>
                    <th>Status</th>
                    <th style={{ width: 140 }}>Actions</th>
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
                          aria-label="Change status"
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <Link
                            to={`/admin/cars/${car.id}/edit`}
                            className="admin-action-btn admin-action-btn--edit"
                          >
                            Edit
                          </Link>
                          <button
                            className="admin-action-btn admin-action-btn--delete"
                            onClick={() => setDeleteTarget(car)}
                          >
                            Delete
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
