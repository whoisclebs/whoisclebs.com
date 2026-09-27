<script lang="ts">
  import FooterActivity from '$lib/components/footer/FooterActivity.svelte'
  import FooterHorizon from '$lib/components/footer/FooterHorizon.svelte'
  import { contactEmail, socialLinks } from '$lib/content/library'
  import { getMessages, type Locale } from '$lib/i18n'
  import { pagePath, pagePathOrDefault, type PageKey } from '$lib/routing/paths'

  let { locale, currentPath = '' }: { locale: Locale; currentPath?: string } = $props()

  const t = $derived(getMessages(locale))
  const c = $derived(t.closing)
  const githubProfile = socialLinks.find((link) => link.label === 'GitHub')?.href ?? 'https://github.com/whoisclebs'
  const contactPage = $derived(pagePath('contact', locale))
  // Na própria página de contato o convite repetiria o conteúdo acima dele.
  const showInvite = $derived(!contactPage || currentPath !== contactPage)

  // Notas e Agentes só existem em pt-BR: no inglês, o link vai para a página em português, marcado.
  const secondary = $derived(
    (
      [
        ['notes', t['nav.notes']],
        ['books', t['nav.books']],
        ['hobbies', t['nav.hobbies']],
        ['agents', t['nav.agents']],
      ] as const satisfies readonly (readonly [PageKey, string])[]
    ).map(([key, label]) => ({ href: pagePathOrDefault(key, locale), label, fallback: !pagePath(key, locale) })),
  )
  const legal = $derived([
    { href: pagePathOrDefault('privacy', locale), label: t['footer.privacy'] },
    { href: pagePathOrDefault('terms', locale), label: t['footer.terms'] },
  ])
  const feed = $derived(locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
</script>

<!-- O rodapé volta à noite e fecha o ciclo do amanhecer (hero → aurora → dia → noite). -->
<footer class="site-footer band-night">
  <div class="page">
    {#if showInvite}
    <section class="invite" aria-labelledby="footer-invite-title">
      <h2 id="footer-invite-title" class="invite__title">{c.inviteTitle}</h2>
      <div class="invite__body">
        <p>{c.inviteText}</p>
        <a class="invite__mail" href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </div>
    </section>
    {/if}

    <div class="columns">
      <nav class="col col--contact" aria-labelledby="footer-contact-title">
        <h2 id="footer-contact-title" class="col__title">{c.contactHeading}</h2>
        <ul>
          {#if contactPage}<li><a href={contactPage} aria-current={showInvite ? undefined : 'page'}>{c.contactPage}</a></li>{/if}
          {#each socialLinks as link (link.href)}
            <li><a href={link.href} rel="noopener noreferrer me">{link.label}</a></li>
          {/each}
        </ul>
      </nav>

      <div class="col col--read">
        <h2 id="footer-read-title" class="col__title">{c.readHeading}</h2>
        <ul aria-labelledby="footer-read-title">
          <li><a href={feed} type="application/rss+xml">{c.rss}</a></li>
          <!-- /resume.json: JSON Resume gerado do conteúdo (src/lib/server/publishing/resume.ts). -->
          <li><a href="/resume.json" type="application/json">{c.resume}</a></li>
        </ul>
        <nav aria-label={t['nav.secondary']}>
          <h2 class="col__title col__title--sub">{c.moreHeading}</h2>
          <ul>
            {#each secondary as item (item.href)}
              <li>
                <a href={item.href} hreflang={item.fallback ? 'pt-BR' : undefined}>{item.label}</a>{#if item.fallback}<span class="fallback"> {c.ptOnly}</span>{/if}
              </li>
            {/each}
          </ul>
        </nav>
      </div>

      <section class="col col--activity" aria-labelledby="footer-activity-title">
        <h2 id="footer-activity-title" class="col__title">{c.activityHeading}</h2>
        <FooterActivity {locale} profileUrl={githubProfile} />
      </section>
    </div>
  </div>

  <FooterHorizon />

  <div class="page colophon">
    <p>{c.colophon} {t['footer.madeWith']}</p>
    <ul aria-label={locale === 'en' ? 'Legal' : 'Jurídico'}>
      {#each legal as item (item.href)}<li><a href={item.href}>{item.label}</a></li>{/each}
    </ul>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--color-bg);
    color: var(--color-text);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Convite: o gesto de "Contato" do colofão (C), em Anton, sobre o papel. */
  .invite {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-8) var(--space-7);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  /* Menor que o H1 da home (--step-5): o convite fecha a página, não compete com a tese. */
  .invite__title {
    max-width: 16ch;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 1.2rem + 4.4vw, 5rem);
    font-weight: 400;
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }

  .invite__body {
    display: grid;
    align-content: end;
    gap: var(--space-4);
  }

  .invite__body p {
    max-width: 40ch;
    color: var(--color-text-soft);
  }

  .invite__mail {
    justify-self: start;
    font-family: var(--font-display);
    font-size: var(--step-3);
    line-height: var(--leading-heading);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.12em;
    overflow-wrap: anywhere;
  }

  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-7) var(--space-5);
    padding-block: var(--space-7) var(--space-6);
  }

  .col--activity {
    grid-column: 1 / -1;
  }

  .col {
    display: grid;
    align-content: start;
    gap: var(--space-3);
  }

  .col__title {
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    line-height: var(--leading-ui);
  }

  .col__title--sub {
    margin-block: var(--space-5) var(--space-3);
  }

  .col li {
    padding-block: var(--space-1);
    font-size: var(--step-0);
    line-height: var(--leading-ui);
  }

  .fallback {
    color: var(--color-text-faint);
    font-size: var(--step--1);
  }

  .colophon {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4) var(--space-6);
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    line-height: var(--leading-ui);
  }

  .colophon ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
  }

  @media (min-width: 640px) {
    .columns {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .col--contact,
    .col--read {
      grid-column: span 3;
    }

    .col--activity {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 960px) {
    .invite {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      padding-block-start: var(--space-9);
    }

    .invite__title {
      grid-column: 1 / span 6;
    }

    /* Mesma borda esquerda da coluna de atividade (7 + calha). */
    .invite__body {
      grid-column: 7 / -1;
      padding-inline-start: var(--grid-gap);
    }

    .columns {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .col--contact {
      grid-column: 1 / span 3;
    }

    .col--read {
      grid-column: 4 / span 3;
    }

    .col--activity {
      grid-column: 7 / -1;
      padding-inline-start: var(--grid-gap);
      border-inline-start: var(--border-hairline) solid var(--color-rule);
    }
  }
</style>
