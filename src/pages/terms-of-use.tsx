import { SEO } from '@/components/seo'
import { useI18n } from '@/lib/i18n'

export default function TermsOfUse() {
  const { messages } = useI18n()
  const copy = messages.terms

  return (
    <article className="article-container mx-auto max-w-[760px]">
      <SEO title={copy.title} description={copy.description} path="/terms-of-use" />
      <header className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">LEGAL</p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">{copy.title}</h1>
        <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">{copy.updated}</p>
      </header>
      <div className="py-8 font-serif text-lg leading-8 text-[#1a1a1a]">
        {copy.sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="mb-4 font-sans text-3xl font-extrabold leading-tight tracking-[-0.035em]">{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-4">{paragraph}</p>)}
          </section>
        ))}
      </div>
    </article>
  )
}
