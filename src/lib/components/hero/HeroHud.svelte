<!--
  HUD da home: uma linha de estado sobre o fio âmbar do horizonte, no fim do hero. Aceno a jogos de
  estratégia, só com telemetria real e rótulo em texto em todos os itens:
  - atividade pública: quantos eventos há agora no cache do site (os mesmos que o rodapé lista), ou o estado;
  - último sync: idade da última sincronização com o GitHub, barra de 10 segmentos que esvazia com a idade;
  - latência /api/activity: medida pelo navegador do visitante, em ms;
  - build: SHA curto do commit publicado, com link, gravado no build.
  Sem JS: o build e um link para o perfil do GitHub; o resto fica em "sem dado", nunca inventado.
  A busca começa depois do `load` (o LCP é o H1) e é a mesma do rodapé (`activity-store.ts`).
  Dicas: abrem no hover (ponteiro fino), no foco do teclado e no toque (botão); Esc fecha.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { relativeTime, type ActivityResult } from '$lib/activity/activity-client'
  import { requestActivity } from '$lib/activity/activity-store'
  import { activityBar, EMPTY_BAR, HUD_SEGMENTS, latencyBar, readings, syncBar, type Bar } from '$lib/activity/hud'
  import { buildInfo } from '$lib/build-info'
  import { format, getMessages, type Locale } from '$lib/i18n'

  let { locale, profileUrl }: { locale: Locale; profileUrl: string } = $props()

  const t = $derived(getMessages(locale).hud)
  const build = buildInfo()

  let phase = $state<'nojs' | 'waiting' | 'done'>('nojs')
  let result = $state<ActivityResult | null>(null)
  let latency = $state<number | null>(null)
  let now = $state(new Date())

  let open = $state<string | null>(null)
  let dismissed = $state<string | null>(null)
  let warm = $state(false)
  let warmTimer: ReturnType<typeof setTimeout> | undefined
  let root: HTMLElement

  const read = $derived(readings(result, latency))

  function shortDate(iso: string) {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  }

  type Item = { key: string; label: string; tip: string; bar: Bar | null; value: string; href?: string; datetime?: string }

  const items = $derived.by((): Item[] => {
    const waiting = phase === 'waiting'
    const noValue = waiting ? t.loading : t.noData

    let activity: Item
    if (phase === 'nojs') {
      activity = { key: 'activity', label: t.activity.label, tip: `${t.noJs} ${t.noJsLink}.`, bar: EMPTY_BAR, value: t.noJsLink, href: profileUrl }
    } else if (read.activity && 'unavailable' in read.activity) {
      activity = { key: 'activity', label: t.activity.label, tip: t.activity.tip, bar: EMPTY_BAR, value: t.activity.unavailable }
    } else if (read.activity) {
      const n = read.activity.count
      activity = { key: 'activity', label: t.activity.label, tip: t.activity.tip, bar: activityBar(n), value: n === 1 ? t.activity.one : format(t.activity.many, { n }) }
    } else {
      activity = { key: 'activity', label: t.activity.label, tip: t.activity.tip, bar: EMPTY_BAR, value: noValue }
    }

    const sync: Item = read.sync
      ? {
          key: 'sync',
          label: t.sync.label,
          tip: t.sync.tip,
          bar: syncBar(read.sync.updatedAt, now, read.sync.status),
          value: read.sync.status === 'stale' ? format(t.sync.stale, { date: shortDate(read.sync.updatedAt) }) : relativeTime(read.sync.updatedAt, now, locale),
          datetime: read.sync.updatedAt,
        }
      : { key: 'sync', label: t.sync.label, tip: t.sync.tip, bar: EMPTY_BAR, value: phase === 'done' ? t.noData : noValue }

    const latencyItem: Item =
      read.latencyMs !== null
        ? { key: 'latency', label: t.latency.label, tip: t.latency.tip, bar: latencyBar(read.latencyMs), value: format(t.latency.value, { n: read.latencyMs }) }
        : { key: 'latency', label: t.latency.label, tip: t.latency.tip, bar: EMPTY_BAR, value: phase === 'done' ? t.noData : noValue }

    // Commit não é grandeza: texto com link, sem barra.
    const buildItem: Item = build
      ? { key: 'build', label: t.build.label, tip: t.build.tip, bar: null, value: build.short, href: build.url }
      : { key: 'build', label: t.build.label, tip: t.build.tip, bar: null, value: t.noData }

    return [activity, sync, latencyItem, buildItem]
  })

  function afterLoad(): Promise<void> {
    if (document.readyState === 'complete') return Promise.resolve()
    return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
  }

  onMount(() => {
    phase = 'waiting'
    let cancelled = false
    void (async () => {
      await afterLoad()
      // Uma volta do laço de eventos: a busca começa depois do handler de load, fora do caminho do LCP.
      await new Promise((resolve) => setTimeout(resolve, 0))
      const snapshot = await requestActivity()
      if (cancelled) return
      result = snapshot.result
      latency = snapshot.latencyMs
      now = new Date()
      phase = 'done'
    })()

    const closeOutside = (event: PointerEvent) => {
      if (open && !root.contains(event.target as Node)) open = null
    }
    document.addEventListener('pointerdown', closeOutside)
    // Delegação no contêiner: hover e foco de cada item controlam a abertura instantânea das vizinhas.
    const keyOf = (event: Event) => (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-hud]')?.dataset.hud
    const enter = (event: Event) => keyOf(event) && shown()
    const leave = (event: Event) => {
      const key = keyOf(event)
      const next = (event as MouseEvent | FocusEvent).relatedTarget as HTMLElement | null
      if (key && next?.closest<HTMLElement>('[data-hud]')?.dataset.hud !== key) hidden(key)
    }
    root.addEventListener('mouseover', enter)
    root.addEventListener('focusin', enter)
    root.addEventListener('mouseout', leave)
    root.addEventListener('focusout', leave)
    root.addEventListener('keydown', onKeydown)
    return () => {
      cancelled = true
      clearTimeout(warmTimer)
      document.removeEventListener('pointerdown', closeOutside)
      root.removeEventListener('mouseover', enter)
      root.removeEventListener('focusin', enter)
      root.removeEventListener('mouseout', leave)
      root.removeEventListener('focusout', leave)
      root.removeEventListener('keydown', onKeydown)
    }
  })

  /** Depois da primeira dica, as vizinhas abrem sem animação (o visitante já está lendo o HUD). */
  function shown() {
    clearTimeout(warmTimer)
    warmTimer = setTimeout(() => (warm = true), 160)
  }

  function hidden(key: string) {
    if (dismissed === key) dismissed = null
    clearTimeout(warmTimer)
    warmTimer = setTimeout(() => (warm = false), 500)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-hud]')
    dismissed = item?.dataset.hud ?? open
    open = null
  }
</script>

<div class="hud" bind:this={root} data-hud-phase={phase} data-warm={warm || undefined} role="group" aria-label={t.label}>
  <div class="page">
  <ul class="hud__list">
    {#each items as item (item.key)}
      <li
        class="hud__item"
        data-hud={item.key}
        data-open={open === item.key || undefined}
        data-dismissed={dismissed === item.key || undefined}
      >
        <button
          type="button"
          class="hud__label"
          aria-describedby={`hud-tip-${item.key}`}
          onclick={() => {
            dismissed = null
            open = open === item.key ? null : item.key
            if (open) shown()
          }}>{item.label}</button
        >
        {#if item.bar}
          <span class="hud__bar" data-tone={item.bar.tone} aria-hidden="true">
            {#each { length: HUD_SEGMENTS }, index (index)}
              <span class="hud__seg" data-on={index < (item.bar?.filled ?? 0) || undefined}></span>
            {/each}
          </span>
        {/if}
        {#if item.href}
          <a class="hud__value" href={item.href} rel="noopener noreferrer">{item.value}</a>
        {:else if item.datetime}
          <time class="hud__value" datetime={item.datetime}>{item.value}</time>
        {:else}
          <span class="hud__value">{item.value}</span>
        {/if}
        <span class="hud__tip" role="tooltip" id={`hud-tip-${item.key}`}>{item.tip}</span>
      </li>
    {/each}
  </ul>
  </div>
</div>

<style>
  /* O horizonte: fio âmbar de 1 px com a primeira luz nascendo a leste (à direita). */
  .hud {
    position: relative;
    border-block-start: var(--border-hairline) solid var(--color-sun);
  }

  .hud::before {
    content: '';
    position: absolute;
    inset: auto 0 100% auto;
    width: min(60%, 44rem);
    height: 72px;
    background: radial-gradient(60% 100% at 100% 100%, rgb(242 230 160 / 0.32), rgb(242 230 160 / 0) 72%);
    pointer-events: none;
  }

  /*
   * Onde a faixa de luz do vídeo encosta no horizonte: um ponto quente no fio e um reflexo curto abaixo
   * dele. Decorativo; o fio continua sendo o limite da noite. Pulsa devagar só com movimento permitido.
   */
  .hud::after {
    content: '';
    position: absolute;
    inset: -1px 0 auto auto;
    width: min(46%, 36rem);
    height: 1px;
    background: linear-gradient(to right, rgb(242 230 160 / 0), rgb(250 244 210 / 0.95) 72%, rgb(242 230 160 / 0.4));
    box-shadow: 0 0 12px 1px rgb(242 230 160 / 0.55);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .hud::after {
      animation: horizon-glint 7s ease-in-out infinite alternate;
    }
  }

  @keyframes horizon-glint {
    from {
      opacity: 0.55;
    }
    to {
      opacity: 1;
    }
  }

  .hud__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3) var(--space-4);
    margin: 0;
    padding: var(--space-3) 0 var(--space-4);
    list-style: none;
  }

  @media (min-width: 960px) {
    .hud__list {
      grid-template-columns: repeat(4, auto);
      justify-content: space-between;
      padding-block: var(--space-3);
    }
  }

  .hud__item {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    min-width: 0;
    font-family: var(--font-mono);
    font-size: var(--step--2);
    line-height: var(--leading-ui);
  }

  .hud__label {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-text-soft);
    font: inherit;
    letter-spacing: var(--tracking-mono);
    text-decoration: underline dotted var(--color-text-faint);
    text-underline-offset: 0.3em;
    cursor: help;
  }

  .hud__bar {
    display: inline-flex;
    gap: 2px;
  }

  .hud__seg {
    width: 6px;
    height: 10px;
    box-shadow: inset 0 0 0 1px var(--color-rule);
  }

  .hud__bar[data-tone='live'] .hud__seg[data-on] {
    background: var(--color-sun);
    box-shadow: none;
  }

  .hud__bar[data-tone='dim'] .hud__seg[data-on] {
    background: var(--color-text-faint);
    box-shadow: none;
  }

  .hud__value {
    color: var(--color-text);
    font-size: var(--step--1);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  a.hud__value {
    color: var(--color-text);
    text-decoration-color: var(--color-sun);
  }

  /* ---------- Dica tátil: fio âmbar, entalhe apontando para a leitura, relevo interno leve ---------- */
  .hud__tip {
    position: absolute;
    inset-block-end: calc(100% + 12px);
    inset-inline-start: 0;
    z-index: 5;
    width: max-content;
    max-width: min(20rem, calc(100vw - 2 * var(--page-gutter)));
    padding: var(--space-3) var(--space-4);
    border: var(--border-hairline) solid var(--color-sun);
    border-radius: var(--radius-control);
    background: var(--p-night-raised);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      inset 0 -1px 0 rgb(0 0 0 / 0.35),
      0 8px 24px rgb(0 0 0 / 0.35);
    color: var(--p-on-night);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    line-height: 1.5;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    transform: scale(0.97);
    transform-origin: 16px calc(100% + 8px);
    transition:
      opacity var(--dur-tip) var(--ease-out),
      transform var(--dur-tip) var(--ease-out),
      visibility 0s linear var(--dur-tip);
  }

  /* Entalhe e ponte invisível (o ponteiro atravessa o vão sem fechar a dica, WCAG 1.4.13). */
  .hud__tip::before {
    content: '';
    position: absolute;
    inset: 100% 0 auto;
    height: 14px;
  }

  .hud__tip::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: 14px;
    width: 9px;
    height: 9px;
    border-inline-end: var(--border-hairline) solid var(--color-sun);
    border-block-end: var(--border-hairline) solid var(--color-sun);
    background: var(--p-night-raised);
    transform: translateY(-4px) rotate(45deg);
  }

  /* Metade direita: a dica se ancora pela direita e não sai da tela. */
  .hud__item:nth-child(even) .hud__tip {
    inset-inline: auto 0;
    transform-origin: calc(100% - 16px) calc(100% + 8px);
  }

  .hud__item:nth-child(even) .hud__tip::after {
    inset-inline: auto 14px;
  }

  @media (min-width: 960px) {
    .hud__item:nth-child(2) .hud__tip {
      inset-inline: 0 auto;
      transform-origin: 16px calc(100% + 8px);
    }

    .hud__item:nth-child(2) .hud__tip::after {
      inset-inline: 14px auto;
    }

    .hud__item:nth-child(3) .hud__tip {
      inset-inline: auto 0;
      transform-origin: calc(100% - 16px) calc(100% + 8px);
    }

    .hud__item:nth-child(3) .hud__tip::after {
      inset-inline: auto 14px;
    }
  }

  .hud__item:is(:focus-within, [data-open]) .hud__tip {
    opacity: 1;
    visibility: visible;
    transform: none;
    transition-delay: 0s;
  }

  @media (hover: hover) and (pointer: fine) {
    .hud__item:hover .hud__tip {
      opacity: 1;
      visibility: visible;
      transform: none;
      transition-delay: 0s;
    }
  }

  .hud__item[data-dismissed] .hud__tip {
    opacity: 0;
    visibility: hidden;
  }

  .hud[data-warm] .hud__tip {
    transition-duration: 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    .hud__tip {
      transform: none;
      transition:
        opacity var(--dur-tip) linear,
        visibility 0s linear var(--dur-tip);
    }
  }
</style>
