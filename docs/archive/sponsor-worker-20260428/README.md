# Sponsor Worker Archive — 2026-04-28

This folder contains the historical planning, readiness, discovery, cutover, validation, and diagnostic evidence for the CivilizationControl sponsor-worker migration and production cutover completed on 2026-04-27 and 2026-04-28.

Current source of truth:

- `docs/operations/sponsor-worker-runbook.md`

Current code and config locations:

- `workers/sponsor-service/`
- `config/chain/stillness.ts`
- `config/sponsorship/civilizationControlPolicy.ts`
- `scripts/validate-sponsor-policy.mjs`

Current runtime truth:

- production now uses `civilizationcontrol-sponsor`
- the custom-domain CORS fix is complete for `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com`
- `https://civilizationcontrol.pages.dev` remains allowed
- preview hosts remain allowed via `.civilizationcontrol.pages.dev`
- the old `flappy-frontier-sponsor` Worker remains deployed as rollback during soak until explicitly retired in a separate task

Archive-use rule:

- these documents are historical evidence and planning records
- do not use them as the active operating procedure unless a current runbook explicitly points back to them
- future operational edits should start from `docs/operations/sponsor-worker-runbook.md` and the current runtime/config files, not from these archived reports