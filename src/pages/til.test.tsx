import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import Til from './til'
import TilPost from './til-post'

describe('today i learned pages', () => {
  it('renders TIL entries from markdown', () => {
    render(
      <MemoryRouter initialEntries={['/til']}>
        <Routes>
          <Route path="/til" element={<Til />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /notas de aprendizado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /docker healthcheck para serviços pequenos/i })).toHaveAttribute('href', '/til/docker-healthcheck-para-servicos')
    expect(screen.getByTestId('til-grid')).toBeInTheDocument()
    expect(screen.getByText(/página 1 de 1/i)).toBeInTheDocument()
    expect(screen.getByText(/próxima página/i)).toBeInTheDocument()
  })

  it('renders a TIL detail page with comments', () => {
    render(
      <MemoryRouter initialEntries={['/til/docker-healthcheck-para-servicos']}>
        <Routes>
          <Route path="/til/:slug" element={<TilPost />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /docker healthcheck para serviços pequenos/i })).toBeInTheDocument()
    expect(screen.getByText('dockerfile')).toBeInTheDocument()
    expect(screen.getByLabelText(/comentários/i)).toBeInTheDocument()
  })
})
