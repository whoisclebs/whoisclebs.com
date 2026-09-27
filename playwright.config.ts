import { defineConfig, devices } from '@playwright/test'

const port = 8787

/**
 * E2E contra o build real do adapter-cloudflare servido pelo `wrangler dev` (workerd local):
 * mesmos assets prerenderizados, redirects do `handle` e 404 do Worker que irão para produção.
 * Rode `npm run build` antes; se não houver build, o webServer gera um.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `test -f .svelte-kit/cloudflare/_worker.js || npm run build; npx wrangler dev --port ${port} --ip 127.0.0.1 --log-level warn`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    // SIGINT deixa o wrangler encerrar o workerd filho (SIGKILL deixaria o workerd órfão).
    gracefulShutdown: { signal: 'SIGINT', timeout: 5_000 },
  },
})
