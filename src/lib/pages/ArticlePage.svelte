<script lang="ts">
  import Comments from '$lib/components/Comments.svelte'
  import NewsletterCta from '$lib/components/NewsletterCta.svelte'
  import EntryAside from '$lib/components/writing/EntryAside.svelte'
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

<!-- Leitura longa sobre o grafite liso. O cabeçalho é parte da grade de 12 colunas do artigo (título +
     sumário fixo), não um hero à parte; o link de volta fica no topo, como no design. -->
<div class="page page-body">
<p class="entry__back"><a class="link-arrow" href={pages.writing[data.locale]}><span aria-hidden="true">←</span> {t.writing.back}</a></p>
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
      <EntryAside id="sources-title" title={sourcesLabel} items={post.sources.map((source) => ({ href: source, label: source }))} mono external />
    {/if}

    {#if data.relatedProjects.length > 0}
      <EntryAside id="related-title" title={t.writing.relatedProjects} items={data.relatedProjects.map((project) => ({ href: project.href, label: project.name }))} />
    {/if}

    <Comments locale={data.locale} term={data.commentTerm} />

    <NewsletterCta locale={data.locale} />
  </div>
</article>
</div>

<style>
  .entry__back {
    margin-block-end: var(--space-6);
  }

  .entry__back > a > span {
    display: inline-block;
  }

  @media (hover: hover) and (pointer: fine) {
    .entry__back > a:hover {
      color: var(--color-link-hover);
    }

    .entry__back > a:hover > span {
      transform: translateX(-3px);
    }
  }
</style>
