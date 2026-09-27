<!--
  Template de estudo de caso (só pt-BR). Ordem fixa: Contexto → Restrições → Decisão → Arquitetura →
  Alternativas recusadas → Resultado observado → O que eu mudaria → Código e demo.
  Cada seção mostra as próprias fontes ao lado (desktop) ou logo abaixo (celular). Seções que são leitura
  minha do código, sem histórico escrito no repositório, levam o rótulo "Análise minha".
-->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import ArchitectureDiagram from '$lib/components/case/ArchitectureDiagram.svelte'
  import { formatDate } from '$lib/i18n'
  import { pages, projectPath } from '$lib/routing/paths'
  import type { RenderedCaseStudy } from '$lib/server/pages'
  import type { Project } from '$lib/content/schema'
  import ProjectStatus from './ProjectStatus.svelte'

  interface Props {
    study: RenderedCaseStudy
    project: Project
    other?: { name: string; slug: string; question: string }
    /** Conteúdo extra no fim da seção "Código e demo" (o simulador do passo 08). */
    demo?: Snippet
  }

  let { study, project, other, demo }: Props = $props()

  const shortSha = $derived(study.revision.sha.slice(0, 7))
</script>

<article class="case">
  <header class="case__head">
    <div class="case__intro">
    <p class="case__crumb"><a href={pages.projects['pt-BR']}>Projetos</a> <span aria-hidden="true">/</span> Estudo de caso</p>
    <h1 class="case__title">{study.title}</h1>
    <p class="case__dek">{study.dek}</p>
    </div>
    <dl class="case__facts">
      <div>
        <dt>Status</dt>
        <dd><ProjectStatus locale="pt-BR" status={project.status} checkedAt={project.statusCheckedAt} prefix={false} /></dd>
      </div>
      <div>
        <dt>Linguagem</dt>
        <dd>{project.technologies.join(', ')}</dd>
      </div>
      <div>
        <dt>Revisão lida</dt>
        <dd><a href={study.revision.url} rel="noopener noreferrer"><code>{shortSha}</code></a>, de <time datetime={study.revision.date}>{formatDate(study.revision.date, 'pt-BR')}</time></dd>
      </div>
      <div>
        <dt>Fontes conferidas em</dt>
        <dd><time datetime={study.checkedAt}>{formatDate(study.checkedAt, 'pt-BR')}</time></dd>
      </div>
      <div>
        <dt>Código</dt>
        <dd><a href={project.repo} rel="noopener noreferrer">{project.repo.replace('https://', '')}</a></dd>
      </div>
    </dl>
  </header>

  <nav class="case__toc" aria-labelledby="case-toc-title">
    <h2 id="case-toc-title" class="case__toc-title">Neste case</h2>
    <ol class="list-reset">
      {#each study.sections as section (section.id)}
        <li><a href="#{section.id}">{section.title}</a></li>
      {/each}
    </ol>
  </nav>

  {#each study.sections as section (section.id)}
    <section class="case-section" id={section.id} aria-labelledby="{section.id}-title">
      <div class="case-section__text">
        <h2 id="{section.id}-title">{section.title}</h2>
        {#if section.voice === 'analise'}
          <p class="case-section__voice">Análise minha, a partir do código ao lado. O repositório não registra esse raciocínio.</p>
        {/if}
        {#each section.html as paragraph, index (index)}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- texto do case escapado no build (renderInline); só crases viram <code> -->
          <p>{@html paragraph}</p>
        {/each}
      </div>

      <aside class="case-section__sources" aria-labelledby="{section.id}-sources">
        <h3 id="{section.id}-sources" class="case-section__sources-title">Fontes</h3>
        <ul class="list-reset">
          {#each section.sources as source (source.url)}
            <li><a href={source.url} rel="noopener noreferrer">{source.label}</a></li>
          {/each}
        </ul>
      </aside>

      {#if section.id === 'arquitetura'}
        <div class="case-section__wide">
          <ArchitectureDiagram architecture={study.architecture} id="{study.slug}-arquitetura" />
        </div>
      {/if}

      {#if section.id === 'resultado' && study.measurements.length > 0}
        <div class="case-section__wide">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (região rolável precisa de foco por teclado; axe scrollable-region-focusable) -->
          <div class="measurements" role="region" aria-labelledby="{study.slug}-medicoes" tabindex="0">
            <table>
              <caption id="{study.slug}-medicoes">Medições que eu rodei (não são benchmarks)</caption>
              <thead>
                <tr>
                  <th scope="col">O quê</th>
                  <th scope="col">Comando</th>
                  <th scope="col">Ambiente</th>
                  <th scope="col">Data</th>
                  <th scope="col">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {#each study.measurements as measurement (measurement.command)}
                  <tr>
                    <th scope="row">{measurement.what}</th>
                    <td><code>{measurement.command}</code></td>
                    <td>{measurement.environment}</td>
                    <td><time datetime={measurement.date}>{formatDate(measurement.date, 'pt-BR')}</time></td>
                    <td>{measurement.result}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      {#if section.id === 'codigo'}
        <div class="case-section__wide snippets">
          {#each study.snippets as snippet (snippet.url)}
            <figure class="snippet">
              <figcaption class="snippet__head">
                <span class="snippet__title">{snippet.title}</span>
                <a href={snippet.url} rel="noopener noreferrer">{snippet.file}, linhas {snippet.lines[0]}–{snippet.lines[1]}<span class="visually-hidden">, no GitHub</span></a>
              </figcaption>
              <!-- eslint-disable-next-line svelte/no-at-html-tags -- Shiki no build sobre código do próprio repositório -->
              <div class="code-block">{@html snippet.html}</div>
              <!-- eslint-disable-next-line svelte/no-at-html-tags -- legenda escapada no build (renderInline) -->
              <p class="snippet__caption">{@html snippet.captionHtml}</p>
            </figure>
          {/each}
          {#if demo}{@render demo()}{/if}
        </div>
      {/if}
    </section>
  {/each}

  <footer class="case__foot">
    {#if other}
      <p class="case__next">
        <span class="case__next-label">Outro case</span>
        <a href={projectPath(other.slug, 'pt-BR')}>{other.name}</a>
        <span class="case__next-question">{other.question}</span>
      </p>
    {/if}
    <p><a href={pages.projects['pt-BR']}>Todos os projetos</a></p>
  </footer>
</article>

<style>
  .case {
    display: grid;
    gap: 0;
  }

  .case__head {
    display: grid;
    gap: var(--space-5);
    padding-block-end: var(--space-7);
    border-block-end: var(--border-hairline) solid var(--color-text);
  }

  .case__intro {
    display: grid;
    gap: var(--space-5);
    align-content: start;
  }

  .case__crumb {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .case__title {
    font-size: var(--step-4);
    max-width: 18ch;
    text-wrap: balance;
  }

  .case__dek {
    font-size: var(--step-2);
    line-height: 1.4;
    color: var(--color-text-soft);
    max-width: 38em;
  }

  .case__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr));
    gap: var(--space-4) var(--space-5);
    margin: 0;
  }

  .case__facts div {
    display: grid;
    gap: var(--space-1);
    padding-block-start: var(--space-2);
    border-block-start: var(--border-hairline) solid var(--color-rule);
    min-width: 0;
  }

  .case__facts dt {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .case__facts dd {
    margin: 0;
    font-size: var(--step-0);
    overflow-wrap: anywhere;
  }

  .case__facts dd :global(.meta) {
    font-family: var(--font-text);
    font-size: var(--step-0);
    letter-spacing: 0;
    color: var(--color-text);
  }

  .case__toc {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-5);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .case__toc-title {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    color: var(--color-text-faint);
  }

  .case__toc ol {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    counter-reset: toc;
    font-size: var(--step-0);
  }

  .case__toc li {
    counter-increment: toc;
  }

  .case__toc li::before {
    content: counter(toc) '. ';
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .case-section {
    display: grid;
    gap: var(--space-5);
    padding-block: var(--space-8);
    border-block-end: var(--border-hairline) solid var(--color-rule);
    scroll-margin-block-start: var(--space-5);
  }

  .case-section__text {
    display: grid;
    gap: var(--space-4);
    max-width: var(--measure-article);
    font-size: var(--step-1);
    line-height: var(--leading-article);
    min-width: 0;
  }

  .case-section__text h2 {
    font-size: var(--step-3);
    margin-block-end: var(--space-2);
  }

  .case-section__text :global(code) {
    padding: 0 0.2em;
    background: var(--color-band);
    overflow-wrap: anywhere;
  }

  .case-section__voice {
    justify-self: start;
    padding: var(--space-1) var(--space-3);
    border: var(--border-hairline) dashed var(--color-text-soft);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    line-height: var(--leading-ui);
    color: var(--color-text-soft);
  }

  .case-section__sources {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding-block-start: var(--space-3);
    border-block-start: var(--border-hairline) solid var(--color-text);
    font-size: var(--step-0);
    line-height: var(--leading-ui);
    min-width: 0;
  }

  .case-section__sources-title {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    color: var(--color-text-faint);
  }

  .case-section__sources ul {
    display: grid;
    gap: var(--space-2);
  }

  .case-section__sources a {
    overflow-wrap: anywhere;
  }

  .case-section__wide {
    min-width: 0;
  }

  .measurements {
    overflow-x: auto;
    border: var(--border-hairline) solid var(--color-rule);
    background: var(--color-surface);
  }

  .measurements table {
    width: 100%;
    min-width: 44rem;
    border-collapse: collapse;
    font-size: var(--step-0);
    line-height: var(--leading-ui);
  }

  .measurements caption {
    padding: var(--space-3);
    text-align: start;
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-soft);
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .measurements th,
  .measurements td {
    padding: var(--space-2) var(--space-3);
    text-align: start;
    vertical-align: top;
    border-block-end: var(--border-hairline) solid var(--color-rule);
  }

  .measurements thead th {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    color: var(--color-text-faint);
  }

  .measurements tbody th {
    font-weight: 600;
  }

  .snippets {
    display: grid;
    gap: var(--space-7);
  }

  .snippet {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    min-width: 0;
    max-width: 58rem;
  }

  .snippet__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2) var(--space-5);
  }

  .snippet__title {
    font-family: var(--font-display);
    font-size: var(--step-2);
    line-height: var(--leading-heading);
  }

  .snippet__head a {
    font-family: var(--font-mono);
    font-size: var(--step--1);
  }

  .snippet__caption {
    max-width: 60ch;
    font-size: var(--step-0);
    color: var(--color-text-soft);
  }

  .snippet__caption :global(code) {
    padding: 0 0.2em;
    background: var(--color-band);
  }

  .case__foot {
    display: grid;
    gap: var(--space-5);
    padding-block-start: var(--space-7);
  }

  .case__next {
    display: grid;
    gap: var(--space-1);
  }

  .case__next-label {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    color: var(--color-text-faint);
  }

  .case__next a {
    font-family: var(--font-display);
    font-size: var(--step-3);
    line-height: var(--leading-heading);
  }

  .case__next-question {
    color: var(--color-text-soft);
  }

  @media (min-width: 960px) {
    .case__head {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
    }

    .case__intro {
      grid-column: 1 / span 8;
    }

    .case__facts {
      grid-column: 10 / span 3;
      grid-template-columns: 1fr;
      align-self: start;
    }

    .case-section {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      row-gap: var(--space-7);
    }

    .case-section__text {
      grid-column: 1 / span 7;
    }

    .case-section__sources {
      grid-column: 9 / span 4;
    }

    .case-section__wide {
      grid-column: 1 / -1;
    }
  }
</style>
