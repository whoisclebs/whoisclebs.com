<script lang="ts">
  import { contactEmail, socialLinks } from '$lib/content/library'
  import { say } from '$lib/eggs/state.svelte'
  import { getMessages, type Locale } from '$lib/i18n'
  import { pagePath, pagePathOrDefault, type PageKey } from '$lib/routing/paths'

  let { locale }: { locale: Locale } = $props()

  const t = $derived(getMessages(locale))
  const c = $derived(t.closing)

  // Notas, Agentes e Contato só existem em pt-BR: no inglês, o link vai para a página em português, marcado
  // (o contato vira o e-mail).
  const more = $derived(
    (
      [
        ['notes', t['nav.notes']],
        ['books', t['nav.books']],
        ['hobbies', t['nav.hobbies']],
      ] as const satisfies readonly (readonly [PageKey, string])[]
    ).map(([key, label]) => ({ href: pagePathOrDefault(key, locale), label, fallback: !pagePath(key, locale) })),
  )
  const contactHref = $derived(pagePath('contact', locale) ?? `mailto:${contactEmail}`)
  const feed = $derived(locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
  const legal = $derived([
    { href: pagePathOrDefault('privacy', locale), label: t['footer.privacy'] },
    { href: pagePathOrDefault('terms', locale), label: t['footer.terms'] },
  ])
  // Na linha de baixo ficam só os dois perfis do design; os outros estão na página de contato.
  const profiles = socialLinks.filter((link) => link.label === 'GitHub' || link.label === 'LinkedIn')

  // Easter egg: cinco toques seguidos na marca do rodapé.
  let taps = 0
  function tap() {
    taps += 1
    if (taps < 5) return
    taps = 0
    say(t.eggs.toast.taps)
  }
</script>

<!--
  Rodapé em duas linhas sobre o grafite, separadas da página por um fio: em cima, o resto do site (as páginas que
  não cabem no cabeçalho); embaixo, a marca à esquerda e o jurídico e os perfis à direita, como no design.
-->
<footer class="site-footer">
  <nav class="more" aria-label={t['nav.secondary']}>
    <ul>
      {#each more as item (item.href)}
        <li>
          <a href={item.href} hreflang={item.fallback ? 'pt-BR' : undefined}>{item.label}</a>{#if item.fallback}<span class="fallback"> {c.ptOnly}</span>{/if}
        </li>
      {/each}
      <li><a href={contactHref}>{t['nav.contact']}</a></li>
      <li><a href={feed} type="application/rss+xml">{t['footer.rss']}</a></li>
      <!-- /resume.json: JSON Resume gerado do conteúdo (src/lib/server/publishing/resume.ts). -->
      <li><a href="/resume.json" type="application/json">{c.resume}</a></li>
    </ul>
  </nav>

  <div class="base">
    <div class="base__brand">
      <button type="button" class="wordmark" onclick={tap}>whoisclebs.com</button>
      <p class="colophon">{c.colophon} {t['footer.madeWith']}</p>
    </div>
    <ul class="base__links">
      {#each legal as item (item.href)}<li><a href={item.href}>{item.label}</a></li>{/each}
      {#each profiles as link (link.href)}
        <li><a href={link.href} rel="noopener noreferrer me">{link.label}</a></li>
      {/each}
    </ul>
  </div>
</footer>

<style>
  .site-footer {
    border-block-start: var(--border-hairline) solid var(--color-rule);
    padding-inline: var(--page-gutter);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0 28px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--color-text-faint);
  }

  @media (hover: hover) and (pointer: fine) {
    li a:hover {
      color: var(--color-text);
    }
  }

  .more {
    padding-block: var(--space-5) var(--space-2);
  }

  .fallback {
    font-size: var(--step--2);
  }

  .base {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding-block: var(--space-4) var(--space-6);
    border-block-start: var(--border-hairline) solid var(--color-rule-soft);
  }

  /* A marca é um botão sem cara de botão: cinco toques seguidos respondem (easter egg). */
  .wordmark {
    display: block;
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: 600;
    line-height: 1.4;
    cursor: default;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .colophon {
    font-size: var(--step--2);
  }
</style>
