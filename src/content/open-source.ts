export type OpenSourceProject = {
  name: string
  repo: string
  docs: string
  problem: string
  technologies: Array<'Java' | 'Spring' | 'Go' | 'Docker'>
}

export const openSourceProjects: OpenSourceProject[] = [
  {
    name: 'tuxedo',
    repo: 'https://github.com/whoisclebs/tuxedo',
    docs: 'https://pkg.go.dev/github.com/whoisclebs/tuxedo',
    problem: 'Cliente HTTP leve e encadeável para Go, criado para reduzir boilerplate do net/http ao montar requests, definir headers, enviar bodies, fazer tracing e decodificar respostas JSON com uma API simples inspirada em bibliotecas como Resty.',
    technologies: ['Go'],
  },
  {
    name: 'go.rush',
    repo: 'https://github.com/whoisclebs/go.rush',
    docs: 'https://pkg.go.dev/github.com/whoisclebs/go.rush',
    problem: 'Micro framework HTTP para Go construído sobre net/http, com roteador simples por método, abstrações de Request/Response, parsing de body em JSON/XML e tratamento centralizado de erros para APIs pequenas e diretas.',
    technologies: ['Go'],
  },
]

export const technologyIcons: Record<OpenSourceProject['technologies'][number], string> = {
  Java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  Spring: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
  Go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg',
  Docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
}
