import { Link, useSearchParams } from 'react-router'
import { SEO } from '@/components/seo'
import { formatPostDate, getResponsiveGridClass, paginatePosts } from '@/lib/posts'
import { getPublishedTilEntries } from '@/lib/til'

export default function Til() {
  const [searchParams] = useSearchParams()
  const entries = getPublishedTilEntries()
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const pagination = paginatePosts(entries, requestedPage)

  return (
    <div>
      <SEO title="Today I Learned" description="Notas curtas sobre coisas que Clebson está aprendendo em engenharia de software." path="/til" />
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">TODAY I LEARNED</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">Notas de aprendizado</h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          Registros curtos do que estou aprendendo, testando ou revisitando no dia a dia.
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
            <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">{formatPostDate(entry.date)}</p>
          </article>
        ))}
      </div>
      <nav className="mt-8 flex flex-col gap-4 border-t border-[#1a1a1a] pt-5 font-mono text-xs uppercase tracking-[0.095em] text-[#1a1a1a] md:flex-row md:items-center md:justify-between" aria-label="Paginação dos TILs">
        <span className="text-[#757575]">Página {pagination.currentPage} de {pagination.totalPages}</span>
        <div className="flex gap-3">
          {pagination.hasPreviousPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/til?page=${pagination.currentPage - 1}`}>Página anterior</Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">Página anterior</span>
          )}
          {pagination.hasNextPage ? (
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={`/til?page=${pagination.currentPage + 1}`}>Próxima página</Link>
          ) : (
            <span className="border-2 border-[#e2e8f0] px-4 py-3 text-[#999999]">Próxima página</span>
          )}
        </div>
      </nav>
    </div>
  )
}
