import { Link, useParams } from 'react-router'
import { GiscusComments } from '@/components/blog/giscus-comments'
import { RichContent } from '@/components/blog/rich-content'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { SEO } from '@/components/seo'
import { buildTableOfContents } from '@/lib/markdown'
import { formatPostDate } from '@/lib/posts'
import { getTilBySlug } from '@/lib/til'
import { useI18n } from '@/lib/i18n'
import { useLocalizedPath } from '@/lib/use-localized-path'

export default function TilPost() {
  const { slug = '' } = useParams()
  const { locale, t } = useI18n()
  const localizedPath = useLocalizedPath()
  const entry = getTilBySlug(slug, locale)

  if (!entry) {
    return (
      <section className="mx-auto my-10 max-w-[720px] border border-[#1a1a1a] p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">404</p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em]">{t('til.notFoundTitle')}</h1>
        <Link to={localizedPath('/til')} className="mt-4 inline-flex text-[#057dbc] underline underline-offset-4">{t('til.backToTil')}</Link>
      </section>
    )
  }

  const tocItems = buildTableOfContents(entry.blocks)

  return (
    <article id="top" data-longform className="article-container mx-auto max-w-[1180px]">
      <SEO
        title={entry.title}
        description={entry.excerpt}
        path={localizedPath(`/til/${entry.slug}`)}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: entry.title,
          description: entry.excerpt,
          datePublished: entry.date,
          url: `https://whoisclebs.com${localizedPath(`/til/${entry.slug}`)}`,
          author: { '@type': 'Person', name: 'Clebson A. Fonseca' },
        }}
      />
      <header className="mx-auto max-w-[720px] border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{entry.kicker}</p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">{entry.title}</h1>
        <p className="mb-5 font-serif text-xl leading-8 text-[#1a1a1a]">{entry.excerpt}</p>
        <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">TIL · {formatPostDate(entry.date, locale)}</p>
      </header>
      <div className="relative mx-auto mt-6 max-w-[720px]">
        <div className="min-w-0">
          <RichContent blocks={entry.blocks} />
        </div>
        <aside className="mb-6 lg:absolute lg:left-[calc(100%+40px)] lg:top-0 lg:mb-0 lg:w-60">
          <TableOfContents
            items={tocItems}
            title={locale === 'en' ? 'On this page' : 'Neste texto'}
            className="lg:sticky lg:top-24"
          />
        </aside>
      </div>
      <GiscusComments />
    </article>
  )
}
