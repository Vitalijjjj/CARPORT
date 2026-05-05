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
    if (localStorage.getItem('olimp_widget_sent')) return

    let triggered = false
    function show() {
      if (triggered) return
      triggered = true
      setVisible(true)
    }

    const timer = setTimeout(show, 30000)

    function onScroll() {
      const pct = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)
      if (pct > 0.4) show()
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
    localStorage.setItem('olimp_widget_sent', '1')
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
              <p className="fw-intro">Hi! I'll help you find the right car in 2 minutes.</p>
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
                    placeholder="+1 (000) 000-0000"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                  />
                  {errors.phone && <span className="fw-err">{errors.phone}</span>}
                </div>
                <button type="submit" className="fw-submit">Get a consultation</button>
              </form>
              <div className="fw-alts">
                <a href="https://wa.me/11234567890" className="fw-alt fw-wa" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href="https://t.me/olimpcars" className="fw-alt fw-tg" target="_blank" rel="noopener noreferrer">Telegram</a>
              </div>
            </>
          )}
        </div>
      ) : (
        <button className="fw-trigger" onClick={() => setOpen(true)}>
          <div className="fw-trigger-avatar" />
          <div className="fw-trigger-text">
            <span>Need help?</span>
            <span className="fw-trigger-status"><span className="fw-dot" />Online now</span>
          </div>
        </button>
      )}
    </div>
  )
}
