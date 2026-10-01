<!--
  Gaveta de aplicativos do celular: barra de status só com a hora deste aparelho (nada de bateria ou sinal
  falsos), grade de 4 colunas e o indicador de início. Cada app é um link ou botão de verdade, com a célula
  inteira (ícone + rótulo) como alvo. Ao tocar, o ícone cresce rápido antes de navegar (≈ 170 ms);
  com movimento reduzido ou tecla modificadora (abrir em outra aba), o link segue na hora.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getMessages, type Locale } from '$lib/i18n'
  import { eggs, say, setHeroScene } from '../state.svelte'
  import AppIcon from './AppIcon.svelte'
  import type { App } from './model'

  let { apps, locale, quiet = false }: { apps: App[]; locale: Locale; quiet?: boolean } = $props()

  const t = $derived(getMessages(locale).eggs)
  const LAUNCH_MS = 170

  let launching = $state<string | null>(null)
  let now = $state(new Date())
  const clock = $derived(new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(now))
  let root = $state<HTMLElement>()
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  /** Foca a gaveta (chamado quando a tela liga por um toque): o leitor de tela chega aos apps. */
  export function focus(): void {
    root?.focus({ preventScroll: true })
  }

  onMount(() => {
    const timer = setInterval(() => (now = new Date()), 15_000)
    return () => {
      clearInterval(timer)
      clearTimeout(resetTimer)
    }
  })

  function flash(id: string): void {
    launching = id
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (launching = null), 360)
  }

  function onLink(app: App, event: MouseEvent): void {
    if (app.kind === 'action' || app.kind === 'external') {
      flash(app.id)
      return
    }
    if (quiet || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    flash(app.id)
    const href = app.href
    setTimeout(() => {
      if (app.kind === 'link') void goto(href)
      else window.location.assign(href)
    }, LAUNCH_MS)
  }

  function onAction(app: App): void {
    if (app.kind !== 'action') return
    flash(app.id)
    if (app.action === 'neon') {
      eggs.neon = !eggs.neon
      say(eggs.neon ? t.toast.neonOn : t.toast.neonOff)
      return
    }
    const next = eggs.heroScene === 'rain' ? 'comet' : 'rain'
    setHeroScene(next)
    say(next === 'comet' ? t.toast.comet : t.toast.rain)
    window.scrollTo({ top: 0, behavior: quiet ? 'auto' : 'smooth' })
  }
</script>

<nav class="drawer" class:drawer--launching={launching} aria-label={t.device.drawer} tabindex="-1" bind:this={root}>
  <div class="drawer__status" aria-hidden="true">
    <span>{clock}</span>
  </div>
  <ul class="drawer__grid">
    {#each apps as app, index (app.id)}
      <li class="drawer__cell" style:--i={index}>
        {#if app.kind === 'action'}
          <button class="app" class:app--launching={launching === app.id} type="button" aria-pressed={app.action === 'neon' ? eggs.neon : undefined} onclick={() => onAction(app)}>
            <AppIcon glyph={app.glyph} tint={app.tint} />
            <span class="app__label">{app.label}</span>
          </button>
        {:else if app.kind === 'external'}
          <a class="app" class:app--launching={launching === app.id} href={app.href} target="_blank" rel="noopener noreferrer" onclick={(event) => onLink(app, event)}>
            <AppIcon glyph={app.glyph} tint={app.tint} />
            <span class="app__label">{app.label}<span class="visually-hidden"> ({t.device.newTab})</span></span>
          </a>
        {:else}
          <a
            class="app"
            class:app--launching={launching === app.id}
            href={app.href}
            data-sveltekit-reload={app.kind === 'feed' ? '' : undefined}
            onclick={(event) => onLink(app, event)}
          >
            <AppIcon glyph={app.glyph} tint={app.tint} />
            <span class="app__label">{app.label}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ul>
  <span class="drawer__home" aria-hidden="true"></span>
</nav>

<style>
  .drawer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 0 5% 0;
    outline: none;
    /* Papel de parede: o grafite fundo com as duas luzes do site, bem baixas. */
    background:
      radial-gradient(90% 45% at 100% 0%, rgb(95 211 230 / 0.16), transparent 70%),
      radial-gradient(80% 40% at 0% 100%, rgb(237 26 160 / 0.12), transparent 70%),
      linear-gradient(180deg, #0f1116, #0a0b0f);
  }

  .drawer__status {
    display: flex;
    align-items: center;
    height: 13%;
    max-height: 54px;
    padding-inline: 6%;
    font-family: var(--font-text);
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-text);
  }

  .drawer__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-content: start;
    gap: 14px 2px;
    margin: 0;
    padding: 6% 0 0;
    list-style: none;
  }

  .drawer__cell {
    animation: cell-in 260ms var(--ease-out) backwards;
    animation-delay: calc(var(--i) * 18ms);
  }

  .app {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    padding: 4px 2px;
    border: 0;
    border-radius: 14px;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .app :global(.icon) {
    width: min(56px, 76%);
    transition:
      transform 170ms var(--ease-out),
      filter 170ms var(--ease-out);
  }

  .app:active :global(.icon) {
    transform: scale(var(--press-scale));
  }

  .app--launching :global(.icon),
  .app--launching:active :global(.icon) {
    filter: brightness(1.15);
    transform: scale(1.16);
  }

  /* Os outros apps recuam um pouco enquanto um abre. */
  .drawer--launching .app:not(.app--launching) {
    opacity: 0.45;
    transition: opacity 170ms var(--ease-out);
  }

  .app:focus-visible {
    outline: var(--focus-width) solid var(--color-focus);
    outline-offset: 0;
  }

  .app__label {
    max-width: 100%;
    overflow: hidden;
    font-family: var(--font-text);
    font-size: 11px;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-body);
  }

  .drawer__home {
    width: 36%;
    height: 4px;
    margin: auto auto 2.4%;
    border-radius: 2px;
    background: rgb(239 233 224 / 0.75);
  }

  @keyframes cell-in {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.96);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer__cell {
      animation: none;
    }

    .app :global(.icon),
    .app--launching :global(.icon) {
      transition: none;
      transform: none;
    }
  }
</style>
