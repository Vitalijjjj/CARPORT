import { useState, useRef, useEffect } from 'react'
import { useLang } from './lang/LangContext'

function BtnArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function ReviewsSection({ onCta }) {
  const { t } = useLang()
  const [vtIdx, setVtIdx] = useState(0)
  const vtRef = useRef(null)

  useEffect(() => {
    const el = vtRef.current
    if (!el) return
    const cards = Array.from(el.querySelectorAll('.vt-card'))
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
  }, [])

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
          <div className="vt-card">
            <div className="vt-thumb" style={{ backgroundImage: "url('/assets/review-1.jpg')" }}>
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
            <div className="vt-thumb" style={{ backgroundImage: "url('/assets/review-2.jpg')" }}>
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
            <div className="vt-thumb" style={{ backgroundImage: "url('/assets/review-3.jpg')" }}>
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
            <div className="vt-thumb" style={{ backgroundImage: "url('/assets/review-4.jpg')" }}>
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

        <div className="vt-dots">
          {[0, 1, 2, 3].map(i => (
            <button
              key={i}
              className={`vt-dot${vtIdx === i ? ' active' : ''}`}
              onClick={() => scrollToVt(i)}
              aria-label={`Review ${i + 1}`}
            />
          ))}
        </div>

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
