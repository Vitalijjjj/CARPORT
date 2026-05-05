import { useState } from 'react'
import './Quiz.css'

const STEPS = [
  {
    id: 'brand',
    question: 'Which brand are you interested in?',
    options: [
      { label: 'BMW',            value: 'bmw' },
      { label: 'Mercedes-Benz', value: 'mercedes' },
      { label: 'Both',          value: 'both' },
      { label: 'Not sure yet',  value: 'unsure' },
    ],
  },
  {
    id: 'type',
    question: 'What type of vehicle are you looking for?',
    options: [
      { label: 'Electric',       value: 'electric' },
      { label: 'Hybrid',         value: 'hybrid' },
      { label: 'Plug-in Hybrid', value: 'phev' },
      { label: 'Not sure yet',   value: 'unsure' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your approximate budget?',
    options: [
      { label: 'Up to €30,000',     value: 'under30' },
      { label: '€30,000 – €45,000', value: '30to45' },
      { label: '€45,000 – €65,000', value: '45to65' },
      { label: '€65,000+',          value: 'over65' },
    ],
  },
  {
    id: 'financing',
    question: 'Are you interested in financing?',
    options: [
      { label: 'Yes',                               value: 'yes' },
      { label: 'No',                                value: 'no' },
      { label: 'Maybe — I want to compare options', value: 'maybe' },
    ],
  },
  {
    id: 'timing',
    question: 'When are you planning to buy?',
    options: [
      { label: 'As soon as possible', value: 'asap' },
      { label: 'Within 30 days',      value: '30days' },
      { label: 'Within 2–3 months',   value: '2to3months' },
      { label: 'Just researching',    value: 'researching' },
    ],
  },
]

const FEATURES = [
  'BMW & Mercedes-Benz in stock',
  'Electric & Hybrid, selected for Portugal',
  'Warranty and financing available',
  'Import from Germany, end-to-end',
]

export default function Quiz() {
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState({})
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [errors, setErrors]   = useState({})
  const [sent, setSent]       = useState(false)

  const totalSteps  = STEPS.length
  const isIntro     = step === 0
  const isForm      = step > totalSteps
  const currentStep = STEPS[step - 1]

  function pickOption(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }))
    setStep(s => s + 1)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Enter your name'
    if (phone.replace(/\D/g, '').length < 5) errs.phone = 'Enter a valid phone number'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
  }

  return (
    <section className="quiz-section" id="quiz">
      <div className="wrap">
        <div className="quiz-layout">

          {/* ── Left: always-visible context panel ── */}
          <div className="quiz-left">
            <span className="quiz-eyebrow">Car Finder</span>
            <h2 className="quiz-heading">Find Your Perfect<br/>Car in 3 Minutes</h2>
            <p className="quiz-left-desc">
              Answer a few quick questions and our team prepares a personalised offer — matching your brand, budget and needs.
            </p>
            <ul className="quiz-features">
              {FEATURES.map(f => <li key={f}>{f}</li>)}
            </ul>
            <div className="quiz-left-stats">
              <div className="quiz-stat-item">
                <span className="quiz-stat-n">500+</span>
                <span className="quiz-stat-l">cars sourced</span>
              </div>
              <div className="quiz-stat-sep" />
              <div className="quiz-stat-item">
                <span className="quiz-stat-n">3 min</span>
                <span className="quiz-stat-l">to get matched</span>
              </div>
              <div className="quiz-stat-sep" />
              <div className="quiz-stat-item">
                <span className="quiz-stat-n">Free</span>
                <span className="quiz-stat-l">consultation</span>
              </div>
            </div>
          </div>

          {/* ── Right: quiz interaction card ── */}
          <div className="quiz-right">
            <div className="quiz-box">

              {sent ? (
                <div className="quiz-sent">
                  <div className="quiz-sent-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m5 12 5 5 9-10"/>
                    </svg>
                  </div>
                  <h3>Request received!</h3>
                  <p>Our team will review your preferences and contact you with suitable options.</p>
                </div>

              ) : isIntro ? (
                <div className="quiz-intro">
                  <div className="quiz-intro-icon">
                    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 30h28M10 30l4-10h20l4 10M10 30v6h4v-6M34 30v6h4v-6"/>
                      <circle cx="16" cy="36" r="3"/><circle cx="32" cy="36" r="3"/>
                      <path d="M18 20h12"/>
                    </svg>
                  </div>
                  <p className="quiz-intro-label">5 quick questions · No account needed</p>
                  <button className="quiz-start-btn" onClick={() => setStep(1)}>
                    Start Car Selection
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 5 7 7-7 7"/>
                    </svg>
                  </button>
                </div>

              ) : isForm ? (
                <div className="quiz-form-step">
                  <div className="quiz-progress-wrap">
                    <div className="quiz-progress-bar" style={{ width: '100%' }} />
                  </div>
                  <h3 className="quiz-q">Where should we send your personalised offer?</h3>
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="quiz-field">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                        autoComplete="name"
                      />
                      {errors.name && <span className="quiz-err">{errors.name}</span>}
                    </div>
                    <div className="quiz-field">
                      <input
                        type="tel"
                        placeholder="+351 000 000 000"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                        autoComplete="tel"
                      />
                      {errors.phone && <span className="quiz-err">{errors.phone}</span>}
                    </div>
                    <button type="submit" className="quiz-submit-btn">
                      Get My Car Offer
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 5 7 7-7 7"/>
                      </svg>
                    </button>
                    <p className="quiz-disclaimer">No spam. One call from our team. No obligations.</p>
                  </form>
                </div>

              ) : (
                <div className="quiz-step">
                  <div className="quiz-progress-wrap">
                    <div className="quiz-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }} />
                  </div>
                  <div className="quiz-step-label">Step {step} of {totalSteps}</div>
                  <h3 className="quiz-q">{currentStep.question}</h3>
                  <div className="quiz-options">
                    {currentStep.options.map(opt => (
                      <button key={opt.value} className="quiz-opt" onClick={() => pickOption(currentStep.id, opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {step > 1 && (
                    <button className="quiz-back" onClick={() => setStep(s => s - 1)}>← Back</button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
