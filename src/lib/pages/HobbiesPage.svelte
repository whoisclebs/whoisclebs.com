<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { hobbiesData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof hobbiesData> } = $props()

  const copy = $derived(getMessages(data.locale).hobbies)
</script>

<header class="page-header">
  <p class="eyebrow">HOBBIES</p>
  <h1>{copy.title}</h1>
  <p class="lead">{copy.description}</p>
</header>

<ul class="grid list-reset">
  {#each copy.cards as card, index (card.kicker)}
    <li class="card">
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

<section class="section" aria-labelledby="games-title">
  <h2 id="games-title">{copy.collection}</h2>
  <ul class="grid list-reset">
    {#each data.boardGames as game (game.title)}
      <li class="card">
        <img src={game.image} alt={`${copy.coverAlt} ${game.title}`} width="600" height="600" loading="lazy" />
        <p class="meta">{game.players}</p>
        <h3>{game.title}</h3>
        <p>{game.note}</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
</style>
