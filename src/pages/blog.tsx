import { PostCard } from '@/components/blog/post-card'
import { Link, useSearchParams } from 'react-router'
import { getBalancedEditorialGridItemClass, getPublishedPosts, paginatePosts } from '@/lib/posts'

export default function Blog() {
  const [searchParams] = useSearchParams()
  const posts = getPublishedPosts()
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const pagination = paginatePosts(posts, requestedPage)
  const [hero, ...rest] = pagination.items

  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">BLOG DE ENGENHARIA</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">Engenharia em campo</h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          Notas sobre arquitetura de software, interfaces, operação e decisões técnicas sem verniz corporativo.
        </p>
      </section>

      <div className="mt-8">{hero && <PostCard post={hero} featured />}</div>

      {rest.length > 0 && (
        <>
          <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label="Artigos recentes">ARTIGOS RECENTES</section>
          <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-6" data-testid="recent-post-grid">
            {rest.map((post, index) => (
              <PostCard key={post.slug} post={post} className={getBalancedEditorialGridItemClass(index, rest.length)} />
            ))}
          </div>
        </>
      )}

      <nav className="mt-8 flex flex-col gap-4 border-t border-[#1a1a1a] pt-5 font-mono text-xs uppercase tracking-[0.095em] text-[#1a1a1a] md:flex-row md:items-center md:justify-between" aria-label="Paginação dos posts">
        <span className="text-[#757575]">Página {pagination.currentPage} de {pagination.totalPages}</span>
        <div className="flex gap-3">
          {pagination.hasPreviousPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/blog?page=${pagination.currentPage - 1}`}>
              Página anterior
            </Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">Página anterior</span>
          )}
          {pagination.hasNextPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/blog?page=${pagination.currentPage + 1}`}>
              Próxima página
            </Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">Próxima página</span>
          )}
        </div>
      </nav>
    </div>
  )
}
