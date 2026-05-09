import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import Navbar from './navbar'
import { I18nProvider, i18nStorageKey } from '@/lib/i18n'
import { ThemeProvider, themeStorageKey } from '@/lib/theme'

function renderNavbar() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <I18nProvider>
          <Navbar />
        </I18nProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('navbar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(i18nStorageKey, 'pt-BR')
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
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

  it('toggles and persists dark mode', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getAllByRole('button', { name: /usar tema escuro/i })[0])

    expect(window.localStorage.getItem(themeStorageKey)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getAllByRole('button', { name: /usar tema claro/i })[0]).toHaveAttribute('aria-pressed', 'true')
  })
})
