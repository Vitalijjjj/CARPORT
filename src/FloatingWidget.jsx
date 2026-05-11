import { useState, useEffect } from 'react'
import { useLang } from './lang/LangContext'
import './FloatingWidget.css'

export default function FloatingWidget() {
  const { t } = useLang()
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
              <p>{t.widget.sent}</p>
            </div>
          ) : (
            <>
              <div className="fw-head">
                <div className="fw-avatar" />
                <div>
                  <div className="fw-agent-name">Alex</div>
                  <div className="fw-status"><span className="fw-dot" />{t.widget.onlineNow}</div>
                </div>
              </div>
              <p className="fw-intro">{t.widget.intro}</p>
              <form onSubmit={handleSubmit} noValidate>
                <div className="fw-field">
                  <input
                    type="text"
                    placeholder={t.widget.namePlaceholder}
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
                <button type="submit" className="fw-submit">{t.widget.submitCta}</button>
              </form>
              <div className="fw-alts">
                <a href="https://wa.me/351000000000" className="fw-alt fw-wa" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882a.5.5 0 0 0 .611.61l6.101-1.456A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.498-5.2-1.37l-.373-.214-3.868.924.944-3.786-.234-.389A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
                <a href="https://www.instagram.com/turboeagle.lda?igsh=MTRxd3l0bjNudDF4Yg%3D%3D" className="fw-alt fw-ig" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                  Instagram
                </a>
                <a href="https://www.facebook.com/share/1D3kQ3XXpu/?mibextid=wwXIfr" className="fw-alt fw-fb" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
              </div>
            </>
          )}
        </div>
      ) : (
        <button className="fw-trigger" onClick={() => setOpen(true)}>
          <div className="fw-trigger-avatar" />
          <div className="fw-trigger-text">
            <span>{t.widget.needHelp}</span>
            <span className="fw-trigger-status"><span className="fw-dot" />{t.widget.onlineNow}</span>
          </div>
        </button>
      )}
    </div>
  )
}
