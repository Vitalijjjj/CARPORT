import { useState, useEffect, useRef } from 'react'
import './LeadPopup.css'

export default function LeadPopup() {
  const [show, setShow]     = useState(false)
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [sent, setSent]     = useState(false)
  const [errors, setErrors] = useState({})
  const fired = useRef(false)

  function trigger() {
    if (fired.current) return
    if (localStorage.getItem('olimp_popup_sent')) return
    fired.current = true
    setShow(true)
  }

  useEffect(() => {
    const timer = setTimeout(trigger, 90000)

    function onMouseLeave(e) {
      if (e.clientY <= 0) trigger()
    }

    function onScroll() {
      const pct = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)
      if (pct > 0.70) trigger()
    }

    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  function close() { setShow(false) }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Enter your name'
    if (phone.replace(/\D/g, '').length < 5) errs.phone = 'Enter a valid phone number'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
    localStorage.setItem('olimp_popup_sent', '1')
    setTimeout(close, 3500)
  }

  if (!show) return null

  return (
    <div className="lp-backdrop" onClick={close}>
      <div className="lp-sheet" onClick={e => e.stopPropagation()}>
        <button className="lp-close" onClick={close} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {sent ? (
          <div className="lp-sent">
            <div className="lp-sent-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m5 12 5 5 9-10"/>
              </svg>
            </div>
            <h3>Got it!</h3>
            <p>Our manager will call you within 15 minutes.</p>
          </div>
        ) : (
          <>
            <span className="lp-eyebrow">Personal selection</span>
            <h3 className="lp-heading">We'll find the right car<br/>for your needs</h3>
            <p className="lp-sub">Leave your contact — our manager will call within 15 minutes with options tailored to you.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  autoComplete="name"
                />
                {errors.name && <span className="lp-err">{errors.name}</span>}
              </div>
              <div className="lp-field">
                <input
                  type="tel"
                  placeholder="+1 (000) 000-0000"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                  autoComplete="tel"
                />
                {errors.phone && <span className="lp-err">{errors.phone}</span>}
              </div>
              <button type="submit" className="lp-submit">
                Get a personalised selection
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 5 7 7-7 7"/>
                </svg>
              </button>
              <p className="lp-disclaimer">No spam. One call. No obligations.</p>
            </form>
            <div className="lp-alts">
              <a href="https://wa.me/11234567890" target="_blank" rel="noopener noreferrer" className="lp-alt lp-wa">WhatsApp</a>
              <a href="https://t.me/olimpcars" target="_blank" rel="noopener noreferrer" className="lp-alt lp-tg">Telegram</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
