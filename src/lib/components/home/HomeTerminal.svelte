<!--
  Seção do terminal na home. O aparelho (`$lib/eggs/terminal/TerminalDevice.svelte`: notebook acima de 720 px de
  contêiner, celular até 720 px) é uma ilha: só é baixado quando a seção chega a 400 px da tela, fora do JS de
  entrada da home. A caixa reserva a altura do aparelho antes de ele chegar (as mesmas fórmulas em `cqi` de
  `Laptop.svelte` e `Phone.svelte`), e a do notebook já é a da pose aberta: nada se move quando ele abre.
  Título e texto mudam com o aparelho por container query, sem JS e sem piscar.
  Sem JS a seção fica só com o título e uma linha dizendo que precisa de JavaScript: um aparelho desenhado que
  não responde ao clique seria pior que nenhum, e a altura reservada viraria um buraco na página.
-->
<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import { getMessages, type Locale } from '$lib/i18n'
  import type { TerminalCatalog } from '$lib/eggs/terminal/catalog'

  let { locale, catalog }: { locale: Locale; catalog: TerminalCatalog } = $props()

  const t = $derived(getMessages(locale))
  let slot: HTMLElement
  let Device = $state<Component<{ catalog: TerminalCatalog }>>()

  onMount(() => {
    let cancelled = false
    const load = () => {
      void import('$lib/eggs/terminal/TerminalDevice.svelte').then((module) => {
        if (!cancelled) Device = module.default
      })
    }
    if (!('IntersectionObserver' in window)) {
      load()
      return () => (cancelled = true)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        load()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(slot)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  })
</script>

<section class="terminal page" id="terminal" aria-labelledby="terminal-title">
  <div class="terminal__head">
    <h2 id="terminal-title">
      <span class="for-laptop">{t.home.terminal.title}</span>
      <span class="for-phone">{t.home.terminal.phoneTitle}</span>
    </h2>
    <p class="terminal__text">
      <span class="for-laptop">{t.home.terminal.text}</span>
      <span class="for-phone">{t.home.terminal.phoneText}</span>
    </p>
    <noscript><p class="terminal__text">{t.home.terminal.noScript}</p></noscript>
  </div>
  <div class="terminal__device">
    <div class="terminal__frame" bind:this={slot}>
      {#if Device}
        <Device {catalog} />
      {/if}
    </div>
  </div>
</section>

<style>
  .terminal {
    container: terminal / inline-size;
    padding-block-start: var(--space-section);
    scroll-margin-top: var(--header-h);
  }

  .terminal__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-5);
    margin-block-end: 40px;
  }

  h2 {
    letter-spacing: -0.01em;
  }

  .terminal__text {
    max-width: 460px;
    font-size: var(--step-0);
    line-height: 1.6;
    color: var(--color-text-soft);
  }

  /* Textos por aparelho: o mesmo corte de 720 px da ilha. */
  .for-phone {
    display: none;
  }

  @container terminal (max-width: 720px) {
    .for-laptop {
      display: none;
    }

    .for-phone {
      display: inline;
    }
  }

  .terminal__device {
    container-type: inline-size;
  }

  /* Altura reservada = altura do aparelho (cópia das fórmulas dos componentes):
     celular: --ph + 10 px de sombra + 44 px da dica; notebook: palco (0,9 × --w) + 44 px da dica. */
  .terminal__frame {
    min-height: calc(min(78svh, 700px, calc((100cqi - 48px) * 2.06)) + 54px);
  }

  @container (min-width: 721px) {
    .terminal__frame {
      min-height: calc(min(760px, 76cqi) * 0.9 + 44px);
    }
  }

  /* Sem JS: só o título e a linha do <noscript>. */
  @media (scripting: none) {
    .terminal__frame {
      min-height: 0;
    }

    .terminal__head > .terminal__text {
      display: none;
    }
  }
</style>
