<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { getMessages, type Locale } from '$lib/i18n'

  /**
   * Comentários via Giscus (GitHub Discussions). Mapeamento `specific` pelo termo do site antigo
   * (`blog/<slug>/`, `en/blog/<slug>/`, `til/<slug>/`), que usava `pathname`: as threads continuam ligadas
   * ao texto depois da troca de URL. Nada de terceiros é carregado até o clique; sem JS fica o link.
   */
  let { locale, term }: { locale: Locale; term: string } = $props()

  const REPO = 'whoisclebs/whoisclebs.com'
  const t = $derived(getMessages(locale))
  const searchHref = $derived(`https://github.com/${REPO}/discussions?discussions_q=${encodeURIComponent(`"${term}"`)}`)

  let enhanced = $state(false)
  let loading = $state(false)
  let ready = $state(false)
  let container: HTMLDivElement | undefined = $state()

  onMount(() => {
    enhanced = true
    // O iframe do Giscus avisa por postMessage quando renderiza; aí o texto de carregamento sai.
    const onMessage = (event: MessageEvent) => {
      if (event.origin === 'https://giscus.app') ready = true
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  })

  async function load() {
    if (!container || loading) return
    loading = true
    // O botão sai da tela; o foco vai para a área onde os comentários aparecem, não para o <body>.
    await tick()
    container.focus()
    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    const attributes: Record<string, string> = {
      'data-repo': REPO,
      'data-repo-id': 'R_kgDOLkjfCg',
      'data-category': 'Announcements',
      'data-category-id': 'DIC_kwDOLkjfCs4CeMff',
      'data-mapping': 'specific',
      'data-term': term,
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'bottom',
      'data-theme': 'transparent_dark', // o site tem uma só paleta, escura
      'data-lang': locale === 'en' ? 'en' : 'pt',
    }
    for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value)
    // O client do Giscus procura um elemento `.giscus` e coloca o iframe dentro dele; o script vai no <head>.
    document.head.append(script)
  }
</script>

<section class="comments" aria-labelledby="comments-title">
  <h2 id="comments-title" class="comments__title">{t.comments.title}</h2>
  <p class="comments__text">{t.comments.text}</p>
  <p class="comments__actions">
    {#if enhanced && !loading}
      <button type="button" class="button" onclick={load}>{t.comments.load}</button>
    {/if}
    <a href={searchHref} rel="noopener noreferrer">{t.comments.open}</a>
  </p>
  {#if loading && !ready}
    <p class="comments__status" role="status">{t.comments.loading}</p>
  {/if}
  <div class="comments__frame giscus" tabindex="-1" bind:this={container}></div>
</section>

<style>
  .comments {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-7);
    border-block-start: var(--border-hairline) solid var(--color-rule);
  }

  .comments__title {
    font-size: var(--step-3);
    letter-spacing: -0.01em;
  }

  .comments__text {
    max-width: 60ch;
    color: var(--color-text-soft);
    font-size: var(--step-0);
  }

  .comments__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-5);
  }

  .comments__status {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .comments__frame:focus {
    outline: none;
  }
</style>
