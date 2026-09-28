<script lang="ts">
  import '../styles/tokens.css'
  import '../styles/fonts.css'
  import '../styles/base.css'
  import antonUrl from '$lib/assets/fonts/anton-latin-400-normal.woff2?url'
  import newsreaderUrl from '$lib/assets/fonts/newsreader-latin-400-normal.woff2?url'
  import { page } from '$app/state'
  import Seo from '$lib/components/Seo.svelte'
  import SiteFooter from '$lib/components/SiteFooter.svelte'
  import SiteHeader from '$lib/components/SiteHeader.svelte'
  import { localeFromPath } from '$lib/i18n'
  import type { Seo as SeoData } from '$lib/seo'

  let { children } = $props()

  const locale = $derived(localeFromPath(page.url.pathname))
  const seo = $derived((page.data as { seo?: SeoData }).seo)
  // A home abre com o hero em faixa de página inteira (noite); as demais páginas têm o topo em noite curta.
  const isHome = $derived(!page.error && (page.route.id === '/' || page.route.id === '/en'))

  // O `lang` do <html> vem do servidor (hooks.server.ts) só na primeira carga. Na navegação pelo cliente
  // (links entre idiomas, voltar/avançar), o SvelteKit não pede HTML novo: sincroniza aqui (WCAG 3.1.1).
  $effect(() => {
    document.documentElement.lang = locale
  })
</script>

<svelte:head>
  <!-- Críticas: Anton (H1, LCP) e Newsreader 400 (texto acima da dobra). Com só a Anton, a troca Georgia →
       Newsreader acrescentava uma linha ao dek de /agentes/ no celular (CLS 0,032 no Lighthouse, passo 14).
       Mono, itálico e 600 continuam sem preload, com fallbacks de métricas ajustadas (fonts.css). -->
  <link rel="preload" href={antonUrl} as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href={newsreaderUrl} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{#if seo && !page.error}
  <Seo {seo} />
{/if}

<SiteHeader {locale} currentPath={page.url.pathname} alternates={page.error ? undefined : seo?.alternates} home={isHome} />
<main id="conteudo" class={isHome || page.status === 404 ? 'main--bleed' : 'page'} tabindex="-1">
  {@render children()}
</main>
<!-- A 404 é só o ciclo do farol: sem rodapé de contato (pedido do proprietário). -->
{#if page.status !== 404}
  <SiteFooter {locale} currentPath={page.url.pathname} scene={!page.error} />
{/if}
