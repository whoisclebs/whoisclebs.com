<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { booksData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof booksData> } = $props()

  const copy = $derived(getMessages(data.locale).books)
</script>

<header class="page-header">
  <p class="eyebrow">{copy.kicker}</p>
  <h1>{copy.title}</h1>
  <p class="lead">{copy.description}</p>
  <p class="meta">{copy.affiliate}</p>
</header>

<section aria-labelledby="books-title">
  <h2 id="books-title" class="eyebrow">{copy.recommendations}</h2>
  <ul class="grid list-reset books">
    {#each data.books as book (book.link)}
      <li class="card">
        <img src={book.image} alt="" width="240" height="360" loading="lazy" />
        <h3><a href={book.link} rel="noopener noreferrer sponsored">{book.title}</a></h3>
        <p>{book.author}</p>
        <p class="meta">Amazon</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  .books {
    margin-block-start: var(--space-4);
  }

  .books img {
    height: 18rem;
    width: 100%;
    object-fit: contain;
  }
</style>
