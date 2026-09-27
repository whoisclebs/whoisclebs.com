/**
 * JSON-LD (schema.org) gerado da camada de conteúdo tipada. Cada nó repete o que a página mostra:
 * nomes, títulos (= H1) e datas (= `<time datetime>`). Nada de avaliação, preço ou emprego — o site não
 * afirma nenhum dos três. As regras que o build confere estão em `src/lib/publishing/checks.ts`.
 *
 * `SoftwareApplication` fica de fora de propósito: o Google exige `offers.price` e uma avaliação
 * (`aggregateRating`/`review`) para esse tipo, e os projetos são bibliotecas sem loja nem avaliação.
 * `SoftwareSourceCode` descreve o que existe de fato: código público num repositório.
 */
import type { Locale } from '$lib/i18n'
import { getMessages } from '$lib/i18n'
import { author, contactEmail, socialLinks } from '$lib/content/library'
import type { Project } from '$lib/content/schema'
import type { CaseStudy } from '$lib/content/case-schema'
import { absoluteUrl, pages, SITE_URL } from '$lib/routing/paths'
import type { JsonLd } from '$lib/seo'

export const PERSON_ID = `${SITE_URL}/#person`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** Nome público usado no hero ("Sou Clebson Augusto") e no título do site. */
export const ALTERNATE_NAME = 'Clebson Augusto'

/** Cargo como o hero escreve (pt-BR e en). */
export const JOB_TITLE: Record<Locale, string> = {
  'pt-BR': 'Desenvolvedor fullstack e líder técnico',
  en: 'Full-stack developer and tech lead',
}

/** Pessoa completa: home, Sobre e Contato. `sameAs` = só os perfis listados em `library.ts`. */
export function personNode(locale: Locale): JsonLd {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: author.name,
    alternateName: ALTERNATE_NAME,
    url: absoluteUrl(pages.home['pt-BR']),
    image: absoluteUrl(author.avatar),
    email: `mailto:${contactEmail}`,
    jobTitle: JOB_TITLE[locale],
    sameAs: socialLinks.map((link) => link.href),
  }
}

/** Referência curta à pessoa (autor de artigos, cases e código). */
export function personRef(): JsonLd {
  return { '@type': 'Person', '@id': PERSON_ID, name: author.name, url: absoluteUrl(pages.about['pt-BR']) }
}

export function websiteNode(locale: Locale, name: string, description: string): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name,
    url: absoluteUrl(pages.home[locale]),
    inLanguage: locale,
    description,
    publisher: { '@id': PERSON_ID },
  }
}

export function profilePageNode(locale: Locale, path: string, name: string): JsonLd {
  return { '@type': 'ProfilePage', name, url: absoluteUrl(path), inLanguage: locale, mainEntity: personNode(locale) }
}

/** Página comum (índice ou texto fixo). `name` = H1 da página. */
export function webPageNode(type: 'WebPage' | 'CollectionPage', locale: Locale, path: string, name: string): JsonLd {
  return { '@type': type, name, url: absoluteUrl(path), inLanguage: locale, isPartOf: { '@id': WEBSITE_ID }, author: personRef() }
}

export type Crumb = { name: string; path: string }

/** Trilha a partir da home. O último item é a própria página (nome = H1). */
export function breadcrumbNode(locale: Locale, trail: Crumb[]): JsonLd {
  const home: Crumb = { name: locale === 'en' ? 'Home' : 'Início', path: pages.home[locale] }
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [home, ...trail].map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
  }
}

type ArticleInput = {
  type: 'BlogPosting' | 'TechArticle'
  headline: string
  description: string
  url: string
  locale: Locale
  datePublished?: string
  dateModified?: string
  image?: string
  about?: JsonLd
}

export function articleNode(input: ArticleInput): JsonLd {
  return {
    '@type': input.type,
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    inLanguage: input.locale,
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: personRef(),
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
    ...(input.about ? { about: input.about } : {}),
  }
}

/** Código público de um projeto com página no site. Só fatos do conteúdo: nome, repositório, linguagem. */
export function softwareSourceCodeNode(project: Project, description: string, locale: Locale): JsonLd {
  return {
    '@type': 'SoftwareSourceCode',
    '@id': `${project.repo}#code`,
    name: project.name,
    description,
    codeRepository: project.repo,
    programmingLanguage: project.technologies.join(', '),
    url: project.docs,
    inLanguage: locale,
    author: personRef(),
  }
}

/** Case: um `TechArticle` (título = H1, revisão = data em que as fontes foram conferidas) sobre o código. */
export function caseStudyNodes(study: CaseStudy, project: Project, path: string): JsonLd[] {
  const url = absoluteUrl(path)
  const t = getMessages('pt-BR')
  const code = softwareSourceCodeNode(project, study.dek, 'pt-BR')
  return [
    articleNode({ type: 'TechArticle', headline: study.title, description: study.dek, url, locale: 'pt-BR', dateModified: study.checkedAt, about: { '@id': code['@id'] } }),
    code,
    breadcrumbNode('pt-BR', [
      { name: t['nav.projects'], path: pages.projects['pt-BR'] },
      { name: study.title, path },
    ]),
  ]
}
