---
slug: hardening-performance-site-estatico-vite-cloudflare
title: Redesign, hardening e performance em um site estático com Vite
kicker: PERFORMANCE
date: 2026-04-27
readingTime: 22 MIN DE LEITURA
author: whoisclebs
excerpt: Um estudo técnico sobre rebranding editorial, conteúdo em Markdown, supply chain seguro, TypeScript 6, CSS crítico, otimização de imagens e Cloudflare em um site estático.
cover: /cover/d&d.png
coverAlt: Ilustração pixel art de uma quest concluída em um cenário fantástico
published: true
---

Um site pessoal parece pequeno até virar produto. Ele tem identidade visual, arquitetura de conteúdo, SEO, histórico de decisões, automação de build, pipeline de deploy, dependências, superfície pública e expectativas de performance. O fato de ser estático reduz muita complexidade operacional, mas não elimina engenharia. A atualização recente do whoisclebs.com foi tratada exatamente assim: como um redesign de produto com hardening de plataforma e orçamento de performance.

O objetivo não era trocar cores e publicar alguns posts. A proposta era reposicionar o site como uma publicação editorial técnica: mais próximo de uma revista de engenharia independente do que de uma landing page pessoal genérica. Isso exigiu decisões de marca, layout, conteúdo, sistema de rotas, geração de RSS, comentários, páginas secundárias, compatibilidade com GitHub Pages, segurança de supply chain e redução do caminho crítico de renderização.

Este texto documenta a arquitetura final e os motivos por trás dela. Não é um changelog. É um estudo de implementação sobre como transformar um site React/Vite em um produto editorial estático, rápido o suficiente para a borda, barato de operar e simples de manter.

## A direção de marca: editorial digital, não portfólio de template

O rebranding começou por uma decisão de posicionamento: o site precisava parecer uma publicação autoral sobre engenharia, produto, operação e código aberto. A referência visual foi uma estética editorial digital: contraste alto, composição em grid, hairlines, títulos densos, metadados em caixa alta e uma mistura controlada entre texto longo e blocos de navegação.

O sistema visual ficou apoiado em alguns princípios:

- fundo branco, texto quase preto e uma cor de ação azul;
- containers sem sombra e sem cantos arredondados;
- bordas finas como estrutura, não como decoração;
- tipografia grande para manchetes e serifada para leitura longa;
- metadados em fonte mono, caixa alta e tracking aberto;
- imagens retangulares ou quadradas sem radius, para manter o caráter editorial;
- páginas secundárias seguindo a mesma gramática visual da home.

O resultado prático é que cada página parece parte do mesmo sistema: home, blog, TIL, portfolio, livros, hobbies e about usam a mesma linguagem de grid, bordas e hierarquia. Isso é importante porque identidade visual não é um header bonito; é repetição consistente de decisões pequenas.

## Tokens mínimos em vez de design system pesado

O projeto não precisava de um design system corporativo. Precisava de regras suficientes para impedir drift visual. A abordagem foi Tailwind-first com tokens mínimos no CSS global.

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));
@plugin "tailwindcss-animate";

@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Monaco, "Courier New", monospace;
}
```

Existem duas decisões relevantes nesse trecho. A primeira é usar Tailwind como linguagem principal de composição. Isso torna os componentes mais explícitos e reduz a necessidade de CSS paralelo. A segunda é abandonar fontes externas em favor de fontes do sistema. Essa troca nasceu de performance, mas também funciona para a marca: o editorial continua forte com Georgia, system-ui e uma mono nativa.

O projeto preserva a intenção visual sem introduzir uma cadeia de download de fontes. Isso reduz latência, remove dependência de terceiros no primeiro paint e evita layout shift causado por swap de webfont.

## Arquitetura de conteúdo: Markdown local como contrato editorial

O blog e o TIL foram estruturados com arquivos Markdown locais. Essa escolha parece simples, mas define o contrato do produto. Cada texto é versionado junto com o código, revisável em pull request, incluído no build e disponível para RSS sem depender de CMS externo.

O post é um arquivo com frontmatter e corpo:

```text
---
slug: hardening-performance-site-estatico-vite-cloudflare
title: Redesign, hardening e performance em um site estático com Vite
kicker: PERFORMANCE
date: 2026-04-27
readingTime: 22 MIN DE LEITURA
author: whoisclebs
excerpt: Um estudo técnico sobre rebranding editorial, conteúdo em Markdown, supply chain seguro, TypeScript 6, CSS crítico, otimização de imagens e Cloudflare em um site estático.
cover: /cover/d&d.png
coverAlt: Ilustração pixel art de uma quest concluída em um cenário fantástico
published: true
---
```

O parser é propositalmente pequeno. Ele entende frontmatter, parágrafos, headings de segundo nível, listas e blocos de código. Isso limita o escopo e reduz dependências. Para este site, Markdown completo com plugins, AST extensível e renderização MDX seria excesso. O conteúdo precisava de previsibilidade, não de uma linguagem de programação embutida no texto.

```typescript
export function parseFrontmatter(raw: string): { metadata: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new Error("Markdown must start with frontmatter");
  }

  const [, frontmatterRaw, body] = match;
  const entries = frontmatterRaw.split(/\r?\n/).map((line) => {
    const separatorIndex = line.indexOf(":");
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    return [key, value] as const;
  });

  return { metadata: Object.fromEntries(entries), body };
}
```

O detalhe do `\r?\n` é pequeno, mas importante. Em ambiente Windows, arquivos podem chegar com CRLF. Em CI Linux, o comportamento pode ser diferente. Um parser de conteúdo não deve quebrar porque a quebra de linha mudou. Esse tipo de robustez é parte do hardening do produto editorial.

## Blog paginado e grid balanceado

O blog usa paginação com dez posts por página. A regra evita uma home infinita e mantém o carregamento previsível conforme o acervo cresce.

```typescript
export const BLOG_POSTS_PER_PAGE = 10

export function paginatePosts<T>(postsToPaginate: T[], requestedPage: number, perPage = BLOG_POSTS_PER_PAGE) {
  const totalItems = postsToPaginate.length
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages)
  const start = (currentPage - 1) * perPage
  const items = postsToPaginate.slice(start, start + perPage)

  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  }
}
```

Além de paginar, o layout tenta evitar buracos visuais. O grid editorial trabalha com seis colunas no desktop. Cards normais ocupam duas colunas. Se a última linha tiver dois posts, cada um ocupa três colunas. Se tiver um post, ele ocupa seis colunas.

```typescript
export function getBalancedEditorialGridItemClass(index: number, count: number): string {
  const remainder = count % 3

  if (remainder === 1 && index === count - 1) return 'md:col-span-6'
  if (remainder === 2 && index >= count - 2) return 'md:col-span-3'
  return 'md:col-span-2'
}
```

Essa é uma decisão visual codificada como função testável. O layout deixa de depender de ajuste manual por página e passa a responder ao volume real de conteúdo.

## RSS como parte do build

Um site editorial precisa ser distribuível fora da interface. RSS continua sendo uma solução simples, aberta e adequada para conteúdo técnico. O build gera `blog.xml` e `til.xml` a partir dos arquivos Markdown.

```js
function readEntries(directory, pathPrefix) {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseFrontmatter(readFileSync(join(directory, file), 'utf8')))
    .filter((entry) => entry.published !== 'false')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => ({ ...entry, url: `${siteUrl}/${pathPrefix}/${entry.slug}` }))
}
```

O RSS não fica versionado como artefato manual. Ele é produto do build. Isso evita inconsistência entre posts publicados e feed. Se um post muda, o feed muda junto.

## GitHub Pages e fallback de SPA

O site usa React Router em modo SPA e GitHub Pages como origem. GitHub Pages não entende rotas client-side profundas por padrão. Para evitar 404 em `/blog/slug`, o build copia o `dist/index.html` para `dist/404.html`. Dessa forma, uma rota desconhecida para o servidor ainda entrega o app, e o React Router resolve a tela correta no cliente.

Esse padrão é simples, mas precisa estar no build. Se ficar como passo manual, quebra no primeiro deploy automático.

## Security.txt como contrato público de reporte

O hardening também incluiu um `security.txt` em `public/.well-known/security.txt`. Para um site pessoal, o objetivo não é simular um programa de bug bounty. O objetivo é oferecer um caminho claro para reporte responsável.

```text
Contact: mailto:hello@whoisclebs.com
Contact: https://github.com/whoisclebs/whoisclebs.com/security/advisories/new
Expires: 2027-04-27T23:59:59Z
Preferred-Languages: pt-BR, en
Canonical: https://whoisclebs.com/.well-known/security.txt
```

Como o domínio passa pelo Cloudflare, esse arquivo pode ser servido na borda com URL canônica. Ele cobre vulnerabilidades do site público, assets, configuração de build e deploy, supply chain e integrações como comentários e newsletter.

## Supply chain: npm ci, peer dependencies e lockfile determinístico

O pipeline usa `npm ci`, não `npm install`, porque deploy precisa ser determinístico. `npm install` pode atualizar lockfile, resolver versões de forma mais permissiva e mascarar conflitos. `npm ci` instala exatamente o que está no lockfile e falha quando a árvore está inconsistente.

O conflito entre `eslint@10.2.1` e `eslint-plugin-react-hooks@5.2.0` mostrou por que isso é importante. A correção correta foi alinhar o ESLint à versão suportada pelos plugins React.

```json
{
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.5.2",
    "typescript-eslint": "^8.59.0"
  }
}
```

Não usei `--legacy-peer-deps`. Esse flag é útil como diagnóstico ou saída temporária, mas não deve virar política de CI. Se a cadeia de dependências não fecha sem relaxar peer dependencies, o projeto está carregando uma incompatibilidade real.

## TypeScript 6 sem suppress desnecessário

O TypeScript 6 passou a alertar que `baseUrl` está depreciado. A solução fácil seria manter `ignoreDeprecations: "6.0"`. A solução melhor foi remover a necessidade de `baseUrl`.

Antes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "ignoreDeprecations": "6.0"
  }
}
```

Depois:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Com `moduleResolution: "bundler"`, Vite e TypeScript 6, o alias continuou funcionando. O suppress deixou de ser necessário. Essa é uma regra saudável: só silencie warning quando existe uma incompatibilidade temporária bem entendida. Se dá para remover a causa, remova.

## Atualização do toolchain

Depois de estabilizar ESLint, a auditoria apontou vulnerabilidades em pacotes do toolchain. Mesmo que o runtime final seja estático, Vite, Rollup e dependências transitivas rodam em desenvolvimento e CI. Uma vulnerabilidade no dev server ou no bundler pode afetar preview, automações e máquinas de quem contribui.

A atualização final ficou assim:

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "vite": "^8.0.10",
    "vitest": "^4.1.5"
  },
  "overrides": {
    "flatted": "3.4.2"
  }
}
```

A troca de `@vitejs/plugin-react-swc` para `@vitejs/plugin-react` também removeu um warning do Vite moderno. Como o projeto não usa plugins específicos do SWC, a versão padrão do plugin React é suficiente e acompanha melhor a recomendação atual do ecossistema Vite.

## Requests críticos e LCP

O Lighthouse mostrava uma cadeia crítica típica de sites com webfonts:

```text
Initial Navigation
https://whoisclebs.com
/assets/index-*.css
/css2?family=... fonts.googleapis.com
/*.woff2 fonts.gstatic.com
/assets/index-*.js
```

O problema não era só tamanho. Era encadeamento. O navegador precisava baixar o HTML, descobrir o CSS, baixar o CSS, descobrir o CSS do Google Fonts, baixar esse CSS e então baixar fontes WOFF2. Cada etapa adiciona latência antes da renderização final do texto.

A solução foi remover a dependência externa de fonte e usar stacks nativas. Isso corta a cadeia `fonts.googleapis.com` e `fonts.gstatic.com` inteira. Em um site editorial, texto é conteúdo primário. Texto não deve depender de um terceiro para aparecer rápido.

```css
@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Monaco, "Courier New", monospace;
}
```

Essa mudança preserva a intenção editorial: sans forte para UI e títulos, serif para leitura longa e mono para metadados. A diferença é que agora tudo isso vem do sistema operacional.

## CSS crítico inline

O CSS gerado pelo Tailwind para o site fica em torno de 30 KiB bruto e 6,5 KiB gzip. Como o CSS é pequeno e compartilhado por todas as páginas, inlinear o CSS no `index.html` reduz um request bloqueante no primeiro carregamento.

O script roda depois do `vite build`, encontra o link do CSS em `dist/index.html`, lê o arquivo e substitui o link por uma tag `style`.

```js
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const distDir = 'dist'
const htmlPath = join(distDir, 'index.html')
const stylesheetPattern = /<link rel="stylesheet" crossorigin href="(?<href>\/assets\/[^".]+\.css)">/

const html = await readFile(htmlPath, 'utf8')
const match = html.match(stylesheetPattern)

if (!match?.groups?.href) {
  console.warn('Skipping CSS inlining: stylesheet link not found')
} else {
  const cssPath = join(distDir, match.groups.href.replace(/^\//, ''))
  const css = await readFile(cssPath, 'utf8')
  const inlinedHtml = html.replace(match[0], `<style>${css}</style>`)
  await writeFile(htmlPath, inlinedHtml)
  console.log(`Inlined ${match.groups.href} into index.html`)
}
```

Essa técnica não é universal. Se o CSS crescer muito, o HTML passa a carregar peso demais em toda navegação. Aqui a troca é favorável porque o bundle CSS é pequeno, estável e necessário para pintar a primeira tela.

## Otimização de imagens no build

As imagens ficam em `public/`, então o Vite as copia para `dist` sem transformação. Isso é simples, mas não reduz peso. Para não depender de otimização manual antes de cada commit, o build passou a rodar um script com Sharp.

O script percorre `dist`, encontra imagens `jpg`, `jpeg`, `png` e `webp`, redimensiona imagens acima de 1800px e recomprime com parâmetros conservadores.

```js
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

async function optimizeImage(filePath) {
  const extension = extname(filePath).toLowerCase()
  const original = await readFile(filePath)
  let pipeline = sharp(original, { animated: true }).rotate()
  const metadata = await pipeline.metadata()

  if ((metadata.width ?? 0) > 1800) {
    pipeline = pipeline.resize({ width: 1800, withoutEnlargement: true })
  }

  const optimized = await (extension === '.png'
    ? pipeline.png({ compressionLevel: 9, effort: 10, palette: true, quality: 86 }).toBuffer()
    : extension === '.webp'
      ? pipeline.webp({ quality: 82, effort: 6 }).toBuffer()
      : pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer())

  if (optimized.length < original.length) {
    await writeFile(filePath, optimized)
    return original.length - optimized.length
  }

  return 0
}
```

O build validado reportou quase 9 MiB economizados:

```text
Optimized 8 images, saved 8993.0 KiB
```

O ganho é grande porque imagens editoriais e ilustrações costumam entrar no repositório com dimensões ou compressão melhores para criação do que para entrega web. O build é o lugar certo para normalizar isso.

## Pipeline final

O build virou uma sequência explícita de produção estática:

```json
{
  "scripts": {
    "build": "node scripts/generate-rss.mjs && tsc -b && vite build && node scripts/inline-critical-css.mjs && node scripts/optimize-images.mjs && node scripts/copy-spa-fallback.mjs"
  }
}
```

A ordem importa:

- gerar RSS antes do empacotamento, para que arquivos públicos estejam prontos;
- rodar TypeScript antes do bundle, falhando cedo em erro de tipo;
- executar Vite para gerar assets versionados;
- inlinear CSS depois que o Vite criou o HTML final;
- otimizar imagens depois que o `public` foi copiado para `dist`;
- copiar fallback SPA por último, reaproveitando o HTML já finalizado.

Esse pipeline torna a publicação repetível. Se o build passa, ele produz os artefatos esperados sem intervenção manual.

## Cloudflare como camada de entrega

Com GitHub Pages como origem e Cloudflare na frente, a configuração de borda precisa completar o trabalho do build. O Lighthouse indicou ausência de compressão em uma medição. Isso precisa ser validado no Cloudflare, porque Vite não controla headers finais do domínio em produção.

Checklist operacional:

- Brotli habilitado;
- compressão gzip ou br em HTML, JS e CSS;
- cache agressivo para `/assets/*`, porque os nomes têm hash;
- cache mais curto para HTML;
- `/.well-known/security.txt` servido sem redirect desnecessário;
- regras de Cloudflare sem bypass acidental para assets estáticos;
- headers de segurança revisados de acordo com as integrações usadas.

O build reduz peso e requests. A borda precisa garantir compressão, cache e latência baixa.

## Testes como proteção de conteúdo e layout

Adicionar conteúdo também altera comportamento. Quando o número de posts passou de dez, os testes antigos assumiam uma única página e falharam. O teste estava errado, não a paginação. A correção foi adaptar a expectativa ao contrato real: dez posts por página e total de páginas calculado pelo volume de posts.

```typescript
const expectedTotalPages = Math.ceil(posts.length / BLOG_POSTS_PER_PAGE)

expect(firstPage.items).toEqual(posts.slice(0, BLOG_POSTS_PER_PAGE))
expect(firstPage.totalPages).toBe(expectedTotalPages)
expect(firstPage.hasNextPage).toBe(expectedTotalPages > 1)
expect(secondPage.items).toEqual(posts.slice(BLOG_POSTS_PER_PAGE, BLOG_POSTS_PER_PAGE * 2))
```

Esse é um exemplo de teste que protege regra de produto, não snapshot visual frágil. O site pode ganhar mais posts sem precisar reescrever expectativas fixas.

## Tradeoffs da atualização

As principais decisões tiveram tradeoffs claros.

- Fontes do sistema reduzem controle tipográfico fino, mas removem requests críticos e dependência externa.
- CSS inline acelera primeira renderização, mas aumenta o HTML. Funciona enquanto o CSS é pequeno.
- Otimização de imagens no build aumenta tempo de build, mas reduz muito o payload entregue.
- Markdown local simplifica operação, mas exige deploy para publicar conteúdo.
- React SPA em GitHub Pages exige fallback `404.html`, mas mantém hosting simples.
- Overrides em dependência transitiva devem ser usados com cuidado, mas são aceitáveis quando a versão corrigida é compatível e auditada.
- Toolchain atualizado reduz vulnerabilidades, mas exige validar plugins, testes e build.

Engenharia boa não remove tradeoffs. Ela deixa os tradeoffs explícitos e automatiza o que não deveria depender de memória humana.

## Resultado

O resultado final é um site com posicionamento visual mais claro, arquitetura editorial versionada, RSS gerado no build, páginas consistentes, security.txt público, supply chain auditado, TypeScript 6 sem suppress desnecessário, imagens otimizadas automaticamente e menos requests críticos no primeiro carregamento.

A atualização transformou um portfólio em uma base editorial. Esse é o ponto mais importante: o redesign não foi só visual. Ele reorganizou o site para sustentar publicação contínua, manutenção previsível e entrega rápida.

No fim, performance, segurança e marca não foram tratados como fases separadas. Eles foram a mesma decisão vista por ângulos diferentes: reduzir dependência desnecessária, explicitar contratos e fazer o build carregar mais responsabilidade do que a operação manual.
