<script lang="ts">
  import WritingList from '$lib/components/writing/WritingList.svelte'
  import { format, getMessages } from '$lib/i18n'
  import type { notesData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof notesData> } = $props()

  const t = $derived(getMessages(data.locale))
</script>

<header class="notes-header">
  <h1>{t.notes.title}</h1>
  <p class="lead">{t.notes.lead}</p>
</header>

{#each data.years as group (group.year)}
  <section class="year" aria-labelledby={`ano-${group.year}`}>
    <h2 id={`ano-${group.year}`} class="year__label">
      <span class="visually-hidden">{format(t.writing.yearLabel, { year: group.year })}</span>
      <span aria-hidden="true">{group.year}</span>
    </h2>
    <WritingList items={group.items} locale={data.locale} dateStyle="day" />
  </section>
{/each}

<p><a href="/rss/til.xml" type="application/rss+xml">{t.notes.rss}</a></p>

<style>
  .notes-header {
    display: grid;
    gap: var(--space-4);
    padding-block-end: var(--space-8);
  }

  .year {
    display: grid;
    gap: var(--space-3);
    margin-block-end: var(--space-8);
  }

  .year__label {
    font-size: var(--step-3);
    line-height: 1;
  }

  @media (min-width: 960px) {
    .year {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .year__label {
      grid-column: 1 / span 2;
      padding-block-start: var(--space-5);
    }

    .year :global(.writing-list) {
      grid-column: 3 / span 10;
    }
  }
</style>
