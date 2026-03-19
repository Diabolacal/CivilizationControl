## Decision Log

Newest first. Use the template in `docs/operations/DECISIONS_TEMPLATE.md`.

---

## 2026-03-19 – Posture Visual Confirmation Flow + Extension Event Decision
- Goal: Make posture switch visuals update on confirmed chain state rather than appearing as an instant local toggle. Assess whether world-level extension events should be surfaced in Signal Feed.
- Decisions:
  - **Posture colors were ALREADY chain-confirmed** — `usePostureState()` reads GateConfig DF via chain RPC; colors update only when refetch returns new data after `invalidateQueries(["posture"])`. The problem was purely visual: no CSS transition, so the color snap looked fake.
  - **Added 800ms CSS transitions** to all posture-dependent visual elements: topology glyph colors (SVG `color` property), defense overlay (opacity), node overlay label borders, PostureIndicator badges, PostureControl dot and button, TurretListScreen PostureBadge.
  - **Added "Confirming…" transient label** on PostureControl between tx success and posture refetch completion (uses `isFetching` from TanStack Query after invalidation).
  - **Extension events deferred from Signal Feed.** `ExtensionAuthorizedEvent` is emitted by world-contracts (gate.move, turret.move, storage_unit.move) — different package from CC. Would require 3 additional `queryEvents` RPCs per poll cycle. `PostureChangedEvent` (CC module, already surfaced) proves posture switch; turret extension swap is atomic in the same PTB. Extension event parsing also requires decoding `TypeName::with_defining_ids<Auth>()` strings. Cost exceeds demo value; deferred.
- Files: src/components/topology/StrategicMapPanel.tsx, src/components/PostureControl.tsx, src/screens/TurretListScreen.tsx
- Diff: ~15 LoC changed across 3 files
- Risk: low (CSS transitions only, no logic changes)
- Gates: typecheck ✅ build ✅

## 2026-03-18 – Transit Proof Builder: Live TribeCheckPassed + TollCollected Events
- Goal: Build minimal PTB + UI path so operator can trigger `request_jump_permit` from the dashboard, generating live transit-related proof events (TribeCheckPassedEvent, TollCollectedEvent) during rehearsal/demo.
- Decisions:
  - **Transit proof is operator-self-testable.** `request_jump_permit` is public (no AdminCap, no verify_sponsor). The operator's own character can request a permit on their own gate, producing real on-chain events observable in Signal Feed.
  - **Free vs toll paths both supported.** `buildTransitProofFreeTx` (no toll configured) and `buildTransitProofWithTollTx` (splits EVE coin for toll payment) cover both demo scenarios.
  - **This does NOT prove actual jump execution.** `JumpPermit` is created and transferred to the character, but `jump_with_permit` (which consumes the permit and moves the character) requires AdminACL co-signature. Transit proof = permit issuance + toll collection, not character movement.
  - **Hostile denial remains unobservable.** MoveAbort from `ETribeNotAllowed` reverts all events — no Signal Feed entry. This is structural and cannot be fixed from the frontend.
- Files: src/lib/transitProofTx.ts (new), src/hooks/useTransitProof.ts (new), src/lib/suiReader.ts (+fetchLinkedGateId), src/screens/GateDetailScreen.tsx (+TransitProofSection)
- Diff: ~200 LoC added across 4 files
- Risk: medium (new PTB builder + hook, no contract changes)
- Gates: typecheck ✅

## 2026-03-18 – Strict Verification Pass + Signal Feed Invalidation Fix
- Goal: Code-traced verification of all 14 demo event paths. Produce definitive yes/no for each claim.
- Decisions:
  - **Transit events (TribeCheckPassed, TollCollected) are triggerable** — `JumpPermit` has `key, store` (not hot potato). `request_jump_permit` is public, no verify_sponsor needed. No PTB builder exists yet. Building one (~30 LoC) would enable live transit proof.
  - **Signal feed invalidation key bug fixed** — `usePosture.ts` invalidated `["signals"]` instead of `["signalFeed"]`. Caused 30s stale state after posture switch. Fixed to `["signalFeed"]`.
  - **14-path verification matrix completed** — 8 paths fully wired (operator-callable with full UI pipeline), 2 triggerable but not wired (transit events), 1 impossible (hostile denied), 2 game-engine-only (turret targeting), 1 invisible (turret extension swap — world event not parsed).
- Files: src/hooks/usePosture.ts, decision-log.md
- Diff: 1 LoC changed
- Risk: low (bug fix)
- Gates: typecheck pass

## 2026-03-18 – Demo Scope Lock: Freeze Excluded, Hostile Denied via Narration, Turret Targeting Untested
- Goal: Lock demo scope based on beat-sheet alignment audit. Stop repeating analysis; capture corrected decisions.
- Decisions:
  - **Freeze excluded from demo.** `freeze_extension_config` is irreversible — freezing turrets permanently breaks posture switching (BouncerAuth ↔ DefenseAuth). The project's own `extension-freeze-safety-guide.md` already says "Do NOT freeze" during demo. Beat sheet narration referencing live freeze must be rewritten.
  - **Hostile denied handled via narration, not UI.** `request_jump_permit` uses `assert!(..., ETribeNotAllowed)`, which aborts the entire tx — no events fire. The MoveAbort trace exists only in the hostile's wallet response, not in the operator's Signal Feed. Evidence is structurally unobservable from the operator dashboard. Beat 4 narration should acknowledge this honestly.
  - **Turret targeting treated as external/untested.** `get_target_priority_list` is game-engine-initiated. `BouncerTargetingEvent` / `DefenseTargetingEvent` fire only when the game engine evaluates targeting with hostiles in proximity. The operator cannot trigger this. Never validated live. Beat 6 narration should frame posture switch as the operator's provable action, not turret targeting.
  - **Focus shifted to reset/rehearsal reliability.** No mock/demo mode. Frontend reads live Sui RPC with no replay capability. Every rehearsal run = real on-chain transactions. A pre-take reset procedure is the critical deliverable.
  - **Functional demo spine confirmed:** wallet connect → structure discovery → extension auth → tribe rule → coin toll → posture switch → trade listing create → trade listing buy. All 8 steps are implemented with functional PTB builders and UI surfaces.
- Files: decision-log.md, operator-validation-checklist.md, civilizationcontrol-demo-beat-sheet.md
- Risk: low (doc-only, no code changes)
- Gates: N/A (documentation)

---

## 2026-03-18 – Network Node Fuel Row: Compact Gauge Layout
- Goal: Replace text-heavy fuel row with scannable gauge-first layout.
- Before: `D1 • 2,897 / 3,571 units • ~12d 2h` — unit counts dominate, no visual gauge.
- After: `[████░░░░] D1 ~12d 2h` — compact horizontal fill gauge, then fuel type, then runtime. Unit counts available as tooltip hover.
- Gauge represents tank fullness only (quantity / maxUnits). Runtime remains separate text.
- Files: NetworkNodeListScreen.tsx (list-row fuel cell)
- Diff: ~15 LoC changed in 1 file
- Risk: low
- Gates: typecheck ✅ build ✅

---

## 2026-03-18 – Denomination Correction & Fuel Type Resolution

### A. EVE/Lux conversion bug fixed
- Root cause: CoinTollEditor labeled on-chain base units as "EVE". Chain stores EVE base units (1 EVE = 10^9 base units, like SUI/MIST). The editor passed `parseInt(input)` raw to the chain and labeled the field "Price in EVE", so "100,000,000 EVE" was actually 0.1 EVE. Lux conversion (÷10M) was correct for base units but wrong given the "EVE" label.
- Corrected exchange rate: **1 EVE = 100 Lux = 1,000,000,000 base units. 1 Lux = 10,000,000 base units.**
- Fix: CoinTollEditor now inputs in human-readable EVE (e.g., "100" = 100 EVE). On submit converts to base units via `eveToBaseUnits()`. On display converts from base units via `baseUnitsToEve()`. Lux shown as `eve × 100`.
- Before: Operator enters "100000000" labeled "EVE" → "100,000,000 EVE (10 Lux)". Confusing/wrong.
- After: Operator enters "100" → "100 EVE (10,000 Lux)". Chain receives 100,000,000,000 base units.
- Denomination flow: User types EVE → UI displays EVE (Lux secondary) → chain receives base units.
- Also centralized inline `/ 10_000_000` in eventParser.ts and SignalEventRow.tsx to use `formatLux()` from currency.ts. Centralized `* 10_000_000` in CreateListingForm.tsx to use `luxToBaseUnits()`.
- Files: CoinTollEditor.tsx, eventParser.ts, SignalEventRow.tsx, CreateListingForm.tsx

### B. Fuel runtime now uses actual fuel type efficiency
- Root cause: `formatRuntime()` computed `quantity × burnRateMs` (treating all fuel as 100% efficiency). On-chain formula: `actual_rate = burnRateMs × efficiency / 100`. D1 Fuel (10%) burns 10× faster than 100% baseline → displayed runtime was ~10× too long.
- Fix: Added `typeId` and `unitVolume` to FuelState. `resolveFuel()` now reads `type_id` (Option<u64>) and `unit_volume` from on-chain Fuel struct. Created `src/lib/fuelRuntime.ts` with efficiency map (D1=10%, D2=15%, EU-40/SOF-40=40%, SOF-80=80%, EU-90=90%), runtime computation, and shared formatting.
- Type resolution: Uses existing `typeCatalog.ts` → `getItemTypeById(typeId)` → name. Efficiency looked up by type_id from hardcoded map (sourced from FuelConfig on-chain values).
- Fallback: If fuel type lookup fails, shows "unknown fuel type" warning instead of fake runtime.
- Display format: `D1 • 3,571 / 3,571 units • ~14d 21h` with fill bar based on tank fullness (quantity/maxUnits).
- Before: "3,571 units (~148d 19h)" — 10× too long for D1.
- After: "D1 • 3,571 / 3,571 units • ~14d 21h" — correct for D1 at 10%.
- Files: domain.ts, suiReader.ts, fuelRuntime.ts (new), NetworkNodeListScreen.tsx, NetworkNodeDetailScreen.tsx, StructureDetailHeader.tsx
- Risk: medium — changes domain type shape, new file
- Gates: typecheck ✅ build ✅

---

## 2026-03-18 – Product Logic Corrections: Posture Toll Decoupling, EVE-Primary UX, Fuel Runtime

### A. Posture switch no longer mutates gate tolls
- Root cause: `PostureControl.tsx` hardcoded `{ price: 100_000_000, treasury: TREASURY_ADDRESS }` (flat 10 Lux) as the toll restore when switching defense → commercial. This silently overwrote any operator-configured per-gate toll values.
- Fix: Posture switching now only records posture state + swaps turret extensions. Gate toll configuration is **not modified** by posture changes — tolls are an independent operator concern managed via the gate policy composer. `postureSwitchTx.ts` no longer contains `set_coin_toll` or `remove_coin_toll` calls. `usePosture.ts` no longer pre-reads gate policies.
- Before: Commercial→Defense removes all tolls. Defense→Commercial restores flat 10 Lux on all gates.
- After: Posture switch preserves existing toll config unchanged in both directions.
- Files: postureSwitchTx.ts, usePosture.ts, PostureControl.tsx

### B. Toll UX converted to EVE-primary / Lux-secondary
- Root cause: CoinTollEditor used Lux as the input unit and displayed Lux-only. EVE Frontier is EVE-denominated; Lux is a derived display unit (1 Lux = 10,000,000 EVE).
- Fix: Input field now accepts raw EVE units. Lux shown as secondary helper text below the input (≈ X Lux). Display readback shows "Price: X EVE (Y Lux)". No conversion math on write — value goes to chain as-is.
- Before: Operator enters "10" meaning 10 Lux → multiplied by 10,000,000 → stored as 100,000,000 EVE.
- After: Operator enters "100000000" meaning 100,000,000 EVE → stored as-is. Lux shown as "≈ 10 Lux".
- Files: CoinTollEditor.tsx

### C. Network node fuel display replaced with truthful runtime
- Root cause: `resolveFuel()` computed `quantity / max_capacity * 100` as a percentage, but `quantity` is a unit count and `max_capacity` is a volume limit (unit_volume × max_units). The ratio is dimensionally wrong — a misleading percentage.
- Fix: Replaced `fuelPercent: number` with `fuel: FuelState` on Structure type. `FuelState` contains `{ quantity, maxCapacity, burnRateMs, isBurning }` read directly from on-chain Fuel struct fields. Display shows "X units loaded" with estimated runtime "~Xd Xh" based on `quantity × burn_rate_in_ms`. Runtime labeled as approximate — actual varies by fuel type efficiency (10-100%).
- Before: "3%" bar (meaningless ratio of units to volume).
- After: "3,571 units (~148d 19h)" at base burn rate.
- Files: domain.ts (+FuelState), suiReader.ts (resolveFuel rewrite), StructureDetailHeader.tsx, NetworkNodeListScreen.tsx, NetworkNodeDetailScreen.tsx

### D. Gate posture visual indicator
- Fix: GateListScreen header now shows a posture TagChip (DEFENSE MODE / COMMERCIAL) read via `usePostureState()`.
- Files: GateListScreen.tsx
- Risk: low

- Diff: ~120 LoC changed across 10 files
- Risk: medium (A touches PTB builder, C changes domain type shape)
- Gates: typecheck ✅ build ✅

---

## 2026-03-17 – TradePost Stale-Extension Recovery Path + Toll Behavior Documentation
- Goal: Add batch and individual re-authorize buttons for TradePosts (SSUs) with stale extensions, mirroring the gate re-auth pattern. Document toll posture-restore behavior.
- Root cause (re-auth): `authorizeSsu()` in useAuthorizeExtension was hardcoded to a single SSU_ID constant. No batch method existed, and no UI buttons triggered re-auth on TradePost screens.
- Root cause (toll): Posture restore (defense → commercial) hardcodes 10 Lux (100,000,000 base units) as the coin toll, overwriting per-gate custom toll values. The Lux ↔ base-unit pipeline (×10,000,000) is mathematically correct — the "10,000 → 10 Lux" observation was the flat restore, not a conversion bug.
- Files: domain.ts (+SsuAuthTarget), useAuthorizeExtension.ts (+authorizeSsus batch, +resetSsu), TradePostListScreen.tsx (+batch authorize button), TradePostDetailScreen.tsx (+individual re-auth button in ExtensionSection), decision-log.md
- Diff: ~70 LoC added across 5 files
- Risk: medium — new PTB construction for SSU extension auth
- Gates: typecheck ✅ build ✅
- Known behavior: Posture commercial restore uses flat 10 Lux toll. Future improvement: read current gate tolls before defense switch, store them, and restore on commercial switch.

---

## 2026-03-17 – AdminCap Ownership Readiness Gate
- Goal: Prevent signer-mismatch transaction failures when AdminCap is owned by publisher wallet instead of operator wallet (fresh-publish authority regression).
- Root cause: `init()` transfers AdminCap to `ctx.sender()` (publisher). After fresh publish, the operator wallet is different from the publisher, so all PTBs referencing AdminCap as owned object fail with "not signed by the correct sender".
- Files: suiReader.ts (fetchAdminCapOwner), useAdminCapOwner.ts (new hook), useOperatorReadiness.ts (+adminCap blocker), PostureControl.tsx (wired ownership check), GateDetailScreen.tsx (policy composer blocker), operator-validation-checklist.md (transfer commands + readiness gate docs), decision-log.md
- Diff: ~75 LoC added across 7 files
- Risk: medium — touches readiness gating + policy composer + posture control
- Gates: typecheck ✅ build ✅
- Transfer required: `sui client transfer --object-id <GateControlAdminCap> --to <operator-wallet>` from publisher wallet
- Follow-ups: Execute AdminCap transfer from publisher wallet, TradePostAdminCap transfer (not currently blocking)

---

## 2026-03-17 – Truthful Extension Detection + Operator UX Fixes
- Goal: Make authorization detection truthful to the fresh EVE publish. Structures with old-package extensions were falsely showing "authorized". Also: treasury address autofill, curated tribe names for Utopia demo.
- Files: domain.ts, suiReader.ts, StructureDetailHeader.tsx, GateListScreen.tsx, GateDetailScreen.tsx, TurretListScreen.tsx, TurretDetailScreen.tsx, TradePostListScreen.tsx, TradePostDetailScreen.tsx, useOperatorReadiness.ts, useAssetDiscovery.ts, CoinTollEditor.tsx, tribes.json, operator-validation-checklist.md
- Diff: ~120 LoC changed across 14 files
- Risk: medium — changes core extension detection logic + UI rendering across all structure types
- Gates: typecheck ✅ build ✅ deploy ✅
- Changes:
  - `extensionAuthorized: boolean` → `extensionStatus: "authorized" | "stale" | "none"` across domain type + all consumers
  - `resolveExtensionAuth` now reads TypeName from on-chain extension field and compares package prefix against CC_ORIGINAL_PACKAGE_ID
  - "STALE — RE-AUTH" tag shown for old-package extensions; re-authorize buttons on both list and detail screens
  - CoinTollEditor: `defaultTreasury` prop auto-fills from connected wallet address
  - tribes.json populated with 20 curated tribes from EVE Frontier API (verified: tribe ID 1000167 = "Clonebank 86" matches our Utopia character)
- Follow-ups: End-to-end re-authorization test, coin toll + tribe rule creation, trade listing creation with EVE

---

## 2026-03-17 – EVE Settlement: Fresh Publish (Compatible Upgrade Blocked)
- Goal: Deploy EVE-settlement Move package on-chain. Compatible upgrade from v2 (Coin\<SUI\>) was rejected by Sui's upgrade verifier — changing public entry function parameter types (`Coin<SUI>` → `Coin<EVE>`) is a breaking signature change. Fresh publish executed instead.
- Files: Published.toml, Move.toml (added `testnet_utopia` env), constants.ts (4 IDs updated), docs/decision-log.md, vendor assets Published.toml (local-only)
- Diff: ~10 LoC config
- Risk: high — new package deployment, all on-chain state is fresh
- Gates: Move build ✅ Move tests 21/21 ✅ publish ✅ (tx: H2qQzsyu25YpmCaHQ2oc9xfPyLMgCYye8wL3sJteSvKL)
- New deployment artifacts:
  - **Package ID**: `0x0f2846d52cdd9c52ec9ced3f0378032718a7ccda013b36d0f6796fcf1bee9adc`
  - **Original ID**: `0x0f2846d52cdd9c52ec9ced3f0378032718a7ccda013b36d0f6796fcf1bee9adc` (same — fresh v1)
  - **GateConfig (shared)**: `0x81e3ef33f489a049df27f5464a3c25dd865991d4e5e9d70a58413feab29d8d4f`
  - **GateControl AdminCap**: `0xeba584423e82098457628c43295ef25a3e048b4cceaa486783e1ee841093f067`
  - **TradePostAdminCap**: `0x1e3b214a00c7094ac77559f37e13199c8e6bb38bd903d6ceeb53d3219d2641cf`
  - **UpgradeCap**: `0x986a2d2061b33a5204411a6b52c123675cdd6993c1c56ccb40cc86cdccdeb04b`
- State impact: **All previous on-chain state (gate policies, listings, extension authorizations) is orphaned.** Fresh state — no old Coin\<SUI\>-typed DFs to clean up. Extensions must be re-authorized against the new package's witness types (GateAuth, TradeAuth, BouncerAuth, DefenseAuth).
- Follow-ups: Re-authorize extensions on demo structures, set demo policies (toll, tribe filter), create demo listings, end-to-end validation with EVE coins

---

## 2026-03-20 – True EVE Settlement Implementation
- Goal: Change actual on-chain settlement token from SUI to EVE. Not a relabeling — the Move contracts now use `Coin<EVE>` from the EVE Frontier assets package. All UI surfaces display Lux (primary) and EVE (secondary). SUI is hidden gas only.
- Files: gate_control.move, trade_post.move, trade_post_tests.move, Move.toml, currency.ts (NEW), constants.ts, tradePostTx.ts, useBuyListing.ts, postureSwitchTx.ts, ListingCard.tsx, CreateListingForm.tsx, CoinTollEditor.tsx, PostureControl.tsx, SignalEventRow.tsx, eventParser.ts, Dashboard.tsx, domain.ts, README.md, docs/README.md, docs/core/spec.md
- Diff: ~150 LoC changed (Move: SUI→EVE, assets dependency), ~200 LoC changed (frontend: EVE coin discovery, Lux conversion, display), ~50 LoC docs
- Risk: high — core contract + settlement token change across full stack
- Gates: Move build ✅ Move tests 21/21 ✅ typecheck ✅
- Decisions:
  - **Settlement token**: `Coin<EVE>` (package `0xf0446b93345c1118f21239d7ac58fb82d005219b2016e100f074e4d17162a465::EVE::EVE`)
  - **Denomination**: 100 Lux = 1 EVE = 1,000,000,000 base units. 1 Lux = 10,000,000 base units.
  - **Move dependency**: `assets = { local = "../../vendor/world-contracts/contracts/assets" }` — no Published.toml needed
  - **PTB change**: Buy listing now uses `tx.splitCoins(tx.object(eveCoinId), ...)` — requires EVE coin object discovery via `suix_getCoins`
  - **Package republish required**: v2→v3 upgrade needed to deploy EVE settlement on Utopia
- Follow-ups: Republish contract (upgrade), update remaining historical docs (architecture, ptb-patterns), end-to-end demo validation with EVE coins

---

## 2026-03-20 – Canonical Denomination & Tribe Sourcing Doctrine
- Goal: Correct Lux/EVE conversion rate, fix display hierarchy (Lux primary, EVE secondary), rework tribe picker to chain-derived IDs with curated name map.
- Files: docs/core/spec.md, docs/strategy/civilization-control/civilizationcontrol-product-vision.md, docs/ux/civilizationcontrol-ux-architecture-spec.md, docs/core/civilizationcontrol-claim-proof-matrix.md, docs/architecture/read-path-architecture-validation.md, docs/architecture/in-game-dapp-surface.md, docs/operations/operator-validation-checklist.md, src/data/tribes.json, src/lib/tribeCatalog.ts, src/components/TribePicker.tsx, scripts/fetch-tribes.mjs
- Diff: ~60 LoC changed (docs), ~40 LoC changed (tribe code)
- Risk: low — doc corrections + tribe picker UX fix, no contract changes
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Lux/EVE rate corrected**: 100 Lux = 1 EVE (was incorrectly 10,000 Lux = 1 EVE across all docs)
  - **Display hierarchy**: Lux is PRIMARY player-facing denomination. EVE is secondary (demo narration, proof overlays). No SUI labels in player-facing UI.
  - **Tribe sourcing**: Chain/RPC is source of truth for tribe IDs (Character.tribe_id). Curated name map for active environment. Stillness API is optional enrichment only. Fallback to "Tribe #<id>".
  - **TribePicker**: Now accepts direct numeric tribe ID entry alongside autocomplete search. tribes.json is environment-specific curated map (empty for Utopia until populated).
  - **Turret controls**: Future tranche. Current scope is visibility only (power, stance, behavioral explainer). No fake mutable policy controls.
  - **Denomination code changes deferred**: UI still displays raw MIST values in several places. Fix scheduled for separate tranche.

---

## 2026-03-19 – Infrastructure-Control Doctrine Revision (Direct Power + Tribes Autocomplete)
- Goal: Add direct online/offline power control for ALL web-controllable structure types (gates, turrets, SSUs/trade posts, network nodes), bulk power operations from list screens, posture hardening, tribe autocomplete selector replacing raw numeric input.
- Files:
  - `src/lib/structurePowerTx.ts` (NEW: generic PTB builders for all structure online/offline)
  - `src/hooks/useStructurePower.ts` (NEW: generic power hook — single, batch, node-online)
  - `src/screens/TurretDetailScreen.tsx` (NEW: per-turret power control + extension info)
  - `src/screens/NetworkNodeListScreen.tsx` (NEW: node list with bulk online, fuel, attached counts)
  - `src/screens/NetworkNodeDetailScreen.tsx` (NEW: per-node online control, attached structures)
  - `src/screens/TurretListScreen.tsx` (REWRITTEN: +bulk online/offline, linked rows to detail page)
  - `src/screens/GateListScreen.tsx` (UPDATED: +bulk online/offline buttons)
  - `src/screens/GateDetailScreen.tsx` (UPDATED: migrated to useStructurePower from deprecated hook)
  - `src/screens/TradePostDetailScreen.tsx` (UPDATED: +PowerControlSection for SSU online/offline)
  - `src/screens/TradePostListScreen.tsx` (UPDATED: +bulk online/offline buttons)
  - `src/components/PostureControl.tsx` (UPDATED: fixed success label inversion via useRef)
  - `src/hooks/usePosture.ts` (UPDATED: +parseMoveAbort for friendly error messages)
  - `src/components/TribePicker.tsx` (NEW: autocomplete tribe selector)
  - `src/components/TribeRuleEditor.tsx` (UPDATED: replaced numeric input with TribePicker)
  - `src/lib/tribeCatalog.ts` (NEW: tribes catalog with search/lookup)
  - `src/hooks/useTribe.ts` (NEW: tribe search/lookup hooks)
  - `src/data/tribes.json` (NEW: static tribe catalog from World API)
  - `scripts/fetch-tribes.mjs` (NEW: fetch script for tribes)
  - `src/types/domain.ts` (UPDATED: +Tribe interface)
  - `src/App.tsx` (UPDATED: +routes for turret detail, node list/detail)
  - `src/components/Sidebar.tsx` (UPDATED: +Network Nodes nav, structurePath for network_node)
  - `package.json` (UPDATED: +generate:tribes script)
  - DELETED: `src/hooks/useGateOnlineOffline.ts`, `src/lib/gateOnlineOfflineTx.ts` (superseded)
- Diff: ~600 LoC added, ~80 LoC removed
- Risk: medium — new command surfaces, generic power infra, no contract changes
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Direct power control is now canonical** — posture remains the network-wide behavioral layer, but operators also get per-structure and bulk power toggles for all types.
  - **NWN offline not implemented for web** — the hot-potato `OfflineAssemblies` pattern requires knowing all connected assembly types for chained offline calls. Documented as in-game-only.
  - **Generic power infra** — `useStructurePower` replaces per-type hooks. MODULE_MAP dispatches to correct Move modules.
  - **Tribes autocomplete** — replaces raw numeric input. Static JSON catalog from World API v2/tribes (20 entries). TribePicker with search, keyboard nav, displays name + short tag + ID.
- Follow-ups: Preview deploy, live-test bulk power operations, verify tribes catalog refresh cadence.

---

## 2026-03-19 – AdminCap Transfer + Posture Readiness Layer
- Goal: Fix authority model mismatch (AdminCap owned by publisher wallet, not operator) and add truthful readiness gating to PostureControl so the posture switch only activates when actually executable.
- Files:
  - On-chain: AdminCap (0xaedc…3e) transferred publisher→operator; TradePostAdminCap (0x1ffb…06) transferred publisher→operator
  - `src/hooks/useOperatorReadiness.ts` (NEW: readiness check — wallet, turret extension status, gate extension status)
  - `src/hooks/useAuthorizeExtension.ts` (UPDATED: +batch turret BouncerAuth authorization via `authorizeTurrets()`)
  - `src/components/PostureControl.tsx` (UPDATED: readiness gate — blockers UI, disabled switch when not ready)
  - `src/screens/TurretListScreen.tsx` (UPDATED: +batch "Authorize BouncerAuth" button + TxFeedbackBanner)
  - `src/screens/Dashboard.tsx` (UPDATED: pass isConnected to PostureControl)
- Diff: +85 LoC new hook, ~80 LoC additions across 4 files
- Risk: medium — authority model fix (on-chain transfer), new UX gating for critical posture path
- Gates: typecheck ✅ build ✅
- Decisions:
  - **AdminCap must be owned by operator wallet** — contract init() sends AdminCap to publisher. Publisher and operator are different wallets. Posture PTB requires sender to own AdminCap AND match character_address. Transfer is the correct fix (not delegation).
  - **Readiness gating over optimistic UI** — PostureControl now shows specific blockers (turrets without extensions, wallet not connected) instead of silently failing. Switch button disabled until all blockers cleared.
  - **Batch turret authorization** — all unauthorized turrets authorized in a single PTB (borrow/authorize/return per turret). BouncerAuth type origin is CC_PACKAGE_ID (v2, where module was introduced).
- Follow-ups: Live test posture switch with operator wallet after turrets are authorized.

---

## 2026-03-19 – Package v2 Upgrade + Type-Origin Discovery + Doc Truth Sweep
- Goal: Convert TurretControl+Posture tranche from "code-proven" to "live-runtime-validated / documentation-truthful / demo-usable." Republish package with new modules, validate on-chain, fix all stale turret doctrine.
- Files:
  - `contracts/civilization_control/Published.toml` (AUTO-UPDATED: v2 address, version 2, toolchain 1.67.2)
  - `src/constants.ts` (UPDATED: CC_PACKAGE_ID → v2 address; +CC_ORIGINAL_PACKAGE_ID for v1 type origins)
  - `src/lib/eventParser.ts` (UPDATED: v1 module events use CC_ORIGINAL_PACKAGE_ID, v2 module events use CC_PACKAGE_ID)
  - `src/lib/suiReader.ts` (UPDATED: per-module package IDs for type filters + event queries; +dummy_field fix for PostureKey)
  - `src/lib/postureSwitchTx.ts` (UPDATED: CC_PACKAGE_ID for targets + type args — all v2 types)
  - `src/hooks/useAuthorizeExtension.ts` (UPDATED: CC_ORIGINAL_PACKAGE_ID for GateAuth/TradeAuth type args — v1 types)
  - 13 documentation files: spec.md, README.md, product-vision.md, implementation-plan.md, strategy-memo.md, demo-beat-sheet.md, assumption-registry.md, must-work-claim-registry.md, demo-evidence-appendix.md, day1-checklist.md, narration-direction-spec.md, PTB docs (4), architecture docs (3)
- Diff: ~60 LoC code changes, ~100 LoC doc replacements across 13+ files
- Risk: high — on-chain upgrade, type-origin nuance affects every RPC query and PTB type arg
- Gates: move build ✅ move tests ✅ (21/21) typecheck ✅ build ✅ live validation ✅
- Decisions:
  - **Dual-constant pattern for Sui type origins after upgrade** — v1-introduced modules (gate_control, trade_post) have type origin = v1 package address; v2-introduced modules (posture, turret_bouncer, turret_defense) have type origin = v2 package address. CC_PACKAGE_ID (v2) used for MoveCall targets + v2 types; CC_ORIGINAL_PACKAGE_ID (v1) used for v1 types/events. Empirically verified via DF queries, event queries, and dynamic field listing.
  - **Empty struct DF serialization** — unit structs like PostureKey require `{dummy_field: false}` in Sui RPC getDynamicFieldObject queries. Without it: "Missing field dummy_field" error.
  - **Upgrade via `sui client upgrade -e testnet_utopia`** — the `-e` environment flag is mandatory when Published.toml uses [environments] sections. Without it: "Cannot upgrade package without having a published id."
- Live validation:
  - set_posture(mode=0) on GateConfig: tx B6X4YaQ1bzjqYZePMpGtyxT5RE1HrTJrTt3pRHHbQvYd ✅
  - PostureKey DF read returns PostureState{mode: 0} ✅
  - PostureChangedEvent query returns event ✅
  - TribeRuleKey DF read (v1 origin) ✅
- Deployment artifacts:
  - v2 PackageID: 0x698d78b09a7009083ee71e026711ac598ed5f67217f1339ad76505bf58a2c5a5
  - Upgrade tx: AFeJrvreGKeuUbGTuZ6vTZFw6iP8MDRaiRPWWnuuqozc
  - v1 (original): 0xb41a7ce1b492064c09a9545a16edce1f73ac069f5a85712f0eadc7e3bb246a04
  - UpgradeCap: 0x1dea9aedbd461969de0358da66368bd2cc3a140983c17a205ee0ec66ce09efa3
- Follow-ups:
  - Extension freeze assessment post-demo (leave unfrozen during iteration)
  - Demo capture for Beat 6 defense mode moment with live on-chain posture

---

## 2026-03-18 – TurretControl + Posture Presets (Move + Frontend)
- Goal: Implement operator-facing posture switching — one action, one transaction, network-wide gate + turret state change. Proves Beat 6 demo moment: Defense Mode.
- Files:
  - `contracts/civilization_control/sources/turret_bouncer.move` (NEW: bouncer extension — commercial posture targeting)
  - `contracts/civilization_control/sources/turret_defense.move` (NEW: defense extension — hostile-aggressive targeting)
  - `contracts/civilization_control/sources/posture.move` (NEW: on-chain posture state as DF on GateConfig)
  - `contracts/civilization_control/sources/gate_control.move` (UPDATED: +public(package) config_uid/config_uid_mut accessors)
  - `src/lib/postureSwitchTx.ts` (NEW: single-PTB builder for atomic posture switch)
  - `src/hooks/usePosture.ts` (NEW: posture read + switch mutation hooks)
  - `src/components/PostureControl.tsx` (NEW: operator posture command surface)
  - `src/screens/TurretListScreen.tsx` (NEW: turret inventory screen with posture badges)
  - `src/components/topology/StrategicMapPanel.tsx` (UPDATED: reads on-chain posture, turret glyphs posture-aware)
  - `src/screens/Dashboard.tsx` (UPDATED: PostureControl integrated)
  - `src/components/Sidebar.tsx` (UPDATED: +Turrets nav item + turret deep links)
  - `src/App.tsx` (UPDATED: +/turrets route)
  - `src/lib/suiReader.ts` (UPDATED: +fetchPosture, expanded event module list)
  - `src/lib/eventParser.ts` (UPDATED: +3 new event types: PostureChanged, BouncerTargeting, DefenseTargeting)
  - `src/types/domain.ts` (UPDATED: +PostureMode, PostureState, TurretSwitchTarget)
- Diff: +~700 LoC added, ~40 replaced
- Risk: high — new Move modules (2 turret extensions + posture), new write path (PTB), new core UI surface
- Gates: typecheck ✅ build ✅ move build ✅ move tests ✅ (21/21)
- Decisions:
  - **Turrets always online** — old assumption was turrets offline in commercial, online in defense. New doctrine: turrets always powered, posture changes which extension is active (bouncer vs defense targeting)
  - **Two-extension swap pattern** — no deauthorize/clear function exists in world-contracts; once configured, swap-only. BouncerAuth (commercial: aggressors +10000, non-tribe +1000) vs DefenseAuth (defense: aggressors +15000, non-tribe +5000)
  - **BehaviourChangeReason is module-private** — Move 2024 enums cannot be constructed or matched outside defining module. Targeting redesigned to use only `is_aggressor` (bool) + `character_tribe` (u32), which captures ~95% of default behavior
  - **Posture state as DF on GateConfig** — reuses existing shared object; turret has no uid() accessor so cannot host DFs. PostureKey singleton DF with PostureState{mode: u8}
  - **Topology now reads real on-chain posture** — StrategicMapPanel no longer has local toggle state; posture indicator is display-only reflecting chain truth
- Follow-ups:
  - Package republish required (new modules) — CC_PACKAGE_ID will change
  - PriorityListUpdatedEvent observability: custom extensions must emit equivalent events (BouncerTargetingEvent, DefenseTargetingEvent already included)
  - Demo capture for Beat 6 defense mode moment
  - Extension freeze after initial authorize (prevents rugpull)

---

## 2026-03-17 – Item-Type Catalog + SSU Inventory Browser + Type Resolution
- Goal: Eliminate raw type-ID entry in TradePost seller flow by (1) shipping a build-time item-type catalog from the World API, (2) implementing SSU inventory reading from chain, and (3) threading resolved item names through all TradePost surfaces and Signal Feed.
- Files:
  - `scripts/fetch-types.mjs` (NEW: offline World API paginator, ~80 LoC)
  - `src/data/itemTypes.json` (NEW: 390 item types, 99 KB bundled artifact)
  - `src/lib/typeCatalog.ts` (NEW: sync index module — byId, byName, search, resolveItemTypeName)
  - `src/hooks/useItemType.ts` (NEW: React hooks for catalog search/lookup)
  - `src/hooks/useSsuInventory.ts` (NEW: TanStack Query hook for SSU inventory enumeration)
  - `src/components/InventoryBrowser.tsx` (NEW: inventory item selector with resolved names)
  - `src/components/CreateListingForm.tsx` (REWRITE: inventory-backed item selection replaces raw type-ID input; manual entry demoted to advanced fallback)
  - `src/components/ListingCard.tsx` (UPDATED: displays resolved item name as primary, raw ID as subdued metadata)
  - `src/screens/TradePostDetailScreen.tsx` (UPDATED: wires SSU inventory to create listing form)
  - `src/lib/suiReader.ts` (UPDATED: +fetchSsuInventory, +parseInventoryItems — reads inventory DFs via getDynamicFieldObject)
  - `src/lib/eventParser.ts` (UPDATED: trade events now resolve item names in descriptions)
  - `src/types/domain.ts` (UPDATED: +ItemType, +InventoryEntry, +InventorySlot interfaces)
  - `package.json` (UPDATED: +generate:types script)
- Diff: +~550 LoC added, ~120 replaced
- Risk: medium — new chain read path (inventory DFs) and new create listing UX flow
- Gates: typecheck ✅ build ✅
- Decisions:
  - Build-time static catalog chosen over runtime browser fetch — mirrors proven solar-system pattern, zero runtime dependency on World API availability
  - World API v2/types returns 390 types with offset/limit pagination; all fit in one 500-limit page but script paginates defensively
  - Fields preserved: typeId, name, description, mass, volume, portionSize, groupName, groupId, categoryName, categoryId
  - iconUrl and radius dropped (empty/unused in current API)
  - Unknown type IDs degrade to "Unknown Type #12345" — never crash, never blank
  - SSU inventory read path: StorageUnit.inventory_keys → getDynamicFieldObject per key → parse VecMap<u64, ItemEntry>
  - Manual raw type-ID entry retained as toggled fallback ("Manual entry →") for edge cases
  - Listing creation validates quantity against inventory stock when using inventory selection
- Follow-ups:
  - TurretControl / Posture Presets is the correct next tranche (S14b, S44)
  - SSU inventory read path should be smoke-tested against live Utopia SSU with actual items
  - Chunk splitting for build size (solar systems 4.4 MB dominates — not caused by this tranche)
  - Consider periodic catalog refresh automation (npm run generate:types)

---

## 2026-03-16 – Seller-Side Listing Create + Cancel tranche
- Goal: Complete the TradePost write surface by adding seller-side listing creation and cancellation from the browser. Item type entered manually (SSU inventory browser deferred).
- Files: `src/lib/tradePostTx.ts` (+buildCreateListingTx, +buildCancelListingTx), `src/hooks/useCreateListing.ts` (NEW: mutation hook), `src/hooks/useCancelListing.ts` (NEW: mutation hook), `src/components/CreateListingForm.tsx` (NEW: item type + qty + price form), `src/components/ListingCard.tsx` (extended: cancel button for seller-owned listings), `src/components/TxFeedbackBanner.tsx` (upgraded: action-specific successLabel/pendingLabel), `src/screens/TradePostDetailScreen.tsx` (Create Listing section + cancel wiring), `src/screens/GateDetailScreen.tsx` (action-specific feedback labels)
- Diff: +~260 LoC added, ~80 replaced
- Risk: med (new write paths — create_listing+share_listing and cancel_listing PTBs)
- Gates: typecheck ✅ build ✅
- Limitations: Item type ID is manual entry (no inventory browser yet). Price entered in SUI, converted to MIST. Full-item listings only (no split_item).
- Follow-ups: SSU inventory browser for item selection, TurretControl posture module, demo capture, narrative label audit

---

## 2026-03-16 – Signal Feed + Event Polling tranche
- Goal: Replace placeholder Signal Feed with real on-chain event-driven content. Implement event polling for all 8 CivilizationControl custom events, parse into categorized signals, display in dedicated feed and dashboard.
- Files: `src/types/domain.ts` (+SignalEvent, SignalCategory, SignalVariant), `src/lib/eventParser.ts` (NEW: event type map + parser for 8 CC events), `src/lib/suiReader.ts` (+fetchRecentEvents via MoveModule queries), `src/hooks/useSignalFeed.ts` (NEW: TanStack Query hook with 30s polling + invalidation), `src/components/SignalEventRow.tsx` (NEW: shared signal row with variant styling), `src/screens/ActivityFeedScreen.tsx` (REWRITTEN: real feed with category filters), `src/screens/Dashboard.tsx` (wired real signals into Recent Telemetry + revenue metric)
- Event types supported: TribeCheckPassedEvent, TollCollectedEvent, TribeRuleSetEvent, CoinTollSetEvent, RuleRemovedEvent, ListingCreatedEvent, ListingPurchasedEvent, ListingCancelledEvent
- Categories: Governance (rule CRUD), Trade (listing lifecycle), Transit (passage + tolls), Status (reserved for future)
- Approach: Polling via `suix_queryEvents` with `MoveModule` filter (2 RPC calls per cycle), 30s interval, TanStack Query cache
- Diff: +~440 LoC added, ~80 replaced
- Risk: low (read-only event queries, no write path changes)
- Gates: typecheck ✅ build ✅
- Follow-ups: Create listing flow (seller side), turret posture module, WebSocket subscription upgrade, revenue aggregation over 24h window

---

## 2026-03-16 – TradePost Buy Flow tranche
- Goal: Implement browser-based marketplace listing discovery and buy flow (discover live listings via events, display in listing browser, execute buy PTB, tx feedback).
- Files: `src/types/domain.ts` (+Listing type), `src/lib/suiReader.ts` (+fetchListings via queryEvents→multiGetObjects), `src/lib/tradePostTx.ts` (NEW: buy PTB builder with coin split + item transfer), `src/hooks/useListings.ts` (NEW: TanStack Query read hook), `src/hooks/useBuyListing.ts` (NEW: mutation hook), `src/components/ListingCard.tsx` (NEW: listing display + buy action), `src/screens/TradePostDetailScreen.tsx` (rewritten with MarketplaceSection + buy flow)
- Diff: +~350 LoC added, ~90 replaced
- Risk: med (new write path — buy() consumes shared Listing by value, splits coin, transfers Item)
- Gates: typecheck ✅ build ✅
- Follow-ups: Create listing flow (seller side), cancel listing, batch posture switch (S46), event subscription

## 2026-03-16 – Gate Policy Composer + Live Rule Deploy tranche
- Goal: Implement browser-based gate policy authoring (read on-chain rules, edit, deploy via signed tx, see feedback).
- Files: `src/constants.ts` (+GATE_CONFIG_ID, GATE_ADMIN_CAP_ID), `src/types/domain.ts` (+GatePolicy types), `src/lib/suiReader.ts` (+fetchGateRules), `src/lib/gatePolicyTx.ts` (NEW: PTB builders), `src/hooks/useGatePolicy.ts` (NEW: read hook), `src/hooks/useGatePolicyMutation.ts` (NEW: mutation hook), `src/components/TribeRuleEditor.tsx` (NEW), `src/components/CoinTollEditor.tsx` (NEW), `src/components/TxFeedbackBanner.tsx` (NEW), `src/screens/GateDetailScreen.tsx` (rewritten with live data + composer)
- Diff: +~600 LoC added, ~165 replaced
- Risk: med (new write path via AdminCap, but AdminCap ownership is gated to operator wallet)
- Gates: typecheck ✅ build ✅
- Follow-ups: TradePost buy flow (S24), batch posture switch (S46), event subscription

## 2026-03-16 – Static solar-system catalog: build-time snapshot replaces runtime API fetch
- Goal: Fix broken autocomplete (no search results) and eliminate runtime dependency on paginated World API.
- Root cause: Two bugs — (1) API field names are `id`/`name` but code read `solarSystemId`/`solarSystemName` → every field `undefined`; (2) API uses `limit`/`offset` pagination, code sent `page`/`pageSize` → only 100 rows returned.
- Fix: Replaced runtime fetch+cache architecture with build-time static snapshot:
  - `scripts/fetch-solar-systems.mjs` — offline Node script, fetches all ~24.5k systems via correct `limit`/`offset` pagination, maps to SolarSystem shape, writes `src/data/solarSystems.json`.
  - `src/lib/solarSystemCatalog.ts` — imports static JSON at build time, builds indexes synchronously at module init. Zero runtime fetch.
  - `src/hooks/useSolarSystem.ts` — simplified: no `useQuery`, no loading states.
  - `src/App.tsx` — removed prefetch call (no longer needed).
  - `package.json` — added `generate:solar-systems` script.
- Refresh: Run `npm run generate:solar-systems` then rebuild to update the dataset.
- Files: `scripts/fetch-solar-systems.mjs` (new), `src/data/solarSystems.json` (new, 4.4 MB, 24,502 systems), `src/lib/solarSystemCatalog.ts`, `src/hooks/useSolarSystem.ts`, `src/App.tsx`, `package.json`
- Diff: +119 / -144
- Risk: medium (architecture change to data ingestion path)
- Gates: typecheck ✅ build ✅ preview ✅ (ERM-JB3 confirmed in dataset)

---

## 2026-03-16 – Spatial positioning tranche: uniform-scale normalization + label context
- Goal: Make topology node positioning spatially truthful when solar system assignments exist
- Changes:
  1. `normalizeCoords` now uses uniform scaling (same scale both axes) to preserve relative distances and orientations. Accepts `aspectRatio` param for non-square viewports.
  2. Overlay labels show assigned solar system name below node name.
  3. Unpositioned nodes show "· unassigned" indicator; positioned/unpositioned groups visually separated.
  4. Link lines only connect spatially-positioned nodes (not unassigned ones).
- Context: Catalog ingestion, coordinate transform `(x,y,z)→(x,-z)`, SolarSystemPicker autocomplete, pin persistence to localStorage, and `computeNodePositions` pipeline all already existed and were fully wired. The gap was spatial distortion from independent X/Y normalization.
- Files: `src/lib/coordinates.ts`, `src/components/topology/StrategicMapPanel.tsx`
- Diff: +91 / -27
- Risk: low (UI-only, no data/contract changes)
- Gates: typecheck ✅ build ✅ preview ✅

---

## 2026-03-16 – Topology doctrine conformance: color tokens + layout + turret stacking
- Goal: Align Strategic Network panel with SVG Topology Layer Spec §4 (color doctrine) and §6 (cluster layout)
- Mismatches fixed (8 items):
  1. Green used for "online" → muted teal `hsl(175, 45%, 50%)` — green reserved for economic events only
  2. Node overlay label `text-green-500/70` → teal `hsl(175,45%,50%)`
  3. Halo fills used green → teal for online, red for offline
  4. Grid at 10% opacity → 4% (governance schematic, not star map)
  5. No child ordering → Gates first (12 o'clock CW), then TradePosts, then Turrets
  6. No turret stacking → 1-3 individual, 4+ collapse with `+N` badge
  7. Gates same size as other glyphs → larger (24 vs 20) with thicker link lines
  8. Missing `--topo-state-online`, `--topo-glyph-neutral` tokens → added 13 spec-conformant tokens
- Files: `src/styles/theme.css`, `src/components/topology/StrategicMapPanel.tsx`
- Diff: ~50 LoC added, ~40 LoC removed
- Risk: low (UI-only, no data/contract changes)
- Gates: typecheck ✅ build ✅

---

## 2026-03-16 – Fix asset discovery: wrong module name + missing pagination
- Goal: Fix wallet→asset discovery that was stuck at "Resolving chain state…" after wallet connect
- Root cause: `fetchPlayerProfile` used type filter `player::PlayerProfile` — correct module is `character::PlayerProfile`. Query returned empty, discovery silently returned no structures.
- Secondary fix: `fetchOwnerCaps` only fetched page 1 (50 results). Character owns 70 OwnerCaps across 2 pages. Added cursor-based pagination loop.
- Tertiary fix: PlayerProfile has no `name`/`tribe_id` — those live on the shared Character object. Added a second RPC call to resolve them.
- UI fix: Sidebar "Resolving chain state…" did not distinguish loading from loaded-empty. Now shows "No structures discovered" when query completes with empty results.
- Diagnostics: Added console.log breadcrumbs to `discoverAssets` for step-by-step visibility.
- Files: `suiReader.ts`, `Sidebar.tsx`, `App.tsx`
- Diff: ~60 LoC added, ~30 LoC removed
- Risk: medium (data layer fix, read-only)
- Gates: typecheck ✅ build ✅ preview ✅
- Evidence: Live RPC verified full chain — 70 OwnerCaps discovered, structures resolve correctly

---

## 2026-03-17 – Data Wiring Tranche: suiReader fixes + wallet-aware UI
- Goal: Wire live chain data into the dashboard shell — correct on-chain field parsing, thread wallet connection state through UI, compute real metrics
- Files: `suiReader.ts` (all helpers rewritten), `useAssetDiscovery.ts` (isConnected + enforcedDirectives), `App.tsx` (prop threading), `Sidebar.tsx` (wallet-aware inventory), `Dashboard.tsx` (wallet-aware status pill + profile name)
- Diff: ~80 LoC added, ~40 LoC removed
- Risk: medium (data layer rewrite, but read-only — no contract or state changes)
- Gates: typecheck ✅ build ✅ preview ✅
- Key changes:
  - suiReader: resolveStatus, resolveName, resolveFuel, resolveExtensionAuth all rewritten for actual on-chain JSON shape; new resolveNetworkNodeId extracts energy_source_id
  - enforcedDirectives now computed from structures with extensionAuthorized=true
  - Sidebar: shows "Connect wallet" / "Resolving…" / real inventory based on connection state
  - Dashboard: status pill differentiates disconnected/resolving/active; subtitle shows character name when profile is available
- Preview: https://feature-dashboard-foundation.civilizationcontrol.pages.dev

---

## 2026-03-17 – Visual Fidelity & Topology Shell Correction Pass
- Goal: Correct biggest visual/structural mismatches between preview and Figma/UX spec before further feature wiring
- Files: `Dashboard.tsx` (restructured), `MetricCard.tsx` (hero variant), `StrategicMapPanel.tsx` (enriched), `Header.tsx` (network indicator), `ActivityFeedScreen.tsx` (heading fix), `theme.css` (grid opacity)
- Diff: ~250 LoC added, ~90 LoC removed
- Risk: low (pure presentational, no contract/state changes)
- Gates: typecheck ✅ build ✅
- Key corrections:
  - Dashboard: 4-col uniform → 5-col with hero revenue card (col-span-2) + lower signals/alerts section
  - Topology: HTML overlay node labels with backdrop-blur, posture toggle (Commercial/Defensive), defense overlay, subtle halos
  - Header: Added "Utopia Testnet" network indicator
  - Theme: Grid opacity 6% → 10% via --topo-grid token

---

## 2026-03-17 – UI Follow-up Screens + Cloudflare Preview (Frontend Tranche 1b)
- Goal: Complete screen follow-ups from dashboard foundation — Gate list/detail, TradePost list/detail, Activity feed; wire into App.tsx routes; deploy CF Pages preview
- Files: new `src/screens/TradePostDetailScreen.tsx`, `src/screens/ActivityFeedScreen.tsx`, `src/components/StructureDetailHeader.tsx`, `src/screens/GateListScreen.tsx`, `src/screens/GateDetailScreen.tsx`, `src/screens/TradePostListScreen.tsx`; modified `src/App.tsx` (route wiring)
- Diff: ~550 LoC added, ~30 LoC removed (placeholder routes)
- Risk: low (UI screens, no contract or state changes)
- Gates: typecheck ✅ build ✅ CF deploy ✅
- Design choices:
  - StructureDetailHeader shared between gate/tradepost detail screens
  - GateDetailScreen shows policy config (tribe filter + coin toll) when extension authorized
  - ActivityFeedScreen is a structured placeholder with event taxonomy (awaiting Sui event subscription)
  - Governance vocabulary: "Signal Feed", "Commerce Post", "Inventory Holdings", "Trade Extension"
- Cloudflare: preview at `https://feature-dashboard-foundation.civilizationcontrol.pages.dev`
- Follow-ups: Wire Sui event subscription to Activity feed, deep inventory read for TradePost, Settings screen

---

## 2026-03-17 – Dashboard Foundation (Frontend Tranche 1)
- Goal: Build the full dashboard/frontend foundation: design tokens, layout shell, asset discovery, topology visualization, spatial pinning, solar system catalog
- Files: 23 new/modified files in `src/` — App.tsx routing shell, theme.css/index.css (Tailwind v4), types/domain.ts, lib/ (suiReader, solarSystemCatalog, spatialPins, coordinates, utils), hooks/ (useAssetDiscovery, useSolarSystem, useSpatialPins), components/ (Header, Sidebar, MetricCard, StatusDot, TagChip, SolarSystemPicker, NodeLocationPanel, Glyphs.tsx, StrategicMapPanel.tsx), screens/ (Dashboard, AuthHarness)
- Diff: ~1800 LoC added
- Risk: medium (new frontend layer, no contract changes)
- Gates: typecheck ✅ build ✅
- Design choices:
  - Tailwind CSS v4 with `@import "tailwindcss" source(none)` + explicit `@source` for tree-shaking
  - Design tokens reconciled from Figma export + SVG Topology Layer Spec §4 (ISA-101/MIL-STD-2525D overlay colors)
  - Coordinate transform: `(x,y,z) → render(x, -z)` per Scetrov docs
  - SuiJsonRpcClient from `@mysten/sui/jsonRpc` (replaced deprecated SuiClient)
  - useConnection from `@evefrontier/dapp-kit` for wallet (not useDAppKit)
  - Solar system catalog: World API v2 with 1000-page pagination + in-memory cache
  - Spatial pins: localStorage-persisted Map for manual solar-system-to-node assignment
  - Old auth harness preserved as `screens/AuthHarness.tsx`
- Follow-ups: Gate detail screen, TradePost detail screen, activity feed, Cloudflare preview deploy

---

## 2026-03-16 – JWT Nonce Mismatch Diagnosis + Error Handling
- Goal: Debug "JWT nonce mismatch" error in owner-auth harness; determine if harness or Vault issue
- Files: `src/App.tsx` (StatusDisplay improved)
- Diff: +18 LoC
- Risk: low (UI error messaging only)
- Gates: typecheck ✅ build ✅
- Root cause: EVE Vault internal state — device data (ephemeralKey + randomness + epoch) regenerated after login, causing stored nonce to diverge from JWT's nonce. This is a known race condition inside `vendor/evevault/packages/shared/src/stores/deviceStore.ts` `getZkProof()` (L578). **Not fixable from dApp code.** Recovery requires full Vault sign-out + sign-in to re-derive both JWT and device data atomically.
- Changes: Added nonce-mismatch-specific recovery instructions in the UI error display
- Follow-ups: User must sign out of EVE Vault and sign back in to clear stale state, then retry

---

## 2026-03-12 – Browser Auth Harness for Owner-Signed Transactions
- Goal: Build minimal browser harness to execute the two blocked authorize_extension PTBs via EVE Vault wallet signing (game wallet not in local Sui keystore)
- Files: `src/` (10 new files), `package.json`, `tsconfig.json`, `vite.config.mts`, `index.html`, `.env`
- Diff: ~350 LoC added (new harness scaffold)
- Risk: low (operational tooling only, no contract changes, no production deploy)
- Gates: typecheck ✅ build ✅
- Design choices: Standard signing (not sponsored) — owner operations don't use `verify_sponsor`; `tx.object()` auto-resolves `Receiving<T>` types; `signAndExecuteTransaction` (not `signAndExecute`) is the correct DAppKit method; `optimizeDeps.entries` limited to `index.html` to prevent Vite scanning vendor `.html` files
- Follow-ups: Run harness in browser with EVE Vault to execute authorize_extension on gate + SSU

---

## 2026-03-12 – Hour 5 Live Integration Execution (Utopia)
- Goal: Execute smallest credible live mutation sequence to prove CivilizationControl is wired into real Utopia assets
- Files: `docs/operations/day1-validation.md` (Hour 5 execution section added)
- Diff: +120 LoC docs
- Risk: medium (on-chain state mutations — tribe rule DF + shared Listing object)
- Gates: N/A (no code changes, PTB-only operations)
- Results:
  - Phase 3 `set_tribe_rule`: tribe=1000167 on gate `0xf130…` — TX `DXGsGVq8rVeGzUJkcRRkxMW4NvuZjUPY6uhBR5SyKtiK` ✅
  - Phase 4 `create_listing` + `share_listing`: item=78437, qty=1, price=1000 — TX `C3t5MJ5xtUsNyUe1B6nERFUYw2AHja4EbyNjQFNFMcJZ` ✅
  - Phases 1-2 (authorize extensions): PTBs prepared, blocked on game wallet `0xad02…` not in local keystore
- Follow-ups: Import game wallet or use EVE Vault to execute extension authorization; then test end-to-end jump/trade flows

---

## 2026-03-12 – Hour 5 Asset Discovery (Utopia)
- Goal: Map all live Utopia assets for wallet `0xad02…fb71` from chain data alone; select test candidates for GateControl + TradePost integration
- Files: `docs/operations/day1-validation.md` (Hour 5 section added)
- Diff: +130 LoC docs
- Risk: low (read-only chain discovery, no mutations)
- Gates: N/A (no code changes)
- Findings: 70 OwnerCaps (12 gates, 5 SSUs, 41 turrets, 9 nodes, 2 assemblies, 1 character). Primary test pair: Gate `0xf130…` + SSU `0x73a2…` (ONLINE, 5 items) co-located at Node `0x8bad…`
- Follow-ups: Authorize extensions via PTB (requires wallet signing); test tribe rule + listing creation

---

## 2026-03-12 – Package Published to Utopia Testnet
- Goal: Publish civilization_control package (gate_control + trade_post) to Utopia testnet for integration testing
- Files: `contracts/civilization_control/Published.toml` (generated), `contracts/civilization_control/Move.lock` (updated), `docs/operations/day1-validation.md` (publish record added)
- Diff: +40 LoC docs, generated publish metadata
- Risk: medium (first on-chain deployment)
- Gates: move-build ✅ move-test ✅ (21/21) publish ✅ (tx digest `EBU5T9cDymgUnyGTdtXkfBWuUmfWLKEMLJT5VXU8p5QU`)
- Artifacts: Package `0xb41a…6a04`, GateConfig (shared) `0x8655…45f2`, GateControl AdminCap `0xaedc…9b3e`, TradePostAdminCap `0x1ffb…df06`, UpgradeCap `0x1dea…fa3`
- Follow-ups: Authorize extensions on test gates/SSUs (requires OwnerCap — manual step); Hour 5 integration testing

---

## 2026-03-12 – TradePost Foundation Implementation
- Goal: Implement TradePost SSU extension — listing lifecycle (create/buy/cancel) with typed witness pattern for cross-address atomic trading
- Files: `contracts/civilization_control/sources/trade_post.move` (created), `contracts/civilization_control/tests/trade_post_tests.move` (created), `docs/core/march-11-reimplementation-checklist.md` (updated)
- Diff: +280 LoC source, +260 LoC tests
- Risk: medium (new Move module, SSU extension integration)
- Gates: move-build ✅ move-test ✅ (21/21 pass: 11 GateControl + 10 TradePost)
- Decisions:
  - Separate `TradePostAdminCap` from GateControl's `AdminCap` — independent admin control per module
  - `TradeAuth` witness mint is `public(package)` per builder-scaffold convention
  - `Listing` has `key` only (no `store`) — shared via `share_listing()` which calls `transfer::share_object`
  - `create_listing` returns `Listing` (composable) — caller shares via PTB calling `share_listing()`
  - `buy()` returns `Item` to caller — composable PTB pattern, buyer handles final transfer
  - Items delivered via direct transfer (not `deposit_item<Auth>`) because v0.0.15 `parent_id` validation prevents cross-SSU deposit
  - Exact payment required in `buy()` — caller splits coin in PTB (`txb.splitCoins`)
  - No item locking — seller retains full SSU access; buy fails if inventory insufficient
  - SSU must be online for trades (enforced by `withdraw_item` online guard)
  - `quantity: u32` field in Listing supports partial inventory listings
- Follow-ups: Integration test on Utopia testnet; extension freeze demo integration; TurretControl module

---

## 2026-03-12 – GateControl Foundation Implementation
- Goal: Implement GateControl typed witness extension — tribe filter + coin toll rules with per-gate dynamic field config
- Files: `contracts/civilization_control/Move.toml` (modified), `contracts/civilization_control/sources/gate_control.move` (created, replaced placeholder), `contracts/civilization_control/tests/gate_control_tests.move` (created)
- Diff: +315 LoC source, +215 LoC tests, placeholder removed
- Risk: medium (new Move module, world dependency wired)
- Gates: move-build ✅ move-test ✅ (11/11 pass)
- Decisions:
  - Kept existing `contracts/civilization_control/` path (checklist referenced `civcontrol/` but repo convention is canonical)
  - Removed `[addresses]` from Move.toml — required for compatibility with world dependency (new-style Move.toml format)
  - Added `[environments]` with Utopia chain ID `4c78adac` matching builder-scaffold convention
  - `GateAuth` witness mint is `public(package)` per builder-scaffold security convention (not `public`)
  - Per-gate config via compound DF keys (`TribeRuleKey { gate_id }`, `CoinTollKey { gate_id }`) on shared `GateConfig`
  - Permissionless permit issuance (no AdminCap on `request_jump_permit`) — gate rules themselves are the access control, matching builder-scaffold `tribe_permit.move` pattern
  - AdminCap guards config mutation only (set/remove rules)
  - 5-day permit expiry with overflow protection
  - Two permit paths: `request_jump_permit` (with payment) and `request_jump_permit_free` (no toll gates)
- Follow-ups: End-to-end integration test on devnet/testnet; TradePost foundation; extension freeze UX integration

---

## 2026-03-12 – EVE Vault Sponsorship Analysis: AdminACL Blocker Reclassified
- Goal: Determine whether EVE Vault's sponsored tx relay resolves the AdminACL blocker for CivilizationControl
- Files: `docs/architecture/evevault-sponsorship-analysis.md` (created), `docs/operations/day1-validation.md` (updated), `docs/README.md` (updated)
- Diff: +95 LoC (analysis doc), Day 1 Check 5 reclassified from BLOCKED → PASS
- Risk: low (research/documentation only, no code changes)
- Gates: N/A (no code changes)
- Decisions:
  - AdminACL sponsorship is **not required** for CivilizationControl's own functions — none call `verify_sponsor`
  - Game-level sponsored operations (`jump_with_permit`, etc.) are handled by EVE Frontier backend via Vault relay
  - Day 1 validation reclassified: no blockers remain for CC contract/app implementation
  - Live validation of end-to-end extended-gate jump flow remains a follow-up item (not a blocker)
- Follow-ups: Deploy extension to Utopia, test extended-gate jump with EVE Vault

---

## 2026-03-12 – Day 1 Chain Validation on Utopia Testnet
- Goal: Execute Day 1 checklist against live Utopia testnet, validate all source assumptions and environment IDs
- Files: `docs/operations/day1-validation.md` (created), `docs/decision-log.md` (updated)
- Diff: +180 LoC (validation results file)
- Risk: low
- Gates: move-build ✅ move-test ✅ (no frontend gates yet)
- Decisions:
  - Adopted Utopia testnet IDs as initial live baseline (all 8 LIVE-VERIFIED)
  - Feature branch `feature/day1-chain-validation` used for safe Day 1 execution
  - AdminACL sponsor enrollment marked BLOCKED — requires organizer action or EVE Vault confirmation
- Follow-ups: Confirm dapp-kit sponsored tx relay; request organizer AdminACL enrollment if needed

---

## 2026-03-17 – Posture Switch Idempotency Fix + Gate Online/Offline + Sponsor Semantics
- Goal: Fix ECoinTollNotSet abort on posture switch; unblock gate online/offline; refine link_gates conclusion
- Files: `src/lib/postureSwitchTx.ts` (filtered gate lists), `src/hooks/usePosture.ts` (pre-read gate policies), `src/lib/suiReader.ts` (batch policy fetch), `src/constants.ts` (+ENERGY_CONFIG_ID), `src/lib/gateOnlineOfflineTx.ts` (NEW), `src/hooks/useGateOnlineOffline.ts` (NEW), `src/screens/GateDetailScreen.tsx` (power control), `src/screens/GateListScreen.tsx` (fix invalidation key), `src/screens/TurretListScreen.tsx` (fix invalidation key)
- Diff: ~+200 LoC across 9 files (2 new, 7 modified)
- Risk: medium (posture PTB redesign, new online/offline PTB)
- Gates: typecheck ✅ build ✅
- Decisions:
  - Posture switch pre-reads gate policies via `fetchBatchGatePolicies()` before building PTB — gates split into `gatesWithToll` / `gatesWithoutToll` to avoid ECoinTollNotSet
  - EnergyConfig ID was already LIVE-VERIFIED in day1-validation.md (`0x9285…9c62`) — just never added to constants
  - Gate online/offline implemented as per-gate control on GateDetailScreen (not batch — online/offline is a deliberate per-gate decision)
  - `link_gates` conclusion refined: not possible from **any** web client without CCP-enrolled sponsor. `verify_sponsor` checks `AdminACL.authorized_sponsors` table — enrollment requires GovernorCap held only by CCP. Source TODO confirms this is a temporary guard for distance proofs.
  - Query invalidation key fixed: `"assets"` → `"assetDiscovery"` (was a complete no-op, causing 60s stale state after auth)
- Follow-ups: Test posture switch end-to-end on Utopia; batch online/offline if needed; unlink_gates implementation

---

## 2026-03-13 – Gate Auth Feasibility & Batch Authorization UI
- Goal: Determine which gate operations are possible from the web dashboard and implement batch gate extension authorization
- Files: `src/hooks/useAuthorizeExtension.ts` (added `authorizeGates`, `resetGate`, `resetTurret`), `src/screens/GateListScreen.tsx` (batch auth button + TxFeedbackBanner), `src/hooks/useOperatorReadiness.ts` (added `link` field to blockers), `src/components/PostureControl.tsx` (blocker → route links), `src/types/domain.ts` (added `GateAuthTarget`)
- Diff: ~+80 LoC across 5 files
- Risk: medium (new PTB construction for gate auth, touches readiness logic)
- Gates: typecheck ✅ build ✅
- Decisions:
  - **Gate authorize_extension**: POSSIBLE from web PTB — same borrow/authorize/return pattern as turrets. No online requirement. Implemented as batch.
  - **Gate online/offline**: POSSIBLE in contract (`gate::online/offline` exist, no `verify_sponsor`). BLOCKED in practice — requires `EnergyConfig` shared singleton object ID, which is not discoverable from codebase or standard RPC queries. Deferred.
  - **Gate link_gates**: IMPOSSIBLE from web — requires `admin_acl.verify_sponsor(ctx)` (server-sponsored tx). In-game only. `unlink_gates` IS callable from web (no sponsor check).
  - Gate auth blockers are severity `"warning"` (not `"error"`) — they surface advice but do NOT block posture switch. Only turret auth blocks `isReady`.
  - Blocker items in PostureControl now include navigation links to the relevant screen (/gates, /turrets).
- Follow-ups: Discover EnergyConfig object ID for online/offline control; test batch gate auth on Utopia

---

<!-- New entries above this line -->
