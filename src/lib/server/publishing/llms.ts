/**
 * `/llms.txt` (índice curto no formato de https://llmstxt.org) e `/llms-full.txt` (Markdown completo do
 * conteúdo publicado), gerados da mesma camada de conteúdo que as páginas. Pessoas e agentes leem o mesmo
 * texto canônico (spec §5.5); nada vem do D1.
 */
import { getMessages, type Locale } from '$lib/i18n'
import { author, badges, contactEmail, socialLinks } from '$lib/content/library'
import { getPublishedNotes, type Note } from '$lib/content/notes'
import { getPublishedPosts, getTranslation, type Post } from '$lib/content/posts'
import { getProject, projects } from '$lib/content/projects'
import type { Project } from '$lib/content/schema'
import { caseStudies } from '$lib/content/cases/index'
import { CASE_SECTION_TITLES, type CaseStudy } from '$lib/content/case-schema'
import { AGENT_STATUS, AGENTS_CHECKED_AT, agentProjects, EVALUATION_CRITERIA, loopSteps, techTopics } from '$lib/content/agents'
import { MCP_PATH } from '$lib/publishing/checks'
import { absoluteUrl, pages, projectPath, SITE_URL } from '$lib/routing/paths'
import { RESUME_PATH } from './resume'
import { JOB_TITLE } from './structured-data'

export const LLMS_PATH = '/llms.txt'
export const LLMS_FULL_PATH = '/llms-full.txt'

const SITE_TITLE = 'whoisclebs.com'
const SUMMARY = `Site pessoal e editorial de ${author.name} (Clebson Augusto), ${JOB_TITLE['pt-BR'].toLocaleLowerCase('pt-BR')}. Tem estudos de caso de projetos open source em Go com a fonte de cada afirmação, um capítulo sobre agentes de IA com o status e o código de cada projeto, artigos e notas técnicas. Idioma principal: pt-BR; parte do conteúdo tem versão em inglês sob /en/.`

/** Texto de link sem colchetes (o formato usa `[nome](url)`). */
function linkText(value: string): string {
  return value.replaceAll('[', '(').replaceAll(']', ')')
}

function item(name: string, url: string, note?: string): string {
  return `- [${linkText(name)}](${url})${note ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`
}

const MCP_NOTE =
  'Model Context Protocol 2025-11-25 por POST JSON-RPC, sem sessão e sem escrita: recursos whoisclebs://profile, whoisclebs://projects/{slug}, whoisclebs://articles/{slug}, whoisclebs://en/articles/{slug} e whoisclebs://notes/{slug} (o mesmo texto deste arquivo) e a tool search_content(query, type?, limit?).'

const LANGUAGE_LABEL: Record<Locale, string> = { 'pt-BR': 'pt-BR', en: 'en' }

export function llmsIndex(): string {
  const t = getMessages('pt-BR')
  const ptPosts = getPublishedPosts('pt-BR')
  const enPosts = getPublishedPosts('en')
  const notes = getPublishedNotes()
  const sections: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SUMMARY}`,
    '',
    `Cada link aponta para a página canônica (HTML prerenderizado, com JSON-LD). O conteúdo inteiro em um só arquivo Markdown, com canonical, idioma e datas de cada item e uma seção "Limites" com o que o site não afirma, está em ${absoluteUrl(LLMS_FULL_PATH)}. Este arquivo segue a proposta de llmstxt.org; não há garantia de indexação.`,
    '',
    '## Perfil',
    '',
    item(t.about.title, absoluteUrl(pages.about['pt-BR']), t.about.intro),
    item(t.contact.title, absoluteUrl(pages.contact['pt-BR']), t.contact.description),
    item('Currículo (JSON Resume)', absoluteUrl(RESUME_PATH), 'Só o que o site afirma em público; sem empregadores, datas de emprego nem formação.'),
    '',
    '## Estudos de caso',
    '',
    ...caseStudies.map((study) => item(study.title, absoluteUrl(projectPath(study.slug, 'pt-BR')), study.question)),
    item(t.openSource.title, absoluteUrl(pages.projects['pt-BR']), t.openSource.intro),
    '',
    '## Agentes de IA',
    '',
    item(t.agents.title, absoluteUrl(pages.agents['pt-BR']), t.agents.description),
    '',
    '## Escrita',
    '',
    ...ptPosts.map((post) => item(post.title, post.canonical, `${post.date} · ${post.excerpt}`)),
    '',
    '## Notas',
    '',
    ...notes.map((note) => item(note.title, note.canonical, `${note.date} · ${note.excerpt}`)),
    '',
    '## English',
    '',
    item('Home (English)', absoluteUrl(pages.home.en), 'English entry point. Case studies, the AI agents chapter, notes and contact exist only in Portuguese.'),
    item('About (English)', absoluteUrl(pages.about.en)),
    ...enPosts.map((post) => item(post.title, post.canonical, `${post.date} · ${post.excerpt}`)),
    '',
    '## Optional',
    '',
    item('Conteúdo completo (Markdown)', absoluteUrl(LLMS_FULL_PATH)),
    item('Servidor MCP somente leitura (Streamable HTTP)', absoluteUrl(MCP_PATH), MCP_NOTE),
    item('Sitemap', absoluteUrl('/sitemap.xml')),
    item('RSS de Escrita (pt-BR)', absoluteUrl('/rss/blog.xml')),
    item('RSS de Writing (en)', absoluteUrl('/rss/blog-en.xml')),
    item('RSS de Notas', absoluteUrl('/rss/til.xml')),
    ...projects
      .filter((project) => !caseStudies.some((study) => study.slug === project.slug))
      .map((project) => item(project.name, absoluteUrl(projectPath(project.slug, 'pt-BR')), t.openSource.projects[project.slug as keyof typeof t.openSource.projects])),
    item(getMessages('pt-BR').books.title, absoluteUrl(pages.books['pt-BR'])),
    item('Hobbies', absoluteUrl(pages.hobbies['pt-BR'])),
    item(t.privacy.title, absoluteUrl(pages.privacy['pt-BR'])),
    item(t.terms.title, absoluteUrl(pages.terms['pt-BR'])),
  ]
  return `${sections.join('\n')}\n`
}

/** Fora de blocos de código: rebaixa títulos (o item já é H3) e torna absolutos os links relativos. */
export function embedMarkdown(markdown: string, shift: number): string {
  let fence = false
  return markdown
    .trim()
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence
        return line
      }
      if (fence) return line
      const heading = /^(#{1,6}) (.*)$/.exec(line)
      const shifted = heading ? `${'#'.repeat(Math.min(6, (heading[1] as string).length + shift))} ${heading[2]}` : line
      return shifted.replace(/\]\(\/(?!\/)/g, `](${SITE_URL}/`)
    })
    .join('\n')
}

function metaLines(entries: Array<[string, string | undefined]>): string {
  return entries
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => `- ${label}: ${value}`)
    .join('\n')
}

function sourcesList(sources: ReadonlyArray<{ label: string; url: string }>): string {
  return sources.map((source) => item(source.label, source.url)).join('\n')
}

export function profileSection(): string {
  const t = getMessages('pt-BR')
  const about = t.about
  return [
    '## Perfil',
    '',
    metaLines([
      ['Canonical', absoluteUrl(pages.about['pt-BR'])],
      ['Idioma', 'pt-BR (versão em inglês: ' + absoluteUrl(pages.about.en) + ')'],
      ['Nome', `${author.name} (também Clebson Augusto)`],
      ['Cargo', JOB_TITLE['pt-BR']],
      ['E-mail', contactEmail],
      ['Currículo', absoluteUrl(RESUME_PATH)],
    ]),
    '',
    about.intro,
    '',
    '### Trajetória',
    '',
    ...about.timeline.map((entry) => `- ${entry.label} — ${entry.title}: ${entry.text}`),
    '',
    ...about.paragraphs.flatMap((paragraph) => [paragraph, '']),
    '### Áreas de atuação',
    '',
    ...t.portfolio.projects.map((area) => `- ${area.name}: ${area.summary} (${area.stack})`),
    '',
    '### Badges (Credly)',
    '',
    ...badges.map((badge) => item(`${badge.name} — ${badge.issuer}, ${badge.issuedAt}`, badge.url)),
    '',
    '### Contato e perfis',
    '',
    metaLines([['Canonical', absoluteUrl(pages.contact['pt-BR'])], ['Idioma', 'pt-BR']]),
    '',
    t.contact.intro,
    '',
    `- E-mail: ${contactEmail}`,
    ...socialLinks.map((link) => item(link.label, link.href)),
    '',
  ].join('\n')
}

export function caseSection(study: CaseStudy): string {
  const project = getProject(study.slug)
  const lines = [
    `### ${study.title}`,
    '',
    metaLines([
      ['Canonical', absoluteUrl(projectPath(study.slug, 'pt-BR'))],
      ['Idioma', 'pt-BR'],
      ['Fontes conferidas em', study.checkedAt],
      ['Revisão do código lida', `${study.revision.sha.slice(0, 7)} (${study.revision.date}) ${study.revision.url}`],
      ['Repositório', project?.repo],
      ['Pergunta', study.question],
    ]),
    '',
    study.dek,
    '',
  ]
  for (const section of study.sections) {
    lines.push(`#### ${CASE_SECTION_TITLES[section.id]}${section.voice === 'analise' ? ' (análise do autor)' : ''}`, '', ...section.body.flatMap((paragraph) => [paragraph, '']), 'Fontes:', '', sourcesList(section.sources), '')
  }
  lines.push('#### Arquitetura em nós', '', study.architecture.caption, '')
  for (const node of study.architecture.nodes) lines.push(`- ${node.label}${node.state === 'gap' ? ' (ausente ou prometido)' : ''}: ${node.detail} — [${linkText(node.source.label)}](${node.source.url})`)
  lines.push('')
  for (const snippet of study.snippets) {
    lines.push(`#### Trecho: ${snippet.title}`, '', `${snippet.file}, linhas ${snippet.lines[0]}–${snippet.lines[1]}: ${snippet.url}`, '', '```' + snippet.lang, snippet.code, '```', '', snippet.caption, '')
  }
  if (study.measurements.length > 0) {
    lines.push('#### Medições', '')
    for (const measurement of study.measurements) {
      lines.push(`- ${measurement.what}: ${measurement.result} (comando \`${measurement.command}\`, ${measurement.environment}, ${measurement.date}) — [${linkText(measurement.source.label)}](${measurement.source.url})`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/** Projeto sem estudo de caso (ficha): uma linha com stack e resumo, outra com página, código e datas. */
export function projectSummary(project: Project): string {
  const t = getMessages('pt-BR')
  return [
    `- ${project.name} (${project.technologies.join(', ')}, desde ${project.year}): ${t.openSource.projects[project.slug as keyof typeof t.openSource.projects]}`,
    `  Página: ${absoluteUrl(projectPath(project.slug, 'pt-BR'))} · Código: ${project.repo} · Status conferido em ${project.statusCheckedAt} · Último commit: ${project.lastCommit.date}`,
  ].join('\n')
}

function casesSection(): string {
  const others = projects.filter((project) => !caseStudies.some((study) => study.slug === project.slug))
  return [
    '## Estudos de caso e projetos',
    '',
    `Índice: ${absoluteUrl(pages.projects['pt-BR'])} (pt-BR). Os cases existem só em português.`,
    '',
    ...caseStudies.map(caseSection),
    '### Outros projetos open source',
    '',
    ...others.map(projectSummary),
    '',
  ].join('\n')
}

function agentsSection(): string {
  const t = getMessages('pt-BR')
  const lines = [
    `## ${t.agents.title}`,
    '',
    metaLines([['Canonical', absoluteUrl(pages.agents['pt-BR'])], ['Idioma', 'pt-BR'], ['Status conferido em', AGENTS_CHECKED_AT]]),
    '',
    t.agents.description,
    '',
    '### Projetos e status',
    '',
  ]
  for (const project of agentProjects) {
    lines.push(
      `- ${project.name} — ${AGENT_STATUS[project.status].label} (${AGENT_STATUS[project.status].meaning}). ${project.summary} Ressalva: ${project.note}${project.code ? ` Código: ${project.code.url} (licença: ${project.code.license}).` : ' Sem código público.'}`,
    )
  }
  lines.push('', '### O laço de um agente', '')
  for (const [index, step] of loopSteps.entries()) lines.push(`${index + 1}. ${step.title}: ${step.text} Exemplo: ${step.example.text} — [${linkText(step.example.label)}](${step.example.url})`)
  lines.push('')
  for (const topic of techTopics) {
    lines.push(`### ${topic.title}`, '', 'Como eu abordo:', '', ...topic.approach.flatMap((paragraph) => [paragraph, '']))
    if (topic.id === 'avaliacao') lines.push(...EVALUATION_CRITERIA.map((criterion) => `- ${criterion}`), '')
    lines.push('No código público:', '', ...topic.inCode.flatMap((paragraph) => [paragraph, '']), 'Fontes:', '', sourcesList(topic.sources), '')
  }
  return lines.join('\n')
}

export type EntryKind = 'Artigo' | 'Nota' | 'Article'

export function entrySection(entry: Post | Note, kind: EntryKind): string {
  const translation = 'translationKey' in entry ? getTranslation(entry, entry.locale === 'en' ? 'pt-BR' : 'en') : undefined
  return [
    `### ${entry.title}`,
    '',
    metaLines([
      ['Tipo', kind],
      ['Canonical', entry.canonical],
      ['Idioma', LANGUAGE_LABEL[entry.locale]],
      ['Publicado em', entry.date],
      ['Revisado em', entry.updated],
      ['Tradução', translation?.canonical],
      ['Assunto', entry.topic.label],
    ]),
    '',
    entry.excerpt,
    '',
    embedMarkdown(entry.body, 2),
    '',
  ].join('\n')
}

function limitsSection(): string {
  return [
    '## Limites',
    '',
    'O que este site não afirma, e como ler este arquivo:',
    '',
    '- Não publica empregadores, cargos com datas, clientes nem números de negócio, e não informa instituição nem curso de formação (um artigo de 2019 só menciona a faculdade). Por isso `work` e `education` saem vazios em /resume.json.',
    `- Os status de projetos foram conferidos nas datas indicadas (a mais recente: ${AGENTS_CHECKED_AT}) e podem ter mudado desde então. O código público é a fonte; este texto é uma leitura dele.`,
    '- Nenhum projeto de agentes tem uso em produção demonstrado, e o site não publica números de benchmark: os resultados existentes não cumprem os critérios de reprodução listados acima.',
    '- A simulação do case tuxedo usa dados sintéticos e está rotulada como simulação; não é medição de produção.',
    '- Cases, o capítulo de agentes, as notas e a página de contato existem só em português; o inglês cobre home, sobre, projetos (fichas), escrita e páginas legais.',
    '- Artigos antigos contam eventos datados (hackathons, versões anteriores do site); valem para a data em que foram publicados.',
    '- Opiniões e exemplos são educacionais, sem garantia, conforme os Termos de Uso.',
    `- llms.txt e llms-full.txt seguem uma proposta de descoberta (https://llmstxt.org), não um padrão. Não há garantia de que buscadores ou modelos leiam, indexem ou citem estes arquivos; a fonte canônica é sempre a página HTML indicada em cada item.`,
    '',
  ].join('\n')
}

export function llmsFull(): string {
  const posts = (['pt-BR', 'en'] as const).flatMap((locale) => getPublishedPosts(locale))
  return [
    `# ${SITE_TITLE} — conteúdo completo`,
    '',
    `> ${SUMMARY}`,
    '',
    `Gerado no build a partir da mesma camada de conteúdo das páginas. Índice curto: ${absoluteUrl(LLMS_PATH)}. Cada item traz canonical, idioma e datas (AAAA-MM-DD).`,
    '',
    `Servidor MCP somente leitura em ${absoluteUrl(MCP_PATH)}: ${MCP_NOTE}`,
    '',
    profileSection(),
    casesSection(),
    agentsSection(),
    '## Artigos',
    '',
    ...posts.map((post) => entrySection(post, post.locale === 'en' ? 'Article' : 'Artigo')),
    '## Notas',
    '',
    ...getPublishedNotes().map((note) => entrySection(note, 'Nota')),
    limitsSection(),
  ].join('\n')
}
