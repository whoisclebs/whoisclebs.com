<!--
  Índice de projetos numa lista só, do commit mais recente ao mais antigo (a ordem que a introdução promete).
  Quem tem estudo de caso ganha o resumo do texto e o link; os outros levam à ficha. Cada item
  tem ficha com status conferido, linguagem e último commit com data e link.
-->
<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { pagePathOrDefault } from '$lib/routing/paths'
  import type { projectsData } from '$lib/server/pages'
  import ProjectStatus from './ProjectStatus.svelte'

  let { data }: { data: ReturnType<typeof projectsData> } = $props()

  const t = $derived(getMessages(data.locale))
</script>

<header class="page-header">
  <div class="page">
    <h1>{data.locale === 'en' ? 'Projects' : 'Projetos'}</h1>
    <p class="lead">{t.openSource.intro}</p>
  </div>
</header>

<div class="page page-body">
<!-- Uma lista só, do commit mais recente ao mais antigo (ordem de `projectCards`); o case é um link a mais. -->
<section class="block" aria-labelledby="h-open-source">
  <h2 id="h-open-source" class="visually-hidden">{t.openSource.title}</h2>
  <ol class="cases list-reset">
    {#each data.projects as project (project.slug)}
      {@const primary = project.caseStudy?.href ?? project.href}
      <li class="case-entry" data-case={project.caseStudy ? 'true' : undefined}>
        <h3 class="case-entry__name">
          <a href={primary} hreflang={project.caseStudy?.hreflang}>{project.name}</a>
        </h3>
        <div class="case-entry__body">
          <p class="case-entry__text">{project.caseStudy && data.locale === 'pt-BR' ? project.caseStudy.dek : project.description}</p>
          <p class="case-entry__links">
            {#if project.caseStudy}
              <a class="link-lit" href={project.caseStudy.href} hreflang={project.caseStudy.hreflang}>{t.openSource.readCase}<span class="visually-hidden">: {project.name}</span><span class="arrow" aria-hidden="true">→</span></a>
            {:else}
              <a class="link-lit" href={project.href}>{data.locale === 'en' ? 'Project page' : 'Ficha do projeto'}<span class="visually-hidden">: {project.name}</span><span class="arrow" aria-hidden="true">→</span></a>
            {/if}
            <a class="link-ext" href={project.repo} rel="noopener noreferrer">{t.openSource.code}<span class="visually-hidden">: {project.name}</span><span class="arrow" aria-hidden="true">↗</span></a>
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

<section class="block areas" aria-labelledby="areas-title">
  <h2 id="areas-title" class="block__title">{t.portfolio.title}</h2>
  <div class="areas__body">
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
</div>

<style>
  .block {
    display: grid;
    gap: var(--space-6);
    padding-block: var(--space-section);
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
    counter-reset: project;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  /* "Ideias em construção" do design: número em mono, nome em Space Grotesk, descrição e link com seta. */
  .case-entry {
    display: grid;
    gap: var(--space-4);
    padding-block: 26px var(--space-7);
    border-block-end: var(--border-hairline) solid var(--color-rule-soft);
    counter-increment: project;
  }

  .case-entry__name {
    font-size: var(--step-4);
    line-height: var(--leading-display);
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }

  /* Número decorativo (contador CSS): fora do nome acessível do título. */
  .case-entry::before {
    content: counter(project, decimal-leading-zero);
    grid-column: 1 / -1;
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .case-entry__name a {
    color: var(--color-text);
    text-decoration: none;
    transition: color var(--dur-ui) ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .case-entry__name a:hover {
      color: var(--color-accent);
    }
  }

  .case-entry__body {
    display: grid;
    gap: var(--space-3);
    max-width: 40em;
  }

  .case-entry__text {
    color: var(--color-text-soft);
  }

  .case-entry__links {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--space-5);
  }

  .case-entry__links a {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    font-size: var(--step--1);
  }

  .case-entry__links .arrow {
    color: var(--color-accent);
    transition: transform var(--dur-ui) var(--ease-out);
  }

  @media (hover: hover) and (pointer: fine) {
    .case-entry__links a:hover .arrow {
      transform: translateX(3px);
    }
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
    font-size: var(--step--2);
    color: var(--color-text-faint);
  }

  .ficha dd {
    margin: 0;
    font-size: var(--step--1);
    overflow-wrap: anywhere;
  }

  .ficha dd :global(.meta) {
    font-family: var(--font-text);
    font-size: var(--step--1);
    letter-spacing: 0;
    color: var(--color-text);
  }

  .areas__body {
    display: grid;
    gap: var(--space-4);
    max-width: 44em;
  }

  /* Aviso de método: etiqueta em pílula de contorno fino. */
  .areas__note {
    justify-self: start;
    padding: var(--space-1) var(--space-3);
    border: var(--border-hairline) solid var(--color-rule);
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .areas__list {
    display: grid;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .areas__list li {
    display: grid;
    gap: var(--space-1);
    padding-block: 20px;
    border-block-end: var(--border-hairline) solid var(--color-rule-soft);
  }

  .areas__list h3 {
    font-size: var(--step-1);
    line-height: var(--leading-ui);
  }

  .areas__list p:not(.areas__stack) {
    color: var(--color-text-soft);
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
      align-self: start;
    }

    .cases {
      grid-column: 1 / -1;
    }

    .areas__body {
      grid-column: 4 / -1;
    }

    .case-entry {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .case-entry__name {
      grid-column: 1 / span 5;
    }

    .case-entry__body {
      grid-column: 6 / span 4;
    }

    .ficha {
      grid-column: 10 / span 3;
    }
  }
</style>
