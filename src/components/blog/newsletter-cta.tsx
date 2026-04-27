const substackEmbedUrl = 'https://whoisclebs.substack.com/embed?utm_campaign=pub&utm_medium=web'

export function NewsletterCta() {
  return (
    <section className="mt-12 border-2 border-[#1a1a1a] bg-white p-6" aria-labelledby="newsletter-title">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">NEWSLETTER</p>
      <h2 id="newsletter-title" className="mt-2 text-3xl font-extrabold leading-none tracking-[-0.045em] md:text-5xl">Receba notas de engenharia</h2>
      <p className="mt-3 max-w-2xl font-serif leading-7 text-[#1a1a1a]">
        Uma seleção curta sobre arquitetura, frontend, operação e decisões técnicas que sobrevivem ao mundo real.
      </p>
      <iframe
        title="Inscrição na Newsletter do Clebs pelo Substack"
        src={substackEmbedUrl}
        className="mt-5 h-[250px] w-full overflow-hidden border-0 bg-white md:h-[220px]"
        loading="lazy"
        scrolling="no"
      />
      <a
        href="https://whoisclebs.substack.com/?utm_campaign=pub&utm_medium=web"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.095em] text-[#057dbc] underline underline-offset-4"
      >
        Abrir newsletter no Substack
      </a>
    </section>
  )
}
