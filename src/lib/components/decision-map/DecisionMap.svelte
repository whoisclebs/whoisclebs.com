<!--
  Mapa de Decisões (hero da home). Svelte 5 com runes; lógica testada em decision-map.ts.

  - Sem JS: o SVG, a lista de caminhos com o rótulo de evidência e o painel do 1º caminho (o único com
    código público) já vêm no HTML prerenderizado; a lista é estática (nada de botão que não faz nada).
  - Com JS: a lista vira um tablist vertical (WAI-ARIA APG, ativação automática): clique, setas nos dois
    eixos, Home/End, tabindex itinerante. O painel troca decisão, trade-off e link.
  - A evidência está na forma **e** no texto: célula cheia = código público; vazada = sem case público;
    tracejada = em construção. Cada caminho tem o rótulo escrito ao lado.
  - Realce de 180 ms só com opacity/transform; com prefers-reduced-motion, sem transição.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { DECISION_ROUTES, GRID, nextIndex, routeCells, type DecisionMapCopy, type RouteId } from './decision-map'

  interface Props {
    copy: DecisionMapCopy
    /** Destino de cada caminho; ausente = sem link público (mostra `copy.noLink`). */
    links: Partial<Record<RouteId, { href: string; hreflang?: string }>>
    id?: string
  }

  let { copy, links, id = 'mapa-decisoes' }: Props = $props()

  const CELL = 24
  const routes = $derived(
    DECISION_ROUTES.map((route, index) => {
      const cells = routeCells(route)
      return { ...route, cells, end: cells[cells.length - 1] ?? GRID.origin, copy: copy.routes[index] }
    }),
  )

  let selected = $state(0)
  let enhanced = $state(false)
  const tabs: HTMLButtonElement[] = []

  // Só no cliente: a lista estática do HTML vira tablist quando há JS para operá-la.
  onMount(() => {
    enhanced = true
  })

  const active = $derived(routes[selected] ?? routes[0])
  const activeLink = $derived(active ? links[active.id] : undefined)

  function select(index: number) {
    selected = index
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    const next = nextIndex(index, event.key, routes.length)
    if (next === null) return
    event.preventDefault()
    selected = next
    tabs[next]?.focus()
  }
</script>

<section class="dmap" aria-labelledby="{id}-title">
  <div class="dmap__layout">
    <div class="dmap__head">
      <h2 id="{id}-title" class="dmap__title">{copy.title}</h2>
      <p class="dmap__intro">{copy.intro}</p>
    </div>

    <svg
      class="dmap__svg"
      viewBox="0 0 {GRID.cols} {GRID.rows}"
      width={GRID.cols * CELL}
      height={GRID.rows * CELL}
      aria-hidden="true"
      focusable="false"
    >
      <g class="dmap__grid">
        {#each { length: GRID.cols + 1 } as _, x (x)}
          <line x1={x} y1="0" x2={x} y2={GRID.rows} />
        {/each}
        {#each { length: GRID.rows + 1 } as _, y (y)}
          <line x1="0" y1={y} x2={GRID.cols} y2={y} />
        {/each}
      </g>
      {#each routes as route, index (route.id)}
        <g class="route" data-evidence={route.evidence} data-active={index === selected ? '' : undefined}>
          {#each route.cells as cell, order (order)}
            <rect class="route__cell" x={cell[0] + 0.18} y={cell[1] + 0.18} width="0.64" height="0.64" style:--i={order} />
          {/each}
          <rect class="route__end" x={route.end[0] - 0.1} y={route.end[1] - 0.1} width="1.2" height="1.2" />
        </g>
      {/each}
      <rect class="dmap__origin" x={GRID.origin[0] + 0.05} y={GRID.origin[1] + 0.05} width="0.9" height="0.9" />
    </svg>

    {#if enhanced}
      <div class="dmap__list" role="tablist" aria-label={copy.listLabel} aria-orientation="vertical">
        {#each routes as route, index (route.id)}
          <button
            bind:this={tabs[index]}
            type="button"
            class="dmap__item"
            role="tab"
            id="{id}-tab-{route.id}"
            aria-selected={index === selected}
            aria-controls="{id}-painel"
            tabindex={index === selected ? 0 : -1}
            data-evidence={route.evidence}
            onclick={() => select(index)}
            onkeydown={(event) => onKeydown(event, index)}
          >
            <span class="dmap__swatch" aria-hidden="true"></span>
            <span class="dmap__label">{route.copy?.label}</span>
            <span class="dmap__evidence">{route.copy?.evidence}</span>
          </button>
        {/each}
      </div>
    {:else}
      <ul class="dmap__list" aria-label={copy.listLabel}>
        {#each routes as route, index (route.id)}
          <li class="dmap__item" data-evidence={route.evidence} aria-current={index === selected ? 'true' : undefined}>
            <span class="dmap__swatch" aria-hidden="true"></span>
            <span class="dmap__label">{route.copy?.label}</span>
            <span class="dmap__evidence">{route.copy?.evidence}</span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if active?.copy}
      <div
        class="dmap__panel"
        id="{id}-painel"
        role={enhanced ? 'tabpanel' : undefined}
        aria-labelledby={enhanced ? `${id}-tab-${active.id}` : undefined}
      >
        <dl>
          <div>
            <dt>{copy.decision}</dt>
            <dd>{active.copy.decision}</dd>
          </div>
          <div>
            <dt>{copy.tradeoff}</dt>
            <dd>{active.copy.tradeoff}</dd>
          </div>
        </dl>
        {#if activeLink && active.copy.link}
          <a class="dmap__link" href={activeLink.href} hreflang={activeLink.hreflang}>{active.copy.link}</a>
        {:else}
          <p class="dmap__nolink">{copy.noLink}</p>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .dmap {
    container-type: inline-size;
    padding: var(--space-4);
    background: var(--color-surface);
    border: var(--border-hairline) solid var(--color-rule);
  }

  .dmap__layout {
    display: grid;
    gap: var(--space-4);
  }

  /* Com espaço (tablet, container ≥ 560 px): mapa à esquerda, caminhos e painel à direita. */
  @container (min-width: 560px) {
    .dmap__layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-areas:
        'head head'
        'svg list'
        'svg panel';
      column-gap: var(--space-5);
      align-items: start;
    }

    .dmap__head {
      grid-area: head;
    }

    .dmap__svg {
      grid-area: svg;
    }

    .dmap__list {
      grid-area: list;
    }

    .dmap__panel {
      grid-area: panel;
    }
  }

  .dmap__head {
    display: grid;
    gap: var(--space-1);
  }

  .dmap__title {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 500;
    letter-spacing: var(--tracking-mono);
    line-height: var(--leading-ui);
    color: var(--color-text);
  }

  .dmap__intro {
    font-size: var(--step-0);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  /* Fundo de papel/noite atrás da quadrícula: no tema escuro a grade some sobre a superfície elevada. */
  .dmap__svg {
    width: 100%;
    height: auto;
    overflow: visible;
    background: var(--color-bg);
  }

  .dmap__grid line {
    stroke: var(--color-grid);
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
  }

  .dmap__origin {
    fill: var(--color-text);
  }

  /* Caminhos: a cor diz "selecionado"; a forma diz a evidência. */
  .route {
    color: var(--color-text-faint);
  }

  .route[data-active] {
    color: var(--color-accent);
  }

  .route__cell {
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0.55;
    transform: scale(0.78);
    transition:
      opacity var(--dur-ui) var(--ease-out),
      transform var(--dur-ui) var(--ease-out);
    transition-delay: calc(var(--i, 0) * 6ms);
  }

  .route[data-active] .route__cell {
    opacity: 1;
    transform: none;
  }

  .route[data-evidence='no-public-case'] .route__cell,
  .route[data-evidence='in-progress'] .route__cell {
    fill: none;
  }

  .route[data-evidence='in-progress'] .route__cell {
    stroke-dasharray: 3 2;
  }

  .route__end {
    fill: none;
    stroke: currentColor;
    stroke-width: 1px;
    vector-effect: non-scaling-stroke;
    opacity: 0;
    transition: opacity var(--dur-ui) var(--ease-out);
  }

  .route[data-active] .route__end {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .route__cell,
    .route__end {
      transition: none;
    }
  }

  /* Lista de caminhos (tablist com JS, lista estática sem JS): mesma caixa nos dois casos, sem CLS. */
  .dmap__list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .dmap__item {
    display: grid;
    grid-template-columns: 12px minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--space-3);
    min-height: 44px;
    width: 100%;
    margin: 0;
    padding: var(--space-2) var(--space-2);
    border: 0;
    border-block-end: var(--border-hairline) solid var(--color-rule);
    background: transparent;
    color: var(--color-text-soft);
    font: inherit;
    font-size: var(--step-0);
    line-height: var(--leading-ui);
    text-align: start;
  }

  button.dmap__item {
    cursor: pointer;
  }

  .dmap__item[aria-selected='true'],
  .dmap__item[aria-current='true'] {
    color: var(--color-text);
    background: var(--color-bg);
    box-shadow: inset 2px 0 0 var(--color-accent);
  }

  @media (hover: hover) and (pointer: fine) {
    button.dmap__item:hover {
      color: var(--color-text);
    }
  }

  .dmap__item:focus-visible {
    outline-offset: -3px;
  }

  .dmap__swatch {
    width: 12px;
    height: 12px;
    border: 1.5px solid currentColor;
    background: currentColor;
  }

  .dmap__item[aria-selected='true'] .dmap__swatch,
  .dmap__item[aria-current='true'] .dmap__swatch {
    color: var(--color-accent);
  }

  .dmap__item[data-evidence='no-public-case'] .dmap__swatch,
  .dmap__item[data-evidence='in-progress'] .dmap__swatch {
    background: transparent;
  }

  .dmap__item[data-evidence='in-progress'] .dmap__swatch {
    border-style: dashed;
  }

  .dmap__label {
    font-weight: 600;
  }

  .dmap__evidence {
    font-family: var(--font-mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-mono);
    color: var(--color-text-faint);
  }

  .dmap__panel {
    display: grid;
    gap: var(--space-3);
    font-size: var(--step-0);
    line-height: 1.5;
  }

  .dmap__panel dl {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }

  .dmap__panel dt {
    font-family: var(--font-mono);
    font-size: var(--step--2);
    color: var(--color-text-faint);
  }

  .dmap__panel dd {
    margin: 0;
    color: var(--color-text);
  }

  .dmap__link {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  .dmap__nolink {
    min-height: 44px;
    display: flex;
    align-items: center;
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }
</style>
