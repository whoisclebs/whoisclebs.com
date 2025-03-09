import { Button } from "@/components/ui/button";
import { Briefcase, Github, Linkedin, Mail, MapPin } from "lucide-react";

const Home: React.FC = () => {
    return (
        <div className="blog-container py-12">
            <div className="flex flex-col md:flex-row gap-8 mb-12 justify-between">
                <div className="md:w-1/4">
                    <h1 className="text-2xl font-bold mb-2">Clebson A. Fonseca</h1>
                    <p className="text-gray-500 mb-4">@whoisclebs</p>
                    
                    <p className="text-gray-700 mb-6">
                        Mid-level Software Engineer, Tech Lead, and Open Source Enthusiast doing what I love.
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>João Pessoa, PB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase size={16} />
                            <span>Software Engineer at <a href="https://phoebus.com.br">Phoebus</a></span>
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
                        Com mais de 6 anos de experiência criando soluções escaláveis e de alta performance, 
                        desenvolvo aplicações que tornam processos mais eficientes e reduzem o tempo de entrega. 
                        Especialista em frontend com React, Angular e Vue, além de backend com Java e Node.js, 
                        ajudo empresas a transformar desafios em produtos robustos e otimizados.
                    </p>
                    <p>
                        Minha expertise inclui arquiteturas baseadas em microsserviços, 
                        uso extensivo de containers e automação de processos críticos. 
                        Apaixonado por inovação, estou sempre acompanhando as últimas tendências tecnológicas 
                        e contribuindo ativamente para a comunidade de desenvolvimento, 
                        garantindo que cada solução entregue tenha alto impacto e valor.
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
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-8">CURSOS</h2>
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row bg-gray-50 p-4 rounded-lg shadow">
                        <div className="md:w-1/3">
                            <img
                                src="https://placehold.co/400x400"
                                alt="Landing Page para MicroSaaS com Next.js"
                                className="w-full h-auto rounded"
                            />
                        </div>
                        <div className="md:w-2/3 md:pl-6 mt-4 md:mt-0">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="line-through text-gray-400">R$ 79,00</span>
                                <span className="text-green-600 font-semibold">R$ 00,00</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                Upload para o S3 com SpringBoot
                            </h3>
                            <p className="text-gray-700 mb-4">
                                Domine o upload de arquivos para o Amazon S3 utilizando SpringBoot e Java. Aprenda técnicas avançadas e práticas recomendadas para integrar suas aplicações com a nuvem de forma eficiente e segura. Garanta a escalabilidade e robustez dos seus projetos com este curso essencial para desenvolvedores.
                            </p>
                            <Button variant="outline">
                                <a href="#">
                                    Em breve
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;