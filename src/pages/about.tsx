import { useState } from "react";
import { credlyBadges } from "@/content/credly-badges";
import { useI18n, type Locale } from "@/lib/i18n";

const BADGES_PER_PAGE = 6;

const aboutCopy: Record<Locale, {
  kicker: string
  title: string
  intro: string
  journey: string
  timeline: Array<{ label: string; title: string; text: string }>
  paragraphs: string[]
  dndAlt: string
  badgesText: string
  credential: string
  badgesPagination: string
  pageStatus: (current: number, total: number) => string
  previous: string
  next: string
  sideProject: string
  mdParagraphs: string[]
  mdLink: string
}> = {
  'pt-BR': {
    kicker: 'SOBRE',
    title: 'Quem é Clebson?',
    intro: 'Eu criei e quebrei coisas na internet por mais de 10 anos: blogs, jogos, artigos, comunidades, produtos e startups. Hoje transformo esse repertório em engenharia de software para problemas reais.',
    journey: 'TRAJETÓRIA',
    timeline: [
      { label: '2012', title: 'Primeiros servidores', text: 'Meu primeiro computador abriu a porta para blogs, jogos, comunidades e uma briga honesta com PHP e Apache.' },
      { label: '10+ ANOS', title: 'Produto, web e operação', text: 'Desde então, criei e quebrei coisas na internet, colaborei com projetos e aprendi a gostar do dia dois dos sistemas.' },
      { label: 'HOJE', title: 'Engenharia aplicada', text: 'Trabalho como desenvolvedor fullstack e líder técnico, conectando frontend, backend, DevOps e decisões de arquitetura.' },
    ],
    paragraphs: [
      'Minha jornada no mundo da tecnologia começou quando ganhei meu primeiro computador. Naquela época eu queria jogar com amigos e hospedar coisas; sem perceber, comecei a aprender sobre servidores, automação e como a internet realmente funciona.',
      'Hoje continuo amando brincar com servidores, mas faço isso no dia a dia como trabalho. Atuo com aplicações web, APIs, integrações de pagamento, observabilidade e liderança técnica de times.',
      'Quando não estou imerso em código, você provavelmente vai me encontrar explorando mundos em jogos, consumindo universos fantásticos, mexendo em automações ou contribuindo com algum projeto aberto.',
    ],
    dndAlt: 'Clebson em uma aventura pixel art de RPG concluindo uma quest',
    badgesText: 'Sou uma pessoa que ama coleções, e uma dessas minhas coleções atuais são as badges no',
    credential: 'Ver credencial',
    badgesPagination: 'Paginação de badges',
    pageStatus: (current, total) => `Página ${current} de ${total}`,
    previous: 'Anterior',
    next: 'Próxima',
    sideProject: 'SIDE PROJECT',
    mdParagraphs: [
      'Meeple & Decks é uma comunidade com marketplace e catálogo para boardgames e TCGs, misturando elementos de fórum, acervo e loja.',
      'A ideia é criar um espaço para jogadores, colecionadores e comunidades conversarem sobre boardgames, TCGs, coleções, partidas, reviews, dúvidas e recomendações. Também quero incluir uma área para compra e venda de jogos de tabuleiro, cartas, acessórios e produtos relacionados ao hobby.',
      'O acervo será um registro organizado de jogos de tabuleiro e cartas, parecido com uma base de dados. Ele não precisa hospedar todo o conteúdo visual ou editorial dos jogos; o foco é manter informações estruturadas para o universo de jogos de tabuleiro e TCG.',
      'Vou fazer um build in public dele: registrar decisões, aprendizados, experimentos e bastidores enquanto o projeto evolui.',
    ],
    mdLink: 'Conhecer Meeple & Decks',
  },
  en: {
    kicker: 'ABOUT',
    title: 'Who is Clebson?',
    intro: 'I have built and broken things on the internet for more than 10 years: blogs, games, articles, communities, products, and startups. Today I turn that repertoire into software engineering for real problems.',
    journey: 'JOURNEY',
    timeline: [
      { label: '2012', title: 'First servers', text: 'My first computer opened the door to blogs, games, communities, and an honest fight with PHP and Apache.' },
      { label: '10+ YEARS', title: 'Product, web, and operations', text: 'Since then, I have built and broken things online, contributed to projects, and learned to appreciate day two of systems.' },
      { label: 'TODAY', title: 'Applied engineering', text: 'I work as a fullstack developer and technical lead, connecting frontend, backend, DevOps, and architecture decisions.' },
    ],
    paragraphs: [
      'My journey in technology started when I got my first computer. Back then I wanted to play with friends and host things; without noticing, I started learning about servers, automation, and how the internet really works.',
      'I still love playing with servers, but now I do it professionally. I work with web applications, APIs, payment integrations, observability, and technical leadership.',
      'When I am not immersed in code, you will probably find me exploring game worlds, consuming fantasy universes, tinkering with automation, or contributing to an open project.',
    ],
    dndAlt: 'Clebson in a pixel art RPG adventure completing a quest',
    badgesText: 'I love collections, and one of my current collections is badges on',
    credential: 'View credential',
    badgesPagination: 'Badge pagination',
    pageStatus: (current, total) => `Page ${current} of ${total}`,
    previous: 'Previous',
    next: 'Next',
    sideProject: 'SIDE PROJECT',
    mdParagraphs: [
      'Meeple & Decks is a community with a marketplace and catalog for board games and TCGs, mixing forum, collection, and store elements.',
      'The idea is to create a space for players, collectors, and communities to talk about board games, TCGs, collections, matches, reviews, questions, and recommendations. I also want to include an area for buying and selling board games, cards, accessories, and hobby-related products.',
      'The catalog will be an organized record of board and card games, similar to a database. It does not need to host all visual or editorial content from games; the focus is keeping structured information for the board game and TCG universe.',
      'I will build it in public: registering decisions, learnings, experiments, and behind-the-scenes notes as the project evolves.',
    ],
    mdLink: 'Visit Meeple & Decks',
  },
};

export default function About() {
  const { locale } = useI18n()
  const copy = aboutCopy[locale]
  const [badgesPage, setBadgesPage] = useState(1);
  const totalBadgePages = Math.max(1, Math.ceil(credlyBadges.length / BADGES_PER_PAGE));
  const currentBadgePage = Math.min(badgesPage, totalBadgePages);
  const visibleBadges = credlyBadges.slice(
    (currentBadgePage - 1) * BADGES_PER_PAGE,
    currentBadgePage * BADGES_PER_PAGE,
  );

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
            <span className="text-[#757575]">{copy.pageStatus(currentBadgePage, totalBadgePages)}</span>
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
