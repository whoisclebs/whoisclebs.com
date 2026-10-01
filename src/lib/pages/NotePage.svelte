<script lang="ts">
  import Comments from '$lib/components/Comments.svelte'
  import EntryAside from '$lib/components/writing/EntryAside.svelte'
  import EntryMeta from '$lib/components/writing/EntryMeta.svelte'
  import { getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { noteData } from '$lib/server/pages'

  let { data }: { data: Awaited<ReturnType<typeof noteData>> } = $props()

  const t = $derived(getMessages(data.locale))
  const note = $derived(data.note)
</script>

<!-- Leitura curta: mesma estrutura do artigo (ver ArticlePage.svelte), com o link de volta no topo. -->
<div class="page page-body">
<p class="entry__back"><a class="link-arrow" href={pages.notes['pt-BR']}><span aria-hidden="true">←</span> {t.notes.back}</a></p>
<article class="entry">
  <header class="entry__header">
    <p class="entry__topic"><a href={pages.notes['pt-BR']}>{t.notes.title}</a> <span class="entry__topic-sep" aria-hidden="true">/</span> {note.topic.label}</p>
    <h1 class="entry__title">{note.title}</h1>
    <p class="entry__lead">{note.excerpt}</p>
    <EntryMeta locale={data.locale} date={note.date} updated={note.updated} minutes={note.readingMinutes} />
  </header>

  <div class="entry__body">
    <div class="prose">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML gerado no build a partir do Markdown do repositório (HTML cru escapado) -->
      {@html data.html}
    </div>

    {#if data.relatedProjects.length > 0}
      <EntryAside id="related-title" title={t.writing.relatedProjects} items={data.relatedProjects.map((project) => ({ href: project.href, label: project.name }))} />
    {/if}

    <Comments locale={data.locale} term={data.commentTerm} />
  </div>
</article>
</div>

<style>
  .entry__back {
    margin-block-end: var(--space-6);
  }

  .entry__back > a > span {
    display: inline-block;
  }

  @media (hover: hover) and (pointer: fine) {
    .entry__back > a:hover {
      color: var(--color-link-hover);
    }

    .entry__back > a:hover > span {
      transform: translateX(-3px);
    }
  }
</style>
