/**
 * Entidade e regras da atividade pública. Módulo puro: sem SvelteKit, Cloudflare, `fetch` nem relógio.
 */

export const ACTIVITY_SOURCE = 'github' as const
export type ActivitySource = typeof ACTIVITY_SOURCE

/** Tipos publicáveis. Qualquer outro evento da fonte é descartado antes de chegar aqui. */
export const ACTIVITY_KINDS = ['push', 'create', 'release', 'pull_request', 'issue', 'star'] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export interface PublicActivityItem {
  /** ID externo da fonte (ex.: ID do evento no GitHub); único e estável entre sincronizações. */
  id: string
  kind: ActivityKind
  title: string
  /** Sempre https e com host na allowlist. */
  url: string
  /** ISO 8601 em UTC. */
  occurredAt: string
}

export type ActivityStatus = 'fresh' | 'stale'

export interface PublicActivitySnapshot {
  source: ActivitySource
  /** Momento da última sincronização bem-sucedida (ISO 8601). */
  updatedAt: string
  status: ActivityStatus
  items: PublicActivityItem[]
}

export const MAX_ACTIVITY_ITEMS = 10
export const MAX_TITLE_LENGTH = 200
export const ALLOWED_ACTIVITY_HOSTS: readonly string[] = ['github.com']

export function isAllowedActivityUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return (
    url.protocol === 'https:' &&
    ALLOWED_ACTIVITY_HOSTS.includes(url.hostname) &&
    url.port === '' &&
    url.username === '' &&
    url.password === ''
  )
}

const isKind = (value: unknown): value is ActivityKind =>
  typeof value === 'string' && (ACTIVITY_KINDS as readonly string[]).includes(value)

// Caracteres de controle C0/C1 (inclui NUL e quebras) viram espaço; depois espaços são colapsados.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g

function normalizeTitle(value: string): string {
  const clean = value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()
  return clean.length > MAX_TITLE_LENGTH ? `${clean.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…` : clean
}

function normalizeItem(candidate: PublicActivityItem): PublicActivityItem | null {
  if (typeof candidate.id !== 'string' || candidate.id.trim() === '') return null
  if (!isKind(candidate.kind)) return null
  if (typeof candidate.url !== 'string' || !isAllowedActivityUrl(candidate.url)) return null
  if (typeof candidate.title !== 'string') return null
  const title = normalizeTitle(candidate.title)
  if (title === '') return null
  const time = typeof candidate.occurredAt === 'string' ? Date.parse(candidate.occurredAt) : Number.NaN
  if (Number.isNaN(time)) return null
  return {
    id: candidate.id.trim(),
    kind: candidate.kind,
    title,
    url: new URL(candidate.url).href,
    occurredAt: new Date(time).toISOString(),
  }
}

/**
 * Aplica todas as regras de publicação: descarta inválidos (tipo, URL fora da allowlist, título vazio,
 * data inválida), remove duplicatas pelo ID, ordena do mais recente e corta em `MAX_ACTIVITY_ITEMS`.
 */
export function sanitizeActivityItems(candidates: readonly PublicActivityItem[]): PublicActivityItem[] {
  const byId = new Map<string, PublicActivityItem>()
  for (const candidate of candidates) {
    const item = normalizeItem(candidate)
    if (item && !byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id))
    .slice(0, MAX_ACTIVITY_ITEMS)
}
