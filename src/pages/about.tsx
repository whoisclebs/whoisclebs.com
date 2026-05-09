import { useState } from "react";
import { credlyBadges } from "@/content/credly-badges";
import { useI18n } from "@/lib/i18n";

const BADGES_PER_PAGE = 6;

export default function About() {
  const { messages } = useI18n()
  const copy = messages.about
  const [badgesPage, setBadgesPage] = useState(1);
  const totalBadgePages = Math.max(1, Math.ceil(credlyBadges.length / BADGES_PER_PAGE));
  const currentBadgePage = Math.min(badgesPage, totalBadgePages);
  const visibleBadges = credlyBadges.slice(
    (currentBadgePage - 1) * BADGES_PER_PAGE,
    currentBadgePage * BADGES_PER_PAGE,
  );
  const badgePageStatus = copy.pageStatus
    .replace('{current}', String(currentBadgePage))
    .replace('{total}', String(totalBadgePages))

  return (
    <div>
      <section className="grid gap-8 border-b border-[#1a1a1a] py-8 md:grid-cols-[1.15fr_0.85fr] md:items-end">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
            {copy.kicker}
          </p>
          <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
            {copy.title}
          </h1>
          <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
            {copy.intro}
          </p>
        </div>

        <img
          src="/profile/clebson.png"
          alt="Clebson A. Fonseca"
          className="aspect-square w-full border border-[#1a1a1a] object-cover grayscale"
        />
      </section>

      <section className="mt-8 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white">
        {copy.journey}
      </section>

      <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-3">
        {copy.timeline.map((item) => (
          <article key={item.label} className="border-r border-t border-[#1a1a1a] bg-white p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
              {item.label}
            </p>
            <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">
              {item.title}
            </h2>
            <p className="font-serif leading-7 text-[#1a1a1a]">{item.text}</p>
          </article>
        ))}
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="border-t border-[#1a1a1a] pt-6">
          {copy.paragraphs.map((paragraph, index) => <p key={paragraph} className={`${index < 2 ? 'mb-6 ' : ''}font-serif text-lg leading-8 text-[#1a1a1a]`}>{paragraph}</p>)}
          <img
            src="/cover/d&d.png"
            alt={copy.dndAlt}
            className="mt-6 w-full border border-[#1a1a1a] object-cover"
            loading="lazy"
          />
        </div>

        <div className="border-2 border-[#1a1a1a] p-6">
          <h2 className="text-4xl font-extrabold leading-none tracking-[-0.045em]">
            Badges
          </h2>
          <p className="mt-4 font-serif leading-7 text-[#1a1a1a]">
            {copy.badgesText}{' '}
            <a
              href="https://www.credly.com/users/whoisclebs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#057dbc] underline underline-offset-4"
            >
              Credly
            </a>
            .
          </p>
          <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleBadges.map((badge) => (
              <a
                key={badge.url}
                href={badge.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[260px] flex-col border border-[#1a1a1a] bg-white p-5 transition-colors hover:bg-[#f9fafb]"
              >
                <div className="flex min-h-28 items-center justify-center border-b border-[#e2e8f0] pb-4">
                  <img
                    src={badge.image}
                    alt={badge.name}
                    className="size-24 object-contain transition-transform duration-150 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col pt-4">
                  <p className="font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-[#757575]">
                    {badge.issuer} · {badge.issuedAt}
                  </p>
                  <h3 className="mt-2 font-sans text-xl font-extrabold leading-tight tracking-[-0.035em] group-hover:text-[#057dbc] group-hover:underline group-hover:underline-offset-4">
                    {badge.name}
                  </h3>
                  <span className="mt-auto pt-5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#1a1a1a]">
                    {copy.credential}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <nav className="mb-6 flex flex-col gap-3 border-t border-[#1a1a1a] pt-4 font-mono text-xs uppercase tracking-[0.095em] md:flex-row md:items-center md:justify-between" aria-label={copy.badgesPagination}>
            <span className="text-[#757575]">{badgePageStatus}</span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={currentBadgePage === 1}
                onClick={() => setBadgesPage((page) => Math.max(1, page - 1))}
                className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:border-[#e2e8f0] disabled:text-[#999999] disabled:hover:bg-white disabled:hover:text-[#999999]"
              >
                {copy.previous}
              </button>
              <button
                type="button"
                disabled={currentBadgePage === totalBadgePages}
                onClick={() => setBadgesPage((page) => Math.min(totalBadgePages, page + 1))}
                className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:border-[#e2e8f0] disabled:text-[#999999] disabled:hover:bg-white disabled:hover:text-[#999999]"
              >
                {copy.next}
              </button>
            </div>
          </nav>
        </div>
      </section>

      <section className="mt-12 grid gap-8 border-2 border-[#1a1a1a] p-6 md:grid-cols-[0.75fr_1.25fr] md:items-center">
        <img
          src="/projects/md.png"
          alt="Meeple & Decks"
          className="aspect-square w-full border border-[#1a1a1a] object-cover"
        />
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
            {copy.sideProject}
          </p>
          <h2 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.045em] md:text-5xl">
            Meeple & Decks
          </h2>
          {copy.mdParagraphs.map((paragraph) => <p key={paragraph} className="mt-4 font-serif text-lg leading-8 text-[#1a1a1a]">{paragraph}</p>)}
          <a
            href="https://www.meepledecks.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
          >
            {copy.mdLink}
          </a>
        </div>
      </section>
    </div>
  );
}
