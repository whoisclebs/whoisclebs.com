<script lang="ts">
  import { contactEmail, socialLinks } from '$lib/content/library'
  import { getMessages, type Locale } from '$lib/i18n'
  import { pagePath } from '$lib/routing/paths'

  let { locale }: { locale: Locale } = $props()

  const t = $derived(getMessages(locale))
  const secondary = $derived(
    (
      [
        ['notes', t['nav.notes']],
        ['books', t['nav.books']],
        ['hobbies', t['nav.hobbies']],
        ['privacy', t['footer.privacy']],
        ['terms', t['footer.terms']],
      ] as const
    )
      .map(([key, label]) => ({ href: pagePath(key, locale), label }))
      .filter((item): item is { href: string; label: string } => Boolean(item.href)),
  )
  const feed = $derived(locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
</script>

<footer class="site-footer">
  <div class="page site-footer__inner">
    <p class="site-footer__name">Clebson Augusto</p>
    <nav aria-label={t['nav.secondary']}>
      <ul>
        {#each secondary as item (item.href)}
          <li><a href={item.href}>{item.label}</a></li>
        {/each}
        <li><a href={feed} type="application/rss+xml">{t['footer.rss']}</a></li>
      </ul>
    </nav>
    <nav aria-label={t['footer.social']}>
      <ul>
        <li><a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
        {#each socialLinks as link (link.href)}
          <li><a href={link.href} rel="noopener noreferrer me">{link.label}</a></li>
        {/each}
      </ul>
    </nav>
    <p class="meta">© 2022–2026 Clebson A. Fonseca. {t['footer.madeWith']}</p>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--color-night-bg);
    color: var(--color-night-text);
  }

  .site-footer__inner {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-8);
  }

  .site-footer__name {
    font-family: var(--font-display);
    font-size: var(--step-3);
    line-height: 1;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    color: var(--color-night-link);
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  .meta {
    color: var(--color-night-text-soft);
  }
</style>
