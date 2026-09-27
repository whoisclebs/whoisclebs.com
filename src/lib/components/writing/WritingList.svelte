<script lang="ts">
  import { format, formatDate, formatDayMonth, getMessages, type Locale } from '$lib/i18n'

  export type WritingListItem = {
    kind?: 'article' | 'note'
    slug: string
    title: string
    excerpt: string
    href: string
    date: string
    topic: { slug: string; label: string; href?: string }
    readingMinutes: number
    hreflang?: Locale
  }

  let {
    items,
    locale,
    dateStyle = 'full',
    showKind = false,
    headingLevel = 3,
  }: {
    items: WritingListItem[]
    locale: Locale
    /** `day`: lista já agrupada por ano, a data mostra só dia e mês. */
    dateStyle?: 'full' | 'day'
    showKind?: boolean
    headingLevel?: 2 | 3
  } = $props()

  const t = $derived(getMessages(locale))
</script>

<!--
  Índice editorial (não grade de cartões): uma linha por texto, com data, título, resumo, assunto e tempo
  de leitura em colunas fixas quando há largura (container query), empilhado no celular.
-->
<ol class="writing-list list-reset">
  {#each items as item (`${item.kind ?? 'article'}:${item.slug}`)}
    <li class="row">
      <p class="row__date">
        <time datetime={item.date}>{dateStyle === 'day' ? formatDayMonth(item.date, locale) : formatDate(item.date, locale)}</time>
      </p>
      <div class="row__main">
        <svelte:element this={`h${headingLevel}`} class="row__title">
          <a href={item.href} hreflang={item.hreflang}>{item.title}</a>
        </svelte:element>
        <p class="row__excerpt">{item.excerpt}</p>
      </div>
      <p class="row__facts">
        {#if showKind}
          <span class="row__kind">{item.kind === 'note' ? t.home.writing.note : t.home.writing.article}</span>
        {/if}
        {#if item.topic.href}
          <a class="row__topic" href={item.topic.href}>{item.topic.label}</a>
        {:else}
          <span class="row__topic">{item.topic.label}</span>
        {/if}
        <span>{format(t.writing.minutesRead, { n: item.readingMinutes })}</span>
      </p>
    </li>
  {/each}
</ol>

<style>
  .writing-list {
    container-type: inline-size;
    border-block-start: var(--border-hairline) solid var(--color-text);
  }

  .row {
    display: grid;
    grid-template-areas:
      'date'
      'main'
      'facts';
    gap: var(--space-2);
    padding-block: var(--space-5);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .row__date {
    grid-area: date;
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-faint);
  }

  .row__main {
    grid-area: main;
    display: grid;
    gap: var(--space-2);
    min-width: 0;
  }

  .row__title {
    font-family: var(--font-text);
    font-size: var(--step-2);
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: normal;
    text-wrap: balance;
  }

  .row__title a {
    color: var(--color-text);
    text-decoration-color: var(--color-rule);
  }

  @media (hover: hover) and (pointer: fine) {
    .row__title a:hover {
      color: var(--color-link-hover);
      text-decoration-color: currentColor;
    }
  }

  .row__excerpt {
    max-width: 60ch;
    color: var(--color-text-soft);
    font-size: var(--step-0);
    line-height: 1.55;
  }

  .row__facts {
    grid-area: facts;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .row__kind {
    color: var(--color-text);
  }

  /* Com largura, data | texto | fatos em colunas fixas: o olho desce pela coluna das datas. */
  @container (min-width: 640px) {
    .row {
      grid-template-columns: 9.5rem minmax(0, 1fr) 11rem;
      grid-template-areas: 'date main facts';
      column-gap: var(--space-5);
      align-items: baseline;
    }

    .row__facts {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
