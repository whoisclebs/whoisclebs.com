import type { Locale } from '$lib/i18n'
import { SITE_URL } from '$lib/content/schema'

export { SITE_URL }

/** Páginas fixas e seus caminhos por idioma. Ausente = página só existe naquele idioma. */
const pageTable = {
  home: { 'pt-BR': '/', en: '/en/' },
  projects: { 'pt-BR': '/projetos/', en: '/en/projects/' },
  writing: { 'pt-BR': '/escrita/', en: '/en/writing/' },
  notes: { 'pt-BR': '/notas/' },
  about: { 'pt-BR': '/sobre/', en: '/en/about/' },
  contact: { 'pt-BR': '/contato/' },
  agents: { 'pt-BR': '/agentes/' },
  books: { 'pt-BR': '/livros/', en: '/en/books/' },
  hobbies: { 'pt-BR': '/hobbies/', en: '/en/hobbies/' },
  privacy: { 'pt-BR': '/privacy-policy/', en: '/en/privacy-policy/' },
  terms: { 'pt-BR': '/terms-of-use/', en: '/en/terms-of-use/' },
} as const satisfies Record<string, Partial<Record<Locale, string>>>

export type PageKey = keyof typeof pageTable
type BothLocales = { [K in PageKey]: (typeof pageTable)[K] extends Record<Locale, string> ? K : never }[PageKey]

/** Tabela de páginas; as que existem nos dois idiomas aceitam indexação por `Locale`. */
export const pages: { [K in PageKey]: K extends BothLocales ? Record<Locale, string> : { 'pt-BR': string } & Partial<Record<Locale, string>> } = pageTable
export type Alternates = Partial<Record<Locale, string>>

export function pagePath(key: PageKey, locale: Locale): string | undefined {
  const entry: Alternates = pages[key]
  return entry[locale]
}

/** Caminho no idioma pedido ou, se não houver tradução, no pt-BR. */
export function pagePathOrDefault(key: PageKey, locale: Locale): string {
  return pagePath(key, locale) ?? pages[key]['pt-BR']
}

export function articlePath(slug: string, locale: Locale): string {
  return locale === 'en' ? `/en/writing/${slug}/` : `/escrita/${slug}/`
}

/** Índice de Escrita filtrado por assunto (link HTML, página prerenderizada; sem JS). */
export function topicPath(slug: string, locale: Locale): string {
  return locale === 'en' ? `/en/writing/topic/${slug}/` : `/escrita/assunto/${slug}/`
}

export function projectPath(slug: string, locale: Locale): string {
  return locale === 'en' ? `/en/projects/${slug}/` : `/projetos/${slug}/`
}

export function notePath(slug: string): string {
  return `/notas/${slug}/`
}

export function absoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`
}
