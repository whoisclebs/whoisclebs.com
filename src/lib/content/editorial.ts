/**
 * Regras editoriais puras de Escrita e Notas: assunto, tempo de leitura, agrupamento, sumário,
 * termo legado dos comentários e relação escrita ↔ projeto. Sem I/O; testado em editorial.test.ts.
 */
import type { Locale } from '$lib/i18n'
import { getProject } from './projects'
import type { Project } from './schema'

export type Topic = { slug: string; label: string }

/** Rótulos com grafia própria (siglas, nomes de mercado). O resto vira caixa de frase. */
const topicLabels: Record<string, string> = {
  devops: 'DevOps',
  seo: 'SEO',
  'open-source': 'Open source',
}

/** O `kicker` herdado do site antigo (caixa-alta) é o assunto; slug ASCII para `/escrita/assunto/<slug>/`. */
export function topicFromKicker(kicker: string): Topic {
  const slug = kicker
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const lower = kicker.toLocaleLowerCase('pt-BR')
  const label = topicLabels[slug] ?? `${lower.charAt(0).toLocaleUpperCase('pt-BR')}${lower.slice(1)}`
  return { slug, label }
}

/** Minutos declarados no front matter ("6 MIN DE LEITURA", "20 MIN READ"). */
export function readingMinutes(readingTime: string): number {
  const match = /(\d+)/.exec(readingTime)
  if (!match) throw new Error(`readingTime sem número de minutos: "${readingTime}"`)
  return Number(match[1])
}

/** Estimativa para notas (sem campo no front matter): 200 palavras/min, sem contar blocos de código. */
export function estimateReadingMinutes(markdown: string): number {
  const prose = markdown.replace(/```[\s\S]*?```/g, ' ')
  const words = prose.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function groupByYear<T extends { date: string }>(items: T[]): Array<{ year: string; items: T[] }> {
  const groups: Array<{ year: string; items: T[] }> = []
  for (const item of items) {
    const year = item.date.slice(0, 4)
    const last = groups.at(-1)
    if (last && last.year === year) last.items.push(item)
    else groups.push({ year, items: [item] })
  }
  return groups
}

/** Artigo "longo" o bastante para ganhar sumário: quatro seções ou mais. */
export function shouldShowToc(toc: ReadonlyArray<unknown>): boolean {
  return toc.length >= 4
}

/**
 * Termo das discussões do Giscus. O site antigo usava `data-mapping="pathname"`, e o client do Giscus
 * calcula o termo como `location.pathname.substring(1)`; as URLs antigas tinham barra final.
 * Mapear pelo caminho antigo mantém qualquer thread criada em `/blog/…` ou `/til/…` ligada ao texto.
 */
export function legacyCommentTerm(entry: { kind: 'article' | 'note'; slug: string; locale: Locale }): string {
  if (entry.kind === 'note') return `til/${entry.slug}/`
  return entry.locale === 'en' ? `en/blog/${entry.slug}/` : `blog/${entry.slug}/`
}

export type RelatedEntry = { slug: string; title: string; path: string; date: string; projects: string[] }

/** Projetos declarados no front matter (`projects: tuxedo, golpher`). Slug desconhecido é erro de conteúdo. */
export function projectsForEntry(entry: Pick<RelatedEntry, 'slug' | 'projects'>): Project[] {
  return entry.projects.map((slug) => {
    const project = getProject(slug)
    if (!project) throw new Error(`"${entry.slug}" declara projeto inexistente: ${slug}`)
    return project
  })
}

/** O inverso da declaração: a escrita que cita o projeto, mais recente primeiro. */
export function writingForProject<T extends RelatedEntry>(projectSlug: string, entries: T[]): T[] {
  return entries.filter((entry) => entry.projects.includes(projectSlug)).sort((a, b) => b.date.localeCompare(a.date))
}
