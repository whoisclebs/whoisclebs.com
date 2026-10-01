<!--
  Últimos artigos da home (do design): cabeçalho com o título e os filtros por assunto, o primeiro item da lista
  filtrada em destaque e os demais em linhas. No pt-BR as notas entram na lista, marcadas como "Nota".

  O filtro é aprimoramento progressivo: o HTML prerenderizado já traz a lista inteira com "Todos" marcado; os
  botões ficam desabilitados até o JS montar (ocupam o mesmo lugar, então não há salto de layout).
  A linha inteira é clicável sem aninhar interativos: o link fica no <h3> e um `::after` esticado cobre o <article>.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { format, getMessages, type Locale } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { RecentItem } from '$lib/server/pages'

  let { id, locale, items }: { id: string; locale: Locale; items: RecentItem[] } = $props()

  const t = $derived(getMessages(locale))
  const copy = $derived(t.home.writing)
  const feedHref = $derived(locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')

  /** Assuntos presentes na lista, na ordem em que aparecem (o mais recente primeiro). */
  const topics = $derived(
    items
      .filter((item, index) => items.findIndex((other) => other.topic.slug === item.topic.slug) === index)
      .map((item) => ({ slug: item.topic.slug, label: item.topic.label })),
  )

  let filter = $state<string | null>(null)
  let ready = $state(false)
  const list = $derived(filter ? items.filter((item) => item.topic.slug === filter) : items)
  const featured = $derived(list[0])
  const rows = $derived(list.slice(1))

  onMount(() => {
    ready = true
  })
</script>

{#snippet kicker(item: RecentItem)}
  <span class="kicker__topic">{item.topic.label}</span>
  {#if item.kind === 'note'}
    <span class="kicker__dot" aria-hidden="true">·</span>
    <span class="kicker__topic">{copy.note}</span>
  {/if}
  <span class="kicker__dot" aria-hidden="true">·</span>
  <span class="kicker__time">{format(t.writing.minutesRead, { n: item.readingMinutes })}</span>
{/snippet}

<section class="writing page" {id} aria-labelledby="{id}-title">
  <div class="writing__head">
    <h2 id="{id}-title">{copy.title}</h2>
    {#if topics.length > 1}
      <div class="writing__filters" role="group" aria-label={copy.filterLabel}>
        <button class="chip" type="button" aria-pressed={filter === null} disabled={!ready} onclick={() => (filter = null)}>{copy.allTopics}</button>
        {#each topics as topic (topic.slug)}
          <button class="chip" type="button" aria-pressed={filter === topic.slug} disabled={!ready} onclick={() => (filter = topic.slug)}>{topic.label}</button>
        {/each}
      </div>
    {/if}
  </div>

  {#if featured}
    <article class="featured">
      <div class="featured__head">
        <p class="kicker">
          {@render kicker(featured)}
          <span class="kicker__badge">{copy.featured}</span>
        </p>
        <h3 class="featured__title"><a class="stretched" href={featured.href} hreflang={featured.hreflang}>{featured.title}</a></h3>
      </div>
      <div class="featured__body">
        <p class="featured__excerpt">{featured.excerpt}</p>
        <span class="featured__more" aria-hidden="true">{featured.kind === 'note' ? copy.readNote : copy.read} <span>→</span></span>
      </div>
    </article>
  {/if}

  {#each rows as item (item.kind + item.slug)}
    <article class="row">
      <div class="row__head">
        <p class="kicker">{@render kicker(item)}</p>
        <h3 class="row__title"><a class="stretched" href={item.href} hreflang={item.hreflang}>{item.title}</a></h3>
      </div>
      <p class="row__excerpt">{item.excerpt}</p>
    </article>
  {/each}

  <p class="writing__more">
    <a class="link-arrow" href={pages.writing[locale]}>{copy.all} <span aria-hidden="true">→</span></a>
    <a class="link-arrow" href={pages.notes['pt-BR']} hreflang={locale === 'en' ? 'pt-BR' : undefined}>{copy.notes} <span aria-hidden="true">→</span></a>
    <a class="link-arrow" href={feedHref}>{copy.rss} <span aria-hidden="true">↗</span></a>
  </p>
</section>

<style>
  .writing {
    padding-block-start: var(--space-section);
    scroll-margin-top: var(--header-h);
  }

  .writing__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-5);
    margin-block-end: 40px;
  }

  h2 {
    letter-spacing: -0.01em;
  }

  .writing__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* Alvo de toque de 44 px sem mudar a pílula de 36 px do design. */
  .writing__filters .chip {
    position: relative;
  }

  .writing__filters .chip::before {
    content: '';
    position: absolute;
    inset: -4px 0;
  }

  .writing__filters .chip:disabled {
    cursor: default;
  }

  .kicker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    font-size: var(--step--2);
    letter-spacing: var(--tracking-label);
    line-height: var(--leading-ui);
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .kicker__dot {
    color: var(--color-text-mute);
  }

  .kicker__time {
    letter-spacing: 0;
    text-transform: none;
    color: var(--color-text-faint);
  }

  .kicker__badge {
    margin-inline-start: var(--space-1);
    padding: 2px var(--space-2);
    border: var(--border-hairline) solid color-mix(in srgb, var(--color-accent) 40%, transparent);
    border-radius: var(--radius-pill);
    font-size: 0.6875rem;
    letter-spacing: 0.06em;
    color: var(--color-accent);
  }

  article {
    position: relative;
  }

  /* O link do título cobre o artigo inteiro; o foco desenha o contorno no artigo, não só no título. */
  .stretched::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  .stretched:focus-visible {
    outline: none;
  }

  .stretched:focus-visible::after {
    outline: var(--focus-width) solid var(--color-focus);
    outline-offset: var(--focus-offset);
  }

  .stretched {
    color: var(--color-text);
    transition: color var(--dur-ui) ease;
  }

  article:focus-within .stretched {
    color: var(--color-accent);
  }

  @media (hover: hover) and (pointer: fine) {
    article:hover .stretched {
      color: var(--color-accent);
    }

    article:hover .featured__more > span {
      transform: translateX(3px);
    }
  }

  .featured {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: clamp(20px, 3vw, 48px);
    padding-block: var(--space-6);
    border-block: var(--border-hairline) solid var(--color-rule);
  }

  .featured__head {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .featured__title {
    font-size: clamp(32px, 3.6vw, 48px);
    line-height: 1.04;
    letter-spacing: -0.01em;
  }

  .featured__body {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 20px;
  }

  .featured__excerpt {
    max-width: 520px;
    font-size: var(--step-body);
    line-height: 1.65;
    color: var(--color-text-soft);
  }

  .featured__more {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step--1);
    color: var(--color-text);
  }

  .featured__more > span {
    color: var(--color-accent);
    transition: transform var(--dur-ui) var(--ease-out);
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    align-items: baseline;
    gap: clamp(16px, 3vw, 48px);
    padding-block: 26px;
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .row__head {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .row__title {
    font-size: clamp(24px, 2.4vw, 32px);
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  .row__excerpt {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text-faint);
  }

  @media (max-width: 639px) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-3);
    }
  }

  .writing__more {
    display: flex;
    flex-wrap: wrap;
    column-gap: 28px;
    margin-block-start: var(--space-4);
  }
</style>
