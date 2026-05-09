import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { I18nProvider, i18nStorageKey, useI18n } from './i18n'

function LocaleProbe() {
  const { locale, t } = useI18n()
  return <p>{locale}: {t('nav.about')}</p>
}

function renderWithRouter(children: React.ReactNode, initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>,
  )
}

describe('i18n provider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('uses persisted language before browser language when the URL has no locale', () => {
    window.localStorage.setItem(i18nStorageKey, 'en')

    renderWithRouter(<LocaleProbe />)

    expect(screen.getByText('en: About')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('detects Portuguese browser language for first visits', () => {
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'pt-BR' })
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['pt-BR', 'en-US'] })

    renderWithRouter(<LocaleProbe />)

    expect(screen.getByText('pt-BR: Sobre')).toBeInTheDocument()
    expect(window.localStorage.getItem(i18nStorageKey)).toBe('pt-BR')
  })

  it('uses the locale from the URL over persisted language', () => {
    window.localStorage.setItem(i18nStorageKey, 'pt-BR')

    renderWithRouter(<LocaleProbe />, '/en/blog')

    expect(screen.getByText('en: About')).toBeInTheDocument()
    expect(window.localStorage.getItem(i18nStorageKey)).toBe('en')
  })
})
