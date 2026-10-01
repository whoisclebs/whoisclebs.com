/**
 * Gera as imagens Open Graph em `static/og/` (antes do `vite build`, que as copia para o build):
 * `default.png` para todo o site e `<slug>.png` para cada estudo de caso. Falha se alguma passar de 100 KiB.
 * Uso: node scripts/build-og.mjs   (Node ≥ 22.18: importa TypeScript por type stripping)
 * A pasta é gerada, não versionada (.gitignore).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { SYMBOL_PATH } from '../src/lib/brand/symbol.ts'
import { caseStudies } from '../src/lib/content/cases/index.ts'
import { OG_HEIGHT, OG_MAX_BYTES, OG_WIDTH, ogSvg, readPrimitives } from './og-image.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'static', 'og')
mkdirSync(out, { recursive: true })

const colors = readPrimitives(readFileSync(join(root, 'src', 'styles', 'tokens.css'), 'utf8'))
const images = [{ file: 'default.png', svg: ogSvg({ symbolPath: SYMBOL_PATH, colors }) }]
for (const study of caseStudies) images.push({ file: `${study.slug}.png`, svg: ogSvg({ symbolPath: SYMBOL_PATH, colors, title: study.slug }) })

let failed = false
for (const image of images) {
  const png = await sharp(Buffer.from(image.svg)).png({ palette: true, colours: 16, compressionLevel: 9, effort: 10 }).toBuffer()
  const meta = await sharp(png).metadata()
  const ok = meta.width === OG_WIDTH && meta.height === OG_HEIGHT && png.length <= OG_MAX_BYTES
  if (!ok) failed = true
  writeFileSync(join(out, image.file), png)
  console.log(`${ok ? 'ok' : 'FALHOU'} og/${image.file} ${meta.width}×${meta.height} ${(png.length / 1024).toFixed(1)} KiB`)
}
if (failed) {
  console.error(`Imagem OG fora do tamanho (${OG_WIDTH}×${OG_HEIGHT}, ≤ ${OG_MAX_BYTES / 1024} KiB).`)
  process.exit(1)
}
