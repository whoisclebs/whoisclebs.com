/* eslint-disable react-refresh/only-export-components */
import React from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'whoisclebs.theme'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const persisted = window.localStorage.getItem(STORAGE_KEY)
  if (persisted === 'light' || persisted === 'dark') return persisted

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => detectInitialTheme())

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = React.useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
}

export const themeStorageKey = STORAGE_KEY
