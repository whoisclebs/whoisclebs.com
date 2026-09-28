/**
 * A fonte fica só local (design/explorations/ não é versionado); a saída em static/ é versionada.
 * scripts/build-hero-light.mjs
 *
 * Luz do hero, versão 3: a partir do vídeo gerado na Higgsfield
 * (`design/explorations/higgsfield/hero-light-v3-source.mp4`, Seedance 2.5, 1280×720, 24 fps, 5 s), monta um
 * loop por vai-e-volta (o trecho inteiro seguido dele mesmo invertido, 10 s): a faixa de luz entra pelo alto,
 * desce até o canto inferior direito e volta, sem corte na emenda. Exporta WebM (VP9) + MP4 (H.264, faststart),
 * sem áudio, e o pôster no quadro mais claro (a faixa inteira, t ≈ 2,5 s), que é onde o contraste é medido.
 *
 * Uso: node scripts/build-hero-light.mjs   (requer ffmpeg com libvpx-vp9 e libx264)
 */
import { execFileSync } from 'node:child_process'
import { rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'design/explorations/higgsfield/hero-light-v3-source.mp4'
const OUT = 'static/media'
const POSTER_AT = 2.5

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
const master = join(tmpdir(), `hero-light-v3-${process.pid}.mkv`)
run(['-i', SRC, '-filter_complex', '[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,format=yuv420p[out]', '-map', '[out]', '-an', '-c:v', 'ffv1', master])
run(['-i', master, '-an', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', join(OUT, 'hero-light-v3.webm')])
run(['-i', master, '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, 'hero-light-v3.mp4')])
const png = join(tmpdir(), `hero-light-v3-${process.pid}.png`)
run(['-ss', String(POSTER_AT), '-i', SRC, '-frames:v', '1', png])
await sharp(png).webp({ quality: 72, effort: 6 }).toFile(join(OUT, 'hero-light-v3-poster.webp'))
rmSync(master)
rmSync(png)
for (const file of ['hero-light-v3.webm', 'hero-light-v3.mp4', 'hero-light-v3-poster.webp']) {
  console.log(`${join(OUT, file)}\t${(statSync(join(OUT, file)).size / 1024).toFixed(0)} KiB`)
}
