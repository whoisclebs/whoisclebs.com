<script lang="ts">
  import DecisionMap from '$lib/components/decision-map/DecisionMap.svelte'
  import { formatDate, getMessages } from '$lib/i18n'
  import WritingList from '$lib/components/writing/WritingList.svelte'
  import { notePath, pagePath, pages, projectPath } from '$lib/routing/paths'
  import type { homeData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof homeData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.home)
  // Contato só existe em pt-BR; no inglês o link aponta para a página em português, marcada com hreflang.
  const contactHref = $derived(pagePath('contact', data.locale) ?? pages.contact['pt-BR'])
  const contactLang = $derived(pagePath('contact', data.locale) ? undefined : 'pt-BR')
  const caseHref = $derived(projectPath('tuxedo', data.locale))
  const feedHref = $derived(data.locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')

  /** `project:<slug>` ou `note:<slug>` → link interno; notas só existem em pt-BR (hreflang no inglês). */
  function siteLink(target: string): { href: string; hreflang?: string } {
    const [kind, slug = ''] = target.split(':')
    if (kind === 'note') return { href: notePath(slug), hreflang: data.locale === 'en' ? 'pt-BR' : undefined }
    return { href: projectPath(slug, data.locale) }
  }

  const studies = $derived(data.projects.filter((project) => project.caseStudy))
  const others = $derived(data.projects.filter((project) => !project.caseStudy))

  // Agentes só existe em pt-BR: no inglês o link leva hreflang.
  const agentsHreflang = $derived(data.locale === 'en' ? ('pt-BR' as const) : undefined)
  const mapLinks = $derived({
    http: { href: caseHref },
    payments: { href: pages.about[data.locale] },
    agents: { href: pages.agents['pt-BR'], hreflang: agentsHreflang },
  })
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="hero__text">
    <h1 id="hero-title" class="hero__title">{copy.title}</h1>
    <p class="hero__support">{copy.support}</p>
    <p class="hero__actions">
      <a class="button button--primary" href={caseHref}>{copy.ctaPrimary}</a>
      <a class="button" href={contactHref} hreflang={contactLang}>{copy.ctaSecondary}</a>
    </p>
  </div>
  <div class="hero__apparatus">
    <DecisionMap copy={copy.map} links={mapLinks} />
  </div>
</section>

<section class="manifesto" aria-labelledby="manifesto-title">
  <header class="chapter-head">
    <h2 id="manifesto-title">{copy.manifesto.title}</h2>
    <p class="chapter-head__intro">{copy.manifesto.intro}</p>
  </header>
  <ul class="claims list-reset">
    {#each copy.manifesto.items as item (item.claim)}
      {@const site = siteLink(item.siteTarget)}
      <li class="claim">
        <h3 class="claim__title">{item.claim}</h3>
        <div class="claim__body">
          <p class="claim__text">{item.text}</p>
          <figure class="claim__proof">
            <figcaption class="claim__label">{copy.manifesto.exampleLabel}</figcaption>
            <p>{item.example}</p>
            <p class="claim__links">
              {#if item.sourceHref}
                <a class="claim__source" href={item.sourceHref} rel="noopener noreferrer">{item.sourceLabel}</a>
              {/if}
              <a href={site.href} hreflang={site.hreflang}>{item.siteLabel}</a>
            </p>
          </figure>
        </div>
      </li>
    {/each}
  </ul>
</section>

<!-- Casos: os dois estudos de caso em página própria (só pt-BR; no inglês o link leva hreflang) + a lista dos outros projetos. -->
<section class="chapter cases" aria-labelledby="cases-title" data-slot="cases">
  <header class="chapter-head">
    <h2 id="cases-title">{copy.cases.title}</h2>
    <p class="chapter-head__intro">{copy.cases.intro}</p>
  </header>
  <ul class="studies list-reset">
    {#each studies as project (project.slug)}
      <li class="study">
        <h3 class="study__name"><a href={project.caseStudy?.href} hreflang={project.caseStudy?.hreflang}>{project.name}</a></h3>
        {#if data.locale === 'pt-BR'}
          <p class="study__question">{project.caseStudy?.question}</p>
        {/if}
        <p class="study__text">{data.locale === 'pt-BR' ? project.caseStudy?.dek : project.description}</p>
        <p class="study__meta">
          <span>{project.technologies.join(', ')}</span>
          <span>{copy.cases.lastCommit} <time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, data.locale)}</time></span>
        </p>
        <p class="study__links">
          <a href={project.caseStudy?.href} hreflang={project.caseStudy?.hreflang}>{copy.cases.readCase}<span class="visually-hidden">: {project.name}</span></a>
          <a href={project.repo} rel="noopener noreferrer">{copy.cases.code}<span class="visually-hidden">: {project.name}</span></a>
        </p>
      </li>
    {/each}
  </ul>
  <h3 class="others-title">{copy.cases.others}</h3>
  <ul class="projects list-reset">
    {#each others as project (project.slug)}
      <li class="project">
        <h4 class="project__name"><a href={project.href}>{project.name}</a></h4>
        <p class="project__description">{project.description}</p>
        <p class="project__stack"><span>{project.technologies.join(', ')}</span> <span>{copy.cases.lastCommit} <time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, data.locale)}</time></span></p>
      </li>
    {/each}
  </ul>
  <p><a href={pages.projects[data.locale]}>{copy.cases.all}</a></p>
</section>

<!-- Capítulo 4 (spec §2): IA agêntica em página própria; aqui só a chamada, com o status em texto. -->
<section class="chapter agents-call" aria-labelledby="agents-title" data-slot="agents">
  <h2 id="agents-title">{copy.agents.title}</h2>
  <div class="agents-call__body">
    <p>{copy.agents.intro}</p>
    <p><a href={pages.agents['pt-BR']} hreflang={agentsHreflang}>{copy.agents.link}</a></p>
  </div>
</section>

<div class="chapter writing-now">
  <section class="writing" aria-labelledby="writing-title">
    <header class="chapter-head chapter-head--stacked">
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

  <section class="now" aria-labelledby="now-title">
    <h2 id="now-title" class="now__title">{copy.now.title}</h2>
    <dl class="now__list">
      {#each copy.now.items as item, index (item)}
        <div>
          <dt>{copy.now.labels[index]}</dt>
          <dd>{item}</dd>
        </div>
      {/each}
    </dl>
    <p class="now__updated">{copy.now.updatedLabel} <time datetime={copy.now.updatedAt}>{formatDate(copy.now.updatedAt, data.locale)}</time></p>
  </section>
</div>

<style>
  /* Hero: texto em 8 colunas + aparato em 4 no desktop (≥ 960 px, grade de 12); empilhado abaixo disso. */
  .hero {
    display: grid;
    gap: var(--space-7);
    padding-block: var(--space-5) var(--space-8);
  }

  @media (min-width: 960px) {
    .hero {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .hero__text {
      grid-column: 1 / span 8;
    }

    .hero__apparatus {
      grid-column: 9 / span 4;
    }
  }

  .hero__text {
    display: grid;
    gap: var(--space-6);
    align-content: start;
  }

  /* 48 px em 390, ~67 px em 768 (duas linhas, nada de palavra por linha), teto de 88 px no desktop. */
  .hero__title {
    font-size: clamp(3rem, 1.6rem + 5.4vw, 5.5rem);
    line-height: 1.02;
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }

  .hero__support {
    max-width: 58ch;
    font-size: var(--step-2);
    line-height: 1.45;
    color: var(--color-text-soft);
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .hero__actions .button {
    transition: transform var(--dur-press) var(--ease-out);
  }

  @media (max-width: 639px) {
    .hero__actions .button {
      flex: 1 1 100%;
      justify-content: center;
    }
  }

  .hero__actions .button:active {
    transform: scale(var(--press-scale));
  }

  /* ---------- Ritmo depois do hero: respiro (manifesto) → lista quieta (casos) → índice denso + Agora ---------- */
  .chapter,
  .manifesto {
    padding-block: var(--space-chapter);
  }

  /* A lista de projetos é o trecho quieto: o respiro grande fica antes (depois do manifesto), não depois. */
  .cases {
    padding-block-end: var(--space-8);
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
    .chapter-head:not(.chapter-head--stacked) {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: end;
    }

    .chapter-head:not(.chapter-head--stacked) h2 {
      grid-column: 1 / span 6;
    }

    .chapter-head:not(.chapter-head--stacked) .chapter-head__intro {
      grid-column: 8 / span 5;
    }
  }

  /* Capítulo 4, IA agêntica: só a chamada, entre um fio e outro; o capítulo vive em /agentes/. */
  .agents-call {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-7);
    border-block-start: var(--border-hairline) solid var(--color-text);
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

  @media (min-width: 960px) {
    .agents-call {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .agents-call h2 {
      grid-column: 1 / span 5;
    }

    .agents-call__body {
      grid-column: 7 / span 6;
    }
  }

  /* A chamada já fecha com fio; a escrita não precisa do respiro inteiro de capítulo depois dela. */
  .agents-call + .writing-now {
    padding-block-start: var(--space-8);
  }

  /* Manifesto: faixa de página inteira sem sair da grade (border-image pinta até as bordas da janela
     como ink overflow, sem criar rolagem horizontal). */
  .manifesto {
    border-image-source: linear-gradient(var(--color-band), var(--color-band));
    border-image-slice: 0 fill;
    border-image-outset: 0 100vw;
  }

  .claim {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-7);
    border-block-start: var(--border-hairline) solid var(--color-text);
  }

  .claim:last-child {
    padding-block-end: 0;
  }

  .claim__title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--step-4);
    line-height: var(--leading-heading);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }

  .claim__body {
    display: grid;
    gap: var(--space-5);
    align-content: start;
  }

  .claim__text {
    max-width: 52ch;
    font-size: var(--step-2);
    line-height: 1.45;
  }

  .claim__proof {
    display: grid;
    gap: var(--space-2);
    max-width: 60ch;
    padding-inline-start: var(--space-4);
    border-inline-start: 2px solid var(--color-accent);
    color: var(--color-text-soft);
    font-size: var(--step-0);
    line-height: 1.55;
  }

  .claim__label {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .claim__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
  }

  .claim__source {
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  @media (min-width: 960px) {
    .claim {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .claim__title {
      grid-column: 1 / span 5;
    }

    .claim__body {
      grid-column: 7 / span 6;
    }
  }

  /* Casos: dois estudos lado a lado (6 + 6 colunas, fio vertical entre eles); outros projetos em lista quieta. */
  .studies {
    display: grid;
    border-block-start: 2px solid var(--color-text);
    margin-block-end: var(--space-8);
  }

  .study {
    display: grid;
    align-content: start;
    gap: var(--space-4);
    padding-block: var(--space-6);
  }

  .study + .study {
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .study__name {
    font-size: var(--step-5);
    line-height: var(--leading-display);
  }

  .study__name a {
    color: var(--color-text);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.12em;
  }

  .study__question {
    max-width: 30ch;
    font-size: var(--step-2);
    line-height: 1.35;
  }

  .study__text {
    max-width: 52ch;
    color: var(--color-text-soft);
  }

  .study__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .study__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
  }

  @media (min-width: 960px) {
    .studies {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .study {
      grid-column: span 6;
      padding-block-end: 0;
    }

    .study + .study {
      border-block-start: 0;
      padding-inline-start: var(--grid-gap);
      border-inline-start: var(--border-hairline) solid var(--color-rule);
    }
  }

  .others-title {
    margin-block-end: var(--space-4);
    font-size: var(--step-2);
  }

  .projects {
    border-block-start: var(--border-hairline) solid var(--color-text);
    margin-block-end: var(--space-5);
  }

  .project {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-4);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .project__name {
    font-size: var(--step-2);
  }

  .project__description {
    max-width: 62ch;
    color: var(--color-text-soft);
    font-size: var(--step-0);
    line-height: 1.55;
  }

  .project__stack {
    display: flex;
    flex-wrap: wrap;
    gap: 2px var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  @media (min-width: 960px) {
    .project {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: baseline;
    }

    .project__name {
      grid-column: 1 / span 3;
    }

    .project__description {
      grid-column: 4 / span 7;
    }

    .project__stack {
      grid-column: 11 / span 2;
      justify-content: end;
      text-align: end;
    }
  }

  /* Escrita (8 colunas) + Agora (3 colunas) lado a lado no desktop. */
  .writing-now {
    display: grid;
    gap: var(--space-8);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  @media (min-width: 960px) {
    .writing-now {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .writing {
      grid-column: 1 / span 8;
    }

    .now {
      grid-column: 10 / span 3;
      position: sticky;
      top: var(--space-6);
    }
  }

  .writing__more {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-6);
    margin-block-start: var(--space-5);
  }

  .now {
    display: grid;
    gap: var(--space-4);
    padding-block-start: var(--space-4);
    border-block-start: 2px solid var(--color-text);
  }

  .now__title {
    font-size: var(--step-3);
  }

  .now__list {
    display: grid;
    gap: var(--space-4);
  }

  .now__list dt,
  .now__updated {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .now__list dd {
    margin: 0;
    font-size: var(--step-0);
    line-height: 1.5;
  }
</style>
