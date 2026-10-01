import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { D1Database } from '@cloudflare/workers-types'
import { getPlatformProxy } from 'wrangler'

export interface LocalD1 {
  env: { DB: D1Database } & Record<string, unknown>
  dispose(): Promise<void>
}

/** Cria um D1 local vazio, aplica `migrations/` com o runner oficial do wrangler e abre o binding. */
export async function createLocalD1(): Promise<LocalD1> {
  const dir = mkdtempSync(join(tmpdir(), 'whoisclebs-d1-'))
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', dir], {
    stdio: 'pipe',
    env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' },
  })
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: 'wrangler.jsonc',
    persist: { path: join(dir, 'v3') },
    remoteBindings: false,
  })
  return {
    env: proxy.env,
    async dispose() {
      await proxy.dispose()
      rmSync(dir, { recursive: true, force: true })
    },
  }
}
