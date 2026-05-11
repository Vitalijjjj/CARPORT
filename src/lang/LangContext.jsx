import { createContext, useContext, useState } from 'react'
import pt from './pt'
import en from './en'
import uk from './uk'

const LANGS = { pt, en, uk }

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('te_lang') || 'pt')

  function switchLang(l) {
    setLang(l)
    localStorage.setItem('te_lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, switchLang, t: LANGS[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
