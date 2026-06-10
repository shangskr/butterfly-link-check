import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'butterfly_theme'

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored !== null ? stored === 'dark' : prefersDark
    setDark(isDark)
    document.body.classList.toggle('dark', isDark)
    setReady(true)
  }, [])

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      document.body.classList.toggle('dark', next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ dark, toggle, ready }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
