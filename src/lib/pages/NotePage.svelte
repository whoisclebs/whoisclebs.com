<script lang="ts">
  import Comments from '$lib/components/Comments.svelte'
  import EntryMeta from '$lib/components/writing/EntryMeta.svelte'
  import { getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { noteData } from '$lib/server/pages'

  let { data }: { data: Awaited<ReturnType<typeof noteData>> } = $props()

  const t = $derived(getMessages(data.locale))
  const note = $derived(data.note)
</script>

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
      <section class="entry__aside" aria-labelledby="related-title">
        <h2 id="related-title" class="entry__aside-title">{t.writing.relatedProjects}</h2>
        <ul>
          {#each data.relatedProjects as project (project.slug)}<li><a href={project.href}>{project.name}</a></li>{/each}
        </ul>
      </section>
    {/if}

    <Comments locale={data.locale} term={data.commentTerm} />

    <p class="entry__back"><a href={pages.notes['pt-BR']}>{t.notes.back}</a></p>
  </div>
</article>
