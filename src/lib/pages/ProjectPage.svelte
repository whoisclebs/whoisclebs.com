<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { projectData } from '$lib/server/pages'
  import CasePage from './CasePage.svelte'
  import ProjectStatus from './ProjectStatus.svelte'

  let { data }: { data: Awaited<ReturnType<typeof projectData>> } = $props()

  const t = $derived(getMessages(data.locale))
  const project = $derived(data.project)
</script>

{#if data.caseStudy}
  <CasePage study={data.caseStudy} {project} other={data.otherCase} />
{:else}
<header class="page-header">
  <div class="page">
    <p class="eyebrow">{t.openSource.kicker}</p>
    <h1>{project.name}</h1>
    <p class="lead">{project.description}</p>
    <ProjectStatus locale={data.locale} status={project.status} checkedAt={project.statusCheckedAt} />
  </div>
</header>

<div class="page page-body">
<article>
  <dl class="facts">
    <div>
      <dt class="eyebrow">{t.openSource.yearLabel}</dt>
      <dd>{project.year}</dd>
    </div>
    <div>
      <dt class="eyebrow">{t.openSource.stackLabel}</dt>
      <dd>{project.technologies.join(', ')}</dd>
    </div>
    <div>
      <dt class="eyebrow">{t.openSource.lastCommit}</dt>
      <dd><a href={project.lastCommit.url} rel="noopener noreferrer"><time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, data.locale)}</time></a></dd>
    </div>
  </dl>

  {#if data.caseHref}
    <p class="case-link">
      <a class="link-arrow" href={data.caseHref} hreflang="pt-BR">{t.openSource.readCase} <span aria-hidden="true">→</span></a>
    </p>
  {/if}

  <p class="actions">
    <a class="button button--primary" href={project.repo} rel="noopener noreferrer">{t.openSource.repository}</a>
    {#if project.docs !== project.repo}
      <a class="button" href={project.docs} rel="noopener noreferrer">{t.openSource.docs}</a>
    {/if}
  </p>

  {#if data.relatedWriting.length > 0}
    <section class="related" aria-labelledby="related-writing-title">
      <h2 id="related-writing-title" class="eyebrow">{t.writing.relatedWriting}</h2>
      <ul class="list-reset">
        {#each data.relatedWriting as entry (`${entry.kind}:${entry.slug}`)}
          <li><a href={entry.href}>{entry.title}</a> <time datetime={entry.date}>{formatDate(entry.date, data.locale)}</time></li>
        {/each}
      </ul>
    </section>
  {/if}

  <p><a class="link-arrow back" href={pages.projects[data.locale]}><span aria-hidden="true">←</span> {t.openSource.backToProjects}</a></p>
</article>
</div>
{/if}

<style>
  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-5) var(--space-7);
    margin: 0 0 var(--space-7);
    padding-block: var(--space-5);
    border-block: var(--border-hairline) solid var(--color-rule);
  }

  .facts dd {
    margin: var(--space-1) 0 0;
    overflow-wrap: anywhere;
  }

  .case-link {
    margin-block-end: var(--space-7);
  }

  .back {
    margin-block-start: var(--space-4);
  }

  .back > span {
    display: inline-block;
  }

  .related {
    display: grid;
    gap: var(--space-3);
    margin-block-end: var(--space-7);
  }

  .related h2 {
    font-family: var(--font-text);
  }

  .related ul {
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .related li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-1) var(--space-5);
    padding-block: var(--space-4);
    border-block-end: var(--border-hairline) solid var(--color-rule-soft);
  }

  .related a {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-display);
    letter-spacing: -0.01em;
  }

  .related time {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-block-end: var(--space-7);
  }
</style>
