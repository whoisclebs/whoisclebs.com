<script lang="ts">
  /**
   * Bloco lateral do fim de um texto (fontes, projetos relacionados): rótulo em ciano e uma linha por item,
   * com fio embaixo, no desenho de "Leia também" do design. `mono` serve às fontes (URLs): corpo em mono pequeno.
   */
  let {
    id,
    title,
    items,
    mono = false,
    external = false,
  }: {
    id: string
    title: string
    items: { href: string; label: string }[]
    mono?: boolean
    external?: boolean
  } = $props()
</script>

<section class="entry__aside aside" aria-labelledby={id}>
  <h2 {id} class="eyebrow aside__title">{title}</h2>
  <ul class="aside__list list-reset" class:aside__list--mono={mono}>
    {#each items as item (item.href)}
      <li>
        <a href={item.href} rel={external ? 'noopener noreferrer' : undefined}>{item.label}</a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .aside {
    max-width: var(--measure-article);
    gap: var(--space-2);
    padding-block-start: 0;
    border-block-start: 0;
  }

  .aside__title {
    font-family: var(--font-text);
    letter-spacing: var(--tracking-label);
  }

  .aside__list {
    display: grid;
    padding: 0;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .aside__list li {
    padding-block: var(--space-4);
    border-block-end: var(--border-hairline) solid var(--color-rule-soft);
  }

  .aside__list a {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-display);
    line-height: var(--leading-heading);
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
  }

  .aside__list--mono a {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    letter-spacing: 0;
    color: var(--color-text-soft);
  }

  @media (hover: hover) and (pointer: fine) {
    .aside__list--mono a:hover {
      color: var(--color-link-hover);
    }
  }
</style>
