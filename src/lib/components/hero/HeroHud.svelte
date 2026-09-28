<!--
  HUD da home: uma linha de estado sobre o fio do horizonte, no fim do hero. Aceno a jogos de estratégia, só
  com dado real e rótulo em texto. Desde o passo 17 fica só o build (SHA curto do commit publicado, com link,
  gravado no build): a fonte GitHub Events foi desativada, e a atividade pública, o último sync e a latência
  de `/api/activity` saíram (decisions.md 102). A home não chama mais a API. O item fica à direita, onde a
  luz do vídeo encosta no fio.
  Dica: abre no hover (ponteiro fino), no foco do teclado e no toque (botão); Esc fecha.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { buildInfo } from '$lib/build-info'
  import { getMessages, type Locale } from '$lib/i18n'

  let { locale }: { locale: Locale } = $props()

  const t = $derived(getMessages(locale).hud)
  const build = buildInfo()

  // `nojs` no HTML prerenderizado; `done` depois da hidratação (os testes esperam por ele).
  let phase = $state<'nojs' | 'done'>('nojs')
  let open = $state(false)
  let dismissed = $state(false)
  let root: HTMLElement

  onMount(() => {
    phase = 'done'
    const closeOutside = (event: PointerEvent) => {
      if (open && !root.contains(event.target as Node)) open = false
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      dismissed = true
      open = false
    }
    const reset = () => (dismissed = false)
    document.addEventListener('pointerdown', closeOutside)
    root.addEventListener('keydown', onKeydown)
    root.addEventListener('focusout', reset)
    root.addEventListener('mouseleave', reset)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      root.removeEventListener('keydown', onKeydown)
      root.removeEventListener('focusout', reset)
      root.removeEventListener('mouseleave', reset)
    }
  })
</script>

<div class="hud" bind:this={root} data-hud-phase={phase} role="group" aria-label={t.label}>
  <div class="page">
    <ul class="hud__list">
      <li class="hud__item" data-hud="build" data-open={open || undefined} data-dismissed={dismissed || undefined}>
        <button
          type="button"
          class="hud__label"
          aria-describedby="hud-tip-build"
          onclick={() => {
            dismissed = false
            open = !open
          }}>{t.build.label}</button
        >
        {#if build}
          <a class="hud__value" href={build.url} rel="noopener noreferrer">{build.short}</a>
        {:else}
          <span class="hud__value">{t.noData}</span>
        {/if}
        <span class="hud__tip" role="tooltip" id="hud-tip-build">{t.build.tip}</span>
      </li>
    </ul>
  </div>
</div>

<style>
  /* O horizonte: fio âmbar de 1 px com a primeira luz nascendo a leste (à direita). */
  .hud {
    position: relative;
    border-block-start: var(--border-hairline) solid var(--color-sun);
  }

  .hud::before {
    content: '';
    position: absolute;
    inset: auto 0 100% auto;
    width: min(60%, 44rem);
    height: 72px;
    background: radial-gradient(60% 100% at 100% 100%, rgb(242 230 160 / 0.32), rgb(242 230 160 / 0) 72%);
    pointer-events: none;
  }

  /*
   * Onde a faixa de luz do vídeo encosta no horizonte: um ponto quente no fio e um reflexo curto abaixo
   * dele. Decorativo; o fio continua sendo o limite da noite. Pulsa devagar só com movimento permitido.
   */
  .hud::after {
    content: '';
    position: absolute;
    inset: -1px 0 auto auto;
    width: min(46%, 36rem);
    height: 1px;
    background: linear-gradient(to right, rgb(242 230 160 / 0), rgb(250 244 210 / 0.95) 72%, rgb(242 230 160 / 0.4));
    box-shadow: 0 0 12px 1px rgb(242 230 160 / 0.55);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .hud::after {
      animation: horizon-glint 7s ease-in-out infinite alternate;
    }
  }

  @keyframes horizon-glint {
    from {
      opacity: 0.55;
    }
    to {
      opacity: 1;
    }
  }

  /* Um item só, à direita, onde a luz do vídeo toca o fio. */
  .hud__list {
    display: flex;
    justify-content: flex-end;
    margin: 0;
    padding: var(--space-2) 0;
    list-style: none;
  }

  .hud__item {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    min-width: 0;
    font-family: var(--font-mono);
    font-size: var(--step--2);
    line-height: var(--leading-ui);
  }

  .hud__label {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-text-soft);
    font: inherit;
    letter-spacing: var(--tracking-mono);
    text-decoration: underline dotted var(--color-text-faint);
    text-underline-offset: 0.3em;
    cursor: help;
  }

  .hud__value {
    color: var(--color-text);
    font-size: var(--step--1);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  a.hud__value {
    color: var(--color-text);
    text-decoration-color: var(--color-sun);
  }

  /* ---------- Dica tátil: fio âmbar, entalhe apontando para a leitura, relevo interno leve ---------- */
  .hud__tip {
    position: absolute;
    inset-block-end: calc(100% + 12px);
    inset-inline-start: 0;
    z-index: 5;
    width: max-content;
    max-width: min(20rem, calc(100vw - 2 * var(--page-gutter)));
    padding: var(--space-3) var(--space-4);
    border: var(--border-hairline) solid var(--color-sun);
    border-radius: var(--radius-control);
    background: var(--p-night-raised);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.07),
      inset 0 -1px 0 rgb(0 0 0 / 0.35),
      0 8px 24px rgb(0 0 0 / 0.35);
    color: var(--p-on-night);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    line-height: 1.5;
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    transform: scale(0.97);
    transform-origin: 16px calc(100% + 8px);
    transition:
      opacity var(--dur-tip) var(--ease-out),
      transform var(--dur-tip) var(--ease-out),
      visibility 0s linear var(--dur-tip);
  }

  /* Entalhe e ponte invisível (o ponteiro atravessa o vão sem fechar a dica, WCAG 1.4.13). */
  .hud__tip::before {
    content: '';
    position: absolute;
    inset: 100% 0 auto;
    height: 14px;
  }

  .hud__tip::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: 14px;
    width: 9px;
    height: 9px;
    border-inline-end: var(--border-hairline) solid var(--color-sun);
    border-block-end: var(--border-hairline) solid var(--color-sun);
    background: var(--p-night-raised);
    transform: translateY(-4px) rotate(45deg);
  }

  /* O item fica à direita: a dica se ancora pela direita e não sai da tela. */
  .hud__tip {
    inset-inline: auto 0;
    transform-origin: calc(100% - 16px) calc(100% + 8px);
  }

  .hud__tip::after {
    inset-inline: auto 14px;
  }

  .hud__item:is(:focus-within, [data-open]) .hud__tip {
    opacity: 1;
    visibility: visible;
    transform: none;
    transition-delay: 0s;
  }

  @media (hover: hover) and (pointer: fine) {
    .hud__item:hover .hud__tip {
      opacity: 1;
      visibility: visible;
      transform: none;
      transition-delay: 0s;
    }
  }

  .hud__item[data-dismissed] .hud__tip {
    opacity: 0;
    visibility: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .hud__tip {
      transform: none;
      transition:
        opacity var(--dur-tip) linear,
        visibility 0s linear var(--dur-tip);
    }
  }
</style>
