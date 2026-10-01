<!--
  Cena do hero da home: a chuva na janela com o laptop (padrão, `scripts/build-hero-rain.mjs`) ou o cometa do
  desenho anterior (`scripts/build-hero-comet.mjs`), trocada pelo easter egg (`eggs.heroScene`). Generaliza o
  antigo HeroComet sem mudar a técnica. Decorativa (`aria-hidden`) e nunca o LCP:
  - no HTML prerenderizado não há imagem nem vídeo, só o fundo em CSS (degradê não é candidato a LCP);
  - depois do `load`, num momento ocioso e só com o hero visível, entra o pôster (movimento reduzido ou
    `saveData`) ou o vídeo (`preload="none"`, `muted`, `playsinline`, `loop`, `aria-hidden`);
  - a imagem aparece num <canvas>, que não é candidato a LCP. Medido no Chrome: um <video> ou <img> de
    1280×720 que entra depois do load vira o LCP da página, mesmo com fade de opacidade ou escala. O <video>
    fica no DOM com 1 px, fora da vista, e cada quadro é copiado para o canvas (`requestVideoFrameCallback`,
    com `requestAnimationFrame` de reserva);
  - fora da tela o vídeo pausa e a cópia para; volta quando o hero reaparece.
  Trocar a cena em tempo de execução troca o pôster e o vídeo sem recarregar a página.

  Palco: o canvas não usa `object-fit`; ele ocupa um "palco" com a geometria exata do `cover` 16:9 (largura
  `max(100cqw, 100cqh·16/9)`, ancorado no `object-position` da cena). Assim o que for posto no palco em
  porcentagens do quadro (o laptop clicável, via `stage`) acompanha o vídeo em qualquer proporção de tela.
-->
<script lang="ts" module>
  import type { HeroScene } from '$lib/eggs/state.svelte'

  type SceneMedia = { poster: string; webm: string; mp4: string }

  const MEDIA: Record<HeroScene, SceneMedia> = {
    rain: { poster: '/media/hero-rain-v1-poster.webp', webm: '/media/hero-rain-v1.webm', mp4: '/media/hero-rain-v1.mp4' },
    comet: { poster: '/media/hero-comet-v1-poster.webp', webm: '/media/hero-comet-v1.webm', mp4: '/media/hero-comet-v1.mp4' },
  }

  /** Fios da chuva em CSS (do design): posição, comprimento, opacidade e ritmo determinísticos; um em três é rosa. */
  const DROPS = Array.from({ length: 48 }, (_, i) => ({
    left: (i * 37) % 100,
    height: 30 + ((i * 13) % 40),
    alpha: 0.25 + (i % 4) * 0.1,
    duration: 1.4 + ((i * 7) % 10) / 7,
    delay: -((i * 11) % 20) / 10,
    hot: i % 3 === 0,
  }))
</script>

<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte'

  let { scene, stage }: { scene: HeroScene; stage?: Snippet } = $props()

  const WIDTH = 1280
  const HEIGHT = 720

  type FrameVideo = HTMLVideoElement & { requestVideoFrameCallback?: (callback: () => void) => number; cancelVideoFrameCallback?: (handle: number) => void }

  const media = $derived(MEDIA[scene])
  let mode = $state<'none' | 'poster' | 'video'>('none')
  let shown = $state(false)
  let root: HTMLElement
  let canvas = $state<HTMLCanvasElement>()
  let video = $state<FrameVideo>()
  let visible = false
  let frameHandle = 0
  let rafHandle = 0

  function afterLoad(): Promise<void> {
    if (document.readyState === 'complete') return Promise.resolve()
    return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
  }

  function idle(): Promise<void> {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout: 1500 })
      else setTimeout(resolve, 300)
    })
  }

  function draw(source: CanvasImageSource) {
    canvas?.getContext('2d')?.drawImage(source, 0, 0, WIDTH, HEIGHT)
  }

  /** Pinta o pôster da cena. Se a cena mudar antes de a imagem chegar, o pôster velho é descartado. */
  function paintPoster(src: string) {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      if (src !== media.poster) return
      draw(image)
      shown = true
    }
    image.src = src
  }

  /** Copia o quadro atual e agenda o próximo, só enquanto o hero está visível e este vídeo toca. */
  function copyFrames(v: FrameVideo) {
    // Depois de uma troca de cena, o laço do vídeo antigo termina aqui (o novo tem o próprio laço).
    if (v !== video || !visible || v.paused) return
    if (v.readyState >= 2) {
      draw(v)
      shown = true
    }
    if (v.requestVideoFrameCallback) frameHandle = v.requestVideoFrameCallback(() => copyFrames(v))
    else rafHandle = requestAnimationFrame(() => copyFrames(v))
  }

  function stopCopy() {
    if (frameHandle && video?.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameHandle)
    cancelAnimationFrame(rafHandle)
    frameHandle = 0
    rafHandle = 0
  }

  function playIfVisible() {
    const v = video
    if (!v) return
    if (visible) {
      v.muted = true
      void v
        .play()
        .then(() => copyFrames(v))
        .catch(() => {})
    } else {
      stopCopy()
      v.pause()
    }
  }

  onMount(() => {
    let cancelled = false
    let observer: IntersectionObserver | undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

    void (async () => {
      await afterLoad()
      await idle()
      if (cancelled || !('IntersectionObserver' in window)) return
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting)
          if (visible && mode === 'none') {
            mode = reduce || saveData ? 'poster' : 'video'
            paintPoster(media.poster)
          }
          playIfVisible()
        },
        { threshold: 0.15 },
      )
      observer.observe(root)
    })()

    return () => {
      cancelled = true
      observer?.disconnect()
      stopCopy()
    }
  })

  // Troca de cena com a mídia já carregada: o pôster novo cobre o quadro na hora; o <video> é recriado pelo
  // {#key} abaixo e o efeito seguinte o põe para tocar.
  $effect(() => {
    const poster = media.poster
    untrack(() => {
      if (mode === 'none') return
      stopCopy()
      paintPoster(poster)
    })
  })

  // O <video> só existe no modo vídeo; quando ele monta (ou é recriado), começa a tocar se o hero estiver visível.
  $effect(() => {
    if (mode === 'video' && video) untrack(playIfVisible)
  })
</script>

<div class="scene" bind:this={root} data-scene={scene} data-mode={mode} data-shown={shown || undefined}>
  <div class="scene__media" aria-hidden="true">
    <div class="scene__stage">
      {#if mode !== 'none'}
        <canvas class="scene__canvas" bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
      {/if}
    </div>
    {#if mode === 'video'}
      {#key scene}
        <video class="scene__source" bind:this={video} preload="none" muted playsinline loop aria-hidden="true" tabindex="-1" disablepictureinpicture>
          <source src={media.webm} type="video/webm" />
          <source src={media.mp4} type="video/mp4" />
        </video>
      {/key}
    {/if}
    <div class="scene__veil"></div>
    {#if scene === 'rain'}
      <div class="scene__rain">
        {#each DROPS as drop, i (i)}
          <span
            class:hot={drop.hot}
            style:left="{drop.left}%"
            style:height="{drop.height}px"
            style:--alpha={drop.alpha}
            style:animation-duration="{drop.duration}s"
            style:animation-delay="{drop.delay}s"
          ></span>
        {/each}
      </div>
    {/if}
  </div>
  {#if stage}
    <!-- Fora do aria-hidden: o que vier aqui (o laptop) é interativo. -->
    <div class="scene__stage scene__stage--interactive">{@render stage()}</div>
  {/if}
</div>

<style>
  .scene {
    /* Enquadramento do vídeo (o `object-position` de um `cover`); cada cena define o seu. */
    --scene-x: 0.72;
    --scene-y: 0.5;
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    /* `cq*` nos filhos medem a área do hero: o palco calcula o `cover` sem JS. */
    container-type: size;
    background: var(--color-band);
  }

  .scene[data-scene='comet'] {
    --scene-x: 0.7;
    --scene-y: 0.4;
    /* Sem mídia: o céu do vídeo em degradê CSS (as mesmas cores, medidas). */
    background: linear-gradient(to bottom, #070c18 0%, #0a1a2d 45%, #102c57 100%);
  }

  /* Celular: o cometa cruza a metade direita do quadro, que é a parte que sobra num quadro cortado. */
  @media (max-width: 959px) {
    .scene[data-scene='comet'] {
      --scene-x: 0.82;
      --scene-y: 0.3;
    }
  }

  .scene__media {
    position: absolute;
    inset: 0;
  }

  /* A geometria do `object-fit: cover` de um quadro 16:9, ancorada em (--scene-x, --scene-y). */
  .scene__stage {
    --stage-w: max(100cqw, 100cqh * 16 / 9);
    --stage-h: max(100cqh, 100cqw * 9 / 16);
    position: absolute;
    left: calc((100cqw - var(--stage-w)) * var(--scene-x));
    top: calc((100cqh - var(--stage-h)) * var(--scene-y));
    width: var(--stage-w);
    height: var(--stage-h);
  }

  .scene__stage--interactive {
    z-index: 1;
  }

  .scene__canvas {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    opacity: 0;
    transition: opacity 900ms var(--ease-out);
  }

  .scene[data-shown] .scene__canvas {
    opacity: 1;
  }

  /* A fonte dos quadros: presente e tocando, mas com 1 px e fora da vista (não é candidata a LCP). */
  .scene__source {
    position: absolute;
    inset: 0 auto auto 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  /*
   * Véu do design: à esquerda protege o título (grafite fundo a 92 % → 0 aos 80 %); em cima, um toque de grafite
   * sob o cabeçalho; embaixo, desce até a cor da página, sem corte para a seção seguinte.
   */
  .scene__veil {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-bg) 35%, transparent) 0%,
        color-mix(in srgb, var(--color-bg) 0%, transparent) 25%,
        color-mix(in srgb, var(--color-bg) 0%, transparent) 65%,
        var(--color-bg) 100%
      ),
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-band) 92%, transparent) 0%,
        color-mix(in srgb, var(--color-band) 78%, transparent) 32%,
        color-mix(in srgb, var(--color-band) 25%, transparent) 58%,
        color-mix(in srgb, var(--color-band) 0%, transparent) 80%
      );
  }

  /* Celular e tablet (desvio do design, por contraste): abaixo de 1280 px o texto passa da metade do quadro e o
     degradê horizontal do desktop deixa título e apoio sobre as luzes da cidade (medido no pôster, p99 dos
     pixels atrás das linhas: 1,1:1 em 640 px, 2,3:1 em 1024 px). Uma camada a mais escurece o quadro inteiro, sem
     apagar a chuva; com ela o pior caso fica acima de 5:1 (e2e `home.spec.ts`). */
  @media (max-width: 1279px) {
    .scene[data-scene='rain'] .scene__veil {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--color-bg) 35%, transparent) 0%,
          color-mix(in srgb, var(--color-bg) 0%, transparent) 25%,
          color-mix(in srgb, var(--color-bg) 0%, transparent) 65%,
          var(--color-bg) 100%
        ),
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--color-band) 90%, transparent) 0%,
          color-mix(in srgb, var(--color-band) 82%, transparent) 60%,
          color-mix(in srgb, var(--color-band) 72%, transparent) 100%
        );
    }
  }

  /* O cometa: o véu que já protegia o título nele, nas cores da paleta nova. */
  .scene[data-scene='comet'] .scene__veil {
    background:
      linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 0%, transparent) 72%, var(--color-bg) 100%),
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--color-band) 20%, transparent) 0%,
        color-mix(in srgb, var(--color-band) 72%, transparent) 42%,
        color-mix(in srgb, var(--color-band) 50%, transparent) 80%
      );
  }

  /* Véu lateral só a partir de 1280 px: entre 960 e 1279 px a cabeça do cometa passa atrás do fim do título
     (1,8:1 em 1024 × 768); ali vale o véu vertical acima. */
  @media (min-width: 1280px) {
    .scene[data-scene='comet'] .scene__veil {
      background:
        linear-gradient(to bottom, color-mix(in srgb, var(--color-bg) 0%, transparent) 72%, var(--color-bg) 100%),
        linear-gradient(
          to right,
          color-mix(in srgb, var(--color-band) 72%, transparent) 0%,
          color-mix(in srgb, var(--color-band) 45%, transparent) 38%,
          color-mix(in srgb, var(--color-band) 0%, transparent) 62%
        );
    }
  }

  /* Chuva em CSS sobre a janela (do design): 48 fios de 1 px no alto à direita, sumindo para baixo. */
  .scene__rain {
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    left: 40%;
    height: 38%;
    overflow: hidden;
    mask-image: linear-gradient(180deg, #000 55%, transparent);
  }

  .scene__rain span {
    /* O tom claro da chuva (azul-gelo) não tem token: é a cor das gotas no vidro do vídeo. */
    --drop: rgb(180 235 245);
    position: absolute;
    top: 0;
    width: 1px;
    background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--drop) calc(var(--alpha) * 100%), transparent));
    animation-name: rain;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  .scene__rain span.hot {
    --drop: var(--color-hot);
  }

  @media (prefers-reduced-motion: no-preference) {
    .scene__rain {
      display: block;
    }
  }

  @keyframes rain {
    from {
      transform: translateY(-120px);
    }

    to {
      transform: translateY(110vh);
    }
  }
</style>
