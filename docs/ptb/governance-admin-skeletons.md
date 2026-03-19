# Governance & Admin PTB Skeletons

**Retention:** Carry-forward

- **Status:** Pattern/Template (Non-Canonical)
- **Last Verified:** Not yet verified on hackathon test server
- **Revalidation Required:** Yes

---

## Purpose

Placeholder-only PTB skeletons for governance and administrative operations in CivilizationControl. These cover capability handling, extension management, gate topology, access control, and rule configuration.

**All skeletons use placeholders.** Resolve against deployed world-contracts and CivilizationControl extension before implementation.

---

## 1. Extension Authorization

Register CivilizationControl's extension on a gate or SSU. Must be called by the structure owner.

```
AUTHORIZE EXTENSION PTB
========================

Who: Structure owner (gate/SSU owner)
Auth: OwnerCap (borrow/return pattern)
AdminACL: NOT required

COMMANDS:

  cmd[0]: MoveCall(
            WORLD_PACKAGE::gate::borrow_owner_cap,
            args: [gate_object]
          )
          → result[0] = owner_cap

  cmd[1]: MoveCall(
            WORLD_PACKAGE::gate::authorize_extension<AUTH_TYPE>,
            type_args: [PACKAGE_ID::config::GateAuth],
            args: [gate_object, owner_cap]
          )
          → extension registered (swap_or_fill — replaces existing if any)

  cmd[2]: MoveCall(
            WORLD_PACKAGE::gate::return_owner_cap,
            args: [gate_object, owner_cap]
          )
          → owner_cap returned

WARNINGS:
  - authorize_extension uses swap_or_fill: silently REPLACES any existing extension
  - ~~No event is emitted for extension changes~~ *(Correction 2026-03-04: v0.0.15 added `ExtensionAuthorizedEvent` on Gate, SSU, and Turret)*
  - OwnerCap MUST be returned in the same PTB (hot-potato while borrowed)
  - AUTH_TYPE must have `drop` ability
```

### Variant: SSU Extension Authorization

Same pattern with SSU-specific functions:

```
  cmd[0]: MoveCall(WORLD_PACKAGE::storage_unit::borrow_owner_cap, [ssu_object])
  cmd[1]: MoveCall(WORLD_PACKAGE::storage_unit::authorize_extension<AUTH_TYPE>, [ssu_object, cap])
  cmd[2]: MoveCall(WORLD_PACKAGE::storage_unit::return_owner_cap, [ssu_object, cap])
```

---

## 2. Gate Linking (Topology Configuration)

Link two gates to enable jump routes between them. Requires OwnerCap for both gates.

```
LINK GATES PTB
===============

Who: Owner of both gates (or same owner for both)
Auth: OwnerCap for BOTH gates (borrow/return)
AdminACL: NOT required for link_gates

COMMANDS:

  cmd[0]: MoveCall(WORLD_PACKAGE::gate::borrow_owner_cap, [gate_a])
          → cap_a

  cmd[1]: MoveCall(WORLD_PACKAGE::gate::borrow_owner_cap, [gate_b])
          → cap_b

  cmd[2]: MoveCall(
            WORLD_PACKAGE::gate::link_gates,
            args: [gate_a, gate_b, cap_a, cap_b]
          )
          → gates linked (bidirectional route created)

  cmd[3]: MoveCall(WORLD_PACKAGE::gate::return_owner_cap, [gate_a, cap_a])

  cmd[4]: MoveCall(WORLD_PACKAGE::gate::return_owner_cap, [gate_b, cap_b])

NOTES:
  - Both caps must be borrowed before link_gates is called
  - Both caps must be returned after (order of return doesn't matter)
  - link_gates creates a route_hash; validate_jump_permit checks both orderings
  - Linking already-linked gates: verify behavior (may abort or overwrite)
```

### Variant: Unlink Gates

```
UNLINK GATES PTB
=================

Auth: OwnerCap for BOTH gates
AdminACL: NOT required

  cmd[0]: borrow_owner_cap(gate_a) → cap_a
  cmd[1]: borrow_owner_cap(gate_b) → cap_b
  cmd[2]: unlink_gates(gate_a, gate_b, cap_a, cap_b)
  cmd[3]: return_owner_cap(gate_a, cap_a)
  cmd[4]: return_owner_cap(gate_b, cap_b)
```

---

## 3. AdminACL Management

Add or remove addresses from the AdminACL sponsor whitelist.

```
ADD SPONSOR TO ADMIN ACL PTB
==============================

Who: World admin / ACL owner
Auth: Depends on AdminACL ownership model (verify on test server)

COMMANDS:

  cmd[0]: MoveCall(
            WORLD_PACKAGE::access_control::add_authorized_sponsor,
            args: [admin_acl_object, address_to_add, ADMIN_CAP_OR_AUTH]
          )

NOTES:
  - Verify exact function signature on test server
  - AdminACL is a shared object — subject to consensus ordering
  - Adding sender's own address enables self-sponsorship path (verify_sponsor fallback)
  - This is a governance action — document in decision log
```

```
REMOVE SPONSOR FROM ADMIN ACL PTB
===================================

  cmd[0]: MoveCall(
            WORLD_PACKAGE::access_control::remove_authorized_sponsor,
            args: [admin_acl_object, address_to_remove, ADMIN_CAP_OR_AUTH]
          )

NOTES:
  - Removing the last sponsor locks out all AdminACL-protected operations
  - Verify if removal is immediate or deferred
```

---

## 4. Rule Configuration (Dynamic Fields)

Configure gate/SSU extension rules via dynamic fields on ExtensionConfig.

```
SET TRIBE RULE PTB
===================

Who: Extension admin (AdminCap holder)
Auth: AdminCap (owned object, NOT borrow/return pattern)

COMMANDS:

  cmd[0]: MoveCall(
            PACKAGE_ID::MODULE::set_tribe_rule,
            args: [extension_config, admin_cap, tribe_id_u64]
          )
          → TribeRuleKey/TribeRule dynamic field added/updated on config

NOTES:
  - ExtensionConfig is a shared object (consensus path)
  - AdminCap is an owned object (fast path) — but mixed tx goes through consensus
  - Dynamic field key struct: TribeRuleKey (empty struct, used as DF key type)
  - Dynamic field value struct: TribeRule { tribe_id: u64 }
  - Struct names shown here reflect sandbox observations and must be confirmed against the deployed extension code on the hackathon test server
  - set vs update: verify if function uses df::add (fails if exists) or df::borrow_mut/remove+add
```

```
SET TOLL RULE PTB
==================

COMMANDS:

  cmd[0]: MoveCall(
            PACKAGE_ID::MODULE::set_toll_rule,
            args: [extension_config, admin_cap, price_mist_u64, treasury_address]
          )
          → CoinTollKey/CoinTollRule dynamic field added/updated on config

NOTES:
  - price_mist is u64 in MIST (1 SUI = 1_000_000_000 MIST)
  - treasury_address receives toll payments
  - Field name is `price_mist` (NOT `price_in_mist`)
```

```
REMOVE RULE PTB
================

  cmd[0]: MoveCall(
            PACKAGE_ID::MODULE::remove_tribe_rule,
            args: [extension_config, admin_cap]
          )
          → Dynamic field removed

NOTES:
  - Removing a rule that doesn't exist may abort — verify behavior
  - Removal is immediate — any in-flight permit checks will see the updated state
```

---

## 5. Capability Handling Patterns Summary

| Capability | Abilities | Ownership | Access Pattern | Notes |
|-----------|-----------|-----------|----------------|-------|
| OwnerCap | `key, store` | Owned (by structure owner) | Borrow → Use → Return (hot-potato while borrowed) | Must return in same PTB |
| AdminCap | `key, store` | Owned (by extension publisher) | Pass directly as argument | No borrow/return needed |
| AdminACL | `key` | Shared | Pass as shared object input | Consensus path; auth checked inside function |
| Extension witness (GateAuth) | `drop` | Ephemeral (minted per-call) | Mint via x_auth() → pass to gated function → auto-dropped | public(package) mint only |

---

## 6. Shared Object Mutation Reminders

Shared objects require consensus and create contention under load:

- **ExtensionConfig** — shared; mutated when rules change; read during permit checks
- **Gate objects** — shared; mutated during link/unlink, borrow_owner_cap, authorize_extension
- **SSU objects** — shared; mutated during deposit/withdraw operations
- **AdminACL** — shared; mutated when sponsors added/removed; read during verify_sponsor

### Best Practices

- **Batch mutations** — group related changes in a single PTB to avoid multiple consensus rounds
- **Minimize read-your-write** — if you mutate a shared object, avoid reading it again in the same session (version may lag)
- **Avoid hot shared objects** — if many players hit the same gate simultaneously, expect sequencing delays
- **Prefer immutable access** — use `&T` (immutable ref) instead of `&mut T` when possible to avoid lock contention

---

## 7. Revalidation Checklist

Run before implementing any governance/admin PTB:

- [ ] **OwnerCap borrow/return signatures** — confirm function names, parameter types for each structure type (gate, SSU)
- [ ] **authorize_extension type args** — confirm GateAuth/TradeAuth types match registered extension
- [ ] **link_gates parameter ordering** — confirm (gate_a, gate_b, cap_a, cap_b) order
- [ ] **AdminACL functions** — confirm add/remove sponsor signatures; check if AdminCap or other auth is required
- [ ] **Dynamic field functions** — confirm set/remove rule signatures; check add vs update semantics
- [ ] **Rule struct names** — confirm TribeRuleKey, TribeRule, CoinTollKey, CoinTollRule field names and types
- [ ] **Shared object IDs** — fetch ExtensionConfig, AdminACL, gate, SSU object IDs from on-chain state
- [ ] **Self-sponsorship path** — test that adding sender to AdminACL enables non-sponsored calls to AdminACL functions
- [ ] **Extension replacement behavior** — test authorize_extension on already-authorized gate (swap_or_fill semantics)
- [ ] **Capability abilities** — confirm key/store/drop on all capability structs

---

## Assumptions & Unknowns

- World-contracts may change pre-March-11
- Turret extension architecture: posture.move (PostureKey DF, set_posture), turret_bouncer.move (BouncerAuth witness), turret_defense.move (DefenseAuth witness). Extension swap (BouncerAuth ↔ DefenseAuth), not online/offline toggle
- SSU withdraw/deposit may delete/recreate objects
- Do not assume object continuity across game boundary
- Package IDs are placeholders
- AdminACL management signatures need confirmation on test server
- Rule dynamic field add/update semantics may vary

## Invalidation Triggers

- World-contracts merge changing signatures
- SSU semantics differ on test server
- Auth model change
- Any new dependency on indexer/events
- OwnerCap borrow/return function rename
- Dynamic field key/value struct changes
