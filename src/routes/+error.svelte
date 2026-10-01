<!--
  404: o ciclo do Farol do Cabo Branco em loop lento, em tela cheia, com o "404" em HTML por cima.
  - No HTML: o pôster da noite (AVIF/WebP) e o texto. Sem JS, com movimento reduzido ou com `saveData`, fica só
    o pôster.
  - Com movimento permitido, a ilha `notfound/cycle.ts` (import dinâmico) cria o <video> mudo em loop e marca a
    hora do céu (`data-sky`, informativo).
  - Leitura em qualquer hora do vídeo: o texto fica numa coluna sobre um painel grafite opaco-translúcido
    (`--color-bg`), nunca direto sobre a imagem; botões do site (o principal branco, o secundário com fundo).
  - O conteúdo começa abaixo do cabeçalho fixo: o `main` já reserva `--header-h` e a seção desconta isso da altura.
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
  <section class="nf" bind:this={root} data-sky="night" aria-labelledby="nf-title">
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
    min-height: max(560px, calc(100svh - var(--header-h)));
    overflow: hidden;
    background: var(--color-band);
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

  /* A coluna de texto é um painel grafite (92 % opaco): a leitura não depende da hora do vídeo. */
  .nf__copy {
    display: grid;
    justify-items: start;
    gap: var(--space-5);
    max-width: 34rem;
    padding: var(--space-6);
    background: color-mix(in oklab, var(--color-bg) 92%, transparent);
    border: var(--border-hairline) solid var(--color-rule);
  }

  .nf__title {
    display: grid;
    gap: var(--space-2);
    color: var(--color-text);
  }

  .nf__code {
    display: block;
    font-size: clamp(5rem, 3rem + 12vw, 9rem);
    line-height: var(--leading-display);
    letter-spacing: -0.04em;
    color: var(--color-accent);
  }

  .nf__name {
    font-size: var(--step-3);
    line-height: var(--leading-heading);
    letter-spacing: -0.02em;
  }

  .nf__text {
    max-width: 38ch;
    font-size: var(--step-1);
    line-height: 1.55;
    color: var(--color-text-body);
  }

  .nf__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  /* O botão secundário ganha o fundo do painel para não depender da imagem atrás. */
  .nf__links :global(.button:not(.button--primary)) {
    background: var(--color-bg);
  }

  @media (max-width: 639px) {
    .nf__media :global(.nf__video),
    .nf__poster {
      object-position: 60% 62%;
    }

    .nf__copy {
      padding: var(--space-5);
    }

    .nf__code {
      font-size: 5rem;
    }

    .nf__links {
      flex-direction: column;
      align-items: stretch;
      align-self: stretch;
    }
  }
</style>
