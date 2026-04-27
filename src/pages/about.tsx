import { Link } from "react-router";

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

      <section className="mx-auto mt-12 max-w-[720px]">
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
        <p className="mb-6 font-serif text-lg leading-8 text-[#1a1a1a]">
          Quando não estou imerso em código, você provavelmente vai me encontrar
          explorando mundos em jogos, consumindo universos fantásticos, mexendo
          em automações ou contribuindo com algum projeto aberto.
        </p>

        <div className="mt-10 border-2 border-[#1a1a1a] p-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
            SINAIS PÚBLICOS
          </p>
          <h2 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.045em]">
            Badges, histórico e colaboração
          </h2>
          <img src="https://holopin.me/clebsonf" alt="Holopin badges de Clebson" className="my-6 w-full" />
          <p className="font-serif leading-7 text-[#1a1a1a]">
            Também coleciono badges no{" "}
            <a
              href="https://www.credly.com/users/whoisclebs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#057dbc] underline underline-offset-4"
            >
              Credly
            </a>
            . Se você quiser colaboração em um projeto, fale comigo pelo LinkedIn
            ou veja meu trabalho no portfolio.
          </p>
          <Link
            to="/portfolio"
            className="mt-5 inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
          >
            Ver portfolio
          </Link>
        </div>
      </section>
    </div>
  );
}
