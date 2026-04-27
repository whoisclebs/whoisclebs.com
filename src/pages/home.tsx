import { Link } from "react-router";
import { PostCard } from "@/components/blog/post-card";
import { OpenSourceSection } from "@/components/home/open-source-section";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { getBalancedEditorialGridItemClass, getPublishedPosts, getResponsiveGridClass } from "@/lib/posts";
import { getPublishedTilEntries } from "@/lib/til";
import { Briefcase, Mail, MapPinned } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
        </svg>
    )
}

function LinkedinIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.36-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
        </svg>
    )
}

function YoutubeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
        </svg>
    )
}

const Home: React.FC = () => {
    const posts = getPublishedPosts().slice(0, 3)
    const tilEntries = getPublishedTilEntries().slice(0, 3)

    return (
        <div>
            <SEO />
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
                                <MapPinned size={16} />
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
                            <GithubIcon className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href="https://linkedin.com/in/whoisclebs" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <LinkedinIcon className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href="https://whoisclebs.substack.com" target="_blank" rel="noopener noreferrer" aria-label="Substack">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M4 3h16v2.8H4V3Zm0 5.2h16V11H4V8.2Zm0 5.2h16V21l-8-4.4L4 21v-7.6Z" />
                                </svg>
                            </a>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href="https://www.youtube.com/@whoisclebs" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <YoutubeIcon className="h-4 w-4" />
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
            <div className="grid border-b border-l border-[#1a1a1a] md:grid-cols-6">
                {posts.map((post, index) => (
                    <PostCard key={post.slug} post={post} className={getBalancedEditorialGridItemClass(index, posts.length)} />
                ))}
            </div>
            <OpenSourceSection />
            <section className="mt-12 bg-black px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white" aria-label="Today I Learned">TODAY I LEARNED</section>
            <div className={`grid border-b border-l border-[#1a1a1a] ${getResponsiveGridClass(tilEntries.length)}`}>
                {tilEntries.map((entry) => (
                    <article key={entry.slug} className="border-r border-t border-[#1a1a1a] bg-white p-5">
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">{entry.kicker}</p>
                        <h2 className="my-2 text-3xl font-extrabold leading-tight tracking-[-0.04em]">
                            <Link className="transition-colors hover:text-[#057dbc] hover:underline hover:underline-offset-4" to={`/til/${entry.slug}`}>{entry.title}</Link>
                        </h2>
                        <p className="font-serif leading-7 text-[#1a1a1a]">{entry.excerpt}</p>
                    </article>
                ))}
            </div>
        </div>
    )
}

export default Home;
