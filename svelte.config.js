import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true,
  },
  kit: {
    adapter: adapter(),
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
