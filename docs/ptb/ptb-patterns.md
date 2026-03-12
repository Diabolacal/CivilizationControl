# PTB Assembly Patterns

**Retention:** Carry-forward

- **Status:** Pattern/Template (Non-Canonical)
- **Last Verified:** Not yet verified on hackathon test server
- **Revalidation Required:** Yes

---

## Purpose

Core Programmable Transaction Block (PTB) assembly patterns for Sui Move. These patterns are contract-agnostic structural templates — not verified wiring for specific world-contracts functions.

For CivilizationControl-specific usage, cross-reference with `spec.md` and `march-11-reimplementation-checklist.md` before implementation.

---

## 1. Transaction Assembly Structure

A Sui PTB is an ordered sequence of **commands** executed atomically. All commands succeed or all revert.

### Basic Structure

```
Transaction {
  inputs: [
    // Pure values (u64, address, vector<u8>, bool, etc.)
    // Object references (by ID — owned, shared, or receiving)
  ]
  commands: [
    // Ordered list of MoveCall, TransferObjects, SplitCoins, MergeCoins, etc.
    // Results from earlier commands can be used as inputs to later commands
  ]
}
```

### Key Constraints (verify against SUI docs)

- **Max 1000 commands** per PTB
- **Max 1024 dynamic fields** accessed per transaction
- **Max 250 KB** object size
- Commands execute sequentially within the PTB; results are addressable by index
- A PTB is atomic — partial execution is not possible

> These limits are protocol-version dependent and may change between Sui releases. Confirm current limits against the official Sui documentation and the hackathon test server runtime before relying on them.

### Command Types

| Command | Purpose | Notes |
|---------|---------|-------|
| `MoveCall` | Invoke a Move function | Most common; requires package, module, function, type args, args |
| `TransferObjects` | Transfer objects to an address | Used for sending results to players/addresses |
| `SplitCoins` | Split a coin into specified amounts | Essential for toll/payment patterns |
| `MergeCoins` | Merge multiple coins into one | Consolidate before split for exact amounts |
| `MakeMoveVec` | Create a vector from inputs | Needed when functions expect `vector<T>` |
| `Publish` | Publish a new package | Not used in runtime PTBs |

---

## 2. Coin Handling Patterns

### Split for Payment

When a function requires a `Coin<SUI>` of a specific amount (e.g., toll payment):

```
Pattern: Split-then-Pass

1. SplitCoins(gas_coin, [amount_mist])     → result[0] = exact_coin
2. MoveCall(PACKAGE::MODULE::pay_function, [exact_coin, ...other_args])
```

- **Always split from the gas coin** unless the player has a pre-existing coin of the exact amount
- The gas coin is the player's primary SUI coin (input index 0 in most SDK patterns)
- Split produces a new coin object; the remainder stays in the gas coin

### Merge Before Split

When the player has multiple small coins and needs a single amount larger than any individual coin:

```
Pattern: Merge-then-Split

1. MergeCoins(primary_coin, [coin_a, coin_b, coin_c])   → primary_coin absorbs others
2. SplitCoins(primary_coin, [required_amount])           → result[0] = exact_coin
3. MoveCall(PACKAGE::MODULE::function, [exact_coin, ...])
```

### Coin Handling Pitfalls

- **Prefer splitting from the gas coin** rather than passing it directly. Passing the gas coin itself may unintentionally consume the entire gas object if not handled carefully.
- **Coin objects are owned** — only the owner can spend them
- **Zero-amount splits** are valid but wasteful; avoid in production
- When using sponsored transactions, the **sponsor's coin** is the gas coin — the player's coins must be passed explicitly

---

## 3. Shared Object vs Owned Object Patterns

### Shared Objects

Shared objects go through **consensus** (slower, ~2-3x latency). Any transaction can reference them.

```
Input declaration: shared object by ID + initial_shared_version + mutable flag

- Mutable access: the object is locked for the duration of the transaction
- Immutable access: read-only, no lock contention
```

**CivilizationControl relevance:** ExtensionConfig, gates, and SSUs are shared objects. Operations touching shared objects incur consensus latency.

### Owned Objects

Owned objects skip consensus (fast path). Only the owner can use them in a transaction.

```
Input declaration: owned object by ID + version + digest
```

**CivilizationControl relevance:** AdminCap, OwnerCap (while borrowed), Coin<SUI>, JumpPermit (after issuance, before consumption).

### Mixed Transactions

When a PTB references both shared and owned objects, the entire transaction goes through consensus. Minimize shared object usage when latency matters.

### Object Mutability in PTBs

- **`&mut T`** — mutable reference; object must be declared as mutable input
- **`&T`** — immutable reference; object can be declared as immutable shared input (avoids locking)
- **`T` (by value)** — object is consumed/moved; destructive to the object (e.g., coin consumed by payment, permit consumed by jump)

---

## 4. Capability / Admin-Call Patterns

### Borrow-Use-Return Pattern (OwnerCap)

World-contracts uses a borrow/return pattern for OwnerCap operations:

```
Pattern: Borrow → Operate → Return

1. MoveCall(world::gate::borrow_owner_cap, [gate_object])       → result[0] = OwnerCap
2. MoveCall(world::gate::authorize_extension<AUTH>, [gate, cap]) → extension set
3. MoveCall(world::gate::return_owner_cap, [gate, cap])          → cap returned

CRITICAL: OwnerCap MUST be returned in the same PTB. If not returned, the transaction aborts.
```

- This pattern applies to gates, SSUs, and any structure using the borrow/return model
- The OwnerCap is a **hot-potato** while borrowed — it has no `drop` ability and must be returned
- Multiple operations can be performed between borrow and return

### AdminACL-Protected Operations (Sponsored)

Operations requiring AdminACL use sponsored transactions:

```
Pattern: Sponsored Transaction (dual-sign)

Builder constructs:
1. Build transaction kind (PTB commands without gas info)
2. Admin adds gas coin + gas budget → full transaction
3. Player signs the transaction kind
4. Admin signs the full transaction
5. Execute with both signatures

NOTE: verify_sponsor falls back to ctx.sender() — if the sender's address is in AdminACL,
a standard (non-sponsored) transaction also works. Verify this behavior on test server.
```

### Extension Witness Pattern

Extensions authenticate via a typed witness (`Auth: drop`):

```
Pattern: Extension Witness

1. MoveCall(civcontrol::config::x_auth, [extension_config])   → result[0] = GateAuth witness
2. MoveCall(world::gate::issue_jump_permit<GateAuth>, [source_gate, dest_gate, auth])

The witness is minted inside the extension package (public(package) visibility).
External packages cannot forge it.
```

- `x_auth()` must be `public(package)` — NOT `public` (security requirement)
- The witness type (`GateAuth`) must match what was registered via `authorize_extension<GateAuth>`
- Extension witness operations do NOT require AdminACL

---

## 5. Atomic Multi-Call Ordering Principles

### Rule: Dependencies Flow Forward

Command results can only be used by later commands. Never reference a result from a future command.

```
VALID:
  cmd[0]: SplitCoins → coin_result
  cmd[1]: MoveCall(fn, [coin_result])   ← uses result from cmd[0]

INVALID:
  cmd[0]: MoveCall(fn, [result_from_cmd_1])   ← forward reference
  cmd[1]: SplitCoins → coin_result
```

### Rule: Consumed Objects Cannot Be Reused

If a command consumes an object (takes it by value), no later command can reference it.

```
EXAMPLE (permit lifecycle):
  cmd[0]: issue_jump_permit → permit_object
  cmd[1]: jump_with_permit(permit_object)   ← consumes permit
  cmd[2]: inspect_permit(permit_object)     ← INVALID: permit was consumed in cmd[1]
```

### Rule: Borrow/Return Must Be Balanced

Every `borrow_owner_cap` must have a matching `return_owner_cap` in the same PTB.

### Rule: Shared Object Access Ordering

When multiple PTBs access the same shared object, they are sequenced by consensus. Within a single PTB, all accesses to the same shared object are sequential by command order.

### Common Multi-Call Patterns

```
Pattern: Toll Gate Jump (full sequence)

1. SplitCoins(gas, [toll_amount])                                → toll_coin
2. MoveCall(civcontrol::toll::collect_toll, [config, toll_coin]) → receipt or treasury deposit
3. MoveCall(civcontrol::config::x_auth, [config])               → auth_witness
4. MoveCall(world::gate::issue_jump_permit, [src, dst, auth])   → permit
5. MoveCall(world::gate::jump_with_permit, [src, dst, permit])  → jump executed

NOTE: Steps 4-5 may require different signers (permit issuance = player direct,
jump_with_permit = AdminACL sponsored). This may require TWO separate PTBs.
Verify auth requirements on test server.
```

---

## 6. Common Failure Surfaces

### Transaction-Level Failures

| Failure | Cause | Mitigation |
|---------|-------|------------|
| `InsufficientGas` | Gas budget too low for PTB complexity | Estimate gas with dry-run first; add 20% buffer |
| `ObjectVersionMismatch` | Stale object version in owned-object input | Re-fetch object before building PTB |
| `SharedObjectSequencing` | Contention on hot shared objects | Retry with backoff; minimize shared object mutations |
| `MoveAbort` | On-chain assertion failure | See [proof-extraction-moveabort.md](proof-extraction-moveabort.md) for handling |

### Move-Level Failures

| Failure | Cause | Mitigation |
|---------|-------|------------|
| `ENotAuthorized` (or similar) | Missing AdminACL entry or wrong sponsor | Verify address is in ACL; check sponsor vs sender path |
| `EExtensionMismatch` | Wrong extension type registered on gate | Re-authorize extension before calling gated functions |
| `EInvalidPermit` | Permit route_hash doesn't match gate pair | Verify gates are linked and permit was issued for this route |
| Hot-potato not returned | OwnerCap borrow without return | Ensure every borrow has a matching return in the same PTB |

### Debugging Approach

1. **Dry-run first** — use `sui client call --dry-run` or SDK equivalent to test without executing
2. **Check effects** — transaction effects show created/mutated/deleted objects
3. **Inspect abort codes** — MoveAbort includes module + abort code; cross-reference with Move source
4. **Gas profiling** — use `devInspectTransactionBlock` for gas estimation without execution

---

## Assumptions & Unknowns

- World-contracts may change pre-March-11
- Turret support confirmed in v0.0.14 (now v0.0.15; inventory sigs changed — verify before use). See docs/architecture/turret-contract-surface.md for signatures
- SSU withdraw/deposit may delete/recreate objects
- Do not assume object continuity across game boundary
- Package IDs are placeholders

## Invalidation Triggers

- World-contracts merge changing signatures
- SSU semantics differ on test server
- Auth model change
- Any new dependency on indexer/events
