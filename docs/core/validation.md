# CivilizationControl — Validation Procedures

**Retention:** Carry-forward

## Document Authority

| Role | Document |
|------|----------|
| Execution authority | `march-11-reimplementation-checklist.md` |
| Intent authority | `spec.md` |
| Validation authority | `validation.md` (this document) |
| Expanded reference | `civilizationcontrol-implementation-plan.md` |

> If conflicts exist, defer to the March-11 Reimplementation Checklist for execution decisions.

> **PRE-HACKATHON PROVISIONAL PLAN (partially stale)**
> Written before implementation. Module names, struct names, and event names have evolved.
> Authoritative references: operator-validation-checklist.md (rehearsal), demo-beat-sheet (recording), claim-proof-matrix (evidence).
> Retained for validation pattern reference. Key renames: `gate_permit`→`gate_control`, `CivControlConfig`→`GateConfig`, `AdminCap`→removed (OwnerCap<Gate> via character borrow), `ETribeMismatch`→`EAccessDenied`, `TradeSettledEvent`→`ListingPurchasedEvent`.

> **Purpose:** Defines how to verify each implementation step. Includes build, lint, runtime expectations, and deterministic proof moment validation.

---

## 1. Build & Lint Gates

### 1.1 Move Package

| Gate | Command | Expected | Frequency |
|------|---------|----------|-----------|
| Build | `sui move build --path contracts/civilization_control` | 0 errors, 0 warnings | After every Move source change |
| Test | `sui move test --path contracts/civilization_control` | All tests pass (26/26) | After every Move source change |
| Publish (dry run) | `sui client publish --path contracts/civilization_control --dry-run` | Gas estimate returned, no errors | Before actual publish |

**Abort codes to test for:**
| Module | Code | Meaning | Test Method |
|--------|------|---------|-------------|
| `gate_control` | 0 | EAccessDenied | Non-whitelisted character calls `request_jump_permit` |
| `gate_control` | 1 | EInsufficientPayment | Payment less than default_toll price |
| `trade_post` | 0 | EListingInactive | Buy on cancelled listing |
| `trade_post` | 1 | EInsufficientFunds | Coin value < listing price |
| `trade_post` | 2 | ESSUMismatch | Listing SSU ID ≠ passed SSU |

### 1.1b Pre-Mainnet: Formal Verification (Sui Prover)

> **Not in hackathon scope.** Included here to document our intent before any real-value deployment.

Before deploying contracts to mainnet (real assets at risk), all economic-critical Move modules must be formally verified using the [Sui Prover](https://github.com/asymptotic-code/sui-prover) (Boogie/Z3-based, supports Move 2024).

| Module | Properties to Prove | Priority |
|--------|---------------------|----------|
| `gate_control` | Toll payment atomicity, no-double-toll, preset evaluation completeness | P0 |
| `trade_post` | Payment atomicity, no partial fills, balance conservation | P0 |
| `posture` | Posture state machine correctness | P1 |

Specs will live in a separate `specs/` package using Sui Prover's `#[spec(prove)]` attribute and `target` mechanism (required until upstream integration lands). See [Sui Prover Guide](https://info.asymptotic.tech/sui-prover-guide) for specification patterns.

### 1.2 Frontend (React + TypeScript)

| Gate | Command | Expected | Frequency |
|------|---------|----------|-----------|
| TypeScript check | `npm run typecheck` (or `npx tsc --noEmit`) | 0 errors | After every TS change |
| Build | `npm run build` | Production build succeeds, 0 warnings treated as errors | After every TS change |
| Dev server | `npm run dev` | Starts on localhost, no console errors | Spot check after major changes |
| Lint | `npm run lint` (if configured) | 0 errors | Before commit |

### 1.3 Combined Gate (run before every commit)

```bash
# Move
sui move build --path contracts/civilization_control
sui move test --path contracts/civilization_control

# Frontend
cd .
npm run typecheck
npm run build
```

All four must pass. Any failure blocks commit.

---

## 2. Step-Level Verification

### Phase 0: Day-1 Validation

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S01 | `git log --oneline` | Exactly 1 commit, dated ≥ March 11 |
| S02 | `git submodule status` | Both submodules at latest commit |
| S03 | `grep -n "authorize_extension\|issue_jump_permit\|withdraw_item\|struct Item" vendor/world-contracts/...` | Signatures match documented (A1-A4) |

> **UPDATED (v0.0.15):** `withdraw_item<Auth>` signature has changed — now takes `quantity: u32` + `ctx: &mut TxContext`. `deposit_item<Auth>` validates `parent_id`. S03 grep must verify against v0.0.15 signatures, not v0.0.13.
| S04 | `sui client active-env` | Returns target environment name |
| S05 | Sponsored tx dry run passes | No `ENotAuthorizedSponsor` abort |
| S06 | Read two DFs with different gate_id keys | Independent values returned |

### Phase 1: Foundation

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S07 | `npm run dev` + `npm run build` | Dev server starts, build produces output |
| S08 | Connect wallet in browser | Address displays, `useCurrentAccount()` non-null |
| S09 | `sui move build` | 0 errors. `GateAuth`, `TradeAuth`, `GateConfig`, `PolicyPreset` exist (OwnerCap<Gate> via character borrow — no AdminCap) |
| S10 | `sui client object <config_id>` | Shared object returned with correct type |

### Phase 2: GateControl

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S11 | `sui move test` — set_policy_preset test | PolicyPreset DF exists after set, gone after remove |
| S12 | `sui move test` — policy preset with default_toll | Preset stores default_toll and entries |
| S13 | `sui move test` — request_jump_permit tests (3 scenarios) | Whitelisted tribe+toll → permit. Non-whitelisted → abort EAccessDenied. Low payment → abort EInsufficientPayment. |
| S14 | End-to-end on-chain: 3 test txs | JumpPermit issued+consumed, TollCollectedEvent emitted, MoveAbort on wrong tribe |
| S15 | Browser renders gate list after wallet connect | At least 1 gate visible with correct status |
| S16 | Gate detail page loads | All overview fields rendered from on-chain data |
| S17 | Rule Composer deploys policy to chain | DF readable via RPC after deploy |
| S18 | Both linked gates have extension | `gate.extension` == `Some(TypeName)` on both |

### Phase 3: TradePost

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S19 | `sui move test` — create_listing test | Shared Listing object created with correct fields |
| S20 | `sui move test` — buy tests (3 scenarios) | Item transferred, payment routed, listing inactive, change returned |
| S21 | End-to-end on-chain: buyer ≠ seller | Item ownership transferred, seller balance increased |
| S22 | Browser renders SSU list | At least 1 SSU visible with status |
| S23 | Inventory items display from on-chain | Correct count and type_ids |
| S24 | Buy flow completes in browser | Listing purchased, balances updated |

### Phase 4: UX Polish

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S25 | Command Overview renders aggregated data | Structure count correct, at least 1 alert visible |
| S26 | Signal Feed shows events within 10s of on-chain emission | At least 3 event types rendered |
| S27 | Manual Character ID input resolves structures | Paste valid character ID → gates/SSUs load |
| S28 | Label editable, persists after reload | localStorage read returns saved label |
| S29 | Failed tx shows human-readable error | MoveAbort code mapped to message |
| S30 | No banned terms in UI | Grep for "Dashboard\|Admin\|Settings\|Notifications" returns 0 hits in components |

### Phase 5: ZK Stretch

| Step | Verification Method | Pass Criteria | Kill Criteria |
|------|-------------------|---------------|---------------|
| S31 | Circuit compiles, test proof generates | Proof in < 5s | R1: fails → kill |
| S32 | Browser WASM generates proof | Proof valid, < 2s | R2: > 5s → kill |
| S33 | On-chain Groth16 verify succeeds | Valid → pass, invalid → abort. Gas ≤ 5M MIST | R3: verify fails → kill |
| S34 | Full E2E browser → chain → jump | Permit issued + consumed | R4: fails after 2h debug → kill |
| S35 | ZK card in Rule Composer | Member list → root → chain | If S34 killed, skip |

### Phase 6: Demo

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S36 | All structures online, funded, configured | 3 accounts, 2 gates, 1 SSU, rules active |
| S37 | CLI footage captured | ≥ 5 commands visible, < 25s |
| S38 | Beats 2-7 recorded | All 5 proof moments captured |
| S39 | ZK accent (if alive) | Proof verified in recording |
| S40 | Video edited with overlays | 5 proof overlays, ≤ 3:30 |
| S41 | README complete | Problem, solution, architecture, setup, video link |
| S42 | Repo clean for submission | No secrets, no pre-March-11 commits, Deepsurge registered |

### Cross-Cutting (S43–S45)

| Step | Verification Method | Pass Criteria |
|------|-------------------|---------------|
| S43 | Polling integration test: trigger on-chain event → verify Signal Feed updates within 10s | At least 3 event types polled and rendered. No stale data after 2 intervals. |
| S44 | PTB construction unit tests: build each tx type, inspect serialized bytes | All 6 operation types serialize without error. `sui client execute-signed-tx --dry-run` succeeds. |
| S45 | SVG topology map renders gate-pair links + SSU nodes | At least 2 gates + 1 SSU visible. Links reflect `linked_gate_id` data. Responsive at 375px width. |

---

## 3. Deterministic Proof Moment Validation

The 5 non-negotiable proof moments must each produce verifiable on-chain evidence:

### Proof Moment 1: Policy Deploy

| Aspect | Validation |
|--------|-----------|
| **What to capture** | Transaction digest from `set_policy_preset` deployment |
| **Verification command** | `sui client tx-block <DIGEST> --json` |
| **Expected fields** | `status: "success"`, effects show DF creation on GateConfig, `PolicyPresetSetEvent` emitted |
| **UI evidence** | PolicyPresetEditor shows "Policy deployed" + tx link |

### Proof Moment 2: Hostile Denied

| Aspect | Validation |
|--------|-----------|
| **What to capture** | Transaction digest from non-whitelisted `request_jump_permit` attempt |
| **Verification command** | `sui client tx-block <DIGEST> --json` |
| **Expected fields** | `status: "failure"`, `error` contains abort code EAccessDenied from `civilization_control::gate_control` |
| **UI evidence** | Transaction feedback shows "Access Denied" in Signal Feed with red indicator. |

### Proof Moment 3: Ally Tolled

| Aspect | Validation |
|--------|-----------|
| **What to capture** | Transaction digest from correct-tribe + toll `request_jump_permit` → `jump_with_permit` |
| **Verification command** | `sui client tx-block <DIGEST> --json` |
| **Expected fields** | `status: "success"`, events include `TollCollectedEvent { amount_mist: 5000000000 }` + `JumpEvent`, balance deltas show toll deduction from jumper + addition to treasury |
| **UI evidence** | Signal Feed shows "Toll collected: 5 SUI" + "Jump permitted" entries. Revenue counter increments. |

### Proof Moment 4: Trade Buy

| Aspect | Validation |
|--------|-----------|
| **What to capture** | Transaction digest from `buy()` call |
| **Verification command** | `sui client tx-block <DIGEST> --json` |
| **Expected fields** | `status: "success"`, events include `ListingPurchasedEvent`, object changes show Item transferred to buyer, Coin transferred to seller, Listing.is_active = false |
| **UI evidence** | Confirmation: "Trade completed. [Item] acquired for [X] SUI." Balance deltas visible for both buyer and seller. |

### Proof Moment 5: Revenue Visible

| Aspect | Validation |
|--------|-----------|
| **What to capture** | Command Overview screenshot showing aggregated revenue from toll + trade events |
| **Verification method** | Sum of `TollCollectedEvent.amount_mist` + `ListingPurchasedEvent.price_mist` from `suix_queryEvents` |
| **Expected fields** | Total revenue ≥ (toll amount + trade price). Individual event entries visible in Signal Feed. |
| **UI evidence** | Command Overview revenue card shows total. Signal Feed shows individual events. |

---

## 4. Runtime Expectations

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|------------|
| Initial page load | < 3s | Browser DevTools, first contentful paint |
| Structure discovery | < 5s | From wallet connect to gate list populated |
| Event polling round-trip | < 2s | `suix_queryEvents` response time |
| PTB construction | < 500ms | Console timing around Transaction build |
| Transaction confirmation | < 10s | From wallet sign to on-chain finality |
| ZK proof generation (if enabled) | < 2s | Browser console timing |

### Error Recovery

| Failure | Expected Behavior | Verification |
|---------|-------------------|-------------|
| Wallet disconnect | All write operations disabled. Read-only mode. Reconnect prompt. | Disconnect wallet → verify UI state |
| RPC timeout | Retry once after 3s. Show "Network unavailable" if retry fails. | Throttle RPC → verify toast |
| Wrong network | "Wrong network" badge. Prompt to switch. | Connect to wrong chain → verify warning |
| Missing Character | "Enter Character ID" prompt. Manual resolution. | New wallet with no Character → verify prompt |
| Transaction failure | Toast with mapped error message. Revert optimistic UI. | Submit invalid PTB → verify error display |

---

## 5. Pre-Submission Validation

Final checklist before hackathon submission:

| Check | Command | Expected |
|-------|---------|----------|
| No secrets in repo | `git log --all -p \| Select-String "mnemonic\|private.key\|secret"` | 0 matches |
| No pre-start commits | `git log --oneline --before="2026-03-11"` | 0 results |
| Build passes | `npm run build` | Clean exit |
| TypeScript clean | `npx tsc --noEmit` | 0 errors |
| Move build passes | `sui move build --path contracts/civilization_control` | 0 errors |
| Move tests pass | `sui move test --path contracts/civilization_control` | All pass (26/26) |
| Demo video accessible | Open video link in incognito browser | Video plays |
| README has required sections | Manual review | Problem, solution, architecture, setup, video, package IDs |
| Deepsurge registered | Check Deepsurge portal | Entry listed |

---

## 6. Continuous Validation Pattern

During implementation, maintain this rhythm:

1. **After every Move change:** `sui move build` + `sui move test`
2. **After every TS change:** `npm run typecheck` + `npm run build`
3. **After every on-chain deployment:** Record tx digest + verify object state
4. **After every PTB integration:** Test with wallet in browser
5. **Before every commit:** Run combined gate (§1.3)
6. **Every 2 hours:** Quick smoke test — wallet connect → gate list → make one change → verify Signal Feed
