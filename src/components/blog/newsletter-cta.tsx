import { useState } from 'react'

export function NewsletterCta() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section className="mt-12 border-2 border-[#1a1a1a] bg-white p-6" aria-labelledby="newsletter-title">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">NEWSLETTER</p>
      <h2 id="newsletter-title" className="mt-2 text-3xl font-extrabold leading-none tracking-[-0.045em] md:text-5xl">Receba notas de engenharia</h2>
      <p className="mt-3 max-w-2xl font-serif leading-7 text-[#1a1a1a]">
        Uma seleção curta sobre arquitetura, frontend, operação e decisões técnicas que sobrevivem ao mundo real.
      </p>
      <form
        className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
        }}
      >
        <label htmlFor="newsletter-email" className="sr-only">Email</label>
        <input id="newsletter-email" type="email" placeholder="voce@exemplo.com" className="min-h-12 border-2 border-[#1a1a1a] bg-white px-4 text-base outline-none md:border-r-0" />
        <button type="submit" className="min-h-12 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]">Inscrever</button>
      </form>
      {submitted && <p className="mt-3 font-mono text-xs uppercase tracking-[0.08em] text-[#757575]">Inscrição local registrada. Integração da newsletter em breve.</p>}
    </section>
  )
}
