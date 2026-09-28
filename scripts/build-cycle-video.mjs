/**
 * scripts/build-cycle-video.mjs
 *
 * Monta o vídeo da página 404: o ciclo do Farol do Cabo Branco (noite → amanhecer → dia → entardecer → noite)
 * a partir dos quatro clipes de 5 s em `design/explorations/v3/cycle/` (1280×720, 30 fps).
 *
 * 1. Concatena na ordem com um crossfade de 0,4 s em cada emenda (as emendas já são quase iguais, PSNR
 *    ~43 dB entre o último quadro de um clipe e o primeiro do seguinte; o fade só apaga o salto residual).
 * 2. Fecha o laço: o 1º clipe entra de novo no fim e o resultado é cortado de 0,4 s a 19,2 s, então o
 *    último quadro emenda no primeiro sem corte.
 * 3. Desacelera 2,6× (`setpts`) para ~49 s por ciclo e interpola para 24 fps por mistura de quadros
 *    (`minterpolate=mi_mode=blend`): a cena é de câmera parada, a mistura evita as deformações do modo
 *    `mci` e não fica travada como 30 fps esticados (11,5 quadros reais por segundo).
 * 4. Exporta WebM AV1 (SVT-AV1) + MP4 H.264 (faststart), sem áudio, e o pôster da noite (primeiro quadro)
 *    em WebP e AVIF, em `static/media/`.
 *
 * Uso: node scripts/build-cycle-video.mjs   (requer ffmpeg com libsvtav1 e libx264)
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import sharp from 'sharp'

const SRC = 'design/explorations/v3/cycle'
const OUT = 'static/media'
const clips = ['1-night-dawn.mp4', '2-dawn-day.mp4', '3-day-dusk.mp4', '4-dusk-night.mp4', '1-night-dawn.mp4']
const CLIP = 5
const FADE = 0.4
const SLOW = 2.6
const FPS = 24

mkdirSync(OUT, { recursive: true })
const master = join(tmpdir(), `cycle-master-${process.pid}.mkv`)

// Cadeia de xfade: cada emenda começa FADE antes do fim do trecho acumulado.
const inputs = clips.flatMap((clip) => ['-i', join(SRC, clip)])
const steps = []
let previous = '[0:v]'
let length = CLIP
for (let index = 1; index < clips.length; index += 1) {
  const offset = (length - FADE).toFixed(3)
  const label = `[x${index}]`
  steps.push(`${previous}[${index}:v]xfade=transition=fade:duration=${FADE}:offset=${offset}${label}`)
  previous = label
  length = length + CLIP - FADE
}
// O último clipe (cópia do 1º) começa em `length - CLIP`; o laço fecha em start + (fim da cópia do 1º trecho).
const loopEnd = length - CLIP + FADE
steps.push(
  `${previous}trim=start=${FADE}:end=${loopEnd.toFixed(3)},setpts=PTS-STARTPTS,setpts=${SLOW}*PTS,` +
    `minterpolate=fps=${FPS}:mi_mode=blend,format=yuv420p[out]`,
)

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })

console.log(`Ciclo: ${(loopEnd - FADE).toFixed(1)} s de fonte → ${((loopEnd - FADE) * SLOW).toFixed(1)} s a ${FPS} fps`)
run([...inputs, '-filter_complex', steps.join(';'), '-map', '[out]', '-an', '-c:v', 'ffv1', master])

run(['-i', master, '-an', '-c:v', 'libsvtav1', '-preset', '6', '-crf', '44', '-g', '240', '-pix_fmt', 'yuv420p', join(OUT, 'farol-ciclo.webm')])
run(['-i', master, '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '30', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '240', '-movflags', '+faststart', join(OUT, 'farol-ciclo.mp4')])

const posterPng = join(tmpdir(), `cycle-poster-${process.pid}.png`)
run(['-i', master, '-frames:v', '1', posterPng])
await sharp(posterPng).webp({ quality: 70, effort: 6 }).toFile(join(OUT, 'farol-ciclo-poster.webp'))
await sharp(posterPng).avif({ quality: 50, effort: 6 }).toFile(join(OUT, 'farol-ciclo-poster.avif'))
rmSync(master)
rmSync(posterPng)

for (const file of ['farol-ciclo.webm', 'farol-ciclo.mp4', 'farol-ciclo-poster.webp', 'farol-ciclo-poster.avif']) {
  console.log(`${join(OUT, file)}\t${(statSync(join(OUT, file)).size / 1024).toFixed(0)} KiB`)
}
