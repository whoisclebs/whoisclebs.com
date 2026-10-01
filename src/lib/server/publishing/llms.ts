/**
 * `/llms.txt` (índice curto no formato de https://llmstxt.org), `/llms-full.txt` (Markdown completo do
 * conteúdo publicado) e a versão `.md` de cada artigo e nota, gerados da mesma camada de conteúdo que as
 * páginas. Pessoas e agentes leem o mesmo texto canônico (spec §5.5); nada vem do D1.
 */
import { getMessages, type Locale } from '$lib/i18n'
import { author, badges, contactEmail, socialLinks } from '$lib/content/library'
import { getPublishedNotes, type Note } from '$lib/content/notes'
import { getPublishedPosts, getTranslation, type Post } from '$lib/content/posts'
import { getProject, projects } from '$lib/content/projects'
import type { Project } from '$lib/content/schema'
import { caseStudies } from '$lib/content/cases/index'
import type { CaseStudy } from '$lib/content/case-schema'
import { MCP_PATH } from '$lib/publishing/checks'
import { absoluteUrl, markdownPath, pages, projectPath, SITE_URL } from '$lib/routing/paths'
import { RESUME_PATH } from './resume'
import { JOB_TITLE } from './structured-data'

export const LLMS_PATH = '/llms.txt'
export const LLMS_FULL_PATH = '/llms-full.txt'

const SITE_TITLE = 'whoisclebs.com'
const SUMMARY = `Site pessoal de ${author.name} (Clebson Augusto), ${JOB_TITLE['pt-BR'].toLocaleLowerCase('pt-BR')}. Reúne artigos, notas curtas e textos dele sobre os próprios projetos de código aberto, com links para o código. Idioma principal: pt-BR; artigos, a página Sobre e as fichas de projeto também existem em inglês, sob /en/.`

/** Todos os projetos foram conferidos em alguma data; a mais recente vai para a seção "Limites". */
const LATEST_CHECK = [...projects.map((project) => project.statusCheckedAt), ...caseStudies.map((study) => study.checkedAt)].sort().at(-1)

/** Texto de link sem colchetes (o formato usa `[nome](url)`). */
function linkText(value: string): string {
  return value.replaceAll('[', '(').replaceAll(']', ')')
}

function item(name: string, url: string, note?: string): string {
  return `- [${linkText(name)}](${url})${note ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`
}

const MCP_NOTE =
  'Model Context Protocol 2025-11-25 por POST JSON-RPC, sem sessão e sem escrita: recursos whoisclebs://profile, whoisclebs://projects/{slug}, whoisclebs://articles/{slug}, whoisclebs://en/articles/{slug} e whoisclebs://notes/{slug} (o mesmo texto de /llms-full.txt) e a tool search_content(query, type?, limit?).'

const LANGUAGE_LABEL: Record<Locale, string> = { 'pt-BR': 'pt-BR', en: 'en' }

/** Item de artigo ou nota no índice: o link vai para a versão `.md`; a nota traz a data e o resumo. */
function entryItem(entry: Post | Note): string {
  return item(entry.title, absoluteUrl(markdownPath(entry.path)), `${entry.date} · ${entry.excerpt}`)
}

export function llmsIndex(): string {
  const t = getMessages('pt-BR')
  const sections: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SUMMARY}`,
    '',
    'Artigos e notas têm uma versão em Markdown na mesma URL da página, com `.md` no lugar da barra final (por exemplo, /notas/<slug>.md). Os links das seções de artigos e notas apontam para essa versão, que abre com título, resumo, página canônica, idioma, datas, assunto e autor. Os demais links apontam para a página HTML canônica, que traz JSON-LD.',
    '',
    '## Perfil',
    '',
    item(t['nav.about'], absoluteUrl(pages.about['pt-BR']), `${JOB_TITLE['pt-BR']}: trajetória, áreas de atuação e badges.`),
    item(t.contact.title, absoluteUrl(pages.contact['pt-BR']), t.contact.description),
    item('Currículo (JSON Resume)', absoluteUrl(RESUME_PATH), 'Só o que o site afirma em público; sem empregadores, datas de emprego nem formação.'),
    '',
    '## Estudos de caso',
    '',
    ...caseStudies.map((study) => item(study.title, absoluteUrl(projectPath(study.slug, 'pt-BR')), study.dek)),
    item(t.openSource.title, absoluteUrl(pages.projects['pt-BR']), t.openSource.intro),
    '',
    '## Artigos',
    '',
    ...getPublishedPosts('pt-BR').map(entryItem),
    '',
    '## Notas',
    '',
    ...getPublishedNotes().map(entryItem),
    '',
    '## English',
    '',
    item('Home', absoluteUrl(pages.home.en), 'English entry point. Articles, About, project pages, books, hobbies and the legal pages exist in English; case studies, notes and contact exist only in Portuguese.'),
    item('About', absoluteUrl(pages.about.en), `${JOB_TITLE.en}: background, areas of work and badges.`),
    ...getPublishedPosts('en').map(entryItem),
    '',
    '## Optional',
    '',
    item('Conteúdo completo (Markdown)', absoluteUrl(LLMS_FULL_PATH), 'Perfil, estudos de caso, artigos e notas num arquivo só, com uma seção "Limites" sobre o que o site não afirma.'),
    item('Servidor MCP somente leitura (Streamable HTTP)', absoluteUrl(MCP_PATH), MCP_NOTE),
    item('Sitemap', absoluteUrl('/sitemap.xml'), 'Todas as páginas HTML canônicas.'),
    item('RSS dos artigos (pt-BR)', absoluteUrl('/rss/blog.xml')),
    item('RSS dos artigos (en)', absoluteUrl('/rss/blog-en.xml')),
    item('RSS das notas', absoluteUrl('/rss/til.xml')),
    ...projects
      .filter((project) => !caseStudies.some((study) => study.slug === project.slug))
      .map((project) => item(project.name, absoluteUrl(projectPath(project.slug, 'pt-BR')), t.openSource.projects[project.slug as keyof typeof t.openSource.projects])),
    item(t['nav.books'], absoluteUrl(pages.books['pt-BR']), t.books.description),
    item(t['nav.hobbies'], absoluteUrl(pages.hobbies['pt-BR']), t.hobbies.seoDescription),
    item(t.privacy.title, absoluteUrl(pages.privacy['pt-BR']), t.privacy.description),
    item(t.terms.title, absoluteUrl(pages.terms['pt-BR']), t.terms.description),
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
      ['Autor', `${author.name} (Clebson Augusto), autor do projeto`],
      ['Revisado em', study.checkedAt],
      ['Revisão do código citada', `${study.revision.sha.slice(0, 7)} (${study.revision.date}) ${study.revision.url}`],
      ['Repositório', project?.repo],
    ]),
    '',
    study.dek,
    '',
  ]
  for (const section of study.sections) {
    lines.push(`#### ${section.title}`, '', ...section.body.flatMap((paragraph) => [paragraph, '']))
    if (section.sources?.length) lines.push(sourcesList(section.sources), '')
    for (const figure of section.figures ?? []) {
      if (figure === 'architecture') {
        lines.push(study.architecture.caption, '')
        for (const node of study.architecture.nodes) lines.push(`- ${node.label}${node.state === 'gap' ? ' (ainda não existe)' : ''}: ${node.detail} — [${linkText(node.source.label)}](${node.source.url})`)
        lines.push('')
      } else if (figure === 'measurements') {
        for (const measurement of study.measurements) lines.push(`- Rodei \`${measurement.command}\`: ${measurement.result} (${measurement.environment}, ${measurement.date}).`)
        lines.push('')
      } else {
        for (const snippet of study.snippets) {
          lines.push(`##### ${snippet.title}`, '', `${snippet.file}, linhas ${snippet.lines[0]}–${snippet.lines[1]}: ${snippet.url}`, '', '```' + snippet.lang, snippet.code, '```', '', snippet.caption, '')
        }
      }
    }
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

export type EntryKind = 'Artigo' | 'Nota' | 'Article'

/** Rótulos dos metadados de um artigo ou nota; `llms-full.txt` usa os de pt-BR, a `.md` os do idioma do texto. */
const ENTRY_LABELS: Record<Locale, Record<'kind' | 'canonical' | 'markdown' | 'language' | 'published' | 'revised' | 'translation' | 'topic' | 'author', string>> = {
  'pt-BR': { kind: 'Tipo', canonical: 'Canonical', markdown: 'Markdown', language: 'Idioma', published: 'Publicado em', revised: 'Revisado em', translation: 'Tradução', topic: 'Assunto', author: 'Autor' },
  en: { kind: 'Type', canonical: 'Canonical', markdown: 'Markdown', language: 'Language', published: 'Published', revised: 'Revised', translation: 'Translation', topic: 'Topic', author: 'Author' },
}

function entryKind(entry: Post | Note): EntryKind {
  if (!('translationKey' in entry)) return 'Nota'
  return entry.locale === 'en' ? 'Article' : 'Artigo'
}

/**
 * Metadados de um artigo ou nota, nos rótulos de `labels`. `llms-full.txt` cita a `.md`; a própria `.md`
 * cita o autor no lugar dela.
 */
function entryMeta(entry: Post | Note, kind: EntryKind, labels: Locale, variant: 'full' | 'markdown'): string {
  const label = ENTRY_LABELS[labels]
  const translation = 'translationKey' in entry ? getTranslation(entry, entry.locale === 'en' ? 'pt-BR' : 'en') : undefined
  return metaLines([
    [label.kind, kind],
    [label.canonical, entry.canonical],
    [label.markdown, variant === 'full' ? absoluteUrl(markdownPath(entry.path)) : undefined],
    [label.language, LANGUAGE_LABEL[entry.locale]],
    [label.published, entry.date],
    [label.revised, entry.updated],
    [label.translation, translation?.canonical],
    [label.topic, entry.topic.label],
    [label.author, variant === 'markdown' ? `${author.name} (Clebson Augusto), ${absoluteUrl(pages.about[entry.locale])}` : undefined],
  ])
}

export function entrySection(entry: Post | Note, kind: EntryKind): string {
  return [`### ${entry.title}`, '', entryMeta(entry, kind, 'pt-BR', 'full'), '', entry.excerpt, '', embedMarkdown(entry.body, 2), ''].join('\n')
}

/**
 * Versão Markdown de um artigo ou nota (`/escrita/<slug>.md`, `/en/writing/<slug>.md`, `/notas/<slug>.md`):
 * título em H1, resumo em citação, metadados e o corpo, com os títulos do corpo no nível original.
 */
export function entryMarkdown(entry: Post | Note): string {
  return [`# ${entry.title}`, '', `> ${entry.excerpt}`, '', entryMeta(entry, entryKind(entry), entry.locale, 'markdown'), '', embedMarkdown(entry.body, 0), ''].join('\n')
}

function limitsSection(): string {
  return [
    '## Limites',
    '',
    'O que este site não afirma, e como ler este arquivo:',
    '',
    '- Não publica empregadores, cargos com datas, clientes nem números de negócio, e não informa instituição nem curso de formação (um artigo de 2019 só menciona a faculdade). Por isso `work` e `education` saem vazios em /resume.json.',
    `- Os status de projetos foram conferidos nas datas indicadas (a mais recente: ${LATEST_CHECK ?? 'sem data'}) e podem ter mudado desde então. O código público é a fonte; este texto é uma leitura dele.`,
    '- Os números dos estudos de caso (testes, cobertura) são de execuções locais do autor, com comando, ambiente e data ao lado; não são benchmarks.',
    '- Cases, notas e a página de contato existem só em português; o inglês cobre home, sobre, projetos (fichas), artigos, livros, hobbies e páginas legais.',
    '- Artigos antigos contam eventos datados (hackathons, versões anteriores do site); valem para a data em que foram publicados.',
    '- Opiniões e exemplos são educacionais, sem garantia, conforme os Termos de Uso.',
    `- llms.txt e llms-full.txt seguem uma proposta de descoberta (https://llmstxt.org), não um padrão. Não há garantia de que buscadores ou modelos leiam, indexem ou citem estes arquivos; a fonte canônica é sempre a página HTML indicada em cada item. As versões .md de artigos e notas repetem o texto da página para leitura por máquina.`,
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
    `Gerado no build a partir da mesma camada de conteúdo das páginas. Índice curto: ${absoluteUrl(LLMS_PATH)}. Cada item traz canonical, idioma e datas (AAAA-MM-DD); artigos e notas citam também a sua versão Markdown.`,
    '',
    `Servidor MCP somente leitura em ${absoluteUrl(MCP_PATH)}: ${MCP_NOTE}`,
    '',
    profileSection(),
    casesSection(),
    '## Artigos',
    '',
    ...posts.map((post) => entrySection(post, post.locale === 'en' ? 'Article' : 'Artigo')),
    '## Notas',
    '',
    ...getPublishedNotes().map((note) => entrySection(note, 'Nota')),
    limitsSection(),
  ].join('\n')
}

/**
 * Resposta da versão `.md`. Vale no `vite dev` e no prerender; no Worker o arquivo prerenderizado sai como
 * asset estático, e os mesmos cabeçalhos vêm de `_headers` (raiz do projeto).
 */
export function markdownResponse(markdown: string): Response {
  return new Response(markdown, { headers: { 'content-type': 'text/markdown; charset=utf-8', 'x-robots-tag': 'noindex' } })
}
