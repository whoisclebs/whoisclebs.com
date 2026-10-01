<script lang="ts">
  import { formatDate, type Locale } from '$lib/i18n'
  import type { ProjectStatus } from '$lib/content/schema'

  /** `date={false}`: só o status, sem "conferido em" (usado no cabeçalho dos cases). */
  let { locale, status, checkedAt, prefix = true, date = true }: { locale: Locale; status: ProjectStatus; checkedAt: string; prefix?: boolean; date?: boolean } = $props()

  const labels: Record<Locale, Record<ProjectStatus, string>> = {
    'pt-BR': { active: 'Ativo', published: 'Publicado', experimental: 'Experimental', study: 'Estudo' },
    en: { active: 'Active', published: 'Published', experimental: 'Experimental', study: 'Study' },
  }
</script>

<p class="meta">
  {#if prefix}Status: {/if}{labels[locale][status]}{#if date} · {locale === 'en' ? 'checked on' : 'conferido em'}
  <time datetime={checkedAt}>{formatDate(checkedAt, locale)}</time>{/if}
</p>
