/**
 * Lighthouse CI — portão final do redesign (passo 14). Rode com `npm run lhci` (depois de `npm run build`).
 *
 * - Servidor: `scripts/run-lhci.mjs` sobe o build real do adapter-cloudflare no `wrangler dev` (workerd local,
 *   porta 8788) com D1 local migrado do zero e a API do GitHub substituída pela fixture (porta 8791), dispara o
 *   cron uma vez para `/api/activity` responder 200 e só então chama `lhci collect` + `lhci assert` com este
 *   arquivo. Sem CDN/Cloudflare real: os números medem o site, não a borda.
 * - Mobile: emulação padrão do Lighthouse (Moto G Power, `throttlingMethod: simulate`, RTT 150 ms, 1,6 Mbps,
 *   CPU 4×). Não use o preset desktop.
 * - 3 execuções por URL; as asserções usam a execução mediana (`median-run`), o que absorve o ruído de CPU do
 *   WSL2 observado na baseline (ex.: artigo 91 / 75 / 91).
 */
const base = `http://127.0.0.1:${process.env.LHCI_PORT ?? 8788}`

const median = (minScore) => ['error', { minScore, aggregationMethod: 'median-run' }]

module.exports = {
  ci: {
    collect: {
      url: [
        `${base}/`,
        `${base}/projetos/tuxedo/`,
        `${base}/escrita/github-actions-como-fazer-deploy/`,
        // /agentes/ saiu (404); o Sobre herdou a oferta de Arquitetura e tem as fotos e o cartucho.
        `${base}/sobre/`,
        `${base}/contato/`,
      ],
      numberOfRuns: 3,
      settings: {
        // Chrome do sistema em modo headless novo (o mesmo da baseline do passo 00).
        chromeFlags: '--headless=new --no-sandbox',
        // pt-BR: as rotas são PT; o idioma vem só da URL, mas os textos de auditoria ficam coerentes.
        locale: 'pt-BR',
      },
    },
    assert: {
      assertions: {
        'categories:performance': median(0.9),
        'categories:accessibility': median(0.95),
        'categories:best-practices': median(0.95),
        'categories:seo': median(0.95),
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/reports',
    },
  },
}
