/**
 * Entradas do catálogo MCP (`/mcp`) montadas da mesma camada de conteúdo que as páginas e `/llms-full.txt`.
 * O texto de cada recurso é a seção correspondente de `/llms-full.txt` (mesmas funções), então pessoas,
 * `/llms-full.txt` e clientes MCP leem o mesmo conteúdo canônico (spec §5.5). Nada vem do D1.
 */
import type { Locale } from '$lib/i18n'
import { getMessages } from '$lib/i18n'
import { author } from '$lib/content/library'
import { getPublishedNotes } from '$lib/content/notes'
import { getPublishedPosts } from '$lib/content/posts'
import { projects } from '$lib/content/projects'
import { getCaseStudy } from '$lib/content/cases/index'
import { absoluteUrl, pages, projectPath } from '$lib/routing/paths'
import type { CatalogEntry } from '../domain/content-catalog'
import { caseSection, entrySection, profileSection, projectSummary } from './llms'
import { JOB_TITLE } from './structured-data'

export const PROFILE_URI = 'whoisclebs://profile'

export function projectUri(slug: string): string {
  return `whoisclebs://projects/${slug}`
}

/** pt-BR é o idioma principal; artigos em inglês com o mesmo slug ganham o prefixo `en/`. */
export function articleUri(slug: string, locale: Locale): string {
  return locale === 'en' ? `whoisclebs://en/articles/${slug}` : `whoisclebs://articles/${slug}`
}

export function noteUri(slug: string): string {
  return `whoisclebs://notes/${slug}`
}

export function buildCatalogEntries(): CatalogEntry[] {
  const t = getMessages('pt-BR')
  const entries: CatalogEntry[] = [
    {
      uri: PROFILE_URI,
      type: 'profile',
      title: `${author.name} — ${JOB_TITLE['pt-BR']}`,
      description: t.about.intro,
      url: absoluteUrl(pages.about['pt-BR']),
      locale: 'pt-BR',
      mimeType: 'text/markdown',
      text: profileSection(),
    },
  ]
  for (const project of projects) {
    const study = getCaseStudy(project.slug)
    entries.push({
      uri: projectUri(project.slug),
      type: 'project',
      title: study?.title ?? project.name,
      description: study?.dek ?? t.openSource.projects[project.slug as keyof typeof t.openSource.projects],
      url: absoluteUrl(projectPath(project.slug, 'pt-BR')),
      locale: 'pt-BR',
      date: study?.checkedAt ?? project.statusCheckedAt,
      mimeType: 'text/markdown',
      text: study ? caseSection(study) : projectSummary(project),
    })
  }
  for (const locale of ['pt-BR', 'en'] as const) {
    for (const post of getPublishedPosts(locale)) {
      entries.push({
        uri: articleUri(post.slug, locale),
        type: 'article',
        title: post.title,
        description: post.excerpt,
        url: post.canonical,
        locale,
        date: post.updated ?? post.date,
        mimeType: 'text/markdown',
        text: entrySection(post, locale === 'en' ? 'Article' : 'Artigo'),
      })
    }
  }
  for (const note of getPublishedNotes()) {
    entries.push({
      uri: noteUri(note.slug),
      type: 'note',
      title: note.title,
      description: note.excerpt,
      url: note.canonical,
      locale: note.locale,
      date: note.updated ?? note.date,
      mimeType: 'text/markdown',
      text: entrySection(note, 'Nota'),
    })
  }
  return entries
}
