/**
 * Preferências do visitante que desligam o espetáculo dos aparelhos: `motion` (movimento reduzido) troca o giro
 * da tampa por um fade curto; `data` (economia de dados) não baixa o vídeo de boot. Qualquer um dos dois pula
 * o boot. Lido na hora do gesto, não no carregamento: a preferência pode mudar com a página aberta.
 */
export interface Quiet {
  motion: boolean
  data: boolean
}

export function readQuiet(): Quiet {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return {
    motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    data: Boolean(connection?.saveData),
  }
}

/** Vídeo de boot (≈ 2,3 s, sem áudio). WebM VP9 onde der; MP4 H.264 no resto (Safari antigo). */
export function bootVideoSrc(video: HTMLVideoElement): string {
  return video.canPlayType('video/webm; codecs="vp9"') ? '/media/boot-v1.webm' : '/media/boot-v1.mp4'
}
