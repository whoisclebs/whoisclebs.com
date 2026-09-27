import type { Locale } from '$lib/i18n'
import type { Alternates } from '$lib/routing/paths'

export const SITE_NAME = 'Clebson Augusto'
export const DEFAULT_IMAGE = '/profile/clebson.png'

export type JsonLd = Record<string, unknown>

/** Metadados de cada página. Toda rota devolve o seu em `data.seo`; o layout só renderiza. */
export type Seo = {
  title: string
  description: string
  /** Caminho canônico com barra final, ex.: `/sobre/`. */
  path: string
  locale: Locale
  alternates?: Alternates
  type?: 'website' | 'article'
  image?: string
  publishedTime?: string
  modifiedTime?: string
  jsonLd?: JsonLd | JsonLd[]
}

export function pageTitle(title: string): string {
  return `${title} – ${SITE_NAME}`
}

export const person: JsonLd = {
  '@type': 'Person',
  name: 'Clebson A. Fonseca',
  alternateName: 'Clebson Augusto',
  url: 'https://whoisclebs.com/',
  image: 'https://whoisclebs.com/profile/clebson.png',
  sameAs: ['https://github.com/whoisclebs', 'https://linkedin.com/in/whoisclebs'],
  jobTitle: 'Software Engineer',
}
