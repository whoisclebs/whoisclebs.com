import { Link, useParams } from "react-router";
import { GiscusComments } from "@/components/blog/giscus-comments";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { RichContent } from "@/components/blog/rich-content";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { SEO } from "@/components/seo";
import { SocialLinks } from "@/components/ui/social-links";
import { getAuthorByUsername } from "@/content/authors";
import { formatPostDate, getPostBySlug } from "@/lib/posts";
import { useI18n } from "@/lib/i18n";
import { buildTableOfContents } from "@/lib/markdown";
import { useLocalizedPath } from "@/lib/use-localized-path";

export default function BlogPost() {
  const { slug = "" } = useParams();
  const { locale, t } = useI18n();
  const localizedPath = useLocalizedPath();
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
          to={localizedPath('/blog')}
          className="mt-4 inline-flex text-[#057dbc] underline underline-offset-4"
        >
          {t('blog.backToBlog')}
        </Link>
      </section>
    );
  }

  const author = getAuthorByUsername(post.author);
  const tocItems = buildTableOfContents(post.blocks);

  return (
    <article id="top" data-longform className="article-container mx-auto min-w-0 max-w-[1180px] overflow-visible">
      <SEO
        title={post.title}
        description={post.excerpt}
        path={localizedPath(`/blog/${post.slug}`)}
        image={post.cover}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.cover,
          datePublished: post.date,
          url: `https://whoisclebs.com${localizedPath(`/blog/${post.slug}`)}`,
          author: { '@type': 'Person', name: author?.name ?? post.author },
        }}
      />
      <header className="mx-auto min-w-0 max-w-[720px] border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          {post.kicker}
        </p>
        <h1 className="my-3 break-words text-4xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">
          {post.title}
        </h1>
        <p className="mb-5 break-words font-serif text-xl leading-8 text-[#1a1a1a]">
          {post.excerpt}
        </p>
        <div className="flex min-w-0 items-center gap-3">
          {author && (
            <img
              src={author.avatar}
              alt={author.name}
              className="size-12 rounded-full border border-[#1a1a1a] object-cover grayscale"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="break-words font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">
              {t('blog.by')} {author?.name ?? post.author} · {formatPostDate(post.date, locale)} ·{" "}
              {post.readingTime}
            </p>
            {author && (
              <p className="mt-1 break-words font-serif text-sm leading-5 text-[#757575]">
                {author.bio}
              </p>
            )}
            <SocialLinks className="mt-4" />
          </div>
        </div>
      </header>

      <img
        className="mx-auto my-6 block aspect-video w-full max-w-[720px] object-cover"
        src={post.cover}
        alt={post.coverAlt}
      />

      <div className="relative mx-auto max-w-[720px]">
        <div className="min-w-0">
          <RichContent blocks={post.blocks} />
        </div>
        <aside className="mb-6 lg:absolute lg:left-[calc(100%+40px)] lg:top-0 lg:mb-0 lg:w-60">
          <TableOfContents
            items={tocItems}
            title={locale === 'en' ? 'On this page' : 'Neste texto'}
            className="lg:sticky lg:top-24"
          />
        </aside>
      </div>

      <NewsletterCta />
      <GiscusComments />
    </article>
  );
}
