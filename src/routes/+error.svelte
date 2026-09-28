<!--
  404 (passo 17): o ciclo do Farol do Cabo Branco em loop lento, em tela cheia, com o "404" em HTML por cima.
  - No HTML: o pôster da noite (AVIF/WebP) e o texto. Sem JS, com movimento reduzido ou com `saveData`, fica só
    o pôster.
  - Com movimento permitido, a ilha `notfound/cycle.ts` (import dinâmico) cria o <video> mudo em loop e marca a
    hora do céu (`data-sky`, informativo).
  - Leitura sem véu nem halo em qualquer hora do vídeo: título creme com contorno preto e sombra dura (cartela
    de animação), parágrafo numa etiqueta sólida no desenho das dicas do HUD e botões sólidos.
  - O status HTTP continua 404 (o SvelteKit renderiza este componente com o status do erro).
  Outros erros (500 etc.) usam a mesma página sem o vídeo.
-->
<script lang="ts">
  import { page } from '$app/state'
  import { getMessages, localeFromPath } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import { pageTitle } from '$lib/seo'

  const locale = $derived(localeFromPath(page.url.pathname))
  const t = $derived(getMessages(locale))
  const notFound = $derived(page.status === 404)

  const POSTER = { avif: '/media/farol-ciclo-poster.avif', webp: '/media/farol-ciclo-poster.webp' }
  const VIDEO = { webm: '/media/farol-ciclo.webm', mp4: '/media/farol-ciclo.mp4' }

  let root = $state<HTMLElement>()

  $effect(() => {
    if (!notFound || !root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
    if (reduce || saveData) {
      root.dataset.video = 'poster'
      return
    }
    const target = root
    let stop: (() => void) | undefined
    let cancelled = false
    void import('$lib/components/notfound/cycle').then(({ startCycle }) => {
      if (!cancelled) stop = startCycle(target, VIDEO)
    })
    return () => {
      cancelled = true
      stop?.()
    }
  })
</script>

<svelte:head>
  <title>{pageTitle(notFound ? t['notFound.title'] : `Erro ${page.status}`)}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if notFound}
  <section class="nf band-night" bind:this={root} data-sky="night" aria-labelledby="nf-title">
    <div class="nf__media" aria-hidden="true">
      <picture>
        <source type="image/avif" srcset={POSTER.avif} />
        <img class="nf__poster" src={POSTER.webp} width="1280" height="720" alt="" decoding="async" fetchpriority="high" />
      </picture>
    </div>
    <div class="page nf__inner">
      <div class="nf__copy">
        <h1 id="nf-title" class="nf__title"><span class="nf__code">404</span> <span class="nf__name">{t['notFound.title']}</span></h1>
        <p class="nf__text">{t['notFound.description']}</p>
        <nav class="nf__links" aria-label={t['notFound.links']}>
          <a class="button button--primary" href={pages.home[locale]}>{t['notFound.back']}</a>
          <a class="button" href={pages.projects[locale]}>{t['notFound.projects']}</a>
          <a class="button" href={pages.writing[locale]}>{t['notFound.writing']}</a>
        </nav>
      </div>
    </div>
  </section>
{:else}
  <section class="page page-header">
    <p class="eyebrow">{page.status}</p>
    <h1>{page.error?.message}</h1>
    <p><a class="button" href={pages.home[locale]}>{t['notFound.back']}</a></p>
  </section>
{/if}

<style>
  .nf {
    position: relative;
    isolation: isolate;
    display: grid;
    min-height: max(560px, calc(100svh - 60px));
    overflow: hidden;
    background: #0c1a3a;
  }

  .nf__media {
    position: absolute;
    inset: 0;
    z-index: -1;
  }

  /* Farol (x ≈ 69 % do quadro) e horizonte (y ≈ 60 %) sempre na tela: à direita no desktop, na borda
     direita do texto no celular. */
  .nf__media :global(.nf__video),
  .nf__poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
    object-position: 64% 62%;
  }

  .nf__media :global(.nf__video) {
    opacity: 0;
    transition: opacity 1.2s var(--ease-out);
  }

  .nf:global([data-video='playing']) .nf__media :global(.nf__video) {
    opacity: 1;
  }

  .nf__inner {
    position: relative;
    display: grid;
    align-content: start;
    padding-block: clamp(32px, 7vh, 96px) var(--space-8);
  }

  .nf__copy {
    display: grid;
    justify-items: start;
    gap: var(--space-5);
    max-width: 34rem;
  }

  /*
   * Título creme com contorno fino por fora (`paint-order: stroke fill`, o contorno não come a letra) e uma
   * sombra dura curta, sem desfoque: legível sobre o céu branco do dia e sobre a noite, sem véu nem halo.
   * 2 px no "404" (1,5 px no celular), 1 px no subtítulo.
   */
  .nf__title {
    display: grid;
    gap: var(--space-2);
    font-weight: 400;
    color: var(--p-on-night);
    paint-order: stroke fill;
    -webkit-text-stroke-color: #080d19;
  }

  .nf__code {
    display: block;
    font-family: var(--font-display);
    font-size: clamp(7rem, 4rem + 16vw, 15rem);
    line-height: 0.85;
    letter-spacing: 0.01em;
    -webkit-text-stroke-width: 2px;
    text-shadow: 3px 3px 0 #080d19;
  }

  .nf__name {
    font-family: var(--font-display);
    font-size: var(--step-3);
    line-height: var(--leading-heading);
    letter-spacing: 0.01em;
    -webkit-text-stroke-width: 1px;
    text-shadow: 2px 2px 0 #080d19;
  }

  /* O parágrafo num painel sólido, como os outros do site (dicas do HUD): noite opaca e fio de 1 px da lâmpada. */
  .nf__text {
    max-width: 38ch;
    padding: var(--space-3) var(--space-4);
    border: var(--border-hairline) solid var(--p-sun);
    border-radius: var(--radius-control);
    background: var(--p-night-raised);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06);
    color: var(--p-on-night);
    font-size: var(--step-1);
    line-height: 1.55;
  }

  .nf__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  /* O mesmo botão do site; o secundário ganha o fundo da noite para não depender do céu atrás. */
  .nf__links :global(.button:not(.button--primary)) {
    background: var(--p-night-raised);
  }

  @media (max-width: 639px) {
    .nf__media :global(.nf__video),
    .nf__poster {
      object-position: 60% 62%;
    }

    .nf__copy {
      max-width: min(20rem, 80vw);
    }

    .nf__code {
      font-size: 6.5rem;
      -webkit-text-stroke-width: 1.5px;
      text-shadow: 2px 2px 0 #080d19;
    }

    .nf__links {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
