<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { projectData } from '$lib/server/pages'
  import ProjectStatus from './ProjectStatus.svelte'

  let { data }: { data: ReturnType<typeof projectData> } = $props()

  const t = $derived(getMessages(data.locale))
  const project = $derived(data.project)
</script>

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
  </dl>

  <p class="actions">
    <a class="button button--primary" href={project.repo} rel="noopener noreferrer">{t.openSource.repository}</a>
    {#if project.docs !== project.repo}
      <a class="button" href={project.docs} rel="noopener noreferrer">{t.openSource.docs}</a>
    {/if}
  </p>

  <p><a href={pages.projects[data.locale]}>{t.openSource.backToProjects}</a></p>
</article>

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

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-block-end: var(--space-7);
  }
</style>
