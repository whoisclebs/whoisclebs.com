<script lang="ts">
  import { SYMBOL_PATH, SYMBOL_VIEWBOX } from '$lib/brand/symbol'
  import { getMessages, locales, type Locale } from '$lib/i18n'
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
  const isCurrent = (href: string) => currentPath === href || (href !== '/' && href !== '/en/' && currentPath.startsWith(href))

  /** Seletor de idioma por link: a página equivalente quando há tradução; senão, a home do idioma. */
  const languages = $derived(
    locales.map((code) => ({
      code,
      short: code === 'en' ? 'EN' : 'PT',
      name: code === 'en' ? t['language.en'] : t['language.pt'],
      href: code === locale ? currentPath : (alternates?.[code] ?? pages.home[code]),
      current: code === locale,
    })),
  )
</script>

<a class="skip-link" href="#conteudo">{t['nav.skip']}</a>
<header class="site-header">
  <div class="page site-header__inner">
    <a class="brand" href={pages.home[locale]} aria-label="WHOISCLEBS, Clebson Augusto">
      <svg class="brand__symbol" viewBox={SYMBOL_VIEWBOX} aria-hidden="true" focusable="false" width="24" height="24">
        <path fill="currentColor" fill-rule="evenodd" d={SYMBOL_PATH} />
      </svg>
      <span class="brand__name">WHOISCLEBS</span>
    </a>

    <nav class="site-nav" aria-label={t['nav.primary']}>
      <ul>
        {#each items as item (item.href)}
          <li><a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</a></li>
        {/each}
      </ul>
    </nav>

    <ul class="lang" aria-label={t['language.label']}>
      {#each languages as language (language.code)}
        <li>
          <a
            href={language.href}
            hreflang={language.code}
            lang={language.code}
            aria-current={language.current ? 'true' : undefined}
            data-sveltekit-reload
          >{language.short}<span class="visually-hidden">{` (${language.name})`}</span></a>
        </li>
      {/each}
    </ul>
  </div>
</header>

<style>
  .skip-link {
    position: absolute;
    inset-inline-start: var(--page-gutter);
    inset-block-start: var(--space-2);
    z-index: 10;
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface);
    border: var(--border-hairline) solid var(--color-text);
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

  /*
   * Mobile: marca + idioma na 1ª linha, navegação inteira na 2ª (sem menu escondido, sem JS).
   * ≥ 720 px: tudo numa linha — a 768 px sobra ~40% da largura (a baseline espremia o header aqui).
   */
  .site-header__inner {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'brand lang'
      'nav nav';
    align-items: center;
    column-gap: var(--space-5);
    padding-block-start: var(--space-3);
  }

  @media (min-width: 720px) {
    .site-header__inner {
      grid-template-columns: auto 1fr auto;
      grid-template-areas: 'brand nav lang';
      padding-block: var(--space-3);
    }
  }

  .brand {
    grid-area: brand;
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    justify-self: start;
    color: var(--color-mark);
    text-decoration: none;
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: var(--step-0);
    letter-spacing: 0.08em;
  }

  .brand__symbol {
    flex: none;
    shape-rendering: crispEdges;
  }

  .site-nav {
    grid-area: nav;
    margin-block-start: var(--space-2);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  @media (min-width: 720px) {
    .site-nav {
      margin: 0;
      border: 0;
      justify-self: end;
    }
  }

  .site-nav ul,
  .lang {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .site-nav ul {
    justify-content: space-between;
    column-gap: var(--space-4);
  }

  @media (min-width: 720px) {
    .site-nav ul {
      column-gap: var(--space-6);
    }
  }

  .site-nav a,
  .lang a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-family: var(--font-mono);
    font-size: var(--step-0);
    color: var(--color-text);
    text-decoration: none;
  }

  /* Página atual: sublinhado grosso em tinta azul, não só cor. */
  .site-nav a[aria-current='page'] {
    color: var(--color-link);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.4em;
  }

  @media (hover: hover) and (pointer: fine) {
    .site-nav a:hover,
    .lang a:hover {
      color: var(--color-link-hover);
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 0.4em;
    }
  }

  .lang {
    grid-area: lang;
    gap: var(--space-1);
    justify-self: end;
  }

  .lang a {
    min-width: 44px;
    justify-content: center;
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .lang a[aria-current='true'] {
    color: var(--color-text);
    box-shadow: inset 0 0 0 var(--border-hairline) var(--color-text);
  }
</style>
