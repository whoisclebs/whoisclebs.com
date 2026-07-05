export type OpenSourceProject = {
  id: 'tuxedo' | 'golpher' | 'seishin' | 'rsgit'
  name: string
  repo: string
  docs: string
  technologies: Array<'Java' | 'Spring' | 'Go' | 'Docker' | 'Rust'>
  year: string
}

export const openSourceProjects: OpenSourceProject[] = [
  {
    id: 'tuxedo',
    name: 'tuxedo',
    repo: 'https://github.com/whoisclebs/tuxedo',
    docs: 'https://pkg.go.dev/github.com/whoisclebs/tuxedo',
    technologies: ['Go'],
    year: '2025',
  },
  {
    id: 'golpher',
    name: 'golpher',
    repo: 'https://github.com/go-golpher/golpher',
    docs: 'https://pkg.go.dev/github.com/go-golpher/golpher',
    technologies: ['Go'],
    year: '2025',
  },
  {
    id: 'seishin',
    name: 'seishin engine',
    repo: 'https://github.com/whoisclebs/seishin',
    docs: 'https://github.com/whoisclebs/seishin',
    technologies: ['Rust'],
    year: '2026',
  },
  {
    id: 'rsgit',
    name: 'rsgit',
    repo: 'https://github.com/whoisclebs/rsgit',
    docs: 'https://github.com/whoisclebs/rsgit',
    technologies: ['Rust'],
    year: '2026',
  },
]

export const technologyIcons: Record<OpenSourceProject['technologies'][number], string> = {
  Java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  Spring: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
  Go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg',
  Docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  Rust: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
}
