# Sponsor Service

Cloudflare Worker package for CivilizationControl gas sponsorship.

This worker accepts base64-encoded `TransactionKind` bytes from the frontend, validates the programmable transaction block against the current CivilizationControl allowlist, rebuilds the full transaction with sponsor-owned gas, and returns `{ txB64, sponsorSignature }` for dual-signature execution.

## Commands

```bash
npm install
npm test
npm exec tsc -- --noEmit -p tsconfig.json
npm run dev
```

## Secrets

Set with `wrangler secret put` only:

- `SPONSOR_PRIVATE_KEY`
- `SPONSOR_API_KEY` (optional)

Do not commit `.env`, `.dev.vars`, private keys, API tokens, or wallet material.

## Config

The deployable worker config lives in [wrangler.toml](wrangler.toml).

The committed policy source of truth for this repo lives outside the worker package in:

- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`

Use the repo-level validator to check for drift between those files, current frontend/runtime IDs, and the worker's `APP_POLICIES` string.

## Notes

- Current deployment config is CivilizationControl-only, even though the validation layer remains multi-policy capable.
- Request timestamps are supported by the worker but are currently optional so the existing frontend contract stays unchanged during this migration.
- Stillness world v2 runtime migration is out of scope here. Update worker runtime package allowlists only alongside a deliberate frontend runtime-ID change.