import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import Navbar from './navbar'
import { I18nProvider, i18nStorageKey } from '@/lib/i18n'

function renderNavbar() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <Navbar />
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('navbar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(i18nStorageKey, 'pt-BR')
  })

  it('orders desktop navigation links', () => {
    renderNavbar()

    const labels = screen.getByLabelText('Principal').querySelectorAll('a')
    expect([...labels].map((link) => link.textContent)).toEqual(['Home', 'Sobre', 'Blog', 'TIL', 'Portfolio', 'Hobbies', 'Livros'])
  })

  it('opens mobile hamburger menu', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getByRole('button', { name: /abrir menu/i }))
    expect(screen.getByLabelText('Principal mobile')).toBeInTheDocument()
  })

  it('persists the selected language', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.selectOptions(screen.getAllByLabelText(/idioma/i)[0], 'en')

    expect(window.localStorage.getItem(i18nStorageKey)).toBe('en')
    expect(screen.getByLabelText('Primary')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })
})
