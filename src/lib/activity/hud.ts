/**
 * Leituras do HUD da home (passo 15), a partir de dados reais do cliente: o corpo de `/api/activity` e a
 * latência medida pelo próprio navegador. Funções puras; o componente só desenha o que elas devolvem.
 * Nenhum valor é inventado: sem dado, a leitura é `null` e a barra fica vazia e neutra.
 */
import type { ActivityResult } from './activity-client'

export const HUD_SEGMENTS = 10
/** A barra do último sync perde um segmento a cada 6 minutos: vazia em 1 h, quando também fica cinza. */
export const SYNC_MINUTES_PER_SEGMENT = 6
export const SYNC_FRESH_LIMIT_MINUTES = 60
/** Escala declarada da barra de latência: 0 a 1000 ms, 100 ms por segmento. */
export const LATENCY_MS_PER_SEGMENT = 100

export type BarTone = 'live' | 'dim' | 'none'

export interface Bar {
  filled: number
  tone: BarTone
}

const clampSegments = (value: number) => Math.max(0, Math.min(HUD_SEGMENTS, Math.round(value)))

/** Eventos no cache atual (a API manda no máximo 10): um segmento por evento. */
export function activityBar(count: number): Bar {
  return { filled: clampSegments(count), tone: 'live' }
}

/** Minutos desde o último sync bem-sucedido (nunca negativo, mesmo com relógio adiantado no servidor). */
export function syncAgeMinutes(updatedAt: string, now: Date): number {
  return Math.max(0, (now.getTime() - Date.parse(updatedAt)) / 60_000)
}

export function syncBar(updatedAt: string, now: Date, status: 'fresh' | 'stale'): Bar {
  const age = syncAgeMinutes(updatedAt, now)
  const filled = clampSegments(HUD_SEGMENTS - Math.floor(age / SYNC_MINUTES_PER_SEGMENT))
  const tone: BarTone = status === 'stale' || age > SYNC_FRESH_LIMIT_MINUTES ? 'dim' : 'live'
  return { filled, tone }
}

export function latencyBar(ms: number): Bar {
  return { filled: clampSegments(Math.ceil(ms / LATENCY_MS_PER_SEGMENT)), tone: 'live' }
}

export const EMPTY_BAR: Bar = { filled: 0, tone: 'none' }

export type HudPhase = 'nojs' | 'waiting' | 'done'

export interface HudReadings {
  activity: { count: number } | { unavailable: true } | null
  sync: { updatedAt: string; status: 'fresh' | 'stale' } | null
  latencyMs: number | null
}

/** Converte o resultado da busca (ou a falta dele) nas três leituras que dependem da API. */
export function readings(result: ActivityResult | null, latencyMs: number | null): HudReadings {
  if (!result) return { activity: null, sync: null, latencyMs: null }
  const latency = latencyMs !== null && Number.isFinite(latencyMs) && latencyMs >= 0 ? Math.round(latencyMs) : null
  if (result.state === 'unavailable') return { activity: { unavailable: true }, sync: null, latencyMs: latency }
  return {
    activity: { count: result.items.length },
    sync: { updatedAt: result.updatedAt, status: result.state },
    latencyMs: latency,
  }
}
