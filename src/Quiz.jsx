import { useState } from 'react'
import { OLIMP_CARS } from './cars-data'
import './Quiz.css'

const STEPS = [
  {
    id: 'goal',
    question: 'What are you looking for?',
    options: [
      { label: 'Rent a car', value: 'rent' },
      { label: 'Buy a car', value: 'buy' },
      { label: 'Trade-in my car', value: 'trade' },
      { label: 'Order car import', value: 'import' },
    ],
  },
  {
    id: 'category',
    question: "What's the car for?",
    options: [
      { label: 'Business trips', value: 'business' },
      { label: 'Family', value: 'family' },
      { label: 'Adventures', value: 'adventure' },
      { label: 'Special occasion', value: 'wedding' },
    ],
  },
  {
    id: 'timing',
    question: 'When do you need it?',
    options: [
      { label: 'This week', value: 'week' },
      { label: 'This month', value: 'month' },
      { label: "I'm just planning", value: 'planning' },
    ],
  },
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

  const matchCount = answers.category
    ? OLIMP_CARS.filter(c => c.category === answers.category).length
    : OLIMP_CARS.length

  return (
    <section className="quiz-section" id="quiz">
      <div className="wrap">
        <div className="quiz-box">

          {sent ? (
            <div className="quiz-sent">
              <div className="quiz-sent-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 12 5 5 9-10"/>
                </svg>
              </div>
              <h3>Request received!</h3>
              <p>Our manager will call within 15 minutes with a personalised car selection.</p>
            </div>

          ) : isIntro ? (
            <div className="quiz-intro">
              <span className="quiz-eyebrow">Car Finder</span>
              <h2 className="quiz-heading">Not sure which car fits you?<br/>Answer 3 quick questions</h2>
              <p>Takes under 1 minute. Get a free personalised selection from our manager.</p>
              <button className="quiz-start-btn" onClick={() => setStep(1)}>
                Start the quiz
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
              <div className="quiz-match">
                <span className="quiz-match-num">{matchCount}</span>
                {' '}car{matchCount !== 1 ? 's' : ''} match your criteria
              </div>
              <h3 className="quiz-q">Leave your contact — we'll send a selection within 15 minutes</h3>
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
                    placeholder="+1 (000) 000-0000"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="quiz-err">{errors.phone}</span>}
                </div>
                <button type="submit" className="quiz-submit-btn">
                  Get my selection
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 5 7 7-7 7"/>
                  </svg>
                </button>
                <p className="quiz-disclaimer">No spam. One call from your manager. No obligations.</p>
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
    </section>
  )
}
