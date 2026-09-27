import type { Locale } from '$lib/i18n'
import type { Alternates } from '$lib/routing/paths'

export const SITE_NAME = 'Clebson Augusto'
/** Imagens Open Graph geradas no build (`scripts/build-og.mjs`, 1200×630, ≤ 100 KiB). */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const
export const DEFAULT_IMAGE = '/og/default.png'
export const DEFAULT_IMAGE_ALT = 'Símbolo WHOISCLEBS: um bloco de terminal com um C e um cursor, sobre papel quadriculado.'

/** Imagem OG própria de um case (gerada para cada slug de `caseStudies`). */
export function ogImagePath(slug: string): string {
  return `/og/${slug}.png`
}

export function ogImageAlt(name: string): string {
  return `Símbolo WHOISCLEBS e o nome ${name} em letras de células, sobre papel quadriculado.`
}

export type JsonLd = Record<string, unknown>

/** Metadados de cada página. Toda rota devolve o seu em `data.seo`; o layout só renderiza. */
export type Seo = {
  title: string
  description: string
  /** Caminho canônico com barra final, ex.: `/sobre/`. */
  path: string
  locale: Locale
  alternates?: Alternates
  /** `false` quando as alternativas não são tradução uma da outra (o seletor de idioma usa, o hreflang não). */
  hreflang?: boolean
  type?: 'website' | 'article'
  /** Imagem Open Graph gerada no build; padrão `DEFAULT_IMAGE`. */
  image?: string
  imageAlt?: string
  publishedTime?: string
  modifiedTime?: string
  jsonLd?: JsonLd | JsonLd[]
}

export function pageTitle(title: string): string {
  return `${title} – ${SITE_NAME}`
}
