import { Button } from "@/components/ui/button";
import { Briefcase, Github, Linkedin, Mail, MapPin } from "lucide-react";

const Home: React.FC = () => {
    return (
        <div className="blog-container py-12">
            <div className="flex flex-col md:flex-row gap-8 mb-12 justify-between">
                <div className="md:w-1/4">
                    <h1 className="text-2xl font-bold mb-2">Clebson A. Fonseca</h1>
                    <p className="text-gray-500 mb-2">@whoisclebs</p>
                    <p className="text-gray-700 mb-4">
                        Engenheiro de software pleno, líder técnico e entusiasta de código aberto fazendo o que amo.
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
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
                    <div className="pt-2 flex gap-2">
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
                <div className="md:w-2/4 text-justify">
                    <p className="mb-4">
                        Com mais de 6 anos de experiência em desenvolvimento de software, trabalho guiando o time tecnico e criando aplicações web e APIs que resolvem problemas reais de negócio. 
                        Com experiencia com React, Angular, Vue no frontend e Java/Spring Boot, Node.js, Golang/Fiber no backend. Tenho bastante experiência no segmento de e-commerce, desenvolvendo integrações com provedores de pagamento (Rede, Cielo, Entrepay, Getnet), integração 3DS(3D Secure) e soluções antifraude com Clearsale.
                    </p>
                    <p>
                        Minha expertise inclui arquiteturas baseadas em microsserviços, 
                        uso extensivo de containers e automação de processos críticos. 
                        Apaixonado por inovação, estou sempre acompanhando as últimas tendências tecnológicas 
                        e tento vez ou outra contribuir para a comunidade open source.
                    </p>
                    <Button variant="outline" className="mt-4">
                        <a href="https://linkedin.com/in/whoisclebs" target="_blank" rel="noopener noreferrer">
                            Converse comigo
                        </a>
                    </Button>
                    <Button variant="ghost" className="mt-4">
                        <a href="https://portfolio.whoisclebs.com" target="_blank" rel="noopener noreferrer">
                            Conheça meu trabalho
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Home;