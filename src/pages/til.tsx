import { Link, useSearchParams } from 'react-router'
import { SEO } from '@/components/seo'
import { formatPostDate, getResponsiveGridClass, paginatePosts } from '@/lib/posts'
import { getPublishedTilEntries } from '@/lib/til'
import { useI18n } from '@/lib/i18n'

export default function Til() {
  const [searchParams] = useSearchParams()
  const { locale, t, format } = useI18n()
  const entries = getPublishedTilEntries(locale)
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const pagination = paginatePosts(entries, requestedPage)

  return (
    <div>
      <SEO title="Today I Learned" description={t('til.seoDescription')} path="/til" />
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{t('til.kicker')}</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">{t('til.title')}</h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {t('til.description')}
        </p>
      </section>
      <div className={`mt-8 grid border-b border-l border-[#1a1a1a] ${getResponsiveGridClass(pagination.items.length)}`} data-testid="til-grid">
        {pagination.items.map((entry) => (
          <article key={entry.slug} className="border-r border-t border-[#1a1a1a] bg-white p-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{entry.kicker}</p>
            <h2 className="my-2 text-3xl font-extrabold leading-tight tracking-[-0.04em]">
              <Link className="transition-colors hover:text-[#057dbc] hover:underline hover:underline-offset-4" to={`/til/${entry.slug}`}>{entry.title}</Link>
            </h2>
            <p className="mb-4 font-serif leading-7 text-[#1a1a1a]">{entry.excerpt}</p>
            <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">{formatPostDate(entry.date, locale)}</p>
          </article>
        ))}
      </div>
      <nav className="mt-8 flex flex-col gap-4 border-t border-[#1a1a1a] pt-5 font-mono text-xs uppercase tracking-[0.095em] text-[#1a1a1a] md:flex-row md:items-center md:justify-between" aria-label={t('til.paginationLabel')}>
        <span className="text-[#757575]">{format('blog.pageStatus', { current: pagination.currentPage, total: pagination.totalPages })}</span>
        <div className="flex gap-3">
          {pagination.hasPreviousPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/til?page=${pagination.currentPage - 1}`}>{t('blog.previousPage')}</Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">{t('blog.previousPage')}</span>
          )}
          {pagination.hasNextPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/til?page=${pagination.currentPage + 1}`}>{t('blog.nextPage')}</Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">{t('blog.nextPage')}</span>
          )}
        </div>
      </nav>
    </div>
  )
}
