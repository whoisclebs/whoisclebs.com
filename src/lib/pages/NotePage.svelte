<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { noteData } from '$lib/server/pages'

  let { data }: { data: Awaited<ReturnType<typeof noteData>> } = $props()

  const t = $derived(getMessages(data.locale))
</script>

<article class="note">
  <header class="page-header">
    <p class="eyebrow">{data.note.kicker}</p>
    <h1>{data.note.title}</h1>
    <p class="lead">{data.note.excerpt}</p>
    <p class="meta"><time datetime={data.note.date}>{formatDate(data.note.date, data.locale)}</time></p>
  </header>
  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML gerado no build a partir do Markdown do repositório (HTML cru escapado) -->
    {@html data.html}
  </div>
  <p class="back"><a href={pages.notes['pt-BR']}>{t['til.backToTil']}</a></p>
</article>

<style>
  .note {
    max-width: calc(var(--measure) + 2 * var(--space-6));
    margin-inline: auto;
  }

  .back {
    margin-block-start: var(--space-7);
  }
</style>
