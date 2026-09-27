<script lang="ts">
  import { format, formatDate, getMessages, type Locale } from '$lib/i18n'

  /** Datas de publicação e revisão (ISO no `datetime`) e tempo de leitura de um artigo ou nota. */
  let { locale, date, updated, minutes }: { locale: Locale; date: string; updated?: string; minutes: number } = $props()

  const t = $derived(getMessages(locale))
</script>

<dl class="entry-meta">
  <div>
    <dt>{t.writing.published}</dt>
    <dd><time datetime={date}>{formatDate(date, locale)}</time></dd>
  </div>
  {#if updated && updated !== date}
    <div>
      <dt>{t.writing.revised}</dt>
      <dd><time datetime={updated}>{formatDate(updated, locale)}</time></dd>
    </div>
  {/if}
  <div>
    <dt>{t.writing.readingLabel}</dt>
    <dd>{format(t.writing.minutes, { n: minutes })}</dd>
  </div>
</dl>

<style>
  .entry-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-7);
    padding-block-start: var(--space-4);
    border-block-start: var(--border-hairline) solid var(--color-rule);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-variant-numeric: tabular-nums;
  }

  dt {
    color: var(--color-text-faint);
  }

  dd {
    margin: 0;
    color: var(--color-text);
  }
</style>
