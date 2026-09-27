/**
 * Entrada do Worker (wrangler.jsonc → `main`). O @sveltejs/adapter-cloudflare só gera o handler `fetch`,
 * então esta entrada o reaproveita sem mudanças e acrescenta `scheduled` para o cron da atividade pública.
 * `sveltekit-worker` é um alias do wrangler para `.svelte-kit/cloudflare/_worker.js` (gerado no build).
 * Imports relativos, sem `$lib`: o wrangler (esbuild) empacota este arquivo fora do Vite.
 */
import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types'
import sveltekit from 'sveltekit-worker'
import type { ActivityEnv } from './lib/server/compose'
import { runActivitySync } from './lib/server/jobs/activity-sync'

export default {
  fetch: sveltekit.fetch,
  async scheduled(_controller: ScheduledController, env: ActivityEnv, ctx: ExecutionContext) {
    ctx.waitUntil(runActivitySync(env))
  },
}
