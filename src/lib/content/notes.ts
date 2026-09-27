/**
 * Notas (antigo TIL). Fonte: `src/content/til/*.md`. Só pt-BR por enquanto.
 * Só importar em código de servidor.
 */
import type { Locale } from '$lib/i18n'
import { absoluteUrl, notePath } from '$lib/routing/paths'
import { formatIssues, noteFrontmatterSchema, parseFrontmatter } from './schema'
import { sortByDateDesc } from './sort'

export type Note = {
  file: string
  slug: string
  locale: Locale
  title: string
  kicker: string
  date: string
  updated?: string
  excerpt: string
  published: boolean
  sources: string[]
  path: string
  canonical: string
  body: string
}

export type NoteSummary = Omit<Note, 'body' | 'file'>

export function loadNotes(sources: Record<string, string>): Note[] {
  const errors: string[] = []
  const notes: Note[] = []
  for (const [file, raw] of Object.entries(sources)) {
    let parsed: ReturnType<typeof parseFrontmatter>
    try {
      parsed = parseFrontmatter(raw)
    } catch (error) {
      errors.push(`  ${file}: ${(error as Error).message}`)
      continue
    }
    const result = noteFrontmatterSchema.safeParse(parsed.data)
    if (!result.success) {
      errors.push(formatIssues(file, result.error))
      continue
    }
    if (result.data.locale !== 'pt-BR') {
      errors.push(`  ${file}: [locale] notas só existem em pt-BR (não há rota /en/ de notas)`)
      continue
    }
    const path = notePath(result.data.slug)
    notes.push({ file, ...result.data, sources: result.data.sources ?? [], path, canonical: absoluteUrl(path), body: parsed.body })
  }
  const slugs = notes.map((note) => note.slug)
  const duplicated = slugs.filter((slug, index) => slugs.indexOf(slug) !== index)
  if (duplicated.length > 0) errors.push(`  slugs duplicados em notas: ${duplicated.join(', ')}`)
  if (errors.length > 0) throw new Error(`Conteúdo inválido em notas:\n${errors.join('\n')}`)
  return sortByDateDesc(notes)
}

const sources = import.meta.glob<string>('/src/content/til/*.md', { eager: true, query: '?raw', import: 'default' })
const notes = loadNotes(sources)

export function getPublishedNotes(): Note[] {
  return notes.filter((note) => note.published)
}

export function getNote(slug: string): Note | undefined {
  return getPublishedNotes().find((note) => note.slug === slug)
}

export function toNoteSummary({ body: _body, file: _file, ...summary }: Note): NoteSummary {
  return summary
}
