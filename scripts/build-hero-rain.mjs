/**
 * A fonte fica só local (design/claude-design/ não é versionado); a saída em static/ é versionada.
 * scripts/build-hero-rain.mjs
 *
 * Hero da home: chuva na janela, a cidade ao fundo e um laptop na mesa à direita. Fonte: vídeo do Higgsfield
 * usado no projeto do Claude Design (`design/claude-design/hero-rain-src.mp4`, 1280×718, 30 fps, 5 s, H.264).
 * A câmera é parada; só as gotas e as luzes da cidade mudam.
 *
 * Montagem:
 *   1. 1280×720 (a fonte tem 718 linhas: escala para 720 de altura e corta as 2 colunas de sobra no centro);
 *   2. o quadro 0 da fonte sai: ele difere do 1 bem mais do que qualquer outro par vizinho (salto visível no loop);
 *   3. loop sem emenda por fusão: as gotas do último quadro não são as do primeiro (a emenda pularia), então os
 *      22 quadros (~0,73 s) do início entram em fade sobre o fim, como no cometa (`build-hero-comet.mjs`). O corte
 *      é por quadro, não por segundo: o último quadro do loop é o vizinho, na fonte, do primeiro;
 *   4. WebM (VP9) + MP4 (H.264, faststart), sem áudio, e o pôster WebP no quadro do meio.
 *
 * Peso: os CRF abaixo foram escolhidos comparando recortes do vidro com a fonte. Com 44/30 (~125/145 KiB) as
 * gotas pequenas somem e o vidro fica liso; com 32/22 as gotas e os fios d'água ficam iguais à fonte, bem
 * abaixo do teto (~1 MB WebM, ~1,3 MB MP4). `WEBM_CRF` e `MP4_CRF` no ambiente sobrepõem os valores.
 *
 * Uso: node scripts/build-hero-rain.mjs   (requer ffmpeg com libvpx-vp9 e libx264)
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'design/claude-design/hero-rain-src.mp4'
const OUT = 'static/media'
const NAME = 'hero-rain-v1'
const WIDTH = 1280
const HEIGHT = 720
const FPS = 30
/** Quadros da fusão do loop (~0,73 s a 30 fps). */
const FADE = 22
/** Quadros descartados no início da fonte (o quadro 0 destoa do resto). */
const SKIP = 1
const WEBM_CRF = Number(process.env.WEBM_CRF ?? 32)
const MP4_CRF = Number(process.env.MP4_CRF ?? 22)

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
const frames = Number(
  execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', SRC]).toString(),
)

const work = mkdtempSync(join(tmpdir(), 'hero-rain-'))
const master = join(work, 'master.mkv')

// 1–3. Escala e corte; depois o loop: [SKIP+FADE, fim−FADE) seguido da fusão de [fim−FADE, fim) com [SKIP, SKIP+FADE).
// A fusão é um `blend` com peso explícito por quadro, (k+1)/FADE: o último quadro do loop é exatamente o quadro
// SKIP+FADE−1 da fonte, vizinho do primeiro (SKIP+FADE). O `xfade` deixava ~4 % do fim no último quadro e
// saltava no primeiro quadro da transição. O `+0.5` arredonda (o `blend` trunca, o que escurecia meio nível
// de cinza todo o trecho da fusão e marcava a emenda). Mestre sem perda (FFV1).
const pts = `setpts=N/${FPS}/TB`
run([
  '-i', SRC,
  '-filter_complex',
  `[0:v]scale=-2:${HEIGHT}:flags=lanczos,crop=${WIDTH}:${HEIGHT},setsar=1,format=yuv444p,split=3[x][y][z];` +
    `[x]trim=start_frame=${SKIP + FADE}:end_frame=${frames - FADE},${pts}[head];` +
    `[y]trim=start_frame=${frames - FADE},${pts}[tail];` +
    `[z]trim=start_frame=${SKIP}:end_frame=${SKIP + FADE},${pts}[intro];` +
    `[tail][intro]blend=all_expr='A+(B-A)*(N+1)/${FADE}+0.5'[mix];` +
    `[head][mix]concat=n=2:v=1,format=yuv420p[out]`,
  '-map', '[out]', '-an', '-r', String(FPS), '-c:v', 'ffv1', master,
])

// 4. Derivados.
run(['-i', master, '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-crf', String(WEBM_CRF), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '1', join(OUT, `${NAME}.webm`)])
run(['-i', master, '-an', '-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'grain', '-crf', String(MP4_CRF), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, `${NAME}.mp4`)])
const posterPng = join(work, 'poster.png')
run(['-i', master, '-vf', `select=eq(n\\,${Math.round((frames - SKIP - FADE) / 2)})`, '-frames:v', '1', posterPng])
await sharp(posterPng).webp({ quality: 72, effort: 6 }).toFile(join(OUT, `${NAME}-poster.webp`))
rmSync(work, { recursive: true, force: true })

for (const file of [`${NAME}.webm`, `${NAME}.mp4`, `${NAME}-poster.webp`]) {
  console.log(`${join(OUT, file)}\t${(statSync(join(OUT, file)).size / 1024).toFixed(0)} KiB`)
}
