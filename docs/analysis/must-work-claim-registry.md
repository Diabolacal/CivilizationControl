# Must-Work Claim Registry — Comprehensive Extraction

**Retention:** Carry-forward

> Exhaustive registry of every testable "must-work" claim extracted from the 10 specified source documents plus the atomic courier feasibility report.
> Generated: 2026-03-09
> Sources: spec.md, demo-beat-sheet.md, day1-checklist.md, validation.md, implementation-plan.md, claim-proof-matrix.md, assumption-registry-and-demo-fragility-audit.md, fortune-gauntlet-feasibility.md, hackathon-ideas-grounded-v3-judged.md, posture-switch-localnet-validation.md, atomic_courier_experiment/FEASIBILITY-REPORT.md

---

## Format

| Field | Description |
|-------|-------------|
| **Claim ID** | `{Project}-{Module}-{##}` |
| **Project** | CivilizationControl (CC), ZK GatePass (ZK), Fortune Gauntlet (FG), Atomic Courier (AC), Infrastructure (INF) |
| **Claim** | Testable statement |
| **Source** | File + section/line reference |
| **Demo-Critical** | YES = must appear in demo video; NO = must work but not shown |
| **Validated** | YES = confirmed on devnet; PARTIAL = pattern validated, needs re-test; NO = untested; BLOCKED = requires hackathon infra |

---

## 1. CivilizationControl — GateControl

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| CC-GC-01 | Gate extension system supports custom access rules via `authorize_extension<Auth>()` | claim-proof-matrix.md §GateControl row 1; spec.md §On-Chain Interaction Model | NO | YES |
| CC-GC-02 | Tribe filter blocks non-matching tribes atomically with MoveAbort code 0 (`ETribeMismatch`) | claim-proof-matrix.md §GateControl row 2; validation.md §Proof Moment 2 | **YES** (Proof Moment 2) | YES |
| CC-GC-03 | Tribe filter allows matching tribes to pass | claim-proof-matrix.md §GateControl row 3 | **YES** (Proof Moment 3) | YES |
| CC-GC-04 | Coin toll collects payment atomically on jump and transfers to collector address | claim-proof-matrix.md §GateControl row 4; spec.md §Rule evaluation | **YES** (Proof Moment 3) | YES |
| CC-GC-05 | Rules compose as independent layers — tribe + toll stored as separate DFs on shared config | claim-proof-matrix.md §GateControl row 5; spec.md §Move Module Architecture | **YES** (Proof Moment 1) | YES |
| CC-GC-06 | Extension authorization registers on gate (`extension: Some(TypeName)` field set) | claim-proof-matrix.md §GateControl row 6 | NO | YES |
| CC-GC-07 | Jump permit issued to authorized pilot — JumpPermit object created and transferred | claim-proof-matrix.md §GateControl row 7 | NO | YES |
| CC-GC-08 | Jump with permit succeeds — permit consumed, JumpEvent emitted | claim-proof-matrix.md §GateControl row 8 | NO | YES |
| CC-GC-09 | Default jump blocked when extension is set (no permit = no jump) | claim-proof-matrix.md §GateControl row 9 | NO | YES |
| CC-GC-10 | Full 13-step gate lifecycle reproducible end-to-end | claim-proof-matrix.md §GateControl row 10; day1-checklist.md §Check 10 | NO | YES |
| CC-GC-11 | Policy change is a single operator action — one PTB updates GateConfig DFs | claim-proof-matrix.md §GateControl row 11; demo-beat-sheet.md Beat 3 | **YES** (Proof Moment 1) | PARTIAL |
| CC-GC-12 | Single extension per gate constraint — only one typed witness can be registered | spec.md §System Boundaries; assumption-registry.md A-12 | NO | YES |
| CC-GC-13 | JumpPermit has `key+store` abilities (not hot-potato) — can persist across txs | spec.md §Move Module Architecture | NO | YES |
| CC-GC-14 | `issue_jump_permit` and `jump_with_permit` are two separate transactions (PROVISIONAL) | spec.md §Write Paths; assumption-registry.md A-07 | NO | PARTIAL |
| CC-GC-15 | `gate::authorize_extension<Auth>` function signature matches world-contracts (HARD STOP) | day1-checklist.md §A1; implementation-plan.md S03 | NO | YES |
| CC-GC-16 | `gate::issue_jump_permit<Auth>` function signature matches world-contracts (HARD STOP) | day1-checklist.md §A2; implementation-plan.md S03 | NO | YES |
| CC-GC-17 | `gate::jump_with_permit` function signature matches world-contracts (HARD STOP) | day1-checklist.md §A4; implementation-plan.md S03 | NO | YES |
| CC-GC-18 | Per-gate dynamic field keys work — compound keys index rules to specific gates | day1-checklist.md §Check 6; implementation-plan.md S06 | NO | YES (compound-df-key-validation.md, 6/6 tests PASS) |
| CC-GC-19 | Extension authorization works on both gates in a linked pair | implementation-plan.md S18; demo-beat-sheet.md Beat 3 | **YES** | YES (extension-integration-e2e-validation.md, 2 gates authorized) |
| CC-GC-20 | Rule evaluation order: read tribe DF → tribe match check → read toll DF → transfer toll | spec.md §Rule Evaluation; implementation-plan.md S13 | NO | PARTIAL |
| CC-GC-21 | Hostile pilot jump produces wallet failure response with extractable abort code | demo-beat-sheet.md Beat 4; validation.md §Proof Moment 2 | **YES** (Proof Moment 2) | NO |
| CC-GC-22 | Toll revenue appears as balance delta on operator/collector address | demo-beat-sheet.md Beat 5; validation.md §Proof Moment 3 | **YES** (Proof Moment 3) | YES |

---

## 2. CivilizationControl — TradePost

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| CC-TP-01 | Cross-address atomic buy — buyer pays SUI, receives item, in one tx | claim-proof-matrix.md §TradePost row 1; validation.md §Proof Moment 4 | **YES** (Proof Moment 4) | YES |
| CC-TP-02 | Seller receives payment without being online or signing | claim-proof-matrix.md §TradePost row 2 | **YES** (Proof Moment 4) | YES |
| CC-TP-03 | Listing deactivated (`is_active: false`) after purchase | claim-proof-matrix.md §TradePost row 3 | NO | YES |
| CC-TP-04 | SSU-backed storefront — item withdrawn via extension witness, no OwnerCap sharing | claim-proof-matrix.md §TradePost row 4 | NO | YES |
| CC-TP-05 | Extension witness pattern enables cross-address withdrawal (`withdraw_item<TradeAuth>()`) | claim-proof-matrix.md §TradePost row 5 | NO | YES (ssu-extension-e2e-validation.md, 7/7 against real world-contracts v0.0.15) |
| CC-TP-06 | Atomic PTB composition: `splitCoins` + buy call in one tx | claim-proof-matrix.md §TradePost row 6 | NO | YES |
| CC-TP-07 | Seller balance increases and buyer balance decreases by correct amounts | claim-proof-matrix.md §TradePost row 7; validation.md §Proof Moment 4 | **YES** (Proof Moment 4) | YES |
| CC-TP-08 | Full storefront lifecycle: publish → setup → authorize → stock → list → buy | claim-proof-matrix.md §TradePost row 8 | NO | YES |
| CC-TP-09 | `storage_unit::withdraw_item<Auth>` function signature matches world-contracts (HARD STOP) | day1-checklist.md §A3; implementation-plan.md S03 | NO | YES |

> **UPDATED (v0.0.15):** `withdraw_item<Auth>` signature has changed — now takes `quantity: u32` + `ctx: &mut TxContext` parameters. Call sites must be updated. `deposit_item<Auth>` also changed (validates `parent_id`). New `deposit_to_owned<Auth>` for cross-player delivery.
| CC-TP-10 | Listing shared object enables buyer discovery without seller participation | spec.md §TradePost Module; implementation-plan.md S19 | NO | PARTIAL |
| CC-TP-11 | Cross-address buy works on hackathon test server (not just localnet) | implementation-plan.md Hard Stop Conditions | **YES** | BLOCKED |

---

## 3. CivilizationControl — Posture Switch / TurretControl

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| CC-PS-01 | Single PTB switches BUSINESS→DEFENSE posture (gate rules + turret extension swaps) | posture-switch-validation.md §Strategy A; spec.md H7 | **YES** (Beat 6) | YES |
| CC-PS-02 | Single PTB switches DEFENSE→BUSINESS posture | posture-switch-validation.md §Strategy A reverse | **YES** | YES |
| CC-PS-03 | `PostureChangedEvent` emitted on posture switch | posture-switch-validation.md §Events | NO | YES |
| CC-PS-04 | `BouncerTargetingEvent` / `DefenseTargetingEvent` emitted per turret extension swap (N events for N turrets) | posture-switch-validation.md §Events; demo-beat-sheet.md Beat 6 | **YES** | YES |
| CC-PS-05 | Turret `authorize_extension<BouncerAuth/DefenseAuth>` callable via OwnerCap — no AdminACL needed | posture-switch-validation.md §Auth; spec.md H8 | NO | YES |
| CC-PS-06 | Batch turret toggle feasible in single PTB (multiple borrow/toggle/return cycles) | posture-switch-validation.md §PTB Composition; spec.md H9 | NO | YES |
| CC-PS-07 | Prerequisites enforced: `set_fuel_efficiency` → `deposit_fuel` → NWN `online` → turret `online` | posture-switch-validation.md §Prerequisites | NO | YES |
| CC-PS-08 | Status guards abort if turret already in target state (must check off-chain before PTB) | posture-switch-validation.md §Constraints | NO | YES |
| CC-PS-09 | Posture switch end-to-end ≤ 3 seconds (chain finality ~250ms + indexer sync ~2s; UI reacts on tx response, before indexer) | posture-switch-validation.md §Results (2255ms / 2754ms measured) | NO | YES |

---

## 4. CivilizationControl — Sponsored Transactions

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| CC-SP-01 | AdminACL `verify_sponsor(ctx)` checks `tx_context::sponsor()` first, falls back to `sender()` | spec.md §Sponsored Transaction Model | NO | YES (admin-acl-enrollment-validation.md, sender fallback confirmed) |
| CC-SP-02 | AdminACL enrollment accessible on hackathon test server (Branch A) | day1-checklist.md §Check 5 (CRITICAL PATH); assumption-registry.md DR-1 | NO | BLOCKED |
| CC-SP-03 | Sponsored tx shows sponsor ≠ sender in tx metadata | claim-proof-matrix.md §Evidence Gaps; spec.md §Branch A | NO | BLOCKED |
| CC-SP-04 | If AdminACL inaccessible, fallback to local devnet demo is viable (Branch C) | day1-checklist.md §Branch C; implementation-plan.md Hard Stop Conditions | NO | YES |

---

## 5. CivilizationControl — UI / UX / Performance

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| CC-UX-01 | Page load < 3 seconds | validation.md §Runtime Performance | NO | NO |
| CC-UX-02 | Structure discovery from OwnerCap < 5 seconds | validation.md §Runtime Performance | NO | NO |
| CC-UX-03 | Polling interval 10 seconds; new data visible within 1 poll cycle | validation.md §Runtime Performance; implementation-plan.md S43 | NO | NO |
| CC-UX-04 | PTB construction < 500ms client-side | validation.md §Runtime Performance | NO | NO |
| CC-UX-05 | Transaction confirmation < 10 seconds on target network | validation.md §Runtime Performance; demo-beat-sheet.md timing notes | **YES** | NO |
| CC-UX-06 | Wallet adapter connects successfully via `@evefrontier/dapp-kit` (`EveFrontierProvider` + `useConnection()`) | day1-checklist.md §Check 10; implementation-plan.md S08 | **YES** | NO |
| CC-UX-07 | In-game browser loads dApp without CSP or CORS errors | day1-checklist.md §Check 11; implementation-plan.md S36 | NO | NO |
| CC-UX-08 | In-game viewport renders correctly at 787×1198 portrait | implementation-plan.md S36; assumption-registry.md A-72 | NO | NO |
| CC-UX-09 | No `crossOriginIsolated`-dependent features fail silently in-game browser | implementation-plan.md S36 | NO | NO |
| CC-UX-10 | Character resolution from connected wallet succeeds | implementation-plan.md S27 | **YES** | NO |
| CC-UX-11 | MoveAbort codes parsed into human-readable error messages from wallet response | implementation-plan.md S29; validation.md §Error Recovery | **YES** | NO |
| CC-UX-12 | Narrative voice compliance — zero instances of banned SaaS terms in UI text | implementation-plan.md S30 | NO | NO |
| CC-UX-13 | Command Overview shows aggregated structure state + revenue totals | demo-beat-sheet.md Beat 7; implementation-plan.md S25 | **YES** (Proof Moment 5) | NO |
| CC-UX-14 | Signal Feed shows events in real-time via polling | demo-beat-sheet.md Beat 4-6; implementation-plan.md S26 | **YES** | NO |
| CC-UX-15 | `@tanstack/react-query` works correctly with Sui RPC queries via dapp-kit | implementation-plan.md S43 | NO | NO |
| CC-UX-16 | Structure labeling persists in localStorage | implementation-plan.md S28 | NO | NO |
| CC-UX-17 | Strategic Network Map (SVG) renders pinned structures with correct status colors | implementation-plan.md S45 | NO | NO |

---

## 6. CivilizationControl — Demo Proof Moments

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| CC-DM-01 | **Proof Moment 1:** Policy deploy tx digest visible on-screen | demo-beat-sheet.md Beat 3; claim-proof-matrix.md §Five Non-Negotiable | **YES** | NO |
| CC-DM-02 | **Proof Moment 2:** Hostile denied tx digest + MoveAbort code visible on-screen | demo-beat-sheet.md Beat 4; claim-proof-matrix.md §Five Non-Negotiable | **YES** | NO |
| CC-DM-03 | **Proof Moment 3:** Ally tolled tx + operator balance delta visible on-screen | demo-beat-sheet.md Beat 5; claim-proof-matrix.md §Five Non-Negotiable | **YES** | NO |
| CC-DM-04 | **Proof Moment 4:** Trade buy tx + buyer/seller balance deltas visible on-screen | demo-beat-sheet.md Beat 6; claim-proof-matrix.md §Five Non-Negotiable | **YES** | NO |
| CC-DM-05 | **Proof Moment 5:** Aggregate revenue in Command Overview visible on-screen | demo-beat-sheet.md Beat 7; claim-proof-matrix.md §Five Non-Negotiable | **YES** | NO |
| CC-DM-06 | Demo video ≤ 3:30 with all 5 proof overlays and real tx digests | demo-beat-sheet.md §Duration; implementation-plan.md S40 | **YES** | NO |
| CC-DM-07 | No secrets visible in demo recording (keys, full addresses, unrelated browser data) | implementation-plan.md S38, S40 | **YES** | NO |
| CC-DM-08 | Git history shows all work on or after March 11 (no pre-hackathon commits) | implementation-plan.md S42; day1-checklist.md §Check 1 | **YES** | NO |
| CC-DM-09 | Deepsurge registration confirmed with GitHub repo URL | implementation-plan.md S42 | **YES** | NO |
| CC-DM-10 | Fallback variant (GateControl-only, 2 min) is viable if TradePost not ready | demo-beat-sheet.md §Fallback Variant | NO | NO |

---

## 7. CivilizationControl — Hard Stop Conditions

These are not demo claims but **blocking preconditions**. If any fails, a specific mitigation must execute.

| ID | Condition | Detection Step | Mitigation | Source |
|----|-----------|---------------|------------|--------|
| CC-HS-01 | `gate::authorize_extension<Auth>` signature changed in world-contracts | S03 | Fork world-contracts or redesign extension approach | implementation-plan.md Hard Stop Conditions |
| CC-HS-02 | `storage_unit::withdraw_item<Auth>` requires OwnerCap (not witness-only) | S03 | Pivot TradePost to escrow pattern | implementation-plan.md Hard Stop Conditions |
| CC-HS-03 | AdminACL sponsor inaccessible on hackathon test server | S05 | Demo on local devnet only | implementation-plan.md Hard Stop Conditions |
| CC-HS-04 | world-contracts repo deleted or made private | S02 | Contact organizers; use cached copy | implementation-plan.md Hard Stop Conditions |
| CC-HS-05 | Cross-address buy fails on hackathon devnet | S21 | Cut TradePost; submit GateControl only | implementation-plan.md Hard Stop Conditions |
| CC-HS-06 | Docker devnet won't start | S04 | Use native `sui start --with-faucet` | implementation-plan.md Hard Stop Conditions |

---

## 8. CivilizationControl — Demo-Breaking Risks (from Fragility Audit)

| ID | Risk | Likelihood | Impact | Source |
|----|------|-----------|--------|--------|
| CC-DR-01 | AdminACL not enrolled — all server-dependent txs fail | Medium | Blocks server demo (fallback: local devnet) | assumption-registry.md §DR-1 |
| CC-DR-02 | Gate pair not linkable — demo shows isolated gates only | Low | Degrades "network control" narrative | assumption-registry.md §DR-2 |
| CC-DR-03 | TradePost atomic buy fails on test server | Low | Cut TradePost; GateControl-only demo | assumption-registry.md §DR-3 |

---

## 9. ZK GatePass (Stretch Goal)

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| ZK-01 | Groth16 proof verifies on Sui — valid proof → `is_valid: true` event | claim-proof-matrix.md §ZK row 1 | NO | YES |
| ZK-02 | Invalid ZK proof correctly rejected — `is_valid: false` event | claim-proof-matrix.md §ZK row 2 | NO | YES |
| ZK-03 | ZK verification + gate witness consumption composable in single tx | claim-proof-matrix.md §ZK row 3 | NO | YES |
| ZK-04 | Membership circuit (depth 10, Poseidon(2), 2430 constraints) verifies on-chain | claim-proof-matrix.md §ZK row 4 | NO | YES |
| ZK-05 | ZK verification gas < 0.001 SUI (~1M MIST per verify) | claim-proof-matrix.md §ZK row 5 | NO | YES |
| ZK-06 | Dynamic ZK config — shared VK storage + verify + gate mock works | claim-proof-matrix.md §ZK row 6 | NO | PARTIAL |
| ZK-07 | **Kill Gate R1:** Circom 2.2.0 + snarkjs 0.7.5 toolchain compiles in hackathon env; circuit compiles, test proof < 5s | implementation-plan.md S31 | NO | NO |
| ZK-08 | **Kill Gate R2:** Browser-side WASM proof generation < 2 seconds (single-threaded, no SharedArrayBuffer) | implementation-plan.md S32 | NO | NO |
| ZK-09 | **Kill Gate R3:** ZK module publishes to target network; valid proof → JumpPermit issued; gas < 10M MIST | implementation-plan.md S33 | NO | NO |
| ZK-10 | **Kill Gate R4:** End-to-end browser → chain ZK jump, total latency < 5 seconds | implementation-plan.md S34 | NO | NO |
| ZK-11 | snarkjs WASM prover works without `SharedArrayBuffer` (single-threaded mode in in-game browser) | implementation-plan.md S32 | NO | NO |
| ZK-12 | Circuit files (WASM ~2MB, zkey ~500KB) load within 3 seconds in browser | implementation-plan.md S32 | NO | NO |
| ZK-13 | Poseidon hash in browser (circomlibjs) matches circuit's Poseidon implementation | implementation-plan.md S35 | NO | NO |
| ZK-14 | ZK uses same `GateAuth` witness (not separate `ZKAuth`) — respects single extension constraint | implementation-plan.md S33; spec.md §ZK | NO | NO |
| ZK-15 | ZK accent segment (30s) shows "ZK pass verified" in Signal Feed with green indicator + ZK badge | demo-beat-sheet.md §ZK Accent | NO | NO |

---

## 10. Fortune Gauntlet

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| FG-01 | Probabilistic permit issuance via `sui::random` works inside a gate extension function | fortune-gauntlet-feasibility.md §Capability 1 | NO | NO |
| FG-02 | `entry` function compatible with gate extension pattern (workaround for `Random` requiring `entry`) | fortune-gauntlet-feasibility.md §Capability 1 workaround | NO | NO |
| FG-03 | Per-player dynamic field progress tracking on shared checkpoints object works | fortune-gauntlet-feasibility.md §Capability 2 | NO | NO |
| FG-04 | Per-gate per-player cooldown via DF timestamps enforces minimum wait between attempts | fortune-gauntlet-feasibility.md §Capability 2 | NO | NO |
| FG-05 | Multi-gate checkpoint configuration feasible (N checkpoints, each with own probability) | fortune-gauntlet-feasibility.md §Capability 4 | NO | NO |
| FG-06 | Time pressure via permit expiry (timestamp + TTL checked before jump) works | fortune-gauntlet-feasibility.md §Capability 5 | NO | NO |
| FG-07 | **NEGATIVE:** Turret-aware consequences NOT feasible — closed-world turret extension constraint blocks reading gauntlet state | fortune-gauntlet-feasibility.md §Capability 3 | NO | YES (confirmed infeasible) |
| FG-08 | Proxy consequences (toll escalation, leaderboard, reputation DFs) are feasible alternatives | fortune-gauntlet-feasibility.md §Capability 3 alternatives | NO | NO |

---

## 11. Atomic Courier

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| AC-01 | Atomic SSU-to-SSU item transfer with coin payment works in single PTB | FEASIBILITY-REPORT.md §Phase 1 | NO | YES |
| AC-02 | Post → Accept → Complete happy path: courier receives reward + collateral back, creator pays reward + gas | FEASIBILITY-REPORT.md §Test 01 | NO | YES |
| AC-03 | Post → Accept → Expire slashing: creator receives slashed collateral + reward back | FEASIBILITY-REPORT.md §Test 02 | NO | YES |
| AC-04 | Post → Cancel: reward returned to creator (gas only cost) | FEASIBILITY-REPORT.md §Test 03 | NO | YES |
| AC-05 | `Balance<SUI>` works for escrow storage (Coin doesn't have `drop`, making Option<Coin> impossible) | FEASIBILITY-REPORT.md §Architectural Decisions | NO | YES |
| AC-06 | Shared `CourierJob` object enables any potential courier to read job details | FEASIBILITY-REPORT.md §Architectural Decisions | NO | YES |
| AC-07 | `sui::clock::Clock` provides reliable chain time for deadline enforcement (~2s resolution on devnet) | FEASIBILITY-REPORT.md §Architectural Decisions | NO | YES |
| AC-08 | Anyone-can-expire rule prevents deadlocked jobs after deadline | FEASIBILITY-REPORT.md §Architectural Decisions | NO | YES |
| AC-09 | Full happy path gas cost ~5.1M MIST (~0.005 SUI) | FEASIBILITY-REPORT.md §Gas Analysis | NO | YES |
| AC-10 | **NEGATIVE:** Cannot test game-native jump integration (requires AdminACL + sponsorship) | FEASIBILITY-REPORT.md §What Remains Untestable | NO | BLOCKED |
| AC-11 | **NEGATIVE:** Cannot test real SSU ↔ in-game inventory bridge (requires game-server coordination) | FEASIBILITY-REPORT.md §What Remains Untestable | NO | BLOCKED |

---

## 12. Infrastructure / Cross-Cutting

| ID | Claim | Source | Demo-Critical | Validated |
|----|-------|--------|:---:|:---:|
| INF-01 | Typed witness extension pattern (`Auth{drop}` → `authorize_extension` → operate) works for gate and SSU | claim-proof-matrix.md §Cross-Cutting row 1 | NO | YES |
| INF-02 | All 10 devnet validation tests pass (10/10 GREEN) | claim-proof-matrix.md §Cross-Cutting row 2 | NO | YES |
| INF-03 | Two published extension packages validated on devnet (`gate_toll_validation`, `trade_post_validation`) | claim-proof-matrix.md §Cross-Cutting row 3 | NO | YES |
| INF-04 | Shared objects enable cross-address coordination (GateConfig, Listing, SSU) | claim-proof-matrix.md §Cross-Cutting row 4 | NO | YES |
| INF-05 | Hot-potato OwnerCap borrow/return pattern works in PTB composition | posture-switch-validation.md §PTB Composition | NO | YES |
| INF-06 | `txb.splitCoins()` handles coin splitting for toll/buy operations in PTB | claim-proof-matrix.md §TradePost row 6 | NO | YES |
| INF-07 | BCS `vector<u8>` requires `tx.pure.vector('u8', Array.from(...))`, NOT `tx.pure(new Uint8Array(...))` | Repository memory (SDK pitfall); posture-switch-validation TS scripts | NO | YES |
| INF-08 | Must call `client.waitForTransaction({digest})` after `signAndExecuteTransaction` to prevent stale reads | Repository memory (SDK pitfall) | NO | YES |
| INF-09 | OwnerCap → assembly mapping requires reading each cap's `authorized_object_id` field | Repository memory (SDK pitfall) | NO | YES |
| INF-10 | Fuel `burn_rate` minimum is 60000ms | Repository memory (SDK pitfall); posture-switch-validation.md §Prerequisites | NO | YES |
| INF-11 | Energy prerequisite chain: `set_fuel_efficiency` → `deposit_fuel` → NWN `online` before turret `online` | Repository memory (SDK pitfall); posture-switch-validation.md §Prerequisites | NO | YES |
| INF-12 | `link_gates` requires AdminACL sponsor + server-signed distance proof | spec.md §Sponsored Tx; assumption-registry.md A-18 | NO | PARTIAL |
| INF-13 | `unlink_gates` requires only OwnerCaps — player-callable without server | implementation-plan.md S46 | NO | PARTIAL |
| INF-14 | CivControl Move package compiles (`sui move build` passes) | validation.md §Build Gates; implementation-plan.md S09 | NO | PARTIAL |
| INF-15 | CivControl Move package publishes to target network | implementation-plan.md S10; day1-checklist.md §Check 8 | NO | PARTIAL |
| INF-16 | `CivControlConfig` shared object created on publish | spec.md §Core Types; implementation-plan.md S09 | NO | PARTIAL |
| INF-17 | Events queryable via JSON-RPC `suix_queryEvents` with package filter | day1-checklist.md §Check 9; implementation-plan.md S26 | NO | PARTIAL |
| INF-18 | World-contracts publishes cleanly on localnet | day1-checklist.md §Check 8 | NO | YES |
| INF-19 | React + Vite frontend builds without errors (`npm run build`) | validation.md §Build Gates; implementation-plan.md all steps | NO | NO |
| INF-20 | Hackathon test server is reachable and accepting connections (March 11+) | day1-checklist.md §Check 4; implementation-plan.md S04 | NO | BLOCKED |
| INF-21 | EVE token (`Coin<EVE>`) exists on target network for potential toll/trade currency | hackathon-ideas.md §Currency Model | NO | BLOCKED |

---

## 13. Key Assumptions from Assumption Registry (Testable Must-Work Subset)

These are drawn from the 87-item assumption registry. Only those that represent testable technical must-work conditions are included (non-technical planning assumptions omitted).

| ID | Assumption | Category | Status | Source |
|----|-----------|----------|--------|--------|
| A-01 | `gate::authorize_extension<Auth>` accepts a typed witness with `drop` ability | Move Signatures | VALIDATED | assumption-registry.md A-01 |
| A-02 | `gate::issue_jump_permit` returns or creates a `JumpPermit` with `key+store` | Move Signatures | VALIDATED | assumption-registry.md A-02 |
| A-03 | `storage_unit::authorize_extension<Auth>` and `withdraw_item<Auth>` follow same witness pattern | Move Signatures | VALIDATED | assumption-registry.md A-03 |

> **UPDATED (v0.0.15):** `withdraw_item<Auth>` signature now includes `quantity: u32` + `ctx: &mut TxContext`. Witness pattern is unchanged but parameter list has grown.
| A-07 | `issue_jump_permit` and `jump_with_permit` are always two separate txs | Move Signatures | PROVISIONAL | assumption-registry.md A-07 |
| A-12 | Only one extension can be registered per gate (single extension constraint) | Extension Model | VALIDATED | assumption-registry.md A-12 |
| A-18 | `link_gates` requires AdminACL + distance proof | Game Server | PARTIAL | assumption-registry.md A-18 |
| A-25 | Hackathon test server exposes standard Sui JSON-RPC (not custom-gated) | Network | UNVERIFIED | assumption-registry.md A-25 |
| A-31 | `Character` object is readable and tribe field accessible via JSON-RPC | Read Path | VALIDATED | assumption-registry.md A-31 |
| A-42 | Wallet adapter `useSignAndExecuteTransaction` returns failure details including abort code | Frontend | UNVERIFIED | assumption-registry.md A-42 |
| A-55 | Single-extension constraint means tribe filter + toll must compose within one module | Architecture | VALIDATED | assumption-registry.md A-55 |
| A-72 | In-game browser viewport is 787×1198 portrait with no Sui wallet extension | Browser | UNVERIFIED | assumption-registry.md A-72 |

---

## Summary Statistics

| Category | Total Claims | Demo-Critical | Validated (YES) | Partial | Not Yet | Blocked |
|----------|:-----------:|:------------:|:---------------:|:-------:|:-------:|:-------:|
| CC — GateControl | 22 | 8 | 15 | 5 | 2 | 0 |
| CC — TradePost | 11 | 3 | 8 | 1 | 0 | 1 |
| CC — Posture Switch | 9 | 3 | 9 | 0 | 0 | 0 |
| CC — Sponsored Tx | 4 | 0 | 0 | 0 | 1 | 2 |
| CC — UI/UX | 17 | 5 | 0 | 0 | 15 | 0 |
| CC — Demo Moments | 10 | 9 | 0 | 0 | 10 | 0 |
| CC — Hard Stops | 6 | — | — | — | — | — |
| CC — Demo Risks | 3 | — | — | — | — | — |
| ZK GatePass | 15 | 0 | 5 | 1 | 9 | 0 |
| Fortune Gauntlet | 8 | 0 | 1 | 0 | 7 | 0 |
| Atomic Courier | 11 | 0 | 9 | 0 | 0 | 2 |
| Infrastructure | 21 | 0 | 12 | 5 | 2 | 2 |
| Key Assumptions | 11 | — | 5 | 2 | 4 | 0 |
| **Totals** | **148** | **28** | **64** | **14** | **50** | **7** |

---

## References

- [spec.md](../core/spec.md)
- [civilizationcontrol-demo-beat-sheet.md](../core/civilizationcontrol-demo-beat-sheet.md)
- [day1-checklist.md](../core/day1-checklist.md)
- [validation.md](../core/validation.md)
- [civilizationcontrol-implementation-plan.md](../core/civilizationcontrol-implementation-plan.md)
- [civilizationcontrol-claim-proof-matrix.md](../core/civilizationcontrol-claim-proof-matrix.md)
- [assumption-registry-and-demo-fragility-audit.md](../analysis/assumption-registry-and-demo-fragility-audit.md)
- [fortune-gauntlet-feasibility.md](../analysis/fortune-gauntlet-feasibility.md)
- [hackathon-ideas-grounded-v3-judged.md](../ideas/hackathon-ideas-grounded-v3-judged.md)
- [posture-switch-localnet-validation.md](../sandbox/posture-switch-localnet-validation.md)
- [FEASIBILITY-REPORT.md](../../experiments/atomic_courier_experiment/FEASIBILITY-REPORT.md)
