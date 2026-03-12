## Decision Log

Newest first. Use the template in `docs/operations/DECISIONS_TEMPLATE.md`.

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
