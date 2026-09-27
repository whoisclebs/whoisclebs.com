import { describe, expect, it } from 'vitest'
import {
  CONTENT_TYPES,
  createContentCatalog,
  normalizeSearchInput,
  SEARCH_LIMIT_DEFAULT,
  SEARCH_LIMIT_MAX,
  SEARCH_QUERY_MAX,
  SEARCH_QUERY_MIN,
  SEARCH_TERMS_MAX,
  type CatalogEntry,
} from './content-catalog'

const entry = (overrides: Partial<CatalogEntry> & Pick<CatalogEntry, 'uri'>): CatalogEntry => ({
  type: 'article',
  title: 'Título',
  description: 'Resumo',
  url: 'https://whoisclebs.com/escrita/x/',
  locale: 'pt-BR',
  mimeType: 'text/markdown',
  text: 'Corpo.',
  ...overrides,
})

const entries: CatalogEntry[] = [
  entry({ uri: 'whoisclebs://profile', type: 'profile', title: 'Sobre', description: 'Engenheiro de software', text: 'Trabalho com Go e pagamentos.' }),
  entry({ uri: 'whoisclebs://projects/tuxedo', type: 'project', title: 'tuxedo', description: 'Framework HTTP em Go', text: 'Roteador, middlewares e disjuntor.', date: '2026-09-27' }),
  entry({ uri: 'whoisclebs://articles/ci', type: 'article', title: 'GitHub Actions: como fazer deploy', description: 'Pipeline de deploy', text: 'Deploy com Actions e Cloudflare.', date: '2025-09-16' }),
  entry({ uri: 'whoisclebs://articles/antigo', type: 'article', title: 'Hackathon em Goiás', description: 'Relato', text: 'Evento de dados abertos. Deploy manual.', date: '2020-09-07' }),
  entry({ uri: 'whoisclebs://notes/healthcheck', type: 'note', title: 'Healthcheck no Docker', description: 'Nota curta', text: 'HEALTHCHECK com curl.', date: '2024-01-01' }),
]

describe('createContentCatalog', () => {
  const catalog = createContentCatalog(entries)

  it('lista todos os itens ou só os de um tipo', () => {
    expect(catalog.list().map((e) => e.uri)).toEqual(entries.map((e) => e.uri))
    expect(catalog.list('article').map((e) => e.uri)).toEqual(['whoisclebs://articles/ci', 'whoisclebs://articles/antigo'])
  })

  it('lê um item pela URI e devolve undefined para URI desconhecida', () => {
    expect(catalog.read('whoisclebs://projects/tuxedo')?.title).toBe('tuxedo')
    expect(catalog.read('whoisclebs://projects/nao-existe')).toBeUndefined()
  })

  it('recusa URIs duplicadas', () => {
    expect(() => createContentCatalog([entries[0] as CatalogEntry, entries[0] as CatalogEntry])).toThrow(/duplicada/)
  })
})

describe('normalizeSearchInput', () => {
  it('aplica o limite padrão e apara a busca', () => {
    expect(normalizeSearchInput({ query: '  deploy ' })).toEqual({ query: 'deploy', limit: SEARCH_LIMIT_DEFAULT })
  })

  it.each([
    [{ query: 'a' }, /2/],
    [{ query: ' a ' }, /2/],
    [{ query: 'x'.repeat(SEARCH_QUERY_MAX + 1) }, /200/],
    [{ query: 'deploy', limit: SEARCH_LIMIT_MAX + 1 }, /20/],
    [{ query: 'deploy', limit: 0 }, /20/],
    [{ query: 'deploy', limit: 2.5 }, /20/],
    [{ query: 'deploy', type: 'secret' }, /tipo/],
    [{ query: 'um dois tres quatro cinco seis sete oito nove' }, /8 termos/],
  ])('recusa %j', (input, message) => {
    expect(() => normalizeSearchInput(input as Parameters<typeof normalizeSearchInput>[0])).toThrow(message)
  })

  it('expõe os limites da especificação', () => {
    expect([SEARCH_QUERY_MIN, SEARCH_QUERY_MAX, SEARCH_LIMIT_MAX, SEARCH_TERMS_MAX]).toEqual([2, 200, 20, 8])
    expect(CONTENT_TYPES).toEqual(['profile', 'project', 'article', 'note'])
  })
})

describe('search', () => {
  const catalog = createContentCatalog(entries)

  it('encontra sem diferenciar maiúsculas nem acentos e ordena por relevância (título antes do corpo)', () => {
    const result = catalog.search({ query: 'DEPLOY' })
    expect(result.results.map((r) => r.uri)).toEqual(['whoisclebs://articles/ci', 'whoisclebs://articles/antigo'])
    expect(catalog.search({ query: 'goias' }).results.map((r) => r.uri)).toEqual(['whoisclebs://articles/antigo'])
  })

  it('exige todos os termos', () => {
    expect(catalog.search({ query: 'deploy cloudflare' }).results.map((r) => r.uri)).toEqual(['whoisclebs://articles/ci'])
  })

  it('filtra por tipo e respeita o limite, informando o total', () => {
    const result = catalog.search({ query: 'deploy', limit: 1 })
    expect(result.results).toHaveLength(1)
    expect(result.total).toBe(2)
    expect(catalog.search({ query: 'go', type: 'project' }).results.map((r) => r.uri)).toEqual(['whoisclebs://projects/tuxedo'])
  })

  it('termo curto casa palavra inteira, não prefixo', () => {
    expect(catalog.search({ query: 'go' }).results.map((r) => r.uri)).toEqual(['whoisclebs://projects/tuxedo', 'whoisclebs://profile'])
  })

  it('devolve metadados públicos e um trecho com o termo, sem o corpo inteiro', () => {
    const [hit] = catalog.search({ query: 'curl' }).results
    expect(hit).toEqual({
      uri: 'whoisclebs://notes/healthcheck',
      type: 'note',
      title: 'Healthcheck no Docker',
      url: 'https://whoisclebs.com/escrita/x/',
      locale: 'pt-BR',
      date: '2024-01-01',
      snippet: 'HEALTHCHECK com curl.',
    })
  })

  it('busca sem termos alfanuméricos não devolve nada', () => {
    expect(catalog.search({ query: '!!' }).results).toEqual([])
  })

  it('valida a entrada também no domínio', () => {
    expect(() => catalog.search({ query: 'deploy', limit: 99 })).toThrow(/20/)
  })
})
