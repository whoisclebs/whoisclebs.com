<script lang="ts">
  import { formatDate, getMessages } from '$lib/i18n'
  import { notePath } from '$lib/routing/paths'
  import type { notesData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof notesData> } = $props()

  const t = $derived(getMessages(data.locale))
</script>

<header class="page-header">
  <p class="eyebrow">{t['til.kicker']}</p>
  <h1>{t['til.title']}</h1>
  <p class="lead">{t['til.description']}</p>
</header>

<ul class="grid list-reset">
  {#each data.notes as note (note.slug)}
    <li class="card">
      <p class="eyebrow">{note.kicker}</p>
      <h2><a href={notePath(note.slug)}>{note.title}</a></h2>
      <p>{note.excerpt}</p>
      <p class="meta"><time datetime={note.date}>{formatDate(note.date, data.locale)}</time></p>
    </li>
  {/each}
</ul>
