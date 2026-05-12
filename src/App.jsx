import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { OLIMP_CARS } from './cars-data'
import { fetchPublicCars } from './publicApi'
import { useLang } from './lang/LangContext'

import Modal from './Modal'
import Quiz from './Quiz'
import Navbar from './Navbar'
import Footer from './Footer'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/* Counter utilities                                                    */
/* ------------------------------------------------------------------ */

function parseCounter(text) {
  const m = text.trim().match(/^([^0-9]*)([0-9]+\.?[0-9]*)(.*)$/)
  if (!m) return null
  const decimals = m[2].includes('.') ? m[2].split('.')[1].length : 0
  return { prefix: m[1], num: parseFloat(m[2]), suffix: m[3], decimals }
}

function formatCounter(val, { prefix, suffix, decimals }) {
  const str = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString()
  return prefix + str + suffix
}

/* ------------------------------------------------------------------ */
/* Static data                                                          */
/* ------------------------------------------------------------------ */

const heroData = [
  { title: 'BMW i4 eDrive40',         range: '590 km', hp: '340 HP', year: '2023', price: '€52 900', id: 'bmw-i4-edrive40' },
  { title: 'BMW X5 xDrive45e',        range: '87 km EV', hp: '394 HP', year: '2023', price: '€79 900', id: 'bmw-x5-45e' },
  { title: 'Mercedes-Benz EQE 350',   range: '654 km', hp: '292 HP', year: '2023', price: '€63 800', id: 'mercedes-eqe-350' },
]

const heroImages = [
  'assets/car-bmw-i4.jpg',
  'assets/car-bmw-x5.jpg',
  'assets/car-mercedes-eqe.jpg',
]

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  accent:  '#006be6',
  ink:     '#030303',
  display: 'Orbitron',
  h2:      36,
  radius:  12,
}/*EDITMODE-END*/

const FILTERS = ['all', 'bmw', 'mercedes', 'electric', 'hybrid', 'financing', 'warranty']

const FILTER_LABELS = {
  all:       'All',
  bmw:       'BMW',
  mercedes:  'Mercedes-Benz',
  electric:  'Electric',
  hybrid:    'Hybrid',
  financing: 'Financing',
  warranty:  'Warranty',
}

const FAQ_ITEMS = [
  {
    q: 'Do you check the battery health of electric vehicles?',
    a: 'Yes. Battery condition is one of the key points clients ask about when buying an electric or hybrid vehicle. When available, we provide battery health information and explain what it means for real-world use.',
  },
  {
    q: 'Do the cars come with warranty?',
    a: 'Selected vehicles come with warranty options. The exact warranty term depends on the specific car, its condition and purchase conditions. Warranty information is shown on the vehicle page or provided during consultation.',
  },
  {
    q: 'Do the cars have service history documents?',
    a: 'Whenever available, we provide maintenance records and service history information. This helps the buyer understand how the vehicle was maintained before purchase.',
  },
  {
    q: 'Can I finance a car?',
    a: 'Yes. Financing is available for selected vehicles. Our team can help you understand available options and prepare a financing request.',
  },
  {
    q: 'Can I use my current car as trade-in?',
    a: 'Yes. Trade-in is available. You can send us information about your current car and we will help estimate how it can be used toward your next purchase.',
  },
  {
    q: 'Can you import a car from Germany?',
    a: 'Yes. We offer a full import service from Germany, including vehicle search, inspection support, financial transparency, logistics and documentation.',
  },
  {
    q: 'Do you deliver cars across Portugal?',
    a: 'Yes. Delivery across Portugal can be arranged depending on the vehicle and location.',
  },
  {
    q: 'How long does the import process take?',
    a: 'The timeline depends on the specific vehicle, inspection, purchase process, logistics and documentation. After understanding your request, we can give you a more accurate estimate.',
  },
  {
    q: 'Can I reserve a car from the website?',
    a: 'You can send a request for a specific vehicle directly from its page. Our team will contact you to confirm availability and next steps.',
  },
]

/* ------------------------------------------------------------------ */
/* SVG icon strings                                                     */
/* ------------------------------------------------------------------ */

const ICON_SEAT    = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8h12c2 0 3 1 3 3v9H9v-9c0-2 1-3 3-3Z"/><path d="M9 20v8h18v-8"/><path d="M7 28h22"/></svg>`
const ICON_GEARBOX = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="12" r="2.5"/><circle cx="20" cy="12" r="2.5"/><circle cx="30" cy="12" r="2.5"/><circle cx="10" cy="28" r="2.5"/><circle cx="30" cy="28" r="2.5"/><path d="M10 14.5v11M20 14.5v6M30 14.5v11"/></svg>`
const ICON_LUGGAGE = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><rect x="11" y="12" width="18" height="20" rx="2"/><path d="M16 12V8h8v4"/><path d="M11 18h18M11 26h18"/></svg>`

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 100 92" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Top full-width bar */}
      <rect x="4"  y="4"  width="92" height="15"/>
      {/* Left vertical */}
      <rect x="4"  y="21" width="15" height="52"/>
      {/* Left upper arm */}
      <rect x="19" y="21" width="26" height="14"/>
      {/* Left lower arm */}
      <rect x="19" y="57" width="26" height="16"/>
      {/* Right top bar */}
      <rect x="57" y="21" width="39" height="14"/>
      {/* Right mid bar (slightly shorter) */}
      <rect x="57" y="38" width="30" height="12"/>
      {/* Right bottom bar */}
      <rect x="57" y="57" width="39" height="16"/>
      {/* Bottom chevron — left leg */}
      <polygon points="4,75 19,75 50,90 35,90"/>
      {/* Bottom chevron — right leg */}
      <polygon points="82,75 96,75 65,90 50,90"/>
    </svg>
  )
}

function BtnArrow() {
  return (
    <span className="btn-arrow">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9 5 7 7-7 7"/>
      </svg>
    </span>
  )
}

function CarCard({ car }) {
  return (
    <Link className="mcard" to={`/car/${car.id}`}>
      <div className="shot" style={{ backgroundImage: `url('${car.img}')` }}>
        <div className="mcard-badges">
          {car.warranty   && <span className="mcard-badge">Warranty</span>}
          {car.financing  && <span className="mcard-badge">Financing</span>}
        </div>
      </div>
      <div>
        <div className="row-name">
          <div>
            <h3>{car.name}</h3>
            <div className="sub">{car.tagline}</div>
          </div>
          <div className="price">
            €{car.price.toLocaleString('de-DE')}
          </div>
        </div>
        <div className="stats">
          <div className="mstat">
            <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_SEAT }} />
            <div><span className="k">Power</span><span className="v">{car.hp || car.seats || '—'}</span></div>
          </div>
          <div className="mstat">
            <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_GEARBOX }} />
            <div><span className="k">Year</span><span className="v">{car.year}</span></div>
          </div>
          <div className="mstat">
            <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_LUGGAGE }} />
            <div><span className="k">Range</span><span className="v">{car.range}</span></div>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Main App                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const { t } = useLang()
  const [heroIdx,  setHeroIdxRaw] = useState(0)
  const [filter,   setFilter]     = useState('all')
  const [tweaks,   setTweaks]     = useState({ ...TWEAK_DEFAULTS })
  const [editMode, setEditMode]   = useState(false)
  const [modal,    setModal]      = useState(false)
  const [srch,     setSrch]       = useState({ open: false, query: '' })
  const [scrollPhase, setScrollPhase] = useState('top')
  const [stickyVis,   setStickyVis]   = useState(false)
  const [openFaq,     setOpenFaq]     = useState(null)
  const [swipeHinted, setSwipeHinted] = useState(false)
  const [dbCars,   setDbCars]     = useState(null) // null = loading

  useEffect(() => {
    fetchPublicCars()
      .then(data => setDbCars(data.length > 0 ? data : null))
      .catch(() => setDbCars(null))
  }, [])

  const catalogCars = dbCars ?? OLIMP_CARS

  const heroSlides = useMemo(() => {
    if (dbCars && dbCars.length > 0) {
      return dbCars.slice(0, 3).map(car => ({
        title:     car.name,
        range:     car.range     || '',
        hp:        car.hp        || '',
        year:      String(car.year),
        price:     `€ ${Number(car.price).toLocaleString('de-DE')}`,
        id:        String(car.id),
        bgImage:   car.img
          ? (car.img.startsWith('data:') || car.img.startsWith('/') || car.img.startsWith('http') ? car.img : `/${car.img}`)
          : heroImages[0],
        warranty:  car.warranty,
        financing: car.financing,
      }))
    }
    return heroData.map((h, i) => ({ ...h, bgImage: heroImages[i], warranty: true, financing: true }))
  }, [dbCars])

  const cardCtxRef   = useRef(null)
  const touchStartX  = useRef(null)

  const searchResults = srch.query.trim().length > 1
    ? catalogCars.filter(c =>
        [c.name, c.tagline, c.brand, c.year].some(
          f => String(f ?? '').toLowerCase().includes(srch.query.toLowerCase())
        )
      )
    : []

  function setHero(i) {
    setHeroIdxRaw((i + heroSlides.length) % heroSlides.length)
  }

  /* ── Tweaks: apply CSS vars ───────────────────────────────────────── */
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent',    tweaks.accent)
    root.style.setProperty('--ink',       tweaks.ink)
    root.style.setProperty('--display',   `'${tweaks.display}', system-ui, sans-serif`)
    root.style.setProperty('--radius-md', tweaks.radius + 'px')
    root.style.setProperty('--radius-lg', (tweaks.radius + 4) + 'px')
    document.querySelectorAll('.h2').forEach(h => { h.style.fontSize = tweaks.h2 + 'px' })
  }, [tweaks])

  /* ── Edit-mode postMessage bridge ────────────────────────────────── */
  useEffect(() => {
    function onMessage(e) {
      const d = e.data
      if (!d || typeof d !== 'object') return
      if (d.type === '__activate_edit_mode')   setEditMode(true)
      if (d.type === '__deactivate_edit_mode') setEditMode(false)
      if (d.type === '__edit_mode_set_keys')   setTweaks(prev => ({ ...prev, ...d.edits }))
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: '__edit_mode_available' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function pushEdit(partial) {
    setTweaks(prev => ({ ...prev, ...partial }))
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: partial }, '*')
  }

  function injectFont(name) {
    if (name === 'Orbitron') return
    const id = `gf-${name.replace(/ /g, '-')}`
    if (!document.getElementById(id)) {
      const l = document.createElement('link')
      l.id   = id
      l.rel  = 'stylesheet'
      l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@500;600;700&display=swap`
      document.head.appendChild(l)
    }
  }

  /* ── Scroll: sticky CTA ──────────────────────────────────────────── */
  useEffect(() => {
    function onScroll() {
      const y    = window.scrollY
      const docH = Math.max(document.body.scrollHeight - window.innerHeight, 1)
      setStickyVis(y > 120)
      setScrollPhase(y / docH < 0.35 ? 'top' : 'mid')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── HERO ANIMATION ──────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-eyebrow-line',  { opacity: 0, y: 16, duration: 0.55, ease: 'power3.out', delay: 0.10 })
      gsap.from('.hero-body-left h1',  { opacity: 0, y: 28, duration: 0.75, ease: 'power3.out', delay: 0.20 })
      gsap.from('.hero-body-desc',     { opacity: 0, y: 16, duration: 0.55, ease: 'power3.out', delay: 0.35 })
      gsap.from('.hero-specs .spec',   { opacity: 0, y: 14, duration: 0.45, stagger: 0.08, ease: 'power3.out', delay: 0.40 })
      gsap.from('.hero-cta-row',       { opacity: 0, y: 16, duration: 0.50, ease: 'power3.out', delay: 0.55 })
      gsap.from('.hero-trust-chips',   { opacity: 0, y: 12, duration: 0.45, ease: 'power3.out', delay: 0.65 })
      gsap.from('.hero-car-card',      { opacity: 0, y: 24, duration: 0.65, ease: 'power3.out', delay: 0.25 })
      gsap.from('.hero-side-nav',      { opacity: 0, x: 20, duration: 0.60, ease: 'power3.out', delay: 0.30 })
      gsap.from('.hero-arrow-btn',     { opacity: 0, scale: 0.88, duration: 0.40, stagger: 0.10, ease: 'back.out(1.4)', delay: 0.50 })
    })
    return () => ctx.revert()
  }, [])

  /* ── SCROLL REVEALS (CSS transitions + IntersectionObserver) ─────── */
  useEffect(() => {
    const groups = [
      ['.trust-item', '.models-title', '.models-filters', '.wyg-head',
       '.vt-head', '.faq-head', '.final-cta-inner', '.quiz-left', '.quiz-box'],
      ['.wyg-cell', '.vt-card', '.loc-inner > *',
       '.footer-row', '.footer-meta', '.footer-logo'],
    ]

    const all = []
    groups[0].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.dataset.anim = '1'
        all.push(el)
      })
    })
    groups[1].forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.dataset.anim = '1'
        if (i > 0) el.dataset.animDelay = Math.min(i, 5)
        all.push(el)
      })
    })

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('anim-in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.05 })

    all.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* ── CAR CARDS (re-animates on filter change) ─────────────────────── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (cardCtxRef.current) cardCtxRef.current.revert()

      const cards = gsap.utils.toArray('.mcard')
      const shots = gsap.utils.toArray('.mcard .shot')
      if (!cards.length) return

      cardCtxRef.current = gsap.context(() => {
        gsap.from(cards, { opacity: 0, y: 20, duration: 0.35, stagger: 0.05, ease: 'power2.out' })
      })
    })

    return () => cancelAnimationFrame(raf)
  }, [filter])

  /* ── Derived state ───────────────────────────────────────────────── */
  const visibleCars = catalogCars.filter(c => {
    if (filter === 'all')       return true
    if (filter === 'bmw')       return c.brand === 'bmw'
    if (filter === 'mercedes')  return (c.brand || '').includes('mercedes')
    if (filter === 'electric')  return c.fuelType === 'electric'
    if (filter === 'hybrid')    return c.fuelType === 'hybrid'
    if (filter === 'financing') return c.financing
    if (filter === 'warranty')  return c.warranty
    return true
  })
  const hero = heroSlides[Math.min(heroIdx, heroSlides.length - 1)] ?? heroSlides[0]

  return (
    <div className="page" id="page">

      {/* 1. HEADER */}
      <Navbar
        onCta={() => setModal(true)}
        onSearch={() => setSrch({ open: true, query: '' })}
      />

      {/* 2. CTA BANNER */}
      <section className="hero" id="top">
        <div className="hero-stage" id="heroStage">

          {heroSlides.map((slide, i) => (
            <div key={i} className={`hero-slide${heroIdx === i ? ' active' : ''}`}>
              <div className="img" style={{ backgroundImage: `url('${slide.bgImage}')` }} />
            </div>
          ))}

          <div className="hero-side-nav">
            <div className="hero-menu">
              {heroSlides.map((slide, i) => (
                <div
                  key={i}
                  className={`hero-thumb${heroIdx === i ? ' active' : ''}`}
                  style={{ backgroundImage: `url('${slide.bgImage}')` }}
                  onClick={() => setHero(i)}
                />
              ))}
            </div>
            <div className="hero-arrows-row">
              <button className="arrow-btn hero-arrow-btn" aria-label="Previous" onClick={() => setHero(heroIdx - 1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m15 5-7 7 7 7"/></svg>
              </button>
              <button className="arrow-btn hero-arrow-btn" aria-label="Next" onClick={() => setHero(heroIdx + 1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m9 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Mobile-only slide nav */}
          <div className="hero-mobile-nav">
            <button className="hero-mob-arrow" aria-label="Previous" onClick={() => setHero(heroIdx - 1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 5-7 7 7 7"/></svg>
            </button>
            <div className="hero-mob-dots">
              {heroSlides.map((_, i) => (
                <button key={i} className={`hero-mob-dot${heroIdx === i ? ' active' : ''}`} onClick={() => setHero(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
            <button className="hero-mob-arrow" aria-label="Next" onClick={() => setHero(heroIdx + 1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
            </button>
          </div>

          <div className="hero-body"
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (touchStartX.current === null) return
              const dx = e.changedTouches[0].clientX - touchStartX.current
              touchStartX.current = null
              if (Math.abs(dx) < 50) return
              setHero(dx < 0 ? heroIdx + 1 : heroIdx - 1)
            }}
          >
            <div className="hero-body-left">
              <div className="hero-eyebrow-line">{t.hero.eyebrow}</div>
              <h1>{t.hero.h1.split('\n').map((l,i,a) => <span key={i}>{l}{i<a.length-1&&<br/>}</span>)}</h1>
              <p className="hero-body-desc">{t.hero.desc}</p>
              <div className="hero-specs">
                <div className="spec"><div className="small">{t.hero.specRange}</div><div className="v">{hero.range}</div></div>
                <div className="spec"><div className="small">{t.hero.specPower}</div><div className="v">{hero.hp}</div></div>
                <div className="spec"><div className="small">{t.hero.specYear}</div><div className="v">{hero.year}</div></div>
              </div>
              <div className="hero-cta-row">
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  {t.hero.cta1}
                  <BtnArrow />
                </button>
                <button className="btn hero-btn-ghost" onClick={() => setModal(true)}>
                  {t.hero.cta2}
                </button>
              </div>
              <div className="hero-trust-chips">
                <span>{t.hero.chip1}</span>
                <span>{t.hero.chip2}</span>
                <span>{t.hero.chip3}</span>
                <span>{t.hero.chip4}</span>
                <span>{t.hero.chip5}</span>
              </div>
            </div>

            <div className="hero-body-right">
              <div className="hero-car-card">
                <div className="hero-car-label">Featured</div>
                <div className="hero-car-model">{hero.title}</div>
                <div className="hero-car-price">{hero.price}</div>
                <div className="hero-car-badges">
                  {hero.warranty  && <span>Warranty Available</span>}
                  {hero.financing && <span>Financing Available</span>}
                  <span>Battery Health Checked</span>
                </div>
                <Link className="hero-car-link" to={`/car/${hero.id}`}>
                  Ask About This Car <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="wrap">
          <div className="trust-items">
            <div className="trust-item">
              <span className="trust-num">BMW & Mercedes</span>
              Electric & Hybrid
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="trust-num">Stock + Import</span>
              From Germany
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="trust-num">{t.trust.warranty}</span>
              {t.trust.warrantyDesc}
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="trust-num">{t.trust.financing}</span>
              {t.trust.financingDesc}
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="trust-num">{t.trust.portugal}</span>
              {t.trust.portugalDesc}
            </div>
          </div>
        </div>
      </div>

      {/* 3. AVAILABLE CARS */}
      <section className="models" id="models">
        <div className="wrap">
          <div className="models-title">
            <span className="eyebrow">{t.models.eyebrow}</span>
            <h2 className="h2" style={{ marginTop: '12px' }}>{t.models.h2}</h2>
            <p className="models-desc">{t.models.desc}</p>
          </div>
          <div className="models-filters-wrap" onScroll={() => setSwipeHinted(true)}>
            <div className="models-filters">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`filter-chip${filter === f ? ' active' : ''}`}
                  onClick={() => { setFilter(f); setSwipeHinted(true) }}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
            {!swipeHinted && (
              <div className="swipe-hint" aria-hidden="true">
                <svg className="swipe-hint-finger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11V6a2 2 0 1 1 4 0v5"/>
                  <path d="M13 10a2 2 0 1 1 4 0v3"/>
                  <path d="M17 13a2 2 0 1 1 4 0v2a6 6 0 0 1-6 6H9a6 6 0 0 1-5.2-3L2 14"/>
                  <path d="M5 14a2 2 0 0 1 4 0"/>
                </svg>
                <span>{t.models.swipeHint}</span>
              </div>
            )}
          </div>
          <div className="models-grid">
            {visibleCars.length === 0
              ? (
                <div className="models-empty">
                  <p>{t.models.emptyText}</p>
                  <button className="btn btn-primary" style={{ margin: '16px auto 0', display: 'flex' }} onClick={() => setModal(true)}>
                    {t.models.emptyCta}
                    <BtnArrow />
                  </button>
                </div>
              )
              : visibleCars.map((car, i) => (
                <Fragment key={car.id}>
                  <CarCard car={car} />
                  {i === 3 && visibleCars.length > 4 && (
                    <div className="catalog-stripe" id="import">
                      <div className="cs-content">
                        <strong className="cs-heading">{t.stripe.heading}</strong>
                        <span className="cs-text">{t.stripe.text}</span>
                      </div>
                      <div className="cs-btns">
                        <button className="btn btn-primary cs-btn" onClick={() => setModal(true)}>
                          {t.stripe.cta1}
                          <BtnArrow />
                        </button>
                        <button className="btn cs-btn-sec" onClick={() => setModal(true)}>
                          {t.stripe.cta2}
                        </button>
                      </div>
                    </div>
                  )}
                </Fragment>
              ))
            }
          </div>
        </div>
      </section>

      {/* 4. QUIZ */}
      <Quiz />

      {/* 5. WHAT YOU GET */}
      <section className="what-you-get" id="financing">
        <div className="wrap">
          <div className="wyg-head">
            <span className="eyebrow">{t.wyg.eyebrow}</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>{t.wyg.h2}</h2>
            <p className="wyg-sub">{t.wyg.sub}</p>
          </div>
          <div className="wyg-grid wyg-grid-3">
            {[
              <svg key={0} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8h24l4 8H8l4-8Z"/><rect x="8" y="16" width="32" height="24" rx="2"/><path d="M20 28h8M24 24v8"/></svg>,
              <svg key={1} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M24 4 6 10v14c0 11 8 19 18 22 10-3 18-11 18-22V10L24 4Z"/><path d="m16 24 6 6 12-12"/></svg>,
              <svg key={2} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="14" width="36" height="24" rx="2"/><path d="M6 22h36M14 30h6"/></svg>,
              <svg key={3} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 20h24l-6-6M40 28H16l6 6"/></svg>,
              <svg key={4} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="20" r="10"/><path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16"/><path d="M30 16l4 4-8 8"/></svg>,
              <svg key={5} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="24" r="10"/><path d="M24 14v4M24 30v4M14 24h4M30 24h4"/></svg>,
              <svg key={6} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="10" width="32" height="28" rx="2"/><path d="M16 20h16M16 27h10"/></svg>,
              <svg key={7} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="10" y="8" width="28" height="34" rx="2"/><path d="M16 18h16M16 25h16M16 32h10"/><path d="M32 36l4 4 6-6" strokeWidth="2"/></svg>,
              <svg key={8} viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 32c6 0 10-4 18-4s12 4 18 4"/><path d="M10 24l4-8h20l4 8"/><rect x="8" y="32" width="32" height="8" rx="2"/></svg>,
            ].map((icon, i) => (
              <div key={i} className="wyg-cell">
                <div className="wyg-icon">{icon}</div>
                <h3>{t.wyg.cells[i].h}</h3>
                <p>{t.wyg.cells[i].p}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              {t.wyg.cta}
              <BtnArrow />
            </button>
          </div>
        </div>
      </section>

      {/* 6. VIDEO TESTIMONIALS */}
      <section className="video-testi" id="reviews">
        <div className="wrap">
          <div className="vt-head">
            <span className="eyebrow">{t.reviews.eyebrow}</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>{t.reviews.h2}</h2>
            <p className="vt-sub">{t.reviews.sub}</p>
          </div>
          <div className="vt-grid">
            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/review-1.jpg')" }}>
                <div className="vt-badge">Mercedes-Benz · Lisboa</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">{t.reviews.r1title}</div>
                <p className="vt-quote">{t.reviews.r1quote}</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">R</div>
                  <div>
                    <div className="vt-name">R. &amp; A. M.</div>
                    <div className="vt-loc">Lisboa, Portugal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/review-2.jpg')" }}>
                <div className="vt-badge">BMW · Porto</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">{t.reviews.r2title}</div>
                <p className="vt-quote">{t.reviews.r2quote}</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">D</div>
                  <div>
                    <div className="vt-name">D. F.</div>
                    <div className="vt-loc">Porto, Portugal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/review-3.jpg')" }}>
                <div className="vt-badge">BMW 3 · Setúbal</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">{t.reviews.r3title}</div>
                <p className="vt-quote">{t.reviews.r3quote}</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">M</div>
                  <div>
                    <div className="vt-name">M. &amp; J. P.</div>
                    <div className="vt-loc">Setúbal, Portugal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/review-4.jpg')" }}>
                <div className="vt-badge">Mercedes-Benz · Cascais</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">{t.reviews.r4title}</div>
                <p className="vt-quote">{t.reviews.r4quote}</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">S</div>
                  <div>
                    <div className="vt-name">S. C.</div>
                    <div className="vt-loc">Cascais, Portugal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="vt-cta">
            <p>{t.reviews.ctaLabel}</p>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              {t.reviews.cta}
              <BtnArrow />
            </button>
          </div>
        </div>
      </section>

      {/* 7. LOCATION */}
      <section className="location" id="location">
        <div className="wrap">
          <div className="loc-inner">
            <div className="loc-info">
              <span className="eyebrow">{t.location.eyebrow}</span>
              <h2 className="h2" style={{ marginTop: '12px' }}>{t.location.h2}</h2>
              <p className="loc-sub">{t.location.sub}</p>
              <div className="loc-details">
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7Z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  <span>CM1024, 2870-549 Montijo, Portugal</span>
                </div>
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"/>
                  </svg>
                  <a href="tel:+351928363003">+351 928 363 003</a>
                </div>
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span>Seg – Sáb: 9:00 – 19:00 · Dom: encerrado</span>
                </div>
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/>
                    <path d="m22 6-10 7L2 6"/>
                  </svg>
                  <a href="mailto:info@turboeagle.pt">info@turboeagle.pt</a>
                </div>
              </div>
              <div className="loc-actions">
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  {t.location.cta1}
                  <BtnArrow />
                </button>
                <a href="https://www.google.com/maps/place/TurboEagle/@38.657597,-8.920668,16z/data=!4m6!3m5!1s0xd193f8c2683ee55:0x122b15549a85798!8m2!3d38.6575973!4d-8.9206682!16s%2Fg%2F11z0wxc208?hl=pt&entry=ttu" target="_blank" rel="noopener noreferrer" className="btn btn-dark">
                  {t.location.cta2}
                </a>
              </div>
            </div>
            <div className="loc-map">
              <iframe
                title="TURBOEAGLE Showroom"
                src="https://maps.google.com/maps?q=38.6575973,-8.9206682&output=embed&hl=pt&z=16"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="faq" id="faq">
        <div className="wrap">
          <div className="faq-head">
            <span className="eyebrow">{t.faq.eyebrow}</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>{t.faq.h2}</h2>
          </div>
          <div className="faq-cols">
            {[t.faq.items.slice(0, 5), t.faq.items.slice(5)].map((col, ci) => (
              <div key={ci} className="faq-list">
                {col.map((item, li) => {
                  const idx = ci * 5 + li
                  return (
                    <div key={idx} className={`faq-item${openFaq === idx ? ' open' : ''}`}>
                      <button
                        className="faq-q"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        aria-expanded={openFaq === idx}
                      >
                        <span>{item.q}</span>
                        <svg className="faq-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>
                      <div className="faq-a">
                        <div className="faq-a-inner">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '16px', fontSize: '15px' }}>{t.faq.stillQ}</p>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              {t.faq.cta}
              <BtnArrow />
            </button>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="final-cta">
        <div className="wrap">
          <div className="final-cta-inner">
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.finalCta.eyebrow}</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px', color: '#fff' }}>
              {t.finalCta.h2.split('\n').map((l,i,a) => <span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
            <p className="final-cta-sub">{t.finalCta.sub}</p>
            <div className="final-cta-points">
              <span>{t.finalCta.p1}</span>
              <span>{t.finalCta.p2}</span>
              <span>{t.finalCta.p3}</span>
              <span>{t.finalCta.p4}</span>
              <span>{t.finalCta.p5}</span>
              <span>{t.finalCta.p6}</span>
            </div>
            <div className="final-cta-btns">
              <button className="btn btn-primary final-cta-main" onClick={() => setModal(true)}>
                {t.finalCta.cta1}
                <BtnArrow />
              </button>
              <a href="#models" className="final-cta-sec">
                {t.finalCta.cta2}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <Footer onCta={() => setModal(true)} />

      {/* MOBILE STICKY CTA */}
      <div className={`sticky-cta${stickyVis ? ' sticky-vis' : ''}`}>
        {scrollPhase === 'top' ? (
          <>
            <Link to="/cars" className="sticky-btn sticky-btn-sec">{t.sticky.catalog}</Link>
            <button className="sticky-btn sticky-btn-pri" onClick={() => setModal(true)}>
              {t.sticky.findMyCar}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 5 7 7-7 7"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <a href="tel:+351928363003" className="sticky-btn sticky-btn-sec">{t.sticky.callUs}</a>
            <button className="sticky-btn sticky-btn-pri" onClick={() => setModal(true)}>
              {t.sticky.findMyCar}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 5 7 7-7 7"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* MODAL */}
      {modal && <Modal onClose={() => setModal(false)} />}

      {/* SEARCH OVERLAY */}
      {srch.open && (
        <div className="search-overlay" onClick={() => setSrch(p => ({ ...p, open: false }))}>
          <button
            className="search-overlay-close"
            onClick={() => setSrch(p => ({ ...p, open: false }))}
            aria-label="Close search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <div className="search-box" onClick={e => e.stopPropagation()}>
            <input
              type="search"
              autoFocus
              placeholder={t.search.placeholder}
              value={srch.query}
              onChange={e => setSrch(p => ({ ...p, query: e.target.value }))}
            />
            <span className="search-box-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
            </span>
          </div>
          <div className="search-results" onClick={e => e.stopPropagation()}>
            {srch.query.trim().length > 1 && searchResults.length === 0 && (
              <div className="search-empty">{t.search.empty} "{srch.query}"</div>
            )}
            {searchResults.map(c => (
              <Link
                key={c.id}
                className="search-result"
                to={`/car/${c.id}`}
                onClick={() => setSrch({ open: false, query: '' })}
              >
                <div className="search-result-img" style={{ backgroundImage: `url('${c.img}')` }} />
                <div>
                  <div className="search-result-name">{c.name}</div>
                  <div className="search-result-tag">{c.tagline}</div>
                </div>
                <div className="search-result-price">${c.price}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/day</span></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TWEAKS PANEL */}
      <div className={`tweaks-panel${editMode ? ' on' : ''}`}>
        <h4>Tweaks</h4>
        <div className="tweaks-row">
          <label>Accent</label>
          <input type="color" value={tweaks.accent}
            onChange={e => pushEdit({ accent: e.target.value })} />
        </div>
        <div className="tweaks-row">
          <label>Ink</label>
          <input type="color" value={tweaks.ink}
            onChange={e => pushEdit({ ink: e.target.value })} />
        </div>
        <div className="tweaks-row">
          <label>Display font</label>
          <select value={tweaks.display}
            onChange={e => { injectFont(e.target.value); pushEdit({ display: e.target.value }) }}>
            <option value="Orbitron">Orbitron</option>
            <option value="Space Grotesk">Space Grotesk</option>
            <option value="Syncopate">Syncopate</option>
            <option value="Archivo">Archivo</option>
          </select>
        </div>
        <div className="tweaks-row">
          <label>Heading size</label>
          <input type="range" min="28" max="56" value={tweaks.h2}
            onChange={e => pushEdit({ h2: +e.target.value })} />
        </div>
        <div className="tweaks-row">
          <label>Radius</label>
          <input type="range" min="0" max="24" value={tweaks.radius}
            onChange={e => pushEdit({ radius: +e.target.value })} />
        </div>
      </div>

    </div>
  )
}
