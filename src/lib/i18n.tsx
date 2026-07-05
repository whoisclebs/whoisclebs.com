import React from 'react'
import { useLocation, useNavigate } from 'react-router'
import { en } from '@/locales/en'
import { ptBR } from '@/locales/pt-BR'
import { localeFromSegment, localizePath } from './locale-routing'

export type Locale = 'pt-BR' | 'en'

const STORAGE_KEY = 'whoisclebs.locale'

const translations = {
  'pt-BR': ptBR,
  en,
}

export type Messages = typeof ptBR

type StringTranslationKey = {
  [Key in keyof Messages]: Messages[Key] extends string ? Key : never
}[keyof Messages]

type I18nContextValue = {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
  t: (key: StringTranslationKey) => string
  format: (key: StringTranslationKey, values: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized.startsWith('pt')) return 'pt-BR'
  if (normalized.startsWith('en')) return 'en'
  return null
}

function detectInitialLocale(): Locale {
  // SSR guard: Node.js 22+ exposes a global navigator with language "en-US",
  // so we must also check that window (the real browser global) exists.
  const isBrowser = typeof window !== 'undefined'

  if (isBrowser) {
    const persisted = normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
    if (persisted) return persisted
  }

  if (isBrowser && typeof navigator !== 'undefined') {
    const browserLocales = [navigator.language, ...(navigator.languages ?? [])]
    const detected = browserLocales.map(normalizeLocale).find(Boolean)
    if (detected) return detected
  }

  return 'pt-BR'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const routeLocale = localeFromSegment(location.pathname.split('/').filter(Boolean)[0])
  const [storedLocale, updateStoredLocale] = React.useState<Locale>(() => detectInitialLocale())
  const locale = routeLocale ?? storedLocale

  React.useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = React.useMemo<I18nContextValue>(() => {
    const messages = translations[locale]

    return {
      locale,
      messages,
      setLocale: (nextLocale) => {
        updateStoredLocale(nextLocale)
        navigate(localizePath(`${location.pathname}${location.search}${location.hash}`, nextLocale))
      },
      t: (key) => messages[key],
      format: (key, values) => Object.entries(values).reduce(
        (message, [name, value]) => message.split(`{${name}}`).join(String(value)),
        messages[key] as string,
      ),
    }
  }, [locale, location.hash, location.pathname, location.search, navigate])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}

export const i18nStorageKey = STORAGE_KEY
