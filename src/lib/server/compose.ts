/**
 * Composition root: o único módulo que conhece bindings/variáveis da plataforma (`platform.env` no
 * SvelteKit, `env` no handler `scheduled`). Troca de host ou banco = novo adaptador em `infra/` + ajuste aqui.
 *
 * Sem aliases `$lib`/`$env`: este arquivo também é empacotado pelo wrangler a partir de `src/worker.ts`.
 */
import type { D1Database } from '@cloudflare/workers-types'
import type { GetPublicActivityDeps } from './domain/get-public-activity'
import type { SyncPublicActivityDeps } from './domain/sync-public-activity'
import { D1ActivityRepository } from './infra/cloudflare/d1-activity-repository'
import { GitHubPublicActivitySource, type FetchLike } from './infra/github/public-activity-source'
import type { Clock } from './ports/clock'

export interface ActivityEnv {
  DB?: D1Database
  GITHUB_USERNAME?: string
  /** Secret opcional (`wrangler secret put GITHUB_TOKEN` / `.dev.vars`). Nunca em wrangler.jsonc. */
  GITHUB_TOKEN?: string
  /** Só para o smoke local com fixture (loopback); em produção fica vazio. */
  GITHUB_API_BASE?: string
  ACTIVITY_FRESH_WINDOW_MINUTES?: string
}

export const DEFAULT_GITHUB_USERNAME = 'whoisclebs'
export const DEFAULT_FRESH_WINDOW_MINUTES = 120

export const systemClock: Clock = { now: () => new Date() }

function requireDb(env: ActivityEnv | undefined): D1Database {
  if (!env?.DB) throw new Error('Binding D1 `DB` ausente (confira wrangler.jsonc e as migrações locais)')
  return env.DB
}

function freshWindowMs(env: ActivityEnv): number {
  const minutes = Number(env.ACTIVITY_FRESH_WINDOW_MINUTES)
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_FRESH_WINDOW_MINUTES) * 60_000
}

export function composeActivityReader(env: ActivityEnv | undefined): GetPublicActivityDeps {
  const db = requireDb(env)
  return { repository: new D1ActivityRepository(db), clock: systemClock, freshWindowMs: freshWindowMs(env ?? {}) }
}

export function composeActivitySync(env: ActivityEnv | undefined, fetchImpl: FetchLike = (input, init) => fetch(input, init)): SyncPublicActivityDeps {
  const db = requireDb(env)
  const source = new GitHubPublicActivitySource({
    username: env?.GITHUB_USERNAME || DEFAULT_GITHUB_USERNAME,
    token: env?.GITHUB_TOKEN || null,
    apiBase: env?.GITHUB_API_BASE || undefined,
    fetch: fetchImpl,
  })
  return { repository: new D1ActivityRepository(db), source, clock: systemClock }
}
