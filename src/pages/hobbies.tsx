import { SEO } from '@/components/seo'
import { boardGames } from '@/content/hobbies'
import { Gamepad2, Library, Users } from 'lucide-react'

export default function Hobbies() {
  return (
    <div>
      <SEO
        title="Hobbies"
        description="Jogos de tabuleiro, jogos na Steam e literatura no repertório pessoal de Clebson."
        path="/hobbies"
      />
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">HOBBIES</p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
          Fora do editor
        </h1>
        <p className="max-w-[760px] font-serif text-xl leading-8 text-[#1a1a1a]">
          Nem tudo precisa virar deploy. Fora do trabalho, eu gosto de jogos de tabuleiro, de explorar a biblioteca da Steam e de manter um pouco de literatura por perto para lembrar que repertório também se constrói longe da tela de código.
        </p>
      </section>

      <section className="grid border-b border-l border-[#1a1a1a] md:grid-cols-3">
        <article className="border-r border-t border-[#1a1a1a] p-6">
          <Users className="mb-4 size-6" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">MESA</p>
          <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">Jogos de tabuleiro</h2>
          <p className="font-serif leading-7">Gosto da combinação entre estratégia, leitura de mesa e pequenas regras que criam histórias inesperadas.</p>
        </article>
        <article className="border-r border-t border-[#1a1a1a] p-6">
          <Gamepad2 className="mb-4 size-6" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">STEAM</p>
          <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">Jogos digitais</h2>
          <p className="font-serif leading-7">
            Também jogo na Steam. Meu perfil fica em{' '}
            <a className="text-[#057dbc] underline underline-offset-4" href="https://steamcommunity.com/id/struzinov/" target="_blank" rel="noopener noreferrer">steamcommunity.com/id/struzinov</a>.
          </p>
        </article>
        <article className="border-r border-t border-[#1a1a1a] p-6">
          <Library className="mb-4 size-6" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">LITERATURA</p>
          <h2 className="my-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">Leitura</h2>
          <p className="font-serif leading-7">Um pouco de ficção, fantasia e livros que alimentam criatividade — porque nem todo aprendizado vem de documentação técnica.</p>
        </article>
      </section>

      <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label="Coleção de jogos de tabuleiro">
        COLEÇÃO DE JOGOS DE TABULEIRO
      </section>
      <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-2 xl:grid-cols-3">
        {boardGames.map((game) => (
          <article key={game.title} className="border-r border-t border-[#1a1a1a] bg-white p-5">
            <img src={game.image} alt="Placeholder para capa de jogo de tabuleiro" className="mb-5 aspect-video w-full object-cover grayscale" />
            <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#757575]">{game.players}</p>
            <h2 className="my-2 text-3xl font-extrabold leading-tight tracking-[-0.04em]">{game.title}</h2>
            <p className="font-serif leading-7 text-[#1a1a1a]">{game.note}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 max-w-[720px] border-l-2 border-[#1a1a1a] pl-4 font-mono text-xs uppercase leading-5 tracking-[0.08em] text-[#757575]">
        As capas são placeholders temporários. Vou substituir cada uma pelas imagens reais da coleção aos poucos.
      </p>
    </div>
  )
}
