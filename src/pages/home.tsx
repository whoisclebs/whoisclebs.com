import { Link } from "react-router";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { getPublishedPosts, getResponsiveGridClass } from "@/lib/posts";
import { Briefcase, Github, Linkedin, Mail, MapPin } from "lucide-react";

const Home: React.FC = () => {
    const posts = getPublishedPosts().slice(0, 3)

    return (
        <div>
            <section className="grid gap-8 border-b border-[#1a1a1a] pb-10 md:grid-cols-[0.9fr_1.6fr]">
                <div className="border-b border-[#1a1a1a] pb-6 md:border-b-0 md:border-r md:pr-8">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">@WHOISCLEBS</p>
                    <h1 className="my-3 text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">Clebson A. Fonseca</h1>
                    <p className="font-serif text-lg leading-8 text-[#1a1a1a]">
                        Engenheiro de software pleno, líder técnico e entusiasta de código aberto fazendo o que amo.
                    </p>
                    <div className="mt-6 grid gap-3 font-mono text-xs uppercase tracking-[0.04em]">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>João Pessoa, PB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase size={16} />
                            <span>Tech Lead Software Engineer at <a href="https://phoebus.com.br">Phoebus</a></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={16} />
                            <span>hello [ at ] whoisclebs.com</span>
                        </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                        <Button variant="outline" size="icon" asChild>
                            <a href="https://github.com/whoisclebs" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <Github className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href="https://linkedin.com/in/whoisclebs" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <Linkedin className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
                <div className="max-w-[760px] self-end font-serif text-lg leading-8 md:text-xl">
                    <p className="mb-5">
                        Com mais de 6 anos de experiência em desenvolvimento de software, trabalho guiando o time tecnico e criando aplicações web e APIs que resolvem problemas reais de negócio. 
                        Com experiencia com React, Angular, Vue no frontend e Java/Spring Boot, Node.js, Golang/Fiber no backend. Tenho bastante experiência no segmento de e-commerce, desenvolvendo integrações com provedores de pagamento (Rede, Cielo, Entrepay, Getnet), integração 3DS(3D Secure) e soluções antifraude com Clearsale.
                    </p>
                    <p className="mb-5">
                        Minha expertise inclui arquiteturas baseadas em microsserviços, 
                        uso extensivo de containers e automação de processos críticos. 
                        Apaixonado por inovação, estou sempre acompanhando as últimas tendências tecnológicas 
                        e tento vez ou outra contribuir para a comunidade open source.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                        <a href="https://linkedin.com/in/whoisclebs" target="_blank" rel="noopener noreferrer">
                            Converse comigo
                        </a>
                    </Button>
                    <Button variant="ghost" className="mt-4" asChild>
                        <Link to="/portfolio">
                            Conheça meu trabalho
                        </Link>
                    </Button>
                </div>
            </section>

            <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label="Últimos textos">ÚLTIMOS TEXTOS</section>
            <div className={`grid border-b border-l border-[#1a1a1a] ${getResponsiveGridClass(posts.length)}`}>
                {posts.map((post) => <PostCard key={post.slug} post={post} />)}
            </div>
        </div>
    )
}

export default Home;
