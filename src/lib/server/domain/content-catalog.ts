/**
 * Catálogo do conteúdo publicado, lido pelo MCP somente leitura (spec §5.4). Puro: recebe as entradas já
 * montadas (texto derivado da camada de conteúdo, o mesmo de `/llms-full.txt`) e só lista, lê e busca.
 * Sem I/O, sem D1, sem framework: a borda (`http/mcp-handler.ts`) e o SDK MCP ficam fora daqui.
 */

export const CONTENT_TYPES = ['profile', 'project', 'article', 'note'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const SEARCH_QUERY_MIN = 2
export const SEARCH_QUERY_MAX = 200
export const SEARCH_LIMIT_DEFAULT = 5
export const SEARCH_LIMIT_MAX = 20
/** Termos distintos por busca: cada termo varre o índice inteiro, então o custo de CPU fica limitado. */
export const SEARCH_TERMS_MAX = 8

/** Tamanho máximo do trecho devolvido pela busca (caracteres). */
const SNIPPET_MAX = 200

export interface CatalogEntry {
  /** Identificador MCP (`whoisclebs://…`). */
  uri: string
  type: ContentType
  title: string
  description: string
  /** Página canônica HTML do mesmo conteúdo. */
  url: string
  locale: string
  /** AAAA-MM-DD (publicação, revisão ou conferência, conforme o tipo). */
  date?: string
  mimeType: 'text/markdown' | 'application/json'
  text: string
}

export interface SearchInput {
  query: string
  type?: string
  limit?: number
}

export interface NormalizedSearch {
  query: string
  type?: ContentType
  limit: number
}

export interface SearchHit {
  uri: string
  type: ContentType
  title: string
  url: string
  locale: string
  date?: string
  snippet: string
}

export interface SearchResult {
  query: string
  type?: ContentType
  total: number
  results: SearchHit[]
}

export class InvalidSearchError extends Error {
  override name = 'InvalidSearchError'
}

function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value)
}

export function normalizeSearchInput(input: SearchInput): NormalizedSearch {
  const query = typeof input.query === 'string' ? input.query.trim() : ''
  if (query.length < SEARCH_QUERY_MIN || query.length > SEARCH_QUERY_MAX) {
    throw new InvalidSearchError(`A busca precisa ter de ${SEARCH_QUERY_MIN} a ${SEARCH_QUERY_MAX} caracteres.`)
  }
  if (new Set(tokens(query)).size > SEARCH_TERMS_MAX) throw new InvalidSearchError(`Use no máximo ${SEARCH_TERMS_MAX} termos distintos.`)
  const limit = input.limit ?? SEARCH_LIMIT_DEFAULT
  if (!Number.isInteger(limit) || limit < 1 || limit > SEARCH_LIMIT_MAX) {
    throw new InvalidSearchError(`O limite precisa ser um inteiro de 1 a ${SEARCH_LIMIT_MAX}.`)
  }
  if (input.type === undefined) return { query, limit }
  if (!isContentType(input.type)) throw new InvalidSearchError(`O tipo precisa ser um de: ${CONTENT_TYPES.join(', ')}.`)
  return { query, type: input.type, limit }
}

/** Minúsculas e sem diacríticos, caractere a caractere (mantém as posições para recortar o trecho). */
function foldChars(value: string): string[] {
  return Array.from(value, (char) => char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().charAt(0) || char)
}

function fold(value: string): string {
  return foldChars(value).join('')
}

function tokens(value: string): string[] {
  return fold(value).match(/[\p{L}\p{N}]+/gu) ?? []
}

/** Termos de até 2 caracteres casam a palavra inteira ("go" não casa "goiás"); os demais, o prefixo. */
function matches(token: string, term: string): boolean {
  return term.length <= 2 ? token === term : token.startsWith(term)
}

function countMatches(words: string[], term: string): number {
  let count = 0
  for (const word of words) if (matches(word, term)) count += 1
  return count
}

function clip(line: string, terms: string[]): string {
  const clean = line.replace(/^#+\s*|^[-*]\s+|^>\s*/, '').replace(/\s+/g, ' ').trim()
  const chars = Array.from(clean)
  if (chars.length <= SNIPPET_MAX) return clean
  const folded = foldChars(clean).join('')
  const at = Math.max(0, ...terms.map((term) => folded.indexOf(term)).filter((index) => index >= 0).slice(0, 1))
  const start = Math.max(0, Math.min(at - 40, chars.length - SNIPPET_MAX))
  const body = chars.slice(start, start + SNIPPET_MAX).join('').trim()
  return `${start > 0 ? '…' : ''}${body}${start + SNIPPET_MAX < chars.length ? '…' : ''}`
}

function snippet(entry: CatalogEntry, terms: string[]): string {
  const hits = (text: string) => terms.some((term) => tokens(text).some((word) => matches(word, term)))
  if (hits(entry.description)) return clip(entry.description, terms)
  const line = entry.text.split('\n').find((candidate) => candidate.trim() && hits(candidate))
  return clip(line ?? entry.description, terms)
}

interface IndexedEntry {
  entry: CatalogEntry
  title: string[]
  description: string[]
  text: string[]
}

export interface ContentCatalog {
  list(type?: ContentType): CatalogEntry[]
  read(uri: string): CatalogEntry | undefined
  search(input: SearchInput): SearchResult
}

export function createContentCatalog(entries: readonly CatalogEntry[]): ContentCatalog {
  const byUri = new Map<string, CatalogEntry>()
  for (const entry of entries) {
    if (byUri.has(entry.uri)) throw new Error(`URI duplicada no catálogo: ${entry.uri}`)
    byUri.set(entry.uri, entry)
  }
  let index: IndexedEntry[] | undefined
  const indexed = () =>
    (index ??= entries.map((entry) => ({ entry, title: tokens(entry.title), description: tokens(entry.description), text: tokens(entry.text) })))

  return {
    list: (type) => entries.filter((entry) => !type || entry.type === type),
    read: (uri) => byUri.get(uri),
    search(input) {
      const request = normalizeSearchInput(input)
      const terms = [...new Set(tokens(request.query))]
      const scored: Array<{ entry: CatalogEntry; score: number }> = []
      if (terms.length > 0) {
        for (const item of indexed()) {
          if (request.type && item.entry.type !== request.type) continue
          let score = 0
          let all = true
          for (const term of terms) {
            const termScore = 5 * countMatches(item.title, term) + 3 * countMatches(item.description, term) + Math.min(5, countMatches(item.text, term))
            if (termScore === 0) {
              all = false
              break
            }
            score += termScore
          }
          if (all) scored.push({ entry: item.entry, score })
        }
      }
      scored.sort((a, b) => b.score - a.score || (b.entry.date ?? '').localeCompare(a.entry.date ?? '') || a.entry.uri.localeCompare(b.entry.uri))
      return {
        query: request.query,
        ...(request.type ? { type: request.type } : {}),
        total: scored.length,
        results: scored.slice(0, request.limit).map(({ entry }) => ({
          uri: entry.uri,
          type: entry.type,
          title: entry.title,
          url: entry.url,
          locale: entry.locale,
          ...(entry.date ? { date: entry.date } : {}),
          snippet: snippet(entry, terms),
        })),
      }
    },
  }
}
