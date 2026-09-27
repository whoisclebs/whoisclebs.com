<!--
  Luz rasante do hero (vídeo Higgsfield, Prompt A v2). Decorativa (`aria-hidden`) e nunca o LCP:
  - no HTML prerenderizado não há imagem nem vídeo, só a noite e um fio de luz em CSS (degradê não é
    candidato a LCP);
  - depois do `load`, num momento ocioso e só com o hero visível, entra o pôster (movimento reduzido ou
    `saveData`) ou o vídeo (`preload="none"`, `muted`, `playsinline`, `loop`, `aria-hidden`);
  - a imagem aparece num <canvas>, que não é candidato a LCP. Medido no Chrome: um <video> ou <img> de
    1280×720 que entra depois do load vira o LCP da página (921 600 px contra ~330 000 px do H1), mesmo
    com fade de opacidade ou escala. O <video> fica no DOM com 1 px, fora da vista, e cada quadro é
    copiado para o canvas (`requestVideoFrameCallback`, com `requestAnimationFrame` de reserva);
  - fora da tela o vídeo pausa e a cópia para; volta quando o hero reaparece.
  O véu escuro fica no próprio componente; o contraste do H1 e do apoio sobre o pôster (o quadro mais claro
  do loop) é medido no e2e (`tests/e2e/dawn.spec.ts`).
-->
<script lang="ts">
  import { onMount } from 'svelte'

  const POSTER = '/media/hero-light-v2-poster.webp'
  const WEBM = '/media/hero-light-v2.webm'
  const MP4 = '/media/hero-light-v2.mp4'
  const WIDTH = 1280
  const HEIGHT = 720

  type FrameVideo = HTMLVideoElement & { requestVideoFrameCallback?: (callback: () => void) => number; cancelVideoFrameCallback?: (handle: number) => void }

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

  function paintPoster() {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      draw(image)
      shown = true
    }
    image.src = POSTER
  }

  /** Copia o quadro atual e agenda o próximo, só enquanto o hero está visível e o vídeo toca. */
  function copyFrames() {
    const v = video
    if (!v || !visible || v.paused) return
    if (v.readyState >= 2) {
      draw(v)
      shown = true
    }
    if (v.requestVideoFrameCallback) frameHandle = v.requestVideoFrameCallback(copyFrames)
    else rafHandle = requestAnimationFrame(copyFrames)
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
      void v.play().then(copyFrames).catch(() => {})
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
            paintPoster()
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

  // O <video> só existe no modo vídeo; quando ele monta, começa a tocar se o hero estiver visível.
  $effect(() => {
    if (mode === 'video' && video) playIfVisible()
  })
</script>

<div class="light" bind:this={root} data-light={mode} data-shown={shown || undefined} aria-hidden="true">
  {#if mode !== 'none'}
    <canvas class="light__media" bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
  {/if}
  {#if mode === 'video'}
    <video class="light__source" bind:this={video} preload="none" muted playsinline loop aria-hidden="true" tabindex="-1" disablepictureinpicture>
      <source src={WEBM} type="video/webm" />
      <source src={MP4} type="video/mp4" />
    </video>
  {/if}
  <div class="light__veil"></div>
</div>

<style>
  .light {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    /* Sem mídia: um fio de luz em CSS no mesmo ângulo da faixa do vídeo (degradê não é candidato a LCP). */
    background:
      linear-gradient(162deg, rgb(232 166 82 / 0) 30%, rgb(232 166 82 / 0.13) 44%, rgb(232 166 82 / 0) 58%),
      var(--p-night);
  }

  .light__media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
    object-position: 60% 40%;
    opacity: 0;
    transition: opacity 900ms var(--ease-out);
  }

  .light[data-shown] .light__media {
    opacity: 0.62;
  }

  /* A fonte dos quadros: presente e tocando, mas com 1 px e fora da vista (não é candidata a LCP). */
  .light__source {
    position: absolute;
    inset: 0 auto auto 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  /*
   * Véu escuro na cor da noite: protege o H1 (embaixo à esquerda) e o apoio. No celular a luz fica no alto
   * e o texto ocupa quase toda a largura, então o véu sobe mais.
   */
  .light__veil {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgb(14 20 29 / 1) 0%, rgb(14 20 29 / 0) 18%),
      linear-gradient(to top, rgb(14 20 29 / 0.97) 0%, rgb(14 20 29 / 0.9) 45%, rgb(14 20 29 / 0.35) 72%, rgb(14 20 29 / 0) 88%),
      linear-gradient(to right, rgb(14 20 29 / 0.85) 0%, rgb(14 20 29 / 0.5) 40%, rgb(14 20 29 / 0) 70%);
  }

  @media (min-width: 960px) {
    .light__veil {
      background:
        linear-gradient(to bottom, rgb(14 20 29 / 1) 0%, rgb(14 20 29 / 0) 16%),
        linear-gradient(to top, rgb(14 20 29 / 0.96) 0%, rgb(14 20 29 / 0.7) 38%, rgb(14 20 29 / 0) 72%),
        linear-gradient(to right, rgb(14 20 29 / 0.9) 0%, rgb(14 20 29 / 0.72) 38%, rgb(14 20 29 / 0) 66%);
    }
  }
</style>
