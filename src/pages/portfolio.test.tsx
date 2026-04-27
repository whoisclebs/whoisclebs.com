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
    expect(screen.getByTestId('books-grid')).toHaveClass('md:grid-cols-2')
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText(/links afiliados amazon/i)).toBeInTheDocument()
  })
})
