import { Link } from 'react-router'
import { formatPostDate } from '@/lib/posts'
import type { BlogPost } from '@/lib/posts'
import { useLocalizedPath } from '@/lib/use-localized-path'

type PostCardProps = {
  post: BlogPost
  featured?: boolean
  className?: string
}

export function PostCard({ post, featured = false, className = '' }: PostCardProps) {
  const localizedPath = useLocalizedPath()

  return (
    <article
      className={featured
        ? `h-full min-w-0 overflow-hidden border border-line bg-paper ${className}`
        : `min-w-0 overflow-hidden border-r border-t border-line bg-paper ${className}`}
      data-testid={`post-card-${post.slug}`}
    >
      <div className={featured ? 'min-w-0 p-5 md:p-7' : 'min-w-0 p-5'}>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-accent">{post.kicker}</p>
        <h2 className={featured ? 'my-2 break-words font-display text-3xl leading-none tracking-[-0.02em] md:text-[58px] md:leading-[0.98]' : 'my-2 break-words font-display text-[30px] leading-[0.95] tracking-[-0.02em]'}>
          <Link to={localizedPath(`/blog/${post.slug}`)} data-nav-item className="transition-colors hover:text-accent hover:underline hover:underline-offset-4">{post.title}</Link>
        </h2>
        <p className={featured ? 'mb-4 line-clamp-3 break-words font-serif text-[22px] leading-[1.24] text-muted' : 'mb-4 line-clamp-3 break-words font-serif text-base leading-[1.12] text-muted'}>{post.excerpt}</p>
        <p className="break-words font-mono text-xs uppercase tracking-[0.095em] text-soft">{formatPostDate(post.date)} · {post.readingTime}</p>
      </div>
    </article>
  )
}
