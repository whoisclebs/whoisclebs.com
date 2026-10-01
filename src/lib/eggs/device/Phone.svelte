<!--
  Celular em CSS (telas estreitas), de frente como na foto de referência: moldura de alumínio com o fio de luz
  ciano no alto à direita e magenta embaixo, vidro preto, câmera em pílula pequena e botões laterais.
  Em repouso a tela está apagada e é um botão ("Ligar o celular"). O toque acende a tela, toca o boot (o mesmo
  vídeo do notebook, recortado na vertical) e abre a gaveta de aplicativos. O botão lateral de energia liga e
  desliga (`aria-pressed`). Mesma máquina de estados do notebook (`model.ts`).
-->
<script lang="ts">
  import { tick } from 'svelte'
  import { buildInfo } from '$lib/build-info'
  import { getMessages } from '$lib/i18n'
  import type { TerminalCatalog } from '../terminal/catalog'
  import AppDrawer from './AppDrawer.svelte'
  import Boot from './Boot.svelte'
  import { bootLines, drawerApps, isOpen, step, type DeviceEvent, type Machine, type Phase } from './model'
  import { readQuiet, type Quiet } from './quiet'

  let { catalog }: { catalog: TerminalCatalog } = $props()

  const t = $derived(getMessages(catalog.locale).eggs)
  const lines = $derived(bootLines(catalog, buildInfo(), { ...t.device.boot, noData: t.terminal.noData }, { compact: true }))
  const apps = $derived(drawerApps(catalog, t.device.apps))

  /** A tela acende e apaga com um fade curto (casado com o CSS). */
  const WAKE_MS = 220
  const SLEEP_MS = 200

  let machine = $state<Machine>({ phase: 'closed', booted: false })
  let quiet = $state<Quiet>({ motion: false, data: false })
  let wake = $state<HTMLButtonElement>()
  let drawer = $state<{ focus: () => void }>()
  let timer: ReturnType<typeof setTimeout> | undefined

  const phase = $derived(machine.phase)
  const on = $derived(isOpen(phase))

  function send(event: DeviceEvent): void {
    const before = machine.phase
    if (event === 'toggle' && (before === 'closed' || before === 'closing')) quiet = readQuiet()
    machine = step(machine, event, { quiet: quiet.motion || quiet.data })
    if (machine.phase !== before) enter(machine.phase, before)
  }

  function enter(next: Phase, before: Phase): void {
    clearTimeout(timer)
    if (next === 'opening') timer = setTimeout(() => send('settled'), quiet.motion ? 0 : WAKE_MS)
    if (next === 'closing') timer = setTimeout(() => send('settled'), quiet.motion ? 0 : SLEEP_MS)
    if (next === 'on') void tick().then(() => drawer?.focus())
    // Apagou com o foco dentro da tela: o foco volta para o botão da tela apagada.
    if (next === 'closed' && before === 'closing') void tick().then(() => wake?.focus({ preventScroll: true }))
  }
</script>

<div class="phone" data-phase={phase} role="group" aria-label={t.device.phone}>
  <div class="phone__body">
    <span class="phone__key phone__key--action" aria-hidden="true"></span>
    <span class="phone__key phone__key--up" aria-hidden="true"></span>
    <span class="phone__key phone__key--down" aria-hidden="true"></span>
    <button class="phone__key phone__key--power" type="button" aria-pressed={on} aria-label={on ? t.device.phoneOff : t.device.phoneOn} onclick={() => send('toggle')}></button>

    <div class="phone__frame" aria-hidden="true"></div>
    <div class="phone__bezel">
      <div class="phone__screen">
        <div class="phone__lit" inert={!on}>
          {#if phase === 'on'}
            <AppDrawer bind:this={drawer} {apps} locale={catalog.locale} quiet={quiet.motion} />
          {/if}
          {#if phase === 'boot'}
            <Boot {lines} compact video={!quiet.data && !quiet.motion} ondone={() => send('booted')} />
          {/if}
        </div>
        {#if phase === 'closed'}
          <button bind:this={wake} class="phone__wake" type="button" aria-label={t.device.phoneOn} onclick={() => send('toggle')}></button>
        {/if}
        <span class="phone__cam" aria-hidden="true"></span>
        <span class="phone__glare" aria-hidden="true"></span>
      </div>
    </div>
  </div>
  <div class="phone__shadow" aria-hidden="true"></div>
  <p class="hint">
    <span class="hint__dot" aria-hidden="true"></span>
    {on ? t.device.drawer : t.device.phoneHint}
  </p>
</div>

<style>
  .phone {
    /* Altura de um celular real: no máximo 78 % da tela e 700 px, e cabe na largura com folga. */
    --ph: min(78svh, 700px, calc((100cqi - 48px) * 2.06));
    --pw: calc(var(--ph) * 0.485);
    --pr: calc(var(--pw) * 0.165);
    --rim: calc(var(--pw) * 0.014);
    --bezel: calc(var(--pw) * 0.03);

    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .phone__body {
    position: relative;
    width: var(--pw);
    height: var(--ph);
  }

  /* ---------- Moldura de alumínio ---------- */
  .phone__frame {
    position: absolute;
    inset: 0;
    border-radius: var(--pr);
    /* Faixa estreita na lateral direita: ciano no alto, magenta embaixo (as duas luzes da cena). */
    background:
      linear-gradient(180deg, rgb(95 211 230 / 0.95) 0%, rgb(95 211 230 / 0.35) 30%, transparent 50%, rgb(237 26 160 / 0.4) 72%, rgb(237 26 160 / 0.95) 100%) right / calc(var(--rim) * 1.1) 100% no-repeat,
      linear-gradient(90deg, #1d1e22 0%, #5a5d64 1.6%, #3a3c42 4%, #34363b 50%, #44474e 96%, #7d828a 98.6%, #2a2c30 100%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.28),
      inset 0 -1px 0 rgb(0 0 0 / 0.5),
      0 30px 60px -20px rgb(0 0 0 / 0.7),
      0 12px 24px -10px rgb(0 0 0 / 0.6);
  }

  /* Vidro preto da frente, com a borda fina entre o vidro e o alumínio. */
  .phone__bezel {
    position: absolute;
    inset: var(--rim);
    border-radius: calc(var(--pr) - var(--rim));
    background: #020203;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.06);
  }

  .phone__screen {
    position: absolute;
    inset: var(--bezel);
    overflow: hidden;
    border-radius: calc(var(--pr) - var(--rim) - var(--bezel) * 0.8);
    background: #050608;
    isolation: isolate;
  }

  .phone__cam {
    position: absolute;
    top: calc(var(--pw) * 0.03);
    left: 50%;
    z-index: 3;
    width: calc(var(--pw) * 0.22);
    height: calc(var(--pw) * 0.066);
    border-radius: 999px;
    background: #000;
    transform: translateX(-50%);
  }

  /* Lente dentro da pílula. */
  .phone__cam::after {
    position: absolute;
    top: 50%;
    right: 18%;
    width: calc(var(--pw) * 0.026);
    height: calc(var(--pw) * 0.026);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #26323d, #050607 70%);
    transform: translateY(-50%);
    content: '';
  }

  /* Reflexo diagonal do vidro: aparece mais com a tela apagada. */
  .phone__glare {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(125deg, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.035) 36%, transparent 36.4%);
    pointer-events: none;
    transition: opacity var(--dur-scene) ease;
  }

  /* Com a tela acesa o reflexo quase some: não pode riscar os ícones. */
  [data-phase='boot'] .phone__glare,
  [data-phase='on'] .phone__glare {
    opacity: 0.15;
  }

  /* ---------- Tela acesa ---------- */
  .phone__lit {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }

  [data-phase='opening'] .phone__lit,
  [data-phase='boot'] .phone__lit,
  [data-phase='on'] .phone__lit {
    opacity: 1;
    transition-duration: 220ms;
  }

  .phone__wake {
    position: absolute;
    inset: 0;
    z-index: 4;
    padding: 0;
    border: 0;
    border-radius: inherit;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .phone__wake:focus-visible {
    outline: var(--focus-width) solid var(--color-focus);
    outline-offset: calc(var(--bezel) * -0.5);
  }

  /* ---------- Botões laterais ---------- */
  .phone__key {
    position: absolute;
    width: calc(var(--pw) * 0.014);
    padding: 0;
    border: 0;
    border-radius: 2px;
    background: linear-gradient(90deg, #2a2c30, #5a5d64 60%, #3a3c42);
  }

  .phone__key--action {
    left: calc(var(--pw) * -0.012);
    top: 17%;
    height: 4.5%;
  }

  .phone__key--up {
    left: calc(var(--pw) * -0.012);
    top: 25%;
    height: 8.5%;
  }

  .phone__key--down {
    left: calc(var(--pw) * -0.012);
    top: 35.5%;
    height: 8.5%;
  }

  .phone__key--power {
    right: calc(var(--pw) * -0.012);
    top: 27%;
    height: 13%;
    background: linear-gradient(90deg, #4c7f89, #8fe3f0 45%, #3a3c42);
    cursor: pointer;
  }

  /* O botão de energia desenhado é fino; o alvo de toque tem 44 px. */
  .phone__key--power::before {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: max(44px, 100%);
    transform: translate(-50%, -50%);
    content: '';
  }

  .phone__key--power:focus-visible {
    outline: var(--focus-width) solid var(--color-focus);
    outline-offset: 3px;
  }

  /* ---------- Chão: sombra de contato e reflexo ---------- */
  .phone__shadow {
    width: calc(var(--pw) * 1.1);
    height: 18px;
    margin-top: -8px;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgb(0 0 0 / 0.75), transparent);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  .hint__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-text);
    animation: breathe 3.6s ease-in-out infinite;
  }

  [data-phase='on'] .hint__dot {
    background: var(--color-accent);
    animation: none;
  }

  @keyframes breathe {
    0%,
    100% {
      opacity: 0.2;
    }

    50% {
      opacity: 0.9;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hint__dot {
      animation: none;
      opacity: 0.7;
    }
  }
</style>
