import { Link, useParams } from 'react-router'
import { GiscusComments } from '@/components/blog/giscus-comments'
import { RichContent } from '@/components/blog/rich-content'
import { SEO } from '@/components/seo'
import { formatPostDate } from '@/lib/posts'
import { getTilBySlug } from '@/lib/til'

export default function TilPost() {
  const { slug = '' } = useParams()
  const entry = getTilBySlug(slug)

  if (!entry) {
    return (
      <section className="mx-auto my-10 max-w-[720px] border border-[#1a1a1a] p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">404</p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em]">TIL não encontrado</h1>
        <Link to="/til" className="mt-4 inline-flex text-[#057dbc] underline underline-offset-4">Voltar para TIL</Link>
      </section>
    )
  }

  return (
    <article className="article-container mx-auto max-w-[720px]">
      <SEO
        title={entry.title}
        description={entry.excerpt}
        path={`/til/${entry.slug}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: entry.title,
          description: entry.excerpt,
          datePublished: entry.date,
          url: `https://whoisclebs.com/til/${entry.slug}`,
          author: { '@type': 'Person', name: 'Clebson A. Fonseca' },
        }}
      />
      <header className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{entry.kicker}</p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">{entry.title}</h1>
        <p className="mb-5 font-serif text-xl leading-8 text-[#1a1a1a]">{entry.excerpt}</p>
        <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">TIL · {formatPostDate(entry.date)}</p>
      </header>
      <div className="mt-6"><RichContent blocks={entry.blocks} /></div>
      <GiscusComments />
    </article>
  )
}
