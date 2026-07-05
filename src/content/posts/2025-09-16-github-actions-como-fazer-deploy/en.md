---
slug: github-actions-como-fazer-deploy
translationKey: github-actions-como-fazer-deploy
locale: en
title: GitHub Actions: How to deploy your Vite applications
kicker: DEVOPS
date: 2025-09-16
readingTime: 5 MIN READ
author: whoisclebs
excerpt: Learn how to automatically deploy a Vite application to GitHub Pages using GitHub Actions.
cover: https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80
coverAlt: Screen showing integration and deployment flow in a development environment
published: true
---

Learn how to automatically deploy a Vite application to GitHub Pages using GitHub Actions. This step-by-step guide covers the entire process, from setup to publication.

## Prerequisites

- A React application created with Vite.
- A repository hosted on GitHub.
- Basic familiarity with GitHub Actions.

## Step 1: Configure the GitHub Actions Workflow

Create a file called `gh_pages.yml` in the `.github/workflows` directory and add the following content:

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

## Detailed workflow explanation

`on` specifies the workflow triggers: push to the `main` branch or manual execution.

`permissions` grants access to read the content, write to Pages, and emit authentication tokens.

`concurrency` prevents simultaneous runs of the same workflow.

## Job build

- `Checkout repository`: copies the repository content to the virtual machine.
- `Setup Node.js`: installs Node.js version 20.
- `Install dependencies`: installs the dependencies specified in `package-lock.json` using `npm ci`.
- `Build with Vite`: generates the project's static files with `npm run build`.
- `Setup Pages`: configures GitHub Pages to accept the deployment.
- `Upload artifact`: uploads the contents of the `dist` folder to GitHub Actions.

## Job deploy

The `Deploy to GitHub Pages` step deploys the generated files to GitHub Pages.

## Step 2: Adjust the build script for SPAs

Since React and Vite applications are SPAs, GitHub Pages may have trouble handling internal routes. To work around this, update the build script in your `package.json`:

```json
{
  "build": "tsc -b && vite build && cp dist/index.html dist/404.html"
}
```

Explanation:

- `tsc -b`: compiles the project if you are using TypeScript.
- `vite build`: generates the static files.
- `cp dist/index.html dist/404.html`: copies `index.html` to `404.html`, ensuring that GitHub Pages correctly redirects all internal SPA routes.

This is one of the fastest and simplest ways to handle internal routes on GitHub Pages.

## Step 3: Enable GitHub Pages in the repository

To allow GitHub Actions to deploy your site to GitHub Pages:

- Go to your repository on GitHub.
- Navigate to `Settings → Pages`.
- Under `Build and deployment`, select `GitHub Actions` as the source.

## Step 4: Deploy

Now, whenever you push to the `main` branch, your site will be automatically deployed to GitHub Pages. Access your site using the URL provided by GitHub Pages after deployment, such as `<your_username>.github.io`.

## Conclusion

By following these steps, your React application built with Vite will be hosted for free on GitHub Pages, with support for internal routes.
