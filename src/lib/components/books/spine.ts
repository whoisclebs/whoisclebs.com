/**
 * Cálculos puros da estante: medidas e cor de cada lombada e a ordem das lombadas na prateleira.
 * Tudo sai de um hash do título (ou de uma semente), nunca de `Math.random()`: a estante é a mesma
 * em toda carga, no HTML prerenderizado e depois da hidratação.
 */

/** Proporção (largura / altura) do livro aberto, a mesma do CSS do <dialog>. */
export const BOOK_RATIO = 0.68

/** Hash FNV-1a de 32 bits: estável, rápido e bem espalhado para textos curtos. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Valor em [min, max] escolhido pelo hash; `salt` separa as medidas para não andarem juntas. */
function pick(hash: number, salt: number, min: number, max: number): number {
  const mixed = Math.imul(hash ^ salt, 0x9e3779b1) >>> 0
  return min + (mixed % (max - min + 1))
}

/** Cores de lombada para quem não tem `spine` no conteúdo: tecidos e papéis foscos, nada saturado. */
export const SPINE_PALETTE = ['#6b2f2c', '#2f4a3c', '#26354f', '#a3803f', '#4b5560', '#d9cfbb', '#2d5b60', '#83492f', '#3d3446', '#5d6249'] as const

export interface SpineShape {
  /** Altura em px na prateleira. */
  height: number
  /** Espessura (largura da lombada) em px na prateleira. */
  width: number
  /** Cor de fundo da lombada (#rrggbb). */
  color: string
  /** Cor do texto e dos filetes, escolhida pelo contraste com `color`. */
  ink: string
}

/** Menor espessura de um livro real: a lombada é o alvo de toque, então não fica abaixo de 44 px. */
export const MIN_BOOK_WIDTH = 44

/** Medidas e cor de um livro real. Com `pages`, a espessura acompanha o número de páginas. */
export function spineShape(book: { title: string; pages?: number | undefined; spine?: string | undefined }): SpineShape {
  const hash = hashString(book.title)
  const width = book.pages ? Math.round(Math.min(64, Math.max(MIN_BOOK_WIDTH, 24 + book.pages / 14))) : pick(hash, 0x51, MIN_BOOK_WIDTH, 54)
  const color = book.spine ?? SPINE_PALETTE[hash % SPINE_PALETTE.length] ?? '#4b5560'
  return { height: pick(hash, 0xa7, 212, 244), width, color, ink: inkFor(color) }
}

/** Luminância relativa (WCAG) de uma cor #rrggbb. */
export function luminance(hex: string): number {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  const channel = (shift: number) => {
    const c = ((value >> shift) & 0xff) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
}

export const SPINE_INK_DARK = '#1d1d20'
export const SPINE_INK_LIGHT = '#f1ebe1'

/** Tinta da lombada: a que der mais contraste sobre o fundo. */
export function inkFor(hex: string): string {
  const bg = luminance(hex)
  const contrast = (fg: string) => {
    const l = luminance(fg)
    return (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05)
  }
  return contrast(SPINE_INK_DARK) >= contrast(SPINE_INK_LIGHT) ? SPINE_INK_DARK : SPINE_INK_LIGHT
}

/** Título curto para a lombada: o que vem antes do subtítulo (": ..."). */
export function shortTitle(title: string): string {
  const [head] = title.split(':')
  return (head ?? title).trim() || title
}

/** Lombada decorativa: sem texto; varia em medida, cor e nos filetes impressos. */
export interface FillerShape extends SpineShape {
  /** Faixas horizontais impressas: posição (% da altura) e espessura em px. */
  bands: { at: number; size: number }[]
  /** Bloco liso perto do pé, como o selo de uma editora (sem texto). */
  plate: boolean
}

export function fillerShape(seed: number): FillerShape {
  const hash = hashString(`estante-${seed}`)
  const color = SPINE_PALETTE[(hash >>> 3) % SPINE_PALETTE.length] ?? '#4b5560'
  const style = hash % 4
  const bands =
    style === 0
      ? [{ at: 10, size: 2 }, { at: 13, size: 1 }, { at: 86, size: 1 }, { at: 89, size: 2 }]
      : style === 1
        ? [{ at: 18, size: 10 }]
        : style === 2
          ? [{ at: 8, size: 1 }, { at: 92, size: 1 }]
          : []
  return {
    height: pick(hash, 0x3c, 188, 240),
    width: pick(hash, 0x77, 22, 44),
    color,
    ink: inkFor(color),
    bands,
    plate: style !== 1 && (hash & 0x20) !== 0,
  }
}

export type ShelfSlot = { kind: 'book'; index: number } | { kind: 'filler'; seed: number; wideOnly: boolean }

/**
 * Ordem das lombadas na prateleira. Os livros reais ficam espalhados entre as decorativas; as
 * decorativas completam até `target` e somem conforme entram livros reais (com `target` ou mais
 * livros, não sobra nenhuma). As das pontas são `wideOnly`: no celular sobram só `narrowTarget`.
 */
export function shelfLayout(realCount: number, target = 14, narrowTarget = 8): ShelfSlot[] {
  const total = Math.max(target, realCount)
  const fillers = total - realCount
  if (fillers === 0) return Array.from({ length: realCount }, (_, index) => ({ kind: 'book', index }))

  // Posições dos reais: centros de faixas iguais da prateleira, de modo que fiquem dentro da parte
  // que continua visível no celular quando há poucos livros.
  const spread = Math.min(total, Math.max(narrowTarget, realCount))
  const offset = Math.floor((total - spread) / 2)
  const bookAt = new Map<number, number>()
  for (let i = 0; i < realCount; i++) bookAt.set(offset + Math.floor(((i + 0.5) * spread) / realCount), i)

  const slots: ShelfSlot[] = []
  for (let position = 0; position < total; position++) {
    const index = bookAt.get(position)
    slots.push(index === undefined ? { kind: 'filler', seed: position, wideOnly: false } : { kind: 'book', index })
  }

  // No celular, esconde decorativas a partir das pontas até sobrarem `narrowTarget` lombadas.
  let toHide = Math.max(0, total - Math.max(narrowTarget, realCount))
  for (let step = 0; toHide > 0 && step < total; step++) {
    const position = step % 2 === 0 ? step / 2 : total - 1 - (step - 1) / 2
    const slot = slots[position]
    if (slot?.kind === 'filler') {
      slot.wideOnly = true
      toHide--
    }
  }
  return slots
}
