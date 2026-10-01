<!--
  O livro em 3D que sai da estante. Uma caixa com `preserve-3d`: lombada à esquerda, corte das páginas
  à direita, contracapa atrás, a primeira página logo abaixo da capa e a capa com dobradiça na lombada.
  Quem decide a pose é o `data-phase` do <dialog> (ver Bookshelf.svelte); aqui só há faces e conteúdo.
-->
<script lang="ts">
  import type { books } from '$lib/content/library'
  import type { Locale } from '$lib/i18n'
  import SpineFace from './SpineFace.svelte'
  import { BOOK_RATIO, shortTitle, type SpineShape } from './spine'

  type Book = (typeof books)[number]

  let {
    book,
    shape,
    locale,
    copy,
    titleId,
  }: {
    book: Book
    shape: SpineShape
    locale: Locale
    copy: { book: string; amazon: string; affiliateShort: string; pages: string }
    titleId: string
  } = $props()

  // Se a capa remota falhar (bloqueio, rede), fica a capa desenhada: cor da lombada, título e autor.
  let coverFailed = $state(false)
  let coverLoaded = $state(false)
  // Imagem com proporção perto da do livro (até 15 %) preenche a capa, cortando a sobra à esquerda (as
  // fotos da Amazon às vezes mostram a lombada ali); quadrada ou muito diferente, cabe inteira.
  let coverFill = $state(false)

  function onCoverLoad(event: Event): void {
    const img = event.currentTarget as HTMLImageElement
    const ratio = img.naturalWidth / Math.max(1, img.naturalHeight)
    coverFill = Math.abs(ratio / BOOK_RATIO - 1) <= 0.15
    coverLoaded = true
  }

  const note = $derived(locale === 'en' ? book.noteEn : book.note)
  const facts = $derived([book.year ? String(book.year) : null, book.pages ? `${book.pages} ${copy.pages}` : null].filter((fact) => fact !== null))
</script>

<div class="book" style:--spine={shape.color} style:--ink={shape.ink}>
  <div class="face face--back"></div>
  <div class="face face--edge"></div>
  <div class="face face--spine">
    <SpineFace title={shortTitle(book.title)} author={book.author} color={shape.color} ink={shape.ink} />
  </div>

  <div class="face face--page">
    <div class="page">
      <p class="page__kicker">{copy.book}</p>
      <h2 id={titleId} class="page__title">{book.title}</h2>
      <p class="page__author">{book.author}</p>
      {#if facts.length > 0}
        <p class="page__facts">{facts.join(' · ')}</p>
      {/if}
      {#if note}
        <p class="page__note">{note}</p>
      {/if}
      <div class="page__foot">
        <a class="page__link" href={book.link} rel={book.affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}>
          {copy.amazon}<span aria-hidden="true">↗</span>
        </a>
        {#if book.affiliate}
          <p class="page__affiliate">{copy.affiliateShort}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="cover">
    <div class="face cover__front">
      <div class="cover__drawn" class:is-hidden={coverLoaded} aria-hidden="true">
        <span class="cover__rule"></span>
        <span class="cover__title">{shortTitle(book.title)}</span>
        <span class="cover__author">{book.author}</span>
      </div>
      {#if !coverFailed}
        <img
          class="cover__img"
          class:cover__img--fill={coverFill}
          src={book.image}
          alt=""
          width="300"
          height="450"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          onload={onCoverLoad}
          onerror={() => (coverFailed = true)}
        />
      {/if}
    </div>
    <div class="face cover__inside"></div>
  </div>
</div>

<style>
  /* Cores do objeto: papel das páginas e guarda (verso da capa). Fora da paleta de interface de propósito. */
  .book {
    --paper: var(--p-print);
    --paper-ink: var(--p-print-ink);
    --paper-edge: #e4dccd;
    --half: calc(var(--depth, 40px) / 2);
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transform-origin: 0 50%;
  }

  /*
   * Pose na estante: girado 90° pela lombada (a origem é a borda esquerda), no lugar e na escala da
   * lombada da prateleira (--fx, --fy, --fs, medidos em Bookshelf). Aberto: de frente, sem transformação.
   * Transições, e não animações, para que fechar no meio da abertura volte do ponto onde está.
   * Ao fechar, a capa fecha primeiro e o voo de volta espera 200 ms.
   */
  .book {
    transform: translate3d(var(--fx, 0), var(--fy, 0), 0) scale(var(--fs, 1)) rotateY(90deg);
    transition: transform 320ms var(--ease-in-out) 200ms;
  }

  /* Aberto, o livro recua meia espessura: página e capa aberta ficam em z = 0, sem ampliação da
     perspectiva, e o texto da página rasteriza nítido. */
  :global([data-phase='open']) .book {
    transform: translate3d(0, 0, calc(1px - var(--half))) scale(1) rotateY(0deg);
    transition: transform 340ms var(--ease-out);
  }

  /* Sem sombra externa nas faces: o Chrome ordena as camadas 3D pela caixa com a sombra e passa a
     desenhar a página por cima da capa. A sombra do livro fica num filtro do palco (Bookshelf). */
  .face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
  }

  .face--back {
    background: var(--spine);
    transform: translateZ(calc(var(--half) * -1)) rotateY(180deg);
  }

  /* Corte das páginas: filetes finos de papel, recuado um pouco das bordas da capa. */
  .face--edge {
    inset: 2px auto 2px calc(100% - var(--half));
    width: var(--depth, 40px);
    background: repeating-linear-gradient(90deg, var(--paper) 0 2px, var(--paper-edge) 2px 3px);
    transform: rotateY(90deg);
  }

  .face--spine {
    inset: 0 auto 0 calc(var(--half) * -1);
    width: var(--depth, 40px);
    transform: rotateY(-90deg);
  }

  .face--page {
    inset: 3px 3px 3px 0;
    background: var(--paper);
    color: var(--paper-ink);
    transform: translateZ(calc(var(--half) - 1px));
    box-shadow: inset 14px 0 18px -14px rgb(0 0 0 / 0.35);
  }

  .page {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    height: 100%;
    padding: clamp(20px, 7%, 32px) clamp(20px, 8%, 32px) clamp(16px, 5%, 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .page__kicker {
    font-size: var(--step--2);
    font-weight: 500;
    letter-spacing: var(--tracking-label);
    color: color-mix(in oklab, var(--paper-ink) 72%, var(--paper));
  }

  .page__title {
    margin-block-start: var(--space-2);
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: clamp(1.375rem, 1.1rem + 0.8vw, 1.75rem);
    line-height: var(--leading-heading);
    letter-spacing: -0.02em;
    color: var(--paper-ink);
    text-wrap: balance;
  }

  .page__author {
    font-size: var(--step-0);
  }

  .page__facts {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: color-mix(in oklab, var(--paper-ink) 72%, var(--paper));
  }

  .page__note {
    margin-block-start: var(--space-3);
    padding-block-start: var(--space-3);
    border-block-start: var(--border-hairline) solid color-mix(in oklab, var(--paper-ink) 18%, var(--paper));
    font-size: var(--step-0);
    line-height: var(--leading-text);
  }

  .page__foot {
    margin-block-start: auto;
    padding-block-start: var(--space-4);
    border-block-start: var(--border-hairline) solid color-mix(in oklab, var(--paper-ink) 18%, var(--paper));
  }

  .page__link {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    min-height: 44px;
    font-weight: 500;
    color: var(--paper-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* No papel o anel ciano some (contraste baixo sobre creme): o foco usa a tinta do papel. */
  .page__link:focus-visible {
    outline-color: var(--paper-ink);
  }

  .page__affiliate {
    font-size: var(--step--2);
    color: color-mix(in oklab, var(--paper-ink) 72%, var(--paper));
  }

  .cover {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transform-origin: 0 50%;
    transform: translateZ(var(--half));
    transition: transform 260ms var(--ease-in-out);
  }

  /* A capa vira para a esquerda pela dobradiça depois que o livro já está quase de frente. */
  :global([data-phase='open']) .cover {
    transform: translateZ(var(--half)) rotateY(-180deg);
    transition: transform 380ms cubic-bezier(0.6, 0.05, 0.3, 1) 220ms;
  }

  /* Montagem da pose inicial: sem transição, senão o livro voaria do centro até a lombada. */
  :global([data-instant]) .book,
  :global([data-instant]) .cover {
    transition: none;
  }

  .cover__front {
    overflow: hidden;
    background: var(--spine);
    color: var(--ink);
  }

  /* Capa desenhada: fica por baixo da imagem e aparece sozinha se ela não carregar. */
  .cover__drawn {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
    padding: 14% 12% 10%;
  }

  .cover__rule {
    width: 34%;
    height: 3px;
    background: currentColor;
    opacity: 0.6;
  }

  .cover__title {
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: clamp(1.75rem, 1.2rem + 1.4vw, 2.5rem);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .cover__author {
    margin-block-start: auto;
    font-size: var(--step-0);
    font-weight: 500;
  }

  /* As capas da Amazon têm fundo branco: `multiply` funde esse branco na cor da capa. */
  .cover__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }

  .cover__img--fill {
    object-fit: cover;
    object-position: right center;
  }

  .cover__drawn.is-hidden {
    visibility: hidden;
  }

  /* Verso da capa: a guarda, papel liso um tom abaixo da página. */
  .cover__inside {
    background: color-mix(in oklab, var(--spine) 22%, var(--paper-edge));
    transform: rotateY(180deg);
    box-shadow: inset -14px 0 18px -14px rgb(0 0 0 / 0.35);
  }

  /* Movimento reduzido: sem giro nem voo. O livro já está aberto e o <dialog> só faz um fade curto. */
  @media (prefers-reduced-motion: reduce) {
    .book,
    :global([data-phase]) .book {
      transform: translateZ(calc(1px - var(--half)));
      transition: none;
    }

    .cover,
    :global([data-phase]) .cover {
      transform: translateZ(var(--half)) rotateY(-180deg);
      transition: none;
    }
  }
</style>
