import { Link } from 'react-router'

const projects = [
  {
    name: 'Arquitetura para plataformas de pagamento',
    kicker: 'PAGAMENTOS',
    summary: 'Desenho de integrações, antifraude, 3DS e conciliação para fluxos de checkout com alto impacto operacional.',
    stack: 'Java · Spring Boot · Node.js · Mensageria · Observabilidade',
  },
  {
    name: 'Sistemas web para operação e produto',
    kicker: 'FRONTEND',
    summary: 'Interfaces React, Angular e Vue com contratos pequenos, componentes testáveis e foco em legibilidade de estado.',
    stack: 'React · Angular · Vue · TypeScript · Design Systems',
  },
  {
    name: 'Automação e confiabilidade de runtime',
    kicker: 'OPERAÇÃO',
    summary: 'Containers, pipelines e práticas de suporte ao dia dois para reduzir incerteza em deploys e incidentes.',
    stack: 'Docker · CI/CD · Linux · Logs · Métricas',
  },
]

export default function Portfolio() {
  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">PORTFOLIO</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
          Trabalho aplicado em software real
        </h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          Uma seleção editorial das áreas onde costumo atuar: arquitetura, frontend, integrações de pagamento e operação de sistemas.
        </p>
      </section>

      <section className="grid border-b border-l border-[#1a1a1a] md:grid-cols-3" aria-label="Áreas de atuação">
        {projects.map((project) => (
          <article key={project.name} className="border-r border-t border-[#1a1a1a] bg-white p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{project.kicker}</p>
            <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{project.name}</h2>
            <p className="mb-5 font-serif leading-7 text-[#1a1a1a]">{project.summary}</p>
            <p className="font-mono text-xs uppercase leading-5 tracking-[0.08em] text-[#757575]">{project.stack}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-8 border-2 border-[#1a1a1a] p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">DISPONIBILIDADE</p>
          <h2 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.045em]">Vamos transformar contexto em entrega?</h2>
          <p className="mt-3 max-w-2xl font-serif leading-7">
            Posso ajudar em revisão técnica, desenho de arquitetura, estratégia de frontend, integrações e liderança técnica de times.
          </p>
        </div>
        <Link
          to="/about"
          className="inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
        >
          Conheça minha história
        </Link>
      </section>
    </div>
  )
}
