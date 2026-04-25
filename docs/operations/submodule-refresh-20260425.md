# Submodule Refresh Audit — 2026-04-25

Date: 2026-04-25
Branch: `chore/submodule-refresh-20260425`
Scope: vendor submodule pointer refresh, upstream impact audit, documentation updates, and baseline validation. No commits were made inside submodules.

## Summary

Three vendor pointers were refreshed: `world-contracts`, `evevault`, and `builder-documentation`. `builder-scaffold` was already at remote `main` and remains unchanged.

The refresh is source-compatible for CivilizationControl's Move package: `world-contracts` did not change Move source files under the modules used by `contracts/civilization_control`. The main risk is operational: upstream `world-contracts` now records Stillness world v2 metadata, with `published-at` moving from `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` to `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` while `original-id` remains `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`.

This branch does not migrate CivilizationControl runtime calls to the new world v2 package. That migration should be a separate high-risk runtime-ID task because this codebase already depends on the distinction between runtime package IDs and type-origin package IDs.

## Submodule SHA Table

| Submodule | Old SHA | New SHA | Commits | Impact | Validation required |
|---|---:|---:|---:|---|---|
| `vendor/world-contracts` | `f761a7f61abc770f0ef802d1fba626ed6c48a216` | `db577cf9fd85c2310f6449a1cf42a4a84ba9d20b` | 4 | High operational/runtime-ID risk; low source/API risk | Move build/test, frontend build, future live Stillness world-v2 smoke |
| `vendor/evevault` | `3a6e63c64ddeca210fce5b24e74b8db2e64992f0` | `266631d6261fcf93d940a25bd84f951a5a31112d` | 17 | Medium-high wallet validation risk | Frontend build, future browser/Eve Vault smoke |
| `vendor/builder-documentation` | `1f7317013ed13e929ba682324d0394f03ce54742` | `21a95834281e32d71e0a0c2e69e8fde194436d4e` | 2 | Low docs reference risk | Docs review only |
| `vendor/builder-scaffold` | `ebc321a760e3701954e3d445fa92fe881267ea94` | `ebc321a760e3701954e3d445fa92fe881267ea94` | 0 | None | None from upstream delta |

## Notable Upstream Changes

### `vendor/world-contracts`

Commits:
- `db577cf` — automated draft-PR documentation update flow.
- `02b75e3` — upgraded Stillness package metadata.
- `84246b6` — snapshot image tag fix.
- `0a1a7c1` — Docker snapshot bake workflow fix.

Changed files were documentation/workflow/Docker-oriented plus `contracts/world/Published.toml`. No source changes were found under `contracts/world/sources/`, `contracts/assets/sources/`, or `contracts/extension_examples/` in the audited range.

Stillness package metadata changed:

| Field | Before | After |
|---|---:|---:|
| `published-at` | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` |
| `original-id` | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` |
| `version` | `1` | `2` |
| `toolchain-version` | `1.67.1` | `1.69.1` |

CivilizationControl impact:
- Move source signatures used by `gate_control`, `trade_post`, `posture`, and `turret` appear unchanged.
- `src/constants.ts` still uses `0x28b497...` as `WORLD_PACKAGE_ID`. This branch intentionally does not change it.
- A future world-v2 runtime migration must split world runtime package IDs from original/type-origin IDs for event parsing, dynamic-field keys, and `MoveModule` queries.
- Sponsor-worker allowlists must be verified with the same runtime package target used by the frontend.

### `vendor/evevault`

The 17-commit range materially changes wallet behavior and internal APIs. Notable themes:
- `SuiWallet` account/current-chain behavior changed, including current-chain initialization before dApp connect.
- Sponsored transaction handling now derives API context from JWT-backed auth state and targets `/transactions/sponsored/...` endpoints.
- Transaction parsing accepts bytestring/base64/object forms through `parseTxBytes`.
- Auth/session handling now includes vend JWT changes, OIDC refresh fixes, silent renew fixes, first-login nonce handling, and zkProof/ephemeral-key rotation.
- Upstream package metadata now references `@evefrontier/dapp-kit` `0.1.9` and `@mysten/sui` `^2.14.1`; this app remains pinned to `@evefrontier/dapp-kit` `^0.1.7` and `@mysten/sui` `^2.4.0` in `package.json`.

CivilizationControl impact:
- No local source change was required for build/typecheck.
- Real wallet smoke is still required before relying on newest Eve Vault behavior: extension detection, connect/disconnect, `useAutoConnect`, current-chain initialization, sponsored signing, user rejection handling, session refresh, and zkProof expiry recovery.

### `vendor/builder-documentation`

Two docs commits landed:
- EVE Vault install guidance now points to the generic GitHub releases page instead of a fixed `v0.0.2` ZIP URL.
- A stale `customizing-external-dapps` navigation entry was removed.

CivilizationControl impact is low. Future install docs should prefer the generic releases page unless deliberately pinning a release for reproduction.

### `vendor/builder-scaffold`

No upstream delta. The pinned SHA already matches remote `main`.

## Documentation Updates

Updated in this branch:
- `README.md` — annotated world original/type-origin ID versus upstream Stillness v2 published-at.
- `docs/llm-reference-guide.md` — added the same world-v2 package distinction for future agents.
- `docs/operations/post-hackathon-repo-readiness-audit.md` — marked the prior submodule-readiness section as superseded by this refresh.
- `docs/operations/stillness-sponsor-worker-handoff.md` — marked exact v1 allowlist instructions as requiring world-v2 verification before reuse.
- `docs/operations/migrate-to-stillness.md` — marked the migration playbook as historical relative to the new world-v2 metadata.
- `docs/README.md` — indexed this report.
- `docs/decision-log.md` — added the concise decision-log entry.

Intentionally not updated:
- Historical Utopia/demo docs remain historical evidence; broad rewrites would blur audit chronology.
- `docs/core/spec.md`, `docs/architecture/evevault-sponsorship-analysis.md`, and `docs/architecture/sui-playground-capabilities.md` need a later reference-refresh pass, but this branch records the drift instead of rewriting large historical analyses.
- Missing expected historical docs were not recreated: `docs/research/evefrontier-builder-docs-map.md` and `docs/strategy/_shared/hackathon-portfolio-roadmap.md` do not exist in this repo.

## Validation Results

All required local gates passed on `chore/submodule-refresh-20260425`:

| Gate | Result |
|---|---|
| `git diff --check` | Passed |
| `git submodule status --recursive` | Passed; refreshed pointers show `+` because the parent commit has not yet recorded them |
| `sui client active-env` | Passed: `testnet_stillness` |
| `sui move build --path contracts/civilization_control` | Passed with existing `self_transfer` lint warning in `gate_control.move` |
| `sui move test --path contracts/civilization_control` | Passed: 26/26 |
| `npm run typecheck` | Passed |
| `npm run build` | Passed with existing Vite large chunk warning |

Move validation briefly marked `contracts/civilization_control/Move.lock` modified, but the worktree hash matched `HEAD` and no content diff existed. The index was refreshed and no lockfile content was staged.

## Preserved Stashes

No stashes were applied or dropped. Pre-existing parent and `vendor/world-contracts` stashes remain, and this task added preservation stashes for generated lockfile path/line-ending drift found during preflight:
- Parent repo: `preserve before submodule refresh 20260425 parent move lock`.
- `vendor/builder-scaffold`: `preserve before submodule refresh 20260425 builder scaffold locks`.
- `vendor/world-contracts`: `preserve before submodule refresh 20260425 world locks`.

## Action Items

1. Treat world-v2 runtime adoption as a separate high-risk task: add explicit latest/runtime and original/type-origin world package constants before changing PTB targets or event queries.
2. Verify sponsor-worker APP_POLICIES against whichever world runtime package the frontend actually calls.
3. Run a headed browser/Eve Vault smoke against the latest extension behavior before relying on the refreshed `vendor/evevault` reference.
4. Decide whether to update local npm dependencies from `@evefrontier/dapp-kit` `^0.1.7` / `@mysten/sui` `^2.4.0` toward the versions now referenced by upstream Eve Vault.
5. Refresh large active reference docs in a separate pass rather than mixing them into this submodule-pointer commit.

## Feature Work Safety

Future feature work is safe to continue from this branch only after validation passes and the branch is reviewed. Runtime work that touches world package IDs, event queries, sponsor allowlists, or wallet behavior should consume the action items above first.