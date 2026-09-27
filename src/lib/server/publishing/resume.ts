/**
 * `/resume.json` no schema JSON Resume (https://jsonresume.org/schema), gerado só do que o site já afirma em
 * público: nome, cargo e resumo (Sobre/hero), e-mail e perfis (`library.ts`), áreas de atuação com a stack
 * (Projetos), projetos open source (`projects.ts`) e badges verificáveis no Credly.
 *
 * `work` e `education` saem vazios de propósito: o site não publica empregadores, cargos com datas nem
 * formação. Nada aqui inventa esses dados.
 * Validado contra o schema oficial (`@jsonresume/schema`) nos testes e no portão do build.
 */
import { getMessages } from '$lib/i18n'
import { author, badges, contactEmail, socialLinks } from '$lib/content/library'
import { projects } from '$lib/content/projects'
import { absoluteUrl, pages } from '$lib/routing/paths'
import { JOB_TITLE } from './structured-data'

export const RESUME_PATH = '/resume.json'

type Profile = { network: string; username: string; url: string }

export type Resume = {
  basics: { name: string; label: string; image: string; email: string; url: string; summary: string; profiles: Profile[] }
  work: never[]
  education: never[]
  skills: Array<{ name: string; keywords: string[] }>
  projects: Array<{ name: string; description: string; url: string; keywords: string[]; startDate: string; roles: string[] }>
  certificates: Array<{ name: string; issuer: string; date: string; url: string }>
  meta: { canonical: string; lastModified: string }
}

export function buildResume(): Resume {
  const t = getMessages('pt-BR')
  const lastModified = projects.map((project) => project.statusCheckedAt).sort().at(-1) ?? ''
  return {
    basics: {
      name: author.name,
      label: JOB_TITLE['pt-BR'],
      image: absoluteUrl(author.avatar),
      email: contactEmail,
      url: absoluteUrl(pages.home['pt-BR']),
      summary: t.about.intro,
      profiles: socialLinks.map((link) => ({ network: link.label, username: author.username, url: link.href })),
    },
    work: [],
    education: [],
    skills: t.portfolio.projects.map((area) => ({ name: area.name, keywords: area.stack.split(' / ').map((item) => item.trim()) })),
    projects: projects.map((project) => ({
      name: project.name,
      description: t.openSource.projects[project.slug as keyof typeof t.openSource.projects],
      url: project.repo,
      keywords: project.technologies,
      startDate: project.year,
      roles: ['Mantenedor'],
    })),
    certificates: badges.map((badge) => ({ name: badge.name, issuer: badge.issuer, date: badge.issuedAt, url: badge.url })),
    meta: { canonical: absoluteUrl(RESUME_PATH), lastModified },
  }
}
