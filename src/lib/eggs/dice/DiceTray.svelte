<!--
  A mesa do d20 (página Hobbies). É uma ilha: a página só baixa este módulo quando a seção se aproxima da tela.
  O sorteio e a geometria moram em `d20.ts` (puro e testado); aqui ficam o relógio da animação, os controles e o
  anúncio do resultado. Sem som e sem nada guardado: o resultado vive só na tela.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { format, getMessages } from '$lib/i18n'
  import DieSvg from './DieSvg.svelte'
  import {
    cryptoSource,
    orientationFor,
    resolve,
    spinEase,
    tumble,
    type Mode,
    type Outcome,
    type Quat,
    type RandomSource,
    type Vec3,
  } from './d20'

  type Labels = ReturnType<typeof getMessages>['hobbies']['dice']

  let { labels }: { labels: Labels } = $props()

  /** Uma rolagem em curso: de onde parte, para onde vai, o giro e o pulo. */
  type Flight = { from: Quat; to: Quat; axis: Vec3; angle: number; start: number; duration: number; lift: number }
  type Die = { q: Quat; hop: number; flight: Flight | null }

  const MODES: Mode[] = ['normal', 'advantage', 'disadvantage']
  const REST = orientationFor(20)

  let mode = $state<Mode>('normal')
  let dice = $state<Die[]>([{ q: REST, hop: 0, flight: null }])
  let outcome = $state<Outcome | null>(null)
  let rolling = $state(false)
  /** Muda a cada rolagem com movimento reduzido para reiniciar o esmaecimento. */
  let swap = $state(0)
  let width = $state(0)
  let frame = 0

  // Com dois dados, cada um encolhe para caber lado a lado no celular.
  // Antes da primeira medida a largura é 0: vale o tamanho cheio, o mesmo do espaço reservado pela página.
  const radius = $derived.by(() => {
    const max = dice.length === 1 ? 104 : 80
    return width > 0 ? Math.round(Math.min(max, (width - 24) / (dice.length * 2.3))) : max
  })
  const rollLabel = $derived(labels.roll[mode])
  const lines = $derived.by(() => {
    if (!outcome) return []
    const out: string[] = []
    if (outcome.value === 20) out.push(labels.nat20)
    if (outcome.value === 1) out.push(labels.nat1)
    const other = outcome.rolls[1 - outcome.kept]
    if (other !== undefined) out.push(format(mode === 'advantage' ? labels.keptHigh : labels.keptLow, { n: other }))
    return out
  })

  /**
   * Fonte do sorteio. Em desenvolvimento, `globalThis.__d20Force = [20, 1]` força os próximos valores (para as
   * capturas de tela); o bloco some do build de produção, onde só vale o gerador criptográfico.
   */
  function source(): RandomSource {
    if (import.meta.env.DEV) {
      const forced = (globalThis as { __d20Force?: number[] }).__d20Force
      if (forced?.length) return () => (forced.shift() ?? 1) - 1
    }
    return cryptoSource
  }

  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  /** Eixo de giro ao acaso, mais deitado que em pé: dado jogado na mesa capota para a frente ou para o lado. */
  function randomAxis(): Vec3 {
    const turn = Math.random() * Math.PI * 2
    return [Math.cos(turn), Math.sin(turn) * 0.45, Math.sin(turn * 1.7) * 0.6]
  }

  /** Pulo em px: sobe e cai, um quique curto e assenta. Vai de 0 a 1 no progresso da rolagem. */
  function bounce(t: number): number {
    if (t < 0.42) return Math.sin((Math.PI * t) / 0.42)
    if (t < 0.6) return 0.16 * Math.sin((Math.PI * (t - 0.42)) / 0.18)
    return 0
  }

  function roll(): void {
    const result = resolve(mode, source())
    const reduced = calm()
    const now = performance.now()
    dice = result.rolls.map((value, i) => {
      const current = dice[i] ?? { q: REST, hop: 0, flight: null }
      const to = orientationFor(value)
      if (reduced) return { q: to, hop: 0, flight: null }
      // Mais voltas, mais tempo: a duração acompanha o giro (0,9 a 1,4 s).
      const turns = 2.2 + Math.random() * 1.6
      return {
        q: current.q,
        hop: current.hop,
        flight: {
          from: current.q,
          to,
          axis: randomAxis(),
          angle: turns * Math.PI * 2,
          start: now + i * 60,
          duration: 900 + ((turns - 2.2) / 1.6) * 500,
          lift: current.hop,
        },
      }
    })
    if (reduced) {
      swap++
      outcome = result
      rolling = false
      return
    }
    outcome = result
    rolling = true
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(tick)
  }

  function tick(now: number): void {
    let busy = false
    dice = dice.map((die) => {
      const f = die.flight
      if (!f) return die
      const t = Math.min(1, Math.max(0, (now - f.start) / f.duration))
      // Um clique no meio do pulo parte da altura em que o dado estava, em vez de teleportá-lo para a mesa.
      const settle = Math.min(1, t / 0.12)
      const hop = bounce(t) + f.lift * (1 - settle)
      if (t < 1) busy = true
      return t < 1 ? { q: tumble(f.from, f.to, f.axis, f.angle, spinEase(t)), hop, flight: f } : { q: f.to, hop: 0, flight: null }
    })
    if (busy) frame = requestAnimationFrame(tick)
    else rolling = false
  }

  function pick(next: Mode): void {
    if (next === mode) return
    mode = next
    cancelAnimationFrame(frame)
    rolling = false
    outcome = null
    // Troca de modo: um ou dois dados parados, o novo mostrando o 20 como na chegada.
    dice = (next === 'normal' ? [0] : [0, 1]).map((i) => {
      const die = dice[i]
      return die ? { q: die.flight?.to ?? die.q, hop: 0, flight: null } : { q: REST, hop: 0, flight: null }
    })
  }

  onMount(() => () => cancelAnimationFrame(frame))
</script>

<div class="tray" bind:clientWidth={width}>
  <div class="modes" role="group" aria-label={labels.modes.label}>
    {#each MODES as item (item)}
      <button class="chip" type="button" aria-pressed={mode === item} onclick={() => pick(item)}>{labels.modes[item]}</button>
    {/each}
  </div>

  <button class="stage" type="button" aria-label={rollLabel} onclick={roll}>
    {#each dice as die, i (i)}
      <span
        class="slot"
        class:slot--out={!rolling && outcome && outcome.rolls.length > 1 && outcome.kept !== i}
        style:--hop={`${(-die.hop * radius * 0.42).toFixed(1)}px`}
        style:--shade={(1 - die.hop * 0.45).toFixed(3)}
      >
        <span class="shadow" aria-hidden="true"></span>
        {#key swap}
          <span class="body"><DieSvg q={die.q} {radius} /></span>
        {/key}
      </span>
    {/each}
  </button>

  <div class="result" aria-live="polite" aria-atomic="true">
    {#if outcome && !rolling}
      <p class="result__value" class:crit={outcome.value === 20} class:fumble={outcome.value === 1}>
        <span class="visually-hidden">{labels.result}</span>
        {outcome.value}
      </p>
      {#each lines as line (line)}
        <p class="result__line">{line}</p>
      {/each}
    {:else if !rolling}
      <p class="result__line">{labels.hint}</p>
    {/if}
  </div>
</div>

<style>
  /* Três faixas de altura fixa (modos, mesa, resultado): a página reserva o mesmo espaço antes da ilha chegar. */
  .tray {
    display: grid;
    grid-template-rows: var(--dice-rows);
    block-size: 100%;
    justify-items: center;
  }

  .modes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
  }

  /* O chip global tem 36 px; aqui sobe para o alvo de toque de 44 px. */
  .modes .chip {
    height: 44px;
    touch-action: manipulation;
  }

  .stage {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    gap: var(--space-4);
    min-block-size: 44px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .stage:active .body {
    scale: var(--press-scale);
  }

  .slot {
    position: relative;
    display: grid;
    place-items: center;
    transition: opacity var(--dur-scene) ease;
  }

  /* Vantagem e desvantagem: o dado que não vale fica apagado. */
  .slot--out {
    opacity: 0.4;
  }

  .body {
    display: block;
    translate: 0 var(--hop);
    transition: scale var(--dur-press) var(--ease-out);
  }

  /* Sombra de contato: encolhe e clareia quando o dado sobe. Objeto físico, então pode ter sombra. */
  .shadow {
    position: absolute;
    inset-block-end: 4%;
    inline-size: 70%;
    block-size: 14%;
    border-radius: 50%;
    background: rgb(0 0 0 / 0.55);
    filter: blur(10px);
    scale: var(--shade);
    opacity: var(--shade);
  }

  .result {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: var(--space-1);
    text-align: center;
  }

  .result__value {
    font-family: var(--font-mono);
    font-size: 2.75rem;
    font-weight: 600;
    line-height: 1;
    color: var(--color-text);
  }

  .result__value.crit {
    color: var(--color-accent);
  }

  .result__value.fumble {
    color: var(--color-hot);
  }

  .result__line {
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    /* Sem rolagem: o dado só troca para a face sorteada num esmaecimento curto. */
    .body {
      animation: swap 180ms ease-out;
    }
  }

  @keyframes swap {
    from {
      opacity: 0;
    }
  }
</style>
