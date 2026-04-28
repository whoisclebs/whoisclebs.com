import { SEO } from '@/components/seo'
import { useI18n, type Locale } from '@/lib/i18n'

const termsCopy: Record<Locale, {
  title: string
  description: string
  updated: string
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>
}> = {
  'pt-BR': {
    title: 'Termos de Uso',
    description: 'Regras de uso do whoisclebs.com, incluindo conteúdo editorial, links externos, comentários, newsletter e materiais publicados.',
    updated: 'Última atualização: 27 de abril de 2026',
    sections: [
      { title: 'Aceitação', paragraphs: ['Ao acessar o whoisclebs.com, você concorda com estes termos. Se não concordar, não utilize o site. Estes termos podem ser atualizados periodicamente.'] },
      { title: 'Natureza do conteúdo', paragraphs: ['O conteúdo publicado é editorial, educacional e opinativo. Ele não constitui consultoria jurídica, financeira, de segurança, de investimento ou recomendação profissional específica para o seu contexto. Use as informações com critério.'] },
      { title: 'Propriedade intelectual', paragraphs: ['Textos, imagens autorais, código, templates, workbooks e demais materiais publicados pertencem ao autor, salvo indicação em contrário. Você pode compartilhar links para o conteúdo. Reprodução integral, redistribuição comercial ou uso de materiais pagos exige autorização ou licença específica.'] },
      { title: 'Código e exemplos técnicos', paragraphs: ['Exemplos de código são fornecidos como referência educacional, sem garantia de funcionamento, adequação, segurança ou compatibilidade com ambientes específicos. Você é responsável por revisar, testar e adaptar qualquer trecho antes de usar em produção.'] },
      { title: 'Comentários e comunidade', paragraphs: ['Comentários podem ser feitos por integrações externas, como Giscus/GitHub. Ao comentar, mantenha respeito, evite spam, não publique dados sensíveis e não viole direitos de terceiros. Comentários abusivos podem ser ocultados ou removidos.'] },
      { title: 'Links externos e afiliados', paragraphs: ['O site pode conter links externos, links afiliados, embeds e referências a serviços de terceiros. Não sou responsável pelo conteúdo, disponibilidade, segurança ou políticas desses serviços. Links afiliados podem gerar comissão sem custo adicional para você.'] },
      { title: 'Newsletter e contato', paragraphs: ['Ao assinar newsletter ou entrar em contato, você autoriza o tratamento dos dados necessários para responder ou enviar comunicações solicitadas. Você pode cancelar a inscrição conforme os mecanismos do provedor usado.'] },
      { title: 'Limitação de responsabilidade', paragraphs: ['O site é fornecido no estado em que se encontra. Na máxima extensão permitida pela lei, não há garantia de disponibilidade contínua, ausência de erros ou adequação do conteúdo a uma finalidade específica.'] },
      { title: 'Contato', paragraphs: ['Para dúvidas sobre estes termos, envie e-mail para hello@whoisclebs.com.'] },
    ],
  },
  en: {
    title: 'Terms of Use',
    description: 'Rules for using whoisclebs.com, including editorial content, external links, comments, newsletter, and published materials.',
    updated: 'Last updated: April 27, 2026',
    sections: [
      { title: 'Acceptance', paragraphs: ['By accessing whoisclebs.com, you agree to these terms. If you do not agree, do not use the site. These terms may be updated periodically.'] },
      { title: 'Nature of the content', paragraphs: ['Published content is editorial, educational, and opinionated. It is not legal, financial, security, investment, or professional advice tailored to your specific context. Use the information with judgment.'] },
      { title: 'Intellectual property', paragraphs: ['Texts, authored images, code, templates, workbooks, and other published materials belong to the author unless otherwise stated. You may share links to the content. Full reproduction, commercial redistribution, or use of paid materials requires authorization or a specific license.'] },
      { title: 'Code and technical examples', paragraphs: ['Code examples are provided for educational reference, without warranty of operation, suitability, security, or compatibility with specific environments. You are responsible for reviewing, testing, and adapting any snippet before production use.'] },
      { title: 'Comments and community', paragraphs: ['Comments may be handled by external integrations, such as Giscus/GitHub. When commenting, be respectful, avoid spam, do not publish sensitive data, and do not violate third-party rights. Abusive comments may be hidden or removed.'] },
      { title: 'External and affiliate links', paragraphs: ['The site may contain external links, affiliate links, embeds, and references to third-party services. I am not responsible for the content, availability, security, or policies of those services. Affiliate links may generate commission at no additional cost to you.'] },
      { title: 'Newsletter and contact', paragraphs: ['By subscribing to the newsletter or contacting me, you authorize processing the data necessary to respond or send requested communications. You may unsubscribe through the provider mechanisms.'] },
      { title: 'Limitation of liability', paragraphs: ['The site is provided as is. To the maximum extent permitted by law, there is no guarantee of continuous availability, absence of errors, or suitability of the content for a particular purpose.'] },
      { title: 'Contact', paragraphs: ['For questions about these terms, email hello@whoisclebs.com.'] },
    ],
  },
}

export default function TermsOfUse() {
  const { locale } = useI18n()
  const copy = termsCopy[locale]

  return (
    <article className="article-container mx-auto max-w-[760px]">
      <SEO title={copy.title} description={copy.description} path="/terms-of-use" />
      <header className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">LEGAL</p>
        <h1 className="my-3 text-5xl font-extrabold leading-none tracking-[-0.055em] md:text-7xl">{copy.title}</h1>
        <p className="font-mono text-xs uppercase tracking-[0.095em] text-[#757575]">{copy.updated}</p>
      </header>
      <div className="py-8 font-serif text-lg leading-8 text-[#1a1a1a]">
        {copy.sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="mb-4 font-sans text-3xl font-extrabold leading-tight tracking-[-0.035em]">{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-4">{paragraph}</p>)}
            {section.bullets && <ul className="list-disc pl-6">{section.bullets.map((bullet) => <li key={bullet} className="mb-2">{bullet}</li>)}</ul>}
          </section>
        ))}
      </div>
    </article>
  )
}
