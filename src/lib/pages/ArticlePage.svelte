<script lang="ts">
  import Comments from '$lib/components/Comments.svelte'
  import NewsletterCta from '$lib/components/NewsletterCta.svelte'
  import EntryMeta from '$lib/components/writing/EntryMeta.svelte'
  import { getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { articleData } from '$lib/server/pages'

  let { data }: { data: Awaited<ReturnType<typeof articleData>> } = $props()

  const t = $derived(getMessages(data.locale))
  const post = $derived(data.post)
  const sourcesLabel = $derived(data.locale === 'en' ? 'Sources' : 'Fontes')
</script>

<!-- Linha de progresso: só decorativa (aria-hidden), CSS scroll-driven, some com reduced motion. -->
<div class="reading-progress" aria-hidden="true"></div>

<article class="entry" class:entry--with-toc={data.showToc}>
  <header class="entry__header">
    <p class="entry__topic"><a href={data.topicHref}>{post.topic.label}</a></p>
    <h1 class="entry__title">{post.title}</h1>
    <p class="entry__lead">{post.excerpt}</p>
    <EntryMeta locale={data.locale} date={post.date} updated={post.updated} minutes={post.readingMinutes} />
  </header>

  {#if data.showToc}
    <nav class="entry__toc" aria-labelledby="toc-title">
      <h2 id="toc-title" class="entry__toc-title">{t.writing.toc}</h2>
      <ol>
        {#each data.toc as item (item.id)}
          <li><a href={`#${item.id}`}>{item.text}</a></li>
        {/each}
      </ol>
    </nav>
  {/if}

  <div class="entry__body">
    <img class="entry__cover" src={post.cover} alt={post.coverAlt} width="1200" height="675" fetchpriority="high" />

    <div class="prose">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML gerado no build a partir do Markdown do repositório (HTML cru escapado) -->
      {@html data.html}
    </div>

    {#if post.sources.length > 0}
      <section class="entry__aside" aria-labelledby="sources-title">
        <h2 id="sources-title" class="entry__aside-title">{sourcesLabel}</h2>
        <ul>
          {#each post.sources as source (source)}<li><a href={source} rel="noopener noreferrer">{source}</a></li>{/each}
        </ul>
      </section>
    {/if}

    {#if data.relatedProjects.length > 0}
      <section class="entry__aside" aria-labelledby="related-title">
        <h2 id="related-title" class="entry__aside-title">{t.writing.relatedProjects}</h2>
        <ul>
          {#each data.relatedProjects as project (project.slug)}<li><a href={project.href}>{project.name}</a></li>{/each}
        </ul>
      </section>
    {/if}

    <Comments locale={data.locale} term={data.commentTerm} />

    <NewsletterCta locale={data.locale} />

    <p class="entry__back"><a href={pages.writing[data.locale]}>{t.writing.back}</a></p>
  </div>
</article>
