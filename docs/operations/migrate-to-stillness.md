# Migrate to Stillness — Playbook

**Status:** Executed (preview deployed)  
**Created:** 2026-04-01  
**Last updated:** 2026-04-01  

> **Historical note (2026-04-25):** This playbook captured the original Stillness v1 migration. Upstream `vendor/world-contracts` now records Stillness world v2 metadata with `published-at` `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` and original/type-origin ID `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`. Use [submodule-refresh-20260425.md](submodule-refresh-20260425.md) before reusing package-ID or sponsor-worker sections from this playbook.

This document is the complete migration playbook for CivilizationControl from Utopia testnet to Stillness. A fresh agent can execute the migration from this document alone.

---

## Executive Summary

**Conclusion: Ready to proceed. No blockers to publishing.**

Three investigation passes confirm CivilizationControl can migrate to Stillness:

1. **Move contracts** (Task 1) — fully compatible with Stillness world contracts (v0.0.21). All 26 tests pass. Zero hardcoded addresses in Move source. Fresh publish (v1), not an upgrade.
2. **Frontend & external dependencies** (Task 2) — requires config-level updates to ~8 source files (package IDs, tenant default, tribe API URL). No structural code changes.
3. **Final repo-wide sweep** (Task 3) — confirmed no additional runtime risks. Found cosmetic/cleanup items and latent pre-existing bugs.

**Operator structures on Stillness:** SSU and network node confirmed. **No gate.** Gate absence does NOT block publishing or frontend switching — it only blocks gate-specific testing (policy CRUD, permits, posture, turrets).

**Cross-repo dependency:** Sponsor worker in Flappy-Frontier must update its package allowlist. Pre-existing bug discovered: worker uses stale v5 CC ID (governance sponsorship already silently broken on Utopia; graceful fallback masks it).

**Type-origin simplification:** Fresh publish on Stillness means ALL CC types share one package origin, eliminating the multi-version type-origin bugs experienced across v1–v6 on Utopia.

> **Fresh agent quick-start:** Read sections A–D below for the operational guide. Investigation evidence in Part 2 is reference-only.

---

## Part 1: Migration Execution Guide

### A. Publish vs Operate vs Validate

| Requirement | Publish Package | Switch Frontend | Restore Sponsorship | Test SSU/Trade Features | Test Gate Features | Full Production |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Sui CLI configured for testnet | ✅ | — | — | — | — | ✅ |
| Move contracts compile | ✅ | — | — | — | — | ✅ |
| New CC_PACKAGE_ID known | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| New GATE_CONFIG_ID known | — | ✅ | — | — | ✅ | ✅ |
| Stillness constants (WORLD, EVE, ENERGY, REGISTRY) | — | ✅ | — | ✅ | ✅ | ✅ |
| Tribe data regenerated | — | ✅ | — | — | — | ✅ |
| Operator SSU on Stillness | — | ✅<sup>1</sup> | — | ✅ | — | ✅ |
| Operator Gate on Stillness | — | ✅<sup>1</sup> | — | — | ✅ | ✅ |
| Sponsor worker APP_POLICIES updated | — | — | ✅ | — | — | ✅ |
| Sponsor worker redeployed | — | — | ✅ | — | — | ✅ |
| README updated | — | — | — | — | — | ✅ |

<sup>1</sup> Frontend can deploy without owned structures — structure-specific routes will show empty/error states. All structure IDs are resolved dynamically per connected wallet; no player-specific IDs exist in `constants.ts`.

**Key insight:** Publishing the CC package to Stillness requires NOTHING except a working `sui client publish`. No structures, no frontend, no sponsor worker. The package is self-contained.

### B. Known Values vs TBD Values

#### Known Now (Stillness deployment data)

| Constant | Stillness Value | Used In |
|---|---|---|
| `WORLD_PACKAGE_ID` | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` | `constants.ts` |
| `OBJECT_REGISTRY_ID` | `0x454a9aa3d37e1d08d3c9181239c1b683781e4087fbbbd48c935d54b6736fd05c` | `objectResolver.ts` |
| `ENERGY_CONFIG_ID` | `0xd77693d0df5656d68b1b833e2a23cc81eb3875d8d767e7bd249adde82bdbc952` | `constants.ts` |
| `EVE_ASSETS_PACKAGE_ID` | `0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60` | `constants.ts`, `currency.ts` |
| `DEFAULT_TENANT` | `"stillness"` | `useResolveGateId.ts`, `useResolveSsuId.ts` |
| Tribe API URL | `https://world-api-stillness.live.tech.evefrontier.com/v2/tribes` | `useTribesRefresh.ts`, `fetch-tribes.mjs` |
| RPC endpoint | `https://fullnode.testnet.sui.io:443` (unchanged) | `suiReader.ts` |

#### Known After Publish (from `sui client publish` output)

| Constant | How to Find | Used In |
|---|---|---|
| `CC_PACKAGE_ID` | `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` ✅ | `constants.ts` |
| `CC_ORIGINAL_PACKAGE_ID` | Same as `CC_PACKAGE_ID` (fresh v1 = no upgrades) ✅ | `constants.ts` |
| `GATE_CONFIG_ID` | `0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e` ✅ | `constants.ts` |
| UpgradeCap ID | `0xa2dabc23269bd395305958c49034cbf748e11a598afc7808682739231f2b7cc6` ✅ | `Published.toml` only |

#### ~~Depends on Operator Structures~~ — REMOVED (Architecture Correction)

> **2026-04-01 correction:** `CHARACTER_ID`, `GATE_ID`, `GATE_OWNER_CAP_ID`, `SSU_ID`, and `SSU_OWNER_CAP_ID` were previously listed here as deployment constants. They are NOT deployment constants — they are **player-specific object IDs** that vary per connected wallet. All production flows resolve these dynamically via chain queries (asset discovery pipeline, URL parameters). These constants have been removed from `src/constants.ts`. See Section H below.

#### Cross-Repo / External

| Item | Status | Location |
|---|---|---|
| Sponsor worker `APP_POLICIES` | Must update with new WORLD + CC package IDs | `Flappy-Frontier/workers/sponsor-service/wrangler.toml` |
| Sponsor wallet SUI balance | Must verify on testnet | Same testnet keypair |

### C. Operator Structure Impact

**What works without a gate:**
- Publishing the CC package ✅
- Frontend deploy with SSU features (trade post, inventory) ✅
- Wallet connect, character resolution, tribe display ✅
- EVE coin discovery and balance display ✅
- Structure power on/off (SSU) ✅
- Sponsored transactions (once worker updated) ✅

**What requires a gate:**
- Gate policy CRUD (set_policy_preset, remove_policy_preset)
- Treasury configuration (set_treasury)
- Posture switching (set_posture)
- Gate permit flow (toll + free)
- Transit proof generation
- Turret extension binding and targeting
- Full signal feed (gate events won't appear)

**Recommendation:** Proceed with publish → frontend switch → SSU validation. Gate-dependent flows are deferred until a gate is acquired on Stillness. No hardcoded gate IDs are needed — all structure discovery is dynamic per connected wallet.

---

---

_Sections D–G continue the operational guide below. The investigation evidence between here and Section D is reference material from Tasks 1–3. A fresh agent executing the migration can skip directly to [Section D: Final File Inventory](#d-final-file-inventory)._

---

## Investigation Scope

**Task 1 (2026-04-01):** Move contract compatibility with Stillness world contracts  
**Task 2 (2026-04-01):** Frontend, API, tenant, EVE currency, sponsorship hazard audit  
**Task 3 (2026-04-01):** Final repo-wide sweep for unknown unknowns

---

## Findings

### 1. Move Contract Compatibility — CONFIRMED SAFE

Our Move code imports from two world-contracts packages:

| Dependency | Modules Used |
|------------|-------------|
| `world` | `access`, `character`, `gate`, `turret`, `storage_unit`, `inventory` |
| `assets` | `EVE` |

**Critical function usage verified against vendor/world-contracts v0.0.21:**

| Function | Module | Present in v0.0.21 | Used By |
|----------|--------|--------------------:|---------|
| `access::is_authorized` | `world::access` | ✅ | gate_control, posture |
| `gate::issue_jump_permit` | `world::gate` | ✅ (CC adapted from `issue_jump_permit_with_id` during migration — Stillness v1 only has `issue_jump_permit`) | gate_control |
| `character.tribe()` | `world::character` | ✅ | gate_control, turret modules |
| `storage_unit::withdraw_item` | `world::storage_unit` | ✅ | trade_post |
| `storage_unit::deposit_to_owned` | `world::storage_unit` | ✅ (pre-v0.0.18) | trade_post |
| `turret::extension_type` | `world::turret` | ✅ | turret |
| `turret::unpack_candidate_list` | `world::turret` | ✅ | turret, turret_bouncer, turret_defense |
| `turret::new_return_target_priority_list` | `world::turret` | ✅ | turret, turret_bouncer, turret_defense |
| `turret::destroy_online_receipt` | `world::turret` | ✅ | turret, turret_bouncer, turret_defense |

**Stillness world contracts status:**
- Published from the same v0.0.21 codebase as Utopia
- Version 1 on-chain (never upgraded)
- `original-id == published-at` = `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`
- All functions available — they originate from the same source code

**No Utopia-era features adopted:**
- The mid-hackathon world contracts upgrade (v0.0.19→v0.0.21 on Utopia) introduced `revoke_extension_authorization`, `ExtensionRevokedEvent`, `delete_jump_permit`, and `JumpPermitIssuedEvent`
- Decision log entries from 2026-03-21 and 2026-03-22 explicitly state: "No code adoption required" and "No breaking changes"
- None of these features were integrated into CivilizationControl
- `gate::issue_jump_permit_with_id` was used during Utopia development but was replaced with `gate::issue_jump_permit` during the Stillness migration (not available on Stillness v1 chain)

**Build & test verification:**
- `sui move build --path contracts/civilization_control` — compiles ✅
- `sui move test --path contracts/civilization_control` — 26/26 PASS ✅
- No hardcoded Sui addresses in any Move source file

### 2. Package Lifecycle — Fresh Deployment (v1)

Deploying to Stillness is a completely fresh `sui client publish`. Key implications:

| Aspect | Utopia (current) | Stillness (target) |
|--------|------------------|-------------------|
| CC version | v6 (6 upgrades) | v1 (fresh) |
| `CC_PACKAGE_ID` | `0x656006a3...` | `0x902948c1...5971021` (published) |
| `CC_ORIGINAL_PACKAGE_ID` | `0xf2f1e8ea...` | Same as CC_PACKAGE_ID (v1 = no upgrades) |
| Type-origin complexity | 4 distinct type-origin packages (v1–v6) | **All types share one origin** — greatly simplified |
| Upgrade capability | `0xd373fd5b...` | New — generated at publish |
| GateConfig object | `0x3695f897...` | New — created during `init()` |

**Type-origin simplification:** On Utopia, our multi-version upgrade history created type-origin complexity (e.g., `GateAuth` origin = v1, `CommercialAuth` origin = v3, `TurretResponseEvent` origin = v2). On Stillness, a fresh publish means ALL types originate from the same v1 package. This eliminates an entire class of bugs we experienced during hackathon development.

### 3. Utopia-Specific Addresses — Complete Inventory

**No addresses are hardcoded in Move source code.** All environment-specific values live in frontend/config files:

#### Must change for Stillness:

| Constant | Current Value (Utopia) | Stillness Value | File(s) |
|----------|----------------------|-----------------|---------|
| `WORLD_PACKAGE_ID` | `0xd12a70c7...` | `0x28b49755...` | `src/constants.ts` |
| `CC_PACKAGE_ID` | `0x656006a3...` | `0x902948c1...5971021` ✅ | `src/constants.ts` |
| `CC_ORIGINAL_PACKAGE_ID` | `0xf2f1e8ea...` | Same as CC_PACKAGE_ID ✅ | `src/constants.ts` |
| `GATE_CONFIG_ID` | `0x3695f897...` | `0xad76aec8...ebe08e` ✅ | `src/constants.ts` |
| `ENERGY_CONFIG_ID` | `0x9285364e...` | `0xd77693d0...` | `src/constants.ts` |
| `EVE_ASSETS_PACKAGE_ID` | `0xf0446b93...` | `0x2a66a89b...` | `src/constants.ts`, `src/lib/currency.ts` |
| `OBJECT_REGISTRY_ID` | `0xc2b969a7...` | `0x454a9aa3...` | `src/lib/objectResolver.ts` |
| `DEFAULT_TENANT` | `"utopia"` | `"stillness"` | `src/hooks/useResolveGateId.ts`, `src/hooks/useResolveSsuId.ts` |
| Published.toml | Utopia section only | Add `[published.testnet_stillness]` | `contracts/civilization_control/Published.toml` |

> **Note:** `CHARACTER_ID`, `GATE_ID`, `GATE_OWNER_CAP_ID`, `SSU_ID`, and `SSU_OWNER_CAP_ID` previously appeared in this table. They have been **removed from `constants.ts`** — these are player-specific object IDs resolved dynamically per connected wallet, not deployment constants. See Section H.

#### No change needed:

| Item | Value | Reason |
|------|-------|--------|
| RPC endpoint | `https://fullnode.testnet.sui.io:443` | Shared Sui testnet fullnode — same for both Utopia and Stillness |
| Chain ID | `4c78adac` | Same underlying Sui testnet chain |
| Move.toml `[environments]` | `testnet_stillness = "4c78adac"` | Already declared |

#### Architectural note:
EVE_PACKAGE_ID is duplicated in `src/lib/currency.ts` (as `EVE_PACKAGE_ID`) separately from `src/constants.ts` (as `EVE_ASSETS_PACKAGE_ID`). Similarly, `OBJECT_REGISTRY_ID` in `src/lib/objectResolver.ts` is separate from `src/constants.ts`. These should ideally be consolidated but are not blockers.

### 4. Evidence From Decision Log

Key decisions confirming no post-upgrade feature adoption:

> **2026-03-21 — World Contracts v0.0.19 Submodule Refresh:**
> "Impact on CivilizationControl: **No breaking changes. No code adoption required.**"
> Features categorized: ADOPT NOW = None. DOCUMENT FOR LATER = `revoke_extension_authorization`, `ExtensionRevokedEvent`, `delete_jump_permit`.

> **2026-03-22 — World Contracts v0.0.21 Submodule Refresh:**
> "**No breaking changes** to current CC gate permit flow. CC v1 compiled against world v1 remains functional."
> New: `gate::issue_jump_permit_with_id<Auth>()` noted as available, not adopted at that time.

### 5. Previously Unverified — Now Resolved

| Item | Resolution |
|------|-----------|
| Stillness structure availability | **Resolved:** Operator has SSU + network node on Stillness. No gate. Gate absence does NOT block publish or frontend switch — only blocks gate-specific testing. |
| `edition = "2024.beta"` vs `"2024"` | **Resolved:** Our `Move.toml` uses `2024.beta`, matching `vendor/world-contracts/contracts/world/Move.toml` exactly. The `extension_examples` and `assets` packages use `"2024"` but editions are per-package and both are valid on current Sui toolchain. Package compiles and all 26 tests pass — confirmed safe. |
| `EveFrontierProvider` tenant config | **Resolved:** No tenant prop needed — dapp-kit defaults to Stillness. Only our `useResolve*` hooks need DEFAULT_TENANT updated. |
| AdminACL enrollment | **Resolved:** NOT required. CC functions never call `verify_sponsor`. AdminACL only matters for game-level ops CC doesn't invoke. |
| Sponsored transaction path | **Resolved:** Custom Cloudflare Worker in Flappy-Frontier repo. Worker `APP_POLICIES` must be updated with Stillness package IDs. Pre-existing bug: worker uses stale v5 CC package ID. |

---

## Task 2 Findings — Frontend & External Dependency Audit (2026-04-01)

### 6. World API / Tribe Lookup — MUST CHANGE

**Current state:** The app fetches tribe data from the Utopia world API at two levels:

| Layer | File | Current URL | Purpose |
|-------|------|-------------|---------|
| **Runtime refresh** | `src/hooks/useTribesRefresh.ts` (line 16) | `https://world-api-utopia.uat.pub.evefrontier.com/v2/tribes` | Live paginated tribe catalog refresh (called on app load via `App.tsx`) |
| **Build-time script** | `scripts/fetch-tribes.mjs` (line 14) | `https://world-api-utopia.uat.pub.evefrontier.com/v2/tribes` | Generates bundled `src/data/tribes.json` |
| **Bundled snapshot** | `src/data/tribes.json` | N/A (static file) | Utopia tribe data — serves as fallback until runtime refresh completes |

**Stillness target URL:** `https://world-api-stillness.live.tech.evefrontier.com/v2/tribes`

**Two-layer architecture:** The tribe system uses a bundled JSON snapshot (loaded at build time) overlaid by a runtime API refresh (`useTribesRefresh` → `tribeCatalog.mergeFreshTribes()`). Both layers must point at Stillness.

**Response shape:** Both APIs serve `/v2/tribes` — expected to be the same schema. Verify once by fetching `https://world-api-stillness.live.tech.evefrontier.com/v2/tribes?page=1&pageSize=1` and comparing structure.

**Already using Stillness:** `scripts/fetch-solar-systems.mjs` and `scripts/fetch-types.mjs` already point to `world-api-stillness.live.tech.evefrontier.com`. Only the tribe scripts/hooks are still on Utopia.

**Required changes:**

| # | File | Change |
|---|------|--------|
| 1 | `src/hooks/useTribesRefresh.ts` | API_BASE URL → `world-api-stillness.live.tech.evefrontier.com` |
| 2 | `scripts/fetch-tribes.mjs` | API_BASE URL → `world-api-stillness.live.tech.evefrontier.com` |
| 3 | `src/data/tribes.json` | Regenerate by running updated `fetch-tribes.mjs` |

**Risk if missed:** Tribe names in the gate policy editor and signal feed would display Utopia tribe names. If Stillness has different tribe IDs or names, policies targeting tribe IDs would reference stale/wrong tribe labels. The runtime refresh would fail silently (CORS or 404) but the bundled snapshot would still load — so the UI wouldn't crash, just show stale Utopia tribe data.

### 7. Character / Identity Resolution — MOSTLY SAFE

**How it works:** Character identity is resolved entirely on-chain, not via API:
1. `useConnection()` from dapp-kit → `walletAddress`
2. `fetchPlayerProfile(walletAddress)` in `src/lib/suiReader.ts` → queries `getOwnedObjects` for type `{WORLD_PACKAGE_ID}::character::PlayerProfile`
3. Extracts `character_id`, fetches Character object for `name` and `tribe_id`
4. Distributed via `CharacterContext` in `App.tsx`

**Key dependency:** The `PlayerProfile` type filter uses `WORLD_PACKAGE_ID`. When `src/constants.ts` is updated to the Stillness world package (`0x28b49755...`), character resolution automatically points at Stillness. No separate character API endpoint to change.

**Confirmed safe:** Character name display, tribe enrichment (via `tribeCatalog`), and ownership resolution all flow through the same `WORLD_PACKAGE_ID`-based chain reads.

### 8. Tenant Configuration — SPLIT-BRAIN RISK

**Current state creates a split-brain between the dapp-kit and our hooks:**

| Component | DEFAULT_TENANT | Source |
|-----------|---------------|--------|
| `@evefrontier/dapp-kit` SmartObjectProvider | `"stillness"` | `node_modules/@evefrontier/dapp-kit/utils/constants.ts` (line 90) |
| `vendor/evevault` authStore | `"stillness"` | `vendor/evevault/packages/shared/src/utils/tenantConfig.ts` (line 5) |
| `src/hooks/useResolveGateId.ts` | `"utopia"` | Hardcoded (line 22) |
| `src/hooks/useResolveSsuId.ts` | `"utopia"` | Hardcoded (line 22) |

The dapp-kit and evevault already default to Stillness. Our hooks override to Utopia. On Stillness migration, our hooks must change to `"stillness"`.

**URL query override:** Both hooks read `?tenant=` from URL search params before falling back to `DEFAULT_TENANT`. This means `?tenant=stillness` would work without code changes, but the default must be updated for production.

**EveFrontierProvider:** Configured in `src/main.tsx` (line 59) with no tenant prop — it accepts no environment parameter. Tenant is determined by the URL query string + DEFAULT_TENANT fallback. No code change needed for the provider itself.

**Required changes:**

| # | File | Change |
|---|------|--------|
| 1 | `src/hooks/useResolveGateId.ts` | `DEFAULT_TENANT = "utopia"` → `"stillness"` |
| 2 | `src/hooks/useResolveSsuId.ts` | `DEFAULT_TENANT = "utopia"` → `"stillness"` |

### 9. EVE / Lux Currency — DUPLICATED IDs, MUST UPDATE BOTH

**Current state:** The EVE asset package ID is defined in two separate files with different constant names:

| File | Constant | Value (Utopia) | Stillness Value |
|------|----------|----------------|-----------------|
| `src/constants.ts` (line 49) | `EVE_ASSETS_PACKAGE_ID` | `0xf0446b93...` | `0x2a66a89b...` |
| `src/lib/currency.ts` (line 19) | `EVE_PACKAGE_ID` | `0xf0446b93...` | `0x2a66a89b...` |

Both files derive `EVE_COIN_TYPE` as `` `${pkg}::EVE::EVE` ``.

**Critical finding:** The `EVE_COIN_TYPE` in `constants.ts` is currently **unused at runtime** — no file imports it. All actual coin type queries go through `currency.ts`'s `EVE_COIN_TYPE`. However, both must be updated to avoid future drift.

**Coin type usage chain:**
1. `currency.ts` → `fetchEveCoinObjects(addr)` → `suix_getCoins` with `EVE_COIN_TYPE` → discovers EVE coins in wallet
2. Hooks (`useTransitProof`, `useGatePermit`, `useBuyListing`) call `fetchEveCoinObjects()` to find payment coins
3. Transaction builders (`tradePostTx.ts`, `gatePermitTx.ts`, `transitProofTx.ts`) use the coin object ID — no type string needed

**Consequences if not updated:** `fetchEveCoinObjects()` queries coins of `0xf0446b93::EVE::EVE` (Utopia). On Stillness, the player's EVE coins are type `0x2a66a89b::EVE::EVE`. Query returns empty → "Insufficient EVE balance" on all paid operations (tolls, trade purchases). Toll-free operations (free permits, create/cancel listings) still work. No silent data corruption — transactions would fail outright.

**Move contract unaffected:** The contract resolves `Coin<EVE>` via the `assets` dependency in `Published.toml` at compile time. A fresh publish on Stillness uses the correct Stillness EVE type automatically.

**Required changes:**

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/currency.ts` (line 19) | `EVE_PACKAGE_ID` → `0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60` |
| 2 | `src/constants.ts` (line 49) | `EVE_ASSETS_PACKAGE_ID` → same value (keep in sync) |

### 10. Sponsored Transactions — CROSS-REPO DEPENDENCY

**How sponsorship works in CC:**
1. `src/lib/sponsorship.ts` reads `VITE_SPONSOR_URL` env var → POST to Cloudflare Worker
2. `src/hooks/useSponsoredExecution.ts` implements 4-step flow: build TransactionKind → POST to sponsor → player signs → execute with dual signatures
3. Graceful fallback: if sponsor is unconfigured or fails, falls back to player-paid execution

**Which operations are sponsored:**
- ✅ Sponsored: `useAuthorizeExtension`, `useGatePolicyMutation` (3 callsites), `usePosture`, `useStructurePower`
- ❌ Not sponsored (value transfers): `useGatePermit`, `useBuyListing`, `useCreateListing`, `useCancelListing`, `useTransitProof`

**Sponsor worker location:** `c:\dev\Flappy-Frontier\workers\sponsor-service\` (accessible from this machine)

**CONFIRMED: Worker uses Utopia package IDs in allowlist.** From `wrangler.toml` → `APP_POLICIES`:

```
"civilization-control": {
  packages: {
    "0xd12a70c7...": {          // WORLD_PACKAGE_ID (Utopia)
      "character": ["borrow_owner_cap", "return_owner_cap"],
      "gate": ["authorize_extension", ...],
      ...
    },
    "0xeffb45b2...": {          // CC_PACKAGE_ID v5 (STALE — should be v6!)
      "gate_control": ["set_policy_preset", "remove_policy_preset", "set_treasury"],
      "posture": ["set_posture"]
    }
  }
}
```

**Pre-existing bug discovered:** The worker's CC package ID is `0xeffb45b2...` (v5), but CC was upgraded to v6 (`0x656006a3...`). This means sponsored governance transactions against v6 MoveCall targets are already being rejected by the worker on Utopia. The graceful fallback masks this — players silently pay gas instead. This must be corrected for Stillness regardless.

**Required changes for Stillness (cross-repo):**

| # | File (in Flappy-Frontier repo) | Change |
|---|-------------------------------|--------|
| 1 | `workers/sponsor-service/wrangler.toml` | Update `WORLD_PACKAGE_ID` in APP_POLICIES → Stillness: `0x28b49755...` |
| 2 | Same file | Update `CC_PACKAGE_ID` in APP_POLICIES → new Stillness CC package (TBD at publish) |
| 3 | Same file | Redeploy worker after config update |
| 4 | Sponsor wallet | Verify SUI balance for gas payments (same testnet key works) |

**No CORS changes needed:** `ALLOWED_ORIGINS` in `wrangler.toml` already includes `civilizationcontrol.pages.dev` and wildcard `.civilizationcontrol.pages.dev`.

**No EVE Vault integration:** CC does NOT use the `evefrontier:sponsoredTransaction` wallet feature. The custom Cloudflare Worker path is independent of EVE Vault's sponsorship mechanism.

**AdminACL NOT required for CC governance:** CC functions never call `verify_sponsor`. AdminACL only matters for game-level operations like `jump_with_permit` that CC doesn't invoke directly.

---

_End of investigation evidence. Operational guide continues below._

---

## D. Final File Inventory

Every file requiring modification, grouped by when the change is needed.

### Before Publish (0 code files)

No source file changes are required to publish. The Move contracts are self-contained.

| File | Change | Reason |
|------|--------|--------|
| `contracts/civilization_control/build/` | Delete directory (`rm -rf`) | Clear stale Utopia compiled artifacts before Stillness build |

### Immediately After Publish (8 source files)

These require the new `CC_PACKAGE_ID` and `GATE_CONFIG_ID` from publish output.

| File | Constants to Update | Values Known Now? |
|------|-------------------|:-----------------:|
| `src/constants.ts` | `WORLD_PACKAGE_ID`, `CC_PACKAGE_ID`, `CC_ORIGINAL_PACKAGE_ID`, `GATE_CONFIG_ID`, `ENERGY_CONFIG_ID`, `EVE_ASSETS_PACKAGE_ID` | ✅ All known |
| `src/lib/currency.ts` | `EVE_PACKAGE_ID` → `0x2a66a89b...` | ✅ Known |
| `src/lib/objectResolver.ts` | `OBJECT_REGISTRY_ID` → `0x454a9aa3...` | ✅ Known |
| `src/hooks/useResolveGateId.ts` | `DEFAULT_TENANT` → `"stillness"` | ✅ Known |
| `src/hooks/useResolveSsuId.ts` | `DEFAULT_TENANT` → `"stillness"` | ✅ Known |
| `src/hooks/useTribesRefresh.ts` | API_BASE → `world-api-stillness.live.tech.evefrontier.com` | ✅ Known |
| `scripts/fetch-tribes.mjs` | API_BASE → `world-api-stillness.live.tech.evefrontier.com` | ✅ Known |

After updating the above, run:
```bash
node scripts/fetch-tribes.mjs            # Regenerate src/data/tribes.json
npm run typecheck && npm run build        # Verify no breakage
```

### Post-Publish Config (1 file)

| File | Change |
|------|--------|
| `contracts/civilization_control/Published.toml` | Add `[published.testnet_stillness]` section with `published-at`, `original-id`, `upgrade-cap` |

### Cross-Repo Follow-Up (1 external file)

| File (in Flappy-Frontier) | Change |
|----------------------------|--------|
| `workers/sponsor-service/wrangler.toml` | Update `APP_POLICIES`: `WORLD_PACKAGE_ID` → `0x28b49755...`, `CC_PACKAGE_ID` → new Stillness value. Redeploy worker. |

### Optional Cleanup (low priority, post-migration)

| File | Change | Category |
|------|--------|----------|
| `README.md` | Update "Utopia testnet" → "Stillness", On-Chain Identifiers table | Documentation |
| `gate_obj.json` | Delete or replace with Stillness sample | Debug artifact |
| `playerprofile.json` | Delete or replace with Stillness sample | Debug artifact |
| `wallet_objects.txt` | Delete or replace | Debug artifact |
| `.env.example` | Update `VITE_EVE_WORLD_PACKAGE_ID` to Stillness value | Documentation |
| `scripts/test-sponsor.mjs` | Update 7 hardcoded Utopia IDs | Diagnostic tool |
| `scripts/test-turret-targeting.mjs` | Update 4 hardcoded Utopia IDs | Diagnostic tool |
| `scripts/record-demo-scenes.mts` | Update `GATE_ID`, `SSU_ID` | Demo recording |
| Source comments (6 files) | Update "Utopia" → "Stillness" in `constants.ts`, `currency.ts`, `objectResolver.ts`, `suiReader.ts`, `useTribesRefresh.ts`, `tribeCatalog.ts` | Cosmetic |
| `recordings/.chromium-profile*/` | Delete stale Chromium profiles before Stillness demo recordings | Demo tooling |

---

## E. Execution-Ready Migration Sequence

Stages are dependency-ordered. Each stage lists prerequisites and concrete commands. Steps marked ⚠️ have external dependencies.

### Stage 0: Final Pre-Publish Verification

_No code changes. Confirm readiness._

- [x] **0.1** Move contract compiles: `sui move build --path contracts/civilization_control` ✅
- [x] **0.2** Move tests pass: `sui move test --path contracts/civilization_control` — 26/26 ✅
- [x] **0.3** All migration-sensitive files identified (this document) ✅
- [x] **0.4** Edition `2024.beta` confirmed compatible ✅
- [x] **0.5** Operator structures on Stillness confirmed: SSU + network node ✅, no gate ⚠️
- [x] **0.6** Verify Stillness world API is live ✅
- [x] **0.7** Clean stale build artifacts ✅

### Stage 1: Publish Contract

_Prerequisite: Stage 0 complete. Sui CLI configured for testnet._

- [x] **1.1** Sui CLI environment verified ✅
- [x] **1.2** Published: `sui client publish contracts/civilization_control` ✅
  - Tx: `Exixj2g847Cf54cQGx6iyRdHGevFY3372nkHLxJ6qX6X`
- [x] **1.3** Recorded from publish tx output:
  - `CC_PACKAGE_ID` = `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021`
  - `GATE_CONFIG_ID` = `0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e`
  - `UpgradeCap` = `0xa2dabc23269bd395305958c49034cbf748e11a598afc7808682739231f2b7cc6`

### Stage 2: Capture Publish Outputs

_Prerequisite: Stage 1 complete._

- [x] **2.1** Verified `CC_ORIGINAL_PACKAGE_ID` = `CC_PACKAGE_ID` (fresh v1) ✅
- [x] **2.2** Updated `contracts/civilization_control/Published.toml` ✅
- [x] **2.3** ~~Look up operator structures~~ — REMOVED. Structure IDs are resolved dynamically per connected wallet. No constants to set.

### Stage 3: Frontend Config Update

_Prerequisite: Stage 2 complete. All IDs from publish known._

- [x] **3.1** Updated `src/constants.ts` ✅
- [x] **3.2** Updated `src/lib/currency.ts` ✅
- [x] **3.3** Updated `src/lib/objectResolver.ts` ✅
- [x] **3.4** Updated `src/hooks/useResolveGateId.ts` ✅
- [x] **3.5** Updated `src/hooks/useResolveSsuId.ts` ✅
- [x] **3.6** Updated `src/hooks/useTribesRefresh.ts` ✅
- [x] **3.7** Updated `scripts/fetch-tribes.mjs` ✅
- [x] **3.8** Regenerated tribe data (376 Stillness tribes) ✅
- [x] **3.9** Verified: typecheck ✅ build ✅

### Stage 4: Deploy Preview

_Prerequisite: Stage 3 build succeeds._

- [x] **4.1** Feature branch created and committed ✅
- [x] **4.2** Preview deployed ✅
- [x] **4.3** Preview URL: https://feat-stillness-migration.civilizationcontrol.pages.dev

### Stage 5: SSU & General Validation (available structures)

_Prerequisite: Stage 4 preview live. Operator wallet connected._

- [ ] **5.1** Wallet connect → character resolution shows correct Stillness character
- [ ] **5.2** Tribe display shows Stillness tribe names
- [ ] **5.3** EVE coin balance visible (not "Insufficient EVE")
- [ ] **5.4** Bind SSU extension: `authorize_extension<CommercialAuth>` on operator's Stillness SSU
- [ ] **5.5** Trade post: create listing → visible on marketplace
- [ ] **5.6** Trade post: cancel listing → removed
- [ ] **5.7** Structure power toggle on SSU
- [ ] **5.8** Strategic map renders Stillness solar systems

### Stage 6: Gate-Dependent Validation (DEFERRED — no gate on Stillness)

_Prerequisite: Operator acquires gate on Stillness. Not blocking earlier stages._

- [ ] **6.1** Bind gate extension: `authorize_extension<GateAuth>` on Stillness gate
- [x] **6.2** ~~Update `constants.ts`~~ — REMOVED. Gate IDs are resolved dynamically per connected wallet. No constants to set.
- [ ] **6.3** Set policy presets (tribe-based, default)
- [ ] **6.4** Set treasury configuration
- [ ] **6.5** Set posture (Open/Restricted)
- [ ] **6.6** Test gate permit flow (toll payment + free permit)
- [ ] **6.7** Test transit proof generation
- [ ] **6.8** Bind turret extensions (`DefenseAuth`, `BouncerAuth`) if turrets available
- [ ] **6.9** Test turret targeting response
- [ ] **6.10** Verify full signal feed (gate + SSU + turret events)

### Stage 7: Sponsor Worker Follow-Up (cross-repo)

_Prerequisite: CC_PACKAGE_ID known (Stage 2). Can run in parallel with Stages 5–6._

- [ ] ⚠️ **7.1** Update `Flappy-Frontier/workers/sponsor-service/wrangler.toml`:
  - `WORLD_PACKAGE_ID` → `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`
  - `CC_PACKAGE_ID` → new Stillness CC package ID
- [ ] ⚠️ **7.2** Redeploy worker:
  ```bash
  cd c:\dev\Flappy-Frontier
  npx wrangler deploy workers/sponsor-service
  ```
- [ ] **7.3** Verify sponsor wallet SUI balance on testnet
- [ ] **7.4** Test sponsored governance action (e.g., posture switch) — confirm gas not deducted from player wallet

### Stage 8: Production Deploy & Cleanup

_Prerequisite: Stages 5 validation passes. Gate validation (Stage 6) is optional for initial production._

- [ ] **8.1** Merge feature branch to main (squash merge):
  ```bash
  git checkout main
  git merge --squash feat/stillness-migration
  git commit -m "feat: Migrate to Stillness testnet"
  ```
- [ ] **8.2** Deploy production:
  ```bash
  npx wrangler pages deploy dist --project-name civilizationcontrol --branch main --commit-hash $(git rev-parse HEAD)
  ```
- [ ] **8.3** Update `README.md` — "Stillness testnet", On-Chain Identifiers table
- [ ] **8.4** Append decision log entry in `docs/decision-log.md`
- [ ] **8.5** Optional cleanup: delete `gate_obj.json`, `playerprofile.json`, `wallet_objects.txt`
- [ ] **8.6** Optional: update source code comments from "Utopia" → "Stillness"
- [ ] **8.7** Optional: update diagnostic scripts with Stillness IDs

---

## F. Additional Risks Discovered in Final Sweep (Task 3)

These items were found during the comprehensive repo-wide audit and are NOT present in Task 1 or Task 2 findings.

### F.1 localStorage Cross-Contamination (Low)

**Files:** `src/lib/spatialPins.ts` (key: `cc_spatial_pins`), `src/components/topology/StrategicMapPanel.tsx` (key: `cc:strategic-map:starfield`), `src/hooks/useMapViewTransform.ts` (key: `cc:strategic-map:camera`)

Storage keys are NOT environment-scoped. If a user's browser previously ran on Utopia, their spatial pins reference Utopia network-node object IDs. On Stillness those IDs don't exist — pins persist but never match resolved structures. Not a crash, but confusing phantom-data UX.

**Impact:** Low — affects only users who ran Utopia in the same browser. Pins show empty markers. Camera state is environment-agnostic (just coordinates).

**Mitigation options:** (a) Clear localStorage on deploy (add a version-key check), or (b) accept the cosmetic issue — users can manually clear pins. Not a migration blocker.

### F.2 Fuel Efficiency Type IDs — VERIFIED SAFE

**File:** `src/lib/fuelRuntime.ts` (lines 22–28)

Hardcoded fuel item type IDs (88335, 88319, 78516, 84868, 78515, 78437) were verified against `src/data/itemTypes.json` which was already fetched from the Stillness API. All 6 fuel types resolve correctly with matching names (D1 Fuel, D2 Fuel, EU-40, SOF-40, SOF-80, EU-90). **No action needed.**

### F.3 TURRET_TARGETING Event Type — Latent Bug (Medium)

**File:** `src/lib/eventParser.ts` (line 37)

```
TURRET_TARGETING: `${CC_PACKAGE_ID}::turret::TurretTargetingEvent`
```

All other CC event types use `CC_ORIGINAL_PACKAGE_ID`. On Stillness v1 (fresh publish), both IDs are equal — bug is **masked**. If CC is ever upgraded on Stillness, `TurretTargetingEvent` parsing will silently break (events dropped from signal feed). Pre-existing bug from Utopia, not migration-caused.

**Recommendation:** Fix during migration for correctness — change `CC_PACKAGE_ID` → `CC_ORIGINAL_PACKAGE_ID` in this one line. On Stillness v1 it's functionally identical, so no risk to the fix.

### F.4 Build Artifact Cleanup (Medium)

**Directory:** `contracts/civilization_control/build/`

Contains compiled Utopia bytecode. A `sui move build` will regenerate it, but stale artifacts could confuse the publish process. Clean before Stillness build.

**Action:** `rm -rf contracts/civilization_control/build/` — included in Stage 0.7.

### F.5 Move.lock Utopia Pins (Low — auto-resolved)

**File:** `contracts/civilization_control/Move.lock`

Contains `[pinned.testnet_utopia.*]` sections with Utopia framework revision hashes. A Stillness build will auto-regenerate this file. No manual action needed.

### F.6 Diagnostic Scripts with Hardcoded Utopia IDs (Low)

| Script | Hardcoded Items | Purpose |
|--------|-----------------|---------|
| `scripts/test-sponsor.mjs` | 7 Utopia IDs + sponsor URL | Sponsor worker diagnostic |
| `scripts/test-turret-targeting.mjs` | 4 Utopia IDs (WORLD, CC_V3, TURRET, CHAR) | Turret devInspect test |
| `scripts/record-demo-scenes.mts` | GATE_ID, SSU_ID (Utopia) | Demo recording automation |

Not runtime code. Only matter if reused for Stillness validation/demo. Update if needed, otherwise ignore.

### F.7 Root-Level Debug Artifacts (Low)

| File | Content |
|------|---------|
| `gate_obj.json` | Raw Sui object JSON dump of Utopia gate |
| `playerprofile.json` | Raw Sui object JSON dump of Utopia player profile |
| `wallet_objects.txt` | `sui client objects` output with Utopia coin objects |

No code references these files. Safe to delete post-migration.

### F.8 README.md Utopia References (Medium, post-migration)

`README.md` prominently states "Deployed on the Utopia testnet" (line 11) and includes an On-Chain Identifiers table with all Utopia addresses. Must update after migration for judge/visitor clarity.

### F.9 Source Code Comments Mentioning Utopia (Cosmetic)

6 source files have comments referencing "Utopia": `constants.ts`, `currency.ts`, `objectResolver.ts`, `suiReader.ts`, `useTribesRefresh.ts`, `tribeCatalog.ts`. No functional impact. Update during migration for consistency.

### F.10 Chromium Recording Profiles (Low)

`recordings/.chromium-profile/` and `recordings/.chromium-profile-b6/` may contain stale Utopia localStorage. Delete before Stillness demo recordings to avoid phantom spatial data.

### F.11 No CI/CD (Info)

No GitHub Actions workflows exist. All deploys are manual CLI via `wrangler pages deploy`. Production deploys MUST include `--branch main` flag. No automated deploy-on-push risk, but no automation to help either.

---

## G. Risk Register

| # | Risk | Impact | Confidence | Severity | Blocking? |
|---|------|--------|------------|----------|:---------:|
| 1 | EVE coin type mismatch (`EVE_PACKAGE_ID` in `currency.ts` not updated) | All paid operations fail (tolls, trades) | **High** — verified two independent definitions | Critical | No (post-publish) |
| 2 | EVE coin type mismatch (`EVE_ASSETS_PACKAGE_ID` in `constants.ts` not updated) | Currently unused at runtime, but will drift from `currency.ts` | **High** | Low | No |
| 3 | Tribe API returns Utopia data | Stale tribe names in policy editor | **High** — URL hardcoded | Medium | No |
| 4 | Sponsor worker rejects Stillness MoveCall targets | Governance ops fall back to player-paid gas | **Confirmed** — inspected APP_POLICIES | Medium | No (fallback works) |
| 5 | Sponsor worker has stale v5 CC ID (pre-existing Utopia bug) | Governance sponsorship already broken on Utopia | **Confirmed** — wrangler.toml shows v5 ID | Medium | No (fallback) |
| 6 | `DEFAULT_TENANT = "utopia"` in resolve hooks | Gate/SSU ID resolution fails against wrong tenant | **High** — hardcoded in 2 hooks | Critical | No (post-publish) |
| 7 | Operator lacks gate on Stillness | Gate-dependent features untestable | **Confirmed** — operator reports no gate | Medium | **Yes — blocks Stage 6 only** |
| 8 | Sponsor wallet SUI balance insufficient | Sponsorship fails (graceful fallback) | **Unknown** | Low | No (fallback) |
| 9 | `tribes.json` has Utopia tribe IDs not on Stillness | Wrong tribe entries until refresh | **Medium** | Low | No (cosmetic) |
| 10 | localStorage `cc_spatial_pins` has Utopia object IDs | Phantom pin markers in strategic map | **High** — verified in code | Low | No (cosmetic) |
| 11 | `TURRET_TARGETING` event type uses wrong package ID | Events dropped from signal feed after first upgrade | **High** — verified in code | Medium (latent) | No |
| 12 | Stale build artifacts in `contracts/build/` | Potential publish confusion | **Medium** | Low | No (preventive clean) |
| 13 | World API response shape differs Utopia vs Stillness | Runtime tribe refresh silently fails | **Low** — both serve `/v2/tribes` | Low | No |

---

## Confirmed Safe Assumptions

1. Same Sui testnet chain (`4c78adac`) — no chain migration
2. Same RPC endpoint — `https://fullnode.testnet.sui.io:443`
3. Same world-contracts codebase (v0.0.21) — all APIs available
4. Move source code requires zero changes
5. Fresh publish simplifies type-origin (all types share one package ID)
6. No mid-hackathon world contract features were adopted
7. dapp-kit already defaults to Stillness (`DEFAULT_TENANT = "stillness"`)
8. EVE Vault tenant defaults to Stillness — no provider configuration change needed
9. Character identity resolution is on-chain only — follows `WORLD_PACKAGE_ID` automatically
10. CORS for sponsor worker already includes `civilizationcontrol.pages.dev`
11. Solar systems and item types data already fetched from Stillness API
12. AdminACL enrollment NOT required for CC governance operations
13. `edition = "2024.beta"` matches world-contracts `world/Move.toml` — confirmed compatible
14. Fuel item type IDs (88335, 88319, etc.) verified present in Stillness `itemTypes.json`
15. OwnerCap discovery uses pattern-matching (not package ID prefix) — immune to migration
16. Extension auth checking uses suffix matching (`endsWith`) — immune to migration
17. SuiScan links (`suiscan.xyz/testnet/`) correct for both environments (same chain)
18. No feature flags or environment-conditional branching exists in frontend code
19. Only 2 Vite env vars consumed at runtime (`VITE_SPONSOR_URL`, `VITE_SPONSOR_API_KEY`) — both URL-based, environment-agnostic

---

## Cross-Repo Checks Required

These checks require access to repositories outside `CivilizationControl` and cannot be completed from this workspace alone.

### Sponsor Worker (`c:\dev\Flappy-Frontier\workers\sponsor-service\`)

**Status:** Inspected — code is accessible locally.

| Check | Status | Finding |
|-------|--------|---------|
| `APP_POLICIES` package IDs | **Verified stale** | Uses Utopia `WORLD_PACKAGE_ID` and CC v5 (not even current v6). Must update both for Stillness. |
| CORS allowlist | **Verified OK** | `civilizationcontrol.pages.dev` and wildcard already present |
| RPC endpoint | **Verified OK** | `https://fullnode.testnet.sui.io:443` — same for both environments |
| Sponsor wallet balance | **Unverified** | Same testnet keypair works; balance must be checked on-chain |
| Worker redeployment needed | **Yes** | After updating `APP_POLICIES`, run `wrangler deploy` from the Flappy-Frontier repo |

### EVE Vault / dapp-kit

**Status:** No external check needed. `@evefrontier/dapp-kit@0.1.7` already defaults to Stillness internally. CC does not use EVE Vault's sponsored transaction feature.

---

## Stillness Environment Reference

From operator-provided deployment data:

| Resource | Stillness Address |
|----------|------------------|
| World Package | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` |
| Object Registry | `0x454a9aa3d37e1d08d3c9181239c1b683781e4087fbbbd48c935d54b6736fd05c` |
| Killmail Registry | `0x7fd9a32d0bbe7b1cfbb7140b1dd4312f54897de946c399edb21c3a12e52ce283` |
| Server Address Registry | `0xeb97b81668699672b1147c28dacb3d595534c48f4e177d3d80337dbde464f05f` |
| Location Registry | `0xc87dca9c6b2c95e4a0cbe1f8f9eeff50171123f176fbfdc7b49eef4824fc596b` |
| Energy Config | `0xd77693d0df5656d68b1b833e2a23cc81eb3875d8d767e7bd249adde82bdbc952` |
| Fuel Config | `0x4fcf28a9be750d242bc5d2f324429e31176faecb5b84f0af7dff3a2a6e243550` |
| Gate Config | `0xd6d9230faec0230c839a534843396e97f5f79bdbd884d6d5103d0125dc135827` |
| AdminACL | `0x8ca0e61465f94e60f9c2daff9566edfe17aa272215d9c924793d2721b3477f93` |
| EVE Assets Package | `0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60` |

---

## Part 2: Investigation Evidence (Reference)

_The investigation evidence is located between Sections C and D of the operational guide (above). It documents the three passes that produced this playbook: Task 1 (Move compatibility), Task 2 (frontend/external dependencies), and Task 3 (final repo-wide sweep). A fresh agent executing the migration can rely on the operational guide alone._

---

## H. Architecture Correction — Player-Specific Constants Removed (2026-04-01)

### Problem

The initial migration treated 5 player-specific object IDs as deployment constants in `constants.ts`:
- `CHARACTER_ID` — the deployer's character
- `GATE_ID`, `GATE_OWNER_CAP_ID` — the deployer's gate
- `SSU_ID`, `SSU_OWNER_CAP_ID` — the deployer's SSU
- `TREASURY_ADDRESS` — the deployer's wallet (vestigial — never imported)

These are NOT deployment constants. CivilizationControl is used by **any player** who connects, not just the operator. Every connected wallet has its own character, gates, and SSUs discovered dynamically from the chain.

### Finding

A 15-flow runtime audit confirmed **all production flows were already dynamic**:

| # | Flow | ID Source | Multi-user Safe |
|---|------|-----------|:---:|
| 1 | Character resolution | `fetchPlayerProfile(walletAddress)` → chain query | ✅ |
| 2 | SSU discovery | `fetchOwnerCaps(characterId)` → `OwnerCap<StorageUnit>` filter | ✅ |
| 3 | SSU owner-cap resolution | Chain query | ✅ |
| 4 | Gate discovery | `fetchOwnerCaps(characterId)` → `OwnerCap<Gate>` filter | ✅ |
| 5 | Gate owner-cap resolution | Chain query | ✅ |
| 6 | Gate detail page | URL param `/gates/:id` | ✅ |
| 7 | authorize_extension SSU | `authorizeGates(targets[])` — discovery pipeline | ✅ |
| 8 | authorize_extension gate | `authorizeSsus(targets[])` — discovery pipeline | ✅ |
| 9 | Policy CRUD | URL param + `GATE_CONFIG_ID` (shared singleton) | ✅ |
| 10 | Treasury config | User input / connected wallet address | ✅ |
| 11 | Posture switching | Discovery pipeline + context | ✅ |
| 12 | Permit flow | `useResolveGateId()` — URL/query param resolution | ✅ |
| 13 | Transit proof | Caller-supplied params + context | ✅ |
| 14 | Turret flows | Discovery pipeline | ✅ |
| 15 | Map/topology click | Discovered objectId → URL route | ✅ |

The hardcoded constants were only consumed by two legacy single-target functions (`authorizeGate()`, `authorizeSsu()`) in `useAuthorizeExtension.ts`, which were exclusively called from `AuthHarness.tsx` — a dev-only debug screen not routed in the production app.

### Fix Applied

1. **Removed from `src/constants.ts`**: `CHARACTER_ID`, `GATE_ID`, `GATE_OWNER_CAP_ID`, `SSU_ID`, `SSU_OWNER_CAP_ID`, `TREASURY_ADDRESS`
2. **Removed from `src/hooks/useAuthorizeExtension.ts`**: Legacy `authorizeGate()` and `authorizeSsu()` single-target functions and their constant imports
3. **Updated `src/screens/AuthHarness.tsx`**: Uses `useCharacterId()` for dynamic display, authorization buttons replaced with informational text pointing to production list screens

### Remaining True Constants

After correction, `src/constants.ts` contains only deployment-scoped shared objects:
- `WORLD_PACKAGE_ID` — Stillness world package
- `CC_PACKAGE_ID` / `CC_ORIGINAL_PACKAGE_ID` — CivilizationControl package
- `GATE_CONFIG_ID` — Shared GateConfig singleton
- `ENERGY_CONFIG_ID` — Shared EnergyConfig
- `EVE_ASSETS_PACKAGE_ID` / `EVE_COIN_TYPE` — EVE token

All are true environment constants (same for all users on Stillness).

### Verification

- `npm run typecheck` → ✅ clean
- `npm run build` → ✅ success

---

## Version History

| Date | Change |
|------|--------|
| 2026-04-01 | Created — Task 1 Move compatibility investigation complete |
| 2026-04-01 | Task 2 — Frontend + external dependency audit: world API, tribes, tenant, EVE currency, sponsorship |
| 2026-04-01 | Task 3 — Final repo-wide sweep: comprehensive grep audit, runtime dataflow trace, build/deploy/scripts/docs audit. Added Publish vs Operate vs Validate matrix (§A), Known Values vs TBD table (§B), Operator Structure Impact (§C), timing-grouped file inventory (§D), 8-stage execution sequence (§E), 11 additional risks (§F), expanded risk register (§G), 19 confirmed-safe assumptions. Corrected: publishing NOT blocked by gate; operator has SSU + network node but no gate on Stillness. |
| 2026-04-01 | **EXECUTED.** Move contracts adapted (`issue_jump_permit_with_id` → `issue_jump_permit`), published to Stillness tx `Exixj2g847Cf54cQGx6iyRdHGevFY3372nkHLxJ6qX6X`. CC_PACKAGE_ID = `0x902948c1...5971021`, GATE_CONFIG_ID = `0xad76aec8...ebe08e`. Frontend migrated (10 files), tribe catalog regenerated (376 tribes), eventParser TURRET_TARGETING bug fixed. Preview: https://feat-stillness-migration.civilizationcontrol.pages.dev |
| 2026-04-01 | **Architecture correction.** Removed 5 player-specific constants (`CHARACTER_ID`, `GATE_ID`, `GATE_OWNER_CAP_ID`, `SSU_ID`, `SSU_OWNER_CAP_ID`) and vestigial `TREASURY_ADDRESS` from `constants.ts`. These are per-wallet dynamic values, not deployment constants. All 15 production flows were already dynamic — legacy single-target functions (`authorizeGate`, `authorizeSsu`) removed from `useAuthorizeExtension.ts`, `AuthHarness.tsx` updated. Added Section H. |
