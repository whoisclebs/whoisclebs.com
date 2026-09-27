<script lang="ts">
  import DecisionMap from '$lib/components/decision-map/DecisionMap.svelte'
  import { formatDate, getMessages } from '$lib/i18n'
  import { articlePath, pagePath, pages, projectPath } from '$lib/routing/paths'
  import type { homeData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof homeData> } = $props()

  const t = $derived(getMessages(data.locale))
  const copy = $derived(t.home)
  // Contato só existe em pt-BR; no inglês o link aponta para a página em português, marcada com hreflang.
  const contactHref = $derived(pagePath('contact', data.locale) ?? pages.contact['pt-BR'])
  const contactLang = $derived(pagePath('contact', data.locale) ? undefined : 'pt-BR')
  const caseHref = $derived(projectPath('tuxedo', data.locale))
  const mapLinks = $derived({ http: { href: caseHref }, payments: { href: pages.about[data.locale] } })
</script>

<section class="hero" aria-labelledby="hero-title">
  <div class="hero__text">
    <h1 id="hero-title" class="hero__title">{copy.title}</h1>
    <p class="hero__support">{copy.support}</p>
    <p class="hero__actions">
      <a class="button button--primary" href={caseHref}>{copy.ctaPrimary}</a>
      <a class="button" href={contactHref} hreflang={contactLang}>{copy.ctaSecondary}</a>
    </p>
  </div>
  <div class="hero__apparatus">
    <DecisionMap copy={copy.map} links={mapLinks} />
  </div>
</section>

<section class="section" aria-labelledby="latest-title">
  <h2 id="latest-title">{copy.latest}</h2>
  <ul class="grid list-reset">
    {#each data.posts as post (post.slug)}
      <li class="card">
        <p class="eyebrow">{post.kicker}</p>
        <h3><a href={articlePath(post.slug, data.locale)}>{post.title}</a></h3>
        <p>{post.excerpt}</p>
        <p class="meta"><time datetime={post.date}>{formatDate(post.date, data.locale)}</time> · {post.readingTime}</p>
      </li>
    {/each}
    <li class="card">
      <p class="eyebrow">{copy.archiveKicker}</p>
      <h3><a href={pages.writing[data.locale]}>{copy.moreWriting}</a></h3>
      <p>{copy.archiveText}</p>
    </li>
  </ul>
</section>

<section class="section" aria-labelledby="projects-title">
  <h2 id="projects-title">{t.openSource.title}</h2>
  <p class="lead">{t.openSource.intro}</p>
  <ul class="grid list-reset">
    {#each data.projects as project (project.slug)}
      <li class="card">
        <h3><a href={project.href}>{project.name}</a></h3>
        <p>{project.description}</p>
        <ul class="tags" aria-label={t.openSource.stackLabel}>
          {#each project.technologies as tech (tech)}<li>{tech}</li>{/each}
        </ul>
        <p class="meta">{project.year}</p>
      </li>
    {/each}
  </ul>
</section>

<section class="section now-section" aria-labelledby="now-title">
  <h2 id="now-title">{copy.nowTitle}</h2>
  <dl class="now">
    {#each copy.nowItems as item, index (item)}
      <div>
        <dt class="eyebrow">{copy.nowLabels[index]}</dt>
        <dd>{item}</dd>
      </div>
    {/each}
  </dl>
  <p class="meta">{copy.nowUpdated}</p>
</section>

<style>
  /* Hero: texto em 8 colunas + aparato em 4 no desktop (≥ 960 px, grade de 12); empilhado abaixo disso. */
  .hero {
    display: grid;
    gap: var(--space-7);
    padding-block: var(--space-5) var(--space-8);
  }

  @media (min-width: 960px) {
    .hero {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      align-items: start;
    }

    .hero__text {
      grid-column: 1 / span 8;
    }

    .hero__apparatus {
      grid-column: 9 / span 4;
    }
  }

  .hero__text {
    display: grid;
    gap: var(--space-6);
    align-content: start;
  }

  /* 48 px em 390, ~67 px em 768 (duas linhas, nada de palavra por linha), teto de 88 px no desktop. */
  .hero__title {
    font-size: clamp(3rem, 1.6rem + 5.4vw, 5.5rem);
    line-height: 1.02;
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }

  .hero__support {
    max-width: 58ch;
    font-size: var(--step-2);
    line-height: 1.45;
    color: var(--color-text-soft);
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .hero__actions .button {
    transition: transform var(--dur-press) var(--ease-out);
  }

  @media (max-width: 639px) {
    .hero__actions .button {
      flex: 1 1 100%;
      justify-content: center;
    }
  }

  .hero__actions .button:active {
    transform: scale(var(--press-scale));
  }

  .now {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }

  .now dd {
    margin: 0;
  }
</style>
