<script lang="ts">
  import '../styles/tokens.css'
  import '../styles/fonts.css'
  import '../styles/base.css'
  import displayFontUrl from '$lib/assets/fonts/space-grotesk-latin-wght-normal.woff2?url'
  import textFontUrl from '$lib/assets/fonts/inter-tight-latin-wght-normal.woff2?url'
  import type { Component } from 'svelte'
  import { page } from '$app/state'
  import Seo from '$lib/components/Seo.svelte'
  import SiteFooter from '$lib/components/SiteFooter.svelte'
  import SiteHeader from '$lib/components/SiteHeader.svelte'
  import { localeFromPath, type Locale } from '$lib/i18n'
  import type { Seo as SeoData } from '$lib/seo'

  let { children } = $props()

  const locale = $derived(localeFromPath(page.url.pathname))
  const seo = $derived((page.data as { seo?: SeoData }).seo)
  // A home abre com o hero em tela cheia, por baixo do cabeçalho fixo; as demais páginas começam abaixo dele.
  const isHome = $derived(!page.error && (page.route.id === '/' || page.route.id === '/en'))

  // O `lang` do <html> vem do servidor (hooks.server.ts) só na primeira carga. Na navegação pelo cliente
  // (links entre idiomas, voltar/avançar), o SvelteKit não pede HTML novo: sincroniza aqui (WCAG 3.1.1).
  $effect(() => {
    document.documentElement.lang = locale
  })

  // Easter eggs globais (teclado, neon, atalhos, aviso): uma ilha fora do JS de entrada, baixada depois do
  // `load`, num momento ocioso. Sem JS o site funciona igual: são só brincadeiras.
  let Eggs = $state<Component<{ locale: Locale }>>()
  $effect(() => {
    let cancelled = false
    const start = () => {
      const run = () => {
        void import('$lib/eggs/EasterEggs.svelte').then((module) => {
          if (!cancelled) Eggs = module.default
        })
      }
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2000 })
      else setTimeout(run, 400)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      cancelled = true
      window.removeEventListener('load', start)
    }
  })
</script>

<svelte:head>
  <!-- Críticas: Space Grotesk (H1, LCP) e Inter Tight (texto acima da dobra). A mono continua sem preload,
       com fallback de métricas ajustadas (fonts.css). -->
  <link rel="preload" href={displayFontUrl} as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href={textFontUrl} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{#if seo && !page.error}
  <Seo {seo} />
{/if}

<SiteHeader {locale} currentPath={page.url.pathname} alternates={page.error ? undefined : seo?.alternates} />
<!-- Toda página é `main--bleed`: cada seção traz o próprio `.page` para centralizar o conteúdo. -->
<main id="conteudo" class="main--bleed" class:main--home={isHome} tabindex="-1">
  {@render children()}
</main>
<SiteFooter {locale} />
{#if Eggs}
  <Eggs {locale} />
{/if}
