import { describe, expect, it } from 'vitest'
import { fillerShape, hashString, inkFor, shelfLayout, shortTitle, SPINE_INK_DARK, SPINE_INK_LIGHT, spineShape } from './spine'

describe('spineShape', () => {
  it('é determinística: o mesmo título dá a mesma lombada', () => {
    const a = spineShape({ title: 'Código Limpo' })
    const b = spineShape({ title: 'Código Limpo' })
    expect(a).toEqual(b)
    expect(hashString('Código Limpo')).toBe(hashString('Código Limpo'))
  })

  it('varia entre títulos e fica dentro das faixas da prateleira', () => {
    const shapes = ['A', 'B', 'Código Limpo', 'Roube como um artista', 'Refactoring'].map((title) => spineShape({ title }))
    for (const shape of shapes) {
      expect(shape.height).toBeGreaterThanOrEqual(212)
      expect(shape.height).toBeLessThanOrEqual(244)
      expect(shape.width).toBeGreaterThanOrEqual(44)
      expect(shape.width).toBeLessThanOrEqual(64)
    }
    expect(new Set(shapes.map((shape) => `${shape.height}x${shape.width}`)).size).toBeGreaterThan(1)
  })

  it('usa a cor do conteúdo e escolhe a tinta pelo contraste', () => {
    expect(spineShape({ title: 'X', spine: '#141414' })).toMatchObject({ color: '#141414', ink: SPINE_INK_LIGHT })
    expect(spineShape({ title: 'X', spine: '#f2f0eb' })).toMatchObject({ color: '#f2f0eb', ink: SPINE_INK_DARK })
  })

  it('com páginas, a espessura cresce com o livro', () => {
    const thin = spineShape({ title: 'X', pages: 300 })
    const thick = spineShape({ title: 'X', pages: 600 })
    expect(thick.width).toBeGreaterThan(thin.width)
    expect(spineShape({ title: 'X', pages: 5000 }).width).toBe(64)
  })
})

describe('inkFor', () => {
  it('tinta escura em fundo claro e clara em fundo escuro', () => {
    expect(inkFor('#ffffff')).toBe(SPINE_INK_DARK)
    expect(inkFor('#000000')).toBe(SPINE_INK_LIGHT)
  })
})

describe('shortTitle', () => {
  it('corta o subtítulo', () => {
    expect(shortTitle('Código Limpo: Habilidades Práticas do Agile Software')).toBe('Código Limpo')
    expect(shortTitle('Sem subtítulo')).toBe('Sem subtítulo')
  })
})

describe('fillerShape', () => {
  it('é determinística e não traz texto', () => {
    expect(fillerShape(3)).toEqual(fillerShape(3))
    expect(Object.keys(fillerShape(3))).not.toContain('title')
  })
})

describe('shelfLayout', () => {
  const books = (slots: ReturnType<typeof shelfLayout>) => slots.filter((slot) => slot.kind === 'book').map((slot) => (slot.kind === 'book' ? slot.index : -1))

  it('completa a prateleira com decorativas até o total-alvo', () => {
    const slots = shelfLayout(2, 14, 8)
    expect(slots).toHaveLength(14)
    expect(books(slots)).toEqual([0, 1])
  })

  it('no celular sobram narrowTarget lombadas e os livros reais continuam visíveis', () => {
    const slots = shelfLayout(2, 14, 8)
    const narrow = slots.filter((slot) => slot.kind === 'book' || !slot.wideOnly)
    expect(narrow).toHaveLength(8)
    expect(books(narrow)).toEqual([0, 1])
  })

  it('as decorativas diminuem conforme entram livros reais e somem com o alvo atingido', () => {
    expect(shelfLayout(10, 14, 8).filter((slot) => slot.kind === 'filler')).toHaveLength(4)
    const full = shelfLayout(20, 14, 8)
    expect(full).toHaveLength(20)
    expect(full.every((slot) => slot.kind === 'book')).toBe(true)
    expect(books(full)).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })

  it('mantém a ordem dos livros reais', () => {
    expect(books(shelfLayout(5, 14, 8))).toEqual([0, 1, 2, 3, 4])
  })
})
