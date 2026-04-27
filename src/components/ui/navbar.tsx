import React from 'react'
import { Link, NavLink } from 'react-router'
import { Menu, X } from 'lucide-react'
import { useI18n, type Locale } from '@/lib/i18n'

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

function LanguageSelect() {
  const { locale, setLocale, t } = useI18n()

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="border border-[#1a1a1a] bg-white px-2 py-1 font-mono text-xs uppercase tracking-[0.1em]"
        aria-label={t('language.label')}
      >
        {locales.map((item) => (
          <option key={item} value={item}>{item === 'pt-BR' ? t('language.pt') : t('language.en')}</option>
        ))}
      </select>
    </label>
  )
}

function NavigationLinks({ onClick }: { onClick?: () => void }) {
  const { t } = useI18n()

  return navigationItems.map((item) => (
    <NavLink key={item.to} to={item.to} onClick={onClick} className={({ isActive }) => isActive ? 'font-medium' : ''}>
      {t(item.labelKey)}
    </NavLink>
  ))
}

const Navbar: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-6 px-4 md:px-6">
        <Link to="/" className="text-xl font-extrabold tracking-[-0.04em] md:text-2xl">whoisclebs.com</Link>
        <div className="flex items-center gap-3 md:hidden">
          <LanguageSelect />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center border border-[#1a1a1a]"
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
        <nav className="hidden flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.1em] md:flex" aria-label={t('nav.primary')}>
          <NavigationLinks />
          <LanguageSelect />
        </nav>
      </div>
      {open && (
        <nav className="border-t border-[#1a1a1a] bg-white px-4 py-4 font-mono text-xs uppercase tracking-[0.1em] md:hidden" aria-label={t('nav.primaryMobile')}>
          <div className="mx-auto grid w-full max-w-[1280px] gap-4">
            <NavigationLinks onClick={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar
