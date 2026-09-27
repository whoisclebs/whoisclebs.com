import { describe, expect, it } from 'vitest'
import { getNote, getPublishedNotes, loadNotes } from './notes'
import { getPost, getPublishedPosts, getTranslation, loadPosts } from './posts'
import { projects } from './projects'
import { canonicalSchema, isoDateSchema, parseFrontmatter, postFrontmatterSchema } from './schema'

const validPost = {
  slug: 'exemplo',
  title: 'Título',
  kicker: 'DEVOPS',
  date: '2025-09-16',
  readingTime: '6 MIN',
  author: 'whoisclebs',
  excerpt: 'Resumo.',
  cover: 'https://images.example.com/capa.jpg',
  coverAlt: 'Descrição',
  published: 'true',
  locale: 'pt-BR',
}

function markdown(data: Record<string, string>, body = 'Corpo.') {
  return `---\n${Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${body}`
}

describe('schema de artigo', () => {
  it('aceita um front matter válido e converte published', () => {
    const parsed = postFrontmatterSchema.parse(validPost)
    expect(parsed.published).toBe(true)
    expect(parsed.locale).toBe('pt-BR')
  })

  it.each([
    ['data em formato errado', { date: '16/09/2025' }],
    ['data inexistente', { date: '2025-02-30' }],
    ['idioma não suportado', { locale: 'es' }],
    ['capa sem https', { cover: 'http://example.com/a.jpg' }],
    ['published fora de true/false', { published: 'sim' }],
    ['campo desconhecido', { autor: 'x' }],
    ['updated anterior à data', { updated: '2020-01-01' }],
    ['fonte que não é URL', { sources: 'relatório interno' }],
  ])('rejeita %s', (_label, patch) => {
    expect(postFrontmatterSchema.safeParse({ ...validPost, ...patch }).success).toBe(false)
  })

  it('rejeita campo obrigatório ausente', () => {
    const { excerpt: _excerpt, ...withoutExcerpt } = validPost
    expect(postFrontmatterSchema.safeParse(withoutExcerpt).success).toBe(false)
  })

  it('aceita fontes separadas por vírgula', () => {
    const parsed = postFrontmatterSchema.parse({ ...validPost, sources: 'https://a.example, https://b.example' })
    expect(parsed.sources).toEqual(['https://a.example', 'https://b.example'])
  })
})

describe('primitivos', () => {
  it('valida datas e canonical', () => {
    expect(isoDateSchema.safeParse('2024-02-29').success).toBe(true)
    expect(isoDateSchema.safeParse('2023-02-29').success).toBe(false)
    expect(canonicalSchema.safeParse('https://whoisclebs.com/escrita/x/').success).toBe(true)
    expect(canonicalSchema.safeParse('https://whoisclebs.com/escrita/x').success).toBe(false)
    expect(canonicalSchema.safeParse('https://example.com/').success).toBe(false)
  })

  it('exige front matter', () => {
    expect(() => parseFrontmatter('# sem front matter')).toThrow()
  })
})

describe('loadPosts', () => {
  it('derruba o carregamento com conteúdo inválido (o build falha)', () => {
    expect(() => loadPosts({ '/src/content/posts/x/pt-BR.md': markdown({ ...validPost, date: '2025-13-01' }) })).toThrow(/date/)
  })

  it('exige idioma coerente com o nome do arquivo', () => {
    expect(() => loadPosts({ '/src/content/posts/x/en.md': markdown(validPost) })).toThrow(/locale/)
  })

  it('exige campos invariantes iguais entre traduções', () => {
    expect(() =>
      loadPosts({
        '/src/content/posts/x/pt-BR.md': markdown(validPost),
        '/src/content/posts/x/en.md': markdown({ ...validPost, locale: 'en', date: '2025-09-17' }),
      }),
    ).toThrow(/date/)
  })

  it('aceita projetos relacionados existentes e rejeita slug desconhecido (o build falha)', () => {
    const [post] = loadPosts({ '/src/content/posts/x/pt-BR.md': markdown({ ...validPost, projects: 'tuxedo, golpher' }) })
    expect(post?.projects).toEqual(['tuxedo', 'golpher'])
    expect(post?.topic).toEqual({ slug: 'devops', label: 'DevOps' })
    expect(() => loadPosts({ '/src/content/posts/x/pt-BR.md': markdown({ ...validPost, projects: 'fantasma' }) })).toThrow(/fantasma/)
  })

  it('exige minutos no tempo de leitura', () => {
    expect(() => loadPosts({ '/src/content/posts/x/pt-BR.md': markdown({ ...validPost, readingTime: 'rápido' }) })).toThrow(/readingTime/)
  })

  it('gera caminho e canonical com barra final por idioma', () => {
    const [pt, en] = loadPosts({
      '/src/content/posts/x/pt-BR.md': markdown(validPost),
      '/src/content/posts/x/en.md': markdown({ ...validPost, locale: 'en' }),
    }).sort((a, b) => a.locale.localeCompare(b.locale)).reverse()
    expect(pt?.canonical).toBe('https://whoisclebs.com/escrita/exemplo/')
    expect(en?.canonical).toBe('https://whoisclebs.com/en/writing/exemplo/')
  })
})

describe('conteúdo real do repositório', () => {
  it('publica 6 artigos em cada idioma, com tradução pareada e rascunho fora', () => {
    const pt = getPublishedPosts('pt-BR')
    const en = getPublishedPosts('en')
    expect(pt).toHaveLength(6)
    expect(en).toHaveLength(6)
    expect(pt.map((post) => post.slug)).not.toContain('hardening-performance-site-estatico-vite-cloudflare')
    for (const post of pt) expect(getTranslation(post, 'en')?.slug).toBe(post.slug)
    expect(pt[0]?.slug).toBe('github-actions-como-fazer-deploy')
  })

  it('encontra artigo e nota pelo slug', () => {
    expect(getPost('github-actions-como-fazer-deploy', 'pt-BR')?.title).toContain('GitHub Actions')
    expect(getPost('nao-existe', 'pt-BR')).toBeUndefined()
    expect(getPublishedNotes()).toHaveLength(1)
    expect(getNote('docker-healthcheck-para-servicos')?.canonical).toBe('https://whoisclebs.com/notas/docker-healthcheck-para-servicos/')
  })

  it('rejeita nota em inglês (não há rota /en/ de notas)', () => {
    expect(() => loadNotes({ '/src/content/til/x.md': markdown({ slug: 'x', title: 'T', kicker: 'K', date: '2026-01-01', excerpt: 'E', published: 'true', locale: 'en' }) })).toThrow(/pt-BR/)
  })

  it('tem 4 projetos com evidência pública', () => {
    expect(projects.map((project) => project.slug)).toEqual(['tuxedo', 'golpher', 'seishin', 'rsgit'])
    for (const project of projects) expect(project.evidence.length).toBeGreaterThan(0)
  })
})
