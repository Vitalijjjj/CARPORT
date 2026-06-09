import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import a from './adminLang'
import './Admin.css'

function SidebarLink({ to, end, icon, label }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate  = useNavigate()
  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || 'null') } catch { return null }
  })()

  function handleLogout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  const avatarChar = (adminUser?.name || adminUser?.email || 'A').charAt(0).toUpperCase()

  return (
    <div className="admin-wrap">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar-logo">
          <Link to="/admin" className="admin-logo-link">
            <span className="admin-logo-text">TURBOEAGLE</span>
            <span className="admin-logo-badge">Admin</span>
          </Link>
        </div>

        <nav className="admin-nav">
          <SidebarLink
            to="/admin"
            end
            label={a.nav.dashboard}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            }
          />
          <SidebarLink
            to="/admin/cars"
            label={a.nav.cars}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="9" width="22" height="10" rx="2"/>
                <path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
                <circle cx="7.5" cy="19" r="1.5"/>
                <circle cx="16.5" cy="19" r="1.5"/>
              </svg>
            }
          />
          <SidebarLink
            to="/admin/reviews"
            label={a.nav.reviews}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 17.3 6.2 20l1.1-6.4L2.6 9.1l6.5-.9L12 2.3l2.9 5.9 6.5.9-4.7 4.5 1.1 6.4z"/>
              </svg>
            }
          />
          <SidebarLink
            to="/admin/leads"
            label={a.nav.leads}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
                <path d="m2 7 10 6 10-6"/>
              </svg>
            }
          />
        </nav>

        <div className="admin-sidebar-sep" />

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{avatarChar}</div>
            <div className="admin-user-details">
              <span className="admin-user-name">{adminUser?.name || 'Admin'}</span>
              <span className="admin-user-email">{adminUser?.email || ''}</span>
            </div>
          </div>
          <button
            className="admin-logout-btn"
            onClick={handleLogout}
            title={a.nav.signOut}
            aria-label={a.nav.signOut}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="admin-main">
        <Outlet />
      </main>

    </div>
  )
}
