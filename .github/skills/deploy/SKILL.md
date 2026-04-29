# Deploy Skill

Purpose: operational guidance for CivilizationControl preview and production deploy tasks.

## When to use this skill

- Deploying a feature branch to a Cloudflare Pages preview
- Performing a production deploy after merge and explicit operator approval
- Verifying the served bundle and preview or production URLs
- Troubleshooting stale deploy output, cache, or wrong public endpoint embedding

## CivilizationControl Rules

- Run Pages deploys from the repo root, not a frontend subdirectory, unless a repo doc explicitly says otherwise.
- Prefer `npx wrangler` or the project-local Wrangler when available.
- Feature branches deploy only to preview URLs.
- Production deploys require explicit user approval and remain a separate action after merge to git `master`.
- Git workflow centers on `master`, but Cloudflare Pages production deploys use `--branch main`.
- Do not trust ambient local `.env` when sponsor or shared-backend endpoints matter.
- Use explicit public deploy-time overrides when endpoint targets matter:
	- `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev`
	- `VITE_SHARED_BACKEND_URL=https://ef-map.com`
	- `VITE_SPONSOR_API_KEY=` unless explicitly required
- `VITE_*` values are browser-visible. Never place private keys, bearer tokens, database URLs, Cloudflare API tokens, or worker secrets in `VITE_*` values.
- Enter runtime secrets only through interactive Wrangler secret prompts or the Cloudflare dashboard. Never paste secret values into chat, docs, logs, screenshots, or checked-in files.
- Validate the served bundle after deploy. Check the unique preview URL before any alias when possible.
- Record deploy evidence in the relevant operations doc and add a newest-first entry to `docs/decision-log.md`.

## Standard Flow

### Preview deploys

- Build and deploy from the repo root.
- Use `wrangler pages deploy ... --branch <feature-branch>` for preview routing.
- Report the unique preview URL and verify the live served bundle from that host.

### Production deploys

- Only after merge to `master` and explicit operator approval.
- Deploy from the repo root with `--branch main`.
- Verify the served bundle and public origins after deploy.

## Validation reminders

- Confirm the expected sponsor URL is present.
- Confirm the expected shared-backend URL is present when used.
- Confirm stale `flappy-frontier-sponsor` is absent.
- Confirm browser-visible assets do not expose `ASSEMBLY_API_TOKEN`, private keys, or other runtime secrets.

## Related files

- `.github/instructions/deployment.instructions.md`
- `templates/cloudflare/README.md`
- `docs/decision-log.md`
