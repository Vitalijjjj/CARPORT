import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import App from './App.jsx'
import CarPage from './CarPage.jsx'
import FloatingWidget from './FloatingWidget.jsx'
import LeadPopup from './LeadPopup.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/car/:id" element={<CarPage />} />
      </Routes>
      <FloatingWidget />
      <LeadPopup />
    </BrowserRouter>
  </StrictMode>,
)
