import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGetCars } from '../adminApi'
import a from '../adminLang'

const STATUS_COLORS = {
  available: 'green',
  reserved:  'amber',
  sold:      'slate',
  hidden:    'red',
}

export default function AdminDashboardPage() {
  const [cars,    setCars]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    apiGetCars()
      .then(data => { setCars(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [])

  const stats = {
    total:     cars.length,
    available: cars.filter(c => c.status === 'available').length,
    reserved:  cars.filter(c => c.status === 'reserved').length,
    sold:      cars.filter(c => c.status === 'sold').length,
    hidden:    cars.filter(c => c.status === 'hidden').length,
  }

  const recentCars = [...cars].slice(0, 5)

  return (
    <div className="admin-page">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{a.dashboard.title}</h1>
          <p className="admin-page-sub">{a.dashboard.subtitle}</p>
        </div>
        <Link to="/admin/cars/create" className="btn-admin-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {a.dashboard.addCar}
        </Link>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">{a.dashboard.total}</span>
          <span className="admin-stat-value">{loading ? '—' : stats.total}</span>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <span className="admin-stat-label">{a.dashboard.available}</span>
          <span className="admin-stat-value">{loading ? '—' : stats.available}</span>
        </div>
        <div className="admin-stat-card admin-stat-card--amber">
          <span className="admin-stat-label">{a.dashboard.reserved}</span>
          <span className="admin-stat-value">{loading ? '—' : stats.reserved}</span>
        </div>
        <div className="admin-stat-card admin-stat-card--slate">
          <span className="admin-stat-label">{a.dashboard.sold}</span>
          <span className="admin-stat-value">{loading ? '—' : stats.sold}</span>
        </div>
        <div className="admin-stat-card admin-stat-card--red">
          <span className="admin-stat-label">{a.dashboard.hidden}</span>
          <span className="admin-stat-value">{loading ? '—' : stats.hidden}</span>
        </div>
      </div>

      {error && (
        <div className="admin-error-banner">{a.dashboard.failedToLoad} {error}</div>
      )}

      {/* ── Recent cars ─────────────────────────────────────────── */}
      <div className="admin-section-card">
        <div className="admin-section-card-header">
          <h2 className="admin-section-card-title">{a.dashboard.recentCars}</h2>
          <Link to="/admin/cars" className="admin-link">{a.dashboard.viewAll}</Link>
        </div>

        {loading ? (
          <div className="admin-loading-sm">
            <div className="admin-spinner" />
          </div>
        ) : recentCars.length === 0 ? (
          <div className="admin-empty-sm">
            {a.dashboard.noCars} &nbsp;
            <Link to="/admin/cars/create" className="admin-link">{a.dashboard.addFirst}</Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{a.dashboard.colCar}</th>
                <th>{a.dashboard.colYear}</th>
                <th>{a.dashboard.colPrice}</th>
                <th>{a.dashboard.colStatus}</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {recentCars.map(car => (
                <tr key={car.id}>
                  <td>
                    <div className="admin-car-cell">
                      {car.main_image && (
                        <img
                          src={car.main_image}
                          alt=""
                          className="admin-car-thumb"
                        />
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
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{car.year}</td>
                  <td>€ {Number(car.price).toLocaleString('de-DE')}</td>
                  <td>
                    <span className={`admin-status-badge admin-status--${STATUS_COLORS[car.status] || 'slate'}`}>
                      {a.status[car.status] || car.status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/cars/${car.id}/edit`} className="admin-link">{a.dashboard.edit}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
