import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import Navbar from './navbar'

describe('navbar', () => {
  it('orders desktop navigation links', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const labels = screen.getByLabelText('Principal').querySelectorAll('a')
    expect([...labels].map((link) => link.textContent)).toEqual(['Home', 'Sobre', 'Blog', 'TIL', 'Portfolio', 'Hobbies', 'Livros'])
  })

  it('opens mobile hamburger menu', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /abrir menu/i }))
    expect(screen.getByLabelText('Principal mobile')).toBeInTheDocument()
  })
})
