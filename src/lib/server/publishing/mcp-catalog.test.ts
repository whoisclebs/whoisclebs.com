import { describe, expect, it } from 'vitest'
import { getPublishedNotes } from '$lib/content/notes'
import { getPublishedPosts } from '$lib/content/posts'
import { projects } from '$lib/content/projects'
import { caseStudies } from '$lib/content/cases/index'
import { SITE_URL } from '$lib/routing/paths'
import { llmsFull } from './llms'
import { articleUri, buildCatalogEntries, noteUri, PROFILE_URI, projectUri } from './mcp-catalog'

const entries = buildCatalogEntries()
const uris = entries.map((entry) => entry.uri)

describe('buildCatalogEntries (catálogo MCP a partir da camada de conteúdo)', () => {
  it('tem o perfil, todos os projetos, artigos publicados nos dois idiomas e notas', () => {
    expect(uris[0]).toBe(PROFILE_URI)
    expect(uris).toEqual(
      expect.arrayContaining([
        ...projects.map((project) => projectUri(project.slug)),
        ...getPublishedPosts('pt-BR').map((post) => articleUri(post.slug, 'pt-BR')),
        ...getPublishedPosts('en').map((post) => articleUri(post.slug, 'en')),
        ...getPublishedNotes().map((note) => noteUri(note.slug)),
      ]),
    )
    expect(entries).toHaveLength(1 + projects.length + getPublishedPosts('pt-BR').length + getPublishedPosts('en').length + getPublishedNotes().length)
    expect(new Set(uris).size).toBe(uris.length)
  })

  it('usa URIs próprias por idioma para artigos com o mesmo slug', () => {
    expect(articleUri('x', 'pt-BR')).toBe('whoisclebs://articles/x')
    expect(articleUri('x', 'en')).toBe('whoisclebs://en/articles/x')
  })

  it('não expõe rascunho: nenhum artigo com published: false', () => {
    const published = new Set(getPublishedPosts('pt-BR').map((post) => post.slug))
    const drafts = entries.filter((entry) => entry.uri.startsWith('whoisclebs://articles/') && !published.has(entry.uri.slice('whoisclebs://articles/'.length)))
    expect(drafts).toEqual([])
  })

  it('não duplica nem inventa texto: todo recurso é um trecho de /llms-full.txt', () => {
    const full = llmsFull()
    for (const entry of entries) expect(full.includes(entry.text), entry.uri).toBe(true)
  })

  it('cases trazem o estudo inteiro e toda URL é canônica do site', () => {
    for (const study of caseStudies) {
      const entry = entries.find((candidate) => candidate.uri === projectUri(study.slug))
      expect(entry?.text).toContain(study.dek)
      expect(entry?.url).toBe(`${SITE_URL}/projetos/${study.slug}/`)
    }
    for (const entry of entries) {
      expect(entry.url.startsWith(`${SITE_URL}/`), entry.uri).toBe(true)
      expect(entry.title.trim(), entry.uri).not.toBe('')
      expect(entry.mimeType).toBe('text/markdown')
    }
  })
})
