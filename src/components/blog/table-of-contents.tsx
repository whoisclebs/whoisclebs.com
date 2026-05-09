import type { TableOfContentsItem } from '@/lib/markdown'

type TableOfContentsProps = {
  items: TableOfContentsItem[]
  title: string
  className?: string
}

export function TableOfContents({ items, title, className = '' }: TableOfContentsProps) {
  if (items.length === 0) return null

  return (
    <nav className={`bg-transparent ${className}`} aria-label={title}>
      <p className="mb-5 font-sans text-sm font-semibold leading-none text-[#1a1a1a]">{title}</p>
      <ol className="grid gap-3 font-sans text-[13px] font-semibold leading-5">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              className={index === 0
                ? 'block break-words text-[#1a1a1a] transition-colors hover:text-[#057dbc]'
                : 'block break-words text-[#6b7280] transition-colors hover:text-[#057dbc]'}
              href={`#${item.id}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
      <div className="mt-8 border-t border-[#e5e0d8] pt-6">
        <a className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[#6b7280] transition-colors hover:text-[#057dbc]" href="#top">
          <span>Scroll to top</span>
          <span className="inline-flex size-3 items-center justify-center rounded-full border border-current text-[8px] leading-none" aria-hidden="true">↑</span>
        </a>
      </div>
    </nav>
  )
}
