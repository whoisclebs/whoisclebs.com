import { Badge } from "@/components/ui/badge";
import { getResponsiveGridClass } from "@/lib/posts";
import { ExternalLink } from "lucide-react";

const booksData = [
  {
    title: "Código Limpo: Habilidades Práticas do Agile Software",
    author: "Robert C. Martin",
    image: "https://m.media-amazon.com/images/I/71dH97FwGbL._SY385_.jpg",
    amazonLink: "https://amzn.to/43x7SAj",
  },
  {
    title: "Roube como um artista: 10 dicas sobre criatividade",
    author: "Austin Kleon",
    image: "https://m.media-amazon.com/images/I/51lI9is-gnL._SY342_.jpg",
    amazonLink: "https://amzn.to/3R1eQ9f",
  },
];

export default function Books() {
  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          LEITURAS
        </p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
          Biblioteca de engenharia
        </h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          Livros que recomendo para desenvolvedores que querem melhorar código,
          criatividade e repertório técnico.
        </p>
        <p className="mt-5 max-w-[720px] border-l-2 border-[#1a1a1a] pl-4 font-mono text-xs uppercase leading-5 tracking-[0.08em] text-[#757575]">
          Nota: Links afiliados Amazon. Ao comprar por esses links, você ajuda a
          manter artigos, código aberto e novos conteúdos.
        </p>
      </section>

      <section
        className="mt-8 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white"
        aria-label="Recomendações"
      >
        RECOMENDAÇÕES
      </section>

      <div
        className={`grid border-b border-l border-[#1a1a1a] ${getResponsiveGridClass(booksData.length)}`}
        data-testid="books-grid"
      >
        {booksData.map((book) => (
          <article
            key={book.title}
            className="border-r border-t border-[#1a1a1a] bg-white p-5"
          >
            <a
              href={book.amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
                  LIVRO
                </p>
                <Badge className="flex items-center gap-1 rounded-none border border-[#1a1a1a] bg-white font-mono text-[10px] uppercase tracking-[0.08em] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white">
                  <ExternalLink size={12} />
                  Amazon
                </Badge>
              </div>
              <img
                src={book.image || "https://placehold.co/400x400"}
                alt={book.title}
                className="mb-5 h-72 w-full object-contain grayscale transition-[filter] duration-150 group-hover:grayscale-0"
              />
              <h2 className="mb-2 text-3xl font-extrabold leading-tight tracking-[-0.04em] transition-colors group-hover:text-[#057dbc] group-hover:underline group-hover:underline-offset-4">
                {book.title}
              </h2>
              <p className="font-serif text-lg text-[#1a1a1a]">{book.author}</p>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
