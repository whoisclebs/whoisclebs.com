<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { projectData } from '$lib/server/pages'
  import type { Snippet } from 'svelte'
  import CasePage from './CasePage.svelte'
  import ProjectStatus from './ProjectStatus.svelte'

  let { data, demo }: { data: Awaited<ReturnType<typeof projectData>>; demo?: Snippet } = $props()

  const t = $derived(getMessages(data.locale))
  const project = $derived(data.project)
</script>

{#if data.caseStudy}
  <CasePage study={data.caseStudy} {project} other={data.otherCase} {demo} />
{:else}
<article>
  <header class="page-header">
    <p class="eyebrow">{t.openSource.kicker}</p>
    <h1>{project.name}</h1>
    <p class="lead">{project.description}</p>
    <ProjectStatus locale={data.locale} status={project.status} checkedAt={project.statusCheckedAt} />
  </header>

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
      <a href={data.caseHref} hreflang="pt-BR">{t.openSource.readCase}</a>
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
      <h2 id="related-writing-title">{t.writing.relatedWriting}</h2>
      <ul>
        {#each data.relatedWriting as entry (`${entry.kind}:${entry.slug}`)}
          <li><a href={entry.href}>{entry.title}</a> <time datetime={entry.date}>{formatDate(entry.date, data.locale)}</time></li>
        {/each}
      </ul>
    </section>
  {/if}

  <p><a href={pages.projects[data.locale]}>{t.openSource.backToProjects}</a></p>
</article>
{/if}

<style>
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-7);
    margin: 0 0 var(--space-7);
  }

  .facts dd {
    margin: 0;
  }

  .case-link {
    margin-block-end: var(--space-7);
    font-size: var(--step-2);
  }

  .related {
    display: grid;
    gap: var(--space-3);
    margin-block-end: var(--space-7);
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
