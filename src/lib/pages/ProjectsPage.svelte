<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import { pagePathOrDefault } from '$lib/routing/paths'
  import type { projectsData } from '$lib/server/pages'
  import ProjectStatus from './ProjectStatus.svelte'

  let { data }: { data: ReturnType<typeof projectsData> } = $props()

  const t = $derived(getMessages(data.locale))
</script>

<header class="page-header">
  <p class="eyebrow">{t.openSource.kicker}</p>
  <h1>{data.locale === 'en' ? 'Projects' : 'Projetos'}</h1>
  <p class="lead">{t.openSource.intro}</p>
</header>

<ul class="grid list-reset" aria-label={t.openSource.title}>
  {#each data.projects as project (project.slug)}
    <li class="card">
      <h2><a href={project.href}>{project.name}</a></h2>
      <ProjectStatus locale={data.locale} status={project.status} checkedAt={project.statusCheckedAt} />
      <p>{project.description}</p>
      <ul class="tags" aria-label={t.openSource.stackLabel}>
        {#each project.technologies as tech (tech)}<li>{tech}</li>{/each}
      </ul>
      <p class="meta">{t.openSource.yearLabel}: {project.year}</p>
    </li>
  {/each}
</ul>

<section class="section" aria-labelledby="areas-title">
  <p class="eyebrow">PORTFOLIO</p>
  <h2 id="areas-title">{t.portfolio.title}</h2>
  <p class="lead">{t.portfolio.description}</p>
  <ul class="grid list-reset" aria-label={t.portfolio.areasLabel}>
    {#each t.portfolio.projects as area (area.name)}
      <li class="card">
        <p class="eyebrow">{area.kicker}</p>
        <h3>{area.name}</h3>
        <p>{area.summary}</p>
        <p class="meta">{area.stack}</p>
      </li>
    {/each}
  </ul>
</section>

<section class="section card" aria-labelledby="cta-title">
  <p class="eyebrow">{t.portfolio.availability}</p>
  <h2 id="cta-title">{t.portfolio.ctaTitle}</h2>
  <p>{t.portfolio.ctaText}</p>
  <p><a class="button" href={pagePathOrDefault('about', data.locale)}>{t.portfolio.ctaLink}</a></p>
</section>

