<!--
  Terminal interativo: saída rolável e uma linha de comando com `<input>` de verdade. A lógica dos comandos
  fica em `commands.ts` (puro, com testes); aqui só o DOM, o histórico em memória e os efeitos.
  Sem foco automático: rolaria a página e abriria o teclado no celular. Clicar na tela foca a entrada, e o
  aparelho que hospeda o terminal chama `focus()` quando a tela liga por um gesto do visitante.
  `onclose`: o aparelho fecha (comando `exit` ou Esc na linha de comando).
-->
<script lang="ts">
  import { tick } from 'svelte'
  import { goto } from '$app/navigation'
  import { buildInfo } from '$lib/build-info'
  import { getMessages } from '$lib/i18n'
  import { eggs, setHeroScene } from '../state.svelte'
  import type { TerminalCatalog } from './catalog'
  import { complete, run, type Effect, type Line } from './commands'

  let { catalog, onclose }: { catalog: TerminalCatalog; onclose?: () => void } = $props()

  const t = $derived(getMessages(catalog.locale).eggs)
  const build = buildInfo()
  const PROMPT = 'clebs@whoisclebs:~$'
  /** A saída guarda só as últimas entradas: a ilha continua leve numa sessão longa. */
  const MAX_ENTRIES = 120
  const uid = $props.id()
  const inputId = `term-${uid}`

  type Entry = { id: number; command?: string; lines: Line[] }

  let entries = $state<Entry[]>([])
  let welcome = $state(true)
  let value = $state('')
  let root = $state<HTMLDivElement>()
  let scroller = $state<HTMLDivElement>()
  let input = $state<HTMLInputElement>()

  let nextId = 0
  // Histórico só na memória da página (decisão 8 do design): nada vai para o armazenamento.
  const history: string[] = []
  let cursor = 0
  let draft = ''

  function push(entry: Omit<Entry, 'id'>): void {
    entries = [...entries, { id: nextId++, ...entry }].slice(-MAX_ENTRIES)
  }

  async function scrollToEnd(): Promise<void> {
    await tick()
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }

  /** Foca a linha de comando sem rolar a página (chamado pelo aparelho depois do gesto de abrir). */
  export function focus(): void {
    input?.focus({ preventScroll: true })
  }

  function clear(): void {
    entries = []
    welcome = false
  }

  function apply(effect: Effect): void {
    switch (effect.type) {
      case 'clear':
        clear()
        break
      case 'navigate':
        void goto(effect.href)
        break
      case 'hero':
        setHeroScene(effect.scene)
        break
      case 'neon':
        eggs.neon = !eggs.neon
        break
      case 'shortcuts':
        eggs.help = true
        break
      case 'close':
        onclose?.()
        break
    }
  }

  function execute(event: SubmitEvent): void {
    event.preventDefault()
    const command = value
    value = ''
    draft = ''
    if (command.trim()) history.push(command)
    cursor = history.length
    const result = run(command, {
      catalog,
      t,
      history: [...history],
      elapsedMs: performance.now(),
      now: new Date(),
      build,
      neon: eggs.neon,
      random: Math.random,
    })
    if (result.effect?.type !== 'clear') push({ command, lines: result.lines })
    if (result.effect) apply(result.effect)
    void scrollToEnd()
  }

  function onKeydown(event: KeyboardEvent): void {
    // As teclas do terminal não chegam à escuta global dos easter eggs.
    event.stopPropagation()
    if (event.key === 'Escape' && onclose) {
      event.preventDefault()
      onclose()
      return
    }
    if (event.key === 'l' && event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      clear()
      return
    }
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault()
      if (cursor === history.length) draft = value
      cursor = Math.max(0, cursor - 1)
      value = history[cursor] ?? ''
      return
    }
    if (event.key === 'ArrowDown' && cursor < history.length) {
      event.preventDefault()
      cursor += 1
      value = cursor === history.length ? draft : (history[cursor] ?? '')
      return
    }
    // Tab só completa quando há o que completar: com a linha vazia, segue para o próximo elemento (sem
    // armadilha de teclado).
    if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && value.trim()) {
      const result = complete(value, catalog)
      if (result.value === value && !result.options.length) return
      event.preventDefault()
      if (result.options.length) {
        push({ command: value, lines: [[{ text: result.options.join('  '), tone: 'muted' }]] })
        void scrollToEnd()
      }
      value = result.value
    }
  }

  // Clicar na tela foca a entrada, a não ser que o clique seja num link ou o visitante esteja selecionando texto.
  $effect(() => {
    const el = root
    if (!el) return
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a, input')) return
      if (window.getSelection()?.toString()) return
      input?.focus({ preventScroll: true })
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  })
</script>

{#snippet output(line: Line)}
  <div class="ln">
    {#each line as segment, index (index)}
      {#if segment.href}
        <a class="tone-link" href={segment.href} data-sveltekit-reload={segment.reload ? '' : undefined}>{segment.text}</a>
      {:else}
        <span class={segment.tone ? `tone-${segment.tone}` : undefined}>{segment.text}</span>
      {/if}
    {/each}
  </div>
{/snippet}

<div class="term" bind:this={root}>
  <div class="term__scroll" bind:this={scroller}>
    <div class="term__log" role="log" aria-live="polite" aria-label={t.terminal.device}>
      {#if welcome}
        <div class="ln tone-muted">{t.terminal.welcome}</div>
      {/if}
      {#each entries as entry (entry.id)}
        {#if entry.command !== undefined}
          <div class="ln"><span class="term__prompt" aria-hidden="true">{PROMPT}</span> {entry.command}</div>
        {/if}
        {#each entry.lines as line, index (index)}
          {@render output(line)}
        {/each}
      {/each}
    </div>
    <form class="term__line" onsubmit={execute}>
      <label class="term__prompt" for={inputId}>
        <span aria-hidden="true">{PROMPT}</span>
        <span class="visually-hidden">{t.terminal.input}</span>
      </label>
      <input
        bind:this={input}
        bind:value
        id={inputId}
        class="term__input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck={false}
        enterkeyhint="go"
        onkeydown={onKeydown}
      />
    </form>
  </div>
</div>

<style>
  .term {
    height: 100%;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
    cursor: text;
  }

  .term__scroll {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--space-5) var(--space-5) var(--space-4);
    scrollbar-width: thin;
    scrollbar-color: var(--color-rule) transparent;
  }

  .ln {
    min-height: 1.6em;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .term__prompt {
    color: var(--color-accent);
    white-space: nowrap;
  }

  .term__line {
    display: flex;
    align-items: baseline;
    gap: 1ch;
  }

  .term__input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    margin: -12px 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    caret-color: var(--color-accent);
  }

  /* O foco aparece na linha toda (o cursor piscando já marca onde se digita). */
  .term__input:focus-visible {
    outline: none;
  }

  .term__line:focus-within {
    outline: 1px solid color-mix(in srgb, var(--color-focus) 55%, transparent);
    outline-offset: 2px;
    border-radius: var(--radius-control);
  }

  .tone-muted {
    color: var(--color-text-faint);
  }

  .tone-accent {
    color: var(--color-accent);
  }

  .tone-error {
    color: var(--color-hot);
  }

  .tone-link {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .tone-link:hover {
    color: var(--color-text);
  }

  /* Celular: a entrada com 16 px evita o zoom automático do iOS ao focar. */
  @media (max-width: 640px) {
    .term {
      font-size: 13px;
    }

    .term__scroll {
      padding: var(--space-4) var(--space-4) var(--space-3);
    }

    .term__input {
      font-size: 16px;
    }
  }
</style>
