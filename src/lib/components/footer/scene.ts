/**
 * Ilha da noite do farol (rodapé). Canvas 2D próprio, sem dependência, carregado por import dinâmico
 * só quando o rodapé se aproxima da viewport (`SiteFooter.svelte`). Desenha por cima da ilustração:
 * - o facho do farol girando a partir da lâmpada (dois fachos opostos; o que aponta para quem olha acende a
 *   lâmpada); a lâmpada é achada em coordenadas relativas da imagem e acompanha o `object-fit: cover` e o
 *   `object-position` calculados do <img>;
 * - estrelas piscando no céu (incluindo o céu estendido acima da imagem, onde fica o texto);
 * - vaga-lumes flutuando na grama.
 * Roda só com o rodapé visível e a aba à mostra (~30 quadros/s). Com movimento reduzido desenha um quadro só,
 * com um facho só, parado, apontando para a direita (longe do texto). Sem JS fica só a imagem.
 * O brilho máximo do facho é baixo (alfa ≤ 0,2): o texto no céu continua AA com o facho passando (e2e).
 */

/** Centro da lâmpada em `footer-night` (2560×1440), amostrado da imagem (pixel mais claro e amarelo do topo). */
export const LAMP = { x: 0.6656, y: 0.109 }
/** Faixa da grama, em frações da altura da imagem. */
const GRASS = { top: 0.8, bottom: 0.98 }
/** Céu livre: estrelas até esta fração da altura da imagem. */
const SKY_BOTTOM = 0.62
const IMAGE_RATIO = 2560 / 1440
const FRAME_MS = 1000 / 30
const BEAM_W = 256
const BEAM_H = 64
/** Um giro completo do facho. */
const TURN_MS = 14_000

type Star = { x: number; y: number; r: number; base: number; speed: number; phase: number; warm: boolean }
type Fly = { x: number; y: number; ax: number; ay: number; sx: number; sy: number; phase: number; blink: number }
type Box = { left: number; top: number; width: number; height: number }

/** PRNG pequeno e determinístico (a cena é a mesma a cada visita). */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Retângulo desenhado da imagem (cover + object-position), em coordenadas do contêiner. */
export function coverBox(frame: Box, position: [number, number]): Box {
  const scale = Math.max(frame.width / IMAGE_RATIO, frame.height)
  const width = scale * IMAGE_RATIO
  const height = scale
  return {
    left: frame.left + (frame.width - width) * position[0],
    top: frame.top + (frame.height - height) * position[1],
    width,
    height,
  }
}

function parsePosition(value: string): [number, number] {
  const parts = value.split(/\s+/).map((part) => (part.endsWith('%') ? Number.parseFloat(part) / 100 : 0.5))
  return [parts[0] ?? 0.5, parts[1] ?? 0.5]
}

export function startScene(root: HTMLElement, canvas: HTMLCanvasElement, image: HTMLImageElement): () => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}
  const ctx = context
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let width = 0
  let height = 0
  let picture: Box = { left: 0, top: 0, width: 0, height: 0 }
  let stars: Star[] = []
  let flies: Fly[] = []
  let raf = 0
  let last = 0
  let visible = false
  let running = false

  // Sprite de brilho (vaga-lume e lâmpada): um gradiente radial desenhado uma vez só.
  const glow = document.createElement('canvas')
  glow.width = glow.height = 64
  const g = glow.getContext('2d')
  if (g) {
    const radial = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    radial.addColorStop(0, 'rgba(255, 250, 200, 1)')
    radial.addColorStop(0.25, 'rgba(232, 240, 122, 0.55)')
    radial.addColorStop(1, 'rgba(232, 240, 122, 0)')
    g.fillStyle = radial
    g.fillRect(0, 0, 64, 64)
  }

  // Sprite do facho, desenhado uma vez: alfa cai ao longo do comprimento e em gaussiana na largura, então as
  // bordas se dissolvem no céu (nenhuma linha reta). Brilho máximo 0,2 perto da lâmpada.
  const beam = document.createElement('canvas')
  beam.width = BEAM_W
  beam.height = BEAM_H
  const b = beam.getContext('2d')
  if (b) {
    const pixels = b.createImageData(BEAM_W, BEAM_H)
    for (let x = 0; x < BEAM_W; x += 1) {
      const along = (1 - x / BEAM_W) ** 1.3
      const half = 3 + (x / BEAM_W) * (BEAM_H / 2 - 3)
      for (let y = 0; y < BEAM_H; y += 1) {
        const across = (y - BEAM_H / 2) / half
        const alpha = 0.2 * along * Math.exp(-across * across * 2.2)
        const i = (y * BEAM_W + x) * 4
        pixels.data[i] = 250
        pixels.data[i + 1] = 244
        pixels.data[i + 2] = 205
        pixels.data[i + 3] = Math.round(alpha * 255)
      }
    }
    b.putImageData(pixels, 0, 0)
  }

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const rootRect = root.getBoundingClientRect()
    width = rootRect.width
    height = rootRect.height
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const imageRect = image.getBoundingClientRect()
    picture = coverBox(
      { left: imageRect.left - rootRect.left, top: imageRect.top - rootRect.top, width: imageRect.width, height: imageRect.height },
      parsePosition(getComputedStyle(image).objectPosition),
    )

    // As estrelas desviam do texto: nenhum ponto claro atrás de uma linha (o contraste do texto no céu é medido).
    const text = [...root.querySelectorAll<HTMLElement>('h2, p, li, a, dt, dd, time')].flatMap((el) =>
      [...el.getClientRects()].map((r) => ({ left: r.left - rootRect.left - 8, right: r.right - rootRect.left + 8, top: r.top - rootRect.top - 8, bottom: r.bottom - rootRect.top + 8 })),
    )
    const clear = (x: number, y: number) => !text.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)

    const random = mulberry32(1987)
    const skyBottom = Math.min(height, picture.top + picture.height * SKY_BOTTOM)
    const count = Math.min(220, Math.round((width * skyBottom) / 7000))
    stars = Array.from({ length: count }, () => ({
      x: random() * width,
      y: random() * skyBottom,
      r: 0.35 + random() ** 3 * 1.1,
      base: 0.25 + random() * 0.6,
      speed: 0.6 + random() * 1.8,
      phase: random() * Math.PI * 2,
      warm: random() < 0.18,
    })).filter((star) => clear(star.x, star.y))

    const grassTop = picture.top + picture.height * GRASS.top
    const grassHeight = picture.height * (GRASS.bottom - GRASS.top)
    const flyCount = Math.max(6, Math.min(18, Math.round(width / 90)))
    flies = Array.from({ length: flyCount }, () => ({
      x: Math.max(0, picture.left) + random() * Math.min(width, picture.width),
      y: grassTop + random() * grassHeight,
      ax: 10 + random() * 26,
      ay: 5 + random() * 12,
      sx: 0.00018 + random() * 0.00025,
      sy: 0.00022 + random() * 0.0003,
      phase: random() * Math.PI * 2,
      blink: 0.0008 + random() * 0.0012,
    }))
  }

  function drawStars(time: number) {
    for (const star of stars) {
      const twinkle = reduce ? 1 : 0.55 + 0.45 * Math.sin(time * 0.001 * star.speed + star.phase)
      ctx.globalAlpha = star.base * twinkle
      ctx.fillStyle = star.warm ? '#fff1c9' : '#f2f5ff'
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function drawBeam(angle: number, single = false) {
    const lampX = picture.left + picture.width * LAMP.x
    const lampY = picture.top + picture.height * LAMP.y
    const reach = Math.max(width, 900) * 1.05
    ctx.globalCompositeOperation = 'lighter'
    // Dois fachos opostos. cos: componente na tela (esquerda/direita); sin > 0: aponta para quem olha.
    for (const offset of single ? [0] : [0, Math.PI]) {
      const a = angle + offset
      const along = Math.cos(a)
      const toward = Math.sin(a)
      const length = reach * Math.abs(along)
      if (length < 8) continue
      const direction = Math.sign(along)
      const spread = 18 + length * 0.09
      // O facho é um sprite de bordas suaves (sem aresta reta), esticado até o comprimento da vez.
      ctx.save()
      ctx.globalAlpha = 0.5 + 0.5 * Math.max(0, toward)
      ctx.translate(lampX, lampY)
      ctx.rotate(-0.06 * direction)
      ctx.scale((direction * length) / BEAM_W, spread / (BEAM_H / 2))
      ctx.drawImage(beam, 0, -BEAM_H / 2)
      ctx.restore()
    }
    // A lâmpada acende quando um dos fachos passa de frente.
    const flash = Math.max(0, Math.abs(Math.sin(angle))) ** 6
    const size = picture.height * (0.05 + 0.06 * flash)
    ctx.globalAlpha = 0.5 + 0.45 * flash
    ctx.drawImage(glow, lampX - size, lampY - size, size * 2, size * 2)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  function drawFlies(time: number) {
    ctx.globalCompositeOperation = 'lighter'
    for (const fly of flies) {
      const x = fly.x + (reduce ? 0 : Math.sin(time * fly.sx + fly.phase) * fly.ax)
      const y = fly.y + (reduce ? 0 : Math.cos(time * fly.sy + fly.phase * 1.3) * fly.ay)
      const pulse = reduce ? 0.7 : Math.max(0, Math.sin(time * fly.blink + fly.phase)) ** 2
      if (pulse < 0.02) continue
      const size = 7 + 5 * pulse
      ctx.globalAlpha = 0.2 + 0.8 * pulse
      ctx.drawImage(glow, x - size, y - size, size * 2, size * 2)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  function draw(time: number) {
    ctx.clearRect(0, 0, width, height)
    drawStars(time)
    // Parado (movimento reduzido): um facho só, apontando para a direita, longe do texto.
    if (reduce) drawBeam(0.2, true)
    else drawBeam(((time % TURN_MS) / TURN_MS) * Math.PI * 2)
    drawFlies(time)
  }

  function frame(time: number) {
    if (!running) return
    raf = requestAnimationFrame(frame)
    if (time - last < FRAME_MS) return
    last = time
    draw(time)
  }

  function update() {
    const shouldRun = !reduce && visible && document.visibilityState === 'visible'
    if (shouldRun && !running) {
      running = true
      raf = requestAnimationFrame(frame)
    } else if (!shouldRun && running) {
      running = false
      cancelAnimationFrame(raf)
    }
    root.dataset.scene = reduce ? 'static' : running ? 'running' : 'paused'
  }

  layout()
  draw(0)

  // Só refaz o layout quando o contêiner muda de tamanho (o canvas é absoluto e não mexe no fluxo).
  const resize = new ResizeObserver(() => {
    const rect = root.getBoundingClientRect()
    if (Math.abs(rect.width - width) < 1 && Math.abs(rect.height - height) < 1) return
    layout()
    draw(performance.now())
  })
  resize.observe(root)
  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting)
    update()
  })
  observer.observe(root)
  document.addEventListener('visibilitychange', update)
  update()

  return () => {
    running = false
    cancelAnimationFrame(raf)
    resize.disconnect()
    observer.disconnect()
    document.removeEventListener('visibilitychange', update)
    delete root.dataset.scene
  }
}
