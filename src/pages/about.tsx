const About: React.FC = () => {
    return (
        <div className="blog-container py-12 text-justify">
            <h1 className="text-2xl font-bold mb-6">Quem é Clebson?</h1>
            <p className="text-gray-700 mb-4 y">
            Eu criei e quebrei coisas na internet por mais de 10 anos, comecei com alguns blogs, jogos, artigos, comunidades e produtos/startups. Desde então, colaborei com vários projetos e pessoas legais. Se você quiser minha colaboração em um projeto, pode entrar em contato comigo no Linkedin.
            </p>
            <h2 className="text-2xl font-bold mb-6">Um pouco mais sobre mim</h2>
            <p className="text-gray-700 mb-4">
            Minha jornada no mundo da tecnologia começou em 2012 quando tive meu primeiro computador, ganhei de Natal (embora ele só tenha chegado em fevereiro, sim, foi uma coisa triste quando se tratava de compras online). Naquela época, logo aprendi a usar servidores para jogar alguns jogos com amigos, foi uma briga feia entre mim, php e apache.
            </p>
            <p className="text-gray-700 mb-4">
            Hoje, mais de 10 anos mais velho, depois de mudar de visual (na foto abaixo vocês podem ver como estou hoje), cidade e amigos, continuo amando brincar com servidores, mas agora trabalho com isso no meu dia a dia como um emprego, sou desenvolvedor fullstack e arrisco um pouco com devops.
            </p>
            <h2 className="text-2xl font-bold mb-6">Passatempos</h2>
            <p className="text-gray-700 mb-4">
                Quando não estou imerso em código, você me encontrará explorando aventuras em outros mundos (minecraft, genshin, league of legends), explorando universos fantásticos e curtindo tudo que é geek. Sou um entusiasta de tecnologia, e meu hobby é usar minha criatividade para automatizar coisas incríveis. E de vez em quando, quando estou com alguns parafusos faltando na cabeça, aproveito o pouco tempo que me resta e contribuo para o código aberto ou participo de hackathons, até tenho uma coleção de emblemas do último hacktoberfest.
            </p>
            <img src="https://holopin.me/clebsonf" alt="Holopin" className="mb-4" />
            <p className="text-gray-700 ">
                E hoje em dia coleciono também badges no <a href="https://www.credly.com/users/whoisclebs">credly</a> :P
            </p>
        </div>
    );
};
export default About;