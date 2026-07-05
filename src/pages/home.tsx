import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
import { OpenSourceSection } from "@/components/home/open-source-section";
import { SEO } from "@/components/seo";
import { getPublishedPosts } from "@/lib/posts";
import { useI18n } from "@/lib/i18n";
import { useLocalizedPath } from "@/lib/use-localized-path";

const Home: React.FC = () => {
  const { locale, messages } = useI18n()
  const localizedPath = useLocalizedPath()
  const copy = messages.home
  const posts = getPublishedPosts(locale).slice(0, 3)
  const [featuredPost, ...secondaryPosts] = posts

  return (
    <div>
      <SEO />

      {/* ───── Hero Cover ───── */}
      <section className="border-b border-line md:grid md:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="flex flex-col justify-center gap-5 px-6 py-12 md:gap-[22px] md:px-11 md:py-[54px] md:pr-10 md:border-r border-line">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.09375em] text-accent">
            ENGENHARIA APLICADA
          </p>
          <h1 className="max-w-3xl font-display text-[3.5rem] leading-[0.94] md:text-[74px] text-ink">
            {copy.headline}
          </h1>
          <p className="max-w-[760px] font-serif text-xl leading-[1.22] text-muted md:text-2xl">
            {copy.intro}
          </p>
          <nav className="flex flex-wrap items-center gap-3" aria-label="Home actions">
            <Link
              to={localizedPath('/blog')}
              className="inline-flex items-center gap-2 bg-graphite px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.06875em] text-bg transition-colors hover:bg-ink"
            >
              LER ARTIGOS
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to={localizedPath('/portfolio')}
              className="inline-flex items-center border border-line px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.06875em] text-ink transition-colors hover:bg-line hover:text-bg"
            >
              VER PROJETOS
            </Link>
          </nav>
        </div>

        {/* "Agora" margin-note */}
        <aside className="flex items-center px-6 py-12 md:px-0 md:pr-6 md:pl-8 md:py-[54px]">
          <div className="w-full border border-line bg-paper p-[22px]">
            <h2 className="font-display text-[34px] leading-none text-ink">{copy.nowTitle}</h2>
            <div className="mt-4 space-y-0">
              {copy.nowItems.map((item, i) => (
                <div
                  key={item}
                  className={`${i < copy.nowItems.length - 1 ? 'border-b border-hairline pb-3 mb-3' : ''}`}
                >
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08125em] text-accent">
                    {copy.nowLabels?.[i] ?? ''}
                  </p>
                  <p className="mt-1 font-serif text-base leading-[1.25] text-ink">
                    {item}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10px] tracking-[0.06875em] text-soft">
              {copy.nowUpdated}
            </p>
          </div>
        </aside>
      </section>

      {/* ───── Recent Writing ───── */}
      <section className="mt-0" aria-label={copy.latest}>
        {/* Graphite bar */}
        <div className="flex items-center justify-between bg-graphite px-6 py-4 md:px-[18px] md:h-[72px]">
          <h2 className="font-display text-4xl leading-none text-bg md:text-[40px]">
            {copy.latest}
          </h2>
          <p className="hidden font-mono text-[11px] tracking-[0.075em] text-[#C8C2B8] md:block">
            ARTIGOS / ENSAIOS / DECISOES
          </p>
        </div>

        {featuredPost && (
          <div className="grid border-r border-b border-l border-line md:grid-cols-[1fr_420px]">
            {/* Featured article */}
            <div className="border-r border-line">
              <PostCard post={featuredPost} featured />
            </div>

            {/* Secondary articles */}
            <div className="flex flex-col">
              {secondaryPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}

              {/* "All articles" link card */}
              <Link
                to={localizedPath('/blog')}
                className="flex flex-col gap-2 border-t border-line bg-graphite p-[18px] md:p-[22px] transition-colors hover:bg-[#2A2A2F]"
                data-nav-item
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.06875em] text-[#8EA0FF]">
                  ARQUIVO
                </p>
                <h3 className="font-display text-[30px] leading-[0.95] text-paper">
                  {copy.moreWriting}
                </h3>
                <p className="font-serif text-base leading-[1.12] text-[#C8C2B8]">
                  {locale === 'pt-BR'
                    ? 'A página completa com posts, ensaios e notas técnicas.'
                    : 'The full page with posts, essays, and technical notes.'}
                </p>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ───── Open Source / Projetos ───── */}
      <section className="mt-16 mb-16">
        <OpenSourceSection />
      </section>
    </div>
  )
}

export default Home;
