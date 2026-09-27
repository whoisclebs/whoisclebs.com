<!--
  Índice editorial de projetos: os cases primeiro, com a pergunta que cada um responde; depois os outros
  projetos numa lista de ficha (status conferido, linguagem, último commit com data e link, código).
  Nada de grade de cartões iguais: o peso visual acompanha o quanto há para ler.
-->
<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { pagePathOrDefault } from '$lib/routing/paths'
  import type { projectsData } from '$lib/server/pages'
  import ProjectStatus from './ProjectStatus.svelte'

  let { data }: { data: ReturnType<typeof projectsData> } = $props()

  const t = $derived(getMessages(data.locale))
  const cases = $derived(data.projects.filter((project) => project.caseStudy))
  const others = $derived(data.projects.filter((project) => !project.caseStudy))
</script>

<header class="page-header">
  <h1>{data.locale === 'en' ? 'Projects' : 'Projetos'}</h1>
  <p class="lead">{t.openSource.intro}</p>
</header>

<section class="block" aria-labelledby="cases-title">
  <h2 id="cases-title" class="block__title">{t.openSource.caseStudies}</h2>
  <ol class="cases list-reset">
    {#each cases as project (project.slug)}
      <li class="case-entry">
        <h3 class="case-entry__name">
          <a href={project.caseStudy?.href} hreflang={project.caseStudy?.hreflang}>{project.name}</a>
        </h3>
        <div class="case-entry__body">
          {#if data.locale === 'pt-BR'}
            <p class="case-entry__question">{project.caseStudy?.question}</p>
          {/if}
          <p class="case-entry__text">{data.locale === 'pt-BR' ? project.caseStudy?.dek : project.description}</p>
          <p class="case-entry__links">
            <a href={project.caseStudy?.href} hreflang={project.caseStudy?.hreflang}>{t.openSource.readCase}<span class="visually-hidden">: {project.name}</span></a>
            <a href={project.repo} rel="noopener noreferrer">{t.openSource.code}<span class="visually-hidden">: {project.name}</span></a>
          </p>
        </div>
        <dl class="ficha">
          <div><dt>{t.openSource.status}</dt><dd><ProjectStatus locale={data.locale} status={project.status} checkedAt={project.statusCheckedAt} prefix={false} /></dd></div>
          <div><dt>{t.openSource.language}</dt><dd>{project.technologies.join(', ')}</dd></div>
          <div>
            <dt>{t.openSource.lastCommit}</dt>
            <dd><a href={project.lastCommit.url} rel="noopener noreferrer"><time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, data.locale)}</time></a></dd>
          </div>
        </dl>
      </li>
    {/each}
  </ol>
</section>

<section class="block" aria-labelledby="others-title">
  <h2 id="others-title" class="block__title">{t.openSource.otherProjects}</h2>
  <ul class="others list-reset">
    {#each others as project (project.slug)}
      <li class="other">
        <h3 class="other__name"><a href={project.href}>{project.name}</a></h3>
        <p class="other__description">{project.description}</p>
        <dl class="ficha ficha--row">
          <div><dt>{t.openSource.status}</dt><dd><ProjectStatus locale={data.locale} status={project.status} checkedAt={project.statusCheckedAt} prefix={false} /></dd></div>
          <div><dt>{t.openSource.language}</dt><dd>{project.technologies.join(', ')}</dd></div>
          <div>
            <dt>{t.openSource.lastCommit}</dt>
            <dd><a href={project.lastCommit.url} rel="noopener noreferrer"><time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, data.locale)}</time></a></dd>
          </div>
          <div><dt>{t.openSource.code}</dt><dd><a href={project.repo} rel="noopener noreferrer">{project.repo.replace('https://github.com/', '')}</a></dd></div>
        </dl>
      </li>
    {/each}
  </ul>
</section>

<section class="block areas" aria-labelledby="areas-title">
  <h2 id="areas-title" class="block__title">{t.portfolio.title}</h2>
  <div class="areas__body">
    <p class="areas__lead">{t.portfolio.description}</p>
    <p class="areas__note">{t.openSource.areasNote}</p>
    <ul class="areas__list list-reset" aria-label={t.portfolio.areasLabel}>
      {#each t.portfolio.projects as area (area.name)}
        <li>
          <h3>{area.name}</h3>
          <p>{area.summary}</p>
          <p class="areas__stack">{area.stack}</p>
        </li>
      {/each}
    </ul>
    <p>{t.portfolio.ctaText} <a href={pagePathOrDefault('about', data.locale)}>{t.portfolio.ctaLink}</a></p>
  </div>
</section>

<style>
  .block {
    display: grid;
    gap: var(--space-6);
    padding-block: var(--space-8);
  }

  .block + .block {
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .block:first-of-type {
    padding-block-start: 0;
  }

  .block__title {
    font-size: var(--step-3);
  }

  .cases {
    display: grid;
  }

  .case-entry {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-6);
    border-block-start: 2px solid var(--color-text);
  }

  .case-entry__name {
    font-size: var(--step-5);
    line-height: var(--leading-display);
  }

  .case-entry__name a {
    color: var(--color-text);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.12em;
  }

  .case-entry__body {
    display: grid;
    gap: var(--space-3);
    max-width: 40em;
  }

  .case-entry__question {
    font-size: var(--step-2);
    line-height: 1.35;
  }

  .case-entry__text {
    color: var(--color-text-soft);
  }

  .case-entry__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
  }

  .ficha {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    align-content: start;
  }

  .ficha div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .ficha dt {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .ficha dd {
    margin: 0;
    font-size: var(--step-0);
    overflow-wrap: anywhere;
  }

  .ficha dd :global(.meta) {
    font-family: var(--font-text);
    font-size: var(--step-0);
    letter-spacing: 0;
    color: var(--color-text);
  }

  .ficha--row {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
  }

  .others {
    display: grid;
  }

  .other {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-5);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .other__name {
    font-size: var(--step-3);
  }

  .other__description {
    max-width: 60ch;
    color: var(--color-text-soft);
  }

  .areas__body {
    display: grid;
    gap: var(--space-4);
    max-width: 44em;
  }

  .areas__lead {
    font-size: var(--step-1);
  }

  .areas__note {
    justify-self: start;
    padding: var(--space-1) var(--space-3);
    border: var(--border-hairline) dashed var(--color-text-soft);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .areas__list {
    display: grid;
    gap: var(--space-4);
  }

  .areas__list li {
    display: grid;
    gap: var(--space-1);
    padding-block-start: var(--space-3);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .areas__list h3 {
    font-family: var(--font-text);
    font-size: var(--step-1);
    font-weight: 600;
    line-height: var(--leading-ui);
  }

  .areas__stack {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  @media (min-width: 960px) {
    .block {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .block__title {
      grid-column: 1 / span 3;
    }

    .cases,
    .others,
    .areas__body {
      grid-column: 4 / -1;
    }

    .block__title {
      align-self: start;
      padding-block-start: var(--space-5);
    }

    .case-entry {
      grid-template-columns: repeat(9, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .case-entry__name {
      grid-column: 1 / -1;
    }

    .case-entry__body {
      grid-column: 1 / span 6;
    }

    .ficha:not(.ficha--row) {
      grid-column: 8 / span 2;
    }
  }
</style>
