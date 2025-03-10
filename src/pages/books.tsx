import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

const booksData = [
    {
      title: "Código Limpo: Habilidades Práticas do Agile Software",
      author: "Robert C. Martin",
      image: "https://m.media-amazon.com/images/I/71dH97FwGbL._SY385_.jpg",
      amazonLink: "https://amzn.to/43x7SAj"
    },
    {
        title: "Roube como um artista: 10 dicas sobre criatividade",
        author: "Austin Kleon",
        image: "https://m.media-amazon.com/images/I/51lI9is-gnL._SY342_.jpg",
        amazonLink: "https://amzn.to/3R1eQ9f"
    }
];

export default function Books() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">LIVROS RECOMENDADOS</h1>
        <p className="text-center text-muted-foreground mb-2 max-w-3xl mx-auto">
          Aqui estão alguns livros que recomendo para desenvolvedores. Todos os links direcionam para a Amazon, onde você
          pode comprar os livros.
        </p>
        <div className="text-center text-sm text-gray-500 mb-8 max-w-3xl mx-auto">
          <p className="text-xs">
            <span className="font-semibold">
                Nota: Links Afiliados Amazon.</span> Toda vez que você compra um livro através
                de um desses links, eu ganho uma pequena comissão. Isso me ajuda a manter minhas contribuições(artigos, codigo aberto, etc) e a produzir mais conteúdo de
                qualidade. 
            <span className="text-orange-500">Obrigado!</span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {booksData.map((book, index) => (
            <a  
                href={book.amazonLink}
                target="_blank"
                key={index}
                className="block h-full transition-transform hover:scale-[1.05]"
            >   
                <div className="border border-gray-200 rounded-lg p-6 flex flex-col relative bg-zinc-100  h-full">
                    <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 flex items-center gap-1">
                        <ExternalLink size={14} />
                        Amazon
                        </Badge>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <img
                            src={book.image || "https://placehold.co/400x400"}
                            alt={book.title}
                            className="w-full h-64 object-cover mb-4 rounded-md"
                        />
                        <h3 className="text-2xl font-semibold mb-2">{book.title}</h3>
                        <p className="text-gray-600 mb-4 text-lg">{book.author}</p>
                    </div>
                </div>
            </a>
            ))}
        </div>
    </div>
  )
}
