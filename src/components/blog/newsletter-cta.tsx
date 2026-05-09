import { useI18n } from '@/lib/i18n'

export function NewsletterCta() {
  const { t } = useI18n()

  return (
    <section className="mt-12 border-2 border-[#1a1a1a] bg-white p-6" aria-labelledby="newsletter-title">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{t('newsletter.kicker')}</p>
      <h2 id="newsletter-title" className="mt-2 text-3xl font-extrabold leading-none tracking-[-0.045em] md:text-5xl">{t('newsletter.title')}</h2>
      <p className="mt-3 max-w-2xl font-serif leading-7 text-[#1a1a1a]">
        {t('newsletter.description')}
      </p>
      <form
        action="https://whoisclebs.substack.com/api/v1/free?nojs=true"
        method="post"
        target="_blank"
        className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        aria-label={t('newsletter.formLabel')}
      >
        <label className="sr-only" htmlFor="newsletter-email">{t('newsletter.emailLabel')}</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder={t('newsletter.emailPlaceholder')}
          className="min-h-12 border-2 border-[#1a1a1a] bg-white px-4 font-serif text-base text-[#1a1a1a] outline-none transition-colors placeholder:text-[#757575] focus:border-[#057dbc]"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 font-sans text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-[#1a1a1a]"
        >
          {t('newsletter.submit')}
        </button>
      </form>
      <a
        href="https://whoisclebs.substack.com/?utm_campaign=pub&utm_medium=web"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex font-mono text-xs uppercase tracking-[0.095em] text-[#057dbc] underline underline-offset-4"
      >
        {t('newsletter.openSubstack')}
      </a>
    </section>
  )
}
