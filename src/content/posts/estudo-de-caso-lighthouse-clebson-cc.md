---
slug: estudo-de-caso-lighthouse-clebson-cc
title: Estudo de caso Lighthouse no antigo clebson.cc
kicker: SEO
date: 2022-10-28
readingTime: 4 MIN DE LEITURA
author: whoisclebs
excerpt: Como trabalhei acessibilidade, melhores práticas e SEO para alcançar 100 pontos no Lighthouse no meu antigo site pessoal.
cover: https://miro.medium.com/v2/resize:fit:700/1*rnvdQgcC4I-dAP04j_C0fQ.png
coverAlt: Screenshot de auditoria Lighthouse com pontuações em verde
published: true
---

Um tempo atrás, quando ainda usava o domínio clebson.cc, eu estava trabalhando para melhorar meu branding pessoal. Um dos primeiros objetivos era melhorar o SEO da página que eu usava para falar sobre mim.

Depois de algumas iterações, consegui chegar a 100 em todas as pontuações do Lighthouse. Este texto não é exatamente um tutorial; é mais um registro do caminho que segui e dos pontos que precisei estudar para chegar lá.

## Nota sobre o domínio

O domínio citado no artigo original era clebson.cc. Hoje, meu site pessoal e blog vivem em whoisclebs.com. A intenção continua parecida: manter uma presença pública, com contexto sobre meu trabalho, meus projetos e meus textos.

## Primeiro passo: acessibilidade

O primeiro ponto, e talvez o mais difícil para mim naquele momento, foi acessibilidade.

Foi interessante revisitar alguns conceitos que eu já ensinava para meus alunos, mas agora em um uso real. Uma das perguntas que sempre aparece quando falamos de ARIA é: quando usar?

Depois dessa experiência, a resposta ficou mais clara para mim: ARIA é útil quando estamos lidando com componentes que não são semanticamente claros por padrão. Por exemplo, se você cria uma progress bar usando uma `div`, aquilo não carrega semântica suficiente sozinho. Nesse caso, atributos ARIA ajudam tecnologias assistivas a entenderem o papel daquele elemento.

Também precisei revisar textos alternativos de imagens. Esse detalhe parece simples, mas impacta diretamente a experiência de quem navega com leitor de tela e também ajuda o próprio SEO.

Foi depois desses ajustes que consegui fechar 100 em acessibilidade.

## Segundo passo: melhores práticas

Como era um site relativamente simples, a pontuação de melhores práticas já começou alta.

Ainda assim, para chegar a 100%, precisei ajustar alguns detalhes:

- ativar o header `Strict-Transport-Security`;
- configurar canonical tag;
- revisar links com `target="_blank"` para garantir `rel="noopener"`;
- remover pequenos pontos que o Lighthouse considerava inseguros ou inconsistentes.

Essas configurações não são glamourosas, mas fazem parte do acabamento de um site que pretende ser confiável.

## Terceiro passo: SEO

O terceiro passo foi o mais importante para o objetivo de aparecer melhor nos mecanismos de busca.

SEO foi também a parte mais trabalhosa. O interessante é que os passos anteriores já ajudavam indiretamente: acessibilidade, texto alternativo e estrutura semântica impactam tanto pessoas quanto mecanismos de busca.

Para melhorar a pontuação, foquei em alguns pontos:

- distribuir palavras-chave relevantes em tags importantes, como `h1`, `title` e meta description;
- configurar metatags para redes sociais com Open Graph;
- adicionar dados estruturados com JSON-LD;
- escrever uma meta description concisa;
- garantir canonical tag para evitar ambiguidade de URL.

Depois desses ajustes, finalmente veio o 100 em SEO.

## O que ficou desse processo

Esse estudo foi pequeno, mas importante. Ele me ajudou a enxergar performance, acessibilidade, SEO e boas práticas como partes do mesmo trabalho: entregar uma página mais clara, encontrável, segura e fácil de usar.

Hoje, no whoisclebs.com, muita coisa mudou em relação ao antigo clebson.cc. Mas a preocupação continua a mesma: manter uma base simples, bem estruturada e preparada para evoluir.

## Referência

- Artigo original no Medium: https://medium.com/@clebson/estudo-de-caso-no-lighthouse-para-clebson-cc-991e4c0e1918
