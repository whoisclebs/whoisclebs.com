import { PostCard } from '@/components/blog/post-card'
import { Link, useSearchParams } from 'react-router'
import { getBalancedEditorialGridItemClass, getPublishedPosts, paginatePosts } from '@/lib/posts'
import { useI18n } from '@/lib/i18n'

export default function Blog() {
  const [searchParams] = useSearchParams()
  const { locale, t, format } = useI18n()
  const posts = getPublishedPosts(locale)
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const pagination = paginatePosts(posts, requestedPage)
  const [hero, ...rest] = pagination.items

  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{t('blog.kicker')}</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">{t('blog.title')}</h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {t('blog.description')}
        </p>
      </section>

      <div className="mt-8">{hero && <PostCard post={hero} featured />}</div>

      {rest.length > 0 && (
        <>
          <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label={t('blog.recentArticles')}>{t('blog.recentArticles')}</section>
          <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-6" data-testid="recent-post-grid">
            {rest.map((post, index) => (
              <PostCard key={post.slug} post={post} className={getBalancedEditorialGridItemClass(index, rest.length)} />
            ))}
          </div>
        </>
      )}

      <nav className="mt-8 flex flex-col gap-4 border-t border-[#1a1a1a] pt-5 font-mono text-xs uppercase tracking-[0.095em] text-[#1a1a1a] md:flex-row md:items-center md:justify-between" aria-label={t('blog.paginationLabel')}>
        <span className="text-[#757575]">{format('blog.pageStatus', { current: pagination.currentPage, total: pagination.totalPages })}</span>
        <div className="flex gap-3">
          {pagination.hasPreviousPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/blog?page=${pagination.currentPage - 1}`}>
              {t('blog.previousPage')}
            </Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">{t('blog.previousPage')}</span>
          )}
          {pagination.hasNextPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/blog?page=${pagination.currentPage + 1}`}>
              {t('blog.nextPage')}
            </Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">{t('blog.nextPage')}</span>
          )}
        </div>
      </nav>
    </div>
  )
}
