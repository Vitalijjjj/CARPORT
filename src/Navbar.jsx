import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar({ onCta, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden,   setHidden]   = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      if (y < 80) { setHidden(false); lastY.current = y; return }
      setHidden(y > lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function close() { setMenuOpen(false) }

  return (
    <>
      <nav className={`nav${hidden ? ' nav--hidden' : ''}`}>
        <div className="nav-inner">

          {/* Left: burger (mobile) + logo */}
          <div className="nav-slot-left">
            <button className="nav-burger" aria-label="Menu" onClick={() => setMenuOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
            <Link className="nav-logo" to="/">
              <img
                src="/assets/logo-turboeagle.svg"
                alt="TURBOEAGLE"
                className="nav-logo-img"
              />
            </Link>
          </div>

          {/* Center: nav links */}
          <div className="nav-links">
            <Link to="/cars">Catalog</Link>
            <Link to="/#models">Cars</Link>
            <Link to="/#import">Import</Link>
            <Link to="/#financing">Financing</Link>
            <Link to="/#quiz">Trade-In</Link>
            <Link to="/#reviews">Reviews</Link>
            <Link to="/#location">Location</Link>
            <Link to="/#faq">FAQ</Link>
          </div>

          {/* Right: CTA + optional search */}
          <div className="nav-right">
            <button className="btn btn-primary nav-cta" onClick={onCta}>
              Get an Offer
            </button>
            {onSearch && (
              <button className="nav-search" aria-label="Search" onClick={onSearch}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
                </svg>
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-head">
            <Link className="mobile-menu-logo" to="/" onClick={close}>TURBOEAGLE</Link>
            <button className="mobile-menu-close" aria-label="Close" onClick={close}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="mobile-menu-links">
            <Link to="/cars"       onClick={close}>Catalog</Link>
            <Link to="/#models"    onClick={close}>Cars</Link>
            <Link to="/#import"    onClick={close}>Import</Link>
            <Link to="/#financing" onClick={close}>Financing</Link>
            <Link to="/#quiz"      onClick={close}>Trade-In</Link>
            <Link to="/#reviews"   onClick={close}>Reviews</Link>
            <Link to="/#location"  onClick={close}>Location</Link>
            <Link to="/#faq"       onClick={close}>FAQ</Link>
          </div>
          <button className="mobile-menu-cta" onClick={() => { close(); onCta?.() }}>
            Get an Offer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
