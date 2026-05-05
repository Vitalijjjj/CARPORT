import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
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
            label="Dashboard"
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
            label="Cars"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="9" width="22" height="10" rx="2"/>
                <path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
                <circle cx="7.5" cy="19" r="1.5"/>
                <circle cx="16.5" cy="19" r="1.5"/>
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
            title="Sign out"
            aria-label="Sign out"
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
