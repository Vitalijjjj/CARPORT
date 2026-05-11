import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from './lang/LangContext'
import LangSwitcher from './lang/LangSwitcher'
import './Navbar.css'

export default function Navbar({ onCta, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden,   setHidden]   = useState(false)
  const lastY = useRef(0)
  const { t } = useLang()

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

          {/* Left: logo */}
          <div className="nav-slot-left">
            <Link className="nav-logo" to="/">
              <img src="/assets/logo-turboeagle-nav.svg" alt="TURBOEAGLE" className="nav-logo-img" />
            </Link>
          </div>

          {/* Center: nav links */}
          <div className="nav-links">
            <Link to="/cars">{t.nav.catalog}</Link>
            <Link to="/#models">{t.nav.cars}</Link>
            <Link to="/#import">{t.nav.import}</Link>
            <Link to="/#financing">{t.nav.financing}</Link>
            <Link to="/#quiz">{t.nav.tradeIn}</Link>
            <Link to="/#reviews">{t.nav.reviews}</Link>
            <Link to="/#location">{t.nav.location}</Link>
            <Link to="/#faq">{t.nav.faq}</Link>
          </div>

          {/* Right: lang switcher + CTA + optional search + burger (mobile) */}
          <div className="nav-right">
            <LangSwitcher />
            <button className="btn btn-primary nav-cta" onClick={onCta}>
              {t.nav.getOffer}
            </button>
            {onSearch && (
              <button className="nav-search" aria-label="Search" onClick={onSearch}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
                </svg>
              </button>
            )}
            <button className="nav-burger" aria-label="Menu" onClick={() => setMenuOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`}>
          <div className="mobile-menu-head">
            <Link className="mobile-menu-logo" to="/" onClick={close}>
              <img src="/assets/logo-turboeagle-nav.svg" alt="TURBOEAGLE" className="mobile-menu-logo-img" />
            </Link>
            <button className="mobile-menu-close" aria-label="Close" onClick={close}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="mobile-menu-links">
            <Link to="/cars"       onClick={close}>{t.nav.catalog}</Link>
            <Link to="/#models"    onClick={close}>{t.nav.cars}</Link>
            <Link to="/#import"    onClick={close}>{t.nav.import}</Link>
            <Link to="/#financing" onClick={close}>{t.nav.financing}</Link>
            <Link to="/#quiz"      onClick={close}>{t.nav.tradeIn}</Link>
            <Link to="/#reviews"   onClick={close}>{t.nav.reviews}</Link>
            <Link to="/#location"  onClick={close}>{t.nav.location}</Link>
            <Link to="/#faq"       onClick={close}>{t.nav.faq}</Link>
          </div>
          <div style={{ marginBottom: '16px' }}><LangSwitcher /></div>
          <button className="mobile-menu-cta" onClick={() => { close(); onCta?.() }}>
            {t.nav.getOffer}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 5 7 7-7 7"/>
            </svg>
          </button>
      </div>
    </>
  )
}
