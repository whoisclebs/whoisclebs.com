import { Link } from "react-router";
import { PostCard } from "@/components/blog/post-card";
import { OpenSourceSection } from "@/components/home/open-source-section";
import { SEO } from "@/components/seo";
import { formatPostDate, getPublishedPosts } from "@/lib/posts";
import { getPublishedTilEntries } from "@/lib/til";
import { useI18n } from "@/lib/i18n";
import { useLocalizedPath } from "@/lib/use-localized-path";

const Home: React.FC = () => {
  const { locale, messages } = useI18n()
  const localizedPath = useLocalizedPath()
  const copy = messages.home
  const posts = getPublishedPosts(locale).slice(0, 3)
  const [featuredPost, ...secondaryPosts] = posts
  const tilEntries = getPublishedTilEntries(locale).slice(0, 3)

  return (
    <div>
      <SEO />
      <section className="grid gap-8 border-b border-[#1a1a1a] py-8 md:grid-cols-[1.35fr_0.65fr] md:items-end">
        <div>
          <h1 className="max-w-5xl text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">{copy.headline}</h1>
          <p className="mt-4 max-w-[760px] font-serif text-xl leading-8 text-[#1a1a1a]">{copy.intro}</p>
          <nav className="mt-6 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.095em]" aria-label="Home shortcuts">
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={localizedPath('/about')}>{copy.about}</Link>
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={localizedPath('/blog')}>{copy.blog}</Link>
            <Link className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white" to={localizedPath('/portfolio')}>{copy.portfolio}</Link>
          </nav>
        </div>
        <aside className="border-l-2 border-[#1a1a1a] pl-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#1a1a1a]">{copy.nowTitle}</p>
          <ul className="mt-4 grid gap-3 font-serif leading-7 text-[#1a1a1a]">
            {copy.nowItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </aside>
      </section>

      <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label={copy.latest}>{copy.latest}</section>
      {featuredPost && (
        <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-[1.25fr_0.75fr]">
          <PostCard post={featuredPost} featured className="border-r border-t" />
          <div className="grid">
            {secondaryPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
            <Link className="flex min-h-20 items-center justify-center border-r border-t border-[#1a1a1a] bg-white px-5 font-mono text-xs font-bold uppercase tracking-[0.095em] transition-colors hover:bg-[#1a1a1a] hover:text-white" to={localizedPath('/blog')}>
              {copy.moreWriting}
            </Link>
          </div>
        </div>
      )}
      <OpenSourceSection />
      <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label={copy.til}>{copy.til}</section>
      <div className="border-b border-l border-[#1a1a1a]">
        {tilEntries.map((entry) => (
          <article key={entry.slug} className="grid gap-3 border-r border-t border-[#1a1a1a] bg-white p-5 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
            <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">{formatPostDate(entry.date, locale)}</p>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.095em] text-[#757575]">{entry.kicker}</p>
              <h2 className="my-1 text-2xl font-extrabold leading-tight tracking-[-0.04em]">
                <Link className="transition-colors hover:text-[#057dbc] hover:underline hover:underline-offset-4" to={localizedPath(`/til/${entry.slug}`)}>{entry.title}</Link>
              </h2>
              <p className="font-serif leading-7 text-[#1a1a1a]">{entry.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default Home;
