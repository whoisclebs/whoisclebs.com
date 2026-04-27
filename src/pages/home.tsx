import { Link } from "react-router";
import { PostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { getPublishedPosts, getResponsiveGridClass } from "@/lib/posts";
import { Briefcase, Github, Linkedin, Mail, MapPin } from "lucide-react";

const Home: React.FC = () => {
    const posts = getPublishedPosts().slice(0, 3)

    return (
        <div>
            <section className="grid gap-8 border-b border-[#1a1a1a] pb-10 md:grid-cols-[0.95fr_1.25fr] md:items-start">
                <div className="border-b border-[#1a1a1a] pb-6 md:border-b-0 md:border-r md:pr-8">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">@WHOISCLEBS</p>
                    <h1 className="my-3 text-6xl font-extrabold leading-none tracking-[-0.055em] md:text-8xl">Clebson A. Fonseca</h1>
                    <p className="font-serif text-lg leading-8 text-[#1a1a1a]">
                        Engenheiro de software, líder técnico e entusiasta de código aberto fazendo o que amo.
                    </p>
                    <div className="mt-6 flex gap-4 border-t border-[#1a1a1a] pt-5">
                        <img
                            src="/profile/clebson.png"
                            alt="Clebson A. Fonseca"
                            className="size-16 shrink-0 rounded-full border border-[#1a1a1a] object-cover grayscale"
                        />
                        <div className="grid gap-3 font-mono text-xs uppercase tracking-[0.04em]">
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
                <div className="max-w-[760px] font-serif text-lg leading-8 md:pt-12 md:text-xl">
                    <p className="mb-5">
                        Sou desenvolvedor de software há mais de 6 anos, com forte experiência em e-commerce, pagamentos, autenticação 3DS e antifraude. Atuo tanto no frontend, com React, Angular e Vue, quanto no backend, com Java/Spring Boot, Node.js e Golang/Fiber.
                    </p>
                    <p className="mb-5">
                        No dia a dia, ajudo o time técnico a tomar decisões, destravar problemas e construir soluções que sejam sólidas, simples de manter e preparadas para evoluir. Tenho experiência com microsserviços, containers e automações que reduzem trabalho manual e aumentam a previsibilidade da operação.
                    </p>
                    <p className="mb-5">
                        Gosto de tecnologia aplicada com critério: sem hype desnecessário, sem complexidade gratuita e com foco em entregar algo que faça sentido para o produto, para o time e para quem vai manter o sistema depois.
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
