<!--
  Um d20 desenhado em SVG a partir da projeção de `d20.ts`: só as faces visíveis, das fundas para as próximas,
  cada uma com o tom da luz que recebe e o número no plano dela. Serve ao espaço reservado da página (parado, sem
  JS) e à ilha interativa (redesenhado a cada quadro). Puramente visual: quem usa decide o nome acessível.
-->
<script lang="ts">
  import { project, type Quat } from './d20'

  let { q, radius, label }: { q: Quat; radius: number; label?: string } = $props()

  // Margem para os vértices que a perspectiva empurra para fora do círculo.
  const size = $derived(Math.ceil(radius * 2.3))
  const faces = $derived(project(q, radius))
  const font = $derived(Math.round(radius * 0.3))

  // Números quase de perfil viram ruído: somem aos poucos conforme a face vira.
  const ink = (facing: number) => Math.min(1, Math.max(0, (facing - 0.18) / 0.4)).toFixed(3)
  const tone = (light: number) => `${Math.round(12 + light ** 1.15 * 88)}%`
</script>

<svg
  class="die"
  width={size}
  height={size}
  viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {#each faces as face (face.number)}
    <polygon class="face" points={face.points.map((p) => p.join(',')).join(' ')} style:--l={tone(face.light)} />
  {/each}
  {#each faces as face (face.number)}
    <text
      class="num"
      class:num--crit={face.number === 20}
      class:num--fumble={face.number === 1}
      class:num--mark={face.number === 6 || face.number === 9}
      transform={`matrix(${face.text.map((v) => v.toFixed(4)).join(' ')})`}
      font-size={font}
      opacity={ink(face.facing)}
      dy={font * 0.06}
    >{face.number}</text>
  {/each}
</svg>

<style>
  /*
   * Plástico grafite: o tom de cada face vai do escuro da carcaça (sombra) a um cinza de tecla levemente aquecido
   * pelo creme (luz). Cores de objeto, fora da paleta da interface, como o console de bolso.
   */
  .die {
    --die-dark: var(--p-shell-dark);
    --die-lit: color-mix(in oklab, var(--p-shell-key) 84%, var(--p-cream));
    display: block;
    overflow: visible;
  }

  .face {
    fill: color-mix(in oklab, var(--die-lit) var(--l), var(--die-dark));
    stroke: color-mix(in oklab, var(--die-lit) var(--l), var(--p-cream) 10%);
    stroke-width: 1;
    stroke-linejoin: round;
  }

  .num {
    fill: var(--color-text);
    font-family: var(--font-mono);
    font-weight: 600;
    text-anchor: middle;
    dominant-baseline: central;
  }

  .num--crit {
    fill: var(--p-cyan);
  }

  .num--fumble {
    fill: var(--p-pink);
  }

  /* 6 e 9 sublinhados, como nos dados de verdade, para não confundir de cabeça para baixo. */
  .num--mark {
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.12em;
  }
</style>
