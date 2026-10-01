/**
 * scripts/build-boot-video.mjs
 *
 * Vídeo de boot das telas do notebook e do celular da home (`src/lib/eggs/device/`): um ponto ciano que vira uma
 * linha, como um monitor ligando, e abre num brilho que assenta no escuro. Abstrato e sem texto: as linhas de boot
 * são desenhadas em código por cima.
 *
 * Fonte (só local; `design/` não é versionado): `design/claude-design/devices/boot-src.mp4`, Higgsfield Wan 3.0
 * Prime, texto para vídeo, 1280×720, 30 fps, 4 s, sem áudio (job 94da003d-38f9-4a1e-8c62-ac89a419f69e).
 *
 * Montagem: corta o escuro do início (0,35 s), acelera 1,6× (o boot dura ~2,3 s), 960×540, sem áudio;
 * WebM (VP9) + MP4 (H.264, faststart). Toca uma vez, depois de um gesto, com `preload="none"`.
 *
 * Uso: node scripts/build-boot-video.mjs   (requer ffmpeg com libvpx-vp9 e libx264)
 */
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'

const SRC = 'design/claude-design/devices/boot-src.mp4'
const OUT = 'static/media/boot-v1'
const filter = 'trim=start=0.35,setpts=(PTS-STARTPTS)/1.6,scale=960:540:flags=lanczos,fps=30'
const run = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SRC, '-vf', filter, '-an', ...args], { stdio: 'inherit' })

run(['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-pix_fmt', 'yuv420p', `${OUT}.webm`])
run(['-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}.mp4`])

for (const ext of ['webm', 'mp4']) console.log(`${OUT}.${ext} ${(statSync(`${OUT}.${ext}`).size / 1024).toFixed(0)} KiB`)
