# World-Contracts Authentication & Authorization Model — Deep Analysis

**Retention:** Carry-forward

---

## 1. Capability Hierarchy Overview

The world-contracts system uses a **three-tier capability hierarchy** plus supplementary authorization mechanisms:

```
GovernorCap (deployer — one-time init)
   └── AdminCap (server/admin — created by governor)
         └── OwnerCap<T> (player — created by admin, held by Character object)
```

Additional authorization layers:
- **AdminACL** — shared sponsorship whitelist (`verify_sponsor()`)
- **ServerAddressRegistry** — shared registry of server addresses for location proof signature verification
- **Extension witness pattern** — typed witness `<Auth: drop>` for extension-controlled access

---

## 2. GovernorCap

### Definition
**File:** [world.move](../vendor/world-contracts/contracts/world/sources/world.move#L3-L6)

```move
public struct GovernorCap has key {
    id: UID,
    governor: address,
}
```

### Creation
[world.move L9-L16](../vendor/world-contracts/contracts/world/sources/world.move#L9-L16) — Created in `init()`, transferred to `ctx.sender()` (the package publisher).

```move
fun init(ctx: &mut TxContext) {
    let gov_cap = GovernorCap {
        id: object::new(ctx),
        governor: ctx.sender(),
    };
    transfer::transfer(gov_cap, ctx.sender());
}
```

### Abilities
`key` only — no `store`, so cannot be transferred after initial creation via public Transfer. The deployer holds it permanently.

### Functions requiring GovernorCap
| Function | File | Line |
|----------|------|------|
| `create_admin_cap` | access_control.move | L198 |
| `delete_admin_cap` | access_control.move | L205 |
| `add_sponsor_to_acl` | access_control.move | L192 |
| `register_server_address` | access_control.move | L237 |
| `remove_server_address` | access_control.move | L244 |

---

## 3. AdminCap

### Definition
**File:** [access_control.move L42-L45](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L42-L45)

```move
public struct AdminCap has key {
    id: UID,
    admin: address,
}
```

### Abilities
`key` only — owned object, not freely transferable via generic transfer.

### Creation
[access_control.move L198-L204](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L198-L204) — Created by `create_admin_cap()`, requires `GovernorCap`. Transferred to the specified `admin` address.

```move
public fun create_admin_cap(_: &GovernorCap, admin: address, ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
        admin: admin,
    };
    transfer::transfer(admin_cap, admin);
}
```

### Deletion
[access_control.move L206-L209](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L206-L209) — `delete_admin_cap()` requires both the `AdminCap` being deleted AND a `GovernorCap`.

### Who holds it
Typically the **server/admin address** designated by the deployer. Multiple AdminCaps can be created for different admin addresses.

### Functions requiring AdminCap
| Function | Module | File:Line | Description |
|----------|--------|-----------|-------------|
| `create_owner_cap` | access | access_control.move:L211 | Create OwnerCap from object ref |
| `create_owner_cap_by_id` | access | access_control.move:L224 | Create OwnerCap from object ID |
| `delete_owner_cap` | access | access_control.move:L252 | Delete an OwnerCap |
| `create_and_transfer_owner_cap` | access | access_control.move:L168 | Package-level; create + transfer |
| `create_character` | character | character.move:L82 | Create a new Character |
| `share_character` | character | character.move:L155 | Share a Character object |
| `update_tribe` | character | character.move:L159 | Update character tribe |
| `update_address` | character | character.move:L164 | Update character address |
| `update_tenant_id` | character | character.move:L170 | Update character tenant |
| `delete_character` | character | character.move:L176 | Delete a Character |
| `anchor` | gate | gate.move:L396 | Anchor a new gate |
| `share_gate` | gate | gate.move:L451 | Share a gate object |
| `update_energy_source` | gate | gate.move:L455 | Update gate energy source |

> **v0.0.15 update:** `update_energy_source` for gate, storage_unit, assembly, and turret no longer requires AdminACL — removed from signature.

| `unanchor` | gate | gate.move:L462 | Unanchor a gate |
| `unanchor_orphan` | gate | gate.move:L502 | Unanchor orphaned gate |
| `set_max_distance` | gate | gate.move:L519 | Set max link distance by type |
| `unlink_gates_by_admin` | gate | gate.move:L530 | Admin unlink gates |
| `anchor` | network_node | network_node.move:L227 | Anchor a new network node |
| `share_network_node` | network_node | network_node.move:L282 | Share a network node |
| `connect_assemblies` | network_node | network_node.move:L291 | Connect assemblies to NWN |
| `unanchor` | network_node | network_node.move:L311 | Unanchor a network node |
| `destroy_network_node` | network_node | network_node.move:L325 | Destroy a network node |
| `update_fuel` | network_node | network_node.move:L345 | Update fuel state |
| `anchor` | storage_unit | storage_unit.move:L334 | Anchor a new storage unit |
| `share_storage_unit` | storage_unit | storage_unit.move:L401 | Share a storage unit |
| `update_energy_source` | storage_unit | storage_unit.move:L405 | Update SU energy source |
| `update_energy_source_connected_storage_unit` | storage_unit | storage_unit.move:L419 | Update via hot potato |

> **v0.0.15 update:** `update_energy_source_connected_storage_unit` and `update_energy_source_connected_assembly` no longer require AdminACL.
| `unanchor` | storage_unit | storage_unit.move:L495 | Unanchor a storage unit |
| `unanchor_orphan` | storage_unit | storage_unit.move:L542 | Unanchor orphaned SU |
| `anchor` | assembly | assembly.move:L97 | Anchor a generic assembly |
| `share_assembly` | assembly | assembly.move:L149 | Share an assembly |
| `update_energy_source` | assembly | assembly.move:L153 | Update assembly energy source |
| `update_energy_source_connected_assembly` | assembly | assembly.move:L166 | Update via hot potato |
| `unanchor` | assembly | assembly.move:L210 | Unanchor an assembly |
| `unanchor_orphan` | assembly | assembly.move:L244 | Unanchor orphaned assembly |
| `location::update` | location | location.move:L190 | Update location hash |

---

## 4. OwnerCap\<T\>

### Definition
**File:** [access_control.move L48-L62](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L48-L62)

```move
public struct OwnerCap<phantom T> has key {
    id: UID,
    authorized_object_id: ID,
}
```

### Abilities
`key` only — owned object. The `phantom T` parameter binds it to a specific object type (e.g., `Gate`, `NetworkNode`, `StorageUnit`, `Character`, `Assembly`).

### Creation
Created by AdminCap-holders via `create_owner_cap()` or `create_owner_cap_by_id()` in access_control.move. During `anchor()` / `create_character()` flows, the OwnerCap is created and **transferred to the Character object** (not a wallet address):

```move
access::transfer_owner_cap(owner_cap, object::id_address(character));
```

### Borrow Pattern
Since OwnerCap lives inside the Character object, players access it via the **borrow pattern**:

[character.move L131-L145](../vendor/world-contracts/contracts/world/sources/character/character.move#L131-L145):
```move
public fun borrow_owner_cap<T: key>(
    character: &mut Character,
    owner_cap_ticket: Receiving<OwnerCap<T>>,
    ctx: &TxContext,
): (OwnerCap<T>, access::ReturnOwnerCapReceipt) {
    assert!(character.character_address == ctx.sender(), ESenderCannotAccessCharacter);
    let owner_cap = access::receive_owner_cap(&mut character.id, owner_cap_ticket);
    let return_receipt = access::create_return_receipt(
        object::id(&owner_cap),
        object::id_address(character),
    );
    (owner_cap, return_receipt)
}
```

**Key security gate:** `character.character_address == ctx.sender()` — Only the wallet address registered as the character's address can borrow the OwnerCap.

### ReturnOwnerCapReceipt
[access_control.move L34-L38](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L34-L38) — Hot potato pattern ensuring OwnerCap is returned or explicitly transferred.

```move
public struct ReturnOwnerCapReceipt {
    owner_id: address,
    owner_cap_id: ID,
}
```

No `drop` or `store` — must be consumed by `return_owner_cap_to_object()` or `transfer_owner_cap_with_receipt()`.

### Authorization Check
[access_control.move L160-L162](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L160-L162):
```move
public fun is_authorized<T: key>(owner_cap: &OwnerCap<T>, object_id: ID): bool {
    owner_cap.authorized_object_id == object_id
}
```

---

## 5. AdminACL

### Definition
**File:** [access_control.move L39-L42](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L39-L42)

```move
public struct AdminACL has key {
    id: UID,
    authorized_sponsors: Table<address, bool>,
}
```

### Creation
[access_control.move L88-L92](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L88-L92) — Created in `init()`, shared via `transfer::share_object()`.

### Population
[access_control.move L192-L197](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L192-L197):
```move
public fun add_sponsor_to_acl(
    admin_acl: &mut AdminACL,
    _: &GovernorCap,
    sponsor: address,
) {
    admin_acl.authorized_sponsors.add(sponsor, true);
}
```
Requires **GovernorCap** — only the deployer can add sponsors. No `remove_sponsor` function exists in the current code.

### verify_sponsor() — Exact Logic
[access_control.move L164-L169](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L164-L169):

```move
public fun verify_sponsor(admin_acl: &AdminACL, ctx: &TxContext) {
    let sponsor_opt = tx_context::sponsor(ctx);
    assert!(option::is_some(&sponsor_opt), ETransactionNotSponsored);     // Must be a sponsored tx
    let sponsor = *option::borrow(&sponsor_opt);
    assert!(admin_acl.authorized_sponsors.contains(sponsor), EUnauthorizedSponsor); // Sponsor in ACL
}
```

**Two checks:**
1. Transaction MUST be sponsored (`sender != gas_payer`). Self-sponsorship fails because `ctx.sponsor()` returns `None` when sender == gas payer.
2. The sponsor address MUST be in the `authorized_sponsors` table.

**CRITICAL:** There is no `remove_sponsor_from_acl` function — once added, a sponsor address cannot be removed without a package upgrade.

---

## 6. ServerAddressRegistry

### Definition
**File:** [access_control.move L64-L68](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L64-L68)

```move
public struct ServerAddressRegistry has key {
    id: UID,
    authorized_address: Table<address, bool>,
}
```

### Creation
Created in `init()` of access_control.move, shared.

### Population
- `register_server_address()` — requires GovernorCap ([access_control.move L237-L243](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L237-L243))
- `remove_server_address()` — requires GovernorCap ([access_control.move L245-L251](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L245-L251))

### Usage
Used in location proof verification. The `validate_proof_message()` function in location.move checks:
```move
assert!(
    access::is_authorized_server_address(server_registry, message.server_address),
    EUnauthorizedServer,
);
```

Functions that use ServerAddressRegistry:
| Function | Module | Purpose |
|----------|--------|---------|
| `link_gates` | gate | Distance proof verification |
| `chain_item_to_game_inventory` | storage_unit | Location proof for bridging |
| `deposit_by_owner` | storage_unit | Proximity proof |
| `withdraw_by_owner` | storage_unit | Proximity proof |

---

## 7. Complete Function Categorization

### 7A. ADMIN-ONLY (requires AdminCap parameter)

These functions require the `AdminCap` owned object as a parameter. Only the server/admin wallet can call them.

#### character.move
| # | Function | Line | Description |
|---|----------|------|-------------|
| 1 | `create_character` | L82 | Create a new character, mint OwnerCap |
| 2 | `share_character` | L155 | Share a character as shared object |
| 3 | `update_tribe` | L159 | Update character's tribe_id |
| 4 | `update_address` | L164 | Update character's wallet address |
| 5 | `update_tenant_id` | L170 | Update character's tenant key |
| 6 | `delete_character` | L176 | Delete a character object |

#### gate.move
| # | Function | Line | Description |
|---|----------|------|-------------|
| 7 | `anchor` | L396 | Create and anchor a new gate |
| 8 | `share_gate` | L451 | Share a gate object |
| 9 | `update_energy_source` | L455 | Update gate's energy source NWN |
| 10 | `unanchor` | L462 | Unanchor and destroy a gate |
| 11 | `unanchor_orphan` | L502 | Unanchor orphaned gate (no NWN) |
| 12 | `set_max_distance` | L519 | Set max link distance per type |
| 13 | `unlink_gates_by_admin` | L530 | Admin-forced unlink of gates |

#### network_node.move
| # | Function | Line | Description |
|---|----------|------|-------------|
| 14 | `anchor` | L227 | Create and anchor a network node |
| 15 | `share_network_node` | L282 | Share a network node |
| 16 | `connect_assemblies` | L291 | Connect assemblies to NWN (returns hot potato) |
| 17 | `unanchor` | L311 | Unanchor NWN (returns orphan hot potato) |
| 18 | `destroy_network_node` | L325 | Destroy NWN after orphan processing |
| 19 | `update_fuel` | L345 | Admin-triggered fuel update |

#### storage_unit.move
| # | Function | Line | Description |
|---|----------|------|-------------|
| 20 | `anchor` | L334 | Create and anchor a storage unit |
| 21 | `share_storage_unit` | L401 | Share a storage unit |
| 22 | `update_energy_source` | L405 | Update SU energy source NWN |
| 23 | `update_energy_source_connected_storage_unit` | L419 | Update via hot potato |

> **v0.0.15 update:** Rows 22-23 and 28-29 below: AdminACL removed from `update_energy_source` and `update_energy_source_connected_*` signatures.

| 24 | `unanchor` | L495 | Unanchor and destroy a storage unit |
| 25 | `unanchor_orphan` | L542 | Unanchor orphaned SU |

#### assembly.move
| # | Function | Line | Description |
|---|----------|------|-------------|
| 26 | `anchor` | L97 | Create and anchor a generic assembly |
| 27 | `share_assembly` | L149 | Share an assembly |
| 28 | `update_energy_source` | L153 | Update assembly energy source |
| 29 | `update_energy_source_connected_assembly` | L166 | Update via hot potato |
| 30 | `unanchor` | L210 | Unanchor an assembly |
| 31 | `unanchor_orphan` | L244 | Unanchor orphaned assembly |

#### access_control.move (GovernorCap — deployer only)
| # | Function | Line | Description |
|---|----------|------|-------------|
| 32 | `create_admin_cap` | L198 | Create new AdminCap (GovernorCap) |
| 33 | `delete_admin_cap` | L205 | Delete AdminCap (GovernorCap) |
| 34 | `add_sponsor_to_acl` | L192 | Add sponsor address (GovernorCap) |
| 35 | `register_server_address` | L237 | Add server address (GovernorCap) |
| 36 | `remove_server_address` | L245 | Remove server address (GovernorCap) |
| 37 | `create_owner_cap` | L211 | Create OwnerCap from object ref |
| 38 | `create_owner_cap_by_id` | L224 | Create OwnerCap from object ID |
| 39 | `delete_owner_cap` | L252 | Delete an OwnerCap |

#### location.move
| # | Function | Line | Description |
|---|----------|------|-------------|
| 40 | `update` | L190 | Update location hash |

---

### 7B. PLAYER-WALLET (requires OwnerCap via borrow pattern)

These functions require an `OwnerCap<T>` parameter. Players obtain it via `borrow_owner_cap()` which checks `character.character_address == ctx.sender()`. **No server/sponsorship required.**

#### character.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 1 | `borrow_owner_cap<T>` | L131 | `character_address == ctx.sender()` | Borrow OwnerCap from Character |
| 2 | `return_owner_cap<T>` | L148 | Receipt validation | Return OwnerCap to Character |

#### gate.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 3 | `authorize_extension<Auth>` | L114 | `is_authorized(owner_cap, gate_id)` | Set extension type on gate |
| 4 | `online` | L119 | `is_authorized(owner_cap, gate_id)` | Bring gate online |
| 5 | `offline` | L131 | `is_authorized(owner_cap, gate_id)` | Take gate offline |
| 6 | `link_gates` | L143 | `is_authorized` on BOTH gate caps + ServerAddressRegistry distance proof | Link two gates |
| 7 | `unlink_gates` | L175 | `is_authorized` on both gate caps | Unlink two gates |

#### network_node.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 8 | `online` | L115 | `is_authorized(owner_cap, nwn_id)` | Bring NWN online |
| 9 | `offline` | L124 | `is_authorized(owner_cap, nwn_id)` | Take NWN offline (returns hot potato) |

#### storage_unit.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 10 | `authorize_extension<Auth>` | L91 | `is_authorized(owner_cap, su_id)` | Set extension type on SU |
| 11 | `online` | L99 | `is_authorized(owner_cap, su_id)` | Bring SU online |
| 12 | `offline` | L114 | `is_authorized(owner_cap, su_id)` | Take SU offline |

#### assembly.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 13 | `online` | L54 | `is_authorized(owner_cap, assembly_id)` | Bring assembly online |
| 14 | `offline` | L68 | `is_authorized(owner_cap, assembly_id)` | Take assembly offline |

#### access_control.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 15 | `transfer_owner_cap<T>` | L106 | Sui runtime (must be current owner) | Transfer OwnerCap |
| 16 | `transfer_owner_cap_to_address<T>` | L111 | Sui runtime + Character-type assertion | Transfer only Character OwnerCaps |
| 17 | `return_owner_cap_to_object<T>` | L122 | Receipt validation | Return borrowed OwnerCap |
| 18 | `transfer_owner_cap_with_receipt<T>` | L130 | Receipt validation | Transfer borrowed OwnerCap |

---

### 7C. SPONSORED (calls verify_sponsor — requires tx sponsor in AdminACL)

These functions call `admin_acl.verify_sponsor(ctx)` — the transaction MUST be sponsored by an address in the AdminACL.

#### gate.move
| # | Function | Line | Additional Auth | Description |
|---|----------|------|-----------------|-------------|
| 1 | `jump` | L259 | None (but extension must NOT be configured) | Default jump between gates |
| 2 | `jump_with_permit` | L272 | JumpPermit validation + Clock | Jump with extension permit |

#### network_node.move
| # | Function | Line | Additional Auth | Description |
|---|----------|------|-----------------|-------------|
| 3 | `deposit_fuel` | L96 | `is_authorized(owner_cap, nwn_id)` | Deposit fuel into NWN |
| 4 | `withdraw_fuel` | L111 | `is_authorized(owner_cap, nwn_id)` | Withdraw fuel from NWN |

#### storage_unit.move
| # | Function | Line | Additional Auth | Description |
|---|----------|------|-----------------|-------------|
| 5 | `game_item_to_chain_inventory` | L569 | `character_address == ctx.sender()` + OwnerCap inventory auth | Bridge game items to chain |

**Note:** `deposit_fuel` and `withdraw_fuel` require BOTH `OwnerCap<NetworkNode>` AND sponsorship — a **dual-auth** pattern.

---

### 7D. EXTENSION-CONTROLLED (requires Auth witness type)

These functions require an `Auth: drop` witness — only the extension package that defines the witness type can call them.

#### gate.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 1 | `issue_jump_permit<Auth>` | L200 | Both gates must have matching `extension == type_name::with_defining_ids<Auth>()` | Issue a JumpPermit |

#### storage_unit.move
| # | Function | Line | Auth Check | Description |
|---|----------|------|------------|-------------|
| 2 | `deposit_item<Auth>` | L164 | `extension.contains(&type_name::with_defining_ids<Auth>())` | Extension-controlled deposit |
| 3 | `withdraw_item<Auth>` | L182 | `extension.contains(&type_name::with_defining_ids<Auth>())` | Extension-controlled withdraw |

> **v0.0.15 update:** `deposit_item<Auth>` now validates `parent_id` (items only return to origin SSU). New `deposit_to_owned<Auth>` added for cross-player delivery. `withdraw_item<Auth>` now takes `quantity: u32` + `ctx`. Line numbers may have shifted.

---

### 7E. PLAYER + SERVER PROOF (requires ctx.sender() + ServerAddressRegistry proof)

These functions check `character_address == ctx.sender()` AND require a server-signed location/proximity proof.

#### storage_unit.move
| # | Function | Line | Auth Checks | Description |
|---|----------|------|-------------|-------------|
| 1 | `chain_item_to_game_inventory` | L140 | sender check + OwnerCap inventory auth + location proof | Bridge chain items to game |
| 2 | `deposit_by_owner` | L225 | sender check + OwnerCap inventory auth + proximity proof + location match | Owner deposit with proof |
| 3 | `withdraw_by_owner` | L270 | sender check + OwnerCap inventory auth + proximity proof | Owner withdraw with proof |

> **v0.0.15 update:** `deposit_by_owner` and `withdraw_by_owner` no longer require AdminACL — pure player-wallet + proximity proof operations now.

---

### 7F. PERMISSIONLESS / HOT-POTATO CONSUMPTION

These functions have no explicit capability requirement; they consume hot-potato structs returned by capability-gated functions.

| # | Function | Module | Line | Description |
|---|----------|--------|------|-------------|
| 1 | `update_energy_source_connected_gate` | gate | L288 | Consume UpdateEnergySources for gate |
| 2 | `offline_connected_gate` | gate | L305 | Consume OfflineAssemblies for gate |
| 3 | `offline_orphaned_gate` | gate | L327 | Consume HandleOrphanedAssemblies for gate |
| 4 | `offline_connected_assembly` | assembly | L186 | Consume OfflineAssemblies for assembly |
| 5 | `offline_orphaned_assembly` | assembly | L206 | Consume HandleOrphanedAssemblies for assembly |
| 6 | `offline_connected_storage_unit` | storage_unit | L451 | Consume OfflineAssemblies for SU |
| 7 | `offline_orphaned_storage_unit` | storage_unit | L473 | Consume HandleOrphanedAssemblies for SU |
| 8 | `destroy_offline_assemblies` | network_node | L379 | Final hot potato destruction |
| 9 | `destroy_update_energy_sources` | network_node | L385 | Final hot potato destruction |
| 10 | `destroy_orphaned_assemblies` | network_node | L393 | Final hot potato destruction |

**Security:** These functions are effectively capability-gated because the hot-potato structs can ONLY be obtained from AdminCap-gated or OwnerCap-gated functions.

---

### 7G. VIEW FUNCTIONS (read-only, no auth)

All `public fun` view functions are permissionless read-only accessors. Not enumerated here for brevity — they include `status()`, `location()`, `owner_cap_id()`, `is_online()`, `are_gates_linked()`, `extension_type()`, etc.

---

## 8. Extension Authorization — Deep Dive

### How authorize_extension works

**Gate** — [gate.move L114-L117](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move#L114-L117):
```move
public fun authorize_extension<Auth: drop>(gate: &mut Gate, owner_cap: &OwnerCap<Gate>) {
    let gate_id = object::id(gate);
    assert!(access::is_authorized(owner_cap, gate_id), EGateNotAuthorized);
    gate.extension.swap_or_fill(type_name::with_defining_ids<Auth>());
}
```

**StorageUnit** — [storage_unit.move L91-L96](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move#L91-L96):
```move
public fun authorize_extension<Auth: drop>(
    storage_unit: &mut StorageUnit,
    owner_cap: &OwnerCap<StorageUnit>,
) {
    assert!(access::is_authorized(owner_cap, object::id(storage_unit)), EAssemblyNotAuthorized);
    storage_unit.extension.swap_or_fill(type_name::with_defining_ids<Auth>());
}
```

### Key properties
1. **Only requires OwnerCap** — player can authorize without server involvement
2. **`swap_or_fill`** — can replace an existing extension with a new one (not append-only)
3. **Type is stored as `TypeName`** — the fully-qualified type name with defining IDs
4. **`Auth: drop`** constraint — the witness type must have `drop` ability

### Extension flow for gates

1. **Owner configures:** `gate::authorize_extension<MyAuth>(gate, owner_cap)` — stores `TypeName` of `MyAuth` in `gate.extension`
2. **Default jump blocked:** `jump()` asserts `option::is_none(&source_gate.extension)` — if extension is configured, default jump is denied
3. **Extension issues permit:** Extension package calls `gate::issue_jump_permit<MyAuth>(source, dest, character, MyAuth{}, expiry, ctx)`
   - Both source AND destination gate must have `extension == type_name::with_defining_ids<MyAuth>()`
   - Permit is transferred to `character.character_address()`
4. **Player jumps with permit:** `gate::jump_with_permit(source, dest, character, permit, admin_acl, clock, ctx)` — requires sponsorship + valid permit

### Extension flow for storage units

1. **Owner configures:** `storage_unit::authorize_extension<MyAuth>(su, owner_cap)`
2. **Extension operates:** `deposit_item<MyAuth>(su, character, item, MyAuth{}, ctx)` / `withdraw_item<MyAuth>(su, character, MyAuth{}, type_id, ctx)`
   - Checks `extension.contains(&type_name::with_defining_ids<Auth>())`

### Can a player authorize without server?
**YES.** `authorize_extension` only requires `OwnerCap<Gate>` or `OwnerCap<StorageUnit>`. The player borrows their OwnerCap via `character::borrow_owner_cap()` (which only checks `ctx.sender()`). No AdminCap, no sponsorship, no server proof needed.

---

## 9. Hidden Permission Gates

### ctx.sender() checks beyond character_address

| Location | Check | Purpose |
|----------|-------|---------|
| [character.move L139](../vendor/world-contracts/contracts/world/sources/character/character.move#L139) | `character.character_address == ctx.sender()` | Borrow OwnerCap — ensures only registered wallet can borrow |
| [storage_unit.move L150](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move#L150) | `character.character_address() == ctx.sender()` | chain_item_to_game_inventory |
| [storage_unit.move L236](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move#L236) | `character.character_address() == ctx.sender()` | deposit_by_owner |
| [storage_unit.move L281](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move#L281) | `character.character_address() == ctx.sender()` | withdraw_by_owner |
| [storage_unit.move L579](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move#L579) | `character.character_address() == ctx.sender()` | game_item_to_chain_inventory |
| [access_control.move L118](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L118) | Used within `transfer_owner_cap_to_address` (records sender as previous_owner) | Transfer logging |
| [location.move L114,139,163](../vendor/world-contracts/contracts/world/sources/primitives/location.move#L114) | `message.player_address == sender` within `validate_proof_message` | Proof must be issued to the tx sender |

### ServerAddressRegistry checks outside of location proofs

ServerAddressRegistry is ONLY used inside location/distance proof verification functions in location.move. It does NOT appear in any other authorization context. All usages:
- `location::verify_proximity()` — L106
- `location::verify_proximity_proof_from_bytes()` — L130
- `location::verify_distance()` — L155

### Timestamp / epoch-based restrictions

| Location | Check | Purpose |
|----------|-------|---------|
| [location.move L267](../vendor/world-contracts/contracts/world/sources/primitives/location.move#L267) | `deadline_ms > current_time_ms` | Location proofs have expiry timestamps |
| [gate.move L683](../vendor/world-contracts/contracts/world/sources/assemblies/gate.move#L683) | `jump_permit.expires_at_timestamp_ms > clock.timestamp_ms()` | JumpPermits have expiry timestamps |

### OwnerCap transfer restriction

[access_control.move L111-L119](../vendor/world-contracts/contracts/world/sources/access/access_control.move#L111-L119):
```move
public fun transfer_owner_cap_to_address<T: key>(
    owner_cap: OwnerCap<T>,
    new_owner: address,
    ctx: &mut TxContext,
) {
    let type_name: TypeName = type_name::with_defining_ids<T>();
    let str: &String = type_name.as_string();
    assert!(str == &std::ascii::string(b"Character"), ECharacterTransfer);
    transfer<T>(owner_cap, ctx.sender(), new_owner);
}
```
**Hidden gate:** Only `OwnerCap<Character>` can be transferred via `transfer_owner_cap_to_address`. All other OwnerCap types are restricted — they can only be returned to their parent object.

### Inventory authorization dual-path

[storage_unit.move L695-L710](../vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move#L695-L710):
```move
fun check_inventory_authorization<T: key>(
    owner_cap: &OwnerCap<T>,
    storage_unit: &StorageUnit,
    character_id: ID,
) {
    let owner_cap_type = type_name::with_defining_ids<T>();
    let storage_unit_id = object::id(storage_unit);
    if (owner_cap_type == type_name::with_defining_ids<StorageUnit>()) {
        assert!(access::is_authorized(owner_cap, storage_unit_id), EInventoryNotAuthorized);
    } else if (owner_cap_type == type_name::with_defining_ids<Character>()) {
        assert!(access::is_authorized(owner_cap, character_id), EInventoryNotAuthorized);
    } else {
        assert!(false, EInventoryNotAuthorized);
    };
}
```
**Hidden gate:** Inventory operations accept either `OwnerCap<StorageUnit>` or `OwnerCap<Character>`, but NO other type. This is a runtime type check.

---

## 10. Summary Matrix

| Operation | GovernorCap | AdminCap | OwnerCap | verify_sponsor | ServerRegistry | ctx.sender() | Extension |
|-----------|:-----------:|:--------:|:--------:|:--------------:|:--------------:|:------------:|:---------:|
| Create AdminCap | ✅ | | | | | | |
| Add sponsor to ACL | ✅ | | | | | | |
| Register server addr | ✅ | | | | | | |
| Create character | | ✅ | | | | | |
| Anchor gate/NWN/SU | | ✅ | | | | | |
| Unanchor gate/NWN/SU | | ✅ | | | | | |
| Online/offline gate | | | ✅ | | | | |
| Online/offline NWN | | | ✅ | | | | |
| Online/offline SU | | | ✅ | | | | |
| Authorize extension | | | ✅ | | | | |
| Link/unlink gates | | | ✅✅ | | ✅ (distance) | | |
| Deposit/withdraw fuel | | | ✅ | ✅ | | | |
| Default jump | | | | ✅ | | | ❌ (must not be set) |
| Jump with permit | | | | ✅ | | | ✅ (permit required) |
| Issue jump permit | | | | | | | ✅ (witness) |
| Deposit/withdraw item (ext) | | | | | | | ✅ (witness) |
| Deposit/withdraw by owner | | | ✅ | | ✅ (proximity) | ✅ | |
| Bridge items game↔chain | | | ✅ | ✅* | ✅* | ✅ | |
| Borrow OwnerCap | | | | | | ✅ | |

*`game_item_to_chain_inventory` requires sponsorship; `chain_item_to_game_inventory` requires server location proof but NOT sponsorship.

---

## 11. Notable Gaps & Observations

1. **No remove_sponsor_from_acl** — Once a sponsor is added to AdminACL, there is no function to remove it. This is a potential operational risk.

2. **Self-sponsorship doesn't work** — `ctx.sponsor()` returns `None` when sender == gas payer. Must use a distinct sponsor address.

3. **Extension is replaceable** — `swap_or_fill()` means an owner can replace an extension at any time with their OwnerCap. This could be used to bypass an extension's rules by setting a permissive extension.

4. **JumpPermit is single-use** — The permit is deleted after validation (`id.delete()`). The code has a TODO about allowing multi-use permits in the future.

5. **Both gates must have same extension** — For `issue_jump_permit`, both source and destination gates must be configured with the same extension witness type. This prevents permit issuance for mixed-extension gate pairs.

6. **OwnerCap lives in Character** — Not in a wallet. The borrow pattern means a PTB must first call `borrow_owner_cap`, then use the cap, then `return_owner_cap`. This is a 3-step transaction pattern.

7. **Location proof binds to sender** — `message.player_address == ctx.sender()` in `validate_proof_message()` means location proofs are non-transferable and sender-specific.

8. **No epoch-based restrictions** — Beyond timestamp-based expiry on proofs and permits, there are no Sui epoch-based checks anywhere in the codebase.

---

*Analysis performed: 2026-02-16. Source: vendor/world-contracts on main branch.*
*Companion document: [authenticated-user-surface-analysis.md](authenticated-user-surface-analysis.md)*
