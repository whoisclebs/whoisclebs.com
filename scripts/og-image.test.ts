import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { SYMBOL_PATH } from '../src/lib/brand/symbol'
import { caseStudies } from '../src/lib/content/cases/index'
import { cellText, fitCellSize, OG_HEIGHT, OG_MAX_BYTES, OG_WIDTH, ogSvg, readPrimitives } from './og-image.mjs'

const colors = readPrimitives(readFileSync('src/styles/tokens.css', 'utf8'))

describe('imagens Open Graph', () => {
  it('lê as cores dos tokens primitivos', () => {
    expect(colors.paper).toBe('#f5f2ea')
    expect(colors.ink).toBe('#16181d')
  })

  it('tem glifo de células para o letreiro, o lema e todo slug de case', () => {
    for (const text of ['WHOISCLEBS.COM', 'ENGENHARIA DE SOFTWARE SEM TEATRO', 'ESTUDO DE CASO', ...caseStudies.map((study) => study.slug)]) {
      expect(() => cellText(text, 0, 0, 1)).not.toThrow()
    }
    expect(() => cellText('ç', 0, 0, 1)).toThrow(/sem glifo/)
  })

  it('o nome do case cabe na largura útil', () => {
    for (const study of caseStudies) {
      const size = fitCellSize(study.slug, OG_WIDTH - 180, 26)
      expect(cellText(study.slug, 0, 0, size).width).toBeLessThanOrEqual(OG_WIDTH - 180)
    }
  })

  it('renderiza PNG 1200×630 com até 100 KiB', async () => {
    for (const title of [undefined, 'golpher']) {
      const svg = ogSvg({ symbolPath: SYMBOL_PATH, colors, title })
      const png = await sharp(Buffer.from(svg)).png({ palette: true, colours: 16, compressionLevel: 9 }).toBuffer()
      const meta = await sharp(png).metadata()
      expect([meta.width, meta.height]).toEqual([OG_WIDTH, OG_HEIGHT])
      expect(png.length).toBeLessThanOrEqual(OG_MAX_BYTES)
    }
  })
})
