import { useState, useEffect } from 'react'

export default function Modal({ onClose, carName }) {
  const [name,   setName]   = useState('')
  const [phone,  setPhone]  = useState('')
  const [errors, setErrors] = useState({})
  const [sent,   setSent]   = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Enter your name'
    if (phone.replace(/\D/g, '').length < 5) e.phone = 'Enter a valid phone number'
    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {sent ? (
          <div className="modal-sent">
            <div className="modal-sent-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m5 12 5 5 9-10"/>
              </svg>
            </div>
            <h3>Request sent!</h3>
            <p>Our team will review your request and contact you with suitable options.</p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <h3>{carName ? `Ask About ${carName}` : 'Get a Personal Offer'}</h3>
              <p>{carName ? `Tell us about your interest in the ${carName}. Our team will contact you with details and availability.` : 'Tell us what you are looking for and we will help you find the best available option in stock or through import from Germany.'}</p>
            </div>
            <form className="modal-form" onSubmit={handleSubmit} noValidate>
              <div className="modal-field">
                <label htmlFor="m-name">Name</label>
                <input
                  id="m-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  autoComplete="name"
                />
                {errors.name  && <span className="modal-err">{errors.name}</span>}
              </div>
              <div className="modal-field">
                <label htmlFor="m-phone">Phone</label>
                <input
                  id="m-phone"
                  type="tel"
                  placeholder="+1 (000) 000-0000"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                  autoComplete="tel"
                />
                {errors.phone && <span className="modal-err">{errors.phone}</span>}
              </div>
              <button type="submit" className="btn btn-primary modal-submit">
                Send request
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 5 7 7-7 7"/>
                </svg>
              </button>
            </form>
            <div className="modal-alts">
              <span className="modal-alts-label">Or reach us via</span>
              <div className="modal-alts-btns">
                <a href="https://www.instagram.com/turboeagle.lda?igsh=MTRxd3l0bjNudDF4Yg%3D%3D" target="_blank" rel="noopener noreferrer" className="modal-alt modal-ig">Instagram</a>
                <a href="https://www.facebook.com/share/1D3kQ3XXpu/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="modal-alt modal-fb">Facebook</a>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
