<!--
  Estante virtual da página Livros.

  Sem JS, cada livro real é um link comum para a Amazon desenhado como lombada. Depois da hidratação a
  lombada vira <button> e abre o livro num <dialog> modal: `showModal()` dá foco preso, Esc e a camada
  de topo (o livro voa por cima da faixa da estante, que tem `overflow` próprio). Um painel inline
  ficaria preso nessa faixa e empurraria a página; o livro aberto é um objeto em primeiro plano.

  As lombadas decorativas completam a prateleira (ver `shelfLayout`): sem texto, `aria-hidden`, fora
  do Tab e mais apagadas. Somem sozinhas conforme entram livros reais em `library.ts`.
-->
<script lang="ts">
  import { flushSync, onMount } from 'svelte'
  import type { books as libraryBooks } from '$lib/content/library'
  import type { Locale } from '$lib/i18n'
  import OpenBook from './OpenBook.svelte'
  import SpineFace from './SpineFace.svelte'
  import { fillerShape, shelfLayout, shortTitle, spineShape } from './spine'

  type Book = (typeof libraryBooks)[number]

  let {
    books,
    locale,
    copy,
  }: {
    books: Book[]
    locale: Locale
    copy: { hint: string; book: string; close: string; amazon: string; affiliateShort: string; pages: string }
  } = $props()

  const shapes = $derived(books.map((book) => spineShape(book)))
  const slots = $derived(shelfLayout(books.length))

  // Durações de Bookshelf + OpenBook: fechar = capa (260 ms) + voo de volta (200 + 320 ms).
  const CLOSE_MS = 540
  const CLOSE_REDUCED_MS = 180

  let enhanced = $state(false)
  let dialog = $state<HTMLDialogElement>()
  let stage = $state<HTMLDivElement>()
  let slotEl = $state<HTMLDivElement>()
  const spineEls: (HTMLButtonElement | undefined)[] = []
  let active = $state<number | null>(null)
  let phase = $state<'shelf' | 'open'>('shelf')
  let instant = $state(false)
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  // Só memória do prefetch, não é estado da tela: um objeto simples basta.
  const prefetched: Record<string, true> = {}

  onMount(() => {
    enhanced = true
    return () => clearTimeout(closeTimer)
  })

  // A capa vem da Amazon: começa a baixar no hover/foco para já estar pronta quando o livro girar.
  function prefetch(src: string): void {
    if (prefetched[src]) return
    prefetched[src] = true
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.decoding = 'async'
    img.src = src
  }

  function reducedMotion(): boolean {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /** Mede a lombada e o lugar final do livro e grava a pose da estante nas variáveis do slot. */
  function place(index: number): void {
    const spine = spineEls[index]
    const slot = slotEl
    if (!spine || !slot) return
    const s = spine.getBoundingClientRect()
    const b = slot.getBoundingClientRect()
    if (b.height === 0) return
    const scale = s.height / b.height
    slot.style.setProperty('--fs', String(scale))
    slot.style.setProperty('--depth', `${s.width / scale}px`)
    slot.style.setProperty('--fx', `${s.left + s.width / 2 - b.left}px`)
    slot.style.setProperty('--fy', `${s.top + s.height / 2 - (b.top + b.height / 2)}px`)
  }

  function open(index: number): void {
    const el = dialog
    if (!el) return
    clearTimeout(closeTimer)
    // Reaberto durante o fechamento: as transições voltam do ponto onde estão.
    if (active === index && el.open) {
      phase = 'open'
      return
    }
    active = index
    phase = 'shelf'
    instant = true
    flushSync()
    if (!el.open) el.showModal()
    place(index)
    void slotEl?.offsetWidth
    instant = false
    flushSync()
    void slotEl?.offsetWidth
    phase = 'open'
  }

  /** Faz o caminho de volta e só então fecha o <dialog>. Pode ser chamado no meio da abertura. */
  function close(): void {
    if (active === null) return
    place(active)
    phase = 'shelf'
    clearTimeout(closeTimer)
    closeTimer = setTimeout(finish, reducedMotion() ? CLOSE_REDUCED_MS : CLOSE_MS)
  }

  function finish(): void {
    const index = active
    active = null
    phase = 'shelf'
    // A lombada precisa voltar a ser visível antes do foco (`visibility: hidden` não recebe foco).
    flushSync()
    if (dialog?.open) dialog.close()
    if (index !== null) spineEls[index]?.focus({ preventScroll: true })
  }

  // Esc: o navegador dispara `cancel`; trocamos o fechamento seco pelo caminho de volta.
  function onCancel(event: Event): void {
    event.preventDefault()
    close()
  }

  // Fechado por fora (um segundo Esc que o navegador não deixa cancelar, por exemplo).
  function onClose(): void {
    if (active === null) return
    clearTimeout(closeTimer)
    finish()
  }

  // Clique fora do livro: o alvo é o próprio <dialog> ou o palco vazio em volta do livro.
  $effect(() => {
    const el = dialog
    if (!el) return
    const onClick = (event: MouseEvent) => {
      if (event.target === el || event.target === stage) close()
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  })

  // Setas, Home e End andam entre os livros reais; o Tab continua passando por eles em ordem.
  function onSpineKey(event: KeyboardEvent, index: number): void {
    const last = books.length - 1
    const next =
      event.key === 'ArrowRight' ? Math.min(last, index + 1) : event.key === 'ArrowLeft' ? Math.max(0, index - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
    if (next === null) return
    event.preventDefault()
    spineEls[next]?.focus()
  }

  const activeBook = $derived(active === null ? undefined : books[active])
  const activeShape = $derived(active === null ? undefined : shapes[active])
</script>

<div class="shelf">
  <div class="shelf__scroller">
    <ul class="shelf__row list-reset">
      {#each slots as slot, position (position)}
        {#if slot.kind === 'book'}
          {@const book = books[slot.index]}
          {@const shape = shapes[slot.index]}
          {#if book && shape}
            {@const name = `${book.title}, ${book.author}`}
            <li class="shelf__slot">
              {#if enhanced}
                <button
                  bind:this={spineEls[slot.index]}
                  type="button"
                  class="volume"
                  class:is-out={active === slot.index}
                  style:width="{shape.width}px"
                  style:height="{shape.height}px"
                  aria-label={name}
                  aria-haspopup="dialog"
                  onclick={() => open(slot.index)}
                  onkeydown={(event) => onSpineKey(event, slot.index)}
                  onpointerenter={() => prefetch(book.image)}
                  onpointerdown={() => prefetch(book.image)}
                  onfocus={() => prefetch(book.image)}
                >
                  <SpineFace title={shortTitle(book.title)} author={book.author} color={shape.color} ink={shape.ink} />
                </button>
              {:else}
                <a
                  class="volume"
                  href={book.link}
                  rel={book.affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}
                  style:width="{shape.width}px"
                  style:height="{shape.height}px"
                  aria-label={name}
                >
                  <SpineFace title={shortTitle(book.title)} author={book.author} color={shape.color} ink={shape.ink} />
                </a>
              {/if}
            </li>
          {/if}
        {:else}
          {@const filler = fillerShape(slot.seed)}
          <li class="shelf__slot" class:shelf__slot--wide={slot.wideOnly} aria-hidden="true">
            <span class="filler" style:width="{filler.width}px" style:height="{filler.height}px" style:--spine={filler.color} style:--ink={filler.ink}>
              {#each filler.bands as band, i (i)}
                <span class="filler__band" style:top="{band.at}%" style:height="{band.size}px"></span>
              {/each}
              {#if filler.plate}
                <span class="filler__plate"></span>
              {/if}
            </span>
          </li>
        {/if}
      {/each}
    </ul>
  </div>
  {#if enhanced}
    <p class="shelf__hint meta">{copy.hint}</p>
  {/if}
</div>

{#if enhanced}
  <dialog
    bind:this={dialog}
    class="reader"
    data-phase={phase}
    data-instant={instant ? '' : undefined}
    aria-labelledby="book-open-title"
    oncancel={onCancel}
    onclose={onClose}
  >
    <button type="button" class="reader__close" aria-label={copy.close} onclick={close}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
      </svg>
    </button>
    <div class="reader__stage" bind:this={stage}>
      <div class="reader__slot" bind:this={slotEl}>
        <div class="reader__shift">
          {#if activeBook && activeShape}
            <OpenBook book={activeBook} shape={activeShape} {locale} {copy} titleId="book-open-title" />
          {/if}
        </div>
      </div>
    </div>
  </dialog>
{/if}

<style>
  /* Cores do objeto (madeira da prateleira): fora da paleta de interface, como o papel das fotos. */
  .shelf {
    --wood-top: #6f4f37;
    --wood-front: #4a3324;
    --wood-dark: #2b1d13;
    --plank: 26px;
    margin-block-start: var(--space-5);
  }

  /* A faixa da estante rola sozinha quando não cabe; a página nunca ganha rolagem horizontal. */
  .shelf__scroller {
    width: fit-content;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--color-rule) transparent;
    /* Em cima: espaço para o livro puxado; embaixo: a sombra da tábua na parede. */
    padding-block: 20px 28px;
  }

  .shelf__row {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 1px;
    width: max-content;
    padding: 0 28px calc(var(--plank) - 6px);
  }

  /* A tábua: face de cima (onde os livros pisam) e frente, com a sombra na parede logo abaixo. */
  .shelf__row::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: var(--plank);
    background: linear-gradient(var(--wood-top) 0 8px, var(--wood-front) 8px);
    border-radius: 1px;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.12),
      inset 0 -2px 0 var(--wood-dark),
      0 16px 24px -8px rgb(0 0 0 / 0.65);
  }

  .shelf__slot {
    position: relative;
    z-index: 1;
    display: flex;
  }

  /* Livro real: cor cheia, título e autor; reage ao hover e ao foco. */
  .volume {
    position: relative;
    display: block;
    padding: 0;
    border: 0;
    border-radius: 2px 2px 1px 1px;
    background: none;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    box-shadow:
      0 3px 3px -1px rgb(0 0 0 / 0.6),
      5px 0 10px -5px rgb(0 0 0 / 0.55);
    transition:
      transform var(--dur-ui) var(--ease-out),
      box-shadow var(--dur-ui) var(--ease-out);
  }

  .volume :global(.spine) {
    border-radius: inherit;
  }

  /* O gesto de puxar com o dedo: a lombada sobe um pouco da prateleira. */
  @media (hover: hover) and (pointer: fine) {
    .volume:hover {
      transform: translateY(-12px);
      box-shadow:
        0 14px 12px -6px rgb(0 0 0 / 0.5),
        5px 0 12px -5px rgb(0 0 0 / 0.55);
    }
  }

  .volume:focus-visible {
    transform: translateY(-12px);
  }

  .volume:active {
    transform: translateY(-12px) scale(var(--press-scale));
  }

  /* Enquanto o livro está fora, a lombada some da prateleira (o lugar dela fica vazio). */
  .volume.is-out {
    visibility: hidden;
    transition: none;
  }

  /* Lombada decorativa: sem texto, mais apagada, sem clique. */
  .filler {
    position: relative;
    display: block;
    border-radius: 2px 2px 1px 1px;
    color: var(--ink);
    background:
      linear-gradient(90deg, rgb(0 0 0 / 0.32), transparent 16%, rgb(255 255 255 / 0.07) 38%, transparent 62%, rgb(0 0 0 / 0.36)),
      var(--spine);
    filter: brightness(0.62) saturate(0.7);
    box-shadow:
      0 3px 3px -1px rgb(0 0 0 / 0.6),
      5px 0 10px -5px rgb(0 0 0 / 0.55);
  }

  .filler__band {
    position: absolute;
    inset-inline: 0;
    background: currentColor;
    opacity: 0.45;
  }

  .filler__plate {
    position: absolute;
    inset: auto 22% 7% 22%;
    aspect-ratio: 1;
    border: 1px solid currentColor;
    opacity: 0.35;
  }

  .shelf__hint {
    margin-block-start: var(--space-1);
  }

  @media (max-width: 639px) {
    .shelf__slot--wide {
      display: none;
    }
  }

  /* ---------- O livro aberto ---------- */
  .reader {
    --bh: min(460px, calc(100dvh - 140px));
    --bw: calc(var(--bh) * 0.68); /* 0.68 = BOOK_RATIO em spine.ts */
    /* Aberto, o livro anda meia largura para a direita e o par de páginas fica centrado. */
    --shift-open: 50%;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text);
    overflow: hidden;
  }

  .reader::backdrop {
    background: rgb(11 12 16 / 0.72);
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity var(--dur-scene) var(--ease-out);
  }

  .reader[data-phase='open']::backdrop {
    opacity: 1;
  }

  .reader__stage {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    perspective: 1800px;
    /* A sombra do livro inteiro, já projetado: segue a silhueta em qualquer pose. */
    filter: drop-shadow(0 28px 36px rgb(0 0 0 / 0.5));
  }

  .reader__slot,
  .reader__shift {
    width: var(--bw);
    height: var(--bh);
    transform-style: preserve-3d;
  }

  .reader__shift {
    transition: transform 260ms var(--ease-in-out);
  }

  .reader[data-phase='open'] .reader__shift {
    transform: translateX(var(--shift-open));
    transition: transform 380ms cubic-bezier(0.6, 0.05, 0.3, 1) 220ms;
  }

  .reader[data-instant] .reader__shift {
    transition: none;
  }

  .reader__close {
    position: absolute;
    top: max(var(--space-3), env(safe-area-inset-top));
    right: var(--space-3);
    z-index: 1;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--color-text-soft);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity var(--dur-ui) var(--ease-out),
      color var(--dur-ui) var(--ease-out);
  }

  .reader[data-phase='open'] .reader__close {
    opacity: 1;
  }

  .reader__close:hover {
    color: var(--color-text);
  }

  /* Celular: não cabe o par de páginas; a página ocupa a largura e a capa abre para fora da tela. */
  @media (max-width: 639px) {
    .reader {
      --bw: min(calc(100vw - 32px), 360px);
      --bh: min(calc(var(--bw) / 0.68), calc(100dvh - 128px));
      --shift-open: 0%;
    }
  }

  /* Movimento reduzido: o livro aparece já aberto, só com um fade curto. */
  @media (prefers-reduced-motion: reduce) {
    .reader__shift,
    .reader[data-phase] .reader__shift {
      transform: translateX(var(--shift-open));
      transition: none;
    }

    .reader__stage {
      opacity: 0;
      transition: opacity 160ms ease;
    }

    .reader[data-phase='open'] .reader__stage {
      opacity: 1;
    }
  }
</style>
