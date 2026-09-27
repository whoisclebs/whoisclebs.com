/**
 * Dados de cada página, por idioma. Rotas PT e EN chamam as mesmas funções; cada uma devolve `seo`
 * próprio (title, description, canonical com barra final, hreflang) — nenhuma herda o da home.
 */
import { error } from '@sveltejs/kit'
import { author, badges, boardGames, books, contactEmail, socialLinks } from '$lib/content/library'
import { getNote, getPublishedNotes, toNoteSummary } from '$lib/content/notes'
import { getPost, getPublishedPosts, getTranslation, toSummary } from '$lib/content/posts'
import { getProject, projects } from '$lib/content/projects'
import { getMessages, type Locale } from '$lib/i18n'
import { absoluteUrl, pagePath, pages, projectPath, type PageKey } from '$lib/routing/paths'
import { pageTitle, person, SITE_NAME, type Seo } from '$lib/seo'
import { renderMarkdown } from './markdown'

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
  return projects.map((project) => ({
    ...project,
    description: t.openSource.projects[project.slug as keyof typeof t.openSource.projects],
    href: projectPath(project.slug, locale),
  }))
}

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
    posts: getPublishedPosts(locale).slice(0, 3).map(toSummary),
    projects: projectCards(locale),
  }
}

export function projectsData(locale: Locale) {
  const t = getMessages(locale)
  return {
    locale,
    seo: staticSeo('projects', locale, locale === 'en' ? 'Projects' : 'Projetos', t.portfolio.description),
    projects: projectCards(locale),
  }
}

export function projectData(slug: string, locale: Locale) {
  const project = getProject(slug)
  if (!project) error(404, 'Projeto não encontrado')
  const t = getMessages(locale)
  const description = t.openSource.projects[project.slug as keyof typeof t.openSource.projects]
  const path = projectPath(project.slug, locale)
  return {
    locale,
    project: { ...project, description },
    seo: {
      title: pageTitle(project.name),
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

export function writingData(locale: Locale) {
  const t = getMessages(locale)
  return {
    locale,
    seo: staticSeo('writing', locale, locale === 'en' ? 'Writing' : 'Escrita', t['blog.description']),
    posts: getPublishedPosts(locale).map(toSummary),
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
    seo: staticSeo('notes', 'pt-BR', 'Notas', t['til.seoDescription']),
    notes: getPublishedNotes().map(toNoteSummary),
  }
}

export async function noteData(slug: string) {
  const note = getNote(slug)
  if (!note) error(404, 'Nota não encontrada')
  const rendered = await renderMarkdown(note.body)
  return {
    locale: 'pt-BR' as const,
    note: toNoteSummary(note),
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

