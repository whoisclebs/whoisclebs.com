import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import Til from './til'
import TilPost from './til-post'
import { I18nProvider, i18nStorageKey } from '@/lib/i18n'

function renderTilRoute(initialEntry: string, route: ReactNode) {
  window.localStorage.setItem(i18nStorageKey, 'pt-BR')
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nProvider>{route}</I18nProvider>
    </MemoryRouter>,
  )
}

describe('today i learned pages', () => {
  it('renders TIL entries from markdown', () => {
    renderTilRoute('/til',
        <Routes>
          <Route path="/til" element={<Til />} />
        </Routes>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /notas de aprendizado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /docker healthcheck para serviços pequenos/i })).toHaveAttribute('href', '/til/docker-healthcheck-para-servicos')
    expect(screen.getByTestId('til-grid')).toBeInTheDocument()
    expect(screen.getByText(/página 1 de 1/i)).toBeInTheDocument()
    expect(screen.getByText(/próxima página/i)).toBeInTheDocument()
  })

  it('renders a TIL detail page with comments', () => {
    renderTilRoute('/til/docker-healthcheck-para-servicos',
        <Routes>
          <Route path="/til/:slug" element={<TilPost />} />
        </Routes>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /docker healthcheck para serviços pequenos/i })).toBeInTheDocument()
    expect(screen.getByText('dockerfile')).toBeInTheDocument()
    expect(screen.getByLabelText(/comentários/i)).toBeInTheDocument()
  })
})
