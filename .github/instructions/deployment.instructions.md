---
description: "Use when deploying CivilizationControl previews or production, editing Cloudflare deploy docs or scripts, changing Wrangler commands, validating served bundles, or recording deployment evidence."
applyTo: "README.md,docs/operations/*.md,docs/decision-log.md,templates/cloudflare/**/*.md,workers/sponsor-service/wrangler.toml,workers/sponsor-service/package.json,package.json,scripts/**/*.{js,mjs,ts,mts,ps1}"
---

# CivilizationControl Deployment Guidance

- Treat deploys and production config as sensitive. Production rollout requires explicit operator approval.
- Run frontend Pages deploys from the repo root so the correct Cloudflare bindings and project context are picked up.
- Prefer `npx wrangler` or project-local Wrangler when available.
- Feature branches deploy only to Cloudflare Pages previews and stop there unless production rollout is explicitly requested.
- Git integration still centers on `master`, but Cloudflare Pages production deploys use `--branch main`.
- Never trust stale local `.env` defaults when sponsor or shared-backend URLs matter. Use explicit public `VITE_*` overrides for preview and production deploy builds, including explicit `VITE_SPONSOR_URL`, `VITE_SHARED_BACKEND_URL`, and a blank `VITE_SPONSOR_API_KEY` unless that browser-visible header is intentionally required.
- `VITE_*` values are public browser config only. Never place secrets in frontend env values.
- Durable secrets such as `SPONSOR_PRIVATE_KEY` belong only in Wrangler or Worker secrets.
- Enter secret values only through interactive Wrangler prompts or the Cloudflare dashboard, never in chat, docs, screenshots, or checked-in files.
- Validate preview deployments against the unique preview URL first. Alias URLs can lag or serve stale bundles.
- Validate the served bundle from the deployed host, not just the local `dist/` directory.
- Minimum served-bundle checks are: expected sponsor URL present, expected shared-backend URL present when used, stale `flappy-frontier-sponsor` absent, and no browser-facing `ASSEMBLY_API_TOKEN`, `Authorization`, or `X-API-Key` behavior in the shared-backend path.
- For production verification, check both public origins when possible: `https://civilizationcontrol.com` and `https://civilizationcontrol.pages.dev`.
- Validate browser-gated shared-backend routes from a real browser origin. A raw Node-side `403` does not disprove a healthy browser path.
- Record deploy evidence in tracked docs: update the relevant `docs/operations/*.md` file and add a newest-first `docs/decision-log.md` entry.
- Do not invent missing deploy evidence. If a digest, manual smoke, or origin proof was not captured, say so plainly.