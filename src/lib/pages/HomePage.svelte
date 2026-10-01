<!--
  Home do design (projeto no Claude Design, `whoisclebs.dc.html`): o hero em vídeo por baixo do cabeçalho fixo
  (chuva na janela com o laptop, ou o cometa por easter egg), Últimos artigos com filtro e destaque, Ideias em
  construção, o terminal no dispositivo e Quem está por aqui. O H1 é o LCP: a mídia do hero entra num <canvas>
  depois do load (HeroScene).
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import HeroScene from '$lib/components/hero/HeroScene.svelte'
  import HeroLaptop from '$lib/components/home/HeroLaptop.svelte'
  import HomeTerminal from '$lib/components/home/HomeTerminal.svelte'
  import HomeWriting from '$lib/components/home/HomeWriting.svelte'
  import { eggs, loadHeroScene } from '$lib/eggs/state.svelte'
  import { getMessages } from '$lib/i18n'
  import { pagePathOrDefault, pages } from '$lib/routing/paths'
  import type { homeData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof homeData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.home)
  const ids = $derived(data.locale === 'en' ? { writing: 'articles', projects: 'projects', about: 'about' } : { writing: 'artigos', projects: 'projetos', about: 'sobre' })
  const aboutHref = $derived(pagePathOrDefault('about', data.locale))
  // Digitar "clebs" troca o título por 5 s (EasterEggs); a segunda linha do alternativo fica ciano.
  const title = $derived(eggs.altHeadline ? copy.titleAlt : copy.title)

  onMount(() => {
    eggs.heroScene = loadHeroScene()
  })
</script>

{#snippet laptop()}
  <HeroLaptop locale={data.locale} />
{/snippet}

<section class="hero" aria-labelledby="hero-title">
  <HeroScene scene={eggs.heroScene} stage={eggs.heroScene === 'rain' ? laptop : undefined} />
  <div class="page hero__inner">
    <div class="hero__text">
      <p class="hero__eyebrow">{copy.eyebrow}</p>
      <h1 id="hero-title" class="hero__title">
        {#each title as line, i (i)}
          <span class:hero__lit={eggs.altHeadline && i === 1}>{line}</span>
        {/each}
      </h1>
      <p class="hero__support">{copy.support}</p>
      <div class="hero__actions">
        <a class="button button--primary" href={pages.writing[data.locale]}>
          {copy.ctaPrimary}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
        <a class="hero__secondary" href={aboutHref}>{copy.ctaSecondary}</a>
      </div>
    </div>
  </div>
  <p class="hero__cue" aria-hidden="true"><span></span>{copy.scroll}</p>
</section>

<HomeWriting id={ids.writing} locale={data.locale} items={data.recent} />

<section class="projects page" id={ids.projects} aria-labelledby="{ids.projects}-title">
  <h2 id="{ids.projects}-title">{copy.projects.title}</h2>
  <ol class="projects__grid list-reset">
    {#each data.projects as project, i (project.slug)}
      <li class="project">
        <p class="project__number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
        <h3 class="project__name">{project.name}</h3>
        <p class="project__description">{project.description}</p>
        <a class="link-arrow" href={project.caseStudy?.href ?? project.href} hreflang={project.caseStudy?.hreflang}>
          {copy.projects.open}<span class="visually-hidden">: {project.name}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </li>
    {/each}
  </ol>
  <p class="projects__all"><a class="link-arrow" href={pages.projects[data.locale]}>{copy.projects.all} <span aria-hidden="true">→</span></a></p>
</section>

<HomeTerminal locale={data.locale} catalog={data.terminal} />

<section class="about page" id={ids.about} aria-labelledby="{ids.about}-title">
  <h2 id="{ids.about}-title">{copy.about.title}</h2>
  <div class="about__body">
    <p class="about__text">{copy.about.text}</p>
    <a class="link-arrow" href={aboutHref}>{copy.about.link} <span aria-hidden="true">→</span></a>
  </div>
</section>

<style>
  /* ---------- Hero: por baixo do cabeçalho fixo, o texto à esquerda no meio da altura. ---------- */
  .hero {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 100svh;
    overflow: hidden;
    background: var(--color-band);
  }

  .hero__inner {
    position: relative;
    z-index: 2;
    padding-block: 120px;
    /* O texto não bloqueia o laptop onde não há texto: só os filhos recebem cliques. */
    pointer-events: none;
  }

  .hero__text {
    display: flex;
    flex-direction: column;
    gap: 28px;
    max-width: 640px;
  }

  .hero__text > * {
    pointer-events: auto;
  }

  .hero__eyebrow {
    font-size: 0.8125rem;
    letter-spacing: var(--tracking-label);
    line-height: var(--leading-ui);
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .hero__title {
    font-size: clamp(42px, 6.4vw, 92px);
    line-height: 1;
    letter-spacing: -0.03em;
    color: var(--color-text);
  }

  .hero__title span {
    display: block;
  }

  .hero__title .hero__lit {
    color: var(--color-accent);
  }

  .hero__support {
    max-width: 460px;
    font-size: clamp(16px, 1.3vw, 19px);
    line-height: 1.6;
    color: var(--color-text-soft);
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 28px;
    margin-block-start: var(--space-2);
  }

  .hero__secondary {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 0.9375rem;
    color: var(--color-text);
  }

  /* O fio embaixo do texto (não do alvo de 44 px). */
  .hero__secondary {
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--color-text) 35%, transparent);
    text-decoration-thickness: 1px;
    text-underline-offset: 6px;
  }

  @media (hover: hover) and (pointer: fine) {
    .hero__secondary:hover {
      text-decoration-color: currentColor;
    }
  }

  /* Indicador de rolagem: um fio que desce e volta, com o rótulo ao lado. */
  .hero__cue {
    position: absolute;
    left: var(--page-gutter);
    bottom: 36px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--step--2);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  .hero__cue span {
    display: inline-block;
    width: 1px;
    height: 28px;
    background: currentColor;
  }

  @media (prefers-reduced-motion: no-preference) {
    .hero__cue span {
      animation: cue 2.2s ease-in-out infinite;
    }
  }

  @keyframes cue {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }

    50% {
      transform: translateY(8px);
      opacity: 1;
    }
  }

  /* ---------- Seções ---------- */
  h2 {
    letter-spacing: -0.01em;
  }

  .projects {
    padding-block-start: var(--space-section);
    scroll-margin-top: var(--header-h);
  }

  .projects h2 {
    margin-block-end: 40px;
  }

  .projects__grid {
    display: grid;
    /* 440 px de mínimo: duas colunas no desktop, como no design (quatro projetos fecham em 2 × 2, sem órfão). */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
    column-gap: clamp(20px, 3vw, 48px);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .project {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding-block: 28px;
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .project__number {
    font-family: var(--font-mono);
    font-size: var(--step--2);
    color: var(--color-text-faint);
  }

  .project__name {
    font-size: clamp(26px, 2.6vw, 34px);
    line-height: 1.1;
  }

  .project__description {
    max-width: 440px;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text-soft);
  }

  /* O link fica no pé do item, alinhado entre colunas de alturas diferentes. */
  .project .link-arrow {
    margin-block-start: auto;
  }

  .projects__all {
    margin-block-start: var(--space-4);
  }

  .about {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    align-items: start;
    gap: clamp(20px, 3vw, 48px);
    padding-block: var(--space-section) var(--space-9);
    scroll-margin-top: var(--header-h);
  }

  .about__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-5);
  }

  .about__text {
    max-width: 560px;
    font-size: clamp(18px, 1.5vw, 22px);
    line-height: 1.55;
    color: var(--color-text-soft);
  }
</style>
