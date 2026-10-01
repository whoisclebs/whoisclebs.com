import type { RequestEvent } from '@sveltejs/kit'
import { getPublicActivity, type GetPublicActivityDeps } from '../domain/get-public-activity'
import { ACTIVITY_SOURCE } from '../domain/public-activity'

/**
 * Camada HTTP de `GET /api/activity`: só negociação (ETag/304), cabeçalhos e forma da resposta.
 * Regras de negócio ficam em `getPublicActivity`; dependências chegam prontas do composition root.
 */

type ActivityEvent = Pick<RequestEvent, 'request' | 'platform'>

const CACHE_FRESH = 'public, max-age=60, stale-while-revalidate=300'
const CACHE_STALE = 'public, max-age=30'
const RETRY_AFTER_SECONDS = '300'
const MAX_IF_NONE_MATCH_LENGTH = 1024

async function etagFor(body: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `"${hex.slice(0, 32)}"`
}

/** Comparação fraca (RFC 9110 §13.1.2): ignora o prefixo `W/`; aceita lista e `*`. */
function matchesIfNoneMatch(header: string | null, etag: string): boolean {
  if (!header || header.length > MAX_IF_NONE_MATCH_LENGTH) return false
  if (header.trim() === '*') return true
  const opaque = (tag: string) => tag.trim().replace(/^W\//, '')
  return header.split(',').some((tag) => opaque(tag) === etag)
}

function unavailable(): Response {
  const body = {
    source: ACTIVITY_SOURCE,
    status: 'unavailable',
    updatedAt: null,
    items: [],
    message: 'Atividade indisponível: ainda não há sincronização bem-sucedida com o GitHub.',
  }
  return Response.json(body, {
    status: 503,
    headers: { 'cache-control': 'no-store', 'retry-after': RETRY_AFTER_SECONDS },
  })
}

export function createActivityHandler(resolveDeps: (event: ActivityEvent) => GetPublicActivityDeps) {
  return async function handleActivity(event: ActivityEvent): Promise<Response> {
    let result: Awaited<ReturnType<typeof getPublicActivity>>
    try {
      result = await getPublicActivity(resolveDeps(event))
    } catch (error) {
      console.error('activity: falha ao ler o cache', error)
      return unavailable()
    }
    if (!result.available) return unavailable()

    const body = JSON.stringify(result.snapshot)
    const etag = await etagFor(body)
    const headers = {
      etag,
      'cache-control': result.snapshot.status === 'fresh' ? CACHE_FRESH : CACHE_STALE,
    }
    if (matchesIfNoneMatch(event.request.headers.get('if-none-match'), etag)) {
      return new Response(null, { status: 304, headers })
    }
    return new Response(body, { status: 200, headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } })
  }
}
