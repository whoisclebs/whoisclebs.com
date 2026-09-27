import { defineConfig } from 'vitest/config'

/**
 * Integração com D1 local (workerd via `getPlatformProxy`), migrações aplicadas do zero em diretório
 * temporário por `wrangler d1 migrations apply --local`. Sem rede e sem conta Cloudflare.
 */
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
})
