import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import Home from './home'
import Portfolio from './portfolio'
import Books from './books'

describe('editorial secondary pages', () => {
  it('connects the home work CTA to the local portfolio route', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /conheça meu trabalho/i })).toHaveAttribute('href', '/portfolio')
    expect(screen.getByRole('heading', { name: /tuxedo/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apoiar no github sponsors/i })).toHaveAttribute('href', 'https://github.com/sponsors/whoisclebs')
    expect(screen.getByRole('link', { name: /docker healthcheck para serviços pequenos/i })).toHaveAttribute('href', '/til/docker-healthcheck-para-servicos')
  })

  it('renders the portfolio page in editorial sections', () => {
    render(
      <MemoryRouter initialEntries={['/portfolio']}>
        <Routes>
          <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /trabalho aplicado em software real/i })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getByText('PAGAMENTOS')).toBeInTheDocument()
  })

  it('renders books with the same editorial visual hierarchy', () => {
    render(
      <MemoryRouter>
        <Books />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /biblioteca de engenharia/i })).toBeInTheDocument()
    expect(screen.getByTestId('books-carousel')).toHaveClass('overflow-x-auto')
    expect(screen.getByRole('button', { name: /livro anterior/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /próximo livro/i })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText(/links afiliados amazon/i)).toBeInTheDocument()
  })
})
