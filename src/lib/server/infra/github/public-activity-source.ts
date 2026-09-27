import type { PublicActivitySource, SourceFetchResult } from '../../ports/public-activity-source'
import { mapGitHubEvents } from './map-github-event'

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export interface GitHubSourceOptions {
  username: string
  /** `fetch` injetado pelo composition root (o global em produção; fixture nos testes). */
  fetch: FetchLike
  /** Opcional (secret `GITHUB_TOKEN`): só eleva o limite de requisições; a API usada é pública. */
  token?: string | null
  /** `https://api.github.com` por padrão; loopback http só para o smoke local com fixture. */
  apiBase?: string
  timeoutMs?: number
}

export const DEFAULT_GITHUB_API = 'https://api.github.com'
export const DEFAULT_TIMEOUT_MS = 8_000
const USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/

function validateApiBase(value: string): string {
  const url = new URL(value)
  const loopback = url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
  if (url.protocol !== 'https:' && !loopback) throw new Error(`GitHub: base de API não permitida (${url.origin})`)
  return url.origin
}

/** Eventos públicos recentes de um usuário do GitHub, com ETag (`If-None-Match`) e timeout. */
export class GitHubPublicActivitySource implements PublicActivitySource {
  readonly name = 'github'
  private readonly endpoint: string
  private readonly timeoutMs: number

  constructor(private readonly options: GitHubSourceOptions) {
    if (!USERNAME.test(options.username)) throw new Error('GitHub: username inválido')
    const base = validateApiBase(options.apiBase ?? DEFAULT_GITHUB_API)
    this.endpoint = `${base}/users/${options.username}/events/public?per_page=30`
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  async fetchRecent({ etag }: { etag: string | null }): Promise<SourceFetchResult> {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'whoisclebs.com-activity-sync',
      'x-github-api-version': '2022-11-28',
    }
    if (etag) headers['if-none-match'] = etag
    if (this.options.token) headers.authorization = `Bearer ${this.options.token}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new Error(`GitHub não respondeu em ${this.timeoutMs} ms`)), this.timeoutMs)
    try {
      const response = await this.options.fetch(this.endpoint, { headers, signal: controller.signal })
      if (response.status === 304) return { status: 'not-modified' }
      if (response.status !== 200) throw new Error(`GitHub respondeu HTTP ${response.status}`)
      let body: unknown
      try {
        body = await response.json()
      } catch {
        throw new Error('GitHub: corpo não é JSON válido')
      }
      return { status: 'ok', items: mapGitHubEvents(body), etag: response.headers.get('etag') }
    } finally {
      clearTimeout(timer)
    }
  }
}
