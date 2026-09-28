import { describe, expect, it } from 'vitest'
import { coverBox, LAMP } from './scene'

describe('coverBox (object-fit: cover da ilustração 16:9)', () => {
  it('na proporção exata, a imagem ocupa o contêiner inteiro', () => {
    expect(coverBox({ left: 0, top: 0, width: 1600, height: 900 }, [0.68, 1])).toEqual({ left: 0, top: 0, width: 1600, height: 900 })
  })

  it('contêiner mais alto (celular): escala pela altura e desloca pela object-position horizontal', () => {
    const box = coverBox({ left: 0, top: 100, width: 390, height: 440 }, [0.68, 1])
    expect(box.height).toBe(440)
    expect(box.width).toBeCloseTo((440 * 2560) / 1440)
    expect(box.left).toBeCloseTo((390 - box.width) * 0.68)
    expect(box.top).toBe(100)
    // A lâmpada continua dentro da tela em 390 px.
    const lampX = box.left + box.width * LAMP.x
    expect(lampX).toBeGreaterThan(0)
    expect(lampX).toBeLessThan(390)
  })

  it('contêiner mais largo: escala pela largura e ancora embaixo (object-position 100 %)', () => {
    const box = coverBox({ left: 0, top: 0, width: 2000, height: 920 }, [0.68, 1])
    expect(box.width).toBe(2000)
    expect(box.top).toBeCloseTo(920 - (2000 * 1440) / 2560)
  })
})
