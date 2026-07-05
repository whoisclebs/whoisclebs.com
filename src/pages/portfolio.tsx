import { Link } from 'react-router'
import { useI18n } from '@/lib/i18n'
import { useLocalizedPath } from '@/lib/use-localized-path'

export default function Portfolio() {
  const { messages } = useI18n()
  const localizedPath = useLocalizedPath()
  const copy = messages.portfolio

  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">PORTFOLIO</p>
        <h1 className="my-3 max-w-5xl text-4xl font-extrabold leading-none tracking-[-0.055em] sm:text-5xl md:text-8xl">
          {copy.title}
        </h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {copy.description}
        </p>
      </section>

      <section className="grid grid-cols-1 border-b border-l border-[#1a1a1a] md:grid-cols-3" aria-label={copy.areasLabel}>
        {copy.projects.map((project) => (
          <article key={project.name} className="border-r border-t border-[#1a1a1a] bg-white p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{project.kicker}</p>
            <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{project.name}</h2>
            <p className="mb-5 font-serif leading-7 text-[#1a1a1a]">{project.summary}</p>
            <p className="font-mono text-xs uppercase leading-5 tracking-[0.08em] text-[#757575]">{project.stack}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-8 border-2 border-[#1a1a1a] p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{copy.availability}</p>
          <h2 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.045em]">{copy.ctaTitle}</h2>
          <p className="mt-3 max-w-2xl font-serif leading-7">
            {copy.ctaText}
          </p>
        </div>
        <Link
          to={localizedPath('/about')}
          className="inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
        >
          {copy.ctaLink}
        </Link>
      </section>
    </div>
  )
}
