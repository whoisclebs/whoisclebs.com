<script lang="ts">
  import { getMessages, type Locale } from '$lib/i18n'

  let { locale }: { locale: Locale } = $props()

  const t = $derived(getMessages(locale))
</script>

<!-- Formulário HTML puro do Substack (entrega e consentimento ficam no provedor); funciona sem JS. -->
<section class="section" aria-labelledby="newsletter-title">
  <p class="eyebrow">{t['newsletter.kicker']}</p>
  <h2 id="newsletter-title">{t['newsletter.title']}</h2>
  <p class="measure">{t['newsletter.description']}</p>
  <form class="newsletter" action="https://whoisclebs.substack.com/api/v1/free?nojs=true" method="post" target="_blank" aria-label={t['newsletter.formLabel']}>
    <label for="newsletter-email">{t['newsletter.emailLabel']}</label>
    <input id="newsletter-email" name="email" type="email" autocomplete="email" required placeholder={t['newsletter.emailPlaceholder']} />
    <button class="button button--primary" type="submit">{t['newsletter.submit']}</button>
  </form>
  <p><a href="https://whoisclebs.substack.com/?utm_campaign=pub&utm_medium=web" rel="noopener noreferrer">{t['newsletter.openSubstack']}</a></p>
</section>

<style>
  .newsletter {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--space-3);
  }

  label {
    flex-basis: 100%;
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  input {
    flex: 1 1 16rem;
    min-width: 0;
    min-height: 48px;
    padding-inline: var(--space-5);
    border: var(--border-hairline) solid color-mix(in oklab, var(--color-text) 35%, transparent);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
  }
</style>
