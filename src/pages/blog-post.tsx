import { Link, useParams } from "react-router";
import { GiscusComments } from "@/components/blog/giscus-comments";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { RichContent } from "@/components/blog/rich-content";
import { SEO } from "@/components/seo";
import { getAuthorByUsername } from "@/content/authors";
import { formatPostDate, getPostBySlug } from "@/lib/posts";
import { useI18n } from "@/lib/i18n";

export default function BlogPost() {
  const { slug = "" } = useParams();
  const { locale, t } = useI18n();
  const post = getPostBySlug(slug, locale);

  if (!post) {
    return (
      <section className="mx-auto my-10 max-w-[720px] border border-[#1a1a1a] p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          404
        </p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em]">
          {t('blog.notFoundTitle')}
        </h1>
        <p>{t('blog.notFoundDescription')}</p>
        <Link
          to="/blog"
          className="mt-4 inline-flex text-[#057dbc] underline underline-offset-4"
        >
          {t('blog.backToBlog')}
        </Link>
      </section>
    );
  }

  const author = getAuthorByUsername(post.author);

  return (
    <article className="article-container mx-auto max-w-[720px]">
      <SEO
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.cover}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.cover,
          datePublished: post.date,
          url: `https://whoisclebs.com/blog/${post.slug}`,
          author: { '@type': 'Person', name: author?.name ?? post.author },
        }}
      />
      <header className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          {post.kicker}
        </p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">
          {post.title}
        </h1>
        <p className="mb-5 font-serif text-xl leading-8 text-[#1a1a1a]">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3">
          {author && (
            <img
              src={author.avatar}
              alt={author.name}
              className="size-12 rounded-full border border-[#1a1a1a] object-cover grayscale"
            />
          )}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">
              {t('blog.by')} {author?.name ?? post.author} · {formatPostDate(post.date, locale)} ·{" "}
              {post.readingTime}
            </p>
            {author && (
              <p className="mt-1 font-serif text-sm leading-5 text-[#757575]">
                {author.bio}
              </p>
            )}
          </div>
        </div>
      </header>

      <img
        className="my-6 block aspect-video w-full object-cover"
        src={post.cover}
        alt={post.coverAlt}
      />

      <RichContent blocks={post.blocks} />

      <NewsletterCta />
      <GiscusComments />
    </article>
  );
}
