<!--
  Capítulo "IA agêntica" (passo 09, só pt-BR). Dois níveis de leitura, os dois visíveis sem JS e na mesma
  ordem para todo mundo: (1) visão geral do laço em cinco partes; (2) detalhes técnicos. Entre eles, os
  projetos com status verdadeiro. Sem abas: nada a esconder, nada a sincronizar, e a página inteira funciona
  com Ctrl+F e leitor de tela.
-->
<script lang="ts">
  import { formatDate } from '$lib/i18n'
  import { pages } from '$lib/routing/paths'
  import type { agentsData } from '$lib/server/pages'

  let { data }: { data: ReturnType<typeof agentsData> } = $props()

  const withCode = $derived(data.projects.filter((project) => project.hasCode).map((project) => `${project.name} (${project.statusLabel.toLowerCase()})`))
  const withoutCode = $derived(data.projects.filter((project) => !project.hasCode).map((project) => project.name))
  const usedStatuses = $derived(new Set(data.projects.map((project) => project.status)))
</script>

<article class="agents">
  <header class="agents__head">
    <div class="agents__intro">
      <h1 class="agents__title">Agentes de IA</h1>
      <p class="agents__dek">
        Um agente é um modelo que escolhe ações num laço. O trabalho de engenharia está em volta dele: que contexto entra, o que ele pode fazer, como saber se
        acertou e como ver o que aconteceu. Aqui está como eu abordo isso e o que já tem código público para conferir.
      </p>
    </div>
    <dl class="agents__facts">
      <div>
        <dt>Com código público</dt>
        <dd>{withCode.join(', ')}</dd>
      </div>
      <div>
        <dt>Sem código público</dt>
        <dd>{withoutCode.join(', ')}</dd>
      </div>
      <div>
        <dt>Números de benchmark</dt>
        <dd>Nenhum. <a href="#avaliacao">Por quê</a></dd>
      </div>
      <div>
        <dt>Conferido em</dt>
        <dd><time datetime={data.checkedAt}>{formatDate(data.checkedAt, 'pt-BR')}</time></dd>
      </div>
    </dl>
  </header>

  <nav class="agents__levels" aria-labelledby="levels-title">
    <h2 id="levels-title" class="agents__levels-title">Duas leituras</h2>
    <ol class="list-reset">
      <li>
        <a href="#visao-geral">Visão geral</a>
        <span>O laço em cinco partes, sem jargão.</span>
      </li>
      <li>
        <a href="#detalhes-tecnicos">Detalhes técnicos</a>
        <span>Limites de contexto, memória, permissões, avaliação e falhas.</span>
      </li>
    </ol>
    <p class="agents__levels-projects">Só quer saber o que existe? <a href="#projetos">Projetos e status</a>.</p>
  </nav>

  <section class="level" id="visao-geral" aria-labelledby="visao-geral-title">
    <header class="level__head">
      <h2 id="visao-geral-title">Visão geral: o laço em cinco partes</h2>
      <p>Cada parte é uma pergunta que alguém precisa responder antes de soltar um agente num problema real. Ao lado de cada uma, onde ela aparece no código público.</p>
    </header>
    <ol class="loop list-reset">
      {#each data.steps as step, index (step.id)}
        <li class="loop__step" id="parte-{step.id}">
          <span class="loop__cell" aria-hidden="true">{index + 1}</span>
          <h3 class="loop__title">{step.title}</h3>
          <p class="loop__text">{step.text}</p>
          <p class="loop__example">
            {step.example.text}
            <a href={step.example.url} rel="noopener noreferrer">{step.example.label}</a>
          </p>
        </li>
      {/each}
    </ol>
    <p class="loop__return">
      <span class="loop__return-line" aria-hidden="true"></span>
      Depois da observabilidade, o laço volta ao objetivo.
    </p>
  </section>

  <section class="level" id="projetos" aria-labelledby="projetos-title">
    <header class="level__head">
      <h2 id="projetos-title">O que existe, com status</h2>
      <p>Protótipo quer dizer que o código roda e está público, não que alguém o usa em produção. Nada aqui tem usuário, cliente ou ganho medido que eu possa mostrar.</p>
    </header>
    <ul class="projects list-reset">
      {#each data.projects as project (project.slug)}
        <li class="project" data-status={project.status}>
          <div class="project__name-row">
            <h3 class="project__name">{project.name}</h3>
            <p class="project__status"><span class="project__swatch" aria-hidden="true"></span>{project.statusLabel}</p>
          </div>
          <p class="project__summary">{project.summary}</p>
          {#if project.code}
            <dl class="project__facts">
              <div>
                <dt>Código</dt>
                <dd><a href={project.code.url} rel="noopener noreferrer">{project.code.url.replace('https://', '')}</a></dd>
              </div>
              <div>
                <dt>Licença</dt>
                <dd>{project.code.license}</dd>
              </div>
              {#if project.lastCommit}
                <div>
                  <dt>Último commit</dt>
                  <dd>
                    <a href={project.lastCommit.url} rel="noopener noreferrer"><code>{project.lastCommit.sha.slice(0, 7)}</code></a>,
                    <time datetime={project.lastCommit.date}>{formatDate(project.lastCommit.date, 'pt-BR')}</time>
                  </dd>
                </div>
              {/if}
              {#if project.release}
                <div>
                  <dt>Versão</dt>
                  <dd><a href={project.release.url} rel="noopener noreferrer">{project.release.label}</a>, <time datetime={project.release.date}>{formatDate(project.release.date, 'pt-BR')}</time></dd>
                </div>
              {/if}
            </dl>
          {/if}
          <p class="project__note">{project.note}</p>
        </li>
      {/each}
    </ul>
    <details class="statuses">
      <summary>O que cada status quer dizer</summary>
      <dl>
        {#each Object.entries(data.statuses) as [key, status] (key)}
          <div data-used={usedStatuses.has(key as never) ? '' : undefined}>
            <dt>{status.label}</dt>
            <dd>{status.meaning}.</dd>
          </div>
        {/each}
      </dl>
    </details>
  </section>

  <section class="level level--tech" id="detalhes-tecnicos" aria-labelledby="detalhes-tecnicos-title">
    <header class="level__head">
      <h2 id="detalhes-tecnicos-title">Detalhes técnicos</h2>
      <p>Para quem vai construir ou revisar um sistema desses. Em cada tópico: como eu abordo e o que o código público mostra, com a fonte ao lado.</p>
    </header>

    {#each data.topics as topic (topic.id)}
      <section class="topic" id={topic.id} aria-labelledby="{topic.id}-title">
        <div class="topic__text">
          <h3 id="{topic.id}-title">{topic.title}</h3>
          <div class="topic__part">
            <h4 class="topic__label">Como eu abordo</h4>
            {#each topic.approachHtml as paragraph, index (index)}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -- texto próprio escapado no build (renderInline); só crases viram <code> -->
              <p>{@html paragraph}</p>
            {/each}
            {#if topic.id === 'avaliacao'}
              <ul class="topic__criteria">
                {#each data.criteria as criterion, index (criterion)}
                  <li>{criterion}{index === data.criteria.length - 1 ? '.' : ';'}</li>
                {/each}
              </ul>
            {/if}
          </div>
          <div class="topic__part">
            <h4 class="topic__label">No código público</h4>
            {#each topic.inCodeHtml as paragraph, index (index)}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -- texto próprio escapado no build (renderInline); só crases viram <code> -->
              <p>{@html paragraph}</p>
            {/each}
          </div>
        </div>
        <aside class="topic__sources" aria-labelledby="{topic.id}-sources">
          <h4 id="{topic.id}-sources" class="topic__sources-title">Fontes</h4>
          <ul class="list-reset">
            {#each topic.sources as source (source.url)}
              <li><a href={source.url} rel="noopener noreferrer">{source.label}</a></li>
            {/each}
          </ul>
        </aside>
      </section>
    {/each}
  </section>

  <footer class="agents__foot">
    <h2 class="agents__foot-title">O que esta página não afirma</h2>
    <p>
      Nenhum agente autônomo em produção, nenhum ganho de produtividade medido, nenhum cliente. Se você tem um problema em que um agente precisa de limites claros,
      <a href={pages.contact['pt-BR']}>vamos conversar</a>; os casos com código aberto estão em <a href={pages.projects['pt-BR']}>Projetos</a>.
    </p>
  </footer>
</article>

<style>
  .agents {
    display: grid;
  }

  .agents__head {
    display: grid;
    gap: var(--space-5);
    padding-block-end: var(--space-7);
    border-block-end: var(--border-hairline) solid var(--color-text);
  }

  .agents__intro {
    display: grid;
    gap: var(--space-5);
    align-content: start;
  }

  .agents__title {
    font-size: var(--step-5);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
  }

  .agents__dek {
    max-width: 38em;
    font-size: var(--step-2);
    line-height: 1.4;
    color: var(--color-text-soft);
  }

  .agents__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
    gap: var(--space-4) var(--space-5);
    margin: 0;
  }

  .agents__facts div,
  .project__facts div {
    display: grid;
    gap: var(--space-1);
    padding-block-start: var(--space-2);
    border-block-start: var(--border-hairline) solid var(--color-rule);
    min-width: 0;
  }

  .agents__facts dt,
  .project__facts dt,
  .agents__levels-title,
  .topic__label,
  .topic__sources-title {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    color: var(--color-text-faint);
  }

  .agents__facts dd,
  .project__facts dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  /* Duas leituras: os dois níveis como índice, não como abas. */
  .agents__levels {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-6);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .agents__levels ol {
    display: grid;
    gap: var(--space-4);
    counter-reset: level;
  }

  .agents__levels li {
    display: grid;
    gap: var(--space-1);
    counter-increment: level;
  }

  .agents__levels li a {
    font-family: var(--font-display);
    font-size: var(--step-3);
    line-height: var(--leading-heading);
  }

  .agents__levels li a::before {
    content: counter(level) ' ';
    font-family: var(--font-mono);
    font-size: var(--step-0);
    color: var(--color-text-faint);
    vertical-align: 0.35em;
  }

  .agents__levels li span {
    color: var(--color-text-soft);
  }

  .agents__levels-projects {
    color: var(--color-text-soft);
  }

  .level {
    display: grid;
    gap: var(--space-7);
    padding-block: var(--space-8);
    border-block-end: var(--border-hairline) solid var(--color-rule);
    scroll-margin-block-start: var(--space-5);
  }

  .level__head {
    display: grid;
    gap: var(--space-3);
    max-width: var(--measure-article);
  }

  .level__head h2 {
    font-size: var(--step-4);
    text-wrap: balance;
  }

  .level__head p {
    font-size: var(--step-1);
    color: var(--color-text-soft);
  }

  /* O laço: cinco paradas sobre a quadrícula, numeradas porque é sequência. */
  .loop {
    display: grid;
    gap: var(--space-6);
    counter-reset: step;
  }

  .loop__step {
    position: relative;
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding-inline-start: calc(var(--cell) * 3 + var(--space-3));
    min-width: 0;
    scroll-margin-block-start: var(--space-5);
  }

  .loop__cell {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: grid;
    place-items: center;
    inline-size: calc(var(--cell) * 3);
    block-size: calc(var(--cell) * 3);
    background: var(--color-text);
    color: var(--color-bg);
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  /* Trilho vertical no celular: liga uma parada à próxima. */
  .loop__step:not(:last-child)::after {
    content: '';
    position: absolute;
    inset-block: calc(var(--cell) * 3) calc(var(--space-6) * -1);
    inset-inline-start: calc(var(--cell) * 1.5 - 0.5px);
    border-inline-start: var(--border-hairline) solid var(--color-text);
  }

  .loop__title {
    font-size: var(--step-2);
  }

  .loop__text {
    max-width: 34em;
  }

  .loop__example {
    max-width: 34em;
    padding-block-start: var(--space-2);
    border-block-start: var(--border-hairline) dashed var(--color-rule);
    font-size: var(--step--1);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  .loop__example a {
    display: inline-block;
    font-family: var(--font-mono);
  }

  .loop__return {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
  }

  .loop__return-line {
    flex: 0 0 calc(var(--cell) * 3);
    block-size: calc(var(--cell) * 3);
    border: var(--border-hairline) dashed var(--color-text);
    border-block-start: 0;
    border-inline-end: 0;
  }

  /* Projetos: célula cheia = código público; vazada e tracejada = sem código público (mesma regra do Mapa). */
  .projects {
    display: grid;
    gap: var(--space-7);
  }

  .project {
    display: grid;
    gap: var(--space-3);
    padding-block-start: var(--space-4);
    border-block-start: var(--border-hairline) solid var(--color-text);
    min-width: 0;
  }

  .project__name-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2) var(--space-5);
  }

  .project__name {
    font-size: var(--step-3);
  }

  .project__status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  .project__swatch {
    inline-size: var(--cell);
    block-size: var(--cell);
    background: var(--color-text);
    border: var(--border-hairline) solid var(--color-text);
  }

  .project[data-status='sem-codigo-publico'] .project__swatch,
  .project[data-status='privado'] .project__swatch {
    background: transparent;
    border-style: dashed;
  }

  .project__summary {
    max-width: var(--measure-article);
    font-size: var(--step-1);
  }

  .project__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
    gap: var(--space-3) var(--space-5);
    margin: 0;
  }

  .project__note {
    max-width: var(--measure-article);
    color: var(--color-text-soft);
  }

  .statuses {
    max-width: var(--measure-article);
    border-block-start: var(--border-hairline) solid var(--color-rule);
    padding-block-start: var(--space-3);
  }

  .statuses summary {
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  .statuses dl {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-4) 0 0;
  }

  .statuses dl div {
    display: grid;
    gap: 0 var(--space-4);
  }

  .statuses dt {
    font-weight: 600;
  }

  .statuses dd {
    margin: 0;
    color: var(--color-text-soft);
  }

  /* Detalhes técnicos: texto na medida de artigo, fontes à margem (mesma grade do case). */
  .topic {
    display: grid;
    gap: var(--space-5);
    padding-block-start: var(--space-6);
    border-block-start: var(--border-hairline) solid var(--color-rule);
    scroll-margin-block-start: var(--space-5);
  }

  .topic__text {
    display: grid;
    gap: var(--space-5);
    max-width: var(--measure-article);
    font-size: var(--step-1);
    line-height: var(--leading-article);
    min-width: 0;
  }

  .topic__text h3 {
    font-size: var(--step-3);
    margin-block-end: var(--space-1);
  }

  .topic__part {
    display: grid;
    gap: var(--space-2);
  }

  .topic__part > * {
    margin-block: 0;
  }

  .topic__label {
    line-height: var(--leading-ui);
  }

  .topic__text :global(code) {
    padding: 0 0.2em;
    background: var(--color-band);
    overflow-wrap: anywhere;
  }

  .topic__criteria {
    display: grid;
    gap: var(--space-1);
    padding-inline-start: 1.2em;
  }

  .topic__sources {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding-block-start: var(--space-3);
    border-block-start: var(--border-hairline) solid var(--color-text);
    line-height: var(--leading-ui);
    min-width: 0;
  }

  .topic__sources ul {
    display: grid;
    gap: var(--space-2);
  }

  .topic__sources a {
    overflow-wrap: anywhere;
  }

  .agents__foot {
    display: grid;
    gap: var(--space-3);
    padding-block-start: var(--space-7);
    max-width: var(--measure-article);
  }

  .agents__foot-title {
    font-size: var(--step-2);
  }

  @media (min-width: 640px) {
    .agents__levels ol {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .statuses dl div {
      grid-template-columns: minmax(10rem, 14rem) 1fr;
    }
  }

  @media (min-width: 960px) {
    .agents__head,
    .topic {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .agents__intro {
      grid-column: 1 / span 8;
    }

    .agents__facts {
      grid-column: 10 / span 3;
      grid-template-columns: 1fr;
      align-self: start;
    }

    .topic__text {
      grid-column: 1 / span 7;
    }

    .topic__sources {
      grid-column: 9 / span 4;
    }

    /* Desktop: o laço vira um trilho horizontal de cinco paradas. */
    .loop {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .loop__step {
      padding-inline-start: 0;
      padding-block-start: calc(var(--cell) * 3 + var(--space-4));
    }

    .loop__step:not(:last-child)::after {
      inset-block: calc(var(--cell) * 1.5 - 0.5px) auto;
      inset-inline: calc(var(--cell) * 3) calc(var(--grid-gap) * -1);
      border-inline-start: 0;
      border-block-start: var(--border-hairline) solid var(--color-text);
    }

    .loop__return-line {
      flex-basis: 100%;
      max-inline-size: 60%;
    }

    .project {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .project > * {
      grid-column: 1 / span 8;
    }

    .project__name-row {
      grid-column: 1 / -1;
    }

    .project__facts {
      grid-column: 1 / -1;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
