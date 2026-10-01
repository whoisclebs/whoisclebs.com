<!--
  Boot dos aparelhos: o vídeo abstrato (ponto ciano → linha → brilho → escuro) toca uma vez e, por cima, entram
  as linhas com o que o catálogo carregou de verdade. Termina quando o vídeo acaba e as linhas já apareceram;
  se o vídeo falhar (404, formato, autoplay negado) ou demorar, segue só com as linhas. Sem `video` (movimento
  reduzido ou economia de dados nunca chegam aqui, mas o caminho existe) as linhas entram logo.
  O <video> só ganha `src` na montagem: nada é baixado antes do primeiro gesto de abrir.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import type { BootLine } from './model'
  import { bootVideoSrc } from './quiet'

  let { lines, video = true, compact = false, ondone }: { lines: BootLine[]; video?: boolean; compact?: boolean; ondone: () => void } = $props()

  /** As linhas entram quando a linha de luz do vídeo abre (≈ 1 s). */
  const LINES_AT_MS = 1000
  const LINES_NO_VIDEO_MS = 120
  const STAGGER_MS = 150
  /** Tempo máximo esperando o vídeo (ele tem 2,3 s): conexão lenta não prende o boot. */
  const VIDEO_CAP_MS = 3600
  /** Pausa curta com tudo na tela antes de entregar a vez. */
  const HOLD_MS = 450

  let element = $state<HTMLVideoElement>()
  let failed = $state(false)
  const linesAt = $derived(video ? LINES_AT_MS : LINES_NO_VIDEO_MS)

  onMount(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let videoDone = !video
    let linesDone = false
    let finished = false
    const finish = () => {
      if (finished || !videoDone || !linesDone) return
      finished = true
      timers.push(setTimeout(ondone, HOLD_MS))
    }
    timers.push(
      setTimeout(
        () => {
          linesDone = true
          finish()
        },
        linesAt + lines.length * STAGGER_MS + 220,
      ),
    )
    const v = element
    if (!v) return () => timers.forEach(clearTimeout)
    const end = () => {
      videoDone = true
      finish()
    }
    const fail = () => {
      failed = true
      end()
    }
    v.addEventListener('ended', end)
    v.addEventListener('error', fail)
    v.src = bootVideoSrc(v)
    v.play().catch(fail)
    timers.push(setTimeout(end, VIDEO_CAP_MS))
    return () => {
      timers.forEach(clearTimeout)
      v.removeEventListener('ended', end)
      v.removeEventListener('error', fail)
      v.removeAttribute('src')
      v.load()
    }
  })
</script>

<div class="boot" class:boot--compact={compact} style:--lines-at="{linesAt}ms" style:--stagger="{STAGGER_MS}ms">
  {#if video}
    <video
      class="boot__video"
      class:boot__video--gone={failed}
      bind:this={element}
      preload="none"
      muted
      playsinline
      disablepictureinpicture
      aria-hidden="true"
      tabindex="-1"
    ></video>
  {/if}
  <dl class="boot__lines">
    {#each lines as line, index (line.label)}
      <div class="boot__line" style:--i={index}>
        <dt>{line.label}</dt>
        <dd>{line.value}</dd>
      </div>
    {/each}
  </dl>
</div>

<style>
  .boot {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #030407;
    font-family: var(--font-mono);
  }

  .boot__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .boot__video--gone {
    display: none;
  }

  /* Bloco no terço de baixo: o brilho do vídeo fica no centro e as linhas não brigam com ele. */
  .boot__lines {
    position: absolute;
    left: 50%;
    bottom: 16%;
    display: grid;
    gap: 6px;
    width: min(280px, 72%);
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    transform: translateX(-50%);
  }

  .boot--compact .boot__lines {
    bottom: 22%;
    width: min(220px, 76%);
    font-size: 12px;
  }

  .boot__line {
    display: flex;
    align-items: baseline;
    gap: 1ch;
    opacity: 0;
    animation: line-in 240ms var(--ease-out) forwards;
    animation-delay: calc(var(--lines-at) + var(--i) * var(--stagger));
  }

  /* Pontilhado entre rótulo e valor, como numa listagem de boot. */
  .boot__line::after {
    order: 1;
    flex: 1;
    min-width: 2ch;
    border-bottom: 1px dotted rgb(239 233 224 / 0.22);
    transform: translateY(-4px);
    content: '';
  }

  dt {
    order: 0;
    color: var(--color-text-soft);
  }

  dd {
    order: 2;
    margin: 0;
    color: var(--color-accent);
    font-variant-numeric: tabular-nums;
  }

  @keyframes line-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .boot__line {
      animation: none;
      opacity: 1;
    }
  }
</style>
