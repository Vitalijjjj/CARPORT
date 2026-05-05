import { useState, useEffect } from 'react'
import './FloatingWidget.css'

export default function FloatingWidget() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [sent, setSent]       = useState(false)
  const [errors, setErrors]   = useState({})

  useEffect(() => {
    if (localStorage.getItem('carrai_widget_sent')) return

    let triggered = false
    function show() {
      if (triggered) return
      triggered = true
      setVisible(true)
    }

    const timer = setTimeout(show, 30000)

    function onScroll() {
      if (window.scrollY > window.innerHeight) show()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Enter your name'
    if (phone.replace(/\D/g, '').length < 5) errs.phone = 'Enter phone'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
    localStorage.setItem('carrai_widget_sent', '1')
  }

  if (!visible) return null

  return (
    <div className={`fw${open ? ' fw-open' : ''}`}>
      {open ? (
        <div className="fw-panel">
          <button className="fw-close" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          {sent ? (
            <div className="fw-sent">
              <div className="fw-sent-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 12 5 5 9-10"/>
                </svg>
              </div>
              <p>Got it! We'll call within 15 min.</p>
            </div>
          ) : (
            <>
              <div className="fw-head">
                <div className="fw-avatar" />
                <div>
                  <div className="fw-agent-name">Alex</div>
                  <div className="fw-status"><span className="fw-dot" />Online now</div>
                </div>
              </div>
              <p className="fw-intro">Hi! I can help you find the right BMW or Mercedes-Benz in stock or through import from Germany.</p>
              <form onSubmit={handleSubmit} noValidate>
                <div className="fw-field">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  />
                  {errors.name && <span className="fw-err">{errors.name}</span>}
                </div>
                <div className="fw-field">
                  <input
                    type="tel"
                    placeholder="+351 000 000 000"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                  />
                  {errors.phone && <span className="fw-err">{errors.phone}</span>}
                </div>
                <button type="submit" className="fw-submit">Get a consultation</button>
              </form>
              <div className="fw-alts">
                <a href="https://www.instagram.com/turboeagle.lda?igsh=MTRxd3l0bjNudDF4Yg%3D%3D" className="fw-alt fw-ig" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a href="https://www.facebook.com/share/1D3kQ3XXpu/?mibextid=wwXIfr" className="fw-alt fw-fb" target="_blank" rel="noopener noreferrer">Facebook</a>
              </div>
            </>
          )}
        </div>
      ) : (
        <button className="fw-trigger" onClick={() => setOpen(true)}>
          <div className="fw-trigger-avatar" />
          <div className="fw-trigger-text">
            <span>Need help choosing?</span>
            <span className="fw-trigger-status"><span className="fw-dot" />Online now</span>
          </div>
        </button>
      )}
    </div>
  )
}
