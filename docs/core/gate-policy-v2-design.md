# Gate Policy v2 — Contract Upgrade Design

**Retention:** Carry-forward
**Created:** 2026-03-22
**Status:** v2a implemented — fresh publish on Utopia testnet (2026-03-22)
**Purpose:** Define the contract-upgrade plan for richer gate policy, posture-aware gate rules, and optional subscription permits. Driven by operator intent and demo beat sheet requirements.

---

## A. Desired Behavior Model

### Operator Intent

The operator wants per-gate policies that express **tribe-specific access and toll ladders** with a **default fallback**, switchable between posture presets.

#### Commercial Policy Example
| Match | Access | Toll |
|---|---|---|
| Own tribe (tribe 42) | Allowed | Free (0 EVE) |
| Allied tribe A (tribe 17) | Allowed | 2 EVE |
| Neutral tribe B (tribe 88) | Allowed | 10 EVE |
| Default (any other tribe) | Allowed | 25 EVE |

#### Defensive Policy Example
| Match | Access | Toll |
|---|---|---|
| Own tribe (tribe 42) | Allowed | Free |
| Allied tribe A (tribe 17) | Allowed | Free |
| Default (any other tribe) | **Denied** | — |

### Minimum Model Requirements
1. **Multiple tribe-specific entries per gate** — each with access (allow/deny) and toll amount
2. **Default fallback rule** — applies when character's tribe matches no specific entry
3. **Posture presets** — at minimum Commercial and Defensive, stored per gate
4. **Active posture selects which preset is enforced** — posture switch swaps the active ruleset
5. **Per-gate independence** — each gate can have different policy content under the same posture

### Not Required for Demo
- Blacklist model (deny specific tribe, allow all others) — the default-deny in Defensive preset covers this need
- Per-direction rules (source gate only, by design)
- Multi-coin-type tolls (EVE only)
- Time-based rule activation windows

---

## B. Minimum Viable v2 Scope for Demo

### Core Question: What Is Needed for the Demo Story?

The demo beat sheet needs:
- **Beat 3 (Policy):** Operator sets tribe filter + toll → visible on-chain governance
- **Beat 4 (Denial):** Hostile denied by chain enforcement
- **Beat 5 (Revenue):** Ally jumps, toll collected
- **Beat 6 (Defense Mode):** One click → posture switch changes gate policy + turret doctrine

The current v1 contract handles Beats 3–5 adequately with single tribe + single toll. **Beat 6 is the gap:** the posture switch does not change gate rules.

### Minimum Viable v2 Scope

The smallest contract change that honestly supports the demo is:

1. **Per-gate policy preset storage** — Commercial ruleset + Defensive ruleset per gate
2. **Each preset contains:** a vector of tribe-specific entries + a default fallback rule
3. **Posture switch flips active preset** — `request_jump_permit` reads the active preset
4. **Admin CRUD for preset entries** — set/remove tribe entries per preset per gate

### Scope Splits

| Tranche | Scope | Demo Need |
|---|---|---|
| **v2a — Policy richness + posture presets** | Multi-tribe rules, per-tribe tolls, default fallback, posture-aware gate enforcement | **Required for demo** |
| **v2b — Subscription permits** | Time-limited pass ledger, purchase/check/expiry | **Not required for demo** — defer |

**Confirmed:** v2a only. Subscription permits add contract complexity (SubPassLedger table, purchase entry function, expiry check in permit path) without improving any beat sheet moment. The existing 5-day TTL on JumpPermit is sufficient for demo purposes.

### Blacklist Support

**Not needed for demo.** The Defensive preset's default-deny rule achieves the same operator goal: only allowlisted tribes can transit. A true blacklist (deny tribe X, allow all others) is a different semantic that doesn't appear in any beat sheet beat.

---

## C. Data Model Options

### Option 1: Preset Object with Vector of Policy Entries (Recommended)

Store per-gate policy presets as dynamic fields on `GateConfig`, keyed by `(gate_id, mode)`.

```
PolicyPresetKey { gate_id: ID, mode: u8 }    →    PolicyPreset {
                                                       entries: vector<TribePolicyEntry>,
                                                       default_access: bool,
                                                       default_toll: u64,
                                                   }

TribePolicyEntry {
    tribe: u32,
    access: bool,     // true = allowed, false = denied
    toll: u64,        // toll in base units (0 = free); only meaningful if access = true
}
```

**Permit issuance logic:**
1. Read active posture mode from `PostureState` DF (already exists)
2. Look up `PolicyPresetKey { gate_id, mode }` → `PolicyPreset`
3. Linear scan `entries` for matching `tribe` (vectors are small — typically 2–5 entries)
4. If found: check `entry.access` (deny → abort), charge `entry.toll`
5. If not found: check `default_access` (deny → abort), charge `default_toll`
6. Transfer toll to global treasury (stored once on `GateConfig`, not per-preset), issue permit

> **v0.0.21 update:** World-contracts v2 (`v0.0.20`/`v0.0.21`) adds `gate::issue_jump_permit_with_id<Auth>()` which returns the new permit's `ID` and emits a `JumpPermitIssuedEvent`. The v2a contract should use `issue_jump_permit_with_id` instead of `issue_jump_permit` to capture the permit ID for events and return values.

**Tradeoffs:**

| Aspect | Assessment |
|---|---|
| Enables multi-tribe rules | Yes — vector of entries |
| Enables per-tribe tolls | Yes — toll per entry |
| Enables default fallback | Yes — `default_access` + `default_toll` fields |
| Enables posture-aware presets | Yes — keyed by `(gate_id, mode)` |
| Posture switch efficiency | Instant — just flip the posture DF; permit issuance reads active mode at call time. No batch rewrite of gate rules needed. |
| Complexity | Low-medium — one new DF key/value pair, one new struct |
| Read path (frontend) | One DF read per preset per gate (2 reads to show both presets) |
| Vector size risk | Negligible — tribe entries per gate will be <10 for any realistic scenario. Well within Sui object size limits. |
| Upgrade compatibility | See Section F |

### Option 2: Per-Tribe Dynamic Fields

Store each tribe entry as a separate DF keyed by `(gate_id, mode, tribe)`.

```
TribePolicyKey { gate_id: ID, mode: u8, tribe: u32 }  →  TribePolicyValue { access: bool, toll: u64 }
DefaultPolicyKey { gate_id: ID, mode: u8 }             →  DefaultPolicy { access: bool, toll: u64, treasury: address }
```

**Tradeoffs:**

| Aspect | Assessment |
|---|---|
| Enables multi-tribe rules | Yes |
| Per-tribe tolls | Yes |
| Default fallback | Yes (separate DF) |
| Posture presets | Yes — mode in key |
| Posture switch efficiency | Same as Option 1 — no batch rewrite needed |
| Complexity | Medium — more DF types, more CRUD functions |
| Read path (frontend) | **Problematic** — must enumerate all tribe entries per gate. Sui `getDynamicFields` returns paginated results; no prefix scan for compound keys. Frontend must know which tribes to query, or fetch all DFs and filter. |
| Vector size risk | N/A (no vectors) |

**Confirmed: Option 1.** The vector-in-preset approach is simpler, has a clean read path (one DF read returns the full preset), and avoids the DF enumeration problem. Vector sizes capped at 20 entries per preset (gas safety).

---

## D. Posture Semantics Under v2

### What Posture Switch Does

Under v2a, the posture switch PTB becomes:

| Step | Move Call | Purpose |
|---|---|---|
| 1 | `posture::set_posture(config, admin, mode)` | Flip posture label, emit `PostureChangedEvent` |
| 2..N | Per turret: `borrow_owner_cap<Turret>` → `authorize_extension<Auth>` → `return_owner_cap<Turret>` | Swap turret extension witness |

**Gate rules are NOT batch-rewritten.** The key insight: because `request_jump_permit` reads the active posture at call time and uses `PolicyPresetKey { gate_id, mode: active_mode }` to look up the preset, flipping the posture DF **instantly** changes which preset is enforced on every gate. No per-gate MoveCall is needed in the posture switch PTB.

This means:
- **Posture switch remains a single PTB** — `set_posture` + N × turret swaps (exactly as today)
- **Gate policy enforcement changes immediately** — next `request_jump_permit` reads the new mode
- **No additional gas cost per gate** — posture switch cost is O(turrets), not O(turrets + gates)

### Single-Click Operator Experience

1. Operator clicks "Defense Mode"
2. PTB executes: `set_posture(mode: DEFENSE)` + turret extension swaps
3. On confirmation:
   - Turret doctrine active: `DefenseAuth` (higher hostility thresholds)
   - Gate policy active: each gate's Defensive preset (deny-by-default + allowlisted allies)
   - Topology transitions: all glyphs shift to amber/defense colors
   - Signal Feed: `PostureChangedEvent` appears
4. Next jump attempt on any gate evaluates `PolicyPresetKey { gate_id, mode: DEFENSE }`

### What Happens if a Gate Has No Preset for the Active Mode?

**Confirmed: Abort.** If no `PolicyPreset` DF exists for the active mode + gate, `request_jump_permit` aborts. This forces the operator to configure both presets before switching. The frontend must validate that all gates have both presets configured before allowing posture switch. The `useOperatorReadiness` hook already checks preconditions; add preset completeness to it.

---

## E. Permit / Subscription Support

### Recommendation: Defer to v2b

**Include now?** No.

**Why:**
1. No beat sheet beat depends on subscription permits
2. The 5-day TTL on `JumpPermit` is sufficient for demo purposes
3. Subscription adds ~100 LoC of contract code (`SubPassLedger` table, `purchase_subscription`, `has_active_subscription` check in permit path) with no demo payoff
4. Subscription changes the `request_jump_permit` flow (check SubPass before toll), adding test surface area

### If Included Later (v2b)

**Smallest supportable version:**

```
SubPassKey { gate_id: ID }  →  SubPassLedger { passes: Table<ID, u64> }
                                              // character_id → expiry_timestamp_ms

SubTierKey { gate_id: ID }  →  SubTierConfig { price: u64, duration_ms: u64 }
```

- `purchase_subscription(config, gate, character, payment, clock, ctx)` — adds/updates entry in `SubPassLedger`
- `has_active_subscription(config, gate_id, character_id, clock): bool` — checks `passes[character_id] >= clock.timestamp_ms()`
- In `request_jump_permit`: after tribe check, before toll: if `has_active_subscription` → skip toll
- Expired entries are **not auto-cleaned** — they sit in the table as stale entries. Cleanup can be a separate admin function or happen on next purchase.
- `delete_jump_permit()` (upstream) is not related to subscriptions — it deletes `JumpPermit` objects, not pass entries. Expiry is checked on read, not enforced by deletion.

### Expiry Representation

- Stored as `u64` timestamp in milliseconds (same as `JumpPermit.expires_at_timestamp_ms`)
- Validated at permit issuance time: `passes[character_id] >= clock.timestamp_ms()`
- No background cleanup; stale entries are harmless (fail the comparison)
- Admin can optionally remove stale entries to reclaim storage

---

## F. Upgrade / Deployment Implications

### Assessment: Fresh Publish Required

**Confirmed: Fresh publish.** Not a compatible upgrade.

Evidence:

1. **`request_jump_permit` signature changes.** The current public function takes `(config, source_gate, destination_gate, character, payment, clock, ctx)`. Under v2a, it must also read the posture DF to determine active mode. While the signature itself doesn't necessarily change (it can read posture from the existing `config` DF), the **internal logic changes fundamentally** — it no longer reads `TribeRuleKey` / `CoinTollKey` DFs but instead reads `PolicyPresetKey` DFs.

2. **Old DF key/value types become dead.** `TribeRuleKey`, `TribeRule`, `CoinTollKey`, `CoinTollRule` are replaced by `PolicyPresetKey` and `PolicyPreset`. Any existing DFs on the current `GateConfig` object using old keys would be orphaned. The shared `GateConfig` object itself could be reused (it's just a `UID` container), but its DFs would need migration.

3. **New struct types introduced.** `PolicyPresetKey`, `PolicyPreset`, `TribePolicyEntry` are new types. Sui upgrades allow adding new types via `additive` policy, so this is not inherently blocking — but the change to `request_jump_permit` internal logic goes beyond additive.

4. **Upgrade policy check.** The current `Published.toml` shows `version = 1` with an `upgrade-capability` present. Sui Move upgrade compatibility rules:
   - `compatible`: cannot change public function signatures, cannot remove public functions, cannot change struct layouts
   - `additive`: can add new modules and new public functions, cannot modify existing
   - `dep_only`: can only change dependencies

   The v2a changes require modifying `request_jump_permit` internal logic (reading different DFs). If the function signature stays the same and only internal behavior changes, this **could** be a `compatible` upgrade — Sui checks ABI compatibility (function signatures and struct layouts), not internal logic. However:
   - If we want to **remove** `set_tribe_rule`, `set_coin_toll`, `remove_tribe_rule`, `remove_coin_toll` (replaced by preset CRUD), that breaks `compatible`.
   - If we keep them as no-ops or deprecated stubs, upgrade is possible but messy.

### Confirmed Path

**Fresh publish.** Rationale:
- Cleaner than maintaining deprecated function stubs
- No orphaned DF migration to worry about
- `GateConfig` and `AdminCap` are re-created; frontend constants updated
- The `GateAuth` witness type changes package origin, so **all gates must be re-authorized** with the new extension after publish
- Total re-authorization is already a known workflow (done for v1 and the previous v2 upgrade)

> **v0.0.21 update:** Upstream world-contracts have been upgraded to v2 on Utopia (Utopia `published-at` = `0x07e6b810c2dff6df56ea7fbad9ff32f4d84cbee53e496267515887b712924bd1`, `original-id` = `0xd12a70...` unchanged). CC's fresh publish will compile against world v2 source, gaining access to `issue_jump_permit_with_id` and `JumpPermitIssuedEvent`. The world `original-id` (`0xd12a70...`) remains the canonical type origin for all v1-era types (Gate, JumpPermit, etc.). CC's current on-chain contract (compiled against world v1) is unaffected — `gate::issue_jump_permit` remains callable.

### Migration Checklist (Post-Publish)
1. Publish new package → record new package ID, `GateConfig` ID
2. Update `src/constants.ts` with new IDs
3. Re-authorize all gates with new `GateAuth` extension
4. Configure Commercial + Defensive presets for each gate
5. Set initial posture
6. Verify permit issuance works under both presets

---

## G. Recommended Implementation Order

> **Status (2026-03-22):** All steps 1–10 are implemented. v2a contract published, frontend adapted, gates re-authorized, presets configured, posture verified. Batch preset deployment (Section H) also implemented.

| # | Step | Type | Dependency |
|---|---|---|---|
| 1 | **Finalize this design** — operator confirms behavior model, preset structure, and scope split (v2a now, v2b later) | Decision | None |
| 2 | **Implement v2a contract** — new `PolicyPreset` DF model, updated `request_jump_permit`, preset CRUD functions, events | Contract | Step 1 |
| 3 | **Move tests** — tribe ladder, default fallback, deny-by-default, posture-aware enforcement, edge cases | Contract | Step 2 |
| 4 | **Publish to Utopia testnet** — fresh publish, record artifact IDs | Deploy | Step 3 |
| 5 | **Frontend: constants + read path** — update package IDs, adapt `suiReader.ts` for new DF structure, update domain types | Frontend | Step 4 |
| 6 | **Frontend: policy composer UI** — richer rule editor for preset entries (tribe + access + toll per entry, default fallback) | Frontend | Step 5 |
| 7 | **Frontend: posture PTB** — no change needed if posture switch only flips the posture DF + turret swaps (gate enforcement reads active mode dynamically) | Frontend | Step 5 |
| 8 | **Frontend: gate re-authorization** — re-authorize all gates with new `GateAuth` | Operations | Step 4 |
| 9 | **Defense Mode visual tranche** — gate glyphs + link colors respond to posture | Frontend (UI) | Can proceed in parallel from Step 1 |
| 10 | **Beat sheet update** — correct narration to match actual v2 PTB behavior | Docs | Step 7 |

### Parallelization

- **Steps 2–4** (contract) and **Step 9** (UI visuals) can proceed in parallel — they have no dependency on each other.
- **Steps 5–8** (frontend adaptation) must wait for Step 4 (published package IDs).
- **Step 10** (beat sheet) should wait until the PTB behavior is finalized.

---

## Confirmed Decisions

All open questions resolved by operator on 2026-03-22.

| # | Decision | Confirmed Answer |
|---|---|---|
| 1 | v2a/v2b split: policy richness now, subscriptions later | **Yes** — v2a only for demo |
| 2 | Missing preset for active mode + gate → abort or open? | **Abort** — frontend validates preset completeness before posture switch |
| 3 | Deprecated v1 functions: stubs or fresh publish? | **Fresh publish** — no stubs |
| 4 | Treasury address: per-gate or global? | **Per-gate treasury** (keyed by `TreasuryKey{gate_id}`) — operator sets per gate via `set_treasury` |
| 5 | Max entries per preset | **Cap at 20** (gas safety) |
| 6 | Posture modes: extensible or fixed? | **Fixed at 2** (Commercial / Defensive) for demo |

---

## H. Operator Workflow: Author Once, Apply to Many Gates

> **Status (2026-03-22):** Implemented. PTB builder in `src/lib/gatePolicyTx.ts` iterates borrow/call/return `OwnerCap<Gate>` per target gate. UI shows "Apply to All Gates" plus selective gate picker in `PolicyPresetEditor.tsx`.

### Requirement

The operator manages multiple gates (currently 4). Authoring a full policy preset (tribe entries, default rule) per gate × per mode (2) means up to 8 nearly-identical configurations. The operator wants to **author a policy template once and deploy it to multiple gates**.

### On-Chain vs. Off-Chain

Policy templates are a **UX convenience, not an on-chain primitive.** On-chain, each gate stores its own `PolicyPreset` DF keyed by `(gate_id, mode)`. The contract has no concept of templates or shared presets.

The "author once, apply to many" workflow lives entirely in the **frontend:**

1. **Policy Composer UI** — operator authors a preset (tribe entries + default rule) in a reusable form
2. **Gate selector** — operator selects which gates receive this preset and for which mode (Commercial / Defensive)
3. **PTB generation** — frontend builds a single PTB with N × borrow_owner_cap/`set_policy_preset`/return_owner_cap calls — one per selected gate
4. **Single signature** — operator signs once; all gates configured atomically

### Contract Implication

The `set_policy_preset` function must accept the full preset content as arguments (vector of entries, default rule) rather than requiring incremental add/remove calls. This enables the PTB-batching pattern:

```
borrow_owner_cap<Gate>(character, gate_A) → owner_cap_a
set_policy_preset(config, owner_cap_a, gate_A, COMMERCIAL, entries, default_access, default_toll)
return_owner_cap<Gate>(character, owner_cap_a)

borrow_owner_cap<Gate>(character, gate_B) → owner_cap_b
set_policy_preset(config, owner_cap_b, gate_B, COMMERCIAL, entries, default_access, default_toll)
return_owner_cap<Gate>(character, owner_cap_b)
```

If the operator wants different entries for one gate, they edit that gate individually after the batch deploy.

### Treasury

The global treasury is the **operator's payout address** — the wallet address controlled by the infrastructure owner. Toll revenue transfers go **directly** to this address via `transfer::public_transfer(payment, treasury_address)`. There is no claim flow, no escrow object, and no intermediate treasury bucket. The operator sets this address once per gate via `set_treasury(config, owner_cap, gate_id, address)`, defaulting to their own wallet.

> This matches the current v1 behavior where `set_coin_toll` takes a `treasury: address` and `request_jump_permit` transfers toll payment directly to that address.

### Constraints

- Max entries per preset: 20 (gas safety, enforced on-chain)
- Max gates per PTB: bounded by Sui's 1000-command PTB limit; 4 gates × 2 modes × 1 call each = 8 commands — well within limits
- Template persistence: frontend-only (localStorage or hardcoded defaults); no on-chain template registry
