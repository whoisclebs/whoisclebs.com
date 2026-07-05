import type { Locale } from './i18n'

export const localeSegments: Partial<Record<Locale, string>> = {
  en: 'en',
}

export function localeFromSegment(segment: string | undefined): Locale | null {
  if (segment === 'en') return 'en'
  return null
}

export function segmentFromLocale(locale: Locale): string {
  return locale === 'en' ? 'en' : ''
}

export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (localeFromSegment(parts[0])) {
    const rest = parts.slice(1).join('/')
    return rest ? `/${rest}` : '/'
  }
  return pathname || '/'
}

export function localizePath(path: string, locale: Locale): string {
  const [pathnameWithSearch, hash = ''] = path.split('#')
  const [pathname, search = ''] = pathnameWithSearch.split('?')
  const cleanPath = stripLocaleFromPath(pathname)
  const segment = segmentFromLocale(locale)

  if (segment) {
    const localizedPath = cleanPath === '/'
      ? `/${segment}`
      : `/${segment}${cleanPath}`
    return `${localizedPath}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`
  }

  // No prefix for the default locale (pt-BR)
  return `${cleanPath}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`
}
