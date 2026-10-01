/**
 * A fonte fica só local (design/explorations/ não é versionado); a saída em static/ é versionada.
 * scripts/build-hero-comet.mjs
 *
 * Céu do hero da home com o cometa cruzando. Linhagem (a mesma base de céu das páginas internas):
 *   - quadro inicial = quadro final = `design/explorations/higgsfield/hero-comet-v1-start-end.png`, recorte 16:9 do
 *     outpaint da ilustração do rodapé (`sky-night-outpaint.src.png`, linhas 40–940, ver `build-sky-scene.mjs`);
 *   - referência do cometa: `hero-comet-v1-comet-ref.png` (o mesmo recorte editado com Nano Banana Pro para pintar
 *     um cometa no estilo cel); não vai para o site;
 *   - vídeo: Seedance 2.5 (`seedance_2_5`, `omni_reference`, 1080p, 10 s, sem áudio) →
 *     `design/explorations/higgsfield/hero-comet-v1-source.mp4` (1920×1080, 24 fps, 241 quadros). O cometa entra
 *     pelo alto à direita, cruza devagar e sai pela esquerda antes do fim; o fim volta ao céu vazio.
 *
 * Montagem:
 *   1. 1280×720; loop sem emenda por fusão: o trecho de 0,75 s do início entra em fade sobre o fim (um cometa
 *      andando de ré, como no vai-e-volta da luz rasante v3 que este vídeo substitui, ficaria errado);
 *   2. correção de cor quadro a quadro: o Seedance clareia o céu no meio do loop (a faixa de baixo ia de #122951 a
 *      #1b2e55). Cada quadro recebe ganho + deslocamento por canal (mínimos quadrados sobre três faixas do terço
 *      esquerdo, onde o cometa não passa) que o levam à cor do mesmo recorte na base ampliada
 *      (`sky-night-outpaint-4k.src.png`), então o céu do hero é o céu das páginas internas. A correção vale só
 *      para os tons escuros do céu e some nos claros (cometa e estrelas mantêm o creme pintado);
 *   3. WebM (VP9) + MP4 (H.264, faststart), sem áudio, e o pôster no quadro com o cometa inteiro (t ≈ 4,25 s).
 *
 * Uso: node scripts/build-hero-comet.mjs   (requer ffmpeg com libvpx-vp9 e libx264)
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'design/explorations/higgsfield/hero-comet-v1-source.mp4'
const BASE = 'design/explorations/higgsfield/sky-night-outpaint-4k.src.png'
const OUT = 'static/media'
const WIDTH = 1280
const HEIGHT = 720
const FADE = 0.75
const POSTER_FRAME = 102
/** Recorte do quadro inicial na base (frações da altura do outpaint de 1888 linhas). */
const START_CROP = { top: 40 / 1888, height: 900 / 1888 }
/** Faixas medidas (frações da altura) no terço esquerdo, onde o cometa nunca passa. */
const BANDS = [
  [0, 0.12],
  [0.44, 0.56],
  [0.86, 1],
]
const SAMPLE_WIDTH = 420
/** Faixa de luminância (0–255) em que a correção de cor some aos poucos: acima dela, cometa e estrelas intactos. */
const HIGHLIGHT_FROM = 70
const HIGHLIGHT_TO = 140

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SRC]).toString())

const work = mkdtempSync(join(tmpdir(), 'hero-comet-'))
const raw = join(work, 'raw')
const graded = join(work, 'graded')
for (const dir of [raw, graded]) execFileSync('mkdir', ['-p', dir])

// 1. Loop por fusão: [início+FADE, fim] seguido do fade de volta ao início.
run([
  '-i', SRC,
  '-filter_complex',
  `[0:v]scale=${WIDTH}:${HEIGHT}:flags=lanczos,split[x][y];` +
    `[x]trim=start=${FADE},setpts=PTS-STARTPTS,fps=24,settb=1/24[a];` +
    `[y]trim=end=${FADE},setpts=PTS-STARTPTS,fps=24,settb=1/24[b];` +
    `[a][b]xfade=transition=fade:duration=${FADE}:offset=${(duration - 2 * FADE).toFixed(3)},format=rgb24[out]`,
  '-map', '[out]', join(raw, 'f%04d.png'),
])

// 2. Cor de cada quadro levada à do mesmo recorte na base do céu.
async function bandColors(input) {
  const image = await sharp(input).resize(WIDTH, HEIGHT, { fit: 'fill' }).png().toBuffer()
  return Promise.all(
    BANDS.map(async ([from, to]) => {
      const { data } = await sharp(image)
        .extract({ left: 0, top: Math.floor(HEIGHT * from), width: SAMPLE_WIDTH, height: Math.floor(HEIGHT * (to - from)) })
        .resize(1, 1, { kernel: 'cubic' })
        .raw()
        .toBuffer({ resolveWithObject: true })
      return [data[0], data[1], data[2]]
    }),
  )
}

const { width: baseWidth = 3477, height: baseHeight = 4096 } = await sharp(BASE).metadata()
const startFrame = await sharp(BASE)
  .extract({ left: 0, top: Math.round(baseHeight * START_CROP.top), width: baseWidth, height: Math.round(baseHeight * START_CROP.height) })
  .png()
  .toBuffer()
const target = await bandColors(startFrame)

const frames = readdirSync(raw).sort()
for (const frame of frames) {
  const measured = await bandColors(join(raw, frame))
  const gain = []
  const offset = []
  for (const channel of [0, 1, 2]) {
    const x = measured.map((band) => band[channel])
    const y = target.map((band) => band[channel])
    const mx = x.reduce((sum, v) => sum + v, 0) / x.length
    const my = y.reduce((sum, v) => sum + v, 0) / y.length
    const sxx = x.reduce((sum, v) => sum + (v - mx) ** 2, 0)
    const sxy = x.reduce((sum, v, i) => sum + (v - mx) * (y[i] - my), 0)
    const g = sxx > 4 ? Math.min(1.6, Math.max(0.6, sxy / sxx)) : 1
    gain.push(g)
    offset.push(my - g * mx)
  }
  // A correção vale para o céu (tons escuros) e se desliga nos claros: o cometa e as estrelas mantêm a cor
  // pintada (creme), sem o desvio que o ganho por canal daria a eles.
  const { data, info } = await sharp(join(raw, frame)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 3) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    const weight = luma <= HIGHLIGHT_FROM ? 1 : luma >= HIGHLIGHT_TO ? 0 : (HIGHLIGHT_TO - luma) / (HIGHLIGHT_TO - HIGHLIGHT_FROM)
    if (weight === 0) continue
    for (let c = 0; c < 3; c++) {
      const v = data[i + c]
      data[i + c] = Math.max(0, Math.min(255, Math.round(v + (gain[c] * v + offset[c] - v) * weight)))
    }
  }
  await sharp(data, { raw: info }).png().toFile(join(graded, frame))
}

// 3. Derivados.
const input = ['-framerate', '24', '-i', join(graded, 'f%04d.png')]
run([...input, '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', join(OUT, 'hero-comet-v1.webm')])
run([...input, '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, 'hero-comet-v1.mp4')])
await sharp(join(graded, frames[Math.min(POSTER_FRAME, frames.length - 1)])).webp({ quality: 72, effort: 6 }).toFile(join(OUT, 'hero-comet-v1-poster.webp'))
rmSync(work, { recursive: true, force: true })

console.log(`quadros\t${frames.length}\talvo ${target.map((c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')).join(' ')}`)
for (const file of ['hero-comet-v1.webm', 'hero-comet-v1.mp4', 'hero-comet-v1-poster.webp']) {
  console.log(`${join(OUT, file)}\t${(statSync(join(OUT, file)).size / 1024).toFixed(0)} KiB`)
}
