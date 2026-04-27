import { SEO } from '@/components/seo'
import { boardGames } from '@/content/hobbies'
import { getResponsiveGridClass } from '@/lib/posts'
import { useI18n, type Locale } from '@/lib/i18n'
import { Gamepad2, Library, Users } from 'lucide-react'

const hobbiesCopy: Record<Locale, {
  seoDescription: string
  title: string
  description: string
  cards: Array<{ kicker: string; title: string; text: string }>
  steamPrefix: string
  collection: string
  coverAlt: string
}> = {
  'pt-BR': {
    seoDescription: 'Jogos de tabuleiro, jogos na Steam e literatura no repertório pessoal de Clebson.',
    title: 'Fora do editor',
    description: 'Nem tudo precisa virar deploy. Fora do trabalho, eu gosto de jogos de tabuleiro, de explorar a biblioteca da Steam e de manter um pouco de literatura por perto para lembrar que repertório também se constrói longe da tela de código.',
    cards: [
      { kicker: 'MESA', title: 'Jogos de tabuleiro', text: 'Gosto da combinação entre estratégia, leitura de mesa e pequenas regras que criam histórias inesperadas.' },
      { kicker: 'STEAM', title: 'Jogos digitais', text: 'Também jogo na Steam. Meu perfil fica em' },
      { kicker: 'LITERATURA', title: 'Leitura', text: 'Um pouco de ficção, fantasia e livros que alimentam criatividade — porque nem todo aprendizado vem de documentação técnica.' },
    ],
    steamPrefix: 'Também jogo na Steam. Meu perfil fica em',
    collection: 'COLEÇÃO DE JOGOS DE TABULEIRO',
    coverAlt: 'Capa do jogo',
  },
  en: {
    seoDescription: 'Board games, Steam games, and literature in Clebson’s personal repertoire.',
    title: 'Away from the editor',
    description: 'Not everything needs to become a deploy. Outside work, I like board games, exploring my Steam library, and keeping literature nearby as a reminder that repertoire is also built away from the code editor.',
    cards: [
      { kicker: 'TABLE', title: 'Board games', text: 'I like the mix of strategy, reading the table, and small rules that create unexpected stories.' },
      { kicker: 'STEAM', title: 'Digital games', text: 'I also play on Steam. My profile is at' },
      { kicker: 'LITERATURE', title: 'Reading', text: 'Some fiction, fantasy, and books that feed creativity — because not every lesson comes from technical documentation.' },
    ],
    steamPrefix: 'I also play on Steam. My profile is at',
    collection: 'BOARD GAME COLLECTION',
    coverAlt: 'Game cover for',
  },
}

export default function Hobbies() {
  const { locale } = useI18n()
  const copy = hobbiesCopy[locale]

  return (
    <div>
      <SEO
        title="Hobbies"
        description={copy.seoDescription}
        path="/hobbies"
      />
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">HOBBIES</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
          {copy.title}
        </h1>
        <p className="max-w-[760px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {copy.description}
        </p>
      </section>

      <section className="grid border-b border-l border-[#1a1a1a] md:grid-cols-3">
        <article className="border-r border-t border-[#1a1a1a] p-6">
          <Users className="mb-4 size-6" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{copy.cards[0].kicker}</p>
          <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{copy.cards[0].title}</h2>
          <p className="font-serif leading-7">{copy.cards[0].text}</p>
        </article>
        <article className="border-r border-t border-[#1a1a1a] p-6">
          <Gamepad2 className="mb-4 size-6" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{copy.cards[1].kicker}</p>
          <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{copy.cards[1].title}</h2>
          <p className="font-serif leading-7">
            {copy.steamPrefix}{' '}
            <a className="text-[#057dbc] underline underline-offset-4" href="https://steamcommunity.com/id/struzinov/" target="_blank" rel="noopener noreferrer">steamcommunity.com/id/struzinov</a>.
          </p>
        </article>
        <article className="border-r border-t border-[#1a1a1a] p-6">
          <Library className="mb-4 size-6" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{copy.cards[2].kicker}</p>
          <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{copy.cards[2].title}</h2>
          <p className="font-serif leading-7">{copy.cards[2].text}</p>
        </article>
      </section>

      <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label={copy.collection}>
        {copy.collection}
      </section>
      <div className={`grid gap-4 border border-t-0 border-[#1a1a1a] p-4 ${getResponsiveGridClass(boardGames.length)}`}>
        {boardGames.map((game) => (
          <article key={game.title} className="border border-[#1a1a1a] bg-white p-4">
            <img src={game.image} alt={`${copy.coverAlt} ${game.title}`} className="mb-5 aspect-square w-full object-cover" />
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#757575]">{game.players}</p>
            <h2 className="my-2 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{game.title}</h2>
            <p className="font-serif leading-7 text-[#1a1a1a]">{game.note}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
