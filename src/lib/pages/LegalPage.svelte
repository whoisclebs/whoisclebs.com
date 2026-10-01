<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { legalData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof legalData> } = $props()

  const copy = $derived(getMessages(data.locale)[data.kind])
</script>

<header class="page-header">
  <div class="page legal">
    <p class="eyebrow">LEGAL</p>
    <h1>{copy.title}</h1>
    <p class="meta">{copy.updated}</p>
  </div>
</header>

<div class="page page-body">
<article class="legal">
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
</div>

<style>
  /* Coluna de leitura de 700 px, centralizada, como no design (cabeçalho e texto na mesma coluna). */
  .legal {
    display: grid;
    gap: var(--space-4);
    max-width: calc(700px + 2 * var(--page-gutter));
    margin-inline: auto;
  }

  article.legal {
    padding-inline: var(--page-gutter);
  }

  .legal .prose {
    max-width: 700px;
    font-size: var(--step-1);
  }

  /* H2 das seções: clamp(24px, 2.6vw, 32px), como no design. */
  .legal h2 {
    font-size: clamp(1.5rem, 2.6vw, 2rem);
    line-height: var(--leading-heading);
    letter-spacing: -0.01em;
  }

  section + section {
    margin-block-start: var(--space-7);
  }

  section > * + * {
    margin-block-start: var(--space-4);
  }
</style>
