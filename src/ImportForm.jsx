import { useState } from 'react'
import { useLang } from './lang/LangContext'
import './ImportForm.css'

const BUDGET_VALUES = ['under30', '30to45', '45to65', 'over65']

export default function ImportForm() {
  const { t } = useLang()
  const f = t.importForm

  const [form, setForm] = useState({ name: '', phone: '', brand: '', model: '', year: '', mileage: '', budget: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent

  function set(key) {
    return e => {
      setForm(p => ({ ...p, [key]: e.target.value }))
      setErrors(p => ({ ...p, [key]: '' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim())                         errs.name  = f.errName
    if (form.phone.replace(/\D/g, '').length < 5) errs.phone = f.errPhone
    if (Object.keys(errs).length) { setErrors(errs); return }

    setStatus('sending')
    const message = [
      form.brand   && `${f.brandLabel}: ${form.brand}`,
      form.model   && `${f.modelLabel}: ${form.model}`,
      form.year    && `${f.yearLabel}: ${form.year}`,
      form.mileage && `${f.mileageLabel}: ${form.mileage}`,
      form.budget  && `${f.budgetLabel}: ${form.budget}`,
    ].filter(Boolean).join(' | ')

    try {
      await fetch('/api/leads.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, message, source: 'import' }),
      })
    } catch { /* ignore */ }
    setStatus('sent')
  }

  return (
    <section className="import-form-sec" id="import-offer">
      <div className="wrap">
        <div className="import-form-layout">

          {/* Left: offer panel */}
          <div className="import-form-left">
            <span className="import-eyebrow">{f.eyebrow}</span>
            <h2 className="import-h2">{f.h2}</h2>
            <p className="import-sub">{f.sub}</p>
            <ul className="import-benefits">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                {f.benefit1}
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                {f.benefit2}
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                {f.benefit3}
              </li>
            </ul>
          </div>

          {/* Right: form */}
          <div className="import-form-right">
            {status === 'sent' ? (
              <div className="import-sent">
                <div className="import-sent-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5 9-10"/></svg>
                </div>
                <h3>{f.sent}</h3>
                <p>{f.sentSub}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="import-form">

                {/* Row 1: name + phone */}
                <div className="import-row-2">
                  <div className="import-field">
                    <input
                      type="text"
                      placeholder={f.namePlaceholder}
                      value={form.name}
                      onChange={set('name')}
                      autoComplete="name"
                      className={errors.name ? 'err' : ''}
                    />
                    {errors.name && <span className="import-err">{errors.name}</span>}
                  </div>
                  <div className="import-field">
                    <input
                      type="tel"
                      placeholder={f.phonePlaceholder}
                      value={form.phone}
                      onChange={set('phone')}
                      autoComplete="tel"
                      className={errors.phone ? 'err' : ''}
                    />
                    {errors.phone && <span className="import-err">{errors.phone}</span>}
                  </div>
                </div>

                {/* Row 2: brand + model */}
                <div className="import-row-2">
                  <div className="import-field">
                    <select value={form.brand} onChange={set('brand')}>
                      <option value="">{f.brandLabel}</option>
                      <option value="BMW">BMW</option>
                      <option value="Mercedes-Benz">Mercedes-Benz</option>
                      <option value={f.brandBoth}>{f.brandBoth}</option>
                    </select>
                  </div>
                  <div className="import-field">
                    <input
                      type="text"
                      placeholder={f.modelPlaceholder}
                      value={form.model}
                      onChange={set('model')}
                    />
                  </div>
                </div>

                {/* Row 3: year + mileage + budget */}
                <div className="import-row-3">
                  <div className="import-field">
                    <input
                      type="text"
                      placeholder={f.yearPlaceholder}
                      value={form.year}
                      onChange={set('year')}
                    />
                  </div>
                  <div className="import-field">
                    <input
                      type="text"
                      placeholder={f.mileagePlaceholder}
                      value={form.mileage}
                      onChange={set('mileage')}
                    />
                  </div>
                  <div className="import-field">
                    <select value={form.budget} onChange={set('budget')}>
                      <option value="">{f.budgetLabel}</option>
                      <option value={f.budget1}>{f.budget1}</option>
                      <option value={f.budget2}>{f.budget2}</option>
                      <option value={f.budget3}>{f.budget3}</option>
                      <option value={f.budget4}>{f.budget4}</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="import-submit" disabled={status === 'sending'}>
                  {status === 'sending' ? f.sending : f.submit}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
                </button>

              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
