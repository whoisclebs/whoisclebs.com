/**
 * Dados de cada página, por idioma. Rotas PT e EN chamam as mesmas funções; cada uma devolve `seo`
 * próprio (title, description, canonical com barra final, hreflang) — nenhuma herda o da home.
 */
import { error } from '@sveltejs/kit'
import { author, badges, boardGames, books, contactEmail, socialLinks } from '$lib/content/library'
import { groupByYear, legacyCommentTerm, projectsForEntry, shouldShowToc, writingForProject } from '$lib/content/editorial'
import { getNote, getPublishedNotes, toNoteSummary } from '$lib/content/notes'
import { getPost, getPublishedPosts, getTranslation, toSummary, type Post } from '$lib/content/posts'
import { getProject, projects } from '$lib/content/projects'
import { caseStudies, getCaseStudy } from '$lib/content/cases/index'
import { CASE_SECTION_TITLES, type CaseStudy } from '$lib/content/case-schema'
import { format, getMessages, type Locale } from '$lib/i18n'
import { absoluteUrl, notePath, pagePath, pages, projectPath, topicPath, type PageKey } from '$lib/routing/paths'
import { pageTitle, person, SITE_NAME, type Seo } from '$lib/seo'
import { highlightCode, renderInline, renderMarkdown } from './markdown'
import { describeSummary } from '$lib/sim/labels'
import { DEFAULT_CONFIG, runToEnd, summarize } from '$lib/sim/simulator'

function alternatesFor(key: PageKey) {
  return { ...pages[key] }
}

function staticSeo(key: PageKey, locale: Locale, title: string, description: string, extra: Partial<Seo> = {}): Seo {
  const path = pagePath(key, locale)
  if (!path) throw new Error(`Página "${key}" não existe em ${locale}`)
  return { title: pageTitle(title), description, path, locale, alternates: alternatesFor(key), ...extra }
}

function projectCards(locale: Locale) {
  const t = getMessages(locale)
  return projects.map((project) => {
    const study = getCaseStudy(project.slug)
    return {
      ...project,
      description: t.openSource.projects[project.slug as keyof typeof t.openSource.projects],
      href: projectPath(project.slug, locale),
      // Cases existem só em pt-BR (texto novo, sem tradução revisada): no inglês o link leva hreflang.
      caseStudy: study
        ? { question: study.question, dek: study.dek, href: projectPath(project.slug, 'pt-BR'), hreflang: locale === 'en' ? ('pt-BR' as const) : undefined }
        : undefined,
    }
  })
}

/** Case pronto para a página: parágrafos com `code` inline escapado e trechos destacados pelo Shiki no build. */
export async function renderCaseStudy(study: CaseStudy) {
  return {
    ...study,
    sections: study.sections.map((section) => ({
      ...section,
      title: CASE_SECTION_TITLES[section.id],
      html: section.body.map(renderInline),
    })),
    snippets: await Promise.all(
      study.snippets.map(async (snippet) => ({
        ...snippet,
        captionHtml: renderInline(snippet.caption),
        html: await highlightCode(snippet.code, snippet.lang, snippet.lines[0]),
      })),
    ),
  }
}

function precomputedScenario() {
  const result = runToEnd(DEFAULT_CONFIG)
  return { seed: DEFAULT_CONFIG.seed, failurePercent: Math.round(DEFAULT_CONFIG.failureRate * 100), latencyMs: DEFAULT_CONFIG.latencyMs, events: result.events, summary: describeSummary(summarize(result)) }
}

function otherCaseFor(slug: string) {
  const other = caseStudies.find((study) => study.slug !== slug)
  const project = other ? getProject(other.slug) : undefined
  return other && project ? { slug: other.slug, name: project.name, question: other.question } : undefined
}

export type RenderedCaseStudy = Awaited<ReturnType<typeof renderCaseStudy>>

export function homeData(locale: Locale) {
  const description =
    locale === 'en'
      ? 'Blog and portfolio of Clebson A. Fonseca about software engineering, architecture, payments, frontend, and operations.'
      : 'Blog e portfólio de Clebson A. Fonseca sobre engenharia de software, arquitetura, pagamentos, frontend e operação.'
  const title = locale === 'en' ? `${SITE_NAME} – Software engineering without theater` : `${SITE_NAME} – Engenharia de software sem teatro`
  const seo: Seo = {
    title,
    description,
    path: pages.home[locale],
    locale,
    alternates: alternatesFor('home'),
    jsonLd: [person, { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl(pages.home[locale]), inLanguage: locale, description }],
  }
  return {
    locale,
    seo,
    recent: recentWriting(locale, 5),
    projects: projectCards(locale),
  }
}

export type RecentItem = {
  kind: 'article' | 'note'
  slug: string
  title: string
  excerpt: string
  href: string
  date: string
  topic: { slug: string; label: string; href?: string }
  readingMinutes: number
  /** Nota só existe em pt-BR: na home inglesa o link leva `hreflang`. */
  hreflang?: Locale
}

/** Artigos e notas misturados por data. Notas só entram no pt-BR (não há tradução revisada). */
export function recentWriting(locale: Locale, limit: number): RecentItem[] {
  const articles: RecentItem[] = getPublishedPosts(locale).map((post) => ({
    kind: 'article',
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    href: post.path,
    date: post.date,
    topic: { ...post.topic, href: topicPath(post.topic.slug, locale) },
    readingMinutes: post.readingMinutes,
  }))
  const notes: RecentItem[] =
    locale === 'pt-BR'
      ? getPublishedNotes().map((note) => ({
          kind: 'note',
          slug: note.slug,
          title: note.title,
          excerpt: note.excerpt,
          href: note.path,
          date: note.date,
          topic: note.topic,
          readingMinutes: note.readingMinutes,
        }))
      : []
  return [...articles, ...notes].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)).slice(0, limit)
}

/** Assuntos com contagem, na ordem do mais usado; empate pelo rótulo. */
function topicsFor(locale: Locale) {
  const counts = new Map<string, { slug: string; label: string; count: number }>()
  for (const post of getPublishedPosts(locale)) {
    const current = counts.get(post.topic.slug) ?? { ...post.topic, count: 0 }
    current.count += 1
    counts.set(post.topic.slug, current)
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale))
    .map((topic) => ({ ...topic, href: topicPath(topic.slug, locale) }))
}

export function topicEntries(locale: Locale) {
  return topicsFor(locale).map((topic) => ({ slug: topic.slug }))
}

function projectLinks(post: Pick<Post, 'slug' | 'projects'>, locale: Locale) {
  return projectsForEntry(post).map((project) => ({ slug: project.slug, name: project.name, href: projectPath(project.slug, locale) }))
}

export function projectsData(locale: Locale) {
  const t = getMessages(locale)
  return {
    locale,
    seo: staticSeo('projects', locale, locale === 'en' ? 'Projects' : 'Projetos', t.portfolio.description),
    projects: projectCards(locale),
  }
}

export async function projectData(slug: string, locale: Locale) {
  const project = getProject(slug)
  if (!project) error(404, 'Projeto não encontrado')
  const t = getMessages(locale)
  const study = getCaseStudy(project.slug)
  const caseStudy = study && locale === 'pt-BR' ? await renderCaseStudy(study) : undefined
  const description = caseStudy?.dek ?? t.openSource.projects[project.slug as keyof typeof t.openSource.projects]
  const path = projectPath(project.slug, locale)
  const related = writingForProject(project.slug, [
    ...getPublishedPosts(locale).map((post) => ({ ...post, kind: 'article' as const })),
    ...(locale === 'pt-BR' ? getPublishedNotes().map((note) => ({ ...note, kind: 'note' as const })) : []),
  ]).map((entry) => ({ kind: entry.kind, slug: entry.slug, title: entry.title, href: entry.path, date: entry.date }))
  return {
    locale,
    relatedWriting: related,
    project: { ...project, description },
    caseStudy,
    otherCase: caseStudy ? otherCaseFor(project.slug) : undefined,
    /** Passo 08: o simulador vive no case tuxedo (o cliente não tem nova tentativa). Cenário padrão pré-calculado no build. */
    simulation: caseStudy && project.slug === 'tuxedo' ? precomputedScenario() : undefined,
    /** No inglês: o case existe só em português. */
    caseHref: study && locale === 'en' ? projectPath(project.slug, 'pt-BR') : undefined,
    seo: {
      title: pageTitle(caseStudy ? `${project.name}: estudo de caso` : project.name),
      description,
      path,
      locale,
      alternates: { 'pt-BR': projectPath(project.slug, 'pt-BR'), en: projectPath(project.slug, 'en') },
      jsonLd: {
        '@type': 'SoftwareSourceCode',
        name: project.name,
        description,
        codeRepository: project.repo,
        programmingLanguage: project.technologies.join(', '),
        url: absoluteUrl(path),
        inLanguage: locale,
        author: { '@type': 'Person', name: author.name },
      },
    } satisfies Seo,
  }
}

function writingIndex(locale: Locale, posts: Post[]) {
  return groupByYear(
    posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      href: post.path,
      date: post.date,
      topic: { ...post.topic, href: topicPath(post.topic.slug, locale) },
      readingMinutes: post.readingMinutes,
    })),
  )
}

export function writingData(locale: Locale) {
  const t = getMessages(locale)
  return {
    locale,
    seo: staticSeo('writing', locale, t.writing.title, t['blog.description']),
    heading: t.writing.title,
    lead: t['blog.description'],
    topics: topicsFor(locale),
    currentTopic: undefined as string | undefined,
    years: writingIndex(locale, getPublishedPosts(locale)),
  }
}

export function topicData(slug: string, locale: Locale) {
  const t = getMessages(locale)
  const topic = topicsFor(locale).find((item) => item.slug === slug)
  if (!topic) error(404, 'Assunto não encontrado')
  const other: Locale = locale === 'en' ? 'pt-BR' : 'en'
  const pair = topicsFor(other).some((item) => item.slug === slug)
  const path = topicPath(slug, locale)
  const heading = format(t.writing.topicTitle, { topic: topic.label })
  return {
    locale,
    seo: {
      title: pageTitle(heading),
      description: format(t.writing.topicDescription, { topic: topic.label }),
      path,
      locale,
      // hreflang só quando o mesmo assunto existe publicado no outro idioma.
      alternates: pair ? { [locale]: path, [other]: topicPath(slug, other) } : { [locale]: path },
    } satisfies Seo,
    heading,
    lead: format(t.writing.topicDescription, { topic: topic.label }),
    topics: topicsFor(locale),
    currentTopic: slug as string | undefined,
    years: writingIndex(
      locale,
      getPublishedPosts(locale).filter((post) => post.topic.slug === slug),
    ),
  }
}

export async function articleData(slug: string, locale: Locale) {
  const post = getPost(slug, locale)
  if (!post) error(404, 'Artigo não encontrado')
  const translation = getTranslation(post, locale === 'en' ? 'pt-BR' : 'en')
  const rendered = await renderMarkdown(post.body)
  const alternates = translation ? { [post.locale]: post.path, [translation.locale]: translation.path } : { [post.locale]: post.path }
  return {
    locale,
    post: toSummary(post),
    topicHref: topicPath(post.topic.slug, locale),
    relatedProjects: projectLinks(post, locale),
    showToc: shouldShowToc(rendered.toc),
    commentTerm: legacyCommentTerm({ kind: 'article', slug: post.slug, locale }),
    author,
    socialLinks,
    ...rendered,
    seo: {
      title: pageTitle(post.title),
      description: post.excerpt,
      path: post.path,
      locale,
      alternates,
      type: 'article',
      image: post.cover,
      publishedTime: post.date,
      modifiedTime: post.updated,
      jsonLd: {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: absoluteUrl(post.cover),
        datePublished: post.date,
        ...(post.updated ? { dateModified: post.updated } : {}),
        inLanguage: locale,
        url: post.canonical,
        mainEntityOfPage: post.canonical,
        author: { '@type': 'Person', name: author.name, url: absoluteUrl('/sobre/') },
      },
    } satisfies Seo,
  }
}

export function notesData() {
  const t = getMessages('pt-BR')
  return {
    locale: 'pt-BR' as const,
    seo: staticSeo('notes', 'pt-BR', t.notes.title, t['til.seoDescription']),
    years: groupByYear(getPublishedNotes().map((note) => ({ ...toNoteSummary(note), href: notePath(note.slug) }))),
  }
}

export async function noteData(slug: string) {
  const note = getNote(slug)
  if (!note) error(404, 'Nota não encontrada')
  const rendered = await renderMarkdown(note.body)
  return {
    locale: 'pt-BR' as const,
    note: toNoteSummary(note),
    relatedProjects: projectLinks(note, 'pt-BR'),
    commentTerm: legacyCommentTerm({ kind: 'note', slug: note.slug, locale: 'pt-BR' }),
    ...rendered,
    seo: {
      title: pageTitle(note.title),
      description: note.excerpt,
      path: note.path,
      locale: 'pt-BR',
      alternates: { 'pt-BR': note.path },
      type: 'article',
      publishedTime: note.date,
      modifiedTime: note.updated,
      jsonLd: {
        '@type': 'TechArticle',
        headline: note.title,
        description: note.excerpt,
        datePublished: note.date,
        inLanguage: 'pt-BR',
        url: note.canonical,
        author: { '@type': 'Person', name: author.name },
      },
    } satisfies Seo,
  }
}

export function aboutData(locale: Locale) {
  const t = getMessages(locale)
  return {
    locale,
    badges,
    seo: staticSeo('about', locale, locale === 'en' ? 'About' : 'Sobre', t.about.intro, {
      jsonLd: { '@type': 'ProfilePage', mainEntity: person, inLanguage: locale },
    }),
  }
}

export function contactData() {
  const t = getMessages('pt-BR')
  return {
    locale: 'pt-BR' as const,
    email: contactEmail,
    socialLinks,
    seo: staticSeo('contact', 'pt-BR', t.contact.title, t.contact.description, {
      jsonLd: { '@type': 'ContactPage', inLanguage: 'pt-BR', mainEntity: person },
    }),
  }
}

export function booksData(locale: Locale) {
  const t = getMessages(locale)
  return { locale, books, seo: staticSeo('books', locale, locale === 'en' ? 'Books' : 'Livros', t.books.description) }
}

export function hobbiesData(locale: Locale) {
  const t = getMessages(locale)
  return { locale, boardGames, seo: staticSeo('hobbies', locale, 'Hobbies', t.hobbies.seoDescription) }
}

export function legalData(key: 'privacy' | 'terms', locale: Locale) {
  const copy = getMessages(locale)[key]
  return { locale, kind: key, seo: staticSeo(key, locale, copy.title, copy.description) }
}

export function articleEntries() {
  return getPublishedPosts('pt-BR').map((post) => ({ slug: post.slug }))
}

export function articleEntriesEn() {
  return getPublishedPosts('en').map((post) => ({ slug: post.slug }))
}

export function projectEntries() {
  return projects.map((project) => ({ slug: project.slug }))
}

export function noteEntries() {
  return getPublishedNotes().map((note) => ({ slug: note.slug }))
}

