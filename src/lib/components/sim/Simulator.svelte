<!--
  Ilha do simulador (carregada por import dinâmico só no case tuxedo). Lógica pura em $lib/sim.
  - Controles nativos: botões, range e checkbox; tudo por teclado.
  - Um único aria-live polido, atualizado só por ação do leitor (passo, reiniciar, pausar, fim da
    reprodução) — durante a reprodução automática ele não anuncia cada passo.
  - Botões nunca ficam `disabled` (o foco sumiria): no fim, `aria-disabled` e o clique não faz nada.
  - prefers-reduced-motion: sem transição na célula nova; o texto e os estados são os mesmos.
-->
<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { BreakerStatus } from '$lib/sim/breaker'
  import { describeSummary, formatMs, KIND_LABEL, STATUS_LABEL } from '$lib/sim/labels'
  import { createSimulation, DEFAULT_CONFIG, step, summarize, type SimConfig, type SimState } from '$lib/sim/simulator'

  const STATES: BreakerStatus[] = ['closed', 'open', 'half-open']
  const PLAY_INTERVAL_MS = 700

  let failurePercent = $state(Math.round(DEFAULT_CONFIG.failureRate * 100))
  let latencyMs = $state(DEFAULT_CONFIG.latencyMs)
  let idempotency = $state(DEFAULT_CONFIG.idempotency)

  const config = $derived<SimConfig>({ ...DEFAULT_CONFIG, failureRate: failurePercent / 100, latencyMs, idempotency })

  let sim = $state<SimState>(createSimulation(DEFAULT_CONFIG))
  let playing = $state(false)
  let announcement = $state('')
  let timer: ReturnType<typeof setInterval> | undefined

  const last = $derived(sim.events.at(-1))
  const summary = $derived(summarize(sim))
  const chargesByOrder = $derived(
    Array.from({ length: sim.config.orders }, (_, index) => sim.ledger.charges.filter((charge) => charge.order === index + 1).length),
  )

  function summaryText() {
    return describeSummary(summarize(sim))
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = undefined
    playing = false
  }

  function advance(announce: boolean) {
    if (sim.finished) return
    sim = step(sim)
    if (sim.finished) {
      stop()
      announcement = `${sim.events.at(-1)?.message ?? ''} ${summaryText()}`
    } else if (announce) {
      announcement = sim.events.at(-1)?.message ?? ''
    }
  }

  function togglePlay() {
    if (playing) {
      stop()
      announcement = `Pausado no passo ${sim.events.length}. ${sim.events.at(-1)?.message ?? ''}`
      return
    }
    if (sim.finished) return
    playing = true
    announcement = 'Reproduzindo; o resumo será lido no fim.'
    advance(false)
    timer = setInterval(() => advance(false), PLAY_INTERVAL_MS)
  }

  function restart(message = 'Simulação reiniciada: mesma semente, mesmo cenário.') {
    stop()
    sim = createSimulation(config)
    announcement = message
  }

  function onConfigChange() {
    restart(
      `Cenário alterado: falha de ${failurePercent}%, latência média de ${formatMs(latencyMs)}, ${idempotency ? 'com' : 'sem'} chave de idempotência. Simulação reiniciada.`,
    )
  }

  onDestroy(stop)
</script>

<section class="sim" aria-labelledby="sim-title">
  <header class="sim__head">
    <p class="sim__label">Simulação com dados sintéticos</p>
    <h3 id="sim-title" class="sim__title">O que eu colocaria na frente do tuxedo</h3>
    <p class="sim__intro">
      Seis cobranças contra um servidor imaginário, com nova tentativa (backoff exponencial com jitter), chave de
      idempotência e disjuntor. A semente é fixa ({DEFAULT_CONFIG.seed}): os mesmos controles dão sempre o mesmo
      resultado. Nada disso existe no código do tuxedo.
    </p>
  </header>

  <fieldset class="sim__controls">
    <legend>Cenário</legend>
    <!-- Valor visível num <span> (não <output>, que seria outra região viva); o leitor de tela recebe aria-valuetext. -->
    <div class="sim__range">
      <span class="sim__range-head"><label for="sim-falha">Falha do servidor (503)</label> <span class="sim__value" aria-hidden="true">{failurePercent}%</span></span>
      <input id="sim-falha" type="range" min="0" max="90" step="10" aria-valuetext="{failurePercent}%" bind:value={failurePercent} onchange={onConfigChange} />
    </div>
    <div class="sim__range">
      <span class="sim__range-head"><label for="sim-latencia">Latência média</label> <span class="sim__value" aria-hidden="true">{formatMs(latencyMs)}</span></span>
      <input id="sim-latencia" type="range" min="200" max="1600" step="100" aria-valuetext={formatMs(latencyMs)} bind:value={latencyMs} onchange={onConfigChange} />
    </div>
    <label class="sim__check">
      <input type="checkbox" bind:checked={idempotency} onchange={onConfigChange} />
      <span>Enviar chave de idempotência</span>
    </label>
    <p class="sim__fixed">Fixos: tempo limite de {formatMs(DEFAULT_CONFIG.timeoutMs)}, {DEFAULT_CONFIG.maxAttempts} tentativas por pedido, disjuntor abre com {DEFAULT_CONFIG.breaker.threshold} falhas seguidas e espera {formatMs(DEFAULT_CONFIG.breaker.cooldownMs)}.</p>
  </fieldset>

  <div class="sim__actions">
    <button type="button" class="button button--primary" aria-disabled={sim.finished} onclick={() => advance(true)}>Avançar um passo</button>
    <button type="button" class="button" aria-disabled={sim.finished && !playing} aria-pressed={playing} onclick={togglePlay}>{playing ? 'Pausar' : 'Reproduzir'}</button>
    <button type="button" class="button" onclick={() => restart()}>Reiniciar</button>
  </div>

  <div class="sim__board">
    <div class="sim__breaker">
      <p class="sim__board-title">Disjuntor: <strong data-testid="breaker-status">{STATUS_LABEL[sim.breaker.status]}</strong></p>
      <ol class="sim__states list-reset" aria-label="Estados do disjuntor">
        {#each STATES as status (status)}
          <li class="sim__state" data-status={status} aria-current={sim.breaker.status === status ? 'step' : undefined}>
            <span class="sim__state-cell" aria-hidden="true"></span>{STATUS_LABEL[status]}
          </li>
        {/each}
      </ol>
    </div>

    <dl class="sim__clock">
      <div><dt>Passo</dt><dd>{sim.events.length}</dd></div>
      <div><dt>Tempo simulado</dt><dd>{formatMs(sim.now)}</dd></div>
      <div><dt>Cobranças</dt><dd>{summary.charges}{summary.duplicates > 0 ? ` (${summary.duplicates} duplicada${summary.duplicates > 1 ? 's' : ''})` : ''}</dd></div>
    </dl>

    <ol class="sim__orders list-reset" aria-label="Pedidos">
      {#each sim.outcomes as outcome, index (index)}
        <li class="sim__order" data-outcome={outcome} data-duplicate={chargesByOrder[index]! > 1}>
          <span class="sim__order-name">Pedido {index + 1}</span>
          <span>{outcome === 'ok' ? 'confirmado' : outcome === 'gave-up' ? 'abandonado' : sim.order === index + 1 && !sim.finished ? 'em andamento' : 'na fila'}</span>
          <span>{chargesByOrder[index]} {chargesByOrder[index] === 1 ? 'cobrança' : 'cobranças'}</span>
        </li>
      {/each}
    </ol>

    <ol class="sim__timeline list-reset" aria-hidden="true">
      {#each sim.events as event (event.index)}
        <li class="sim__tick" data-kind={event.kind} title={KIND_LABEL[event.kind]}></li>
      {/each}
    </ol>
    <p class="sim__legend" aria-hidden="true">
      Um quadrado por passo: cheio, cobrado ou repetição reconhecida; meio cheio, timeout depois de cobrar; vazado,
      503; pontilhado, recusado pelo disjuntor; tracejado, disjuntor meio-aberto. O texto de cada passo está abaixo.
    </p>
  </div>

  <div class="sim__now">
    <p class="sim__board-title">Último passo</p>
    <p class="sim__message">{last ? last.message : 'Nenhum passo ainda. Use “Avançar um passo” ou “Reproduzir”.'}</p>
    {#if sim.finished}<p class="sim__summary">{summaryText()}</p>{/if}
  </div>

  <p class="visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</p>

  {#if sim.events.length > 0}
    <details class="sim__log">
      <summary>Todos os passos ({sim.events.length})</summary>
      <ol>
        {#each sim.events as event (event.index)}
          <li><span class="sim__log-at">{formatMs(event.at)}</span> {event.message}</li>
        {/each}
      </ol>
    </details>
  {/if}
</section>

<style>
  .sim {
    display: grid;
    gap: var(--space-5);
    padding: var(--space-5);
    border: var(--border-hairline) solid var(--color-rule);
    background: var(--color-surface);
    min-width: 0;
  }

  .sim__head {
    display: grid;
    gap: var(--space-3);
  }

  .sim__label {
    justify-self: start;
    padding: var(--space-1) var(--space-3);
    border: var(--border-hairline) solid var(--color-rule);
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .sim__title {
    font-size: var(--step-3);
  }

  .sim__intro {
    max-width: 60ch;
    color: var(--color-text-soft);
  }

  .sim__controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: var(--space-4) var(--space-5);
    margin: 0;
    padding: var(--space-4);
    border: var(--border-hairline) solid var(--color-rule);
    min-width: 0;
  }

  .sim__controls legend {
    padding-inline: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .sim__range {
    display: grid;
    gap: var(--space-2);
    font-size: var(--step-0);
  }

  .sim__range-head {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .sim__value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .sim__range input {
    width: 100%;
    min-height: 44px;
    accent-color: var(--color-accent);
  }

  .sim__check {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    font-size: var(--step-0);
  }

  .sim__check input {
    width: 20px;
    height: 20px;
    accent-color: var(--color-accent);
  }

  .sim__fixed {
    grid-column: 1 / -1;
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .sim__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .sim__actions .button {
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }

  .sim__actions .button:active {
    transform: scale(var(--press-scale));
  }

  .sim__actions .button[aria-disabled='true'] {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .sim__board {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-4);
    border-block: var(--border-hairline) solid var(--color-rule);
  }

  .sim__board-title {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .sim__board-title strong {
    font-weight: 500;
    color: var(--color-text);
  }

  .sim__breaker {
    display: grid;
    gap: var(--space-3);
  }

  .sim__states {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    font-size: var(--step-0);
  }

  .sim__state {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-soft);
  }

  .sim__state-cell {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-text-soft);
  }

  .sim__state[data-status='half-open'] .sim__state-cell {
    border-style: dashed;
  }

  .sim__state[aria-current='step'] {
    color: var(--color-text);
    font-weight: 600;
  }

  .sim__state[aria-current='step'] .sim__state-cell {
    border-color: var(--color-text);
    background: var(--color-text);
  }

  .sim__state[data-status='half-open'][aria-current='step'] .sim__state-cell {
    background: repeating-linear-gradient(45deg, var(--color-text) 0 3px, transparent 3px 6px);
  }

  .sim__clock {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-6);
    margin: 0;
  }

  .sim__clock div {
    display: grid;
    gap: 2px;
  }

  .sim__clock dt {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .sim__clock dd {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--step-1);
    font-variant-numeric: tabular-nums;
  }

  .sim__orders {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 8.5rem), 1fr));
    gap: var(--space-2);
  }

  .sim__order {
    display: grid;
    gap: 2px;
    padding: var(--space-2) var(--space-3);
    border: var(--border-hairline) solid var(--color-rule);
    font-size: var(--step--1);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  .sim__order-name {
    font-family: var(--font-mono);
    color: var(--color-text);
  }

  .sim__order[data-outcome='ok'] {
    border-color: var(--color-text);
    color: var(--color-text);
  }

  .sim__order[data-outcome='gave-up'] {
    border-style: dashed;
    border-color: var(--color-text);
  }

  .sim__order[data-duplicate='true'] {
    border-width: 3px;
  }

  .sim__timeline {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 16px;
  }

  .sim__legend {
    max-width: 62ch;
    font-size: var(--step--1);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  .sim__tick {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-text);
    transition:
      opacity var(--dur-ui) var(--ease-out),
      transform var(--dur-ui) var(--ease-out);

    @starting-style {
      opacity: 0;
      transform: scale(0.6);
    }
  }

  .sim__tick[data-kind='success'],
  .sim__tick[data-kind='replay'] {
    background: var(--color-text);
  }

  .sim__tick[data-kind='timeout'] {
    background: linear-gradient(135deg, var(--color-text) 50%, transparent 50%);
  }

  .sim__tick[data-kind='rejected'] {
    border-style: dotted;
  }

  .sim__tick[data-kind='half-open'] {
    border-style: dashed;
  }

  .sim__now {
    display: grid;
    gap: var(--space-2);
    min-height: 7.5rem;
  }

  .sim__message {
    max-width: 62ch;
    font-size: var(--step-1);
    line-height: var(--leading-text);
  }

  .sim__summary {
    max-width: 62ch;
    padding-inline-start: var(--space-3);
    border-inline-start: 2px solid var(--color-text-faint);
    font-size: var(--step-0);
  }

  .sim__log summary {
    cursor: pointer;
    font-size: var(--step-0);
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .sim__log ol {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    padding-inline-start: var(--space-6);
    font-size: var(--step-0);
    line-height: var(--leading-ui);
  }

  .sim__log-at {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    .sim__legend {
    max-width: 62ch;
    font-size: var(--step--1);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  .sim__tick {
      transition: none;
    }

    .sim__actions .button {
      transition: none;
    }
  }
</style>
