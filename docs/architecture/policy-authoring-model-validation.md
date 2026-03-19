# Policy Authoring Model Validation — GateControl (and Future Turrets)

**Retention:** Carry-forward

> **Date:** 2026-02-19  
> **Source:** Targeted feasibility analysis across world-contracts, builder-scaffold, builder-documentation, evevault  
> **Question:** Can players configure enforcement rules (deny/allow/toll) via CivilizationControl UI without writing Move code?

> **2026-03-10 submodule refresh:** Builder-scaffold renamed `smart_gate/` → `smart_gate_extension/`. References to `smart_gate/` below use the pre-rename path.

---

## Verdict: Model 2 — "Publish Once, Configure via Data"

**The correct product model is:**

1. **CivilizationControl team** publishes ONE extension package containing all rule logic (tribe filter, coin toll, allow/deny list, time window).
2. **End users never write or publish Move code.** They configure pre-built rule modules via the UI (toggles, dropdowns, number inputs, address lists).
3. **Policy = dynamic field data on a shared config object.** Each rule type is a Key/Value pair attached via Sui dynamic fields. Per-gate differentiation uses gate-ID-keyed compound keys.
4. **The UI constructs PTBs** that call admin functions on the shared config object. Users sign with their wallet. No backend co-signing required if config functions are gated on `OwnerCap<Gate>`.

This model is **VERIFIED as architecturally feasible** based on the `ExtensionConfig` + dynamic field pattern proven in both `vendor/world-contracts/contracts/extension_examples/` and `vendor/builder-scaffold/move-contracts/smart_gate/`.

---

## Phase 0 — Direct Answers

### A) Can an end user create a new gate policy purely via UI?

**YES** — with one important qualifier: "new policy" means a new combination of **pre-built rule types** with user-chosen parameters. Users cannot create entirely new rule *types* without Move code. Within the template menu (tribe filter, coin toll, allow list, deny list, time window), policy creation is fully data-driven.

**Why this is architecturally guaranteed:** The typed witness pattern requires a published module to define the `Auth` type and permit-issuance logic. But the *rules* within that module are read from dynamic field data at runtime. The module code is generic — it checks "does a tribe rule exist? does a toll rule exist?" and evaluates each against runtime data. No new Move code is needed to configure a gate with "Allow Tribe 7, charge 5 SUI toll."

### B) On-chain representation of a "policy"

A policy is the **sum of active dynamic fields** on the shared `ExtensionConfig` object for a specific gate:

```
ExtensionConfig (shared object, one per CivilizationControl deployment)
├── id: UID
└── [dynamic fields]
    ├── (TribeRuleKey { gate_id: ID_A }, TribeRule { tribe_id: 7 })
    ├── (CoinTollKey { gate_id: ID_A }, CoinTollRule { price: 5_000_000_000, treasury: @0x... })
    ├── (AllowListKey { gate_id: ID_A }, AllowListRule { addresses: vector[@0x1, @0x2] })
    ├── (TribeRuleKey { gate_id: ID_B }, TribeRule { tribe_id: 3 })
    └── ... (per-gate, per-rule-type entries)
```

The gate's `extension` field stores `Some(TypeName)` pointing to the CivilizationControl `GateAuth` witness type, set once via `authorize_extension<GateAuth>`.

### C) If purely data-driven were impossible — closest achievable UX

N/A — answer A is "yes" within the template-based model. No fallback needed.

### D) Can "create policy" + "apply policy to gate" happen in one PTB?

**First-time setup (2 operations, composable in one PTB if same owner):**
1. `authorize_extension<GateAuth>` on BOTH source and destination gates (requires `OwnerCap<Gate>` for each, borrowed via hot-potato from Character)
2. Set config rules: `set_tribe_rule(config, gate_id, tribe_id)`, `set_coin_toll(config, gate_id, price, treasury)`, etc.

If the same player owns both linked gates → **single PTB**. If different owners → requires 2+ transactions (cooperation).

**Policy updates (changing active rules):**
Always a **single PTB**. Toggle tribe on/off, change toll amount, add addresses to allowlist — each is a dynamic field operation on the shared config.

### E) Reuse semantics

| Concept | How it works |
|---------|-------------|
| **Extension type** | Shared across ALL gates that call `authorize_extension<GateAuth>`. One published package serves unlimited gates. |
| **Config object** | ONE shared `ExtensionConfig` per CivilizationControl deployment. All gates' rules live here. |
| **Per-gate rules** | Gate-ID-keyed dynamic fields. Each gate has independent rule entries. Gate A can have tribe=7 + toll=5, Gate B can have tribe=3 + no toll. |
| **"Copy policy"** | Not built into the framework. UI can implement "copy from gate X" by reading X's config and writing the same values for gate Y. |
| **Shared rules** | Not natively supported — each gate has its own DF entries. A "policy template" concept (named preset of rules) would be a UI-only abstraction over per-gate DFs. |

### F) Permissions

| Operation | Capability required | Who holds it |
|-----------|-------------------|-------------|
| Authorize extension on gate | `OwnerCap<Gate>` (borrow/return from Character) | Gate owner |
| Set/update config rules | **Design choice** — `AdminCap` (centralized) OR `OwnerCap<Gate>` (self-service) | Publisher or gate owner |
| Issue jump permits | `GateAuth` witness (internal to extension module) | Module code only |
| Jump with permit | Game sponsorship via `AdminACL` | Game server |

**Recommended for CivilizationControl:** Gate owners modify their own gate's config using `OwnerCap<Gate>` as auth. This enables self-service without a backend. The extension's admin functions should accept `OwnerCap<Gate>` and verify it matches the gate being configured. `AdminCap` reserved for global operations (e.g., adding new rule types, emergency shutdown).

### G) Evidence status

| Item | Status | Source |
|------|--------|--------|
| Extension witness pattern | **VERIFIED** | `gate.move` L82, L114–117; gate lifecycle rehearsal (13-step runbook) |
| Dynamic field config | **VERIFIED** | `extension_examples/config.move`; `builder-scaffold/smart_gate/sources/config.move` |
| Single extension per gate | **VERIFIED** | `gate.move` L73 (`Option<TypeName>`); no `deauthorize_extension` exists |

> **v0.0.18 update:** `authorize_extension` now has a freeze guard (`EExtensionFrozen`). Frozen assemblies reject extension replacement — beneficial for CivilizationControl's "stickiness" model.
| Permit lifecycle (issue→jump→delete) | **VERIFIED** | gate lifecycle runbook Steps 12–13 with tx digests |
| Both gates need same extension | **VERIFIED** | `gate.move` L230–235; rehearsed on devnet |
| Per-gate dynamic field keys | **DESIGN — NOT YET VALIDATED** | Extrapolation from proven DF pattern. Standard Sui capability. Day-1 validation: publish test package with gate-ID-keyed DFs. |
| OwnerCap-gated config updates | **DESIGN — NOT YET VALIDATED** | Extension module can accept `&OwnerCap<Gate>` and verify `owner_cap.id == gate.owner_cap_id`. Day-1 validation: add OwnerCap parameter to an admin function. |
| Single-PTB "Deploy Policy" from UI | **DESIGN — NOT YET VALIDATED** | PTB composition supports multiple MoveCall commands. Day-1 validation: construct PTB with authorize_extension + set_rule calls in sequence. |
| Wallet signs arbitrary PTBs | **VERIFIED** | EVE Vault signs any PTB (no command filtering). Standard Sui wallets also support this. |
| End users publish Move from browser | **TECHNICALLY POSSIBLE, PRACTICALLY INFEASIBLE** | Wallet can sign Publish tx, but requires compiled bytecode client-side. Not a realistic UX. |

---

## Evidence Summary

### world-contracts (canonical source)

**Gate extension storage:** `Gate.extension: Option<TypeName>` — stores a single extension type per gate (`gate.move` L82). Set via `authorize_extension<Auth: drop>()` which uses `swap_or_fill` (L114–117). No `deauthorize_extension` exists — extensions can be replaced but not removed.

**Permit issuance:** `issue_jump_permit<Auth: drop>(source_gate, dest_gate, character, _: Auth, expiry, ctx)` at `gate.move` L224–258. Both gates must have the same extension type. Permit is `JumpPermit { character_id, route_hash, expires_at_timestamp_ms }` — has `key, store`, single-use (deleted on jump).

**Config pattern:** `extension_examples/config.move` defines a shared `ExtensionConfig` with dynamic field helpers (`set_rule`, `borrow_rule`, `has_rule`, `add_rule`, `remove_rule`). Protected by `AdminCap` created at publish time. Multiple rule types (TribeConfig, BountyConfig) coexist on one config object as separate dynamic fields.

**No built-in policy/toll/allowlist objects** in world-contracts core. Zero matches for toll, fee, price, allowlist, denylist, policy, whitelist, blacklist across all Move files. Config is entirely an extension-level concern.

### builder-scaffold

**Confirms publish-first workflow.** README Step 4: "Build and publish your Move package. Authorize it for a Smart Assembly you own." The `smart_gate/` package defines `XAuth` witness, `ExtensionConfig`, `AdminCap`, and two example extensions (tribe_permit, corpse_gate_bounty).

**Three-role model:** Builder (publishes package) → Gate Owner (authorizes extension) → Player (uses extension to get permits). End users NEVER publish packages. The dApp template shows only read operations — no publish or config-management UI.

**Config is runtime-modifiable without republishing.** `set_tribe_config()`, `set_bounty_config()` mutate dynamic fields on the shared config. Admin posts a PTB; no redeployment needed.

**One ExtensionConfig per published package.** Created in the `init` function at publish time. All gates using that package share the same config object. Per-gate differentiation requires gate-ID-keyed dynamic fields (not in current examples, but standard DF pattern).

### builder-documentation

**Unambiguous: builders must write Move.** Gate README: "The owner deploys a custom Move contract that defines jump rules." Introduction: "write a custom Move contract and configure it as an extension." World explainer: typed witness pattern requires the builder to define their own Auth struct.

**No "config-only" or "no-code" path documented.** Zero mentions of pre-built policies, config-only rules, or no-code deployment. The closest: "Many tools, templates, and builder guides simplify the process" — referring to the scaffold as a starting point, not a no-code alternative.

**Key gap:** All three `build.md` files are empty stubs. No step-by-step deploy guide. All four dApp docs are `//TODO` stubs. Turret README is a `//TODO` stub.

### evevault (wallet)

**Can sign arbitrary PTBs** via `sui:signTransaction` and `sui:signAndExecuteTransaction`. No command-type filtering. Technically supports Publish transactions, but impractical for end users (requires compiled bytecode client-side).

**Sponsored transaction feature is a STUB** — returns hardcoded mock digest `"0x1234567890"`. Use standard dual-signing pattern for sponsored txs.

> **Update 2026-02-28:** EVE Vault sponsored transactions are now functional (commit 687d432). Sign-and-execute works via `window.postMessage` relay. API URL changed to `/${assemblyType}/${action}` format. Default chain switched to testnet.

**Chain support:** Only `sui:devnet` and `sui:testnet` exposed. No localnet or mainnet.

---

## Policy Lifecycle

### 1. Initial Deployment (one-time, by CivilizationControl team)

```
CivControl team publishes extension package
  → init() creates: ExtensionConfig (shared) + AdminCap (to publisher)
  → Package defines: GateAuth witness, all rule types, admin functions
```

This happens ONCE. The package ID becomes stable and is hardcoded in the CivilizationControl UI.

### 2. Apply Extension to Gate (per-gate, by gate owner)

```
Gate owner borrows OwnerCap<Gate> from their Character
  → calls gate::authorize_extension<GateAuth>(&mut gate, &owner_cap)
  → calls gate::authorize_extension<GateAuth>(&mut linked_gate, &owner_cap_b)
  → returns OwnerCap to Character
```

**Prerequisite:** Both linked gates must authorize the same extension type. If gates have different owners, both must independently call `authorize_extension`.

**After this step:** Default `jump()` is blocked. Only `jump_with_permit()` works. The gate owner has "enrolled" in CivilizationControl.

### 3. Configure Policy (per-gate, by gate owner or admin)

```
PTB:
  set_tribe_rule(config, gate_id, tribe_id)       // optional
  set_coin_toll(config, gate_id, price, treasury)  // optional
  set_allow_list(config, gate_id, addresses)       // optional
  set_deny_list(config, gate_id, addresses)        // optional
```

**Single PTB.** Each rule is a dynamic field operation. Toggling a rule on = `add_rule()`; toggling off = `remove_rule()`. Changing a parameter = `set_rule()`.

### 4. Update Policy (ongoing)

Same as step 3 — single PTB to change any rule parameter. No redeployment, no extension re-authorization.

### 5. Reuse Across Gates

The extension type is shared — any gate can call `authorize_extension<GateAuth>`. Each gate has independent config via gate-ID-keyed dynamic fields. There is no cross-gate "policy object" — each gate's policy is the sum of its DF entries.

**"Copy policy from Gate A to Gate B"** is a UI convenience: read Gate A's config, write the same values for Gate B. One PTB.

### 6. Remove / Retire Policy

**Extension cannot be removed** (no `deauthorize_extension` in world-contracts). The gate owner can:
- **Replace** with a different extension: call `authorize_extension<OtherAuth>` (swap_or_fill)
- **Disable rules:** Remove all dynamic field entries → extension still active but issues permits to everyone (no rules = allow all)
- **Effect of "no rules":** The extension's `issue_jump_permit` function should be designed to allow passage when no rules are configured (graceful default)

### 7. Turret Extensions (Verified)

(Updated 2026-03-02 after turret support confirmed in world-contracts v0.0.14.)

Turret extensions follow the same `extension: Option<TypeName>` and `authorize_extension<Auth>` + `swap_or_fill` pattern as Gate. Confirmed in `turret.move` (678 lines). Key difference: turret extensions control **targeting priority**, not allow/deny permit issuance. The extension function `get_target_priority_list` has a fixed 4-argument signature (`turret`, `character`, `candidates_bcs`, `receipt`) and cannot access external objects or DFs (no `uid()` accessor on Turret). Default targeting: tribe-based filtering with aggressor priority boost. CivilizationControl turret architecture: posture.move (PostureKey DF, set_posture), turret_bouncer.move (BouncerAuth witness, commercial targeting), turret_defense.move (DefenseAuth witness, defense targeting). Extension swap (BouncerAuth ↔ DefenseAuth), not online/offline toggle.

---

## Architecture Implications for CivilizationControl

### What the UI Does

| User action | On-chain operation | PTB commands |
|------------|-------------------|-------------|
| "Enroll gate in CivilizationControl" | Authorize extension on gate pair | `borrow_owner_cap` → `authorize_extension<GateAuth>` (×2) → `return_owner_cap` |
| "Enable Tribe Filter (Tribe 7)" | Add tribe rule DF | `set_tribe_rule(config, gate_id, 7)` |
| "Set Toll to 5 SUI" | Add coin toll DF | `set_coin_toll(config, gate_id, 5_000_000_000, treasury)` |
| "Add address to Allow List" | Update allow list DF | `add_to_allow_list(config, gate_id, address)` |
| "Deploy Policy" (multi-rule) | Batch rule updates | Single PTB with multiple `set_*` calls |
| "Disable Tribe Filter" | Remove tribe rule DF | `remove_tribe_rule(config, gate_id)` |

### What the UI Does NOT Do

- Publish Move packages
- Define new rule types
- Create new witness types
- Construct permit-issuance logic
- Interact with `AdminCap` (unless backend-proxied)

### Minimum Transaction Sequence

| Scenario | Tx count | Can be single PTB? |
|----------|----------|-------------------|
| First enrollment + policy (same owner for both gates) | 1 | **Yes** |
| First enrollment + policy (different owners) | 2–3 | No — each owner signs separately |
| Policy update (any rules) | 1 | **Yes** |
| Player requests permit | 1 | **Yes** (extension module function) |
| Player jumps with permit | 1 | **Yes** (sponsored by game server) |

### AdminCap vs OwnerCap for Config — Design Decision

| Approach | Pros | Cons | Recommended for |
|----------|------|------|-----------------|
| **AdminCap only** (current example pattern) | Simple, centralized | Requires CivControl backend to co-sign all config changes | Not recommended — adds backend dependency |
| **OwnerCap<Gate> gated** | Self-service, no backend | More complex Move code; gate owner must borrow OwnerCap for config | **Hackathon (primary)** |
| **Hybrid** | Admin can override; owners self-serve | Most complex | Production |

**Recommendation:** Design config-update functions to accept `OwnerCap<Gate>` for per-gate modifications. Reserve `AdminCap` for global operations only (adding new rule types in future upgrades, emergency override). This enables the "Deploy Policy" button to construct a PTB that the gate owner signs directly from their wallet — no backend required.

---

## Day-1 Validation Steps (Post-Hackathon-Start)

These items are architecturally sound but unexercised. Validate on Day-1:

| # | What to validate | How | Risk if fails |
|---|-----------------|-----|---------------|
| V1 | Per-gate dynamic field keys work with compound key structs | Publish test package with `struct GateRuleKey { gate_id: ID }` as DF key | LOW — standard Sui DF feature |
| V2 | `OwnerCap<Gate>` can be used as auth in extension config functions | Add `&OwnerCap<Gate>` param to a config-update function, verify `owner_cap_id` match | LOW — standard capability pattern |
| V3 | Single PTB: `authorize_extension` + `set_rule` in one transaction | Construct PTB with both calls sequenced | LOW — standard PTB composition |
| V4 | Config DFs are readable from TypeScript SDK for UI display | Query object DFs via `@mysten/sui` SDK `getDynamicFields()` | LOW — documented SDK feature |
| V5 | Turret extension field exists and follows same pattern | Read `turret.move` for `extension: Option<TypeName>` | **VERIFIED** -- turret.move (678 lines) confirms `extension: Option<TypeName>` + `authorize_extension<Auth>`. CC modules: posture.move, turret_bouncer.move, turret_defense.move. (Updated 2026-03-17.) |

---

## Assumptions Ledger Update

### Marked VERIFIED

| ID | Assumption | Status |
|----|-----------|--------|
| NEW | Gate policies can be data-driven (dynamic field config objects) without user-written Move | **VERIFIED** — ExtensionConfig + DF pattern proven in extension_examples and builder-scaffold |
| NEW | One published extension package can serve unlimited gates | **VERIFIED** — TypeName matching is package-scoped, not instance-scoped |
| NEW | End users never need to publish Move packages | **VERIFIED** — builder-documentation and scaffold explicitly frame publish as a builder action |
| NEW | EVE Vault can sign PTBs for calling config functions | **VERIFIED** — wallet signs arbitrary PTB bytes with no filtering |

### Remains UNKNOWN (Day-1 Validation)

| ID | Assumption | Validation step |
|----|-----------|-----------------|
| NEW | Per-gate DF keys with compound key structs work as expected | V1 above |
| NEW | OwnerCap<Gate> can gate config updates (self-service) | V2 above |
| NEW | Single-PTB "Deploy Policy" flow works end-to-end | V3 above |
| NEW | Turret extensions follow the same pattern as gate extensions | **VERIFIED** -- confirmed in turret.move v0.0.14. Same authorize_extension + swap_or_fill. Controls targeting priority, not allow/deny. (Updated 2026-03-02.) |

---

## Key Source References

| File | What it proves |
|------|---------------|
| `vendor/world-contracts/contracts/world/sources/assemblies/gate.move` L82, L114–117, L224–258 | Extension field, authorize_extension, issue_jump_permit |
| `vendor/world-contracts/contracts/extension_examples/sources/config.move` | Shared ExtensionConfig + dynamic field helpers pattern |
| `vendor/world-contracts/contracts/extension_examples/sources/tribe_permit.move` | Runtime config-driven permit issuance |
| `vendor/builder-scaffold/move-contracts/smart_gate/sources/config.move` | Scaffold confirms same pattern; `init()` creates config + admin cap |
| `vendor/builder-scaffold/move-contracts/smart_gate/sources/tribe_permit.move` | Configurable expiry, `public(package)` witness restriction |
| `vendor/builder-documentation/smart-assemblies/gate/README.md` | "Owner deploys a custom Move contract" — builder responsibility |
| `vendor/builder-documentation/smart-contracts/eve-frontier-world-explainer.md` L87–93 | Witness pattern explained |
| `vendor/evevault/apps/extension/src/lib/adapters/SuiWallet.ts` L317 | Arbitrary PTB signing, no filtering |
