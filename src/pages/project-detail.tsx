import { Link, useParams } from 'react-router'
import { SEO } from '@/components/seo'
import { getProjectById } from '@/content/open-source'
import { useI18n } from '@/lib/i18n'
import { useLocalizedPath } from '@/lib/use-localized-path'

export default function ProjectDetail() {
  const { id = '' } = useParams()
  const { messages, locale } = useI18n()
  const localizedPath = useLocalizedPath()
  const copy = messages.openSource
  const project = getProjectById(id)

  if (!project) {
    return (
      <section className="mx-auto my-10 max-w-[720px] border border-[#1a1a1a] p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          404
        </p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em]">
          {copy.notFoundTitle}
        </h1>
        <p>{copy.notFoundDescription}</p>
        <Link
          to={localizedPath('/')}
          className="mt-4 inline-flex text-[#057dbc] underline underline-offset-4"
        >
          {copy.backToProjects}
        </Link>
      </section>
    )
  }

  const description = copy.projects[project.id]
  const projectPath = localizedPath(`/projects/${project.id}`)

  return (
    <article className="mx-auto max-w-[980px]">
      <SEO
        title={project.name}
        description={description}
        path={projectPath}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: project.name,
          description,
          codeRepository: project.repo,
          url: `https://whoisclebs.com${projectPath}`,
          programmingLanguage: project.technologies.join(', '),
          inLanguage: locale,
          author: {
            '@type': 'Person',
            name: 'Clebson A. Fonseca',
          },
        }}
      />

      <header className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          {copy.kicker}
        </p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">
          {project.name}
        </h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {description}
        </p>
      </header>

      <section className="grid gap-8 border-b border-[#1a1a1a] py-8 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#757575]">
            {copy.title}
          </p>
          <p className="mt-3 font-serif text-lg leading-8 text-[#1a1a1a]">
            {description}
          </p>
        </div>

        <div className="space-y-6 border border-[#1a1a1a] p-5">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#757575]">
              {copy.yearLabel}
            </p>
            <p className="mt-2 text-2xl font-extrabold leading-none tracking-[-0.04em] text-[#1a1a1a]">
              {project.year}
            </p>
          </div>

          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#757575]">
              {copy.stackLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((technology) => (
                <span
                  key={technology}
                  className="inline-flex items-center border border-[#1a1a1a] px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] text-[#1a1a1a]"
                >
                  {technology}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-4 py-8">
        <a
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
        >
          {copy.repository}
        </a>
        <a
          href={project.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] px-6 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          {copy.docs}
        </a>
      </section>
    </article>
  )
}
