import { useLang } from './LangContext'
import './LangSwitcher.css'

const OPTIONS = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'uk', label: 'UA' },
]

export default function LangSwitcher() {
  const { lang, switchLang } = useLang()
  return (
    <div className="lang-sw">
      {OPTIONS.map(o => (
        <button
          key={o.code}
          className={`lang-sw-btn${lang === o.code ? ' lang-sw-btn--active' : ''}`}
          onClick={() => switchLang(o.code)}
        >
          {o.label}
        </button>
      ))}
      <select
        className="lang-sw-select"
        value={lang}
        onChange={e => switchLang(e.target.value)}
        aria-label="Language"
      >
        {OPTIONS.map(o => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
