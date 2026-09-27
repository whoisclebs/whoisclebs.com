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

<header class="writing-header">
  <h1>{data.heading}</h1>
  <p class="lead">{data.lead}</p>
</header>

<!-- Filtro por assunto = links para páginas prerenderizadas; funciona sem JS e cada filtro tem URL própria. -->
<nav class="topics" aria-labelledby="topics-title">
  <h2 id="topics-title" class="topics__title">{t.writing.topicsLabel}</h2>
  <ul class="topics__list list-reset">
    <li>
      <a href={pages.writing[data.locale]} aria-current={data.currentTopic ? undefined : 'page'}>
        {t.writing.allTopics} <span class="topics__count">{total}</span>
      </a>
    </li>
    {#each data.topics as topic (topic.slug)}
      <li>
        <a href={topic.href} aria-current={data.currentTopic === topic.slug ? 'page' : undefined}>
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

<style>
  .writing-header {
    display: grid;
    gap: var(--space-4);
    padding-block-end: var(--space-7);
  }

  .topics {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-4);
    margin-block-end: var(--space-8);
    border-block: var(--border-hairline) solid var(--color-rule);
  }

  .topics__title {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    letter-spacing: var(--tracking-mono);
    color: var(--color-text-faint);
  }

  .topics__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .topics__list a {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding-inline: var(--space-4);
    border: var(--border-hairline) solid var(--color-rule);
    border-radius: var(--radius-control);
    color: var(--color-text);
    font-size: var(--step-0);
    text-decoration: none;
  }

  .topics__list a[aria-current='page'] {
    border-color: var(--color-text);
    background: var(--color-text);
    color: var(--color-bg);
  }

  @media (hover: hover) and (pointer: fine) {
    .topics__list a:not([aria-current='page']):hover {
      border-color: var(--color-text);
      color: var(--color-text);
    }
  }

  .topics__count {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-variant-numeric: tabular-nums;
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
      top: var(--space-6);
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
    color: var(--color-text-soft);
  }
</style>
