---
description: "Use when working on CivilizationControl shared-backend or EF-Map browser enrichment, VITE_SHARED_BACKEND_URL, the assembly summary endpoint, or docs that define this contract."
applyTo: "src/lib/**/*.{ts,tsx},src/hooks/**/*.{ts,tsx},src/types/**/*.{ts,tsx},docs/operations/*backend*.md,docs/operations/*indexer*.md,docs/llm-reference-guide.md"
---

# CivilizationControl Shared-Backend Guidance

- Read `docs/operations/shared-backend-assembly-enrichment-20260429.md` before changing EF-Map/shared-backend behavior.
- Keep direct-chain discovery authoritative for ownership, structure identity, action eligibility, and writes.
- Treat shared-backend data as additive, read-only enrichment only.
- Run enrichment only after direct-chain discovery has already produced known structures.
- Keep the v1 browser contract to the explicit assembly summary route using known decimal assembly IDs derived from on-chain discovery.
- Keep endpoint scope narrow. Do not add browser discovery endpoints by owner, tribe, wallet, inventory, or broad map scanning.
- Browser calls go to `https://ef-map.com` or the public `VITE_SHARED_BACKEND_URL` override, never raw VPS or internal hosts.
- Do not add `ASSEMBLY_API_TOKEN`, browser API keys, bearer tokens, or other private upstream secrets to CivilizationControl.
- Do not add `Authorization` or `X-API-Key` headers from the browser for the v1 assemblies endpoint.
- Fail open: missing, partial, invalid, or failed shared-backend responses must leave direct-chain data authoritative and keep the UI non-fatal.
- Shared-backend data must never drive ownership truth, auth decisions, sponsor eligibility, or write-path behavior.
- Validate positive-path access from an allowed browser origin. Raw Node-side fetches can false-fail with `403`.
- Use `VITE_SHARED_BACKEND_URL` only as a public base-URL override.