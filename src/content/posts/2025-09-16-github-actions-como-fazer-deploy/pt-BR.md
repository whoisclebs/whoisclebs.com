---
slug: github-actions-como-fazer-deploy
translationKey: github-actions-como-fazer-deploy
title: GitHub Actions: Como fazer deploy de suas aplicações Vite
kicker: DEVOPS
date: 2025-09-16
readingTime: 6 MIN DE LEITURA
author: whoisclebs
excerpt: Aprenda como implantar automaticamente uma aplicação criada com Vite no GitHub Pages usando GitHub Actions.
cover: https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80
coverAlt: Tela com fluxo de integração e deploy em ambiente de desenvolvimento
published: true
locale: pt-BR
---


Aprenda como implantar automaticamente uma aplicação criada com Vite no GitHub Pages usando GitHub Actions. Este guia passo a passo cobre todo o processo, desde a configuração até a publicação.

## Pré-requisitos

- Uma aplicação React criada com Vite.
- Um repositório hospedado no GitHub.
- Familiaridade básica com GitHub Actions.

## Passo 1: Configurar o Workflow do GitHub Actions

Crie um arquivo chamado `gh_pages.yml` no diretório `.github/workflows` e adicione o seguinte conteúdo:

```yaml
name: Deploy React Vite App to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          submodules: true
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build with Vite
        run: npm run build

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v1

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-20.04
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Explicação detalhada do workflow

`on` especifica os gatilhos do workflow: push na branch `main` ou execução manual.

`permissions` concede acesso para ler o conteúdo, escrever no Pages e emitir tokens de autenticação.

`concurrency` impede execuções simultâneas do mesmo workflow.

## Job build

- `Checkout repository`: copia o conteúdo do repositório para a máquina virtual.
- `Setup Node.js`: instala a versão 20 do Node.js.
- `Install dependencies`: instala as dependências especificadas no `package-lock.json` usando `npm ci`.
- `Build with Vite`: gera os arquivos estáticos do projeto com `npm run build`.
- `Setup Pages`: configura o GitHub Pages para aceitar a implantação.
- `Upload artifact`: faz upload do conteúdo da pasta `dist` para o GitHub Actions.

## Job deploy

O passo `Deploy to GitHub Pages` implanta os arquivos gerados no GitHub Pages.

## Passo 2: Ajustar o script de build para SPAs

Como aplicações criadas com React e Vite são SPAs, o GitHub Pages pode ter dificuldades em lidar com rotas internas. Para contornar isso, atualize o script de build no seu `package.json`:

```json
{
  "build": "tsc -b && vite build && cp dist/index.html dist/404.html"
}
```

Explicação:

- `tsc -b`: compila o projeto, se você estiver usando TypeScript.
- `vite build`: gera os arquivos estáticos.
- `cp dist/index.html dist/404.html`: copia o `index.html` para `404.html`, garantindo que o GitHub Pages redirecione corretamente todas as rotas internas da sua SPA.

Essa é uma das formas mais rápidas e simples de lidar com rotas internas no GitHub Pages.

## Passo 3: Ativar o GitHub Pages no repositório

Para permitir que o GitHub Actions implante seu site no GitHub Pages:

- Acesse seu repositório no GitHub.
- Vá até `Settings → Pages`.
- Em `Build and deployment`, selecione `GitHub Actions` como a fonte.

## Passo 4: Implantar

Agora, sempre que você fizer push para a branch `main`, seu site será implantado automaticamente no GitHub Pages. Acesse seu site usando a URL fornecida pelo GitHub Pages após a implantação, como `<seu_usuario>.github.io`.

## Conclusão

Seguindo esses passos, sua aplicação React criada com Vite estará hospedada gratuitamente no GitHub Pages, com suporte para rotas internas.
