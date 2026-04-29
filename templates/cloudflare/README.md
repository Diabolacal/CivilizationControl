# Cloudflare Pages + Workers Template

This folder contains example configuration files for deploying a project with Cloudflare Pages and Workers.

Use project-local `npx wrangler` when available. Treat this file as generic template guidance, then apply your repo-specific deploy rules on top.

## Quick Start

1. **Copy template files** to your project root or frontend directory:
   ```bash
   cp templates/cloudflare/wrangler.example.jsonc my-app/wrangler.jsonc
   cp templates/cloudflare/env.example my-app/.env.example
   ```

2. **Replace placeholders** in `wrangler.jsonc`:
   - `{{PROJECT_NAME}}` → your Cloudflare Pages project name
   - `{{KV_NAMESPACE_ID}}` → your KV namespace ID (from `wrangler kv namespace create`)
   - `{{COMPATIBILITY_DATE}}` → today's date (e.g., `2026-02-14`)
   - Remove any binding sections you don't need (R2, Durable Objects, etc.)

3. **Set runtime secrets** (never commit these):
   ```bash
   npx wrangler pages secret put SERVICE_API_KEY --project-name my-project
   ```
   Enter secret values only through the interactive prompt or Cloudflare dashboard. Do not put secret values in tracked files, terminal transcripts, screenshots, or chat.

4. **Deploy**:
   ```bash
   # Preview deploy (feature branches)
   npm run build
   npx wrangler pages deploy dist --project-name my-project --branch feature/my-branch

   # Production deploy (use your configured production branch)
   npm run build
   npx wrangler pages deploy dist --project-name my-project --branch main
   ```

## Key Concepts

### Pages vs Workers
- **Cloudflare Pages**: Static site hosting with automatic builds (or manual CLI deploys)
- **Workers**: Serverless functions for API routes, middleware, etc.
- **Pages Functions / _worker.js**: Combine static hosting with Worker logic

### Preview Deployments
- Feature branches create isolated preview URLs (e.g., `https://abc123.my-project.pages.dev`)
- Preview URLs get fresh cache entries — always test on these, not alias URLs
- Alias URLs (e.g., `https://feature-branch.my-project.pages.dev`) may have stale Fetch API cache

### Manual vs Automated Deploys
- Projects created via CLI (`wrangler pages project create`) do NOT auto-deploy on `git push`
- Projects linked to GitHub auto-deploy on push to configured branches
- When using CLI-created projects: **you must run `wrangler pages deploy` manually after each push**

### Public build vars vs secrets
- `VITE_*` and other frontend build variables are browser-visible configuration.
- Keep public build vars separate from runtime secrets and local CLI credentials.
- Put local CLI auth such as `CF_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` only in untracked local env files or shell state.
- Put runtime secrets in Wrangler or Cloudflare secret storage, never in frontend code or `VITE_*` variables.

### KV Namespaces
```bash
# Create a namespace
npx wrangler kv namespace create MY_NAMESPACE

# List keys
npx wrangler kv key list --namespace-id <id>

# Read/write
npx wrangler kv key get <key> --namespace-id <id>
npx wrangler kv key put <key> <value> --namespace-id <id>
```

### Secrets Management
```bash
# Set a Pages project secret
npx wrangler pages secret put WORKER_SERVICE_TOKEN --project-name my-project
```

As of 2026-04-29, Cloudflare's official `wrangler pages secret put` reference documents a project-level command with `--project-name`; it does not document a `--branch` flag for this command. Treat Pages deploy routing as branch-driven and secret storage as project or environment driven.

## Common Wrangler Commands

```bash
# Authentication
npx wrangler login
npx wrangler whoami

# Deployments
npx wrangler pages deployment list --project-name my-project
npx wrangler pages deploy dist --project-name my-project --branch <branch>

# KV inspection
npx wrangler kv namespace list
npx wrangler kv key list --namespace-id <id>
npx wrangler kv key get <key> --namespace-id <id>

# Version check
npx wrangler --version
```

## Related Files
- `wrangler.example.jsonc` — Annotated Wrangler configuration template
- `env.example` — Local CLI credentials and placeholder examples only; do not treat it as a frontend secret store
- See project `AGENTS.md` and `.github/copilot-instructions.md` for deployment protocols
