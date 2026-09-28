/**
 * Ilha da 404 (passo 17): o ciclo do Farol do Cabo Branco em loop lento (~48 s, `scripts/build-cycle-video.mjs`).
 * Carregada por import dinâmico na página de erro, só sem movimento reduzido e sem `saveData` (senão fica o
 * pôster da noite). Cria o <video> (`muted`, `playsinline`, `loop`, `aria-hidden`, sem controles), mostra-o
 * quando começa a tocar e marca o céu da hora no contêiner (`data-sky`, informativo: o texto já é legível em
 * qualquer hora, com contorno, etiqueta sólida e botões sólidos). Pausa com a aba oculta.
 */

export type Sky = 'night' | 'dawn' | 'day' | 'dusk'

/**
 * Fases do vídeo em segundos, medidas quadro a quadro na região do texto (luminância do céu no alto à
 * esquerda): noite até 3,5 s, amanhecer claro até 15 s, dia até 26,5 s, entardecer até 30 s, noite até o fim.
 */
export const PHASES: readonly (readonly [number, Sky])[] = [
  [0, 'night'],
  [3.5, 'dawn'],
  [15, 'day'],
  [26.5, 'dusk'],
  [30, 'night'],
]

export function skyAt(seconds: number): Sky {
  let sky: Sky = 'night'
  for (const [start, name] of PHASES) if (seconds >= start) sky = name
  return sky
}

export function startCycle(root: HTMLElement, sources: { webm: string; mp4: string }): () => void {
  const video = document.createElement('video')
  video.className = 'nf__video'
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('loop', '')
  video.setAttribute('aria-hidden', 'true')
  video.setAttribute('tabindex', '-1')
  video.setAttribute('disablepictureinpicture', '')
  for (const [src, type] of [
    [sources.webm, 'video/webm; codecs="av01.0.05M.08"'],
    [sources.mp4, 'video/mp4'],
  ] as const) {
    const source = document.createElement('source')
    source.src = src
    source.type = type
    video.append(source)
  }

  const onTime = () => {
    root.dataset.sky = skyAt(video.currentTime)
  }
  const onPlaying = () => {
    root.dataset.video = 'playing'
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') video.pause()
    else void video.play().catch(() => {})
  }

  video.addEventListener('timeupdate', onTime)
  video.addEventListener('seeked', onTime)
  video.addEventListener('playing', onPlaying, { once: true })
  document.addEventListener('visibilitychange', onVisibility)
  root.querySelector('.nf__media')?.append(video)
  void video.play().catch(() => {})

  return () => {
    video.removeEventListener('timeupdate', onTime)
    video.removeEventListener('seeked', onTime)
    document.removeEventListener('visibilitychange', onVisibility)
    video.pause()
    video.remove()
    delete root.dataset.video
    root.dataset.sky = 'night'
  }
}
