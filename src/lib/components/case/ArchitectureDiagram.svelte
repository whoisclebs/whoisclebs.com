<!--
  Diagrama de arquitetura dos cases, em DOM (não imagem): o próprio HTML é o texto equivalente.
  Lista ordenada de paradas sobre um trilho; cada parada é uma célula da quadrícula.
  Célula cheia = existe no código; célula tracejada = lacuna (prometido e não feito, ou issue aberta),
  sempre com a palavra escrita ao lado — a forma nunca é a única pista.
-->
<script lang="ts">
  import type { CaseStudy } from '$lib/content/case-schema'

  let { architecture, id }: { architecture: CaseStudy['architecture']; id: string } = $props()
</script>

<figure class="arch" aria-labelledby="{id}-caption">
  <ol class="arch__flow list-reset">
    {#each architecture.nodes as node, index (node.label)}
      <li class="arch__node" data-state={node.state}>
        <p class="arch__marker">
          <span class="arch__cell" aria-hidden="true"></span>
          <span class="arch__step">{String(index + 1).padStart(2, '0')}</span>
          {#if node.state === 'gap'}<span class="arch__gap">Lacuna</span>{/if}
        </p>
        <p class="arch__label"><code>{node.label}</code></p>
        <p class="arch__detail">{node.detail}</p>
        <a class="arch__source" href={node.source.url} rel="noopener noreferrer">{node.source.label}</a>
      </li>
    {/each}
  </ol>
  <figcaption id="{id}-caption" class="arch__caption">{architecture.caption}</figcaption>
</figure>

<style>
  .arch {
    margin: 0;
    padding: var(--space-5);
    border: var(--border-hairline) solid var(--color-rule);
    background-color: var(--color-band);
    /* Quadrícula de 1 px a cada 24 px, no tom elevado sobre o fundo; os nós voltam ao `--color-surface`. */
    background-image:
      linear-gradient(to right, var(--color-grid) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-grid) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .arch__flow {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr));
    gap: var(--space-6) var(--space-4);
  }

  .arch__node {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    min-width: 0;
    padding: var(--space-3) var(--space-3) var(--space-4);
    border-block-start: 2px solid var(--color-text);
    background: var(--color-surface);
  }

  .arch__node[data-state='gap'] {
    border-block-start-style: dashed;
  }

  .arch__marker {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-block-start: calc(-1 * var(--space-3) - 9px);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    color: var(--color-text-faint);
    font-variant-numeric: tabular-nums;
  }

  .arch__cell {
    width: 16px;
    height: 16px;
    background: var(--color-text);
    border: 2px solid var(--color-text);
  }

  .arch__node[data-state='gap'] .arch__cell {
    background: var(--color-surface);
    border-style: dashed;
  }

  .arch__step {
    padding-inline: var(--space-1);
    background: var(--color-surface);
  }

  .arch__gap {
    padding-inline: var(--space-1);
    border: var(--border-hairline) dashed var(--color-text-soft);
    color: var(--color-text-soft);
    background: var(--color-surface);
  }

  .arch__label {
    font-size: var(--step-0);
    overflow-wrap: anywhere;
  }

  .arch__label code {
    font-size: var(--step--1);
    font-weight: 500;
    color: var(--color-text);
  }

  .arch__detail {
    font-size: var(--step-0);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  .arch__source {
    justify-self: start;
    font-family: var(--font-mono);
    font-size: var(--step--2);
    overflow-wrap: anywhere;
  }

  .arch__caption {
    margin-block-start: var(--space-5);
    font-size: var(--step-0);
    color: var(--color-text-soft);
    max-width: 60ch;
  }
</style>
