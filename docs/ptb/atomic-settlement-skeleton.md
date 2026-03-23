# Atomic Settlement Skeleton

**Retention:** Carry-forward

- **Status:** Pattern/Template (Non-Canonical)
- **Last Verified:** Not yet verified on hackathon test server
- **Revalidation Required:** Yes

---

## Purpose

A contract-agnostic settlement skeleton using placeholders. This template demonstrates the structural pattern for any atomic on-chain settlement — toll collection, trade execution, permit-gated jumps, or treasury operations.

**Not a ready-to-use script.** All placeholders must be resolved against the deployed world-contracts and CivilizationControl extension before generating TypeScript.

---

## 1. Placeholder Legend

| Placeholder | Meaning | Resolution |
|-------------|---------|------------|
| `PACKAGE_ID` | Published package address (32-byte hex) | Read from publish output or environment config |
| `MODULE` | Move module name within the package | Read from Move source (`module MODULE { ... }`) |
| `FUNCTION` | Entry function name | Read from Move source; verify `public entry` or `public` visibility |
| `TYPE_ARGS` | Generic type parameters (e.g., `<GateAuth>`, `<SUI>`) | Read from function signature |
| `REQUIRED_OBJECTS` | Shared or owned objects the function expects | Read from function parameters + on-chain object state |
| `CAP_OBJECTS` | Capability objects (OwnerCap, etc.) | Read from function parameters; apply borrow/return if needed |
| `AMOUNT_MIST` | Payment amount in MIST (u64) | Read from rule config (dynamic field on ExtensionConfig) |
| `TREASURY_ADDRESS` | Destination for collected funds | Read from rule config or admin configuration |
| `ADMIN_ACL_ID` | AdminACL shared object ID | Query on-chain; specific to the world deployment |

---

## 2. Settlement Skeleton

```
ATOMIC SETTLEMENT PTB
=====================

INPUTS:
  [0] gas_coin         — Player's SUI coin (or sponsor's coin if sponsored)
  [1] REQUIRED_OBJECTS  — Shared objects: config, gate(s), SSU(s), etc.
  [2] CAP_OBJECTS       — If borrow/return pattern needed
  [3] pure values       — Amounts, addresses, flags

COMMANDS:

  Step 1 — Prepare Payment (if settlement involves coin transfer)
  ──────────────────────────────────────────────────────────────
  cmd[0]: SplitCoins(gas_coin, [AMOUNT_MIST])
          → result[0] = payment_coin

  Step 2 — Execute Core Settlement
  ────────────────────────────────
  cmd[1]: MoveCall(
            PACKAGE_ID::MODULE::FUNCTION,
            type_args: [TYPE_ARGS],
            args: [REQUIRED_OBJECTS, payment_coin, ...]
          )
          → result[1] = settlement_receipt (if function returns a value)

  Step 3 — Handle Settlement Result (if applicable)
  ──────────────────────────────────────────────────
  cmd[2]: TransferObjects([result[1]], TREASURY_ADDRESS)
          — OR —
          MoveCall(PACKAGE_ID::MODULE::consume_receipt, [result[1]])

  Step 4 — Cleanup / Return Borrowed Capabilities (if applicable)
  ───────────────────────────────────────────────────────────────
  cmd[3]: MoveCall(world::STRUCTURE::return_owner_cap, [structure, cap])
          — Only if borrow/return pattern was used

EXPECTED OUTCOME:
  - Success: objects created/mutated as per settlement logic; events emitted
  - Failure: MoveAbort with abort code; no state changes; gas consumed
```

---

## 3. Variant: Sponsored Settlement

When AdminACL is required (e.g., `jump_with_permit`, SSU operations):

```
SPONSORED SETTLEMENT PTB (dual-sign)
=====================================

CONSTRUCTION FLOW:

  1. PLAYER builds transaction kind (commands only, no gas info):
     - SplitCoins, MoveCall, etc. as above
     - Does NOT set gas coin, budget, or sender

  2. ADMIN receives the serialized transaction kind:
     - Adds gas coin (admin's coin) + gas budget
     - Constructs full transaction

  3. PLAYER signs the transaction kind → player_signature

  4. ADMIN signs the full transaction → admin_signature

  5. EXECUTE with both signatures:
     sui_executeTransactionBlock(tx_bytes, [player_signature, admin_signature])

NOTES:
  - verify_sponsor falls back to ctx.sender() when sponsor is None
  - If admin's address is in AdminACL, a standard (non-sponsored) tx also works
  - Verify this self-sponsorship path on the hackathon test server
  - Gas is deducted from the admin's coin
```

---

## 4. Variant: Multi-Step Settlement (Linked Operations)

When the settlement requires multiple Move calls in sequence:

```
MULTI-STEP SETTLEMENT PTB
==========================

Example: Toll Collection + Permit Issuance + Jump

COMMANDS:

  cmd[0]: SplitCoins(gas_coin, [toll_mist])
          → toll_coin

  cmd[1]: MoveCall(PACKAGE_ID::toll::collect_toll, [config, toll_coin, ...])
          → (toll deposited to treasury)

  cmd[2]: MoveCall(PACKAGE_ID::config::x_auth, [config])
          → auth_witness

  cmd[3]: MoveCall(world::gate::issue_jump_permit<AUTH>, [src_gate, dst_gate, auth_witness])
          → permit

  cmd[4]: MoveCall(world::gate::jump_with_permit, [src_gate, dst_gate, permit, admin_acl])
          → (jump executed, permit consumed)

ORDERING CONSTRAINTS:
  - cmd[1] before cmd[2]: toll must be collected before auth is minted (business logic)
  - cmd[2] before cmd[3]: auth witness needed for permit issuance
  - cmd[3] before cmd[4]: permit must exist before jump

SIGNER CONSTRAINTS:
  - cmd[0]-[3]: player-direct (no AdminACL required for toll + permit issuance)
  - cmd[4]: AdminACL required → may need to be a separate sponsored PTB
  - Verify whether combined or split PTBs are needed on test server

NOTE: Verify signer requirements carefully. If different signers are required
and cannot co-sign a single transaction, split into two PTBs and accept
the non-atomicity risk (permit exists briefly between transactions).
```

---

## 5. Step Sequence Checklist

Before implementing any settlement PTB, verify each step:

- [ ] **Identify all objects** — list every shared and owned object the settlement touches
- [ ] **Confirm object types** — verify abilities (key, store, drop) and ownership model
- [ ] **Map function signatures** — parameter types, ordering, return types, generic type args
- [ ] **Determine auth requirements** — extension witness only? AdminACL? OwnerCap borrow?
- [ ] **Plan coin handling** — which coins need splitting? From gas coin or separate coin input?
- [ ] **Verify return/cleanup** — any hot-potato objects that must be consumed or returned?
- [ ] **Identify signer requirements** — player-direct vs sponsored vs dual-sign
- [ ] **Test with dry-run** — execute dry-run before real submission
- [ ] **Capture evidence** — store digest + effects + events for proof moments

---

## 6. Revalidation Checklist

Run this checklist on March 11 before generating TypeScript from this skeleton:

- [ ] **Package IDs resolved** — replace all `PACKAGE_ID` placeholders with actual published addresses
- [ ] **Function signatures verified** — confirm parameter count, types, and ordering against latest Move source
- [ ] **Object IDs resolved** — replace `REQUIRED_OBJECTS`, `CAP_OBJECTS`, `ADMIN_ACL_ID` with actual on-chain IDs
- [ ] **Type arguments confirmed** — verify generic type parameters match registered extension types
- [ ] **Auth model verified** — confirm which operations need AdminACL vs extension witness vs OwnerCap
- [ ] **Coin amounts confirmed** — verify toll/payment amounts from rule config dynamic fields
- [ ] **Shared object versions** — fetch latest versions before building PTB
- [ ] **Sponsored tx path tested** — confirm dual-sign flow works on test server
- [ ] **Self-sponsorship tested** — confirm verify_sponsor fallback behavior
- [ ] **Dry-run passed** — at least one successful dry-run before live execution

---

## 7. Assumptions & Unknowns

- World-contracts may change pre-March-11
- Turret extension architecture: posture.move (PostureKey DF, set_posture), turret_bouncer.move (BouncerAuth witness), turret_defense.move (DefenseAuth witness). Extension swap (BouncerAuth ↔ DefenseAuth), not online/offline toggle
- SSU withdraw/deposit may delete/recreate objects
- Do not assume object continuity across game boundary
- Package IDs are placeholders
- Toll amounts, treasury addresses, and rule configurations are deployment-specific
- Whether toll + jump can be combined in a single PTB depends on signer requirements (verify)

## Invalidation Triggers

- World-contracts merge changing signatures
- SSU semantics differ on test server
- Auth model change
- Any new dependency on indexer/events
- Signer model change (what requires AdminACL vs direct)
