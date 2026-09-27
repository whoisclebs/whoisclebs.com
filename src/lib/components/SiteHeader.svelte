<script lang="ts">
  import { getMessages, type Locale } from '$lib/i18n'
  import { pagePath, pages, type Alternates } from '$lib/routing/paths'

  let { locale, currentPath, alternates }: { locale: Locale; currentPath: string; alternates?: Alternates } = $props()

  const t = $derived(getMessages(locale))
  const items = $derived(
    (
      [
        ['projects', t['nav.projects']],
        ['writing', t['nav.writing']],
        ['about', t['nav.about']],
        ['contact', t['nav.contact']],
      ] as const
    )
      .map(([key, label]) => ({ href: pagePath(key, locale), label }))
      .filter((item): item is { href: string; label: string } => Boolean(item.href)),
  )
  const otherLocale = $derived<Locale>(locale === 'en' ? 'pt-BR' : 'en')
  const switchHref = $derived(alternates?.[otherLocale] ?? pages.home[otherLocale])
  const isCurrent = (href: string) => currentPath === href || (href !== '/' && href !== '/en/' && currentPath.startsWith(href))
</script>

<a class="skip-link" href="#conteudo">{t['nav.skip']}</a>
<header class="site-header">
  <div class="page site-header__inner">
    <a class="brand" href={pages.home[locale]} aria-label="WHOISCLEBS — Clebson Augusto">
      <svg class="brand__symbol" viewBox="0 0 16 16" aria-hidden="true" width="24" height="24">
        <path fill="currentColor" fill-rule="evenodd" d="M0 0H16V16H0Z M3 3V13H13V10H6V6H13V3Z" />
      </svg>
      <span class="brand__name">WHOISCLEBS</span>
    </a>
    <nav class="site-nav" aria-label={t['nav.primary']}>
      <ul>
        {#each items as item (item.href)}
          <li><a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</a></li>
        {/each}
      </ul>
      <a
        class="lang-switch"
        href={switchHref}
        hreflang={otherLocale}
        lang={otherLocale}
        data-sveltekit-reload
      >{otherLocale === 'en' ? 'EN' : 'PT'}<span class="visually-hidden"> — {otherLocale === 'en' ? t['language.en'] : t['language.pt']}</span></a>
    </nav>
  </div>
</header>

<style>
  .skip-link {
    position: absolute;
    inset-inline-start: var(--space-4);
    inset-block-start: var(--space-2);
    z-index: 10;
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface);
    color: var(--color-link);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    transform: translateY(-200%);
  }

  .skip-link:focus-visible {
    transform: none;
  }

  .site-header {
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .site-header__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3) var(--space-6);
    padding-block: var(--space-4);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-mark);
    text-decoration: none;
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: var(--step-0);
    letter-spacing: 0.08em;
  }

  .site-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-5);
  }

  .site-nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .site-nav a {
    display: inline-block;
    padding-block: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--step-0);
    color: var(--color-text);
    text-decoration: none;
  }

  .site-nav a[aria-current='page'] {
    color: var(--color-link);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.35em;
  }

  .lang-switch {
    padding-inline: var(--space-2) !important;
    border: var(--border-hairline) solid var(--color-rule);
  }
</style>
