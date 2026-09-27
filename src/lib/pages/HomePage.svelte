<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { articlePath, pages } from '$lib/routing/paths'
  import type { homeData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof homeData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.home)
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="stack">
    <p class="eyebrow">{copy.kicker}</p>
    <h1 id="hero-title" class="hero__title">{copy.headline}</h1>
    <p class="lead">{copy.intro}</p>
    <p class="actions">
      <a class="button button--primary" href={pages.writing[data.locale]}>{copy.ctaWriting}</a>
      <a class="button" href={pages.projects[data.locale]}>{copy.ctaProjects}</a>
    </p>
  </div>
  <aside class="card now" aria-labelledby="now-title">
    <h2 id="now-title">{copy.nowTitle}</h2>
    <dl>
      {#each copy.nowItems as item, index (item)}
        <div>
          <dt class="eyebrow">{copy.nowLabels[index]}</dt>
          <dd>{item}</dd>
        </div>
      {/each}
    </dl>
    <p class="meta">{copy.nowUpdated}</p>
  </aside>
</section>

<section class="section" aria-labelledby="latest-title">
  <h2 id="latest-title">{copy.latest}</h2>
  <ul class="grid list-reset">
    {#each data.posts as post (post.slug)}
      <li class="card">
        <p class="eyebrow">{post.kicker}</p>
        <h3><a href={articlePath(post.slug, data.locale)}>{post.title}</a></h3>
        <p>{post.excerpt}</p>
        <p class="meta"><time datetime={post.date}>{formatDate(post.date, data.locale)}</time> · {post.readingTime}</p>
      </li>
    {/each}
    <li class="card">
      <p class="eyebrow">{copy.archiveKicker}</p>
      <h3><a href={pages.writing[data.locale]}>{copy.moreWriting}</a></h3>
      <p>{copy.archiveText}</p>
    </li>
  </ul>
</section>

<section class="section" aria-labelledby="projects-title">
  <h2 id="projects-title">{t.openSource.title}</h2>
  <p class="lead">{t.openSource.intro}</p>
  <ul class="grid list-reset">
    {#each data.projects as project (project.slug)}
      <li class="card">
        <h3><a href={project.href}>{project.name}</a></h3>
        <p>{project.description}</p>
        <ul class="tags" aria-label={t.openSource.stackLabel}>
          {#each project.technologies as tech (tech)}<li>{tech}</li>{/each}
        </ul>
        <p class="meta">{project.year}</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  .hero {
    display: grid;
    gap: var(--space-7);
    padding-block-end: var(--space-8);
  }

  @media (min-width: 960px) {
    .hero {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      align-items: end;
    }
  }

  .hero__title {
    font-size: var(--step-5);
    line-height: var(--leading-display);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .now dl {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }


</style>
