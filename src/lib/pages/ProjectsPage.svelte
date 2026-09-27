<!--
  Índice de projetos numa lista só, do commit mais recente ao mais antigo (a ordem que a introdução promete).
  Quem tem estudo de caso ganha a pergunta que o case responde e o link; os outros levam à ficha. Cada item
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
  <h1>{data.locale === 'en' ? 'Projects' : 'Projetos'}</h1>
  <p class="lead">{t.openSource.intro}</p>
</header>

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
          {#if project.caseStudy && data.locale === 'pt-BR'}
            <p class="case-entry__question">{project.caseStudy.question}</p>
          {/if}
          <p class="case-entry__text">{project.caseStudy && data.locale === 'pt-BR' ? project.caseStudy.dek : project.description}</p>
          <p class="case-entry__links">
            {#if project.caseStudy}
              <a href={project.caseStudy.href} hreflang={project.caseStudy.hreflang}>{t.openSource.readCase}<span class="visually-hidden">: {project.name}</span></a>
            {:else}
              <a href={project.href}>{data.locale === 'en' ? 'Project page' : 'Ficha do projeto'}<span class="visually-hidden">: {project.name}</span></a>
            {/if}
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
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .case-entry:first-child {
    border-block-start: 2px solid var(--color-text);
  }

  .case-entry__name {
    font-size: var(--step-4);
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






  .areas__body {
    display: grid;
    gap: var(--space-4);
    max-width: 44em;
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

    .cases {
      grid-column: 1 / -1;
    }

    .areas__body {
      grid-column: 4 / -1;
    }

    .block__title {
      align-self: start;
      padding-block-start: var(--space-5);
    }

    .case-entry {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .case-entry__name {
      grid-column: 1 / span 3;
    }

    .case-entry__body {
      grid-column: 4 / span 6;
    }

    .ficha {
      grid-column: 10 / span 3;
    }
  }
</style>
