/**
 * Projetos open source. Descrições por idioma ficam em `src/lib/i18n/*` (`openSource.projects`).
 * Status conferido na API pública do GitHub (baseline, 2026-09-27); evidência = repositório/docs.
 */
import { z } from 'zod'
import { projectSchema, type Project } from './schema'

const rawProjects: Project[] = [
  {
    slug: 'tuxedo',
    name: 'tuxedo',
    repo: 'https://github.com/whoisclebs/tuxedo',
    docs: 'https://pkg.go.dev/github.com/whoisclebs/tuxedo',
    technologies: ['Go'],
    year: '2025',
    status: 'published',
    statusCheckedAt: '2026-09-27',
    evidence: ['https://github.com/whoisclebs/tuxedo', 'https://pkg.go.dev/github.com/whoisclebs/tuxedo'],
  },
  {
    slug: 'golpher',
    name: 'golpher',
    repo: 'https://github.com/go-golpher/golpher',
    docs: 'https://pkg.go.dev/github.com/go-golpher/golpher',
    technologies: ['Go'],
    year: '2025',
    status: 'active',
    statusCheckedAt: '2026-09-27',
    evidence: ['https://github.com/go-golpher/golpher'],
  },
  {
    slug: 'seishin',
    name: 'seishin engine',
    repo: 'https://github.com/whoisclebs/seishin',
    docs: 'https://github.com/whoisclebs/seishin',
    technologies: ['Rust'],
    year: '2026',
    status: 'experimental',
    statusCheckedAt: '2026-09-27',
    evidence: ['https://github.com/whoisclebs/seishin'],
  },
  {
    slug: 'rsgit',
    name: 'rsgit',
    repo: 'https://github.com/whoisclebs/rsgit',
    docs: 'https://github.com/whoisclebs/rsgit',
    technologies: ['Rust'],
    year: '2026',
    status: 'study',
    statusCheckedAt: '2026-09-27',
    evidence: ['https://github.com/whoisclebs/rsgit'],
  },
]

export const projects: Project[] = z.array(projectSchema).parse(rawProjects)

export type ProjectSlug = 'tuxedo' | 'golpher' | 'seishin' | 'rsgit'

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

export function isProjectSlug(slug: string): slug is ProjectSlug {
  return projects.some((project) => project.slug === slug)
}
