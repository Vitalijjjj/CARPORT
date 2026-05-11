import { useEffect, useState } from 'react'
import './Preloader.css'

export default function Preloader({ onDone }) {
  const [exit, setExit] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2000)
    const t2 = setTimeout(() => onDone?.(), 2650)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className={`preloader${exit ? ' pl-exit' : ''}`}>

      {/* Ambient glow */}
      <div className="pl-glow" />

      {/* CRT scan lines */}
      <div className="pl-scan" />

      <div className="pl-content">

        {/* ── Logo ── */}
        <div className="pl-logo">
          <img src="/assets/logo-turboeagle.svg" alt="TURBOEAGLE" className="pl-logo-img" />
        </div>

      </div>

      {/* ── Bottom progress bar ── */}
      <div className="pl-progress">
        <div className="pl-progress-fill" />
      </div>

    </div>
  )
}
