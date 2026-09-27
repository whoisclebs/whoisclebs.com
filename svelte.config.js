import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
  },
  kit: {
    // O adapter grava o Worker do SvelteKit em `main` desse arquivo. A entrada de deploy (fetch + cron)
    // é `src/worker.ts`, declarada em wrangler.jsonc. `vite dev` segue lendo wrangler.jsonc (binding D1).
    adapter: adapter({ config: 'wrangler.sveltekit.jsonc' }),
    prerender: {
      // Rotas EN e feeds são descobertos pelo crawler, mas ficam explícitos para não depender de links.
      entries: ['*', '/en/', '/rss/blog.xml', '/rss/blog-en.xml', '/rss/til.xml', '/sitemap.xml'],
      handleHttpError: 'fail',
      handleMissingId: 'fail',
      handleUnseenRoutes: 'fail',
    },
  },
}

export default config
