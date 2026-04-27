import { Link } from 'react-router'
import { formatPostDate } from '@/lib/posts'
import type { BlogPost } from '@/lib/posts'

type PostCardProps = {
  post: BlogPost
  featured?: boolean
  className?: string
}

export function PostCard({ post, featured = false, className = '' }: PostCardProps) {
  return (
    <article
      className={featured
        ? `grid min-w-0 overflow-hidden border border-[#1a1a1a] bg-white md:grid-cols-[1.35fr_0.75fr] ${className}`
        : `min-w-0 overflow-hidden border-r border-t border-[#1a1a1a] bg-white ${className}`}
      data-testid={`post-card-${post.slug}`}
    >
      <img src={post.cover} alt={post.coverAlt} loading={featured ? 'eager' : 'lazy'} className="block aspect-video w-full max-w-full object-cover grayscale-[20%]" />
      <div className={featured ? 'min-w-0 flex flex-col justify-center border-t border-[#1a1a1a] p-5 md:border-l md:border-t-0 md:p-7' : 'min-w-0 p-5'}>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{post.kicker}</p>
        <h2 className={featured ? 'my-2 break-words text-3xl font-extrabold leading-none tracking-[-0.05em] md:text-6xl' : 'my-2 break-words text-2xl font-extrabold leading-tight tracking-[-0.04em] md:text-3xl'}>
          <Link to={`/blog/${post.slug}`} className="transition-colors hover:text-[#057dbc] hover:underline hover:underline-offset-4">{post.title}</Link>
        </h2>
        <p className="mb-4 line-clamp-3 break-words font-serif leading-7 text-[#1a1a1a]">{post.excerpt}</p>
        <p className="break-words font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">{formatPostDate(post.date)} · {post.readingTime}</p>
      </div>
    </article>
  )
}
