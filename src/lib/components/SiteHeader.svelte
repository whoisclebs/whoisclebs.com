<script lang="ts">
  import { getMessages, locales, type Locale } from '$lib/i18n'
  import { pagePath, pages, type Alternates } from '$lib/routing/paths'

  let { locale, currentPath, alternates }: { locale: Locale; currentPath: string; alternates?: Alternates } = $props()

  const t = $derived(getMessages(locale))
  const items = $derived(
    (
      [
        ['writing', t['nav.writing']],
        ['projects', t['nav.projects']],
        ['about', t['nav.about']],
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
<!-- Cabeçalho fixo de 56 px, translúcido com desfoque, sobre qualquer página (na home, sobre o vídeo do hero).
     Sem menu escondido e sem JS: marca, três destinos e o idioma cabem numa linha até em 320 px (o nome da
     marca some abaixo de 560 px e fica só o símbolo; o nome continua no aria-label). -->
<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href={pages.home[locale]} aria-label="WHOISCLEBS, Clebson Augusto">
      <svg class="brand__symbol" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <rect width="18" height="18" x="3" y="3" rx="3" />
        <path d="m7 11 2-2-2-2" />
        <path d="M11 13h4" />
      </svg>
      <span class="brand__name">whoisclebs</span>
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
    position: fixed;
    inset-inline-start: var(--page-gutter);
    inset-block-start: var(--space-2);
    z-index: 60;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-pill);
    background: var(--color-button);
    color: var(--color-on-button);
    font-size: var(--step--1);
    font-weight: 500;
    transform: translateY(-200%);
  }

  .skip-link:focus-visible {
    transform: none;
  }

  .site-header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 40;
    height: var(--header-h);
    border-block-end: var(--border-hairline) solid color-mix(in oklab, var(--color-text) 10%, transparent);
    /* Quase opaco (94 %): com 55 % os links caíam para 1,3:1 quando uma superfície clara passava por baixo (as
       cópias em papel do Sobre, os botões brancos, o filtro ativo). O desfoque não salva o contraste: a média de um
       objeto claro continua clara. Medido com axe a cada 150 px de rolagem (e2e). */
    background-color: color-mix(in oklab, var(--color-bg) 94%, transparent);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
  }

  /* No topo da página o cabeçalho é translúcido (55 %), como no design, para o vídeo do hero aparecer por baixo;
     nos primeiros 80 px de rolagem ele firma nos 94 %. Nada claro chega ao cabeçalho antes disso. É só cor
     ligada à rolagem (sem deslocamento); sem suporte a `animation-timeline`, vale o fundo firme. */
  @supports (animation-timeline: scroll()) {
    .site-header {
      animation: header-firm linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 80px;
    }
  }

  @keyframes header-firm {
    from {
      background-color: color-mix(in oklab, var(--color-bg) 55%, transparent);
    }

    to {
      background-color: color-mix(in oklab, var(--color-bg) 94%, transparent);
    }
  }

  .site-header__inner {
    display: flex;
    align-items: center;
    gap: clamp(16px, 3vw, 32px);
    height: 100%;
    padding-inline: var(--page-gutter);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin-inline-end: auto;
    color: var(--color-mark);
    font-family: var(--font-display);
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .brand__symbol {
    flex: none;
  }

  @media (max-width: 559px) {
    .brand__name {
      display: none;
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
    gap: clamp(16px, 3vw, 32px);
  }

  .site-nav a,
  .lang a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  /* Página atual: creme cheio e um fio ciano embaixo (não só a cor). */
  .site-nav a[aria-current='page'] {
    color: var(--color-text);
    box-shadow: inset 0 -2px 0 var(--color-accent);
  }

  .lang {
    gap: 2px;
  }

  .lang a {
    justify-content: center;
    min-width: 36px;
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
    color: var(--color-text-faint);
  }

  .lang a[aria-current='true'] {
    color: var(--color-text);
  }

  @media (hover: hover) and (pointer: fine) {
    .site-nav a:hover,
    .lang a:hover {
      color: var(--color-link-hover);
    }
  }
</style>
