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
  Índice editorial (não grade de cartões): uma linha por texto, no desenho da lista do design. À esquerda a meta
  (assunto em ciano · tempo de leitura · data) e o título; à direita o resumo em tom apagado. Empilhado no celular.
  A ordem no DOM segue a leitura (data, título, resumo, fatos); a grade só reposiciona.
-->
<ol class="writing-list list-reset">
  {#each items as item (`${item.kind ?? 'article'}:${item.slug}`)}
    <li class="row">
      <p class="row__date">
        <time datetime={item.date}>{dateStyle === 'day' ? formatDayMonth(item.date, locale) : formatDate(item.date, locale)}</time>
      </p>
      <svelte:element this={`h${headingLevel}`} class="row__title">
        <a href={item.href} hreflang={item.hreflang}>{item.title}</a>
      </svelte:element>
      <p class="row__excerpt">{item.excerpt}</p>
      <p class="row__facts">
        {#if showKind}
          <span class="row__kind">{item.kind === 'note' ? t.home.writing.note : t.home.writing.article}</span>
        {/if}
        {#if item.topic.href}
          <a class="row__topic" href={item.topic.href}>{item.topic.label}</a>
        {:else}
          <span class="row__topic">{item.topic.label}</span>
        {/if}
        <span class="row__time">{format(t.writing.minutesRead, { n: item.readingMinutes })}</span>
      </p>
    </li>
  {/each}
</ol>

<style>
  .writing-list {
    container-type: inline-size;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .row {
    display: grid;
    grid-template-areas:
      'facts'
      'title'
      'excerpt'
      'date';
    gap: var(--space-2);
    padding-block: 26px;
    border-block-end: var(--border-hairline) solid var(--color-rule-soft);
  }

  .row__date {
    grid-area: date;
    font-family: var(--font-mono);
    font-size: var(--step--2);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-faint);
  }

  .row__title {
    grid-area: title;
    font-size: clamp(1.25rem, 1.05rem + 0.9vw, 1.625rem);
    line-height: var(--leading-heading);
    letter-spacing: -0.015em;
    text-wrap: balance;
  }

  .row__title a {
    color: var(--color-text);
    text-decoration: none;
    transition: color var(--dur-ui) ease;
  }

  /* Hover da linha: só o título acende em ciano (200 ms), sem deslocamento. */
  @media (hover: hover) and (pointer: fine) {
    .row:hover .row__title a {
      color: var(--color-accent);
    }
  }

  .row:has(.row__title a:focus-visible) .row__title a {
    color: var(--color-accent);
  }

  .row__excerpt {
    grid-area: excerpt;
    max-width: 60ch;
    color: var(--color-text-faint);
    font-size: var(--step-0);
    line-height: 1.55;
  }

  .row__facts {
    grid-area: facts;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    font-size: var(--step--2);
    font-weight: 500;
    letter-spacing: var(--tracking-label);
    line-height: var(--leading-ui);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  .row__kind {
    color: var(--color-text);
  }

  .row__facts a.row__topic {
    color: var(--color-accent);
    text-decoration: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .row__facts a.row__topic:hover {
      text-decoration: underline;
    }
  }

  /* O separador "·" entre assunto e tempo é decoração (cor muda, não entra no texto lido). */
  .row__facts > * + *::before {
    content: '·';
    margin-inline-end: var(--space-3);
    color: var(--color-text-mute);
  }

  /* Com largura: meta e título à esquerda, resumo à direita, data embaixo da meta. */
  @container (min-width: 640px) {
    .row {
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      grid-template-areas:
        'facts excerpt'
        'title excerpt'
        'date excerpt';
      column-gap: var(--space-7);
      align-content: start;
    }

    .row__excerpt {
      align-self: center;
      grid-row: 1 / -1;
    }
  }
</style>
