<!--
  Moldura do simulador no case tuxedo.
  - Sem JS: tabela estática com o cenário padrão, pré-calculado no build pela mesma lógica ($lib/sim).
  - Com JS: a ilha (Simulator.svelte) chega por import dinâmico — o chunk só é baixado nesta página —
    e a tabela fica recolhida num <details>, com o mesmo conteúdo.
-->
<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import { formatMs, KIND_LABEL, STATUS_LABEL } from '$lib/sim/labels'
  import type { SimEvent } from '$lib/sim/simulator'

  interface Props {
    scenario: { seed: number; failurePercent: number; latencyMs: number; events: SimEvent[]; summary: string }
  }

  let { scenario }: Props = $props()

  let Simulator = $state<Component | null>(null)
  let tableOpen = $state(true)

  onMount(async () => {
    const module = await import('./Simulator.svelte')
    Simulator = module.default
    tableOpen = false
  })
</script>

<div class="sim-demo" id="simulador">
  {#if Simulator}
    <Simulator />
  {:else}
    <p class="sim-demo__nojs">
      <strong>Simulação com dados sintéticos.</strong> O simulador interativo precisa de JavaScript; a tabela abaixo mostra
      o mesmo cenário padrão (semente {scenario.seed}), passo a passo.
    </p>
  {/if}

  <details class="sim-demo__table" bind:open={tableOpen}>
    <summary>Cenário padrão em tabela ({scenario.events.length} passos, semente {scenario.seed})</summary>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (região rolável precisa de foco por teclado; axe scrollable-region-focusable) -->
    <div class="sim-demo__scroll" role="region" aria-labelledby="sim-table-caption" tabindex="0">
      <table>
        <caption id="sim-table-caption">Cenário padrão pré-calculado: falha de {scenario.failurePercent}%, latência média de {formatMs(scenario.latencyMs)}, com chave de idempotência. Dados sintéticos.</caption>
        <thead>
          <tr>
            <th scope="col">Passo</th>
            <th scope="col">Tempo</th>
            <th scope="col">Pedido</th>
            <th scope="col">Resultado</th>
            <th scope="col">Disjuntor</th>
            <th scope="col">Explicação</th>
          </tr>
        </thead>
        <tbody>
          {#each scenario.events as event (event.index)}
            <tr>
              <th scope="row">{event.index}</th>
              <td class="num">{formatMs(event.at)}</td>
              <td>{event.order}, tentativa {event.attempt}</td>
              <td>{KIND_LABEL[event.kind]}</td>
              <td>{STATUS_LABEL[event.breakerBefore]} → {STATUS_LABEL[event.breakerAfter]}</td>
              <td>{event.message}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="sim-demo__summary">{scenario.summary}</p>
  </details>
</div>

<style>
  .sim-demo {
    display: grid;
    gap: var(--space-5);
    min-width: 0;
    max-width: 58rem;
  }

  .sim-demo__nojs {
    padding: var(--space-3) var(--space-4);
    border: var(--border-hairline) dashed var(--color-text);
    max-width: 62ch;
  }

  /* Item de grade: sem min-width 0, a tabela (50rem) esticaria a página em 390 px quando aberta (sem JS). */
  .sim-demo__table {
    min-width: 0;
  }

  .sim-demo__table summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    font-size: var(--step-0);
  }

  .sim-demo__scroll {
    overflow-x: auto;
    margin-block-start: var(--space-3);
    border: var(--border-hairline) solid var(--color-rule);
    background: var(--color-surface);
  }

  table {
    width: 100%;
    min-width: 50rem;
    border-collapse: collapse;
    font-size: var(--step--1);
    line-height: var(--leading-ui);
  }

  caption {
    padding: var(--space-3);
    text-align: start;
    font-size: var(--step-0);
    color: var(--color-text-soft);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    text-align: start;
    vertical-align: top;
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  thead th {
    font-family: var(--font-mono);
    font-weight: 400;
    color: var(--color-text-soft);
  }

  .num,
  tbody th {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .sim-demo__summary {
    margin-block-start: var(--space-3);
    max-width: 62ch;
  }
</style>
