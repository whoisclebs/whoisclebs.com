<script lang="ts">
  import { onMount } from 'svelte'
  import { formatDateTime, formatDay, relativeTime, type ActivityResult } from '$lib/activity/activity-client'
  import { requestActivity } from '$lib/activity/activity-store'
  import { getMessages, type Locale } from '$lib/i18n'

  let { locale, profileUrl }: { locale: Locale; profileUrl: string } = $props()

  const t = $derived(getMessages(locale).closing)

  /**
   * `nojs` é o HTML prerenderizado (link para o perfil). Com JS, o estado passa a `idle` na montagem e
   * a busca só começa quando o rodapé se aproxima da viewport: nunca compete com o conteúdo crítico.
   * Na home, o HUD do hero já terá pedido a mesma busca depois do `load`; aqui só se reaproveita a resposta
   * (`activity-store.ts`). O rodapé lista todos os eventos do cache (no máximo 10), a mesma contagem do HUD.
   */
  let view = $state<{ state: 'nojs' | 'idle' | 'loading' } | ActivityResult>({ state: 'nojs' })
  const loaded = $derived(view.state === 'fresh' || view.state === 'stale' ? view : null)
  let now = $state(new Date())
  let root: HTMLElement

  onMount(() => {
    view = { state: 'idle' }
    let cancelled = false
    let started = false

    const start = async () => {
      if (started) return
      started = true
      view = { state: 'loading' }
      const { result } = await requestActivity()
      if (cancelled) return
      now = new Date()
      view = result
    }

    if (!('IntersectionObserver' in window)) {
      void start()
      return () => {
        cancelled = true
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void start()
        }
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(root)
    return () => {
      observer.disconnect()
      cancelled = true
    }
  })
</script>

<div class="activity" bind:this={root} data-activity-state={view.state} aria-busy={view.state === 'loading' || view.state === 'idle'}>
  {#if view.state === 'nojs'}
    <p class="note">{t.activityNoJs} <a href={profileUrl} rel="noopener noreferrer me">{t.activityProfileLink}</a>.</p>
  {:else if view.state === 'idle' || view.state === 'loading'}
    <p class="note">{t.activityLoading}</p>
  {:else if view.state === 'unavailable'}
    <p class="note">{t.activityUnavailable}</p>
    <p class="profile"><a href={profileUrl} rel="noopener noreferrer me">{t.activityProfile}</a></p>
  {:else if loaded}
    {#if loaded.state === 'fresh'}
      <p class="status">
        <span class="status__cell" aria-hidden="true"></span>
        <span><strong>{t.activityFresh}</strong> · {t.activitySource}
          <time datetime={loaded.updatedAt} title={formatDateTime(loaded.updatedAt, locale)}>{relativeTime(loaded.updatedAt, now, locale)}</time></span>
      </p>
    {:else}
      <p class="status status--stale">
        {t.activityStale} <time datetime={loaded.updatedAt}>{formatDateTime(loaded.updatedAt, locale)}</time>.
      </p>
    {/if}
    {#if loaded.items.length > 0}
      <ul class="items" lang="pt-BR">
        {#each loaded.items as item (item.id)}
          <li>
            <a href={item.url} rel="noopener noreferrer">{item.title}</a>
            <time datetime={item.occurredAt} lang={locale}>{formatDay(item.occurredAt, locale)}</time>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="note">{t.activityEmpty}</p>
    {/if}
    <p class="profile"><a href={profileUrl} rel="noopener noreferrer me">{t.activityProfile}</a></p>
  {/if}
</div>

<style>
  .activity {
    display: grid;
    align-content: start;
    gap: var(--space-4);
    min-height: 12rem;
  }

  .note {
    max-width: 40ch;
    color: var(--color-text-soft);
  }

  .status {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    line-height: var(--leading-ui);
  }

  .status strong {
    color: var(--color-text);
    font-weight: 500;
  }

  /* Verde só como reforço: o estado está escrito ao lado ("Em dia"). */
  .status__cell {
    flex: none;
    width: var(--cell);
    height: var(--cell);
    background: var(--color-status-live);
  }

  .status--stale {
    display: block;
    padding-inline-start: var(--space-3);
    border-inline-start: 2px solid var(--color-text);
    color: var(--color-text);
  }

  .items {
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .items li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    gap: var(--space-4);
    padding-block: var(--space-2);
    border-block-end: var(--border-hairline) solid var(--color-grid);
    font-size: var(--step-0);
    line-height: var(--leading-ui);
  }

  .items time {
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    white-space: nowrap;
  }

  .profile {
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }
</style>
