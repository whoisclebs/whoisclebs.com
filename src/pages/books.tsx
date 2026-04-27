import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useRef } from "react";
import { useI18n, type Locale } from "@/lib/i18n";

const booksCopy: Record<Locale, {
  kicker: string
  title: string
  description: string
  affiliate: string
  recommendations: string
  previous: string
  next: string
  book: string
}> = {
  'pt-BR': {
    kicker: 'LEITURAS',
    title: 'Biblioteca de engenharia',
    description: 'Livros que recomendo para desenvolvedores que querem melhorar código, criatividade e repertório técnico.',
    affiliate: 'Nota: Links afiliados Amazon. Ao comprar por esses links, você ajuda a manter artigos, código aberto e novos conteúdos.',
    recommendations: 'RECOMENDAÇÕES',
    previous: 'Livro anterior',
    next: 'Próximo livro',
    book: 'LIVRO',
  },
  en: {
    kicker: 'READING',
    title: 'Engineering library',
    description: 'Books I recommend for developers who want to improve code, creativity, and technical repertoire.',
    affiliate: 'Note: Amazon affiliate links. Buying through these links helps support articles, open source, and new content.',
    recommendations: 'RECOMMENDATIONS',
    previous: 'Previous book',
    next: 'Next book',
    book: 'BOOK',
  },
}

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
  const carouselRef = useRef<HTMLDivElement>(null);
  const { locale } = useI18n()
  const copy = booksCopy[locale]

  function scrollRecommendations(direction: "previous" | "next") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "next" ? carousel.clientWidth : -carousel.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <section className="border-b border-[#1a1a1a] py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
          {copy.kicker}
        </p>
        <h1 className="my-3 max-w-5xl text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">
          {copy.title}
        </h1>
        <p className="max-w-[720px] font-serif text-xl leading-8 text-[#1a1a1a]">
          {copy.description}
        </p>
        <p className="mt-5 max-w-[720px] border-l-2 border-[#1a1a1a] pl-4 font-mono text-xs uppercase leading-5 tracking-[0.08em] text-[#757575]">
          {copy.affiliate}
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-3 bg-black px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
        <section
          className="font-mono text-xs font-bold uppercase tracking-[0.12em]"
          aria-label={copy.recommendations}
        >
          {copy.recommendations}
        </section>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={copy.previous}
            onClick={() => scrollRecommendations("previous")}
            className="inline-flex size-10 items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={copy.next}
            onClick={() => scrollRecommendations("next")}
            className="inline-flex size-10 items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex snap-x snap-mandatory touch-pan-x cursor-grab overflow-x-auto border-b border-l border-[#1a1a1a] scroll-smooth active:cursor-grabbing"
        data-testid="books-carousel"
      >
        {booksData.map((book) => (
          <article
            key={book.title}
            className="min-w-full snap-start border-r border-t border-[#1a1a1a] bg-white p-5 md:min-w-1/2"
          >
            <a
              href={book.amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">
                  {copy.book}
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
