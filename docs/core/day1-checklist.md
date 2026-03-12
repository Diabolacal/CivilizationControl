# CivilizationControl — Day-1 Chain Validation Checklist

**Retention:** Carry-forward

> **PRE-HACKATHON PROVISIONAL PLAN**
> Must be re-audited against live world contracts and documentation before March 11 execution.

> **Purpose:** Structured validation checklist for the first 2 hours of hackathon coding. Every BLOCKED and critical PROVISIONAL item must be resolved before implementation begins.
>
> **Must Re-Audit Before March 11 Launch.**

### Status Legend (planning repo)

| Label | Meaning |
|-------|---------|
| **CONFIRMED** | Validated in local devnet sandbox (pre-hackathon) |
| **PROVISIONAL** | Architecturally sound; requires validation on hackathon test server (March 11+) |
| **BLOCKED** | Requires hackathon infrastructure or organizer-provided access (March 11+) |

---

## Execution Order

Complete checks sequentially. Record results in `notes/day1-validation.md`. If any HARD STOP triggers, halt and execute the documented fallback before continuing.

> **Time budget note:** Individual check budgets sum to ~190 minutes (including optional Checks 9b and 9c). The Phase 0 window is 120 minutes. Checks 8–11 may overlap with Phase 1 Foundation work — run them in parallel with S07 (project scaffold) if AdminACL resolution (Check 5) completes under budget. Check 9c (Bouncer Turret, 20 min) is not a demo blocker and can be deferred to Phase 1.

---

## Check 1: Hackathon Start Date Confirmation

**Priority:** MANDATORY
**Time budget:** 5 minutes
**Step ID:** S01

| Field | Value |
|-------|-------|
| **Check** | Verify hackathon coding period has started |
| **Command** | Check official hackathon announcement / Deepsurge portal |
| **Expected Output** | Start date ≤ current UTC date |
| **Fallback** | DO NOT create any code until start date confirmed. Per hackathon rules Section 5: entries must be developed on or after start date. |

**Result:** ☐ PASS ☐ FAIL

---

## Check 2: Create Fresh Repo + Submodules

**Priority:** MANDATORY
**Time budget:** 15 minutes
**Step ID:** S01, S02

| Field | Value |
|-------|-------|
| **Check** | Fresh GitHub repo with no pre-hackathon commits; submodules added |
| **Command** | `git init` → first commit → `git submodule add https://github.com/evefrontier/world-contracts.git vendor/world-contracts` → `git submodule add https://github.com/evefrontier/builder-scaffold.git vendor/builder-scaffold` |
| **Expected Output** | `git log --oneline` shows exactly 1 commit. `git submodule status` shows both submodules. |
| **Fallback** | If upstream repos are private/removed, use cached copies from sui-playground vendor/ |

> **⚠️ Path renaming (builder-scaffold 3c65b22):** Upstream `builder-scaffold` renamed reference code directories: `smart_gate` → `smart_gate_extension`, `storage_unit` → `storage_unit_extension`. Both old and new directories coexist, but the `_extension` variants are the canonical, up-to-date reference implementations. When referencing scaffold examples for Move contract patterns or TS scripts, use `move-contracts/smart_gate_extension/` and `ts-scripts/smart_gate_extension/`. Using the old `smart_gate/` path may yield stale or stripped-down code.

**Result:** ☐ PASS ☐ FAIL

---

## Check 3: Verify Critical Function Signatures (A1–A4)

**Priority:** CRITICAL — Hard Stop if any changed
**Time budget:** 15 minutes
**Step ID:** S03

### A1: gate::authorize_extension

| Field | Value |
|-------|-------|
| **Check** | `gate::authorize_extension<Auth: drop>` is public, accepts `&mut Gate, &OwnerCap<Gate>` |
| **Command** | `grep -n "authorize_extension" vendor/world-contracts/contracts/world/sources/assemblies/gate.move` |
| **Expected Output** | `public fun authorize_extension<Auth: drop>(gate: &mut Gate, owner_cap: &OwnerCap<Gate>)` — stores TypeName via `swap_or_fill` |
| **Fallback** | **HARD STOP.** If signature changed, assess impact. If removed, project is unviable. |

> **v0.0.18 update:** `authorize_extension` now has a freeze guard (`EExtensionConfigFrozen`). If extension config is frozen, further authorize calls revert. Check `is_extension_frozen()` before calling.

### A2: gate::issue_jump_permit

| Field | Value |
|-------|-------|
| **Check** | `gate::issue_jump_permit<Auth: drop>` is public, callable from external packages |
| **Command** | `grep -n "issue_jump_permit" vendor/world-contracts/contracts/world/sources/assemblies/gate.move` |
| **Expected Output** | Public function accepting source Gate, dest Gate, Character, extension witness, expiry, ctx |
| **Fallback** | **HARD STOP.** Cannot implement GateControl without this function. |

### A3: storage_unit::withdraw_item without OwnerCap

| Field | Value |
|-------|-------|
| **Check** | `storage_unit::withdraw_item<Auth: drop>` does NOT require OwnerCap — only typed witness |
| **Command** | `grep -n "withdraw_item" vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move` |
| **Expected Output** | Function parameters include `&mut StorageUnit, &Character, Auth, item_type_id` — NO `&OwnerCap` parameter |
| **Fallback** | **HARD STOP for TradePost.** If OwnerCap is required, can only trade items from same owner. Pivot to GateControl-only submission. |

### A4: Item has key+store abilities

| Field | Value |
|-------|-------|
| **Check** | `Item` struct has `key, store` abilities — `transfer::public_transfer` is valid |
| **Command** | `grep -n "struct Item" vendor/world-contracts/contracts/world/sources/primitives/inventory.move` |
| **Expected Output** | `public struct Item has key, store { ... }` |

> **v0.0.15 update:** `Item` struct has been split into `Item` (on-chain, key+store) and `ItemEntry` (in-inventory representation). `Item` now includes a `parent_id` field that ties it to its origin SSU. Verify both structs when checking abilities.
| **Fallback** | If only `key` (no `store`), cannot transfer items to buyer. TradePost unviable. Pivot to GateControl-only. |

**Result:** ☐ A1 PASS ☐ A2 PASS ☐ A3 PASS ☐ A4 PASS — Any FAIL = HARD STOP

### A_T1 (Optional): Turret extension pattern verification

| Field | Value |
|-------|-------|
| **Check** | Verify `turret::authorize_extension<Auth>` follows same swap_or_fill pattern as gate. Confirm default turret targeting excludes same-tribe non-aggressors. |
| **Command** | `grep -n "authorize_extension" vendor/world-contracts/contracts/world/sources/assemblies/turret.move` |
| **Expected Output** | Same `swap_or_fill` pattern as gate. Default `get_target_priority_list` filters by tribe + aggression status. |
| **Note** | Source review only; runtime validation requires game-engine objects (Character, Turret online state). Not blocking for Day-1 MVP. See [Turret Contract Surface](../architecture/turret-contract-surface.md). |

**Result:** ☐ A_T1 CONFIRMED (optional)

---

## Check 4: Connect to Hackathon Test Server

**Priority:** CRITICAL
**Time budget:** 15 minutes
**Step ID:** S04

| Field | Value |
|-------|-------|
| **Check** | Connect Sui CLI to hackathon test server, discover all package/object IDs |
| **Command** | `sui client new-env --alias testserver --rpc <RPC_URL>` → `sui client switch --env testserver` → `sui client active-env` |
| **Expected Output** | "testserver" returned. `sui client objects` returns results. |
| **Fallback** | If test server unavailable: `cd vendor/builder-scaffold/docker; docker compose run --rm sui-dev`. Use local devnet. Record decision in notes. |

### 4a: Discover World Package ID

| Field | Value |
|-------|-------|
| **Command** | Query for known types: `sui client objects --json \| Select-String "GovernorCap"` or browse RPC explorer |
| **Expected Output** | World package ID (0x...), GovernorCap ID, AdminACL ID, ObjectRegistry ID, GateConfig IDs (if applicable) |
| **Fallback** | If world-contracts not published on test server: publish from vendor copy using `sui client publish` |

### 4b: Verify RPC Capabilities

| Field | Value |
|-------|-------|
| **Command** | `curl -X POST <RPC_URL> -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"suix_queryEvents","params":[{"MoveEventType":"0x2::display::DisplayCreated"},null,1,false],"id":1}'` |
| **Expected Output** | JSON response with `result` field (events array, possibly empty). Confirms event query RPC works. |
| **Fallback** | If `suix_queryEvents` not available: Signal Feed degraded to tx-digest-based reads only. |

**Result:** ☐ Connected ☐ World Package ID: __________ ☐ AdminACL ID: __________ ☐ RPC OK

---

## Check 5: AdminACL Sponsor Access (CRITICAL PATH)

**Priority:** CRITICAL — Single largest Day-1 risk
**Time budget:** 30 minutes
**Step ID:** S05

| Field | Value |
|-------|-------|
| **Check** | CivControl team address can be added to AdminACL as authorized sponsor |
| **Expected Output** | Sponsor address appears in `AdminACL.authorized_sponsors` table |

### Branch A: Auto-Sponsorship (65% probability)

| Field | Value |
|-------|-------|
| **Check** | Test server admin tools / faucet auto-add addresses to sponsor list |
| **Command** | Attempt a sponsored transaction: construct a `gate::jump_with_permit` dry run (devInspect) with a sponsor address |
| **Expected Output** | Transaction simulation succeeds without `ENotAuthorizedSponsor` abort |

### Branch B: Request Access (25% probability)

| Field | Value |
|-------|-------|
| **Check** | Contact CCP/organizers to request sponsor enrollment |
| **Command** | Discord message / hackathon support channel |
| **Expected Output** | Confirmation that address was added |

### Branch C: Local Devnet (10% probability — fallback)

| Field | Value |
|-------|-------|
| **Check** | Own GovernorCap on local devnet → self-add sponsor |
| **Command** | Publish world-contracts → own GovernorCap → `access::add_sponsor_to_acl(&mut AdminACL, &GovernorCap, sponsor_addr)` |
| **Expected Output** | Sponsored gate jump succeeds on local devnet. Demo captured locally. |

### Branch Activation Decision

| Outcome | Time Spent | Action |
|---------|-----------|--------|
| Branch A works | ≤ 10 min | Continue with test server |
| Branch A fails, B response received | ≤ 30 min | Wait for confirmation, continue with Foundation in parallel |
| Branch A fails, B no response after 30 min | 30 min | Activate Branch C. Local devnet for all demo content. |
| All branches fail | 60 min | **HARD STOP for sponsored operations.** Submit GateControl config-only demo (no jumps). |

**Result:** ☐ Branch A ☐ Branch B ☐ Branch C ☐ HARD STOP — Sponsor Address: __________

> **Note (verify_sponsor sender fallback):** `verify_sponsor(ctx)` checks `tx_context::sponsor(ctx)` first; if `Option::none` (non-sponsored tx), it falls back to `tx_context::sender(ctx)`. A non-sponsored transaction succeeds if the sender is in AdminACL. Self-sponsorship (sender == sponsor) is equivalent to a non-sponsored tx — it does not cause a special failure. Branch C on local devnet may use sender-in-AdminACL as explicit verification path.

---

## Check 6: Per-Gate Dynamic Field Keys

**Priority:** HIGH
**Time budget:** 15 minutes
**Step ID:** S06

| Field | Value |
|-------|-------|
| **Check** | Compound key structs with embedded `ID` produce independent DFs on same shared config |
| **Command** | Publish test package with `TribeRuleKey { gate_id: ID }` → set DF for gate_A → set DF for gate_B → read both |
| **Expected Output** | Two distinct DFs on the same shared object, independently readable/writable |
| **Fallback** | If compound keys don't work: flatten to `gate_id || rule_type` byte key. Less ergonomic but functional. |

**Result:** ☐ PASS ☐ FAIL (fallback applied)

---

## Check 7: CivControl Package Compile + Publish

**Priority:** HIGH
**Time budget:** 15 minutes
**Step ID:** S09, S10

| Field | Value |
|-------|-------|
| **Check** | Minimal CivControl package compiles against world-contracts and publishes successfully |
| **Command** | `sui move build --path contracts/civcontrol` → `sui client publish --path contracts/civcontrol` |
| **Expected Output** | Build: 0 errors. Publish: tx digest + package ID + CivControlConfig shared object ID + AdminCap object ID |
| **Fallback** | If dependency resolution fails: check Move.toml `[dependencies]` path. If world-contracts version mismatch: pin to exact commit. |

**Result:** ☐ Build PASS ☐ Publish PASS — Package ID: __________ Config ID: __________ AdminCap ID: __________

---

## Check 8: Event Schema Validation

**Priority:** MEDIUM
**Time budget:** 10 minutes
**Step ID:** Part of S14

| Field | Value |
|-------|-------|
| **Check** | World-contracts events are queryable on the target network |
| **Command** | After a test transaction: `sui client events --transaction-digest <DIGEST>` |
| **Expected Output** | Events list includes `JumpEvent`, `StatusChangedEvent`, etc. with expected field structure |
| **Fallback** | If event query returns empty: check `suix_queryEvents` with MoveEventType filter. If events not indexed: Signal Feed falls back to tx-digest-only display. |

**Result:** ☐ Events queryable ☐ Event fields match expected schema

---

## Check 9: Deterministic Proof Moment Validation

**Priority:** MEDIUM — required for demo evidence
**Time budget:** 15 minutes
**Step ID:** Part of S14

| Field | Value |
|-------|-------|
| **Check** | Each of the 5 non-negotiable proof moments produces retrievable evidence |
| **Test Sequence** | 1. Deploy policy (set tribe rule) → capture tx digest. 2. Attempt wrong-tribe jump → capture MoveAbort. 3. Correct-tribe + toll jump → capture TollCollectedEvent. 4. Trade buy → capture TradeSettledEvent. 5. Query events → verify aggregation. |
| **Expected Output** | 5 tx digests, each with correct events/abort codes |
| **Fallback** | If any proof moment fails: investigate the specific failure. If systemic (events not working on test server): fallback to local devnet for demo capture. |

**Result:** ☐ Proof 1 ☐ Proof 2 ☐ Proof 3 ☐ Proof 4 ☐ Proof 5

---

## Check 9b: Two-Transaction Permit Flow Validation

**Priority:** HIGH — gate demo depends on this
**Time budget:** 10 minutes
**Step ID:** Part of S14

| Field | Value |
|-------|-------|
| **Check** | JumpPermit issued in TX1 persists as an owned object and can be consumed by `jump_with_permit` in a separate TX2 |
| **Test Sequence** | 1. TX1: Call extension `request_jump_permit(config, src, dst, character, payment, clock, ctx)` → capture tx digest and JumpPermit object ID. 2. Verify permit exists as owned object at `character.character_address()` (query `suix_getOwnedObjects` with JumpPermit type filter). 3. TX2 (sponsored): Call `gate::jump_with_permit(src, dst, character, permit, admin_acl, clock, ctx)` → capture tx digest and JumpEvent. 4. Verify permit object no longer exists (deleted on consumption). |
| **Expected Output** | TX1 succeeds with permit object created. TX2 succeeds with JumpEvent emitted and permit deleted. |
| **Blocking?** | Yes — if permits do not persist across transactions, the entire gate demo flow fails. |
| **Fallback** | If TX2 fails with object-not-found: check TX1 confirmation latency. Retry with explicit `waitForTransaction` between TX1 and TX2. |

**Result:** ☐ TX1 permit issued ☐ Permit persists ☐ TX2 jump succeeds ☐ Permit consumed

---

## Check 9c: Bouncer Turret Posture Validation

**Priority:** MEDIUM — upgrade-path for Business posture (not a demo blocker)
**Time budget:** 20 minutes
**Step ID:** Part of S14
**Internal terminology:** "bouncer turret" (alias: "peacekeeper turret")

> **Context:** Code inspection suggests a custom turret extension could return an empty target list (suppress all fire) while still including aggressors. If validated, Business posture could become "online but passive" instead of "offline" — a significant product upgrade for market/trade post scenarios. This is NOT yet proven at runtime. Current fallback (turrets offline in Business) is unaffected.

| Field | Value |
|-------|-------|
| **Check** | Can a turret remain ONLINE, suppress fire on neutral traffic, and still engage aggressors? |
| **Pre-requisite** | Deploy a minimal "bouncer" turret extension that: (a) filters out all non-aggressor candidates, (b) returns only candidates where `is_aggressor == true` or `behaviour_change == STARTED_ATTACK`. |
| **Test Sequence** | 1. Deploy bouncer extension package → authorize on test turret. 2. Bring turret online (via OwnerCap). 3. Verify turret remains online without firing at neutral/same-tribe traffic (empty return list path). 4. Trigger aggression scenario → verify turret targets aggressor. 5. STOPPED_ATTACK → verify turret de-escalates (aggressor removed from return list). |
| **Expected Output** | Turret online + no fire on neutrals + fire on aggressors + de-escalation on stop. |
| **Scaling check** | If basic behavior validates: test authorizing the same bouncer extension on 2+ turrets. Verify `authorize_extension` can be called per-turret in a single PTB (borrow/authorize/return per cap). Confirm posture-switch PTB can toggle between bouncer and default extension (or remove extension) across multiple turrets. |
| **Fallback** | If empty list causes game engine error, or aggression filtering doesn't work as expected: keep current model (Business = offline, Defense = online/aggressive). No demo rewrite needed. |
| **Blocking?** | No — this is an upgrade-path validation. Main demo uses offline/online toggle regardless of outcome. |

**Result:** ☐ Empty list → turret stands down ☐ Aggressor targeted ☐ De-escalation works ☐ Multi-turret extension rollout feasible ☐ NOT VALIDATED (keep fallback)

---

## Check 10: Wallet Connectivity

**Priority:** MEDIUM
**Time budget:** 10 minutes
**Step ID:** S08

| Field | Value |
|-------|-------|
| **Check** | `@mysten/dapp-kit` connects to a wallet on the target network |
| **Command** | Run dev server → click "Connect Wallet" → verify address displays |
| **Expected Output** | Wallet address displayed. `useCurrentAccount()` returns non-null. |
| **Fallback** | If EVE Vault doesn't support the chain: use Sui Wallet (standard). If no browser wallet available: use CLI-based flow with `sui client ptb` for demo capture. |

**Result:** ☐ PASS — Wallet: __________

---

## Check 11: In-Game Browser Surface Validation

**Priority:** MEDIUM — required for "Best Live Frontier Integration" bonus
**Time budget:** 15 minutes
**Step ID:** Part of S07

| Field | Value |
|-------|-------|
| **Check** | CivilizationControl DApp loads and renders in EVE Frontier in-game embedded browser |
| **Pre-requisite** | DApp deployed to HTTPS hosting (Cloudflare Pages) with at least a shell page |
| **Command** | Navigate to DApp URL in-game via a structure's DApp URL setting |
| **Expected Output** | (a) Page loads over HTTPS without mixed-content blocks. (b) CSS renders correctly at ~787×1198 portrait. (c) `window.ethereum` detected, 0 Sui wallets — "Viewing Mode" badge displayed. (d) Sui RPC calls succeed (structure data loads). (e) No CSP violations in console. |
| **Fallback** | If in-game loading fails: external browser only for demo. Document as submission constraint. In-game integration bonus forfeited. |

### Sub-checks

| Sub-check | Command | Expected |
|-----------|---------|----------|
| 11a. HTTPS loads | Open DApp URL in-game | Page renders, no security errors |
| 11b. Portrait layout | Visual inspection at ~787px width | Cards/list readable, no horizontal overflow |
| 11c. Wallet detection | Check console / UI state | EVM wallet detected, "Viewing Mode" shown |
| 11d. RPC from webview | Load a gate/SSU page with known objectId in URL | Structure data displays |
| 11e. ObjectId from URL | Navigate to `/gate/0x<id>` | Correct gate data loads |

**Result:** ☐ PASS ☐ PARTIAL (note which sub-checks failed) ☐ FAIL — external browser only

---

## Summary Gate

All checks completed. Record final status:

| Check | Result | Notes |
|-------|--------|-------|
| 1. Hackathon started | ☐ | |
| 2. Fresh repo + submodules | ☐ | |
| 3. Function signatures (A1-A4) | ☐ | |
| 4. Test server + IDs | ☐ | |
| 5. AdminACL sponsor | ☐ | Branch: ___ |
| 6. Per-gate DF keys | ☐ | |
| 7. Package compile + publish | ☐ | |
| 8. Event schema | ☐ | |
| 9. Proof moments | ☐ | |
| 10. Wallet connectivity | ☐ | |
| 11. In-game browser surface | ☐ | |

**GO / NO-GO Decision:**
- All CRITICAL checks pass → **GO** — proceed to Phase 1 Foundation
- Any HARD STOP triggered → Document decision, activate fallback, reassess scope
- AdminACL Branch C activated → Continue with local devnet, note demo capture constraint

**Time limit:** If all checks not resolved within 2 hours, proceed with what works and note gaps. Do not spend more than 2 hours on validation.
