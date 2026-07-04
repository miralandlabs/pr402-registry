# pr402 Registry

Public directory for x402 on Solana — payable **Resources**, **Subscriptions**, **Sellers**, and **Oracles**.

Live site: [registry.pr402.org](https://registry.pr402.org)

## Stack

| Piece | Role |
|-------|------|
| Vite + React | SPA UI |
| `functions/api/[[path]].ts` | Cloudflare Pages Function — proxies API calls |
| `dist/` | Static build output |

**Data sources (read-only, no DB in this repo):**

| Path | Upstream |
|------|----------|
| `/api/v1/facilitator/*` | [ipay.sh](https://ipay.sh) / [preview.ipay.sh](https://preview.ipay.sh) |
| `/api/v1/marketplace/*` | [auth.ipay.sh](https://auth.ipay.sh) / [preview.auth.ipay.sh](https://preview.auth.ipay.sh) |

The UI toggle **Production / Preview** sets the `X-Registry-Network` header; the proxy picks the matching upstream.

## Local dev

```bash
npm ci
npm run dev          # http://localhost:5174 — Vite dev server + local proxy
```

Optional — test the Pages Function bundle locally:

```bash
npm run pages:dev    # build + wrangler pages dev dist
```

## Deploy to Cloudflare Pages

### One-time setup

1. [Cloudflare](https://dash.cloudflare.com) account with Pages enabled.
2. Install Wrangler: `npm install -g wrangler` (or use `npx wrangler`).
3. Log in: `wrangler login`
4. Create the Pages project (first deploy creates it if missing):

   ```bash
   npm ci
   npm run deploy
   ```

   `npm run deploy` = `npm run build` + `wrangler pages deploy dist --project-name pr402-registry`.

5. **Custom domain** (optional): Cloudflare dashboard → Pages → **pr402-registry** → Custom domains → add `registry.pr402.org`.

No runtime secrets required — the app only proxies public JSON APIs.

### Manual deploy (after every release)

```bash
git pull
npm ci
npm run deploy
```

### What gets deployed

- `dist/` — built SPA (`index.html`, assets, `_redirects` for client routing)
- `functions/` — edge proxy for `/api/v1/facilitator/*` and `/api/v1/marketplace/*`

## Auto deploy from GitHub

**Yes.** Two common options:

### A) Cloudflare Git integration (simplest)

Pages → Create project → **Connect to Git** → select `miralandlabs/pr402-registry`.

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Cloudflare builds and deploys on every push to the connected branch. Pages Functions in `functions/` are picked up automatically.

### B) GitHub Actions (same pattern as solrisk / subscription-auth)

Add repo secrets:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | API token with **Cloudflare Pages — Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from Cloudflare dashboard |

Example workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name pr402-registry
```

Unlike Vercel siblings, there is no `PROJECT_ID` — the Pages project name (`pr402-registry`) is enough.

## Verify after deploy

```bash
curl -sI https://registry.pr402.org/ | head -1
curl -s "https://registry.pr402.org/api/v1/facilitator/directory/stats" \
  -H "X-Registry-Network: production" | head -c 200
```

Open the site → **Resources** and **Subscriptions** tabs should load (Subscriptions needs subscription-auth marketplace API deployed).

## Related

- [pr402 discovery docs](https://docs.ipay.sh)
- [subscription-auth](https://github.com/miralandlabs/subscription-auth) — Subscriptions catalog API
