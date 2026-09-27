<script lang="ts">
  import '../styles/tokens.css'
  import '../styles/fonts.css'
  import '../styles/base.css'
  import antonUrl from '$lib/assets/fonts/anton-latin-400-normal.woff2?url'
  import { page } from '$app/state'
  import Seo from '$lib/components/Seo.svelte'
  import SiteFooter from '$lib/components/SiteFooter.svelte'
  import SiteHeader from '$lib/components/SiteHeader.svelte'
  import { localeFromPath } from '$lib/i18n'
  import type { Seo as SeoData } from '$lib/seo'

  let { children } = $props()

  const locale = $derived(localeFromPath(page.url.pathname))
  const seo = $derived((page.data as { seo?: SeoData }).seo)
</script>

<svelte:head>
  <!-- Só a fonte do LCP (H1 em Anton); texto e mono usam fallbacks com métricas ajustadas (fonts.css). -->
  <link rel="preload" href={antonUrl} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{#if seo && !page.error}
  <Seo {seo} />
{/if}

<SiteHeader {locale} currentPath={page.url.pathname} alternates={page.error ? undefined : seo?.alternates} />
<main id="conteudo" class="page" tabindex="-1">
  {@render children()}
</main>
<SiteFooter {locale} currentPath={page.url.pathname} />
