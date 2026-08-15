import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const THEME_STORAGE_KEY = 'peluchera_stock_theme'

export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readStoredTheme(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: ThemePreference): void {
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark())
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  function setTheme(next: ThemePreference): void {
    setThemeState(next)
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }
  return context
}
