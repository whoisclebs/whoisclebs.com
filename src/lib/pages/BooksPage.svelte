<script lang="ts">
  import Bookshelf from '$lib/components/books/Bookshelf.svelte'
  import { getMessages } from '$lib/i18n'
  import type { booksData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof booksData> } = $props()

  const copy = $derived(getMessages(data.locale).books)
</script>

<header class="page-header">
  <div class="page">
    <p class="eyebrow">{copy.kicker}</p>
    <h1>{copy.title}</h1>
    <p class="lead">{copy.description}</p>
    <p class="meta">{copy.affiliate}</p>
  </div>
</header>

<div class="page page-body">
  <section aria-labelledby="books-title">
    <h2 id="books-title" class="eyebrow">{copy.recommendations}</h2>
    <Bookshelf books={data.books} locale={data.locale} {copy} />
  </section>
</div>
