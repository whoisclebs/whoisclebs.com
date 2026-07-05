import React from 'react'
import { Link, NavLink } from 'react-router'
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react'
import { useI18n, type Locale } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { useLocalizedPath } from '@/lib/use-localized-path'

const navigationItems = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/blog', labelKey: 'nav.blog' },
  { to: '/til', labelKey: 'nav.til' },
  { to: '/portfolio', labelKey: 'nav.portfolio' },
  { to: '/hobbies', labelKey: 'nav.hobbies' },
  { to: '/books', labelKey: 'nav.books' },
] as const

const locales: Locale[] = ['pt-BR', 'en']

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'

  return (
    <button
      type="button"
      data-nav-item
      className="inline-flex size-[38px] cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-graphite hover:text-bg"
      aria-label={label}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  )
}

function LanguageSelect() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="relative inline-flex cursor-pointer items-center border border-line transition-colors hover:bg-graphite hover:text-bg">
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="cursor-pointer appearance-none bg-transparent py-[7px] pr-7 pl-3 font-mono text-[11px] font-bold uppercase tracking-[1.1px] text-current outline-none"
        aria-label={t('language.label')}
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-paper text-ink">
            {item === 'pt-BR' ? t('language.pt') : t('language.en')}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-3" aria-hidden="true" />
    </div>
  )
}

function NavigationLinks({ onClick }: { onClick?: () => void }) {
  const { t } = useI18n()
  const localizedPath = useLocalizedPath()

  return navigationItems.map((item) => (
    <NavLink
      key={item.to}
      to={localizedPath(item.to)}
      onClick={onClick}
      data-nav-item
      className={({ isActive }) =>
        isActive
          ? 'relative font-mono text-[11px] font-bold uppercase tracking-[1.15px] text-accent after:absolute after:-bottom-[6px] after:left-0 after:h-0.5 after:w-full after:bg-accent'
          : 'font-mono text-[11px] font-bold uppercase tracking-[1.15px] text-muted transition-colors hover:text-ink'
      }
    >
      {t(item.labelKey)}
    </NavLink>
  ))
}

const Navbar: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const { t } = useI18n()
  const localizedPath = useLocalizedPath()

  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md">
      {/* Top rule */}
      <div className="border-t border-line" />

      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-4 py-[10px] md:px-6">
        {/* Brand area */}
        <div className="flex shrink-0 flex-col">
          <Link
            to={localizedPath('/')}
            data-nav-item
            className="font-serif text-[25px] font-extrabold leading-none text-ink"
          >
            Clebson Augusto
          </Link>
          <p className="mt-0.5 font-mono text-[10px] font-normal uppercase tracking-[1.1px] text-muted">
            WHOISCLEBS / SOFTWARE ENGINEER / João Pessoa
          </p>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <LanguageSelect />
          <button
            type="button"
            data-nav-item
            className="inline-flex size-[38px] cursor-pointer items-center justify-center border border-line transition-colors hover:bg-graphite hover:text-bg"
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X size={15} aria-hidden="true" /> : <Menu size={15} aria-hidden="true" />}
          </button>
        </div>

        {/* Desktop nav + controls */}
        <nav className="hidden items-center gap-5 md:flex" aria-label={t('nav.primary')}>
          <NavigationLinks />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelect />
          </div>
        </nav>
      </div>

      {/* Bottom rule */}
      <div className="border-t border-line" />

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-line bg-paper px-4 py-4 font-mono text-xs uppercase tracking-[0.1em] md:hidden" aria-label={t('nav.primaryMobile')}>
          <div className="mx-auto grid w-full max-w-[1280px] gap-4">
            <NavigationLinks onClick={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar
