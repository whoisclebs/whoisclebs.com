import { SEO } from '@/components/seo'
import { useI18n, type Locale } from '@/lib/i18n'

const privacyCopy: Record<Locale, {
  title: string
  description: string
  updated: string
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>
}> = {
  'pt-BR': {
    title: 'Política de Privacidade',
    description: 'Como o whoisclebs.com trata dados pessoais, cookies, integrações de terceiros, comentários, newsletter e métricas.',
    updated: 'Última atualização: 27 de abril de 2026',
    sections: [
      {
        title: 'Resumo',
        paragraphs: ['O whoisclebs.com é um site pessoal e editorial mantido por Clebson A. Fonseca. A navegação principal pode acontecer sem cadastro. Alguns dados podem ser tratados quando você interage com integrações externas, assina a newsletter, comenta em posts ou entra em contato por e-mail.'],
      },
      {
        title: 'Dados que podem ser tratados',
        paragraphs: ['Dependendo de como você usa o site, podem ser tratados dados técnicos e dados fornecidos voluntariamente.'],
        bullets: ['dados técnicos de acesso, como endereço IP, user agent, páginas acessadas, data e horário;', 'dados enviados por você em mensagens de e-mail;', 'dados associados à inscrição em newsletter pelo Substack;', 'dados públicos vinculados a comentários feitos via Giscus/GitHub;', 'preferência de idioma salva localmente no navegador.'],
      },
      {
        title: 'Finalidades',
        paragraphs: ['Os dados são usados para operar o site, responder contatos, melhorar conteúdo, manter segurança, publicar comentários e entregar newsletter quando você solicitar. Não vendo dados pessoais.'],
      },
      {
        title: 'Cookies e armazenamento local',
        paragraphs: ['O site salva a preferência de idioma no localStorage do navegador. Serviços de terceiros incorporados, como Substack e Giscus, podem usar cookies próprios conforme suas respectivas políticas.'],
      },
      {
        title: 'Serviços de terceiros',
        paragraphs: ['Este site pode usar ou apontar para serviços externos, incluindo GitHub/Giscus para comentários, Substack para newsletter, Cloudflare para entrega e proteção, GitHub Pages para hospedagem estática e provedores de imagens/links externos. Cada serviço pode tratar dados segundo sua própria política.'],
      },
      {
        title: 'Base legal e direitos',
        paragraphs: ['Quando aplicável, o tratamento se apoia em consentimento, execução de solicitação feita por você, legítimo interesse de segurança/operação e cumprimento de obrigações legais. Você pode solicitar acesso, correção ou exclusão de dados diretamente relacionados ao contato com este site pelo e-mail hello@whoisclebs.com.'],
      },
      {
        title: 'Segurança',
        paragraphs: ['O site usa build estático, dependências auditadas e um canal público de reporte em /.well-known/security.txt. Nenhuma medida é perfeita, mas o objetivo é reduzir superfície desnecessária e manter um caminho claro para reportes.'],
      },
      {
        title: 'Contato',
        paragraphs: ['Para dúvidas de privacidade, envie e-mail para hello@whoisclebs.com.'],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    description: 'How whoisclebs.com handles personal data, cookies, third-party integrations, comments, newsletter, and metrics.',
    updated: 'Last updated: April 27, 2026',
    sections: [
      { title: 'Summary', paragraphs: ['whoisclebs.com is a personal and editorial website maintained by Clebson A. Fonseca. You can browse the main content without creating an account. Some data may be processed when you interact with external integrations, subscribe to the newsletter, comment on posts, or contact me by email.'] },
      { title: 'Data that may be processed', paragraphs: ['Depending on how you use the site, technical data and voluntarily provided data may be processed.'], bullets: ['technical access data, such as IP address, user agent, accessed pages, date, and time;', 'data you send by email;', 'data associated with newsletter subscription through Substack;', 'public data linked to comments through Giscus/GitHub;', 'language preference stored locally in your browser.'] },
      { title: 'Purposes', paragraphs: ['Data is used to operate the website, respond to messages, improve content, maintain security, publish comments, and deliver the newsletter when requested. I do not sell personal data.'] },
      { title: 'Cookies and local storage', paragraphs: ['The site stores language preference in browser localStorage. Embedded third-party services, such as Substack and Giscus, may use their own cookies under their own policies.'] },
      { title: 'Third-party services', paragraphs: ['This website may use or link to external services, including GitHub/Giscus for comments, Substack for newsletter, Cloudflare for delivery and protection, GitHub Pages for static hosting, and external image/link providers. Each service may process data according to its own policy.'] },
      { title: 'Legal basis and rights', paragraphs: ['Where applicable, processing is based on consent, fulfillment of a request made by you, legitimate interest in security/operations, and compliance with legal obligations. You may request access, correction, or deletion of data directly related to your contact with this site by emailing hello@whoisclebs.com.'] },
      { title: 'Security', paragraphs: ['The site uses a static build, audited dependencies, and a public reporting channel at /.well-known/security.txt. No measure is perfect, but the goal is to reduce unnecessary surface area and keep a clear reporting path.'] },
      { title: 'Contact', paragraphs: ['For privacy questions, email hello@whoisclebs.com.'] },
    ],
  },
}

export default function PrivacyPolicy() {
  const { locale } = useI18n()
  const copy = privacyCopy[locale]

  return (
    <article className="article-container mx-auto max-w-[760px]">
      <SEO title={copy.title} description={copy.description} path="/privacy-policy" />
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
