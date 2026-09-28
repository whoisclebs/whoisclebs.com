import { describe, expect, it } from 'vitest'
import { PHASES, skyAt } from './cycle'

describe('skyAt (hora do céu no vídeo do ciclo)', () => {
  it('segue as fases medidas: noite, amanhecer, dia, entardecer e noite de novo', () => {
    expect(skyAt(0)).toBe('night')
    expect(skyAt(3.4)).toBe('night')
    expect(skyAt(3.5)).toBe('dawn')
    expect(skyAt(14.9)).toBe('dawn')
    expect(skyAt(15)).toBe('day')
    expect(skyAt(26.6)).toBe('dusk')
    expect(skyAt(30)).toBe('night')
    expect(skyAt(47.7)).toBe('night')
  })

  it('o laço fecha na noite (o último quadro emenda no primeiro)', () => {
    expect(PHASES[0]![1]).toBe('night')
    expect(PHASES.at(-1)![1]).toBe('night')
  })
})
