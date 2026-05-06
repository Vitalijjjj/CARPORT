import { useState, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { OLIMP_CARS } from './cars-data'
import { fetchPublicCars } from './publicApi'

import Modal from './Modal'
import Quiz from './Quiz'
import Navbar from './Navbar'
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
  'assets/hero-car.jpg',
  'assets/velox-horizon.jpg',
  'assets/luxora-zenith.jpg',
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
    setHeroIdxRaw((i + heroData.length) % heroData.length)
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

  /* ── HERO ANIMATION (fires once on page load) ────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(
        ['.hero-eyebrow-line', '.hero-body-left h1', '.hero-body-desc',
         '.hero-trust-chips', '.hero-specs .spec', '.hero-cta-row',
         '.hero-car-card'],
        { opacity: 0, y: 24 }
      )
      gsap.set('.hero-side-nav',    { opacity: 0, x: 16 })
      gsap.set('.hero-arrow-btn', { opacity: 0, scale: 0.85 })

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to('.hero-eyebrow-line',    { opacity: 1, y: 0, duration: 0.55              }, 0.10)
        .to('.hero-body-left h1',    { opacity: 1, y: 0, duration: 0.85              }, 0.22)
        .to('.hero-body-desc',       { opacity: 1, y: 0, duration: 0.65              }, 0.42)
        .to('.hero-specs .spec',     { opacity: 1, y: 0, duration: 0.60, stagger: 0.1 }, 0.50)
        .to('.hero-cta-row',         { opacity: 1, y: 0, duration: 0.60              }, 0.65)
        .to('.hero-trust-chips',     { opacity: 1, y: 0, duration: 0.55              }, 0.75)
        .to('.hero-car-card',        { opacity: 1, y: 0, duration: 0.65              }, 0.40)
        .to('.hero-side-nav',        { opacity: 1, x: 0, duration: 0.70              }, 0.30)
        .to('.hero-arrow-btn',       { opacity: 1, scale: 1, duration: 0.45, stagger: 0.10 }, 0.60)
    })

    return () => ctx.revert()
  }, [])

  /* ── SCROLL REVEALS ──────────────────────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {

      function reveal(targets, vars, trigger, start = 'top 98%') {
        gsap.set(targets, { opacity: 0, y: vars.y ?? 20 })
        ScrollTrigger.create({
          trigger, start, once: true,
          onEnter: () => gsap.to(targets, { opacity: 1, y: 0, duration: 0.40, ease: 'power2.out', ...vars }),
        })
      }

      reveal('.trust-item',            { stagger: 0.05 },             '.trust-bar')
      reveal('.models-title',          {},                             '.models')
      reveal('.models-filters',        { delay: 0.06 },               '.models')
      reveal('.quiz-left',             { x: -24, y: 0 },              '.quiz-section')
      reveal('.quiz-box',              { x:  24, y: 0, delay: 0.06 }, '.quiz-section')
      reveal('.wyg-head',              {},                             '.what-you-get')
      reveal('.wyg-cell',              { stagger: 0.05, delay: 0.08 },'.what-you-get')
      reveal('.vt-head',               {},                             '.video-testi')
      reveal('.vt-card',               { stagger: 0.07, delay: 0.06 },'.video-testi')
      reveal('.loc-inner > *',         { stagger: 0.08 },             '.location')
      reveal('.faq-head',              {},                             '.faq')
      reveal('.faq-item',              { stagger: 0.04, delay: 0.06 },'.faq')
      reveal('.final-cta-inner',       {},                             '.final-cta')
      reveal('.footer-top h2.h2',      {},                             '.footer', 'top 99%')
      reveal('.footer-row',            { delay: 0.08 },               '.footer', 'top 99%')
      reveal('.footer-meta',           { delay: 0.14 },               '.footer', 'top 99%')
      reveal('.footer-logo',           { delay: 0.06 },               '.footer', 'top 99%')

      ScrollTrigger.refresh()
    })

    return () => ctx.revert()
  }, [])

  /* ── CAR CARDS (re-animates on filter change) ─────────────────────── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (cardCtxRef.current) cardCtxRef.current.revert()

      const cards = gsap.utils.toArray('.mcard')
      const shots = gsap.utils.toArray('.mcard .shot')
      if (!cards.length) return

      cardCtxRef.current = gsap.context(() => {
        gsap.set(cards, { opacity: 0, y: 20 })
        gsap.to(cards, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' })
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
  const hero = heroData[heroIdx]

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

          {heroImages.map((img, i) => (
            <div key={i} className={`hero-slide${heroIdx === i ? ' active' : ''}`}>
              <div className="img" style={{ backgroundImage: `url('${img}')` }} />
            </div>
          ))}

          <div className="hero-side-nav">
            <div className="hero-menu">
              {heroImages.map((img, i) => (
                <div
                  key={i}
                  className={`hero-thumb${heroIdx === i ? ' active' : ''}`}
                  style={{ backgroundImage: `url('${img}')` }}
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
              {heroImages.map((_, i) => (
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
              <div className="hero-eyebrow-line">Premium Electric & Hybrid · Portugal</div>
              <h1>Electric & Hybrid BMW<br/>and Mercedes-Benz,<br/>Selected for Portugal</h1>
              <p className="hero-body-desc">Vehicles in stock or imported from Germany — with warranty, financing and delivery support.</p>
              <div className="hero-specs">
                <div className="spec"><div className="small">Range</div><div className="v">{hero.range}</div></div>
                <div className="spec"><div className="small">Power</div><div className="v">{hero.hp}</div></div>
                <div className="spec"><div className="small">Year</div><div className="v">{hero.year}</div></div>
              </div>
              <div className="hero-cta-row">
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  View Available Cars
                  <BtnArrow />
                </button>
                <button className="btn hero-btn-ghost" onClick={() => setModal(true)}>
                  Get a Personal Offer
                </button>
              </div>
              <div className="hero-trust-chips">
                <span>Cars in stock</span>
                <span>Import from Germany</span>
                <span>Warranty</span>
                <span>Financing</span>
                <span>Delivery across Portugal</span>
              </div>
            </div>

            <div className="hero-body-right">
              <div className="hero-car-card">
                <div className="hero-car-label">Featured</div>
                <div className="hero-car-model">{hero.title}</div>
                <div className="hero-car-price">{hero.price}</div>
                <div className="hero-car-badges">
                  <span>Warranty Available</span>
                  <span>Financing Available</span>
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
              <span className="trust-num">Warranty</span>
              Options available
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="trust-num">Financing</span>
              Available
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="trust-num">Portugal</span>
              Delivery
            </div>
          </div>
        </div>
      </div>

      {/* 3. AVAILABLE CARS */}
      <section className="models" id="models">
        <div className="wrap">
          <div className="models-title">
            <span className="eyebrow">Available Now</span>
            <h2 className="h2" style={{ marginTop: '12px' }}>Selected Cars in Stock</h2>
            <p className="models-desc">Carefully selected BMW and Mercedes-Benz electric and hybrid vehicles. Every car is chosen for its condition, configuration, market value and long-term ownership potential.</p>
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
                <span>Scroll to see more</span>
              </div>
            )}
          </div>
          <div className="models-grid">
            {visibleCars.length === 0
              ? (
                <div className="models-empty">
                  <p>No cars match this filter — but we can source one for you.</p>
                  <button className="btn btn-primary" style={{ margin: '16px auto 0', display: 'flex' }} onClick={() => setModal(true)}>
                    Request Import from Germany
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
                        <strong className="cs-heading">Looking for a specific BMW or Mercedes?</strong>
                        <span className="cs-text">If the right car is not currently in stock, we can source, inspect and import it from Germany with full documentation support.</span>
                      </div>
                      <div className="cs-btns">
                        <button className="btn btn-primary cs-btn" onClick={() => setModal(true)}>
                          Request Import from Germany
                          <BtnArrow />
                        </button>
                        <button className="btn cs-btn-sec" onClick={() => setModal(true)}>
                          Get a Personal Offer
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
            <span className="eyebrow">What You Get</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>What You Get with Every Purchase</h2>
            <p className="wyg-sub">From vehicle selection to financing, documents and delivery, TURBOEAGLE supports the full process with transparency and attention to detail.</p>
          </div>
          <div className="wyg-grid wyg-grid-3">
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 8h24l4 8H8l4-8Z"/><rect x="8" y="16" width="32" height="24" rx="2"/>
                  <path d="M20 28h8M24 24v8"/>
                </svg>
              </div>
              <h3>Exclusive Stock</h3>
              <p>Premium BMW and Mercedes-Benz electric and hybrid vehicles selected for condition, configuration and value.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M24 4 6 10v14c0 11 8 19 18 22 10-3 18-11 18-22V10L24 4Z"/>
                  <path d="m16 24 6 6 12-12"/>
                </svg>
              </div>
              <h3>Warranty Support</h3>
              <p>Selected vehicles come with warranty options, giving you more confidence after purchase.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="14" width="36" height="24" rx="2"/>
                  <path d="M6 22h36M14 30h6"/>
                </svg>
              </div>
              <h3>Fast Financing</h3>
              <p>We help you understand available financing options and move through the process quickly and clearly.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 20h24l-6-6M40 28H16l6 6"/>
                </svg>
              </div>
              <h3>Trade-In Available</h3>
              <p>Use your current car as part of the payment and make the transition to your next vehicle easier.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="24" cy="20" r="10"/><path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16"/>
                  <path d="M30 16l4 4-8 8"/>
                </svg>
              </div>
              <h3>Import from Germany</h3>
              <p>If the right vehicle is not in stock, we can source it in Germany and manage the process from selection to delivery.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="24" cy="24" r="10"/><path d="M24 14v4M24 30v4M14 24h4M30 24h4"/>
                </svg>
              </div>
              <h3>On-Site Inspection</h3>
              <p>A qualified specialist can inspect the vehicle before purchase to reduce risk and confirm its real condition.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="8" y="10" width="32" height="28" rx="2"/>
                  <path d="M16 20h16M16 27h10"/>
                </svg>
              </div>
              <h3>Transparent Costs</h3>
              <p>We explain the financial side clearly, so you understand the full picture before making a decision.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="10" y="8" width="28" height="34" rx="2"/>
                  <path d="M16 18h16M16 25h16M16 32h10"/>
                  <path d="M32 36l4 4 6-6" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Documents Handled</h3>
              <p>We support the documentation process required to bring and register the vehicle in Portugal.</p>
            </div>
            <div className="wyg-cell">
              <div className="wyg-icon">
                <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 32c6 0 10-4 18-4s12 4 18 4"/>
                  <path d="M10 24l4-8h20l4 8"/><rect x="8" y="32" width="32" height="8" rx="2"/>
                </svg>
              </div>
              <h3>Portugal Delivery</h3>
              <p>Safe and convenient delivery can be arranged across Portugal depending on the vehicle and location.</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              Get a Consultation
              <BtnArrow />
            </button>
          </div>
        </div>
      </section>

      {/* 6. VIDEO TESTIMONIALS */}
      <section className="video-testi" id="reviews">
        <div className="wrap">
          <div className="vt-head">
            <span className="eyebrow">Client Stories</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>Real Clients. Real Experiences.</h2>
            <p className="vt-sub">From available stock to imported vehicles and financing support, see how clients found their electric or hybrid BMW and Mercedes-Benz with TURBOEAGLE.</p>
          </div>
          <div className="vt-grid">
            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/hero-car.jpg')" }}>
                <button className="vt-play" aria-label="Play video" onClick={() => setModal(true)}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M5 4l15 8-15 8V4z"/>
                  </svg>
                </button>
                <div className="vt-badge">BMW i4 · Portugal</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">BMW i4 Delivered in Portugal</div>
                <p className="vt-quote">The client wanted a premium electric car with strong range, warranty support and financing options. We helped find the right BMW i4 and guided the process until delivery.</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">C</div>
                  <div>
                    <div className="vt-name">TURBOEAGLE Client</div>
                    <div className="vt-loc">Lisbon, Portugal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/luxora-zenith.jpg')" }}>
                <button className="vt-play" aria-label="Play video" onClick={() => setModal(true)}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M5 4l15 8-15 8V4z"/>
                  </svg>
                </button>
                <div className="vt-badge">Mercedes-Benz · Financing</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">Mercedes-Benz Hybrid with Financing</div>
                <p className="vt-quote">A client needed a comfortable hybrid Mercedes-Benz with clear financing conditions. We prepared options and helped move the process forward quickly.</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">B</div>
                  <div>
                    <div className="vt-name">Business Client</div>
                    <div className="vt-loc">Porto, Portugal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vt-card">
              <div className="vt-thumb" style={{ backgroundImage: "url('assets/velox-horizon.jpg')" }}>
                <button className="vt-play" aria-label="Play video" onClick={() => setModal(true)}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                    <path d="M5 4l15 8-15 8V4z"/>
                  </svg>
                </button>
                <div className="vt-badge">Import · Germany</div>
              </div>
              <div className="vt-info">
                <div className="vt-stars">★★★★★</div>
                <div className="vt-title">Imported from Germany</div>
                <p className="vt-quote">The right car was not available locally, so we helped source it in Germany, supported the inspection and managed the documentation process.</p>
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">P</div>
                  <div>
                    <div className="vt-name">Private Buyer</div>
                    <div className="vt-loc">Faro, Portugal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="vt-cta">
            <p>Want a similar result?</p>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              Get Your Offer
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
              <span className="eyebrow">Visit Us</span>
              <h2 className="h2" style={{ marginTop: '12px' }}>Visit Our Showroom</h2>
              <p className="loc-sub">Visit our location in Portugal to view available vehicles, discuss financing, evaluate trade-in options or start a custom import request.</p>
              <div className="loc-details">
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7Z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  <span>[Add company address], Portugal</span>
                </div>
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z"/>
                  </svg>
                  <a href="tel:+351000000000">+351 000 000 000</a>
                </div>
                <div className="loc-row">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <span>[Add working hours]</span>
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
                  Book a Visit
                  <BtnArrow />
                </button>
                <a href="https://maps.app.goo.gl/LKGjrHVtnkbQkmzv5?g_st=iw" target="_blank" rel="noopener noreferrer" className="btn btn-dark">
                  Get Directions
                </a>
              </div>
            </div>
            <div className="loc-map">
              <iframe
                title="TURBOEAGLE Showroom"
                src="https://maps.google.com/maps?q=TURBOEAGLE+Comércio+de+Automóveis+Portugal&output=embed&hl=pt"
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
            <span className="eyebrow">FAQ</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>Frequently Asked Questions</h2>
          </div>
          <div className="faq-cols">
            {[FAQ_ITEMS.slice(0, 5), FAQ_ITEMS.slice(5)].map((col, ci) => (
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
            <p style={{ color: 'var(--muted)', marginBottom: '16px', fontSize: '15px' }}>Still have questions?</p>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              Talk to Our Team
              <BtnArrow />
            </button>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="final-cta">
        <div className="wrap">
          <div className="final-cta-inner">
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Get Started</span>
            <h2 className="h2 h2-center" style={{ marginTop: '12px', color: '#fff' }}>
              Ready to Find the Right<br/>BMW or Mercedes?
            </h2>
            <p className="final-cta-sub">
              Tell us what you are looking for and we will help you find the best available option — from our stock or through a custom import from Germany.
            </p>
            <div className="final-cta-points">
              <span>Stock vehicles</span>
              <span>Custom import</span>
              <span>Financing support</span>
              <span>Trade-in available</span>
              <span>Warranty options</span>
              <span>Portugal delivery</span>
            </div>
            <div className="final-cta-btns">
              <button className="btn btn-primary final-cta-main" onClick={() => setModal(true)}>
                Get a Personal Offer
                <BtnArrow />
              </button>
              <a href="#models" className="final-cta-sec">
                View Available Cars
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-brand-name">TURBOEAGLE</div>
              <p className="footer-brand-desc">TURBOEAGLE — Comércio de Automóveis. Helping clients in Portugal buy selected electric and hybrid BMW and Mercedes-Benz vehicles — from stock or imported from Germany.</p>
              <div className="footer-socials">
                <a href="https://www.instagram.com/turboeagle.lda?igsh=MTRxd3l0bjNudDF4Yg%3D%3D" target="_blank" rel="noopener noreferrer" className="footer-social footer-social-ig" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
                <a href="https://www.facebook.com/share/1D3kQ3XXpu/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="footer-social footer-social-fb" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
              <button className="btn btn-invert footer-brand-cta" onClick={() => setModal(true)}>
                Get an Offer
                <BtnArrow />
              </button>
            </div>
            <div className="footer-info">
              <div className="footer-row">
                <div className="footer-col">
                  <span className="footer-col-label">Navigation</span>
                  <a href="#">Home</a>
                  <a href="#models">Cars</a>
                  <a href="#import">Import from Germany</a>
                  <a href="#quiz">Financing</a>
                  <a href="#reviews">Reviews</a>
                  <a href="#location">Location</a>
                  <a href="#faq">FAQ</a>
                </div>
                <div className="footer-col">
                  <span className="footer-col-label">Services</span>
                  <a href="#models">Available Cars</a>
                  <a href="#import">Custom Import</a>
                  <a href="#financing">Financing</a>
                  <a href="#quiz">Trade-In</a>
                  <a href="#models">Warranty Support</a>
                  <a href="#location">Portugal Delivery</a>
                </div>
                <div className="footer-col">
                  <span className="footer-col-label">Contact</span>
                  <a href="tel:+351000000000">+351 000 000 000</a>
                  <a href="mailto:info@turboeagle.pt">info@turboeagle.pt</a>
                  <a href="https://www.instagram.com/turboeagle.lda?igsh=MTRxd3l0bjNudDF4Yg%3D%3D" target="_blank" rel="noopener noreferrer">Instagram</a>
                  <a href="https://www.facebook.com/share/1D3kQ3XXpu/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook</a>
                  <span>Portugal</span>
                </div>
              </div>

              <div className="footer-meta">
                <div className="footer-bottom-left">
                  <span>© TURBOEAGLE — Comércio de Automóveis. All rights reserved.</span>
                </div>
                <div className="footer-bottom-right">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms & Conditions</a>
                  <a href="#">Cookie Policy</a>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-logo">
            <div className="word">TURBOEAGLE</div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className={`sticky-cta${stickyVis ? ' sticky-vis' : ''}`}>
        {scrollPhase === 'top' ? (
          <>
            <a href="#models" className="sticky-btn sticky-btn-sec">View Cars</a>
            <button className="sticky-btn sticky-btn-pri" onClick={() => setModal(true)}>
              Find My Car
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 5 7 7-7 7"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <a href="tel:+351000000000" className="sticky-btn sticky-btn-sec">Call us</a>
            <button className="sticky-btn sticky-btn-pri" onClick={() => setModal(true)}>
              Find My Car
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
              placeholder="Search cars by name, brand, category…"
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
              <div className="search-empty">No cars found for "{srch.query}"</div>
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
