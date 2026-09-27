<script lang="ts">
  import NewsletterCta from '$lib/components/NewsletterCta.svelte'
  import { formatDate, getMessages } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { articleData } from '$lib/server/pages'

  let { data }: { data: Awaited<ReturnType<typeof articleData>> } = $props()

  const t = $derived(getMessages(data.locale))
  const post = $derived(data.post)
</script>

<article class="article">
  <header class="page-header">
    <p class="eyebrow">{post.kicker}</p>
    <h1>{post.title}</h1>
    <p class="lead">{post.excerpt}</p>
    <p class="meta">
      {t['blog.by']} {data.author.name} · <time datetime={post.date}>{formatDate(post.date, data.locale)}</time>
      {#if post.updated}
        · {data.locale === 'en' ? 'revised' : 'revisado'} <time datetime={post.updated}>{formatDate(post.updated, data.locale)}</time>
      {/if}
      · {post.readingTime}
    </p>
  </header>

  <img class="cover" src={post.cover} alt={post.coverAlt} width="1200" height="675" fetchpriority="high" />

  {#if data.toc.length > 1}
    <nav class="toc" aria-labelledby="toc-title">
      <p id="toc-title" class="eyebrow">{t['blog.tocTitle']}</p>
      <ol>
        {#each data.toc as item (item.id)}
          <li><a href={`#${item.id}`}>{item.text}</a></li>
        {/each}
      </ol>
    </nav>
  {/if}

  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML gerado no build a partir do Markdown do repositório (HTML cru escapado) -->
    {@html data.html}
  </div>

  {#if post.sources.length > 0}
    <section class="sources" aria-label={data.locale === 'en' ? 'Sources' : 'Fontes'}>
      <p class="eyebrow">{data.locale === 'en' ? 'Sources' : 'Fontes'}</p>
      <ul>
        {#each post.sources as source (source)}<li><a href={source} rel="noopener noreferrer">{source}</a></li>{/each}
      </ul>
    </section>
  {/if}

  <NewsletterCta locale={data.locale} />

  <p><a href={pages.writing[data.locale]}>{t['blog.backToBlog']}</a></p>
</article>

<style>
  .article {
    max-width: calc(var(--measure) + 2 * var(--space-6));
    margin-inline: auto;
  }

  .cover {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    margin-block-end: var(--space-7);
    border: var(--border-hairline) solid var(--color-rule);
  }

  .toc {
    margin-block-end: var(--space-7);
    padding: var(--space-4) var(--space-5);
    border-inline-start: 2px solid var(--color-accent);
    font-size: var(--step-0);
  }

  .toc ol {
    margin: var(--space-2) 0 0;
    padding-inline-start: var(--space-5);
  }

  .sources {
    margin-block-start: var(--space-7);
  }
</style>
