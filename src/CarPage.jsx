import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { OLIMP_CARS } from './cars-data'
import Modal from './Modal'
import './CarPage.css'

const ICON_SEAT    = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8h12c2 0 3 1 3 3v9H9v-9c0-2 1-3 3-3Z"/><path d="M9 20v8h18v-8"/><path d="M7 28h22"/></svg>`
const ICON_GEARBOX = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="12" r="2.5"/><circle cx="20" cy="12" r="2.5"/><circle cx="30" cy="12" r="2.5"/><circle cx="10" cy="28" r="2.5"/><circle cx="30" cy="28" r="2.5"/><path d="M10 14.5v11M20 14.5v6M30 14.5v11"/></svg>`
const ICON_LUGGAGE = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><rect x="11" y="12" width="18" height="20" rx="2"/><path d="M16 12V8h8v4"/><path d="M11 18h18M11 26h18"/></svg>`

const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>`

const TERMS = [
  {
    title: 'Insurance and Coverage',
    panels: [
      ['Basic insurance', 'All vehicles include basic insurance covering third-party liability.'],
      ['Additional coverage', 'Optional coverage includes Collision Damage Waiver (CDW) from $15 per day and Personal Accident Insurance (PAI), available at purchase of rental.'],
      ['Excess Fees', 'In the event of an accident, the customer is responsible for the excess fee up to their selected coverage tier.'],
    ],
  },
  {
    title: 'Rental Requirements',
    panels: [
      ['Age', 'Renters must be at least 21 years old. A young-driver surcharge applies to drivers under 25.'],
      ['Documents', 'Valid driver\'s licence (held for at least 1 year), government ID, and a credit card in the renter\'s name.'],
      ['Security deposit', 'A refundable deposit is pre-authorised on your card at pickup; released within 7 days after return.'],
    ],
  },
  {
    title: 'Cancellation Policy',
    panels: [
      ['Free cancellation', 'Free cancellation up to 48 hours before your scheduled pickup.'],
      ['Late cancellation', 'Cancellations within 48 hours are charged one full rental day.'],
      ['No-show', 'No-show bookings are charged the full reservation total.'],
    ],
  },
]

export default function CarPage() {
  const { id } = useParams()
  const car = OLIMP_CARS.find(c => c.id === id) || OLIMP_CARS[0]

  const [activeTab, setActiveTab] = useState(0)
  const [modal,     setModal]     = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  const similar = useMemo(() => {
    const others = OLIMP_CARS.filter(c => c.id !== car.id)
    const shuffled = [...others].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 2)
  }, [car.id])

  const term = TERMS[activeTab]

  return (
    <div className="page">

      {/* NAV */}
      <nav className="car-nav">
        <div className="nav-inner">
          <div className="nav-left">
            <button className="nav-burger" aria-label="Menu" onClick={() => setMenuOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
            <Link to="/">Home</Link>
            <Link to="/#about">About</Link>
            <Link to="/#models" className="active">Models</Link>
            <Link to="/#blog">Blog</Link>
            <Link to="/#contact">Contact</Link>
          </div>
          <Link className="nav-logo" to="/">OLIMP CARS</Link>
          <div className="nav-right">
            <Link to="/#contact">Contact</Link>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-head">
            <Link className="mobile-menu-logo" to="/" onClick={() => setMenuOpen(false)}>OLIMP CARS</Link>
            <button className="mobile-menu-close" aria-label="Close" onClick={() => setMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="mobile-menu-links">
            <Link to="/"         onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/#about"   onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/#models"  onClick={() => setMenuOpen(false)}>Models</Link>
            <Link to="/#blog"    onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link to="/#contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          </div>
          <button className="btn btn-primary mobile-menu-cta" onClick={() => { setMenuOpen(false); setModal(true) }}>
            Submit a request
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      )}

      {/* BREADCRUMB */}
      <div className="wrap">
        <div className="crumb">
          <Link to="/">Home</Link> / <Link to="/#models">Models</Link> / <span>{car.name}</span>
        </div>
      </div>

      {/* TOP */}
      <section className="top">
        <div className="wrap">
          <div className="top-grid">
            <div
              className="big-image"
              style={{ backgroundImage: `url('/${car.img}')` }}
            />

            <div className="info">
              <div className="year">{car.drivetrain} · {car.year}</div>
              <h1>{car.name}</h1>
              <div className="tagline">{car.tagline}</div>
              <div className="urgency-badge">
                <span className="urgency-dot" />
                2 people are viewing this car right now
              </div>
              <p className="desc">{car.description}</p>

              <div className="price-row">
                <span className="big">${car.price}</span>
                <span className="per">/Per {car.priceUnit}</span>
              </div>

              <div className="cta-row">
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  Book now
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 5 7 7-7 7"/>
                  </svg>
                </button>
                <div className="book-by">
                  <span className="k">Or by call</span>
                  <a href="tel:+11234567890" className="v phone-link">+1 (123) 456-7890</a>
                </div>
              </div>

              <div className="quickstats">
                <div className="qstat">
                  <span className="ic">
                    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8h12c2 0 3 1 3 3v9H9v-9c0-2 1-3 3-3Z"/>
                      <path d="M9 20v8h18v-8"/>
                      <path d="M7 28h22"/>
                    </svg>
                  </span>
                  <div><span className="k">Seat</span><span className="v">{car.seats}</span></div>
                </div>
                <div className="qstat">
                  <span className="ic">
                    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="10" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="30" cy="12" r="2"/>
                      <circle cx="10" cy="28" r="2"/><circle cx="30" cy="28" r="2"/>
                      <path d="M10 14v12M20 14v4M30 14v12"/>
                    </svg>
                  </span>
                  <div><span className="k">Gearbox</span><span className="v">{car.gearbox}</span></div>
                </div>
                <div className="qstat">
                  <span className="ic">
                    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                      <rect x="11" y="12" width="18" height="20" rx="2"/>
                      <path d="M16 12V8h8v4"/>
                      <path d="M11 18h18M11 26h18"/>
                    </svg>
                  </span>
                  <div><span className="k">Luggage</span><span className="v">{car.luggage}</span></div>
                </div>
                <div className="qstat">
                  <span className="ic">
                    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="20" cy="20" r="13"/>
                      <path d="M20 12v8l6 3"/>
                    </svg>
                  </span>
                  <div><span className="k">Year</span><span className="v">{car.year}</span></div>
                </div>
              </div>

              <div className="features-head">
                <h3>Vehicle features</h3>
                <a href="#" className="see-more">
                  See all
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 5 7 7-7 7"/>
                  </svg>
                </a>
              </div>
              <div className="features">
                {car.features.map((f, i) => (
                  <div key={i} className="feat">
                    <span className="tick" dangerouslySetInnerHTML={{ __html: TICK }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery">
        <div className="wrap">
          <h2>Vehicle gallery</h2>
          <div className="gallery-grid">
            {car.gallery.slice(0, 5).map((g, i) => (
              <div
                key={i}
                className="gphoto"
                style={{ backgroundImage: `url('/${g}')` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* POST-GALLERY CTA */}
      <div className="wrap">
        <div className="post-gallery-cta">
          <div>
            <p className="pgc-title">Like what you see?</p>
            <p className="pgc-sub">Reserve this car — our manager will confirm your dates within 15 minutes.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            Book this car
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* TERMS */}
      <div className="wrap">
        <section className="terms">
          <h2>Terms and Conditions</h2>
          <div className="terms-grid">
            <div className="terms-tabs">
              {TERMS.map((t, i) => (
                <button
                  key={i}
                  className={`terms-tab${activeTab === i ? ' active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {t.title}
                </button>
              ))}
            </div>
            <div className="terms-panel">
              {term.panels.map(([h, p], i) => (
                <div key={i}>
                  <h4>{h}</h4>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* POST-TERMS CTA */}
      <div className="wrap">
        <div className="post-terms-cta">
          <p>Questions about the terms or pricing?</p>
          <button className="btn btn-ghost" onClick={() => setModal(true)}>Talk to a manager →</button>
        </div>
      </div>

      {/* FEEDBACK */}
      <section className="feedback">
        <div className="wrap">
          <div className="feedback-grid">
            <div>
              <h2>Feedback from<br/>satisfied renter</h2>
              <div className="fb-arrows">
                <button className="fb-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="m15 5-7 7 7 7"/>
                  </svg>
                </button>
                <button className="fb-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="m9 5 7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="fb-cards">
              <div className="fb-card">
                <div className="fb-stars">★★★★★</div>
                <div className="fb-title">Perfect ride for my business trip!</div>
                <p className="fb-text">I needed a reliable car for my client meetings, and this vehicle exceeded my expectations. The booking process was seamless, and the car was in excellent condition. Highly recommended for any traveller!</p>
                <div className="fb-author">
                  <div className="fb-avatar" style={{ backgroundImage: "url('/assets/customer-2.jpg')" }} />
                  <div className="name">Mark Stevens</div>
                </div>
              </div>
              <div className="fb-card">
                <div className="fb-stars">★★★★★</div>
                <div className="fb-title">Comfortable and affordable!</div>
                <p className="fb-text">I rented a car for a weekend trip, and the service rocked. For an economy car, the drive was refined, and the fuel usage was frugal. Definitely the car to go to at this price point again.</p>
                <div className="fb-author">
                  <div className="fb-avatar" style={{ backgroundImage: "url('/assets/customer-1.jpg')" }} />
                  <div className="name">Emma Johnson</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMILAR */}
      <section className="similar">
        <div className="wrap">
          <h2>You may also like</h2>
          <div className="similar-grid">
            {similar.map(c => (
              <Link key={c.id} className="mcard" to={`/car/${c.id}`}>
                <div className="shot" style={{ backgroundImage: `url('/${c.img}')` }} />
                <div>
                  <div className="row-name">
                    <div>
                      <h3>{c.name}</h3>
                      <div className="sub">{c.tagline}</div>
                    </div>
                    <div className="price">${c.price}<span className="per">/Per {c.priceUnit}</span></div>
                  </div>
                  <div className="stats">
                    <div className="mstat">
                      <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_SEAT }} />
                      <div><span className="k">Seat</span><span className="v">{c.seats}</span></div>
                    </div>
                    <div className="mstat">
                      <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_GEARBOX }} />
                      <div><span className="k">Gearbox</span><span className="v">{c.gearbox}</span></div>
                    </div>
                    <div className="mstat">
                      <span className="mstat-icon" dangerouslySetInnerHTML={{ __html: ICON_LUGGAGE }} />
                      <div><span className="k">Luggage</span><span className="v">{c.luggage}</span></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="car-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <h2>Drive Your Dreams with<br/>the Olimp Cars Elite Luxury!</h2>
            <div className="footer-info">
              <div className="footer-row">
                <div className="footer-col">
                  <Link to="/">Home</Link>
                  <Link to="/#about">About</Link>
                  <Link to="/#models">Models</Link>
                  <Link to="/#blog">Blog</Link>
                  <Link to="/#contact">Contact</Link>
                </div>
                <div className="footer-col">
                  <a href="#">Style Guide</a>
                  <a href="#">Licences</a>
                  <a href="#">Changelog</a>
                </div>
                <div className="footer-col">
                  <a href="#">Info@OlimpCars.Com</a>
                  <a href="#">+1 (123) 456-7890</a>
                  <a href="#">Miami, Florida</a>
                  <a href="#">Tampa, Florida</a>
                </div>
                <div className="footer-cta">
                  <span>Find top luxury cars fast!</span>
                  <Link className="btn" style={{ background: '#fff', color: 'var(--ink)' }} to="/#models">
                    Explore Models
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 5 7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="footer-meta">
                <div style={{ opacity: 0 }} aria-hidden="true" />
                <div className="footer-socials">
                  <a href="#">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>
                    </svg>
                  </a>
                  <a href="#">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3l7 9-7 9h2.5L11 13.8 16.5 21H21l-7.3-9.4L20.5 3H18l-5.7 7L7 3H3z"/>
                    </svg>
                  </a>
                  <a href="#">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 7.5a3 3 0 0 0-2.1-2.1C18 5 12 5 12 5s-6 0-7.9.4A3 3 0 0 0 2 7.5 31 31 0 0 0 1.6 12 31 31 0 0 0 2 16.5a3 3 0 0 0 2.1 2.1C6 19 12 19 12 19s6 0 7.9-.4a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5ZM10 15V9l5 3-5 3Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="car-sticky-cta">
        <div className="car-sticky-price">
          ${car.price}<span>/{car.priceUnit}</span>
        </div>
        <button className="car-sticky-btn" onClick={() => setModal(true)}>
          Book now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 5 7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* MODAL */}
      {modal && <Modal onClose={() => setModal(false)} carName={car.name} />}

    </div>
  )
}
