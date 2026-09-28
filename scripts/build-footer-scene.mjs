/**
 * scripts/build-footer-scene.mjs
 *
 * Gera as versões responsivas da noite do farol do rodapé a partir de
 * `design/explorations/v3/footer/footer-night.src.webp` (2560×1440, o Farol do Cabo Branco visto de baixo,
 * céu estrelado livre à esquerda e no alto) em AVIF e WebP, em `static/scene/`.
 *
 * Larguras 960/1600/2560 (mesma proporção 16:9). O `<picture>` do rodapé usa `srcset`/`sizes`; a camada
 * animada (farol, estrelas, vaga-lumes) acha a lâmpada em coordenadas relativas da imagem
 * (`LAMP` em `src/lib/components/footer/scene.ts`), então o recorte não pode mudar sem atualizar esse ponto.
 *
 * O fim do texto do rodapé encosta no topo da imagem (a faixa de céu acima da lâmpada, que some numa máscara).
 * As estrelas pintadas nessa faixa (pontos de 3–6 px) caíam atrás de rótulos curtos e derrubavam o contraste;
 * ali a imagem passa por um filtro de mediana (7 px) que tira os pontos e mantém o degradê do céu. As estrelas
 * dessa faixa vêm da camada animada, que desvia do texto.
 *
 * Uso: node scripts/build-footer-scene.mjs
 */
import { mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'design/explorations/v3/footer/footer-night.src.webp'
const OUT = 'static/scene'
const widths = [960, 1600, 2560]

// Faixa do topo (8 % da altura), dos dois lados da torre (a cruz no topo dela, em 61–74 % da largura, fica intacta).
const TOP_SKY = [
  { from: 0, to: 0.6 },
  { from: 0.76, to: 1 },
]
const TOP_HEIGHT = 0.08

mkdirSync(OUT, { recursive: true })
const { width: srcWidth = 2560, height: srcHeight = 1440 } = await sharp(SRC).metadata()
const patches = await Promise.all(
  TOP_SKY.map(async ({ from, to }) => {
    const region = { left: Math.round(srcWidth * from), top: 0, width: Math.round(srcWidth * (to - from)), height: Math.round(srcHeight * TOP_HEIGHT) }
    return { input: await sharp(SRC).extract(region).median(7).toBuffer(), left: region.left, top: 0 }
  }),
)
const base = await sharp(SRC).composite(patches).png().toBuffer()

for (const width of widths) {
  const resized = sharp(base).resize({ width, withoutEnlargement: true })
  const avif = join(OUT, `footer-night-${width}.avif`)
  const webp = join(OUT, `footer-night-${width}.webp`)
  await resized.clone().avif({ quality: 48, effort: 7 }).toFile(avif)
  await resized.clone().webp({ quality: 72, effort: 6 }).toFile(webp)
  for (const file of [avif, webp]) console.log(`${file}\t${(statSync(file).size / 1024).toFixed(0)} KiB`)
}
