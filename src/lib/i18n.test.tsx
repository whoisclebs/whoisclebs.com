import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { I18nProvider, i18nStorageKey, useI18n } from './i18n'

function LocaleProbe() {
  const { locale, t } = useI18n()
  return <p>{locale} — {t('nav.about')}</p>
}

describe('i18n provider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('uses persisted language before browser language', () => {
    window.localStorage.setItem(i18nStorageKey, 'en')

    render(
      <I18nProvider>
        <LocaleProbe />
      </I18nProvider>,
    )

    expect(screen.getByText('en — About')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('detects Portuguese browser language for first visits', () => {
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'pt-BR' })
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['pt-BR', 'en-US'] })

    render(
      <I18nProvider>
        <LocaleProbe />
      </I18nProvider>,
    )

    expect(screen.getByText('pt-BR — Sobre')).toBeInTheDocument()
    expect(window.localStorage.getItem(i18nStorageKey)).toBe('pt-BR')
  })
})
