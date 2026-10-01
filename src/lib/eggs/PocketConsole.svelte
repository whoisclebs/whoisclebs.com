<!--
  Console de bolso com a serpente (easter egg da página Sobre). É uma ilha: só é baixado por `import()` quando o
  visitante insere o cartucho. Enquanto está montado, `eggs.keysCaptured` fica ligado para a escuta global dos
  easter eggs parar; o teclado é todo daqui (WASD e setas, Espaço/Enter pausa, Esc fecha).
  A lógica das regras mora em `snake.ts` (pura e testada); aqui ficam o relógio, o canvas e os controles.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { eggs } from './state.svelte'
  import { COLS, ROWS, reset, step, toggle, turn, type Dir, type SnakeState } from './snake'

  type Labels = {
    title: string
    record: string
    idle: string
    running: string
    over: string
    overScreen: string
    overHint: string
    start: string
    pause: string
    close: string
    up: string
    down: string
    left: string
    right: string
  }

  let { labels, onclose }: { labels: Labels; onclose: () => void } = $props()

  const CELL = 12
  const TICK_MS = 130
  /** Chave citada na política de privacidade: mudar aqui exige mudar lá. */
  const HI_KEY = 'whoisclebs.snake.hi'

  // Cores do canvas: os tokens do site (--color-band, --p-cyan, --p-pink, --p-cream), fixos porque o desenho não
  // muda com tema. O canvas não lê custom properties.
  const BG = '#0b0c10'
  const CHECKER = 'rgb(95 211 230 / 0.06)'
  const FOOD = '#ed1aa0'
  const HEAD = '#efe9e0'
  const BODY = '#5fd3e6'
  const OVERLAY = 'rgb(11 12 16 / 0.78)'
  const FAINT = '#8e8a82'

  let game = $state<SnakeState>(reset(Math.random))
  let hi = $state(0)
  let canvas = $state<HTMLCanvasElement>()
  let action = $state<HTMLButtonElement>()

  const hint = $derived(game.status === 'idle' ? labels.idle : game.status === 'running' ? labels.running : labels.over)

  /** O armazenamento pode falhar (janela privada, bloqueio): o recorde só vale até fechar. */
  function loadHi(): number {
    try {
      const n = Number(localStorage.getItem(HI_KEY))
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
    } catch {
      return 0
    }
  }

  function saveHi(value: number): void {
    try {
      localStorage.setItem(HI_KEY, String(value))
    } catch {
      // Sem armazenamento, o recorde fica só na tela.
    }
  }

  function press(dir: Dir): void {
    game = turn(game, dir)
  }

  function toggleRun(): void {
    game = toggle(game, Math.random)
  }

  const KEYS: Record<string, Dir> = {
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
    arrowup: 'up',
    arrowleft: 'left',
    arrowdown: 'down',
    arrowright: 'right',
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'Escape') {
      onclose()
      return
    }
    const dir = KEYS[event.key.toLowerCase()]
    if (dir) {
      // As setas só rolam a página: com o console aberto elas são do jogo.
      if (event.key.startsWith('Arrow')) event.preventDefault()
      press(dir)
      return
    }
    if (event.key === ' ' || event.key === 'Enter') {
      // Em cima de um botão, o clique nativo já faz o trabalho (e o Espaço não deve contar duas vezes).
      if ((event.target as HTMLElement | null)?.closest('button, a, input, textarea')) return
      event.preventDefault()
      toggleRun()
    }
  }

  /** Aba oculta: pausa em vez de deixar a cobra bater sozinha. */
  function onVisibility(): void {
    if (document.hidden && game.status === 'running') game = { ...game, status: 'idle' }
  }

  onMount(() => {
    hi = loadHi()
    eggs.keysCaptured = true
    action?.focus({ preventScroll: true })
    window.addEventListener('keydown', onKeydown)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      eggs.keysCaptured = false
      window.removeEventListener('keydown', onKeydown)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  // Relógio: só existe enquanto a partida corre; pausar ou terminar limpa o intervalo.
  $effect(() => {
    if (game.status !== 'running') return
    const id = setInterval(() => {
      game = step(game, Math.random)
    }, TICK_MS)
    return () => clearInterval(id)
  })

  // Recorde: ao terminar uma partida melhor que o recorde.
  $effect(() => {
    if (game.status === 'over' && game.score > hi) {
      hi = game.score
      saveHi(hi)
    }
  })

  // Desenho: fundo, xadrez, comida, corpo, cabeça e, no fim, a tela de fim de jogo.
  $effect(() => {
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
    ctx.fillStyle = CHECKER
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL)

    if (game.food) {
      ctx.fillStyle = FOOD
      ctx.fillRect(game.food.x * CELL + 2, game.food.y * CELL + 2, CELL - 4, CELL - 4)
    }
    game.snake.forEach((cell, i) => {
      ctx.fillStyle = i === 0 ? HEAD : BODY
      ctx.fillRect(cell.x * CELL + 1, cell.y * CELL + 1, CELL - 2, CELL - 2)
    })

    if (game.status === 'over') {
      ctx.fillStyle = OVERLAY
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
      ctx.textAlign = 'center'
      ctx.fillStyle = HEAD
      ctx.font = '600 14px "JetBrains Mono", monospace'
      ctx.fillText(labels.overScreen, (COLS * CELL) / 2, (ROWS * CELL) / 2 - 2)
      ctx.fillStyle = FAINT
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText(labels.overHint, (COLS * CELL) / 2, (ROWS * CELL) / 2 + 16)
    }
  })

  const pad = (n: number) => String(n).padStart(5, '0')
</script>

<div class="console" role="group" aria-label="Pocket CLEBS">
  <div class="screen">
    <p class="screen__top"><span>{labels.title}</span><span>{pad(game.score)}</span></p>
    <canvas
      bind:this={canvas}
      width={COLS * CELL}
      height={ROWS * CELL}
      aria-label={`${labels.title}: ${game.score}`}
    >{labels.title}: {game.score}</canvas>
    <p class="screen__bottom"><span>{hint}</span><span>{labels.record} {pad(hi)}</span></p>
  </div>

  <p class="brand"><span>Pocket <b>CLEBS</b></span><span>PC-01</span></p>

  <div class="controls">
    <div class="dpad">
      <button class="key key--up" type="button" aria-label={labels.up} onclick={() => press('up')}>W</button>
      <button class="key key--left" type="button" aria-label={labels.left} onclick={() => press('left')}>A</button>
      <span class="hub" aria-hidden="true"></span>
      <button class="key key--right" type="button" aria-label={labels.right} onclick={() => press('right')}>D</button>
      <button class="key key--down" type="button" aria-label={labels.down} onclick={() => press('down')}>S</button>
    </div>
    <button bind:this={action} class="act" type="button" onclick={toggleRun}>
      {game.status === 'running' ? labels.pause : labels.start}
    </button>
  </div>

  <p class="foot">
    <span>{labels.close}</span>
    <span class="holes" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  </p>
</div>

<style>
  .console {
    width: min(340px, 100%);
    margin-inline: auto;
    padding: 22px 22px 30px;
    border-radius: 26px 26px 40px 40px;
    background: var(--p-shell);
    box-shadow:
      0 30px 60px rgb(0 0 0 / 0.55),
      inset 0 1px 0 rgb(255 255 255 / 0.08);
    display: grid;
    gap: 22px;
    user-select: none;
  }

  /* Sobre a carcaça (#2b2d33) o tom "faint" não passa AA; o "soft" passa. */
  .brand,
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 4px;
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--color-text-soft);
  }

  /* A marca do aparelho: "Pocket" em Space Grotesk, "CLEBS" em mono miúda, como no design. */
  .brand > span:first-child {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 500;
  }

  .brand b {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.14em;
  }

  .screen {
    padding: 14px 14px 12px;
    border-radius: 10px;
    background: var(--p-shell-dark);
    display: grid;
    gap: 10px;
  }

  .screen__top,
  .screen__bottom {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    color: var(--color-text-faint);
  }

  .screen__top {
    font-size: 11px;
  }

  .screen__bottom {
    font-size: 10px;
  }

  canvas {
    display: block;
    width: 100%;
    max-width: 240px;
    height: auto;
    aspect-ratio: 240 / 192;
    margin-inline: auto;
    border: 1px solid rgb(95 211 230 / 0.25);
    image-rendering: pixelated;
    background: var(--color-band);
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 4px;
  }

  /* Direcional em cruz sobre uma grade 3 x 3 de 44 px. */
  .dpad {
    display: grid;
    grid-template: repeat(3, 44px) / repeat(3, 44px);
    gap: 2px;
  }

  .key {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: var(--p-shell-key);
    box-shadow: 0 3px 0 var(--p-shell-dark);
    font-family: var(--font-text);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-body);
    cursor: pointer;
    touch-action: manipulation;
  }

  /* O miolo do direcional. */
  .hub {
    grid-area: 2 / 2;
    margin: 12px;
    border-radius: 50%;
    background: var(--p-shell-key);
  }

  .key--up {
    grid-area: 1 / 2;
  }
  .key--left {
    grid-area: 2 / 1;
  }
  .key--right {
    grid-area: 2 / 3;
  }
  .key--down {
    grid-area: 3 / 2;
  }

  .key:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--p-shell-dark);
  }

  .act {
    width: 64px;
    height: 48px;
    border: 0;
    border-radius: 14px;
    background: var(--p-ember);
    box-shadow: 0 4px 0 var(--p-ember-deep);
    font-family: var(--font-text);
    font-size: 14px;
    font-weight: 600;
    color: var(--p-ink);
    cursor: pointer;
    touch-action: manipulation;
  }

  .act:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--p-ember-deep);
  }

  .foot {
    align-items: center;
  }

  /* Os quatro furos do alto-falante. */
  .holes {
    display: grid;
    grid-template-columns: repeat(4, 4px);
    gap: 4px;
  }

  .holes i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--p-shell-dark);
  }
</style>
