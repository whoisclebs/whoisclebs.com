import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import Home from './home'
import Portfolio from './portfolio'
import Books from './books'
import { I18nProvider, i18nStorageKey } from '@/lib/i18n'

function withI18n(children: ReactNode) {
  return <I18nProvider>{children}</I18nProvider>
}

describe('editorial secondary pages', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(i18nStorageKey, 'pt-BR')
  })

  it('renders the minimal home with open source projects and latest writing', () => {
    render(
      <MemoryRouter>
        {withI18n(<Home />)}
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: /conheca meu trabalho/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /tuxedo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /seishin engine/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /rsgit/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ler artigos/i })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: /ver projetos/i })).toHaveAttribute('href', '/portfolio')
    expect(screen.getByText(/um orquestrador de agentes em go/i)).toBeInTheDocument()
    expect(screen.getByText(/runtimes, wasm e sistemas distribuídos/i)).toBeInTheDocument()
    expect(screen.getByText(/uma pilha de notas que ainda precisa virar texto/i)).toBeInTheDocument()
    expect(screen.getByText(/atualizado em 02 jul\. 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/CONSTRUINDO/)).toBeInTheDocument()
    expect(screen.getByText(/ESTUDANDO/)).toBeInTheDocument()
    expect(screen.getByText(/LENDO/)).toBeInTheDocument()
  })

  it('renders the portfolio page in editorial sections', () => {
    render(
      <MemoryRouter initialEntries={['/portfolio']}>
        {withI18n(
          <Routes>
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>,
        )}
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /trabalho aplicado em software real/i })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByText('PAGAMENTOS')).toBeInTheDocument()
  })

  it('renders books with the same editorial visual hierarchy', () => {
    render(
      <MemoryRouter>
        {withI18n(<Books />)}
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /biblioteca de engenharia/i })).toBeInTheDocument()
    expect(screen.getByTestId('books-carousel')).toHaveClass('overflow-x-auto')
    expect(screen.getByRole('button', { name: /livro anterior/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pr.ximo livro/i })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText(/links afiliados amazon/i)).toBeInTheDocument()
  })
})
