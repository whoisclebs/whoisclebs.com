import { openSourceProjects, technologyIcons } from '@/content/open-source'
import { useI18n, type Locale } from '@/lib/i18n'

const openSourceCopy: Record<Locale, {
  maintain: string
  repository: string
  docs: string
  sponsor: string
  problems: Record<string, string>
}> = {
  'pt-BR': {
    maintain: 'MANTENHO',
    repository: 'Repositório',
    docs: 'Documentação',
    sponsor: 'Apoiar no GitHub Sponsors',
    problems: {},
  },
  en: {
    maintain: 'MAINTAINED BY ME',
    repository: 'Repository',
    docs: 'Documentation',
    sponsor: 'Sponsor on GitHub Sponsors',
    problems: {
      tuxedo: 'Lightweight, chainable HTTP client for Go, built to reduce net/http boilerplate when assembling requests, setting headers, sending bodies, tracing calls, and decoding JSON responses through a simple API inspired by libraries like Resty.',
      golpher: 'Small Go HTTP micro-framework built on top of net/http, with method-based routing, Request/Response abstractions, JSON/XML body parsing, and centralized error handling for small direct APIs.',
    },
  },
}

export function OpenSourceSection() {
  const { locale } = useI18n()
  const copy = openSourceCopy[locale]

  return (
    <section className="mt-12" aria-labelledby="open-source-title">
      <div className="bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white">
        OPEN SOURCE
      </div>
      <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-2">
        {openSourceProjects.map((project) => (
          <article key={project.name} className="border-r border-t border-[#1a1a1a] bg-white p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{copy.maintain}</p>
            <h2 id={project.name === 'tuxedo' ? 'open-source-title' : undefined} className="my-3 text-4xl font-extrabold leading-none tracking-[-0.045em]">
              {project.name}
            </h2>
            <p className="mb-5 font-serif leading-7 text-[#1a1a1a]">{copy.problems[project.name] ?? project.problem}</p>
            <div className="mb-6 flex gap-3">
              {project.technologies.map((technology) => (
                <img key={technology} src={technologyIcons[technology]} alt={technology} title={technology} className="size-8 grayscale" />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.08em]">
              <a className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" href={project.repo} target="_blank" rel="noopener noreferrer">{copy.repository}</a>
              <a className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" href={project.docs} target="_blank" rel="noopener noreferrer">{copy.docs}</a>
            </div>
          </article>
        ))}
      </div>
      <a
        href="https://github.com/sponsors/whoisclebs"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
      >
        {copy.sponsor}
      </a>
    </section>
  )
}
