import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import Home from './home'
import Hobbies from './hobbies'

describe('hobbies page', () => {
  it('renders hobbies with board game placeholders and external profiles', () => {
    render(
      <MemoryRouter initialEntries={['/hobbies']}>
        <Routes>
          <Route path="/hobbies" element={<Hobbies />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /fora do editor/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /steamcommunity.com\/id\/struzinov/i })).toHaveAttribute('href', 'https://steamcommunity.com/id/struzinov/')
    expect(screen.getAllByAltText(/capa do jogo/i)).toHaveLength(4)
    expect(screen.getByRole('heading', { name: /azul: master chocolatier/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /clank!/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /scrabble/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /stella/i })).toBeInTheDocument()
  })

  it('shows YouTube alongside social icons on home', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /youtube/i })).toHaveAttribute('href', 'https://www.youtube.com/@whoisclebs')
  })
})
