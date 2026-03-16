## Decision Log

Newest first. Use the template in `docs/operations/DECISIONS_TEMPLATE.md`.

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

<!-- New entries above this line -->
