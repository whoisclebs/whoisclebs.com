# Cloudflare Pages Configuration

## Setup (dashboard or wrangler)

This project deploys to Cloudflare Pages. Configure via the Cloudflare dashboard:

1. Go to Cloudflare → Pages → Create a project → Connect to Git
2. Select the `whoisclebs/whoisclebs.com` repository (or the relevant fork)
3. Build settings:
   - **Framework preset:** None (plain Vite)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (set `NODE_VERSION=20` environment variable)
4. Custom domain:
   - Add `whoisclebs.com` as custom domain
   - Cloudflare will provision the SSL certificate automatically
   - The DNS already points to Cloudflare (proxy mode)
5. The `public/_redirects` and `public/_headers` files are automatically picked up by Cloudflare Pages

## Notes
- HTTP→HTTPS is handled automatically by Cloudflare Pages
- Trailing slash normalization is handled by CF Pages static serving (serves `/blog/` from `dist/blog/index.html`)
- The `_redirects` file handles the `/pt/*` → `/*` 301 redirects and `www` → root canonicalization
- No `wrangler.toml` needed for a pure static deploy; the dashboard config is sufficient

## Rollback
Cloudflare Pages keeps immutable deployment history with one-click rollback.