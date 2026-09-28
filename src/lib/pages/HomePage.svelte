<!--
  Home como jornada: o hero (noite, luz rasante, HUD no horizonte) e, depois dele, um céu noturno
  só (índigo quase preto, estrelas sutis, via láctea que gira devagar com a rolagem) que desce sem corte até a
  noite do farol no rodapé. Cada capítulo abre num fio âmbar (o horizonte) com a hora em mono, no estilo do
  HUD: arquitetura (o que ofereço) logo abaixo do hero, depois história, projetos, agentes, agora e escrita.
  O papel claro fica para a leitura longa, nas páginas internas.
-->
<script lang="ts">
  import HeroHud from '$lib/components/hero/HeroHud.svelte'
  import HeroLight from '$lib/components/hero/HeroLight.svelte'
  import WritingList from '$lib/components/writing/WritingList.svelte'
  import ProjectStatus from './ProjectStatus.svelte'
  import { contactEmail } from '$lib/content/library'
  import { formatDate, getMessages } from '$lib/i18n'
  import { pagePath, pagePathOrDefault, pages } from '$lib/routing/paths'
  import type { homeData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof homeData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.home)
  const feedHref = $derived(data.locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
  // Agentes só existe em pt-BR: no inglês o link leva hreflang.
  const agentsHreflang = $derived(data.locale === 'en' ? ('pt-BR' as const) : undefined)
  const architectureId = $derived(data.locale === 'en' ? 'architecture' : 'arquitetura')
  // Sem página de contato no idioma (inglês), o convite abre o e-mail.
  const contactHref = $derived(pagePath('contact', data.locale) ?? `mailto:${contactEmail}`)

  /** Evidência pública de cada frente: o estudo de caso (ou a página de agentes), nunca uma promessa. */
  function evidence(key: string): { href: string; hreflang?: 'pt-BR' | 'en' } {
    const slug = key === 'distributed' ? 'tuxedo' : key === 'backend' ? 'golpher' : null
    const study = slug ? data.projects.find((project) => project.slug === slug)?.caseStudy : undefined
    if (study) return { href: study.href, hreflang: study.hreflang }
    return { href: pages.agents['pt-BR'], hreflang: agentsHreflang }
  }

  /** Horas da jornada: o marcador de cada capítulo (decorativo; o título continua no <h2>). */
  const hours = { architecture: '04:40', story: '05:10', projects: '05:30', agents: '05:50', now: '06:10', writing: '06:30' } as const
</script>

<section class="hero band-night" aria-labelledby="hero-title">
  <HeroLight />
  <div class="page hero__inner">
    <div class="hero__text">
      <h1 id="hero-title" class="hero__title">{copy.title}</h1>
      <p class="hero__support">{copy.support}</p>
      <p class="hero__actions">
        <a class="button button--primary" href={pages.projects[data.locale]}>{copy.ctaPrimary}</a>
        <a class="button" href={`mailto:${contactEmail}`}>{copy.ctaSecondary}</a>
      </p>
    </div>
  </div>
  <HeroHud locale={data.locale} />
</section>

<div class="journey band-aurora" data-band="aurora">
  <div class="journey__sky" aria-hidden="true">
    <span class="journey__light"></span>
    <span class="journey__glints"></span>
  </div>

  <div class="page journey__inner">
    <section class="chapter offer" id={architectureId} aria-labelledby="architecture-title">
      <p class="mark" aria-hidden="true"><span>{hours.architecture}</span> {copy.architecture.title}</p>
      <header class="chapter-head">
        <h2 id="architecture-title">{copy.architecture.title}</h2>
        <p class="chapter-head__intro">{copy.architecture.intro}</p>
      </header>
      <ol class="offer__list list-reset">
        {#each copy.architecture.items as item (item.key)}
          {@const proof = evidence(item.key)}
          <li class="offer__item target">
            <h3 class="offer__title">{item.title}</h3>
            <div class="offer__part">
              <p class="offer__label">{copy.architecture.labels.problem}</p>
              <p class="offer__problem">{item.problem}</p>
            </div>
            <div class="offer__part">
              <p class="offer__label">{copy.architecture.labels.delivers}</p>
              <ul class="offer__delivers list-reset">
                {#each item.delivers as line (line)}<li>{line}</li>{/each}
              </ul>
            </div>
            <div class="offer__part">
              <p class="offer__label">{copy.architecture.labels.evidence}</p>
              <p><a href={proof.href} hreflang={proof.hreflang}>{item.evidence}</a></p>
            </div>
          </li>
        {/each}
      </ol>
      <p class="offer__cta">
        <a class="button button--primary" href={contactHref}>{copy.architecture.cta}</a>
        <span>{copy.architecture.ctaNote} <a href={`mailto:${contactEmail}`}>{contactEmail}</a></span>
      </p>
    </section>

    <section class="chapter story" aria-labelledby="story-title">
      <p class="mark" aria-hidden="true"><span>{hours.story}</span> {copy.story.title}</p>
      <h2 id="story-title">{copy.story.title}</h2>
      <div class="story__body">
        <p>{copy.story.text}</p>
        <p><a href={pagePathOrDefault('about', data.locale)}>{copy.story.link}</a></p>
      </div>
    </section>

    <section class="chapter projects" aria-labelledby="projects-title" data-slot="cases">
      <p class="mark" aria-hidden="true"><span>{hours.projects}</span> {copy.cases.title}</p>
      <header class="chapter-head">
        <h2 id="projects-title">{copy.cases.title}</h2>
        <p class="chapter-head__intro">{copy.cases.intro}</p>
      </header>
      <ol class="project-list list-reset">
        {#each data.projects as project (project.slug)}
          {@const primary = project.caseStudy?.href ?? project.href}
          <li class="project target">
            <h3 class="project__name"><a href={primary} hreflang={project.caseStudy?.hreflang}>{project.name}</a></h3>
            <div class="project__body">
              {#if project.caseStudy && data.locale === 'pt-BR'}
                <p class="project__question">{project.caseStudy.question}</p>
              {/if}
              <p class="project__description">{project.description}</p>
              <p class="project__links">
                {#if project.caseStudy}
                  <a href={project.caseStudy.href} hreflang={project.caseStudy.hreflang}>{copy.cases.readCase}<span class="visually-hidden">: {project.name}</span></a>
                {/if}
                <a href={project.repo} rel="noopener noreferrer">{copy.cases.code}<span class="visually-hidden">: {project.name}</span></a>
              </p>
            </div>
            <!-- <div>, não <p>: o status já é um <p> (um <p> dentro de outro quebraria a hidratação). -->
            <div class="project__meta">
              <ProjectStatus locale={data.locale} status={project.status} checkedAt={project.statusCheckedAt} prefix={false} />
              <span>{project.technologies.join(', ')}</span>
              <span>{copy.cases.lastCommit} <time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, data.locale)}</time></span>
            </div>
          </li>
        {/each}
      </ol>
      <p class="projects__all"><a href={pages.projects[data.locale]}>{copy.cases.all}</a></p>
    </section>

    <section class="chapter agents-call" aria-labelledby="agents-title" data-slot="agents">
      <p class="mark" aria-hidden="true"><span>{hours.agents}</span> {copy.agents.title}</p>
      <h2 id="agents-title">{copy.agents.title}</h2>
      <div class="agents-call__body">
        <p>{copy.agents.intro}</p>
        <p><a href={pages.agents['pt-BR']} hreflang={agentsHreflang}>{copy.agents.link}</a></p>
      </div>
    </section>

    <section class="chapter now" aria-labelledby="now-title">
      <p class="mark" aria-hidden="true"><span>{hours.now}</span> {copy.now.title}</p>
      <h2 id="now-title">{copy.now.title}</h2>
      <div class="now__body">
        <dl class="now__list">
          {#each copy.now.items as item, index (item)}
            <div class="now__row">
              <dt>{copy.now.labels[index]}</dt>
              <dd>{item}</dd>
            </div>
          {/each}
        </dl>
        <p class="now__updated">{copy.now.updatedLabel} <time datetime={copy.now.updatedAt}>{formatDate(copy.now.updatedAt, data.locale)}</time></p>
      </div>
    </section>

    <section class="chapter writing" aria-labelledby="writing-title">
      <p class="mark" aria-hidden="true"><span>{hours.writing}</span> {copy.writing.title}</p>
      <header class="chapter-head">
        <h2 id="writing-title">{copy.writing.title}</h2>
        <p class="chapter-head__intro">{copy.writing.intro}</p>
      </header>
      <WritingList items={data.recent} locale={data.locale} showKind={data.locale === 'pt-BR'} />
      <p class="writing__more">
        <a href={pages.writing[data.locale]}>{copy.writing.all}</a>
        <a href={pages.notes['pt-BR']} hreflang={data.locale === 'en' ? 'pt-BR' : undefined}>{copy.writing.notes}</a>
        <a href={feedHref} type="application/rss+xml">{copy.writing.rss}</a>
      </p>
    </section>
  </div>
</div>

<style>
  /* ---------- Noite: hero. O H1 fica à esquerda, no meio da altura; a luz desce pela direita. ---------- */
  .hero {
    position: relative;
    isolation: isolate;
    overflow-x: clip;
    display: grid;
    grid-template-rows: 1fr auto;
    min-height: max(560px, min(calc(100svh - 72px), 920px));
  }

  /* O bloco do texto fica centrado na altura do hero (com folga acima do HUD), não colado embaixo. */
  .hero__inner {
    position: relative;
    z-index: 1;
    display: grid;
    align-content: center;
    padding-block: var(--space-7) var(--space-8);
  }

  .hero :global(.hud) {
    position: relative;
    z-index: 2;
  }

  .hero__text {
    display: grid;
    gap: var(--space-5);
    max-width: 62rem;
  }

  /* 42 px em 390, 64 px em 768, teto de 88 px; 20ch dá 4 linhas no desktop, como na prévia. */
  .hero__title {
    max-width: 20ch;
    font-size: clamp(2.625rem, 1.3rem + 5.6vw, 5.5rem);
    line-height: 1;
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }

  .hero__support {
    max-width: 44ch;
    font-size: var(--step-2);
    line-height: 1.45;
    color: var(--color-text-soft);
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
  }

  @media (max-width: 639px) {
    .hero__actions .button {
      flex: 1 1 100%;
      justify-content: center;
    }
  }

  /*
   * ---------- Jornada: céu noturno profundo (índigo quase preto) com estrelas sutis e uma via láctea ----------
   * Depois do hero a home inteira é um céu só. Fundo: degradê da noite do hero ao índigo e, no fim, ao tom do
   * topo da ilustração do rodapé (`--p-sky-top`, amostrado), para o rodapé continuar sem corte. Estrelas: dois SVG de pontos com tamanhos
   * de ladrilho diferentes (a repetição não aparece). Via láctea: uma faixa diagonal de luz azulada (só
   * degradê) com pontos finos, numa camada presa à viewport (`position: sticky`, sem ocupar espaço) que
   * gira devagar conforme a rolagem desce (`view-timeline` da jornada); sem suporte ou com movimento reduzido
   * fica parada. O âmbar fica só nos acentos: fio do horizonte, hora em mono, CTA e marcadores.
   * Contraste: medido contra o ponto mais claro da via láctea (`--p-cosmos-lit`, check:contrast) e, no e2e,
   * contra os pixels reais atrás do texto.
   */
  /* `overflow-x: clip` (não cria contêiner de rolagem, então o sticky continua): a via láctea e a luz do hero
     são maiores que a tela e nunca podem gerar rolagem lateral (o e2e de overflow pegou isso de forma intermitente). */
  .journey {
    position: relative;
    isolation: isolate;
    overflow-x: clip;
    /* A via láctea girada passa da viewport; clip (não hidden) corta sem criar contêiner de rolagem, então o sticky continua. */
    overflow-x: clip;
    view-timeline: --journey block;
    background-color: var(--p-cosmos);
    background-image:
      url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='420'%20height='420'%3E%3Ccircle%20cx='99.9'%20cy='228.6'%20r='0.39'%20fill='%23f2f4ff'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='254.4'%20cy='381.7'%20r='0.42'%20fill='%23f2f4ff'%20fill-opacity='0.38'/%3E%3Ccircle%20cx='418.2'%20cy='197.5'%20r='0.76'%20fill='%23f2f4ff'%20fill-opacity='0.36'/%3E%3Ccircle%20cx='97.4'%20cy='63.7'%20r='0.91'%20fill='%23f2f4ff'%20fill-opacity='0.32'/%3E%3Ccircle%20cx='282.0'%20cy='26.9'%20r='0.66'%20fill='%23dfe6ff'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='327.6'%20cy='345.9'%20r='0.36'%20fill='%23fff1d6'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='299.9'%20cy='386.9'%20r='0.39'%20fill='%23fff1d6'%20fill-opacity='0.48'/%3E%3Ccircle%20cx='404.9'%20cy='56.3'%20r='0.38'%20fill='%23fff1d6'%20fill-opacity='0.19'/%3E%3Ccircle%20cx='91.1'%20cy='405.5'%20r='0.41'%20fill='%23dfe6ff'%20fill-opacity='0.41'/%3E%3Ccircle%20cx='176.9'%20cy='350.1'%20r='0.48'%20fill='%23fff1d6'%20fill-opacity='0.38'/%3E%3Ccircle%20cx='245.4'%20cy='379.8'%20r='0.57'%20fill='%23dfe6ff'%20fill-opacity='0.52'/%3E%3Ccircle%20cx='416.2'%20cy='281.9'%20r='0.35'%20fill='%23f2f4ff'%20fill-opacity='0.5'/%3E%3Ccircle%20cx='299.8'%20cy='88.7'%20r='0.75'%20fill='%23dfe6ff'%20fill-opacity='0.39'/%3E%3Ccircle%20cx='52.3'%20cy='202.4'%20r='0.53'%20fill='%23dfe6ff'%20fill-opacity='0.36'/%3E%3Ccircle%20cx='336.3'%20cy='172.4'%20r='0.35'%20fill='%23fff1d6'%20fill-opacity='0.29'/%3E%3Ccircle%20cx='366.6'%20cy='18.6'%20r='0.51'%20fill='%23dfe6ff'%20fill-opacity='0.2'/%3E%3Ccircle%20cx='231.4'%20cy='387.2'%20r='0.37'%20fill='%23f2f4ff'%20fill-opacity='0.27'/%3E%3Ccircle%20cx='130.1'%20cy='32.3'%20r='0.5'%20fill='%23f2f4ff'%20fill-opacity='0.19'/%3E%3Ccircle%20cx='408.0'%20cy='122.5'%20r='0.36'%20fill='%23dfe6ff'%20fill-opacity='0.44'/%3E%3Ccircle%20cx='131.8'%20cy='402.6'%20r='0.85'%20fill='%23fff1d6'%20fill-opacity='0.32'/%3E%3Ccircle%20cx='365.4'%20cy='162.2'%20r='0.81'%20fill='%23f2f4ff'%20fill-opacity='0.43'/%3E%3Ccircle%20cx='260.5'%20cy='395.1'%20r='0.44'%20fill='%23f2f4ff'%20fill-opacity='0.34'/%3E%3Ccircle%20cx='393.3'%20cy='183.7'%20r='0.36'%20fill='%23dfe6ff'%20fill-opacity='0.29'/%3E%3Ccircle%20cx='4.8'%20cy='174.4'%20r='0.49'%20fill='%23f2f4ff'%20fill-opacity='0.19'/%3E%3Ccircle%20cx='25.2'%20cy='263.5'%20r='0.42'%20fill='%23dfe6ff'%20fill-opacity='0.43'/%3E%3Ccircle%20cx='255.7'%20cy='117.1'%20r='0.43'%20fill='%23f2f4ff'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='404.6'%20cy='105.5'%20r='0.42'%20fill='%23dfe6ff'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='74.5'%20cy='77.8'%20r='0.65'%20fill='%23dfe6ff'%20fill-opacity='0.49'/%3E%3Ccircle%20cx='126.2'%20cy='158.4'%20r='0.67'%20fill='%23f2f4ff'%20fill-opacity='0.19'/%3E%3Ccircle%20cx='130.2'%20cy='93.5'%20r='0.71'%20fill='%23f2f4ff'%20fill-opacity='0.27'/%3E%3Ccircle%20cx='284.8'%20cy='272.8'%20r='0.35'%20fill='%23dfe6ff'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='283.5'%20cy='94.3'%20r='0.72'%20fill='%23f2f4ff'%20fill-opacity='0.54'/%3E%3Ccircle%20cx='141.4'%20cy='273.1'%20r='0.84'%20fill='%23f2f4ff'%20fill-opacity='0.35'/%3E%3Ccircle%20cx='330.5'%20cy='14.2'%20r='0.96'%20fill='%23f2f4ff'%20fill-opacity='0.3'/%3E%3Ccircle%20cx='362.8'%20cy='142.8'%20r='0.75'%20fill='%23dfe6ff'%20fill-opacity='0.21'/%3E%3Ccircle%20cx='247.6'%20cy='176.9'%20r='0.45'%20fill='%23fff1d6'%20fill-opacity='0.49'/%3E%3Ccircle%20cx='145.5'%20cy='175.1'%20r='0.4'%20fill='%23fff1d6'%20fill-opacity='0.33'/%3E%3Ccircle%20cx='65.5'%20cy='2.0'%20r='0.94'%20fill='%23fff1d6'%20fill-opacity='0.51'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='700'%20height='700'%3E%3Ccircle%20cx='316.7'%20cy='391.8'%20r='1.22'%20fill='%23f2f4ff'%20fill-opacity='0.46'/%3E%3Ccircle%20cx='129.3'%20cy='358.3'%20r='0.62'%20fill='%23f2f4ff'%20fill-opacity='0.61'/%3E%3Ccircle%20cx='312.6'%20cy='99.3'%20r='0.52'%20fill='%23f2f4ff'%20fill-opacity='0.65'/%3E%3Ccircle%20cx='416.8'%20cy='277.3'%20r='0.45'%20fill='%23f2f4ff'%20fill-opacity='0.58'/%3E%3Ccircle%20cx='436.2'%20cy='582.2'%20r='0.35'%20fill='%23f2f4ff'%20fill-opacity='0.27'/%3E%3Ccircle%20cx='419.7'%20cy='544.7'%20r='0.39'%20fill='%23f2f4ff'%20fill-opacity='0.52'/%3E%3Ccircle%20cx='363.4'%20cy='448.2'%20r='0.49'%20fill='%23fff1d6'%20fill-opacity='0.55'/%3E%3Ccircle%20cx='458.4'%20cy='284.7'%20r='0.53'%20fill='%23f2f4ff'%20fill-opacity='0.67'/%3E%3Ccircle%20cx='495.5'%20cy='220.7'%20r='0.36'%20fill='%23f2f4ff'%20fill-opacity='0.38'/%3E%3Ccircle%20cx='394.2'%20cy='75.5'%20r='0.35'%20fill='%23f2f4ff'%20fill-opacity='0.38'/%3E%3Ccircle%20cx='670.6'%20cy='593.1'%20r='0.35'%20fill='%23f2f4ff'%20fill-opacity='0.34'/%3E%3Ccircle%20cx='329.0'%20cy='686.3'%20r='0.42'%20fill='%23f2f4ff'%20fill-opacity='0.28'/%3E%3Ccircle%20cx='545.0'%20cy='188.8'%20r='0.35'%20fill='%23fff1d6'%20fill-opacity='0.4'/%3E%3Ccircle%20cx='530.6'%20cy='82.6'%20r='0.37'%20fill='%23f2f4ff'%20fill-opacity='0.3'/%3E%3Ccircle%20cx='325.5'%20cy='340.8'%20r='0.7'%20fill='%23f2f4ff'%20fill-opacity='0.33'/%3E%3Ccircle%20cx='689.7'%20cy='538.7'%20r='0.43'%20fill='%23fff1d6'%20fill-opacity='0.42'/%3E%3Ccircle%20cx='294.5'%20cy='149.0'%20r='0.37'%20fill='%23dfe6ff'%20fill-opacity='0.69'/%3E%3Ccircle%20cx='698.5'%20cy='13.7'%20r='0.36'%20fill='%23f2f4ff'%20fill-opacity='0.7'/%3E%3Ccircle%20cx='29.5'%20cy='102.5'%20r='0.44'%20fill='%23dfe6ff'%20fill-opacity='0.25'/%3E%3Ccircle%20cx='581.2'%20cy='270.3'%20r='0.35'%20fill='%23f2f4ff'%20fill-opacity='0.34'/%3E%3Ccircle%20cx='10.9'%20cy='258.1'%20r='0.61'%20fill='%23fff1d6'%20fill-opacity='0.31'/%3E%3Ccircle%20cx='582.7'%20cy='95.0'%20r='0.41'%20fill='%23dfe6ff'%20fill-opacity='0.53'/%3E%3C/svg%3E"),
      linear-gradient(to bottom, var(--p-night) 0, var(--p-cosmos) clamp(160px, 18vw, 280px), var(--p-cosmos) 80%, var(--p-sky-top) 100%);
    background-size: 420px 420px, 700px 700px, auto;
    background-position: 0 0, 137px 211px, 0 0;
  }

  /* O fim da jornada desce para o tom exato do topo da ilustração do rodapé, por cima da via láctea: sem corte. */
  .journey::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    z-index: -1;
    height: min(60vh, 520px);
    background: linear-gradient(to bottom, rgb(16 41 92 / 0), var(--p-sky-top) 88%);
    pointer-events: none;
  }

  .journey__sky {
    position: sticky;
    top: 0;
    z-index: -1;
    display: block;
    height: 100lvh;
    margin-block-end: -100lvh;
    overflow: hidden;
    pointer-events: none;
  }

  .journey__light,
  .journey__glints {
    position: absolute;
    inset: -50% -30%;
    transform: rotate(-6deg);
  }

  /* A via láctea: uma faixa diagonal de luz azulada, só degradê (sem textura que repita). */
  .journey__light {
    background:
      radial-gradient(22% 9% at 46% 52%, rgb(170 176 235 / 0.07), rgb(170 176 235 / 0) 100%),
      linear-gradient(118deg, rgb(120 132 210 / 0) 36%, rgb(120 132 210 / 0.05) 45%, rgb(150 160 230 / 0.09) 50%, rgb(120 132 210 / 0.04) 56%, rgb(120 132 210 / 0) 64%);
  }

  /* Pontos finos só dentro da faixa: o brilho da via láctea. */
  .journey__glints {
    background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='260'%20height='260'%3E%3Cfilter%20id='g'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='1.3'%20numOctaves='1'%20seed='7'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20values='0%200%200%200%20.9%200%200%200%200%20.93%200%200%200%200%201%209%200%200%200%20-6.4'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url%28%23g%29'/%3E%3C/svg%3E");
    background-size: 260px 260px;
    -webkit-mask-image: linear-gradient(118deg, transparent 42%, #000 50%, transparent 58%);
    mask-image: linear-gradient(118deg, transparent 42%, #000 50%, transparent 58%);
    opacity: 0.35;
  }

  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .journey__light,
      .journey__glints {
        animation: sky-turn linear both;
        animation-timeline: --journey;
        animation-range: cover 0% cover 100%;
      }
    }
  }

  @keyframes sky-turn {
    from {
      transform: rotate(-12deg) translateY(10%);
    }
    to {
      transform: rotate(4deg) translateY(-10%);
    }
  }

  .journey__inner {
    position: relative;
    padding-block-end: var(--space-9);
  }

  /* ---------- Capítulos: cada um abre num fio âmbar (o horizonte) com a hora em mono, como o HUD ---------- */
  .chapter {
    position: relative;
    padding-block: var(--space-6) clamp(64px, 3rem + 4vw, 128px);
    border-block-start: var(--border-hairline) solid color-mix(in oklab, var(--p-sun) 70%, transparent);
  }

  .chapter:first-child {
    border-block-start: 0;
    padding-block-start: var(--space-8);
  }

  .mark {
    display: flex;
    gap: var(--space-3);
    margin-block-end: var(--space-7);
    color: var(--color-text-soft);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    letter-spacing: 0.08em;
    line-height: var(--leading-ui);
    text-transform: uppercase;
  }

  .mark span {
    color: var(--p-sun-light);
    font-variant-numeric: tabular-nums;
  }

  .chapter h2 {
    font-size: var(--step-4);
    line-height: var(--leading-display);
  }

  .chapter-head {
    display: grid;
    gap: var(--space-4);
    margin-block-end: var(--space-7);
  }

  .chapter-head__intro {
    max-width: 52ch;
    color: var(--color-text-soft);
  }

  @media (min-width: 960px) {
    .chapter-head {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: end;
    }

    .chapter-head h2 {
      grid-column: 1 / span 5;
    }

    .chapter-head__intro {
      grid-column: 7 / span 6;
    }
  }

  /* ---------- Arquitetura: três frentes lado a lado, cada uma com problema, entrega e evidência ---------- */
  .offer__list {
    display: grid;
    gap: var(--space-5);
    border-block-start: 2px solid var(--color-text);
  }

  .offer__item {
    display: grid;
    align-content: start;
    gap: var(--space-5);
    padding-block: var(--space-5);
  }

  .offer__item + .offer__item {
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .offer__title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--step-3);
    line-height: var(--leading-heading);
    letter-spacing: var(--tracking-display);
  }

  .offer__part {
    display: grid;
    align-content: start;
    gap: var(--space-2);
  }

  .offer__label {
    color: var(--color-text-soft);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    letter-spacing: 0.04em;
  }

  .offer__problem {
    max-width: 44ch;
    font-size: var(--step-1);
    line-height: 1.5;
  }

  .offer__delivers {
    display: grid;
    gap: var(--space-2);
    max-width: 44ch;
    color: var(--color-text-soft);
  }

  .offer__delivers li {
    padding-inline-start: var(--space-4);
    background: linear-gradient(var(--p-sun-light) 0 0) 0 0.72em / 8px 1px no-repeat;
  }

  @media (min-width: 960px) {
    .offer__list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(4, auto);
      column-gap: var(--grid-gap);
    }

    /* Subgrid: título, problema, entrega e evidência alinhados entre as três colunas. */
    .offer__item {
      grid-row: span 4;
      grid-template-rows: subgrid;
    }

    .offer__item + .offer__item {
      border-block-start: 0;
      border-inline-start: var(--border-hairline) solid var(--color-rule);
      padding-inline-start: var(--grid-gap);
    }
  }

  .offer__cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-5);
    margin-block-start: var(--space-7);
    color: var(--color-text-soft);
  }

  /* ---------- Como cheguei aqui ---------- */
  .story {
    display: grid;
    gap: var(--space-6);
  }

  .story__body {
    display: grid;
    gap: var(--space-4);
    max-width: 58ch;
    font-size: var(--step-2);
    line-height: 1.5;
  }

  .story__body p:last-child {
    font-size: var(--step-1);
  }

  @media (min-width: 960px) {
    .story,
    .agents-call,
    .now {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .story .mark,
    .agents-call .mark,
    .now .mark {
      grid-column: 1 / -1;
      margin-block-end: var(--space-5);
    }

    .story h2,
    .agents-call h2,
    .now h2 {
      grid-column: 1 / span 5;
    }

    .story__body,
    .agents-call__body,
    .now__body {
      grid-column: 7 / span 6;
    }
  }

  /* ---------- Projetos ---------- */
  .project-list {
    border-block-start: 2px solid var(--color-text);
  }

  .project {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-5);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .project__name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--step-4);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
  }

  .project__name a {
    display: inline-block;
    color: var(--color-text);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.12em;
    transition:
      transform 220ms var(--ease-out),
      text-decoration-color var(--dur-ui) ease;
  }

  .project__name a:active {
    transform: scale(var(--press-scale));
  }

  .project:has(:focus-visible) .project__name a {
    transform: translateX(6px);
    text-decoration-color: var(--color-sun);
  }

  @media (hover: hover) and (pointer: fine) {
    .project:hover .project__name a {
      transform: translateX(6px);
      text-decoration-color: var(--color-sun);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .project__name a,
    .project:has(:focus-visible) .project__name a {
      transform: none;
    }

    @media (hover: hover) and (pointer: fine) {
      .project:hover .project__name a {
        transform: none;
      }
    }
  }

  .project__body {
    display: grid;
    gap: var(--space-2);
  }

  .project__question {
    max-width: 44ch;
    font-size: var(--step-2);
    line-height: 1.35;
  }

  .project__description {
    max-width: 62ch;
    color: var(--color-text-soft);
    font-size: var(--step-0);
    line-height: 1.55;
  }

  .project__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
  }

  .project__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-family: var(--font-mono);
    font-size: var(--step--1);
    line-height: var(--leading-ui);
    color: var(--color-text-faint);
  }

  @media (min-width: 960px) {
    .project {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .project__name {
      grid-column: 1 / span 3;
    }

    .project__body {
      grid-column: 4 / span 5;
    }

    .project__meta {
      grid-column: 9 / span 4;
      padding-inline-start: var(--grid-gap);
    }
  }

  .projects__all {
    margin-block-start: var(--space-5);
  }

  /* ---------- Agentes ---------- */
  .agents-call {
    display: grid;
    gap: var(--space-4);
  }

  .agents-call__body {
    display: grid;
    gap: var(--space-3);
    max-width: 60ch;
  }

  .agents-call__body a {
    font-family: var(--font-display);
    font-size: var(--step-2);
    line-height: var(--leading-heading);
  }

  /* ---------- Agora: registro curto, rótulo mono à esquerda, o que é à direita ---------- */
  .now {
    display: grid;
    gap: var(--space-4);
  }

  .now__body {
    display: grid;
    gap: var(--space-4);
    max-width: 60ch;
  }

  .now__list {
    display: grid;
    margin: 0;
  }

  .now__row {
    display: grid;
    grid-template-columns: 9.5rem minmax(0, 1fr);
    gap: var(--space-4);
    align-items: baseline;
    padding-block: var(--space-3);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .now__row:last-child {
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .now__list dt,
  .now__updated {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .now__list dd {
    margin: 0;
    font-size: var(--step-1);
    line-height: 1.45;
  }

  @media (max-width: 479px) {
    .now__row {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }
  }

  /* ---------- Escrita ---------- */
  .writing__more {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-6);
    margin-block-start: var(--space-5);
  }
</style>
