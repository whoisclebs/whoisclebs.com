import type { Locale } from './i18n'

export const localeSegments: Record<Locale, string> = {
  'pt-BR': 'pt',
  en: 'en',
}

export function localeFromSegment(segment: string | undefined): Locale | null {
  if (segment === 'pt') return 'pt-BR'
  if (segment === 'en') return 'en'
  return null
}

export function segmentFromLocale(locale: Locale): string {
  return localeSegments[locale]
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
  const localizedPath = cleanPath === '/'
    ? `/${segmentFromLocale(locale)}`
    : `/${segmentFromLocale(locale)}${cleanPath}`

  return `${localizedPath}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`
}
