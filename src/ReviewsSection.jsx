import { useState, useRef, useEffect } from 'react'
import { useLang } from './lang/LangContext'
import { fetchPublicReviews } from './publicApi'

function BtnArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Stars({ rating = 5 }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0))
  return <div className="vt-stars">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</div>
}

function avatarChar(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

export default function ReviewsSection({ onCta }) {
  const { t, lang } = useLang()
  const [vtIdx, setVtIdx] = useState(0)
  const [dbReviews, setDbReviews] = useState(null) // null = loading/unknown
  const vtRef = useRef(null)

  // Fetch managed reviews for the active language; fall back to static ones on empty/error
  useEffect(() => {
    let alive = true
    fetchPublicReviews(lang)
      .then(data => { if (alive) setDbReviews(Array.isArray(data) ? data : []) })
      .catch(() => { if (alive) setDbReviews([]) })
    return () => { alive = false }
  }, [lang])

  // Static fallback reviews (used when no managed reviews exist)
  const staticReviews = [
    { name: 'R. & A. M.', location: 'Lisboa, Portugal', badge: 'Mercedes-Benz · Lisboa', image: '/assets/review-1.jpg', rating: 5, title: t.reviews.r1title, quote: t.reviews.r1quote },
    { name: 'D. F.',      location: 'Porto, Portugal',   badge: 'BMW · Porto',           image: '/assets/review-2.jpg', rating: 5, title: t.reviews.r2title, quote: t.reviews.r2quote },
    { name: 'M. & J. P.', location: 'Setúbal, Portugal', badge: 'BMW 3 · Setúbal',       image: '/assets/review-3.jpg', rating: 5, title: t.reviews.r3title, quote: t.reviews.r3quote },
    { name: 'S. C.',      location: 'Cascais, Portugal', badge: 'Mercedes-Benz · Cascais', image: '/assets/review-4.jpg', rating: 5, title: t.reviews.r4title, quote: t.reviews.r4quote },
  ]

  const reviews = (dbReviews && dbReviews.length > 0) ? dbReviews : staticReviews

  // Track the active card for the dots
  useEffect(() => {
    const el = vtRef.current
    if (!el) return
    const cards = Array.from(el.querySelectorAll('.vt-card'))
    if (!cards.length) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= 0.5)
            setVtIdx(cards.indexOf(e.target))
        })
      },
      { root: el, threshold: 0.5 }
    )
    cards.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [reviews.length])

  function scrollToVt(i) {
    const el = vtRef.current
    if (!el) return
    el.querySelectorAll('.vt-card')[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  return (
    <section className="video-testi" id="reviews">
      <div className="wrap">
        <div className="vt-head">
          <span className="eyebrow">{t.reviews.eyebrow}</span>
          <h2 className="h2 h2-center" style={{ marginTop: '12px' }}>{t.reviews.h2}</h2>
          <p className="vt-sub">{t.reviews.sub}</p>
        </div>

        <div className="vt-grid" ref={vtRef}>
          {reviews.map((rev, i) => (
            <div className="vt-card" key={rev.id ?? i}>
              <div
                className="vt-thumb"
                style={rev.image ? { backgroundImage: `url('${rev.image}')` } : undefined}
              >
                {rev.badge && <div className="vt-badge">{rev.badge}</div>}
              </div>
              <div className="vt-info">
                <Stars rating={rev.rating} />
                {rev.title && <div className="vt-title">{rev.title}</div>}
                {rev.quote && <p className="vt-quote">{rev.quote}</p>}
                <div className="vt-author">
                  <div className="vt-avatar-placeholder">{avatarChar(rev.name)}</div>
                  <div>
                    <div className="vt-name">{rev.name}</div>
                    {rev.location && <div className="vt-loc">{rev.location}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length > 1 && (
          <div className="vt-dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                className={`vt-dot${vtIdx === i ? ' active' : ''}`}
                onClick={() => scrollToVt(i)}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        )}

        {onCta && (
          <div className="vt-cta">
            <p>{t.reviews.ctaLabel}</p>
            <button className="btn btn-primary" onClick={onCta}>
              {t.reviews.cta}
              <BtnArrow />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
