# Requisitos do whoisclebs.com

Última atualização: 2026-04-27

## Visão

O site deve funcionar como uma plataforma editorial pessoal, bilíngue, performática e segura, com conteúdo técnico, portfolio, produtos digitais, talks, páginas legais e integrações controladas.

## Requisitos implementados

### REQ-001 — Identidade editorial e redesign visual

**Status:** Implementado

Critérios:
- estética editorial técnica;
- fundo branco, texto quase preto e azul como ação;
- bordas finas como grid/hairlines;
- metadados em mono uppercase;
- páginas principais com linguagem visual consistente.

### REQ-002 — Navegação principal responsiva

**Status:** Implementado

Critérios:
- menu desktop;
- menu mobile hamburger;
- ordem atual: Home, Sobre, Blog, TIL, Portfolio, Hobbies, Livros;
- labels com suporte i18n.

### REQ-003 — Blog em Markdown local

**Status:** Implementado

Critérios:
- posts em `src/content/posts/*.md`;
- frontmatter obrigatório;
- suporte a slug, título, kicker, data, tempo de leitura, autor, excerpt, capa e status;
- parser tolerante a LF/CRLF.

### REQ-004 — Listagem de Blog

**Status:** Implementado

Critérios:
- rota `/blog`;
- paginação com `BLOG_POSTS_PER_PAGE = 10`;
- cards editoriais responsivos;
- grid balanceado no desktop;
- controles anterior/próxima.

### REQ-005 — Detalhe de Post

**Status:** Implementado

Critérios:
- rota `/blog/:slug`;
- SEO e JSON-LD `BlogPosting`;
- autor, avatar, data e tempo de leitura;
- capa com alt text;
- renderização de parágrafos, headings, listas e blocos de código;
- newsletter e comentários Giscus.

### REQ-006 — TIL em Markdown local

**Status:** Implementado

Critérios:
- entradas em `src/content/til/*.md`;
- listagem em `/til`;
- detalhe em `/til/:slug`;
- paginação, SEO e comentários no detalhe.

### REQ-007 — RSS

**Status:** Implementado

Critérios:
- feed do blog em `/rss/blog.xml`;
- feed do TIL em `/rss/til.xml`;
- alternates no `index.html`;
- geração automática no build;
- sem conflito com rotas SPA como `/blog`.

### REQ-008 — Build e GitHub Pages

**Status:** Implementado

Critérios:
- `npm run build` sem fallback específico de GitHub Pages;
- `npm run build:github-pages` com `scripts/prepare-github-pages.mjs`;
- workflow GitHub Pages usando `npm run build:github-pages`;
- geração de `404.html` e shells para rotas apenas no build de GitHub Pages.

### REQ-009 — Performance inicial

**Status:** Implementado

Critérios:
- remover Google Fonts do caminho crítico;
- usar fontes do sistema;
- inline de CSS principal no build;
- otimização de imagens com Sharp;
- build reporta economia de imagens.

### REQ-010 — Segurança e `security.txt`

**Status:** Implementado

Critérios:
- arquivo em `/.well-known/security.txt`;
- contato por e-mail e GitHub Security Advisory;
- idiomas preferenciais `pt-BR` e `en`;
- canonical configurado.

### REQ-011 — Auditoria de dependências

**Status:** Implementado

Critérios:
- ESLint compatível com peers React;
- Vite/Vitest atualizados;
- override seguro para `flatted`;
- `npm ci`, testes e build passando.

### REQ-012 — Internacionalização

**Status:** Implementado

Critérios:
- detectar idioma do navegador na primeira visita;
- persistir escolha em `localStorage`;
- priorizar idioma salvo;
- atualizar `document.documentElement.lang`;
- UI principal PT/EN;
- posts/TIL com `locale` e fallback para PT-BR.

### REQ-013 — Páginas estáticas principais

**Status:** Implementado

Critérios:
- Home;
- Sobre;
- Portfolio;
- Hobbies;
- Livros;
- identidade visual e i18n quando aplicável.

### REQ-014 — About com badges e Meeple & Decks

**Status:** Implementado

Critérios:
- timeline;
- badges Credly paginadas, seis por página;
- seção chamada “Badges”;
- Meeple & Decks no final;
- sem Ludopedia.

### REQ-015 — Books

**Status:** Implementado

Critérios:
- carousel mobile/desktop;
- setas de navegação;
- aviso de links afiliados Amazon.

### REQ-016 — Hobbies

**Status:** Implementado

Critérios:
- jogos de tabuleiro;
- Steam;
- literatura;
- coleção de boardgames com imagens locais;
- sem Ludopedia.

### REQ-017 — Open Source

**Status:** Implementado

Critérios:
- seção Open Source na Home;
- projeto `tuxedo`;
- projeto `golpher` em `https://github.com/go-golpher/golpher`;
- links de repositório e documentação;
- CTA GitHub Sponsors.

### REQ-018 — Comentários e Newsletter

**Status:** Implementado

Critérios:
- Giscus em Blog/TIL;
- tema claro fixo;
- Substack como newsletter;
- iframe sem borda;
- link externo para Substack.

### REQ-019 — Páginas legais

**Status:** Implementado

Critérios:
- `/privacy-policy`;
- `/terms-of-use`;
- links no footer;
- conteúdo PT/EN;
- rotas incluídas no preparo de GitHub Pages.

### REQ-020 — Responsividade de posts no celular

**Status:** Implementado

Critérios:
- cards com `min-width: 0` e overflow controlado;
- textos com quebra de palavras;
- imagens com `max-width: 100%`;
- code blocks com scroll horizontal;
- artigo sem overflow lateral.

## Requisitos pendentes / próximos

### REQ-101 — Página dedicada de Talks

**Status:** Pendente

Critérios:
- rota `/talks`;
- link de navegação ou seção dedicada;
- talk “Código aberto: criando nossa comunidade open source”;
- imagem `/cover/expotec.png`;
- link para `https://github.com/whoisclebs/talks/blob/main/talks/2022-Codigo-aberto-criando-nossa-comunidade-open-source.md`;
- suporte PT/EN;
- testes de renderização.

### REQ-102 — Página dedicada de Produtos

**Status:** Pendente

Critérios:
- rota `/products`;
- produtos: templates, códigos-fonte, temas, starter kits, snippets e workbooks;
- não tratar “templates” como ADR/checklist/modelo de API;
- CTA para newsletter/lista de espera;
- suporte PT/EN;
- testes.

### REQ-103 — CTAs comerciais na Home

**Status:** Pendente

Critérios:
- “Contratar consultoria”;
- “Ler artigos”;
- “Assinar newsletter”;
- links corretos;
- suporte PT/EN.

### REQ-104 — Migração para Cloudflare Pages

**Status:** Planejado

Critérios:
- deploy usando `npm run build` padrão;
- fallback SPA por `_redirects` ou configuração equivalente;
- Brotli/gzip ativos;
- cache correto para HTML, assets, RSS e `security.txt`.

### REQ-105 — Tradução do acervo legado

**Status:** Pendente

Critérios:
- posts `.en.md` para conteúdos relevantes;
- `locale: en` e `translationKey`;
- fallback PT-BR preservado;
- definir estratégia de RSS por idioma.

### REQ-106 — SEO multilíngue avançado

**Status:** Planejado

Critérios:
- estratégia de URL por idioma;
- `hreflang` quando houver par traduzido;
- canonical e Open Graph coerentes.

### REQ-107 — Métricas de performance contínuas

**Status:** Planejado

Critérios:
- Lighthouse/Playwright por rota principal;
- acompanhar LCP, CLS, FCP e TBT;
- registrar resultado em CI ou documentação.

### REQ-108 — Política de cache e headers

**Status:** Planejado

Critérios:
- cache longo para `/assets/*`;
- cache curto para HTML;
- cache moderado para RSS;
- `security.txt` sem cache excessivo.

### REQ-109 — Página/fluxo de consultoria

**Status:** Planejado

Critérios:
- proposta clara de serviços;
- CTA de contato;
- áreas de atuação;
- fluxo de lead, oferta, atendimento e entrega documentado.

### REQ-110 — Revisão jurídica formal

**Status:** Planejado

Critérios:
- revisão especializada se houver venda direta, contas de usuário, analytics invasivo ou maior tratamento de dados;
- ajustes para LGPD/GDPR conforme escopo real.

## Requisitos operacionais

### OPS-001 — Validação local

Antes de mudanças relevantes:

```bash
npm test
npm run build
```

Quando afetar GitHub Pages:

```bash
npm run build:github-pages
```

### OPS-002 — Conventional Commits

Formato esperado:

```text
feat(site): adicionar paginas legais
fix(site): ajustar rotas do blog no github pages
perf(site): otimizar build e carregamento inicial
```
