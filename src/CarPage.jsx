import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchPublicCar, fetchPublicCars } from './publicApi'
import Modal from './Modal'
import Navbar from './Navbar'
import Footer from './Footer'
import ReviewsSection from './ReviewsSection'
import { useLang } from './lang/LangContext'
import './CarPage.css'

const ICON_CALENDAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`
const ICON_SPEED    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 12 8.5 8.5"/><circle cx="12" cy="12" r="9"/><path d="M16.5 7.5a7 7 0 0 1 1.5 4.5"/></svg>`
const ICON_MILEAGE  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>`
const ICON_BOLT     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13H12l-1 9 8.5-11H12l1-9z"/></svg>`
const ICON_GEARBOX  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="6" cy="7" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/><path d="M6 9v6M12 9v3M18 9v6"/></svg>`
const ICON_ROAD     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21 9 3M19 21 15 3M9 9h6M8 15h8"/></svg>`

function imgUrl(src) {
  if (!src) return ''
  if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('http')) return src
  return `/${src}`
}

function ytId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

const ICON_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)"/><polygon points="9.5,7 18,12 9.5,17" fill="white"/></svg>`

function Lightbox({ items, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx)
  const prev = () => setIdx(i => (i - 1 + items.length) % items.length)
  const next = () => setIdx(i => (i + 1) % items.length)

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [idx])

  const cur = items[idx]

  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-inner" onClick={e => e.stopPropagation()}>
        <button className="lb-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        {cur.type === 'video' ? (
          <iframe
            className="lb-video"
            src={`https://www.youtube.com/embed/${cur.id}?autoplay=1`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video"
          />
        ) : (
          <img src={cur.src} alt="" className="lb-img" />
        )}
        {items.length > 1 && (
          <>
            <button className="lb-btn lb-prev" onClick={prev} aria-label="Previous">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 5-7 7 7 7"/></svg>
            </button>
            <button className="lb-btn lb-next" onClick={next} aria-label="Next">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 5 7 7-7 7"/></svg>
            </button>
          </>
        )}
        <div className="lb-counter">{idx + 1} / {items.length}</div>
      </div>
    </div>
  )
}

function useFuelLabel() {
  const { t } = useLang()
  return (ft) => {
    if (!ft) return ''
    if (ft === 'electric') return t.car.electric
    if (ft === 'plug-in hybrid' || ft === 'hybrid') return t.car.hybrid
    if (ft === 'petrol') return t.car.petrol
    if (ft === 'diesel') return t.car.diesel
    return ft.charAt(0).toUpperCase() + ft.slice(1)
  }
}

function ImageSlider({ items, onOpenLightbox }) {
  const [idx, setIdx] = useState(0)
  const [touchX, setTouchX] = useState(null)

  const prev = () => setIdx(i => (i - 1 + items.length) % items.length)
  const next = () => setIdx(i => (i + 1) % items.length)

  if (!items.length) {
    return (
      <div className="slider-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
        <span>Photos coming soon</span>
      </div>
    )
  }

  const cur = items[idx]

  return (
    <div className="img-slider">
      <div
        className="slider-main"
        onTouchStart={e => setTouchX(e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touchX === null) return
          const d = touchX - e.changedTouches[0].clientX
          if (Math.abs(d) > 50) d > 0 ? next() : prev()
          setTouchX(null)
        }}
      >
        {cur.type === 'video' ? (
          <div className="slider-video-wrap" onClick={() => onOpenLightbox(idx)}>
            <img
              src={`https://img.youtube.com/vi/${cur.id}/maxresdefault.jpg`}
              alt="Video"
              className="slider-img"
              onError={e => { e.target.src = `https://img.youtube.com/vi/${cur.id}/hqdefault.jpg` }}
            />
            <div className="slider-play-btn">
              <svg viewBox="0 0 72 72" width="72" height="72"><circle cx="36" cy="36" r="36" fill="rgba(0,0,0,0.55)"/><polygon points="28,20 56,36 28,52" fill="white"/></svg>
            </div>
          </div>
        ) : (
          <img
            key={idx}
            src={cur.src}
            alt=""
            className="slider-img slider-img--click"
            onClick={() => onOpenLightbox(idx)}
          />
        )}
        {items.length > 1 && (
          <>
            <button className="sl-btn sl-prev" onClick={prev} aria-label="Previous">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 5-7 7 7 7"/></svg>
            </button>
            <button className="sl-btn sl-next" onClick={next} aria-label="Next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 5 7 7-7 7"/></svg>
            </button>
            <div className="sl-counter">{idx + 1} / {items.length}</div>
          </>
        )}
      </div>
      {items.length > 1 && (
        <div className="slider-thumbs">
          {items.slice(0, 8).map((item, i) => (
            <button key={i} className={`sl-thumb${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)}>
              {item.type === 'video' ? (
                <div className="sl-thumb-video">
                  <img src={`https://img.youtube.com/vi/${item.id}/mqdefault.jpg`} alt="" />
                  <span className="sl-thumb-play">▶</span>
                </div>
              ) : (
                <img src={item.src} alt="" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CarPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { t, lang } = useLang()
  const fuelLabel  = useFuelLabel()

  const [car,       setCar]       = useState(null)
  const [similar,   setSimilar]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [lightbox,  setLightbox]  = useState(null)

  useEffect(() => {
    setLoading(true)
    setCar(null)
    setSimilar([])
    fetchPublicCar(id)
      .then(data => {
        setCar(data)
        return fetchPublicCars().then(all => {
          const others = all.filter(c => c.id !== data.id)
          setSimilar([...others].sort(() => Math.random() - 0.5).slice(0, 2))
        })
      })
      .catch(() => navigate('/cars', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading || !car) {
    return (
      <div className="page">
        <Navbar onCta={() => {}} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:12, color:'#888' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation:'cat-spin 0.8s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Loading…
        </div>
      </div>
    )
  }

  const videoId   = ytId(car.youtube_url)
  const allMedia  = [
    ...(videoId ? [{ type: 'video', id: videoId }] : []),
    ...[car.img, ...car.gallery].filter(Boolean).map(src => ({ type: 'image', src: imgUrl(src) })),
  ]
  const description = (lang === 'en' && car.full_description_en) ? car.full_description_en
                    : (lang === 'uk' && car.full_description_uk) ? car.full_description_uk
                    : car.description
  const equipment   = (lang === 'en' && car.equipment_en?.length) ? car.equipment_en
                    : (lang === 'uk' && car.equipment_uk?.length) ? car.equipment_uk
                    : (car.equipment?.length ? car.equipment : car.features)
  const isAvailable = car.status !== 'reserved' && car.status !== 'sold'
  const isEv        = car.fuelType === 'electric' || car.fuelType?.includes('hybrid')

  const specs = [
    { icon: ICON_CALENDAR, label: t.car.year,    value: car.year },
    { icon: ICON_BOLT,     label: t.car.fuel,    value: fuelLabel(car.fuelType) },
    { icon: ICON_MILEAGE,  label: t.car.mileage, value: car.mileage },
    { icon: ICON_SPEED,    label: t.car.power,   value: car.hp },
    car.range      ? { icon: ICON_BOLT,   label: t.car.evRange, value: car.range }      : null,
    car.drivetrain ? { icon: ICON_ROAD,   label: t.car.drive,   value: car.drivetrain } : null,
    { icon: ICON_GEARBOX,  label: t.car.gearbox, value: car.gearbox },
  ].filter(s => s && s.value)

  return (
    <div className="page">
      <Navbar onCta={() => setModal(true)} />

      <div className="wrap">
        <div className="crumb">
          <Link to="/">Home</Link> / <Link to="/cars">Catalog</Link> / <span>{car.name}</span>
        </div>
      </div>

      {/* ── TOP ── */}
      <section className="top">
        <div className="wrap">
          <div className="top-grid">

            {/* Slider */}
            <ImageSlider items={allMedia} onOpenLightbox={i => setLightbox(i)} />
            {lightbox !== null && (
              <Lightbox items={allMedia} startIdx={lightbox} onClose={() => setLightbox(null)} />
            )}

            {/* Info */}
            <div className="info">

              {/* Status + fuel badges */}
              <div className="badge-row">
                <span className={`status-badge ${isAvailable ? 'status-ok' : 'status-rsv'}`}>
                  <span className="sdot" />
                  {isAvailable ? t.car.available : t.car.reserved}
                </span>
                {isEv && (
                  <span className="fuel-badge">⚡ {fuelLabel(car.fuelType)}</span>
                )}
              </div>

              <h1>{car.name}</h1>
              {car.tagline && <div className="tagline">{car.tagline}</div>}

              {/* Specs */}
              <div className="specs-grid">
                {specs.map(s => (
                  <div key={s.label} className="spec-item">
                    <span className="spec-ic" dangerouslySetInnerHTML={{ __html: s.icon }} />
                    <div>
                      <span className="spec-label">{s.label}</span>
                      <span className="spec-value">{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="price-row">
                <span className="big">€ {car.price?.toLocaleString('de-DE')}</span>
              </div>

              {/* Benefit badges */}
              {(car.financing || car.warranty) && (
                <div className="benefit-row">
                  {car.financing && <span className="benefit">✓ {t.car.financingAvailable}</span>}
                  {car.warranty  && <span className="benefit">✓ {t.car.warrantyAvailable}</span>}
                </div>
              )}

              {/* CTA */}
              <div className="cta-row">
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  {t.car.requestInfo}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
                </button>
                <div className="book-by">
                  <span className="k">{t.car.orByCall}</span>
                  <a href="tel:+351928363003" className="v phone-link">+351 928 363 003</a>
                </div>
              </div>

              {/* Urgency */}
              <div className="urgency-badge">
                <span className="urgency-dot" />
                2 {t.car.viewingNow}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESCRIPTION ── */}
      {description && (
        <section className="about-sec">
          <div className="wrap about-wrap">
            <div>
              <h2>{t.car.aboutTitle}</h2>
              <p className="about-text">{description}</p>
            </div>
            {/* Mini specs sidebar */}
            <div className="about-sidebar">
              {specs.map(s => (
                <div key={s.label} className="sb-row">
                  <span className="sb-label">{s.label}</span>
                  <span className="sb-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EQUIPMENT ── */}
      {equipment.length > 0 && (
        <section className="equip-sec">
          <div className="wrap">
            <h2>{t.car.equipTitle}</h2>
            <div className="equip-grid">
              {equipment.map((f, i) => (
                <div key={i} className="eq-item">
                  <span className="eq-tick">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10"/></svg>
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── POST CTA ── */}
      <div className="wrap">
        <div className="post-gallery-cta">
          <div>
            <p className="pgc-title">{t.car.interestedTitle}</p>
            <p className="pgc-sub">{t.car.interestedSub}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            {t.car.requestInfo}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {/* ── REVIEWS ── */}
      <ReviewsSection onCta={() => setModal(true)} />

      {/* ── SIMILAR ── */}
      {similar.length > 0 && (
        <section className="similar">
          <div className="wrap">
            <h2>{t.car.similarTitle}</h2>
            <div className="similar-grid">
              {similar.map(c => {
                const cImg = imgUrl(c.img)
                return (
                  <Link key={c.id} className="mcard" to={`/car/${c.id}`}>
                    <div className="shot" style={{ backgroundImage: cImg ? `url('${cImg}')` : 'none' }} />
                    <div>
                      <div className="row-name">
                        <div>
                          <h3>{c.name}</h3>
                          <div className="sub">{c.tagline}</div>
                        </div>
                        <div className="price">€ {c.price?.toLocaleString('de-DE')}</div>
                      </div>
                      <div className="stats">
                        <div className="mstat">
                          <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_CALENDAR }} />
                          <div><span className="k">{t.car.year}</span><span className="v">{c.year}</span></div>
                        </div>
                        <div className="mstat">
                          <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_GEARBOX }} />
                          <div><span className="k">{t.car.gearbox}</span><span className="v">{c.gearbox}</span></div>
                        </div>
                        <div className="mstat">
                          <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_MILEAGE }} />
                          <div><span className="k">{t.car.mileage}</span><span className="v">{c.mileage}</span></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <Footer onCta={() => setModal(true)} />

      {/* ── MOBILE STICKY ── */}
      <div className="car-sticky-cta">
        <div className="car-sticky-price">€ {car.price?.toLocaleString('de-DE')}</div>
        <button className="car-sticky-btn" onClick={() => setModal(true)}>
          {t.car.requestInfo}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
        </button>
      </div>

      {modal && <Modal onClose={() => setModal(false)} carName={car.name} />}
    </div>
  )
}
