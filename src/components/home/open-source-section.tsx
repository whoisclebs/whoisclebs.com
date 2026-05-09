import { openSourceProjects, technologyIcons } from '@/content/open-source'
import { useI18n } from '@/lib/i18n'

export function OpenSourceSection() {
  const { messages } = useI18n()
  const copy = messages.openSource

  return (
    <section className="mt-12" aria-labelledby="open-source-title">
      <div className="border-t-2 border-[#1a1a1a] pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#757575]">{copy.kicker}</p>
            <h2 id="open-source-title" className="mt-2 text-5xl font-extrabold leading-none tracking-[-0.055em]">{copy.title}</h2>
            <p className="mt-3 font-serif text-lg leading-7 text-[#1a1a1a]">{copy.intro}</p>
          </div>
          <a
            href="https://github.com/sponsors/whoisclebs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 font-sans text-xs font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
          >
            {copy.sponsor}
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-x-8 gap-y-9 md:grid-cols-2">
        {openSourceProjects.map((project) => (
          <article key={project.name} className="border-t border-[#1a1a1a] pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-4xl font-extrabold leading-none tracking-[-0.045em]">{project.name}</h3>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.095em] text-[#757575]">{copy.maintain}</p>
              </div>
              <div className="flex shrink-0 gap-2 pt-1">
                {project.technologies.map((technology) => (
                  <img key={technology} src={technologyIcons[technology]} alt={technology} title={technology} className="size-6 grayscale" />
                ))}
              </div>
            </div>

            <p className="mt-4 min-h-28 font-serif leading-7 text-[#1a1a1a]">{copy.projects[project.id]}</p>

            <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.08em]">
              <a className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" href={project.repo} target="_blank" rel="noopener noreferrer">{copy.repository}</a>
              {project.docs !== project.repo && (
                <a className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" href={project.docs} target="_blank" rel="noopener noreferrer">{copy.docs}</a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
