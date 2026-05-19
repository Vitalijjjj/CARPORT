import { useState } from 'react'
import { useLang } from './lang/LangContext'
import './Quiz.css'

const STEP_VALUES = [
  ['bmw', 'mercedes', 'both', 'unsure'],
  ['electric', 'hybrid', 'phev', 'unsure'],
  ['under30', '30to45', '45to65', 'over65'],
  ['yes', 'no', 'maybe'],
  ['asap', '30days', '2to3months', 'researching'],
]

export default function Quiz() {
  const { t } = useLang()
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState({})
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [errors, setErrors]   = useState({})
  const [sent, setSent]       = useState(false)

  const steps = t.quiz.steps.map((s, i) => ({
    id: ['brand','type','budget','financing','timing'][i],
    question: s.question,
    options: s.options.map((label, j) => ({ label, value: STEP_VALUES[i][j] })),
  }))

  const totalSteps  = steps.length
  const isIntro     = step === 0
  const isForm      = step > totalSteps
  const currentStep = steps[step - 1]

  function pickOption(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }))
    setStep(s => s + 1)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = t.quiz.errName
    if (phone.replace(/\D/g, '').length < 5) errs.phone = t.quiz.errPhone
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
  }

  return (
    <section className="quiz-section" id="quiz">
      <div className="wrap">
        <div className="quiz-layout">

          {/* ── Left: always-visible context panel ── */}
          <div className="quiz-left">
            <span className="quiz-eyebrow">{t.quiz.eyebrow}</span>
            <h2 className="quiz-heading">{t.quiz.h2}</h2>
            <p className="quiz-left-desc">{t.quiz.sub}</p>
            <div className="quiz-left-stats">
              <div className="quiz-stat-item">
                <span className="quiz-stat-n">500+</span>
                <span className="quiz-stat-l">{t.quiz.stat1}</span>
              </div>
              <div className="quiz-stat-sep" />
              <div className="quiz-stat-item">
                <span className="quiz-stat-n">3 min</span>
                <span className="quiz-stat-l">{t.quiz.stat2}</span>
              </div>
              <div className="quiz-stat-sep" />
              <div className="quiz-stat-item">
                <span className="quiz-stat-n">Free</span>
                <span className="quiz-stat-l">{t.quiz.stat3}</span>
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
                  <h3>{t.quiz.sentTitle}</h3>
                  <p>{t.quiz.sentSub}</p>
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
                  <p className="quiz-intro-label">{t.quiz.introLabel}</p>
                  <button className="quiz-start-btn" onClick={() => setStep(1)}>
                    {t.quiz.startBtn}
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
                  <h3 className="quiz-q">{t.quiz.formHeading}</h3>
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="quiz-field">
                      <input
                        type="text"
                        placeholder={t.quiz.namePlaceholder}
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                        autoComplete="name"
                      />
                      {errors.name && <span className="quiz-err">{errors.name}</span>}
                    </div>
                    <div className="quiz-field">
                      <input
                        type="tel"
                        placeholder={t.quiz.phonePlaceholder}
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                        autoComplete="tel"
                      />
                      {errors.phone && <span className="quiz-err">{errors.phone}</span>}
                    </div>
                    <button type="submit" className="quiz-submit-btn">
                      {t.quiz.submit}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 5 7 7-7 7"/>
                      </svg>
                    </button>
                    <p className="quiz-disclaimer">{t.quiz.disclaimer}</p>
                  </form>
                </div>

              ) : (
                <div className="quiz-step">
                  <div className="quiz-progress-wrap">
                    <div className="quiz-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }} />
                  </div>
                  <div className="quiz-step-label">{t.quiz.step} {step} {t.quiz.of} {totalSteps}</div>
                  <h3 className="quiz-q">{currentStep.question}</h3>
                  <div className="quiz-options">
                    {currentStep.options.map(opt => (
                      <button key={opt.value} className="quiz-opt" onClick={() => pickOption(currentStep.id, opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {step > 1 && (
                    <button className="quiz-back" onClick={() => setStep(s => s - 1)}>← {t.quiz.back}</button>
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
