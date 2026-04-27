import { Link } from 'react-router'
import { useI18n, type Locale } from '@/lib/i18n'

const portfolioCopy: Record<Locale, {
  title: string
  description: string
  areasLabel: string
  availability: string
  ctaTitle: string
  ctaText: string
  ctaLink: string
  projects: Array<{ name: string; kicker: string; summary: string; stack: string }>
}> = {
  'pt-BR': {
    title: 'Trabalho aplicado em software real',
    description: 'Uma seleção editorial das áreas onde costumo atuar: arquitetura, frontend, integrações de pagamento e operação de sistemas.',
    areasLabel: 'Áreas de atuação',
    availability: 'DISPONIBILIDADE',
    ctaTitle: 'Vamos transformar contexto em entrega?',
    ctaText: 'Posso ajudar em revisão técnica, desenho de arquitetura, estratégia de frontend, integrações e liderança técnica de times.',
    ctaLink: 'Conheça minha história',
    projects: [
      { name: 'Arquitetura para plataformas de pagamento', kicker: 'PAGAMENTOS', summary: 'Desenho de integrações, antifraude, 3DS e conciliação para fluxos de checkout com alto impacto operacional.', stack: 'Java · Spring Boot · Node.js · Mensageria · Observabilidade' },
      { name: 'Sistemas web para operação e produto', kicker: 'FRONTEND', summary: 'Interfaces React, Angular e Vue com contratos pequenos, componentes testáveis e foco em legibilidade de estado.', stack: 'React · Angular · Vue · TypeScript · Design Systems' },
      { name: 'Automação e confiabilidade de runtime', kicker: 'OPERAÇÃO', summary: 'Containers, pipelines e práticas de suporte ao dia dois para reduzir incerteza em deploys e incidentes.', stack: 'Docker · CI/CD · Linux · Logs · Métricas' },
    ],
  },
  en: {
    title: 'Applied work in real software',
    description: 'An editorial selection of the areas where I usually work: architecture, frontend, payment integrations, and system operations.',
    areasLabel: 'Areas of work',
    availability: 'AVAILABILITY',
    ctaTitle: 'Shall we turn context into delivery?',
    ctaText: 'I can help with technical reviews, architecture design, frontend strategy, integrations, and technical leadership for teams.',
    ctaLink: 'Read my story',
    projects: [
      { name: 'Architecture for payment platforms', kicker: 'PAYMENTS', summary: 'Integration, anti-fraud, 3DS, and reconciliation design for checkout flows with high operational impact.', stack: 'Java · Spring Boot · Node.js · Messaging · Observability' },
      { name: 'Web systems for operations and product', kicker: 'FRONTEND', summary: 'React, Angular, and Vue interfaces with small contracts, testable components, and readable state management.', stack: 'React · Angular · Vue · TypeScript · Design Systems' },
      { name: 'Runtime automation and reliability', kicker: 'OPERATIONS', summary: 'Containers, pipelines, and day-two practices to reduce uncertainty in deployments and incidents.', stack: 'Docker · CI/CD · Linux · Logs · Metrics' },
    ],
  },
}

export default function Portfolio() {
  const { locale } = useI18n()
  const copy = portfolioCopy[locale]

  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">PORTFOLIO</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
          {copy.title}
        </h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {copy.description}
        </p>
      </section>

      <section className="grid border-b border-l border-[#1a1a1a] md:grid-cols-3" aria-label={copy.areasLabel}>
        {copy.projects.map((project) => (
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
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{copy.availability}</p>
          <h2 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.045em]">{copy.ctaTitle}</h2>
          <p className="mt-3 max-w-2xl font-serif leading-7">
            {copy.ctaText}
          </p>
        </div>
        <Link
          to="/about"
          className="inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
        >
          {copy.ctaLink}
        </Link>
      </section>
    </div>
  )
}
