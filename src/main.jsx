import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Preloader from './Preloader.jsx'
import { LangProvider } from './lang/LangContext.jsx'

// Public pages
import App        from './App.jsx'
import CarPage    from './CarPage.jsx'
import CatalogPage from './CatalogPage.jsx'
import FloatingWidget from './FloatingWidget.jsx'
import LeadPopup  from './LeadPopup.jsx'

// Admin pages
import AdminGuard         from './admin/AdminGuard.jsx'
import AdminLayout        from './admin/AdminLayout.jsx'
import AdminLoginPage     from './admin/pages/AdminLoginPage.jsx'
import AdminDashboardPage from './admin/pages/AdminDashboardPage.jsx'
import AdminCarsListPage  from './admin/pages/AdminCarsListPage.jsx'
import AdminCarFormPage   from './admin/pages/AdminCarFormPage.jsx'
import AdminReviewsPage   from './admin/pages/AdminReviewsPage.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) { el.scrollIntoView({ behavior: 'smooth' }) }
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

// Only render site-wide widgets on non-admin pages
function SiteWidgets() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) return null
  return (
    <>
      <FloatingWidget />
      <LeadPopup />
    </>
  )
}

function Root() {
  const [ready, setReady] = useState(false)
  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ── Public routes ───────────────────────────────────── */}
          <Route path="/"        element={<App />} />
          <Route path="/cars"    element={<CatalogPage />} />
          <Route path="/car/:id" element={<CarPage />} />

          {/* ── Admin routes ────────────────────────────────────── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index                   element={<AdminDashboardPage />} />
            <Route path="cars"             element={<AdminCarsListPage />} />
            <Route path="cars/create"      element={<AdminCarFormPage />} />
            <Route path="cars/:id/edit"    element={<AdminCarFormPage />} />
            <Route path="reviews"          element={<AdminReviewsPage />} />
          </Route>
        </Routes>
        <SiteWidgets />
      </BrowserRouter>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <Root />
    </LangProvider>
  </StrictMode>,
)
