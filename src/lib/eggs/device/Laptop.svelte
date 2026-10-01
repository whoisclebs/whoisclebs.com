<!--
  Notebook em CSS 3D (telas largas). Fechado em repouso; o botão que cobre a cena abre a tampa, a câmera
  acomoda até a pose de frente, o boot toca na tela e o terminal real (`Terminal.svelte`) entra com foco.

  Geometria (tudo proporcional a `--w`, a largura do aparelho):
  - `.rig` é a câmera. Fica num ponto sem tamanho, na dobradiça; seus filhos são o aparelho no espaço.
  - A base é um sólido: o deck deitado em cima e as faces de borda de pé (frente, lados, trás), com os cantos
    arredondados em facetas (`shell.ts`). Nenhum plano atravessa outro, então o Chrome não divide as faces.
  - A tampa (`.lid`) gira em torno da dobradiça: tela na frente, costas de alumínio atrás e as arestas
    (também em facetas) na espessura. Só `.rig` e `.lid` são contextos 3D; cada face é achatada.
  Texto nítido por construção: na pose aberta a câmera inclina `-θ` e a tampa `+θ` em torno do mesmo eixo, então
  a matriz da tela é a identidade e ela cai exatamente no seu retângulo de layout. O conteúdo vivo (boot e
  terminal) não fica dentro da cena 3D: é uma camada 2D (`.display`) posta nesse retângulo, que aparece quando a
  tampa assenta e some antes de ela fechar. Nenhum texto passa por transformação 3D.
-->
<script lang="ts">
  import { tick } from 'svelte'
  import { buildInfo } from '$lib/build-info'
  import { getMessages } from '$lib/i18n'
  import type { TerminalCatalog } from '../terminal/catalog'
  import Terminal from '../terminal/Terminal.svelte'
  import Boot from './Boot.svelte'
  import { bootLines, isOpen, step, type DeviceEvent, type Machine, type Phase } from './model'
  import { readQuiet, type Quiet } from './quiet'
  import { baseFacets, lidEdges } from './shell'

  let { catalog }: { catalog: TerminalCatalog } = $props()

  const t = $derived(getMessages(catalog.locale).eggs)
  const lines = $derived(bootLines(catalog, buildInfo(), { ...t.device.boot, noData: t.terminal.noData }))
  const uid = $props.id()
  const screenId = `laptop-screen-${uid}`

  // Durações casadas com o CSS (`--open-ms`, `--close-ms`). Os temporizadores, e não `transitionend`,
  // decidem quando a pose assentou: uma transição interrompida não dispara o fim, e reverter uma transição em
  // curso nunca leva mais que a duração cheia.
  const OPEN_MS = 950
  const CLOSE_DELAY_MS = 120
  const CLOSE_MS = 720
  const FADE_MS = 180

  /** Bordas da base e da tampa, com cinco facetas por canto (`shell.ts`). */
  const BASE = baseFacets(5)
  const LID = lidEdges(5)

  /** Teclado: larguras relativas de cada tecla, linha a linha (fileira de funções, números, ..., espaço). */
  const KEY_ROWS: number[][] = [
    [1.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75],
    [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3],
    [1, 1, 1, 1.25, 5.1, 1.25, 1, 1, 1, 1],
  ]

  let machine = $state<Machine>({ phase: 'closed', booted: false })
  let quiet = $state<Quiet>({ motion: false, data: false })
  let terminalMounted = $state(false)
  let toggle = $state<HTMLButtonElement>()
  let terminal = $state<{ focus: () => void }>()
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  /** Fechando a partir da tela acesa: a tela apaga antes de a tampa descer (`--close-delay`). */
  let dimFirst = $state(false)

  const phase = $derived(machine.phase)
  const open = $derived(isOpen(phase))
  /** A tela está acesa (boot ou terminal). */
  const lit = $derived(phase === 'boot' || phase === 'on')

  function send(event: DeviceEvent): void {
    const before = machine.phase
    if (event === 'toggle' && (before === 'closed' || before === 'closing')) quiet = readQuiet()
    machine = step(machine, event, { quiet: quiet.motion || quiet.data })
    if (machine.phase !== before) enter(machine.phase, before)
  }

  function enter(next: Phase, before: Phase): void {
    clearTimeout(settleTimer)
    dimFirst = next === 'closing' && (before === 'boot' || before === 'on')
    if (next === 'opening') settleTimer = setTimeout(() => send('settled'), quiet.motion ? FADE_MS : OPEN_MS)
    if (next === 'closing') settleTimer = setTimeout(() => send('settled'), quiet.motion ? FADE_MS : (dimFirst ? CLOSE_DELAY_MS : 0) + CLOSE_MS)
    if (next === 'on') {
      terminalMounted = true
      // A tela ligou por um gesto do visitante: aqui o foco pode ir para a linha de comando.
      void tick().then(() => terminal?.focus())
    }
  }

  /** Esc, botão de energia e `exit`: fecha e devolve o foco ao botão de abrir. */
  function close(): void {
    send('close')
    toggle?.focus({ preventScroll: true })
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    close()
  }

  $effect(() => () => clearTimeout(settleTimer))
</script>

<!-- O Esc é escutado no grupo só para fechar quando o foco está em qualquer controle do notebook. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="laptop" data-phase={phase} data-pose={open ? 'open' : 'closed'} data-dim-first={dimFirst || undefined} role="group" aria-label={t.device.laptop} onkeydown={onKeydown}>
  <div class="stage" aria-hidden="true">
    <!-- Chão numa câmera própria (mesma pose e transição): outro contexto 3D, pintado antes do aparelho, então
         a sombra nunca é ordenada por cima de uma face. -->
    <div class="rig">
      <div class="desk-shadow"></div>
      <div class="desk-contact"></div>
      <div class="desk-reflection"></div>
    </div>
    <div class="rig">

      <div class="deck">
        <div class="deck__spill"></div>
        <div class="deck__grille deck__grille--left"></div>
        <div class="deck__grille deck__grille--right"></div>
        <div class="deck__keys">
          {#each KEY_ROWS as row, r (r)}
            <div class="deck__row" class:deck__row--fn={r === 0}>
              {#each row as size, c (c)}
                <span class="deck__key" class:deck__key--id={r === 0 && c === row.length - 1} style:flex-grow={size}></span>
              {/each}
            </div>
          {/each}
        </div>
        <div class="deck__pad"></div>
        <span class="deck__notch"></span>
      </div>
      {#each BASE as facet, index (index)}
        <div
          class="facet"
          style:width={facet.width}
          style:left="calc({facet.width} / -2)"
          style:transform="translate3d({facet.x}, 0, {facet.z}) rotateY({facet.angle}deg)"
          style:background={facet.tone}
        >
          {#if facet.side && facet.angle === 0}<span class="facet__notch"></span>{/if}
        </div>
      {/each}
      <span class="led"></span>

      <div class="lid">
        <div class="lid__face">
          <div class="glass"><span class="glass__cam"></span><div class="glass__panel"></div></div>
        </div>
        <div class="lid__back"></div>
        {#each LID as edge, index (index)}
          <div
            class="edge"
            style:width={edge.width}
            style:left="calc({edge.x} - {edge.width} / 2)"
            style:top={edge.y}
            style:transform="translateZ(calc(var(--lid-t) * -0.5)) rotateZ({edge.angle}deg) rotateX(90deg)"
            style:background={edge.tone}
          ></div>
        {/each}
      </div>
    </div>
  </div>

  <button
    bind:this={toggle}
    class="hit"
    type="button"
    aria-expanded={open}
    aria-controls={screenId}
    aria-label={open ? t.device.close : t.device.open}
    onclick={() => send('toggle')}
  ></button>

  <div class="display" id={screenId} inert={!lit}>
    <div class="glass">
      <span class="glass__cam"></span>
      <div class="glass__panel">
        {#if terminalMounted}
          <div class="display__term" class:display__term--on={phase === 'on'}>
            <Terminal bind:this={terminal} {catalog} onclose={close} />
          </div>
        {/if}
        {#if phase === 'boot'}
          <Boot {lines} video={!quiet.data && !quiet.motion} ondone={() => send('booted')} />
        {/if}
      </div>
      <button class="power" type="button" aria-label={t.device.power} onclick={close}>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M8 2.2v5.2M4.6 4.4a5 5 0 1 0 6.8 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>

  <p class="hint">
    <span class="hint__pill">
      <span class="hint__dot" aria-hidden="true"></span>
      {open ? t.device.hintOpen : t.device.hintClosed}
    </span>
  </p>
</div>

<style>
  /* ---------- Medidas e materiais (escopo do aparelho; a paleta do site fica nos tokens) ---------- */
  .laptop {
    /* Largura do aparelho: 760 px no desktop, proporcional ao contêiner abaixo disso. Com a perspectiva, a
       aresta da frente aberta e a lâmina fechada chegam a ≈ 1,25 × --w: 76 % do contêiner cabe na margem. */
    --w: min(760px, 76cqi);
    --lid-h: calc(var(--w) * 0.655);
    --deck: var(--lid-h);
    --base-t: calc(var(--w) * 0.026);
    --lid-t: calc(var(--w) * 0.011);
    --radius: calc(var(--w) * 0.024);
    --top: calc(var(--w) * 0.035);
    --hinge-y: calc(var(--top) + var(--lid-h));
    /* Folga entre a tampa fechada e o deck (a borracha): a tampa gira 1,5 px acima da base. */
    --gap: 1.5px;
    /* Altura do palco = pose aberta (a home reserva o mesmo valor: `HomeTerminal.svelte`). */
    --stage-h: calc(var(--w) * 0.9);

    --open-ms: 950ms;
    --close-ms: 720ms;
    --close-delay: 120ms;
    /* Mola amortecida (ζ = 0,72): a tampa passa ≈ 3,5° do ponto e volta. Gerada de x(t) = 1 − e^(−ζωt)(…). */
    --ease-lid: linear(0, 0.0263, 0.0933, 0.1856, 0.2911, 0.4007, 0.5077, 0.6076, 0.6974, 0.7757, 0.8421, 0.8966, 0.9402, 0.9739, 0.9989, 1.0165, 1.0282, 1.0349, 1.038, 1.0382, 1.0365, 1.0335, 1.0297, 1.0255, 1.0213, 1.0173, 1.0136, 1.0103, 1.0075, 1.0052, 1.0032, 1.0017, 1.0006, 0.9997, 0.9992, 0.9988, 0.9986, 0.9985, 0.9986, 0.9986, 1);

    /* Alumínio cinza-espacial. Luz principal no alto à direita; fios de luz ciano e magenta como nas fotos. */
    --alu-hi: #6c7078;
    --alu: #4b4e55;
    --alu-mid: #3d4046;
    --alu-lo: #2c2e33;
    --alu-deep: #1b1c20;
    --key: #111215;
    --glass: #050608;
    --rim-cyan: var(--p-cyan);
    --rim-pink: var(--p-pink);

    position: relative;
    width: 100%;
  }

  /* ---------- Palco e câmera ---------- */
  /* Luz de fundo muito fraca atrás do aparelho, como nas fotos: separa o alumínio escuro do grafite. */
  .stage::before {
    position: absolute;
    inset: 0;
    background: radial-gradient(42% 46% at 50% 46%, rgb(239 233 224 / 0.035), transparent 72%);
    content: '';
  }

  .stage {
    position: relative;
    height: var(--stage-h);
    perspective: calc(var(--w) * 3.4);
    /* Olho baixo, pouco acima da dobradiça: a tela (no plano z = 0) não muda, e o teclado entra em escorço. */
    perspective-origin: 50% calc(var(--hinge-y) - var(--lid-h) * 0.3);
    pointer-events: none;
  }

  .rig {
    --pitch: -4deg;
    --yaw: 0deg;
    --cx: 0px;
    --cy: 0px;
    --cz: 0px;

    position: absolute;
    left: 50%;
    top: var(--hinge-y);
    width: 0;
    height: 0;
    transform-style: preserve-3d;
    transform-origin: 0 0;
    transform: translate3d(var(--cx), var(--cy), var(--cz)) rotateX(var(--pitch)) rotateY(var(--yaw));
    transition: transform var(--open-ms) var(--ease-out);
  }

  /* Fechado: um pouco de cima e de lado, para a lâmina mostrar a espessura e a aresta acesa. O giro é em torno
     da dobradiça (atrás), então `--cx` traz a lâmina de volta ao centro. */
  [data-pose='closed'] .rig {
    --pitch: -15deg;
    --yaw: -18deg;
    --cx: calc(var(--w) * 0.11);
    --cy: calc(var(--lid-h) * -0.5);
    --cz: calc(var(--w) * -0.22);
  }

  [data-phase='closing'] .rig {
    transition: transform var(--close-ms) var(--ease-in-out);
  }

  /* Só a câmera e a tampa são contextos 3D. Cada face é achatada (um plano só, com o conteúdo pintado nele):
     com muitos planos quase paralelos o Chrome divide e ordena errado (o vidro sumia atrás do miolo). */
  .lid {
    transform-style: preserve-3d;
  }

  /* ---------- Mesa: sombra de contato e reflexo (no plano onde a base pousa) ---------- */
  .desk-shadow,
  .desk-contact,
  .desk-reflection {
    position: absolute;
    left: calc(var(--w) * -0.5);
    top: 0;
    width: var(--w);
    height: var(--deck);
    transform-origin: 50% 0;
  }

  .desk-shadow {
    transform: translate3d(0, calc(var(--base-t) + 1px), calc(var(--deck) * -0.06)) rotateX(90deg) scale(1.32, 1.3);
    background: radial-gradient(closest-side, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.25) 60%, transparent);
  }

  /* Sombra de contato: escura e curta, um pouco maior que a pegada da base. */
  .desk-contact {
    transform: translateY(calc(var(--base-t) + 0.5px)) rotateX(90deg) scale(1.05, 1.07);
    background: radial-gradient(closest-side, rgb(0 0 0 / 0.9) 80%, transparent);
  }

  /* Reflexo fraco da aresta da frente, com as duas luzes, no grafite logo à frente do aparelho. */
  .desk-reflection {
    height: calc(var(--deck) * 0.16);
    transform: translate3d(0, calc(var(--base-t) + 0.5px), var(--deck)) rotateX(90deg);
    background:
      linear-gradient(90deg, transparent 6%, rgb(239 233 224 / 0.06) 25%, rgb(239 233 224 / 0.07) 60%, rgb(237 26 160 / 0.2) 92%, transparent 99%);
    mask-image: linear-gradient(180deg, #000, transparent);
    opacity: 0.9;
  }

  /* ---------- Base ---------- */
  /* Deck: a face de cima, deitada (rotateX 90°). O alto do div é a dobradiça; o pé, a aresta da frente. */
  .deck {
    position: absolute;
    left: calc(var(--w) * -0.5);
    top: 0;
    width: var(--w);
    height: var(--deck);
    overflow: hidden;
    border-radius: var(--radius);
    transform-origin: 50% 0;
    transform: rotateX(90deg);
    background:
      radial-gradient(60% 50% at 92% 8%, rgb(95 211 230 / 0.08), transparent 70%),
      radial-gradient(45% 40% at 98% 100%, rgb(237 26 160 / 0.14), transparent 70%),
      linear-gradient(180deg, #34363b 0%, #3c3f45 45%, #44474e 100%);
    /* Chanfro: fio claro na aresta da frente e um fio ciano na lateral direita. */
    box-shadow:
      inset 0 calc(var(--w) * -0.003) 0 rgb(255 255 255 / 0.2),
      inset calc(var(--w) * -0.0025) 0 0 rgb(95 211 230 / 0.35),
      inset 0 0 0 1px rgb(255 255 255 / 0.05);
  }

  /* Entalhe do dedo no deck, no meio da aresta da frente. */
  .deck__notch {
    position: absolute;
    left: 44%;
    bottom: 0;
    width: 12%;
    height: 1.8%;
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    background: linear-gradient(180deg, #2a2c31, #383a40);
    box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.45);
  }

  .deck__spill {
    position: absolute;
    inset: 0;
    background: radial-gradient(70% 38% at 50% 0%, rgb(95 211 230 / 0.13), transparent 75%);
    opacity: 0;
    transition: opacity 600ms var(--ease-out);
  }

  [data-phase='boot'] .deck__spill,
  [data-phase='on'] .deck__spill {
    opacity: 1;
  }

  .deck__grille {
    position: absolute;
    top: 7%;
    width: 8.5%;
    height: 39%;
    background-image: radial-gradient(circle, rgb(0 0 0 / 0.55) 0.9px, transparent 1.2px);
    background-size: 4px 4px;
    opacity: 0.8;
  }

  .deck__grille--left {
    left: 3.6%;
  }

  .deck__grille--right {
    right: 3.6%;
  }

  /* Poço do teclado, um pouco mais fundo que o deck, e as teclas com leve relevo. */
  .deck__keys {
    position: absolute;
    left: 14.5%;
    right: 14.5%;
    top: 6.5%;
    height: 40%;
    display: flex;
    flex-direction: column;
    gap: 2.2%;
    padding: 1.2% 1%;
    border-radius: 6px;
    background: rgb(0 0 0 / 0.32);
    box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.5);
  }

  .deck__row {
    display: flex;
    flex: 2;
    gap: 0.75%;
  }

  .deck__row--fn {
    flex: 1.2;
  }

  .deck__key {
    flex-basis: 0;
    border-radius: 3px;
    background: linear-gradient(180deg, #1c1d21, var(--key) 70%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      0 1px 0 rgb(0 0 0 / 0.6);
  }

  .deck__key--id {
    background: radial-gradient(circle, #15161a 50%, #2a2c31 52%, #15161a 60%);
  }

  .deck__pad {
    position: absolute;
    left: 26%;
    width: 48%;
    top: 51%;
    height: 41%;
    border-radius: 8px;
    background: linear-gradient(180deg, #3d4046, #464950);
    box-shadow:
      inset 0 0 0 1px rgb(0 0 0 / 0.28),
      inset 0 1px 0 rgb(255 255 255 / 0.06);
  }

  /* Faces de borda (retas e facetas dos cantos): de pé, centradas no seu x/z, viradas pela normal. */
  .facet {
    position: absolute;
    top: 0;
    height: var(--base-t);
    backface-visibility: hidden;
  }

  .facet__notch {
    position: absolute;
    left: 44%;
    top: 0;
    width: 12%;
    height: 30%;
    border-radius: 0 0 50% 50% / 0 0 100% 100%;
    background: linear-gradient(180deg, #1b1c20, #34363b);
    box-shadow: 0 1px 0 rgb(255 255 255 / 0.1);
  }

  /* LED de repouso: um ponto na aresta da frente que respira devagar enquanto está fechado. */
  .led {
    position: absolute;
    left: calc(var(--w) * 0.34);
    top: calc(var(--base-t) * 0.42);
    width: calc(var(--w) * 0.006);
    height: calc(var(--w) * 0.003);
    border-radius: 2px;
    background: var(--color-text);
    box-shadow: 0 0 6px 1px rgb(239 233 224 / 0.6);
    transform: translateZ(calc(var(--deck) + 0.6px));
    animation: breathe 3.6s ease-in-out infinite;
    transition: opacity var(--dur-ui) ease;
  }

  [data-pose='open'] .led {
    animation: none;
    opacity: 0;
  }

  @keyframes breathe {
    0%,
    100% {
      opacity: 0.18;
    }

    50% {
      opacity: 0.9;
    }
  }

  /* ---------- Tampa ---------- */
  .lid {
    position: absolute;
    left: calc(var(--w) * -0.5);
    top: calc(var(--lid-h) * -1);
    width: var(--w);
    height: var(--lid-h);
    transform-origin: 50% 100%;
    transform: translateY(calc(var(--gap) * -1)) rotateX(4deg);
    transition: transform var(--open-ms) var(--ease-lid);
  }

  [data-pose='closed'] .lid {
    transform: translateY(calc(var(--gap) * -1)) rotateX(-90deg);
  }

  [data-phase='closing'] .lid {
    transition: transform var(--close-ms) var(--ease-in-out);
  }

  [data-dim-first] .rig,
  [data-dim-first] .lid {
    transition-delay: var(--close-delay);
  }

  .lid__face,
  .lid__back {
    position: absolute;
    inset: 0;
    border-radius: var(--radius);
  }

  .lid__face {
    backface-visibility: hidden;
  }

  /* Costas da tampa: a face que se vê fechada. Espelhada (rotateY), então a direita do mundo é a esquerda dela. */
  .lid__back {
    transform: translateZ(calc(var(--lid-t) * -1)) rotateY(180deg);
    backface-visibility: hidden;
    /* Faixa de brilho larga e fraca atravessando a tampa: o alumínio jateado devolve a luz sem espelhar. */
    background:
      linear-gradient(104deg, transparent 30%, rgb(255 255 255 / 0.045) 47%, rgb(255 255 255 / 0.02) 56%, transparent 70%),
      radial-gradient(90% 70% at 0% 100%, rgb(95 211 230 / 0.16), transparent 60%),
      radial-gradient(120% 90% at 10% 100%, rgb(255 255 255 / 0.1), transparent 70%),
      linear-gradient(0deg, #575a61 0%, #4a4d54 35%, #3c3f45 75%, #33353a 100%);
    box-shadow:
      inset 0 calc(var(--w) * -0.003) 0 rgb(255 255 255 / 0.22),
      inset calc(var(--w) * 0.003) 0 0 rgb(95 211 230 / 0.45),
      inset 0 0 0 1px rgb(255 255 255 / 0.04);
  }

  /* Arestas da tampa: tiras da espessura da tampa, deitadas (rotateX 90°) e giradas pela normal (rotateZ). */
  .edge {
    position: absolute;
    height: var(--lid-t);
    margin-top: calc(var(--lid-t) * -0.5);
    backface-visibility: hidden;
  }

  /* ---------- Vidro da tela (igual na face 3D e na camada 2D) ---------- */
  .glass {
    position: absolute;
    inset: 0;
    border-radius: var(--radius);
    background: var(--glass);
    /* Fio de alumínio em volta do vidro, mais claro e ciano no alto à direita. */
    box-shadow:
      inset 0 0 0 calc(var(--w) * 0.003) #565a61,
      inset 0 0 0 calc(var(--w) * 0.0042) #1a1b1f,
      inset calc(var(--w) * -0.0022) calc(var(--w) * 0.0022) 0 calc(var(--w) * 0.0008) rgb(95 211 230 / 0.45);
  }

  .glass__cam {
    position: absolute;
    left: 50%;
    top: calc(var(--w) * 0.011);
    width: 5px;
    height: 5px;
    margin-left: -2.5px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #2b3440, #08090b 70%);
  }

  .glass__panel {
    position: absolute;
    left: 2.3%;
    right: 2.3%;
    top: 3.6%;
    bottom: 6.2%;
    overflow: hidden;
    border-radius: 2px;
    background: #07080b;
  }

  /* Reflexo diagonal do vidro: fraco, só para a tela não parecer um buraco preto. */
  .glass::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(118deg, rgb(255 255 255 / 0.028) 0 30%, transparent 30.2%);
    pointer-events: none;
    content: '';
  }

  /* ---------- Camada 2D da tela ligada ---------- */
  .display {
    position: absolute;
    left: calc(50% - var(--w) / 2);
    top: calc(var(--top) - var(--gap));
    width: var(--w);
    height: var(--lid-h);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 120ms ease,
      visibility 0s linear 120ms;
  }

  [data-phase='boot'] .display,
  [data-phase='on'] .display {
    opacity: 1;
    visibility: visible;
    transition: opacity 260ms var(--ease-out);
  }

  /* Brilho leve da tela acesa sobre o grafite em volta. */
  [data-phase='on'] .display .glass__panel {
    box-shadow: 0 0 60px rgb(95 211 230 / 0.06);
  }

  /* Esmaecido no alto da tela: a linha que rola para fora some em vez de aparecer cortada. */
  .display .glass__panel::after {
    position: absolute;
    inset: 0 0 auto;
    height: 18px;
    background: linear-gradient(var(--color-band), transparent);
    pointer-events: none;
    content: '';
  }

  .display .glass__panel {
    background:
      radial-gradient(120% 80% at 50% 0%, rgb(95 211 230 / 0.05), transparent 60%),
      var(--color-band);
  }

  .display__term {
    height: 100%;
    opacity: 0;
    transition: opacity 320ms var(--ease-out);
  }

  .display__term--on {
    opacity: 1;
  }

  .power {
    position: absolute;
    right: 2.3%;
    bottom: 0.8%;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-faint);
    cursor: pointer;
    transition: color var(--dur-ui) ease;
  }

  /* Alvo de toque maior que o desenho. */
  .power::before {
    position: absolute;
    inset: -11px;
    content: '';
  }

  .power:hover {
    color: var(--color-hot);
  }

  .power:focus-visible {
    outline: var(--focus-width) solid var(--color-focus);
    outline-offset: 2px;
  }

  /* ---------- Botão de abrir e dica ---------- */
  .hit {
    position: absolute;
    inset: 0 0 auto;
    height: var(--stage-h);
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .hit:focus-visible {
    outline: none;
  }

  [data-phase='boot'] .hit,
  [data-phase='on'] .hit {
    pointer-events: none;
  }

  .hint {
    display: flex;
    justify-content: center;
    height: 44px;
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  .hint__pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 28px;
    padding-inline: 12px;
    border-radius: var(--radius-pill);
  }

  .hint__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-text);
    animation: breathe 3.6s ease-in-out infinite;
  }

  [data-pose='open'] .hint__dot {
    background: var(--color-accent);
    animation: none;
    opacity: 0.9;
  }

  /* O foco do botão (que cobre a cena inteira) aparece na dica, logo abaixo do aparelho. */
  .hit:focus-visible ~ .hint .hint__pill {
    outline: var(--focus-width) solid var(--color-focus);
    outline-offset: 2px;
    color: var(--color-text);
  }

  @media (hover: hover) and (pointer: fine) {
    [data-phase='closed'] .hit:hover ~ .hint .hint__pill {
      color: var(--color-text);
    }
  }

  /* ---------- Movimento reduzido: sem giro; a pose troca sob um fade curto ---------- */
  @media (prefers-reduced-motion: reduce) {
    .rig,
    .lid,
    [data-phase='closing'] .rig,
    [data-phase='closing'] .lid {
      transition: none;
    }

    .stage {
      animation: pose-a 180ms ease-out;
    }

    [data-pose='open'] .stage {
      animation-name: pose-b;
    }

    .led,
    .hint__dot {
      animation: none;
      opacity: 0.7;
    }
  }

  /* Dois nomes iguais: trocar o nome reinicia a animação a cada troca de pose. */
  @keyframes pose-a {
    from {
      opacity: 0;
    }
  }

  @keyframes pose-b {
    from {
      opacity: 0;
    }
  }
</style>
