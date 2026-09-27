/**
 * Cliente de `GET /api/activity` para o rodapé. Roda no navegador, depois do conteúdo crítico.
 * Revalida o contrato por conta própria (o código de `$lib/server` não chega ao cliente): só
 * `fresh`/`stale`, só URLs `https://github.com/…`, datas ISO válidas e no máximo `limit` itens.
 */

export interface ActivityItemView {
  id: string
  kind: string
  title: string
  url: string
  occurredAt: string
}

export type ActivityResult =
  | { state: 'fresh' | 'stale'; updatedAt: string; items: ActivityItemView[] }
  | { state: 'unavailable'; reason: 'http' | 'invalid' | 'network' | 'timeout' | 'aborted' }

export const ACTIVITY_TIMEOUT_MS = 5000
export const FOOTER_ACTIVITY_LIMIT = 5

type Fetch = (url: string, init?: RequestInit) => Promise<Response>

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isIsoDate = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))

function isGithubUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port && !url.username && !url.password
  } catch {
    return false
  }
}

function parseItem(value: unknown): ActivityItemView | null {
  if (!isRecord(value)) return null
  const { id, kind, title, url, occurredAt } = value
  if (typeof id !== 'string' || typeof kind !== 'string' || typeof title !== 'string' || !title.trim()) return null
  if (!isGithubUrl(url) || !isIsoDate(occurredAt)) return null
  return { id, kind, title, url, occurredAt }
}

export function parseActivity(body: unknown, limit = FOOTER_ACTIVITY_LIMIT): Extract<ActivityResult, { items: unknown }> | null {
  if (!isRecord(body)) return null
  const { source, status, updatedAt, items } = body
  if (source !== 'github' || (status !== 'fresh' && status !== 'stale') || !isIsoDate(updatedAt) || !Array.isArray(items)) return null
  const parsed = items.map(parseItem).filter((entry): entry is ActivityItemView => entry !== null)
  return { state: status, updatedAt, items: parsed.slice(0, limit) }
}

/**
 * Busca a atividade com timeout próprio (AbortController) e aceita um sinal externo para cancelar
 * quando o componente sai da tela. Nunca lança: qualquer falha vira `unavailable` com o motivo.
 */
export async function loadActivity({
  fetch,
  url = '/api/activity',
  timeoutMs = ACTIVITY_TIMEOUT_MS,
  limit = FOOTER_ACTIVITY_LIMIT,
  signal,
}: {
  fetch: Fetch
  url?: string
  timeoutMs?: number
  limit?: number
  signal?: AbortSignal
}): Promise<ActivityResult> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const forwardAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!response.ok) return { state: 'unavailable', reason: 'http' }
    const parsed = parseActivity(await response.json(), limit)
    return parsed ?? { state: 'unavailable', reason: 'invalid' }
  } catch {
    if (timedOut) return { state: 'unavailable', reason: 'timeout' }
    if (controller.signal.aborted) return { state: 'unavailable', reason: 'aborted' }
    return { state: 'unavailable', reason: 'network' }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}

/** "há 12 minutos", "ontem", "7 days ago". Menos de um minuto ou data no futuro: "agora"/"now". */
export function relativeTime(iso: string, now: Date, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const seconds = Math.round((Date.parse(iso) - now.getTime()) / 1000)
  if (seconds > -60) return format.format(0, 'second')
  const minutes = Math.round(seconds / 60)
  if (minutes > -60) return format.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours > -24) return format.format(hours, 'hour')
  return format.format(Math.round(hours / 24), 'day')
}

/** Data e hora no fuso do visitante, para o aviso de atividade desatualizada. */
export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
}

/** Dia e mês curtos para cada item ("27 de set.", "Sep 27"). */
export function formatDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso))
}
