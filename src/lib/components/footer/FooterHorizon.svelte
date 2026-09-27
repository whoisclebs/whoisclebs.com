<script lang="ts">
  import { onMount } from 'svelte'

  /**
   * Horizonte de células: a quadrícula do símbolo e do Mapa de Decisões fechando a página, com a
   * primeira luz nascendo a leste (à direita). Decorativo (`aria-hidden`). O SVG tem largura fixa e fica
   * ancorado à direita, então as células nunca escalam: em 390 px aparece só o trecho perto do sol.
   * Movimento: o sol sobe uma vez, linha a linha, quando o rodapé entra na viewport. Sem JS ou com
   * `prefers-reduced-motion`, o desenho já nasce no lugar.
   */
  const PITCH = 24
  const CELL = 16
  const WIDTH = 2400
  const SUN_COLUMN = 89 // 89 × 24 = 2136: o sol termina a 104 px da borda direita (cabe inteiro em 390 px)
  const SUN = [
    '...#...',
    '.#...#.',
    '..###..',
    '.#####.',
  ]
  /** Base do sol, pintada na própria linha do horizonte. */
  const BASE = '#######'
  const rows = SUN.map((line, row) => ({
    row,
    cells: [...line].flatMap((char, column) => (char === '#' ? [(SUN_COLUMN + column) * PITCH] : [])),
  }))
  const sunBase = new Set([...BASE].map((_, column) => (SUN_COLUMN + column) * PITCH))
  const GROUND = Array.from({ length: WIDTH / PITCH }, (_, column) => column * PITCH).filter((x) => !sunBase.has(x))
  const HORIZON_Y = SUN.length * PITCH
  const HEIGHT = HORIZON_Y + CELL

  let rise = $state<'none' | 'pending' | 'done'>('none')
  let root: HTMLElement

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    if (root.getBoundingClientRect().top < window.innerHeight) return
    rise = 'pending'
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          rise = 'done'
        }
      },
      { threshold: 0.6 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  })
</script>

<div class="horizon" bind:this={root} data-rise={rise} aria-hidden="true">
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} focusable="false" shape-rendering="crispEdges">
    <defs>
      <clipPath id="horizon-sky">
        <rect width={WIDTH} height={HORIZON_Y} />
      </clipPath>
    </defs>
    <!-- Células uma a uma (e não <pattern>): o Chrome rasteriza o padrão com bordas borradas. -->
    {#each GROUND as x (x)}
      <rect class="ground" {x} y={HORIZON_Y} width={CELL} height={CELL} />
    {/each}
    <g clip-path="url(#horizon-sky)">
      {#each rows as { row, cells } (row)}
        <g class="sun-row" style:--row={SUN.length - 1 - row}>
          {#each cells as x (x)}
            <rect {x} y={row * PITCH} width={CELL} height={CELL} />
          {/each}
        </g>
      {/each}
    </g>
    {#each [...sunBase] as x (x)}
      <rect class="sun-base" {x} y={HORIZON_Y} width={CELL} height={CELL} />
    {/each}
  </svg>
</div>

<style>
  .horizon {
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
    pointer-events: none;
  }

  svg {
    flex: none;
    max-width: none;
  }

  .ground {
    fill: var(--color-rule);
  }

  .sun-row rect,
  .sun-base {
    fill: var(--color-accent);
  }

  .sun-row {
    transition:
      transform var(--dur-scene) var(--ease-out),
      opacity var(--dur-scene) var(--ease-out);
    transition-delay: calc(var(--row) * 70ms);
  }

  .horizon[data-rise='pending'] .sun-row {
    transform: translateY(24px);
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .sun-row {
      transition: none;
    }
  }
</style>
