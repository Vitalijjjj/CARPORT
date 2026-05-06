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

        {/* ── Badge mark ── */}
        <div className="pl-mark">
          <svg viewBox="0 0 110 88" xmlns="http://www.w3.org/2000/svg" fill="currentColor" overflow="visible">
            {/* Bar 1: top full-width */}
            <rect className="pl-bar pl-bar-1" x="5"  y="2"  width="100" height="9"/>
            {/* Bar 2: second full-width */}
            <rect className="pl-bar pl-bar-2" x="5"  y="18" width="100" height="9"/>
            {/* Left vertical connector */}
            <rect className="pl-bar-v" x="5"  y="2"  width="9"   height="52"/>
            {/* Right vertical (upper) */}
            <rect className="pl-bar-vr" x="96" y="2"  width="9"   height="25"/>
            {/* Bar 3: right half */}
            <rect className="pl-bar pl-bar-3" x="55" y="18" width="50"  height="9"/>
            {/* Bar 4: right half lower */}
            <rect className="pl-bar pl-bar-4" x="55" y="34" width="50"  height="9"/>
            {/* Bar 5: optional third right bar for depth */}
            <rect className="pl-bar pl-bar-5" x="55" y="8"  width="50"  height="5" opacity="0.35"/>
            {/* Bottom chevron: drawn in */}
            <path
              className="pl-chevron"
              d="M5,54 L55,84 L105,54"
              stroke="currentColor"
              strokeWidth="9.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* ── Wordmark ── */}
        <div className="pl-wordmark">TURBOEAGLE</div>

        {/* ── Subtitle ── */}
        <div className="pl-sub">Comércio de Automóveis</div>

      </div>

      {/* ── Bottom progress bar ── */}
      <div className="pl-progress">
        <div className="pl-progress-fill" />
      </div>

    </div>
  )
}
