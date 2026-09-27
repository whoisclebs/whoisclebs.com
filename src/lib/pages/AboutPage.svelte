<script lang="ts">
  import { getMessages } from '$lib/i18n'
  import type { aboutData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof aboutData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.about)
</script>

<header class="page-header about-header">
  <div class="stack">
    <p class="eyebrow">{copy.kicker}</p>
    <h1>{copy.title}</h1>
    <p class="lead">{copy.intro}</p>
  </div>
  <img class="portrait" src="/profile/clebson.png" alt="Clebson A. Fonseca" width="480" height="480" />
</header>

<section aria-labelledby="journey-title">
  <h2 id="journey-title">{copy.journey}</h2>
  <ol class="grid list-reset timeline">
    {#each copy.timeline as item (item.label)}
      <li class="card">
        <p class="eyebrow">{item.label}</p>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </li>
    {/each}
  </ol>
</section>

<section class="section">
  <div class="measure stack">
    {#each copy.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
  </div>
  <img class="dnd" src="/cover/d&d.png" alt={copy.dndAlt} loading="lazy" width="1200" height="675" />
</section>

<section class="section" aria-labelledby="badges-title">
  <h2 id="badges-title">Badges</h2>
  <p class="measure">{copy.badgesText} <a href="https://www.credly.com/users/whoisclebs" rel="noopener noreferrer">Credly</a>.</p>
  <ul class="grid list-reset">
    {#each data.badges as badge (badge.url)}
      <li class="card">
        <img src={badge.image} alt="" width="96" height="96" loading="lazy" />
        <p class="meta">{badge.issuer} · {badge.issuedAt}</p>
        <h3><a href={badge.url} rel="noopener noreferrer">{badge.name}</a></h3>
      </li>
    {/each}
  </ul>
</section>

<section class="section" aria-labelledby="side-title">
  <p class="eyebrow">{copy.sideProject}</p>
  <h2 id="side-title">Meeple &amp; Decks</h2>
  <div class="side">
    <img src="/projects/md.png" alt="Meeple & Decks" width="480" height="480" loading="lazy" />
    <div class="measure stack">
      {#each copy.mdParagraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
      <p><a class="button" href="https://www.meepledecks.com/" rel="noopener noreferrer">{copy.mdLink}</a></p>
    </div>
  </div>
</section>

<style>
  .about-header {
    align-items: end;
  }

  @media (min-width: 960px) {
    .about-header {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    }
  }

  .portrait {
    width: 100%;
    max-width: 22rem;
    aspect-ratio: 1;
    object-fit: cover;
    border: var(--border-hairline) solid var(--color-rule);
  }

  .timeline {
    margin-block: var(--space-5) var(--space-8);
  }

  .dnd {
    width: 100%;
    max-width: 48rem;
    border: var(--border-hairline) solid var(--color-rule);
  }

  .side {
    display: grid;
    gap: var(--space-6);
  }

  .side img {
    width: 100%;
    max-width: 18rem;
    aspect-ratio: 1;
    object-fit: cover;
  }

  @media (min-width: 960px) {
    .side {
      grid-template-columns: 18rem minmax(0, 1fr);
    }
  }
</style>
