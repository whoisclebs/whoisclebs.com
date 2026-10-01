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
  webServer: [
    {
      // Substituto local da API do GitHub (sem rede real nos testes).
      command: 'node tests/fixtures/github-fixture-server.mjs',
      url: 'http://127.0.0.1:8790/',
      reuseExistingServer: false,
      timeout: 10_000,
    },
    {
      // D1 local recriado do zero a cada execução com as migrações versionadas; `--test-scheduled` expõe
      // `/__scheduled` para disparar o cron; a fonte GitHub aponta para o servidor de fixture.
      command: [
        'test -f .svelte-kit/cloudflare/_worker.js || npm run build',
        // Sem as rotas de produção (ver scripts/wrangler-dev-config.mjs).
        'node scripts/wrangler-dev-config.mjs',
        'rm -rf .wrangler/e2e-state',
        'npx wrangler d1 migrations apply DB --config wrangler.dev.jsonc --local --persist-to .wrangler/e2e-state',
        `npx wrangler dev --config wrangler.dev.jsonc --port ${port} --ip 127.0.0.1 --log-level warn --persist-to .wrangler/e2e-state --test-scheduled --var GITHUB_API_BASE:http://127.0.0.1:8790`,
      ].join(' && '),
      env: { CI: '1' },
      url: `http://127.0.0.1:${port}/`,
      reuseExistingServer: false,
      timeout: 120_000,
      // SIGINT deixa o wrangler encerrar o workerd filho (SIGKILL deixaria o workerd órfão).
      gracefulShutdown: { signal: 'SIGINT', timeout: 5_000 },
    },
  ],
})
