<!--
  Home no "amanhecer por rolagem" (passo 15): noite (hero com a luz rasante e o HUD no horizonte) →
  aurora (o que eu faço, como cheguei aqui) → dia (projetos, agentes, escrita e notas) → o rodapé volta à noite.
  Faixas fixas, sem degradê entre elas; a aurora só leva texto curto.
-->
<script lang="ts">
  import HeroHud from '$lib/components/hero/HeroHud.svelte'
  import HeroLight from '$lib/components/hero/HeroLight.svelte'
  import WritingList from '$lib/components/writing/WritingList.svelte'
  import ProjectStatus from './ProjectStatus.svelte'
  import { contactEmail, socialLinks } from '$lib/content/library'
  import { formatDate, getMessages } from '$lib/i18n'
  import { pagePathOrDefault, pages } from '$lib/routing/paths'
  import type { homeData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof homeData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.home)
  const feedHref = $derived(data.locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
  const githubProfile = socialLinks.find((link) => link.label === 'GitHub')?.href ?? 'https://github.com/whoisclebs'
  // Agentes só existe em pt-BR: no inglês o link leva hreflang.
  const agentsHreflang = $derived(data.locale === 'en' ? ('pt-BR' as const) : undefined)
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
  <HeroHud locale={data.locale} profileUrl={githubProfile} />
</section>

<div class="aurora band-aurora" data-band="aurora">
  <div class="page aurora__inner">
    <section class="work" aria-labelledby="work-title">
      <h2 id="work-title">{copy.work.title}</h2>
      <ul class="work__list list-reset">
        {#each copy.work.items as item (item.title)}
          <li>
            <h3 class="work__title">{item.title}</h3>
            <p>{item.text}</p>
          </li>
        {/each}
      </ul>
    </section>

    <section class="story" aria-labelledby="story-title">
      <h2 id="story-title">{copy.story.title}</h2>
      <div class="story__body">
        <p>{copy.story.text}</p>
        <p><a href={pagePathOrDefault('about', data.locale)}>{copy.story.link}</a></p>
      </div>
    </section>
  </div>
</div>

<div class="page day" data-band="day">
  <section class="chapter projects" aria-labelledby="projects-title" data-slot="cases">
    <header class="chapter-head">
      <h2 id="projects-title">{copy.cases.title}</h2>
      <p class="chapter-head__intro">{copy.cases.intro}</p>
    </header>
    <ol class="project-list list-reset">
      {#each data.projects as project (project.slug)}
        {@const primary = project.caseStudy?.href ?? project.href}
        <li class="project">
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
</div>

<style>
  /* ---------- Noite: hero. O H1 fica embaixo à esquerda, onde o vídeo é escuro e calmo. ---------- */
  .hero {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-rows: 1fr auto;
    min-height: max(560px, min(calc(100svh - 72px), 920px));
  }

  .hero__inner {
    position: relative;
    z-index: 1;
    display: grid;
    align-content: end;
    padding-block: var(--space-8) var(--space-7);
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

  /* ---------- Aurora: dois capítulos curtos, só texto em creme ---------- */
  .aurora__inner {
    display: grid;
    gap: var(--space-9);
    padding-block: var(--space-9);
  }

  .work,
  .story {
    display: grid;
    gap: var(--space-6);
  }

  .work__list {
    display: grid;
    gap: var(--space-6);
  }

  .work__list li {
    display: grid;
    gap: var(--space-2);
    padding-block-start: var(--space-4);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .work__title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--step-3);
    line-height: var(--leading-heading);
    letter-spacing: var(--tracking-display);
  }

  .work__list p {
    max-width: 46ch;
    color: var(--color-text-soft);
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
    .work,
    .story {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .work h2,
    .story h2 {
      grid-column: 1 / span 4;
    }

    /* Subgrid: título e texto de cada área alinhados entre as três colunas, mesmo com títulos de 1 e 2 linhas. */
    .work__list {
      grid-column: 5 / -1;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: auto auto;
      column-gap: var(--grid-gap);
    }

    .work__list li {
      grid-row: span 2;
      grid-template-rows: subgrid;
    }

    .story__body {
      grid-column: 5 / span 7;
    }
  }

  /* ---------- Dia: leitura em papel ---------- */
  .chapter {
    padding-block: var(--space-chapter);
  }

  .projects {
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
      grid-column: 1 / span 5;
    }

    .chapter-head:not(.chapter-head--stacked) .chapter-head__intro {
      grid-column: 7 / span 6;
    }
  }

  /* Uma lista só, do commit mais recente ao mais antigo; o case é um link a mais, não um destaque. */
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
    color: var(--color-text);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.12em;
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

  .agents-call + .writing-now {
    padding-block-start: var(--space-8);
  }

  .writing-now {
    display: grid;
    gap: var(--space-8);
    padding-block-end: var(--space-8);
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
