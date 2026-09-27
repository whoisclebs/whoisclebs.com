<script lang="ts">
  import { formatDate, type Locale } from '$lib/i18n'
  import type { ProjectStatus } from '$lib/content/schema'

  let { locale, status, checkedAt, prefix = true }: { locale: Locale; status: ProjectStatus; checkedAt: string; prefix?: boolean } = $props()

  const labels: Record<Locale, Record<ProjectStatus, string>> = {
    'pt-BR': { active: 'Ativo', published: 'Publicado', experimental: 'Experimental', study: 'Estudo' },
    en: { active: 'Active', published: 'Published', experimental: 'Experimental', study: 'Study' },
  }
</script>

<p class="meta">
  {#if prefix}Status: {/if}{labels[locale][status]} · {locale === 'en' ? 'checked on' : 'conferido em'}
  <time datetime={checkedAt}>{formatDate(checkedAt, locale)}</time>
</p>
