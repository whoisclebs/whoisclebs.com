<script lang="ts">
  import WritingList from '$lib/components/writing/WritingList.svelte'
  import { format, getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { topicData, writingData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof writingData> | ReturnType<typeof topicData> } = $props()

  const t = $derived(getMessages(data.locale))
  const total = $derived(data.topics.reduce((sum, topic) => sum + topic.count, 0))
  const feedHref = $derived(data.locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
</script>

<header class="page-header">
  <div class="page writing-header">
    <h1>{data.heading}</h1>
    <p class="lead">{data.lead}</p>
  </div>
</header>

<div class="page page-body">
<!-- Filtro por assunto = links para páginas prerenderizadas; funciona sem JS e cada filtro tem URL própria. -->
<nav class="topics" aria-labelledby="topics-title">
  <h2 id="topics-title" class="eyebrow topics__title">{t.writing.topicsLabel}</h2>
  <ul class="topics__list list-reset">
    <li>
      <a class="chip" href={pages.writing[data.locale]} aria-current={data.currentTopic ? undefined : 'page'}>
        {t.writing.allTopics} <span class="topics__count">{total}</span>
      </a>
    </li>
    {#each data.topics as topic (topic.slug)}
      <li>
        <a class="chip" href={topic.href} aria-current={data.currentTopic === topic.slug ? 'page' : undefined}>
          {topic.label} <span class="topics__count">{topic.count}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

{#each data.years as group (group.year)}
  <section class="year" aria-labelledby={`ano-${group.year}`}>
    <h2 id={`ano-${group.year}`} class="year__label">
      <span class="visually-hidden">{format(t.writing.yearLabel, { year: group.year })}</span>
      <span aria-hidden="true">{group.year}</span>
    </h2>
    <WritingList items={group.items} locale={data.locale} dateStyle="day" />
  </section>
{/each}

<p class="writing-footer">
  {#if data.locale === 'pt-BR'}
    <span>{t.writing.notesPointer} <a href={pages.notes['pt-BR']}>{t.notes.title}</a>.</span>
  {/if}
  <a href={feedHref} type="application/rss+xml">{t.writing.rss}</a>
</p>
</div>

<style>
  .writing-header {
    display: grid;
    gap: var(--space-4);
  }

  /* Filtro por assunto: rótulo ciano e pílulas (`.chip`, global); fio fino em cima e embaixo. */
  .topics {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-4);
    margin-block-end: var(--space-8);
    border-block: var(--border-hairline) solid var(--color-rule);
  }

  .topics__title {
    font-family: var(--font-text);
  }

  .topics__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* No toque, o alvo chega a 44 px. */
  @media (pointer: coarse) {
    .topics__list :global(.chip) {
      min-height: 44px;
    }
  }

  .topics__count {
    margin-inline-start: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  }

  /* Ano como marco à margem no desktop (colunas 1–2), lista nas colunas 3–12. */
  .year {
    display: grid;
    gap: var(--space-3);
    margin-block-end: var(--space-8);
  }

  .year__label {
    font-size: var(--step-3);
    line-height: 1;
    color: var(--color-text-faint);
  }

  @media (min-width: 960px) {
    .year {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .year__label {
      grid-column: 1 / span 2;
      position: sticky;
      top: calc(var(--header-h) + var(--space-5));
      padding-block-start: var(--space-5);
    }

    .year :global(.writing-list) {
      grid-column: 3 / span 10;
    }
  }

  .writing-footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    font-size: var(--step-0);
    color: var(--color-text-soft);
  }
</style>
