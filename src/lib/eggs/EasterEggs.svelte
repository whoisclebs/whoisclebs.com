<!--
  Ilha dos easter eggs globais (carregada pelo layout depois do `load`, por import dinâmico): escuta de
  teclado, modo neon, painel de atalhos, aviso (toast) e a arte no console. Tudo exige um gesto do visitante;
  a lógica das sequências fica em `keys.ts` (puro, com testes), aqui só o DOM.
-->
<script lang="ts">
  import { untrack } from 'svelte'
  import { goto } from '$app/navigation'
  import { getMessages, type Locale } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import { createKeyTracker, type KeyAction } from './keys'
  import { eggs, say, setHeroScene } from './state.svelte'

  let { locale }: { locale: Locale } = $props()

  const t = $derived(getMessages(locale).eggs)

  /** Arte do console, como no design: só aparece para quem abrir as ferramentas do navegador. */
  const ART = [
    '__        ___   _  ___ ___ ____   ____ _     _____ ____  ____',
    '\\ \\      / / | | |/ _ \\_ _/ ___| / ___| |   | ____| __ )/ ___|',
    " \\ \\ /\\ / /| |_| | | | | |\\___ \\| |   | |   |  _| |  _ \\\\___ \\",
    '  \\ V  V / |  _  | |_| | | ___) | |___| |___| |___| |_) |___) |',
    '   \\_/\\_/  |_| |_|\\___/___|____/ \\____|_____|_____|____/|____/',
  ].join('\n')

  let dialog = $state<HTMLDialogElement>()
  let altTimer: ReturnType<typeof setTimeout> | undefined

  function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target.isContentEditable || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !== null
  }

  function act(action: KeyAction, event: KeyboardEvent): void {
    switch (action.type) {
      case 'neon':
        eggs.neon = !eggs.neon
        say(eggs.neon ? t.toast.neonOn : t.toast.neonOff)
        break
      case 'help':
        event.preventDefault()
        eggs.help = !eggs.help
        break
      case 'close':
        eggs.help = false
        break
      case 'go':
        void goto(pages[action.target][locale])
        break
      case 'word':
        if (action.word === 'clebs') {
          eggs.altHeadline = true
          clearTimeout(altTimer)
          altTimer = setTimeout(() => (eggs.altHeadline = false), 5000)
          say(t.toast.hello)
        } else if (action.word === 'sudo') say(t.toast.sudo)
        else if (action.word === 'rm') say(t.toast.rm)
        else {
          setHeroScene(action.word)
          say(action.word === 'comet' ? t.toast.comet : t.toast.rain)
        }
        break
    }
  }

  $effect(() => {
    const tracker = createKeyTracker()
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing) return
      if (eggs.keysCaptured || isEditable(event.target)) return
      const action = tracker.push(event.key, event.timeStamp)
      if (action) act(action, event)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(altTimer)
    }
  })

  // Arte e convite no console, uma vez por montagem da ilha.
  $effect(() => {
    const invite = untrack(() => getMessages(locale).eggs.console)
    console.log(`%c${ART}`, 'color:#5fd3e6;font-family:monospace;line-height:1.1')
    console.log(`%c${invite}`, 'color:#5fd3e6;font-family:monospace')
  })

  // O estado manda no <dialog>: `showModal()` prende o foco e dá o Esc nativo; o evento `close` volta o estado.
  $effect(() => {
    const el = dialog
    if (!el) return
    if (eggs.help && !el.open) el.showModal()
    else if (!eggs.help && el.open) el.close()
  })

  $effect(() => {
    const el = dialog
    if (!el) return
    const onClose = () => (eggs.help = false)
    // Clique fora do painel: o alvo é o próprio <dialog> (a área do ::backdrop).
    const onClick = (event: MouseEvent) => {
      if (event.target === el) el.close()
    }
    el.addEventListener('close', onClose)
    el.addEventListener('click', onClick)
    return () => {
      el.removeEventListener('close', onClose)
      el.removeEventListener('click', onClick)
    }
  })
</script>

{#if eggs.neon}
  <div class="neon-scan" aria-hidden="true"></div>
  <div class="neon-glow" aria-hidden="true"></div>
{/if}

<dialog bind:this={dialog} class="help" aria-labelledby="eggs-help-title">
  <div class="help__panel">
    <div class="help__head">
      <h2 id="eggs-help-title" class="help__title">{t.help.title}</h2>
      <button type="button" class="help__close" aria-label={t.help.close} onclick={() => dialog?.close()}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
        </svg>
      </button>
    </div>
    <dl class="help__grid">
      <dt><kbd>g</kbd> <kbd>a</kbd></dt>
      <dd>{t.help.articles}</dd>
      <dt><kbd>g</kbd> <kbd>p</kbd></dt>
      <dd>{t.help.projects}</dd>
      <dt><kbd>g</kbd> <kbd>s</kbd></dt>
      <dd>{t.help.about}</dd>
      <dt><kbd>g</kbd> <kbd>h</kbd></dt>
      <dd>{t.help.home}</dd>
      <dt><kbd>?</kbd></dt>
      <dd>{t.help.panel}</dd>
      <dt class="help__hot"><kbd>↑↑↓↓←→←→BA</kbd></dt>
      <dd>{t.help.konami}</dd>
    </dl>
    <p class="help__more">{t.help.more}</p>
  </div>
</dialog>

<div class="toast-region" aria-live="polite" aria-atomic="true">
  {#if eggs.toast}
    {#key eggs.toast.key}
      <p class="toast">{eggs.toast.text}</p>
    {/key}
  {/if}
</div>

<style>
  /* ---------- Modo neon: varredura e brilho nas bordas, por cima de tudo, sem receber cliques ---------- */
  .neon-scan,
  .neon-glow {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 90;
  }

  .neon-scan {
    background: repeating-linear-gradient(180deg, transparent 0 2px, rgba(0, 0, 0, 0.18) 2px 3px);
  }

  .neon-glow {
    box-shadow:
      inset 0 0 160px rgba(237, 26, 160, 0.35),
      inset 0 0 60px rgba(95, 211, 230, 0.25);
  }

  /* ---------- Painel de atalhos ---------- */
  .help {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text);
    width: min(380px, calc(100% - 2 * var(--space-4)));
    max-width: 380px;
  }

  .help::backdrop {
    background: rgba(11, 12, 16, 0.7);
    backdrop-filter: blur(4px);
  }

  .help[open] {
    animation: rise var(--dur-scene) var(--ease-out);
  }

  .help__panel {
    background: var(--color-surface);
    border: var(--border-hairline) solid var(--color-rule);
    padding: var(--space-6) var(--space-6) var(--space-5);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 2;
  }

  .help__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .help__title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 26px;
    line-height: 1.2;
    letter-spacing: var(--tracking-display);
  }

  .help__close {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px -12px 0 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--color-text-soft);
    cursor: pointer;
    transition: color var(--dur-ui) var(--ease-out);
  }

  .help__close:hover {
    color: var(--color-text);
  }

  .help__grid {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--space-5);
    margin: 0;
  }

  .help__grid dt,
  .help__grid dd {
    margin: 0;
  }

  .help__grid dd {
    color: var(--color-text-soft);
  }

  kbd {
    font: inherit;
    color: var(--color-accent);
  }

  /* Na JetBrains Mono, ← e → são setas longas e finas, quase invisíveis a 13 px: as setas do Konami usam a
     fonte do sistema, que as desenha do mesmo peso de ↑ e ↓. */
  .help__hot kbd {
    font-family: system-ui, sans-serif;
    letter-spacing: 0.04em;
    color: var(--color-hot);
  }

  .help__more {
    margin: var(--space-3) 0 0;
    color: var(--color-text-faint);
  }

  /* ---------- Aviso ---------- */
  .toast-region {
    position: fixed;
    left: 50%;
    bottom: 32px;
    z-index: 95;
    transform: translateX(-50%);
    width: max-content;
    max-width: calc(100vw - 2 * var(--space-4));
    pointer-events: none;
  }

  .toast {
    margin: 0;
    padding: 10px 18px;
    border-radius: var(--radius-pill);
    background: var(--color-text);
    color: var(--color-bg);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.5;
    text-align: center;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
    animation: toast 3.6s var(--ease-out) both;
  }

  @keyframes toast {
    0% {
      opacity: 0;
      transform: translateY(16px);
    }
    10%,
    85% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  @keyframes toast-still {
    0%,
    100% {
      opacity: 0;
    }
    10%,
    85% {
      opacity: 1;
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* Movimento reduzido: só a opacidade muda. */
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation-name: toast-still;
    }

    .help[open] {
      animation: none;
    }
  }
</style>
