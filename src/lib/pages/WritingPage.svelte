<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { articlePath } from '$lib/routing/paths'
  import type { writingData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof writingData> } = $props()

  const t = $derived(getMessages(data.locale))
</script>

<header class="page-header">
  <p class="eyebrow">{t['blog.kicker']}</p>
  <h1>{t['blog.title']}</h1>
  <p class="lead">{t['blog.description']}</p>
</header>

<section aria-labelledby="articles-title">
  <h2 id="articles-title" class="visually-hidden">{t['blog.recentArticles']}</h2>
  <ul class="grid list-reset">
    {#each data.posts as post (post.slug)}
      <li class="card">
        <p class="eyebrow">{post.kicker}</p>
        <h3><a href={articlePath(post.slug, data.locale)}>{post.title}</a></h3>
        <p>{post.excerpt}</p>
        <p class="meta"><time datetime={post.date}>{formatDate(post.date, data.locale)}</time> · {post.readingTime}</p>
      </li>
    {/each}
  </ul>
</section>
