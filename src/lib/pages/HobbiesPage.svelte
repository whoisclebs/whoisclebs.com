<script lang="ts">
  import type { Component } from 'svelte'
  import { onMount } from 'svelte'
  import DieSvg from '$lib/eggs/dice/DieSvg.svelte'
  import { orientationFor } from '$lib/eggs/dice/d20'
  import { getMessages } from '$lib/i18n'
  import type { hobbiesData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof hobbiesData> } = $props()

  const copy = $derived(getMessages(data.locale).hobbies)

  type TrayProps = { labels: ReturnType<typeof getMessages>['hobbies']['dice'] }

  // O d20 é uma ilha: o módulo interativo só é baixado quando a seção chega perto da tela. Até lá (e sem JS)
  // fica o mesmo dado desenhado parado, no mesmo espaço, então nada pula quando a ilha chega.
  let TrayView = $state<Component<TrayProps> | null>(null)
  let tray = $state<HTMLElement>()
  const rest = orientationFor(20)

  onMount(() => {
    if (!tray) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        void import('$lib/eggs/dice/DiceTray.svelte').then((module) => {
          TrayView = module.default as Component<TrayProps>
        })
      },
      { rootMargin: '320px 0px' },
    )
    observer.observe(tray)
    return () => observer.disconnect()
  })
</script>

<header class="page-header">
  <div class="page">
    <p class="eyebrow">HOBBIES</p>
    <h1>{copy.title}</h1>
    <p class="lead">{copy.description}</p>
  </div>
</header>

<div class="page page-body">
<ul class="topics list-reset">
  {#each copy.cards as card, index (card.kicker)}
    <li class="topics__item">
      <p class="eyebrow">{card.kicker}</p>
      <h2>{card.title}</h2>
      {#if index === 1}
        <p>{copy.steamPrefix} <a href="https://steamcommunity.com/id/struzinov/" rel="noopener noreferrer">steamcommunity.com/id/struzinov</a>.</p>
      {:else}
        <p>{card.text}</p>
      {/if}
    </li>
  {/each}
</ul>

<section class="section dice" aria-labelledby="dice-title">
  <div class="dice__text">
    <p class="eyebrow">{copy.dice.kicker}</p>
    <h2 id="dice-title">{copy.dice.title}</h2>
    <p>{copy.dice.text}</p>
  </div>
  <div class="dice__tray" bind:this={tray}>
    {#if TrayView}
      <TrayView labels={copy.dice} />
    {:else}
      <div class="dice__still">
        <DieSvg q={rest} radius={104} label={copy.dice.still} />
      </div>
    {/if}
  </div>
</section>

<section class="section" aria-labelledby="games-title">
  <h2 id="games-title">{copy.collection}</h2>
  <ul class="grid list-reset">
    {#each data.boardGames as game (game.title)}
      <li class="games__item">
        <img src={game.image} alt={`${copy.coverAlt} ${game.title}`} width="600" height="600" loading="lazy" />
        <p class="meta">{game.players}</p>
        <h3>{game.title}</h3>
        <p>{game.note}</p>
      </li>
    {/each}
  </ul>
</section>
</div>

<style>
  /* Sem caixa: fio de 1 px no topo e divisor entre colunas. */
  .topics {
    display: grid;
    gap: var(--space-5);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .topics__item h2 {
    font-size: var(--step-3);
  }

  .topics__item {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding-block: var(--space-5);
  }

  .topics__item + .topics__item {
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  @media (min-width: 960px) {
    .topics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .topics__item + .topics__item {
      border-block-start: 0;
      border-inline-start: var(--border-hairline) solid var(--color-rule);
      padding-inline-start: var(--grid-gap);
    }
  }

  /* O d20: texto à esquerda, a mesa à direita; no celular, um embaixo do outro. */
  .dice {
    align-items: center;
  }

  .dice__text {
    display: grid;
    gap: var(--space-2);
    max-inline-size: var(--measure-narrow);
  }

  .dice__text h2 {
    font-size: var(--step-3);
  }

  /* Altura fixa: o espaço reservado e a ilha ocupam exatamente o mesmo lugar (sem CLS). */
  .dice__tray {
    --dice-rows: 44px 1fr 96px;
    block-size: 448px;
  }

  /* Sem a ilha, o dado parado ocupa a faixa do meio, onde a mesa vai desenhá-lo. */
  .dice__still {
    display: grid;
    grid-template-rows: var(--dice-rows);
    block-size: 100%;
    justify-items: center;
    align-items: center;
  }

  .dice__still > :global(svg) {
    grid-row: 2;
    filter: drop-shadow(0 16px 14px rgb(0 0 0 / 0.45));
  }

  @media (min-width: 960px) {
    .dice {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }

  /* Coleção: sem caixa; a capa do jogo já separa cada item. */
  .games__item {
    display: grid;
    gap: var(--space-2);
    align-content: start;
  }

  .games__item h3 {
    font-size: var(--step-1);
    line-height: var(--leading-ui);
  }

  .games__item img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
</style>
