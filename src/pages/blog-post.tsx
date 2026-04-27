import { Link, useParams } from "react-router";
import { CodeBlock } from "@/components/blog/code-block";
import { NewsletterCta } from "@/components/blog/newsletter-cta";
import { getAuthorByUsername } from "@/content/authors";
import { formatPostDate, getPostBySlug } from "@/lib/posts";

export default function BlogPost() {
  const { slug = "" } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <section className="mx-auto my-10 max-w-[720px] border border-[#1a1a1a] p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          404
        </p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em]">
          Artigo não encontrado
        </h1>
        <p>Esse slug não existe ou o texto ainda não foi publicado.</p>
        <Link
          to="/blog"
          className="mt-4 inline-flex text-[#057dbc] underline underline-offset-4"
        >
          Voltar para o blog
        </Link>
      </section>
    );
  }

  const author = getAuthorByUsername(post.author);

  return (
    <article className="article-container mx-auto max-w-[720px]">
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
              POR {author?.name ?? post.author} · {formatPostDate(post.date)} ·{" "}
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

      <div className="font-serif text-lg leading-8 text-[#1a1a1a]">
        {post.blocks.map((block, index) => {
          if (block.type === "paragraph")
            return (
              <p key={index} className="mb-6">
                {block.text}
              </p>
            );
          if (block.type === "heading")
            return (
              <h2
                key={index}
                className="mb-4 mt-10 font-sans text-3xl font-extrabold leading-tight tracking-[-0.035em]"
              >
                {block.text}
              </h2>
            );
          if (block.type === "list") {
            return (
              <ul key={index} className="mb-6 list-disc pl-6">
                {block.items.map((item) => (
                  <li key={item} className="mb-2">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <CodeBlock
              key={index}
              language={block.language}
              code={block.code}
            />
          );
        })}
      </div>

      <NewsletterCta />
    </article>
  );
}
