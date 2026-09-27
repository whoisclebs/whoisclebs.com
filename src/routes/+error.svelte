<script lang="ts">
  import { page } from '$app/state'
  import { getMessages, localeFromPath } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import { pageTitle } from '$lib/seo'

  const locale = $derived(localeFromPath(page.url.pathname))
  const t = $derived(getMessages(locale))
  const notFound = $derived(page.status === 404)
</script>

<svelte:head>
  <title>{pageTitle(notFound ? t['notFound.title'] : `Erro ${page.status}`)}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="page-header">
  <p class="eyebrow">{page.status}</p>
  <h1>{notFound ? t['notFound.title'] : page.error?.message}</h1>
  {#if notFound}<p class="lead">{t['notFound.description']}</p>{/if}
  <p><a class="button" href={pages.home[locale]}>{t['notFound.back']}</a></p>
</section>
