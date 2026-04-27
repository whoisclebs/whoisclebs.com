import { useState } from "react";
import { credlyBadges } from "@/content/credly-badges";

const BADGES_PER_PAGE = 6;

const timeline = [
  {
    label: "2012",
    title: "Primeiros servidores",
    text: "Meu primeiro computador abriu a porta para blogs, jogos, comunidades e uma briga honesta com PHP e Apache.",
  },
  {
    label: "10+ ANOS",
    title: "Produto, web e operação",
    text: "Desde então, criei e quebrei coisas na internet, colaborei com projetos e aprendi a gostar do dia dois dos sistemas.",
  },
  {
    label: "HOJE",
    title: "Engenharia aplicada",
    text: "Trabalho como desenvolvedor fullstack e líder técnico, conectando frontend, backend, DevOps e decisões de arquitetura.",
  },
];

export default function About() {
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
            SOBRE
          </p>
          <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
            Quem é Clebson?
          </h1>
          <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
            Eu criei e quebrei coisas na internet por mais de 10 anos: blogs,
            jogos, artigos, comunidades, produtos e startups. Hoje transformo
            esse repertório em engenharia de software para problemas reais.
          </p>
        </div>

        <img
          src="/profile/clebson.png"
          alt="Clebson A. Fonseca"
          className="aspect-square w-full border border-[#1a1a1a] object-cover grayscale"
        />
      </section>

      <section className="mt-8 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white">
        TRAJETÓRIA
      </section>

      <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-3">
        {timeline.map((item) => (
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
          <p className="mb-6 font-serif text-lg leading-8 text-[#1a1a1a]">
            Minha jornada no mundo da tecnologia começou quando ganhei meu primeiro
            computador. Naquela época eu queria jogar com amigos e hospedar coisas;
            sem perceber, comecei a aprender sobre servidores, automação e como a
            internet realmente funciona.
          </p>
          <p className="mb-6 font-serif text-lg leading-8 text-[#1a1a1a]">
            Hoje continuo amando brincar com servidores, mas faço isso no dia a dia
            como trabalho. Atuo com aplicações web, APIs, integrações de pagamento,
            observabilidade e liderança técnica de times.
          </p>
          <p className="font-serif text-lg leading-8 text-[#1a1a1a]">
            Quando não estou imerso em código, você provavelmente vai me encontrar
            explorando mundos em jogos, consumindo universos fantásticos, mexendo
            em automações ou contribuindo com algum projeto aberto.
          </p>
          <img
            src="/cover/d&d.png"
            alt="Clebson em uma aventura pixel art de RPG concluindo uma quest"
            className="mt-6 w-full border border-[#1a1a1a] object-cover"
            loading="lazy"
          />
        </div>

        <div className="border-2 border-[#1a1a1a] p-6">
          <h2 className="text-4xl font-extrabold leading-none tracking-[-0.045em]">
            Badges
          </h2>
          <p className="mt-4 font-serif leading-7 text-[#1a1a1a]">
            Sou uma pessoa que ama coleções, e uma dessas minhas coleções atuais são as badges no{' '}
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
                    Ver credencial
                  </span>
                </div>
              </a>
            ))}
          </div>
          <nav className="mb-6 flex flex-col gap-3 border-t border-[#1a1a1a] pt-4 font-mono text-xs uppercase tracking-[0.095em] md:flex-row md:items-center md:justify-between" aria-label="Paginação de badges">
            <span className="text-[#757575]">Página {currentBadgePage} de {totalBadgePages}</span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={currentBadgePage === 1}
                onClick={() => setBadgesPage((page) => Math.max(1, page - 1))}
                className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:border-[#e2e8f0] disabled:text-[#999999] disabled:hover:bg-white disabled:hover:text-[#999999]"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentBadgePage === totalBadgePages}
                onClick={() => setBadgesPage((page) => Math.min(totalBadgePages, page + 1))}
                className="border-2 border-[#1a1a1a] px-4 py-3 transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:border-[#e2e8f0] disabled:text-[#999999] disabled:hover:bg-white disabled:hover:text-[#999999]"
              >
                Próxima
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
            SIDE PROJECT
          </p>
          <h2 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.045em] md:text-5xl">
            Meeple & Decks
          </h2>
          <p className="mt-4 font-serif text-lg leading-8 text-[#1a1a1a]">
            Meeple & Decks é uma comunidade com marketplace e catálogo para boardgames e TCGs, misturando elementos de fórum, acervo e loja.
          </p>
          <p className="mt-4 font-serif text-lg leading-8 text-[#1a1a1a]">
            A ideia é criar um espaço para jogadores, colecionadores e comunidades conversarem sobre boardgames, TCGs, coleções, partidas, reviews, dúvidas e recomendações. Também quero incluir uma área para compra e venda de jogos de tabuleiro, cartas, acessórios e produtos relacionados ao hobby.
          </p>
          <p className="mt-4 font-serif text-lg leading-8 text-[#1a1a1a]">
            O acervo será um registro organizado de jogos de tabuleiro e cartas, parecido com uma base de dados. Ele não precisa hospedar todo o conteúdo visual ou editorial dos jogos; o foco é manter informações estruturadas para o universo de jogos de tabuleiro e TCG.
          </p>
          <p className="mt-4 font-serif text-lg leading-8 text-[#1a1a1a]">
            Vou fazer um build in public dele: registrar decisões, aprendizados, experimentos e bastidores enquanto o projeto evolui.
          </p>
          <a
            href="https://www.meepledecks.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
          >
            Conhecer Meeple & Decks
          </a>
        </div>
      </section>
    </div>
  );
}
