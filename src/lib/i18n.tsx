import React from 'react'

export type Locale = 'pt-BR' | 'en'

type TranslationKey =
  | 'nav.home'
  | 'nav.about'
  | 'nav.blog'
  | 'nav.til'
  | 'nav.portfolio'
  | 'nav.hobbies'
  | 'nav.books'
  | 'nav.primary'
  | 'nav.primaryMobile'
  | 'nav.openMenu'
  | 'nav.closeMenu'
  | 'language.label'
  | 'language.pt'
  | 'language.en'
  | 'footer.madeWith'
  | 'footer.privacy'
  | 'footer.terms'
  | 'blog.kicker'
  | 'blog.title'
  | 'blog.description'
  | 'blog.recentArticles'
  | 'blog.paginationLabel'
  | 'blog.pageStatus'
  | 'blog.previousPage'
  | 'blog.nextPage'
  | 'blog.notFoundTitle'
  | 'blog.notFoundDescription'
  | 'blog.backToBlog'
  | 'blog.by'
  | 'til.seoDescription'
  | 'til.kicker'
  | 'til.title'
  | 'til.description'
  | 'til.paginationLabel'
  | 'til.notFoundTitle'
  | 'til.backToTil'

const STORAGE_KEY = 'whoisclebs.locale'

const translations: Record<Locale, Record<TranslationKey, string>> = {
  'pt-BR': {
    'nav.home': 'Home',
    'nav.about': 'Sobre',
    'nav.blog': 'Blog',
    'nav.til': 'TIL',
    'nav.portfolio': 'Portfolio',
    'nav.hobbies': 'Hobbies',
    'nav.books': 'Livros',
    'nav.primary': 'Principal',
    'nav.primaryMobile': 'Principal mobile',
    'nav.openMenu': 'Abrir menu',
    'nav.closeMenu': 'Fechar menu',
    'language.label': 'Idioma',
    'language.pt': 'Português',
    'language.en': 'English',
    'footer.madeWith': 'Feito com Vite, café e decisões explícitas.',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Uso',
    'blog.kicker': 'BLOG DE ENGENHARIA',
    'blog.title': 'Engenharia em campo',
    'blog.description': 'Notas sobre arquitetura de software, interfaces, operação e decisões técnicas sem verniz corporativo.',
    'blog.recentArticles': 'ARTIGOS RECENTES',
    'blog.paginationLabel': 'Paginação dos posts',
    'blog.pageStatus': 'Página {current} de {total}',
    'blog.previousPage': 'Página anterior',
    'blog.nextPage': 'Próxima página',
    'blog.notFoundTitle': 'Artigo não encontrado',
    'blog.notFoundDescription': 'Esse slug não existe ou o texto ainda não foi publicado.',
    'blog.backToBlog': 'Voltar para o blog',
    'blog.by': 'POR',
    'til.seoDescription': 'Notas curtas sobre coisas que Clebson está aprendendo em engenharia de software.',
    'til.kicker': 'TODAY I LEARNED',
    'til.title': 'Notas de aprendizado',
    'til.description': 'Registros curtos do que estou aprendendo, testando ou revisitando no dia a dia.',
    'til.paginationLabel': 'Paginação dos TILs',
    'til.notFoundTitle': 'TIL não encontrado',
    'til.backToTil': 'Voltar para TIL',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.blog': 'Blog',
    'nav.til': 'TIL',
    'nav.portfolio': 'Portfolio',
    'nav.hobbies': 'Hobbies',
    'nav.books': 'Books',
    'nav.primary': 'Primary',
    'nav.primaryMobile': 'Primary mobile',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'language.label': 'Language',
    'language.pt': 'Português',
    'language.en': 'English',
    'footer.madeWith': 'Built with Vite, coffee, and explicit decisions.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'blog.kicker': 'ENGINEERING BLOG',
    'blog.title': 'Engineering in the field',
    'blog.description': 'Notes on software architecture, interfaces, operations, and technical decisions without corporate varnish.',
    'blog.recentArticles': 'RECENT ARTICLES',
    'blog.paginationLabel': 'Post pagination',
    'blog.pageStatus': 'Page {current} of {total}',
    'blog.previousPage': 'Previous page',
    'blog.nextPage': 'Next page',
    'blog.notFoundTitle': 'Article not found',
    'blog.notFoundDescription': 'This slug does not exist or the article has not been published yet.',
    'blog.backToBlog': 'Back to blog',
    'blog.by': 'BY',
    'til.seoDescription': 'Short notes about things Clebson is learning in software engineering.',
    'til.kicker': 'TODAY I LEARNED',
    'til.title': 'Learning notes',
    'til.description': 'Short records of what I am learning, testing, or revisiting day to day.',
    'til.paginationLabel': 'TIL pagination',
    'til.notFoundTitle': 'TIL not found',
    'til.backToTil': 'Back to TIL',
  },
}

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
  format: (key: TranslationKey, values: Record<string, string | number>) => string
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
  if (typeof window !== 'undefined') {
    const persisted = normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
    if (persisted) return persisted
  }

  if (typeof navigator !== 'undefined') {
    const browserLocales = [navigator.language, ...(navigator.languages ?? [])]
    const detected = browserLocales.map(normalizeLocale).find(Boolean)
    if (detected) return detected
  }

  return 'pt-BR'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = React.useState<Locale>(() => detectInitialLocale())

  React.useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = React.useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: updateLocale,
    t: (key) => translations[locale][key],
    format: (key, values) => Object.entries(values).reduce(
      (message, [name, value]) => message.split(`{${name}}`).join(String(value)),
      translations[locale][key],
    ),
  }), [locale])

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
