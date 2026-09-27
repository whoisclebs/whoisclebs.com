<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { legalData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof legalData> } = $props()

  const copy = $derived(getMessages(data.locale)[data.kind])
</script>

<article class="legal">
  <header class="page-header">
    <p class="eyebrow">LEGAL</p>
    <h1>{copy.title}</h1>
    <p class="meta">{copy.updated}</p>
  </header>
  <div class="prose">
    {#each copy.sections as section (section.title)}
      <section>
        <h2>{section.title}</h2>
        {#each section.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
        {#if 'bullets' in section && section.bullets}
          <ul>
            {#each section.bullets as bullet (bullet)}<li>{bullet}</li>{/each}
          </ul>
        {/if}
      </section>
    {/each}
  </div>
</article>

<style>
  .legal {
    max-width: calc(var(--measure) + 2 * var(--space-6));
    margin-inline: auto;
  }

  section + section {
    margin-block-start: var(--space-7);
  }

  section > * + * {
    margin-block-start: var(--space-4);
  }
</style>
