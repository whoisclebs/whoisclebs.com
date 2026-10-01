<script lang="ts">
  import type { Component } from 'svelte'
  import { tick } from 'svelte'
  import { say } from '$lib/eggs/state.svelte'
  import { formatDate, getMessages } from '$lib/i18n'
  import { pagePath } from '$lib/routing/paths'
  import type { aboutData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof aboutData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.about)
  const links = $derived(data.socialLinks.filter((link) => link.label === 'GitHub' || link.label === 'LinkedIn'))
  const architectureId = $derived(data.locale === 'en' ? 'architecture' : 'arquitetura')
  // Sem página de contato no idioma (inglês), o convite abre o e-mail.
  const contactHref = $derived(pagePath('contact', data.locale) ?? `mailto:${data.contactEmail}`)

  type ConsoleProps = { labels: ReturnType<typeof getMessages>['eggs']['game']; onclose: () => void }

  // O console é uma ilha: o módulo só é baixado quando o visitante insere o cartucho.
  let ConsoleView = $state<Component<ConsoleProps> | null>(null)
  let open = $state(false)
  let cartridge = $state<HTMLButtonElement>()
  let slot = $state<HTMLElement>()

  async function toggleCartridge(): Promise<void> {
    if (open) {
      closeConsole()
      return
    }
    ConsoleView ??= (await import('$lib/eggs/PocketConsole.svelte')).default as Component<ConsoleProps>
    open = true
    say(t.eggs.toast.cartridge)
    await tick()
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    slot?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' })
  }

  function closeConsole(): void {
    open = false
    cartridge?.focus({ preventScroll: true })
  }
</script>

<!--
  Abertura: texto à esquerda (rótulo, título, apoio e três linhas de definição); à direita, duas cópias em papel
  pousadas na página (opacas, nunca dissolvidas no fundo) e um cartucho que, inserido, abre o console de bolso
  com a serpente abaixo da grade.
-->
<header class="page-header">
  <div class="page">
    <div class="open">
      <div class="open__text">
        <p class="eyebrow">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p class="open__lead">{copy.lead}</p>
        <dl class="rows">
          <div class="row">
            <dt>{copy.rows.now.label}</dt>
            <dd>{copy.rows.now.text}</dd>
          </div>
          <div class="row">
            <dt>{copy.rows.writing.label}</dt>
            <dd>{copy.rows.writing.text}</dd>
          </div>
          <div class="row">
            <dt>{copy.rows.contact.label}</dt>
            <dd class="row__links">
              {#each links as link (link.href)}
                <a href={link.href} rel="noopener noreferrer me">{link.label}</a>
              {/each}
            </dd>
          </div>
        </dl>
      </div>

      <div class="prints" data-prints>
        <figure class="print print--me">
          <img src="/profile/clebson-720.webp" alt={copy.portraitAlt} width="720" height="720" />
          <figcaption>{copy.portraitCaption}</figcaption>
        </figure>
        <figure class="print print--event">
          <img src="/cover/campus-party-3-lugar.webp" alt={copy.eventAlt} width="768" height="511" />
          <figcaption>{copy.eventCaption}</figcaption>
        </figure>
        <button
          bind:this={cartridge}
          class="cartridge"
          type="button"
          aria-label={t.eggs.game.cartridge}
          aria-expanded={open}
          aria-controls="console-slot"
          onclick={toggleCartridge}
        >
          <span class="cartridge__label" aria-hidden="true">SNAKE</span>
          <span class="cartridge__contacts" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div id="console-slot" class="slot" bind:this={slot}>
      {#if open && ConsoleView}
        <ConsoleView labels={t.eggs.game} onclose={closeConsole} />
      {/if}
    </div>
  </div>
</header>

<section class="sec" aria-labelledby="journey-title">
  <div class="page sec__grid">
    <h2 id="journey-title">{copy.journey}</h2>
    <!-- É uma sequência de verdade: a ordem vem do ano, e só "hoje" fica aceso em ciano. -->
    <ol class="list-reset timeline">
      {#each copy.timeline as item, index (item.label)}
        <li class="timeline__item" class:timeline__item--now={index === copy.timeline.length - 1}>
          <p class="timeline__when">{item.label}</p>
          <h3>{item.title}</h3>
          <p class="timeline__text">{item.text}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<section class="sec" aria-label={copy.intro}>
  <div class="page sec__grid">
    <div class="story__text">
      {#each copy.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
    </div>
    <img class="dnd" src="/cover/d&d.png" alt={copy.dndAlt} loading="lazy" width="1200" height="675" />
  </div>
</section>

<section class="sec" id={architectureId} aria-labelledby="offer-title">
  <div class="page sec__grid">
    <div class="sec__head">
      <h2 id="offer-title">{copy.offer.title}</h2>
      <p class="soft">{copy.offer.intro}</p>
    </div>
    <div class="offer">
      <ol class="list-reset offer__list">
        {#each copy.offer.items as item (item.key)}
          {@const proof = data.evidence[item.key as keyof typeof data.evidence]}
          <li class="offer__item">
            <h3>{item.title}</h3>
            <div class="offer__part">
              <p class="label">{copy.offer.labels.problem}</p>
              <p>{item.problem}</p>
            </div>
            <div class="offer__part">
              <p class="label">{copy.offer.labels.delivers}</p>
              <ul class="list-reset offer__delivers">
                {#each item.delivers as line (line)}<li>{line}</li>{/each}
              </ul>
            </div>
            <div class="offer__part">
              <p class="label">{copy.offer.labels.evidence}</p>
              <p><a class="link-lit" href={proof.href} hreflang={proof.hreflang} rel={proof.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{item.evidence}</a></p>
            </div>
          </li>
        {/each}
      </ol>
      <p class="offer__cta">
        <a class="button button--primary" href={contactHref}>{copy.offer.cta}</a>
        <span>{copy.offer.ctaNote} <a class="link-lit" href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a></span>
      </p>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="now-title">
  <div class="page sec__grid">
    <h2 id="now-title">{copy.now.title}</h2>
    <div>
      <dl class="rows rows--now">
        {#each copy.now.labels as label, i (label)}
          <div class="row">
            <dt>{label}</dt>
            <dd>{copy.now.items[i]}</dd>
          </div>
        {/each}
      </dl>
      <p class="meta updated">{copy.now.updatedLabel} <time datetime={copy.now.updatedAt}>{formatDate(copy.now.updatedAt, data.locale)}</time></p>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="badges-title">
  <div class="page sec__grid">
    <div class="sec__head">
      <h2 id="badges-title">Badges</h2>
      <p class="soft">{copy.badgesText} <a class="link-lit" href="https://www.credly.com/users/whoisclebs" rel="noopener noreferrer">Credly</a>.</p>
    </div>
    <ul class="badges list-reset">
      {#each data.badges as badge (badge.url)}
        <li class="badges__item">
          <img src={badge.image} alt="" width="88" height="88" loading="lazy" />
          <p class="meta">{badge.issuer}, {badge.issuedAt}</p>
          <h3><a href={badge.url} rel="noopener noreferrer">{badge.name}</a></h3>
        </li>
      {/each}
    </ul>
  </div>
</section>

<section class="sec sec--last" aria-labelledby="side-title">
  <div class="page sec__grid">
    <div class="sec__head">
      <p class="meta">{copy.sideProject}</p>
      <h2 id="side-title">Meeple &amp; Decks</h2>
    </div>
    <div class="side">
      <div class="side__text">
        {#each copy.mdParagraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
        <a class="link-lit side__cta" href="https://www.meepledecks.com/" rel="noopener noreferrer">{copy.mdLink}</a>
      </div>
      <img class="side__image" src="/projects/md.png" alt="Meeple & Decks" width="480" height="480" loading="lazy" />
    </div>
  </div>
</section>

<style>
  /* ---------- Abertura ---------- */
  .open {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
    gap: clamp(32px, 5vw, 96px);
    align-items: start;
  }

  .open__text {
    display: grid;
    gap: 28px;
    min-width: 0;
  }

  .open__lead {
    max-width: 560px;
    font-size: clamp(18px, 1.5vw, 22px);
    line-height: 1.55;
    color: var(--color-text-body);
  }

  /* Lista de definição com fio em cima e embaixo de cada linha. */
  .rows {
    margin: 0;
    border-block-start: 1px solid var(--color-rule);
  }

  .row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 16px;
    padding-block: 18px;
    border-block-end: 1px solid var(--color-rule);
    font-size: 15px;
    line-height: 1.6;
  }

  .row dt {
    color: var(--color-text-faint);
  }

  .row dd {
    margin: 0;
    color: var(--color-text-body);
  }

  .row__links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 20px;
  }

  .row__links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-block: -12px;
  }

  /* ---------- Cópias em papel ---------- */
  .prints {
    position: relative;
    min-height: 560px;
    min-width: 0;
  }

  .print {
    position: absolute;
    margin: 0;
    background: var(--p-print);
    box-shadow:
      0 18px 40px rgb(0 0 0 / 0.45),
      0 2px 4px rgb(0 0 0 / 0.3);
    transition: transform var(--dur-scene) var(--ease-out);
  }

  .print img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .print figcaption {
    font-family: var(--font-display);
    font-weight: 500;
    text-align: center;
    color: var(--p-print-ink);
  }

  .print--me {
    left: 4%;
    top: 0;
    width: min(300px, 62%);
    padding: 12px 12px 48px;
    transform: rotate(-4deg);
  }

  .print--me img {
    aspect-ratio: 1 / 1;
    filter: saturate(0.92) contrast(1.03);
  }

  .print--me figcaption {
    margin-block-start: 10px;
    font-size: 19px;
  }

  .print--event {
    right: 0;
    top: min(240px, 42%);
    width: min(360px, 72%);
    padding: 10px 10px 40px;
    transform: rotate(3deg);
  }

  .print--event img {
    aspect-ratio: 3 / 2;
    filter: saturate(0.9);
  }

  .print--event figcaption {
    margin-block-start: 8px;
    font-size: 17px;
  }

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    .print--me:hover {
      transform: rotate(-1deg) scale(1.02);
    }

    .print--event:hover {
      z-index: 2;
      transform: rotate(1deg) scale(1.02);
    }
  }

  /* ---------- Cartucho ---------- */
  .cartridge {
    position: absolute;
    left: 8%;
    bottom: 0;
    z-index: 1;
    width: 72px;
    height: 84px;
    padding: 12px 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 0;
    border-radius: 6px 6px 3px 3px;
    background: var(--p-shell);
    box-shadow:
      0 10px 24px rgb(0 0 0 / 0.5),
      inset 0 1px 0 rgb(255 255 255 / 0.08);
    transform: rotate(8deg);
    transition: transform var(--dur-scene) var(--ease-out);
    cursor: pointer;
  }

  .cartridge__label {
    display: grid;
    place-items: center;
    width: 52px;
    height: 40px;
    border: 1px solid rgb(95 211 230 / 0.35);
    background: var(--color-band);
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.12em;
    color: var(--color-accent);
  }

  .cartridge__contacts {
    width: 60px;
    height: 8px;
    margin-block-start: auto;
    background: repeating-linear-gradient(90deg, var(--p-brass) 0 3px, var(--p-shell) 3px 6px);
  }

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    .cartridge:hover {
      transform: rotate(0) translateY(-4px);
    }
  }

  .slot {
    margin-block-start: 72px;
  }

  .slot:empty {
    margin: 0;
  }

  /* ---------- Seções: título à esquerda, conteúdo à direita ---------- */
  .sec {
    padding-block: 72px;
    border-block-start: 1px solid var(--color-rule);
  }

  .sec--last {
    padding-block-end: 96px;
  }

  .sec__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: clamp(24px, 4vw, 72px);
    align-items: start;
  }

  .sec h2 {
    font-size: var(--step-4);
    line-height: var(--leading-heading);
    letter-spacing: -0.02em;
  }

  .sec__head {
    display: grid;
    gap: var(--space-4);
    min-width: 0;
  }

  .sec__head h2 {
    margin: 0;
  }

  .soft {
    max-width: 44ch;
    color: var(--color-text-soft);
  }

  .label {
    font-size: var(--step--2);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  /* ---------- Trajetória ---------- */
  .timeline {
    display: grid;
    gap: var(--space-6);
  }

  .timeline__item {
    display: grid;
    grid-template-columns: minmax(84px, 120px) 1fr;
    column-gap: var(--space-5);
    row-gap: var(--space-2);
    padding-block-end: var(--space-6);
    border-block-end: 1px solid var(--color-rule);
  }

  .timeline__item:last-child {
    padding-block-end: 0;
    border-block-end: 0;
  }

  .timeline__when {
    grid-row: span 2;
    font-family: var(--font-display);
    font-size: var(--step-3);
    font-weight: var(--weight-display);
    line-height: 1;
    color: var(--color-text-faint);
  }

  .timeline__item--now .timeline__when {
    color: var(--color-accent);
  }

  .timeline__item h3 {
    font-size: var(--step-1);
  }

  .timeline__text {
    max-width: 52ch;
    color: var(--color-text-body);
  }

  /* ---------- História ---------- */
  .story__text {
    display: grid;
    gap: 1.1em;
    max-width: 34em;
    font-size: var(--step-1);
    line-height: var(--leading-article);
    color: var(--color-text-body);
  }

  .story__text p:first-child {
    color: var(--color-text);
  }

  .dnd {
    width: 100%;
    max-width: 48rem;
    height: auto;
    border: 1px solid var(--color-rule);
  }

  /* ---------- Arquitetura ---------- */
  .offer {
    display: grid;
    gap: var(--space-7);
  }

  .offer__list {
    display: grid;
    border-block-start: 1px solid var(--color-rule);
  }

  .offer__item {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-6);
    border-block-end: 1px solid var(--color-rule);
  }

  .offer__item h3 {
    font-size: var(--step-3);
    line-height: var(--leading-heading);
  }

  .offer__part {
    display: grid;
    gap: var(--space-2);
    color: var(--color-text-body);
  }

  .offer__delivers {
    display: grid;
    gap: var(--space-2);
  }

  .offer__delivers li {
    position: relative;
    padding-inline-start: var(--space-5);
  }

  .offer__delivers li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.75em;
    width: 12px;
    height: 1px;
    background: var(--color-accent);
  }

  .offer__cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-5);
    color: var(--color-text-soft);
  }

  /* ---------- Agora ---------- */
  .updated {
    margin-block-start: var(--space-4);
  }

  /* ---------- Badges ---------- */
  .badges {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr));
    gap: var(--space-6) var(--space-5);
  }

  .badges__item {
    display: grid;
    align-content: start;
    gap: var(--space-2);
  }

  .badges__item img {
    width: 88px;
    height: 88px;
    object-fit: contain;
  }

  .badges__item h3 {
    font-family: var(--font-text);
    font-size: var(--step-0);
    font-weight: 500;
    line-height: 1.3;
  }

  .badges__item h3 a {
    color: var(--color-text);
  }

  /* ---------- Side project ---------- */
  .side {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: var(--space-6);
    align-items: start;
  }

  .side__text {
    display: grid;
    gap: 1em;
    max-width: 58ch;
    color: var(--color-text-body);
  }

  .side__cta {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }

  .side__image {
    width: 100%;
    max-width: 18rem;
    height: auto;
    aspect-ratio: 1;
    object-fit: cover;
    border: 1px solid var(--color-rule);
  }

  @media (max-width: 520px) {
    .row {
      grid-template-columns: 96px 1fr;
      gap: 12px;
    }
  }
</style>
