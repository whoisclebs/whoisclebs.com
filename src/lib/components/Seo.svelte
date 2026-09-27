<script lang="ts">
  import { absoluteUrl } from '$lib/routing/paths'
  import { DEFAULT_IMAGE, DEFAULT_IMAGE_ALT, OG_IMAGE_SIZE, type Seo } from '$lib/seo'

  let { seo }: { seo: Seo } = $props()

  const canonical = $derived(absoluteUrl(seo.path))
  const image = $derived(absoluteUrl(seo.image ?? DEFAULT_IMAGE))
  const alternates = $derived(Object.entries(seo.alternates ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1])))
  const ptAlternate = $derived(alternates.find(([locale]) => locale === 'pt-BR')?.[1])
  // JSON do próprio conteúdo; `<` escapado para não fechar a tag. Montado aqui para o template ficar simples.
  const jsonLdTag = $derived(
    seo.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd] }).replaceAll('<', '\\u003c')}</` + 'script>'
      : undefined,
  )
</script>

<svelte:head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <link rel="canonical" href={canonical} />
  {#if alternates.length > 1 && seo.hreflang !== false}
    {#each alternates as [locale, path] (locale)}
      <link rel="alternate" hreflang={locale} href={absoluteUrl(path)} />
    {/each}
    {#if ptAlternate}
      <link rel="alternate" hreflang="x-default" href={absoluteUrl(ptAlternate)} />
    {/if}
  {/if}
  <meta property="og:site_name" content="whoisclebs.com" />
  <meta property="og:locale" content={seo.locale === 'en' ? 'en_US' : 'pt_BR'} />
  <meta property="og:title" content={seo.title} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:type" content={seo.type ?? 'website'} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={image} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content={String(OG_IMAGE_SIZE.width)} />
  <meta property="og:image:height" content={String(OG_IMAGE_SIZE.height)} />
  <meta property="og:image:alt" content={seo.imageAlt ?? DEFAULT_IMAGE_ALT} />
  {#if seo.publishedTime}
    <meta property="article:published_time" content={seo.publishedTime} />
  {/if}
  {#if seo.modifiedTime}
    <meta property="article:modified_time" content={seo.modifiedTime} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seo.title} />
  <meta name="twitter:description" content={seo.description} />
  <meta name="twitter:image" content={image} />
  {#if jsonLdTag}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD serializado do próprio conteúdo, com < escapado -->
    {@html jsonLdTag}
  {/if}
</svelte:head>
