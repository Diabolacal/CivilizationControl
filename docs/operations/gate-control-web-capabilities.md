# Structure Control — Web Dashboard Capabilities & Limitations

**Date:** 2026-03-17 (updated)  
**Source:** Contract analysis of `vendor/world-contracts/contracts/world/sources/` — gate.move, turret.move, storage_unit.move, network_node.move, access_control.move

## Summary

CivilizationControl provides direct power-state control for gates, turrets, storage units, and dedicated network-node surfaces, plus bulk operations where the current UI supports them. This document records what is implemented, what is possible, and what is still blocked by sponsorship or PTB-shape constraints.

---

## Controllability Matrix — All Structure Types

### Gates

| Operation | Web PTB? | Status |
|-----------|----------|--------|
| **authorize_extension** | ✅ Yes (OwnerCap only) | **Implemented** — batch UI on Gates screen |
| **online** | ✅ Yes (OwnerCap only) | **Implemented** — per-gate + bulk controls |
| **offline** | ✅ Yes (OwnerCap only) | **Implemented** — per-gate + bulk controls |
| **link_gates** | ❌ No (`verify_sponsor`) | Not possible from web |
| **unlink_gates** | ✅ Yes (OwnerCap only) | Not yet implemented |
| **set_metadata** | ✅ Yes (OwnerCap only) | Not yet implemented |

### Turrets

| Operation | Web PTB? | Status |
|-----------|----------|--------|
| **authorize_extension** | ✅ Yes (OwnerCap only) | **Implemented** — batch UI on Turrets screen |
| **online** | ✅ Yes (OwnerCap only) | **Implemented** — per-turret + bulk controls |
| **offline** | ✅ Yes (OwnerCap only) | **Implemented** — per-turret + bulk controls |
| **set_metadata** | ✅ Yes (OwnerCap only) | Not yet implemented |

### Storage Units (Trade Posts / SSUs)

| Operation | Web PTB? | Status |
|-----------|----------|--------|
| **authorize_extension** | ✅ Yes (OwnerCap only) | **Implemented** — auto-authorized in batch |
| **online** | ✅ Yes (OwnerCap only) | **Implemented** — per-SSU + bulk controls |
| **offline** | ✅ Yes (OwnerCap only) | **Implemented** — per-SSU + bulk controls |
| **create_listing / buy / cancel** | ✅ Yes | **Implemented** — TradePost detail screen |
| **deposit_to_inventory** | ❌ No (`verify_sponsor`) | Not possible from web |

### Network Nodes

| Operation | Web PTB? | Status |
|-----------|----------|--------|
| **online** | ✅ Yes (OwnerCap + Clock) | **Implemented** — per-node + bulk controls |
| **offline** | ✅ Yes (OwnerCap + FuelConfig + connected child cleanup) | **Implemented** — per-node row/detail actions only; no bulk offline UI |
| **deposit_fuel / withdraw_fuel** | ❌ No (`verify_sponsor`) | Not possible from web |
| **update_metadata** | ✅ Yes (OwnerCap only) | Not yet implemented |

#### Network Node Offline — Implemented With Same-PTB Cleanup

Taking a network node offline is technically possible from the web and is now implemented on the dedicated network-node list/detail surfaces. The runtime still uses a hot-potato pattern, so the action must remain a single PTB:

1. Call `network_node::offline()` — this returns an `OfflineAssemblies` object
2. For each connected structure, call the matching `offline_connected_*()` function (gate, turret, or SSU)
3. Call `destroy_offline_assemblies()` to consume the result

All calls happen within a single transaction. The current web implementation:
- uses the live Stillness `FuelConfig` shared object `0x4fcf28a9be750d242bc5d2f324429e31176faecb5b84f0af7dff3a2a6e243550`
- resolves connected child IDs and families from operator inventory first, with `node-assemblies` as a fallback for dedicated node detail/list surfaces
- only exposes `Take offline` when that child lookup resolves cleanly, so the app does not offer a fake partial node-offline action
- keeps bulk node offline unimplemented; only per-node row/detail actions are currently wired

The sponsored path now requires the full allowlist, not just `network_node::offline`: `network_node::{offline,destroy_offline_assemblies}` plus the matching `offline_connected_*` helper for each connected child family.

---

## Key Signatures (from source)

### authorize_extension (IMPLEMENTED)
```move
public fun authorize_extension<Auth: drop>(
    gate: &mut Gate,
    owner_cap: &OwnerCap<Gate>,
)
```
- No online requirement. Checks `is_authorized(owner_cap, gate_id)` and `!is_extension_frozen`.
- PTB pattern: borrow OwnerCap from Character → authorize_extension<GateAuth> → return OwnerCap.

### online / offline (IMPLEMENTED)
```move
public fun online(
    gate: &mut Gate,
    network_node: &mut NetworkNode,
    energy_config: &EnergyConfig,
    owner_cap: &OwnerCap<Gate>,
)
```
- `EnergyConfig` is a shared singleton: `0x9285364e8104c04380d9cc4a001bbdfc81a554aad441c2909c2d3bd52a0c9c62` (LIVE-VERIFIED in Day 1 validation).
- `NetworkNode` objects are discovered by the frontend via `energy_source_id` field on gates.
- PTB pattern: borrow OwnerCap from Character → online/offline(gate, networkNode, energyConfig, cap) → return OwnerCap.

### link_gates — Sponsorship Analysis

```move
public fun link_gates(
    source_gate: &mut Gate,
    destination_gate: &mut Gate,
    gate_config: &GateConfig,
    server_registry: &ServerAddressRegistry,
    admin_acl: &AdminACL,
    source_gate_owner_cap: &OwnerCap<Gate>,
    destination_gate_owner_cap: &OwnerCap<Gate>,
    distance_proof: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

**`verify_sponsor` check** (from `access_control.move` L157–164):
```move
public fun verify_sponsor(admin_acl: &AdminACL, ctx: &TxContext) {
    let sponsor_opt = tx_context::sponsor(ctx);
    let authorized_address = if (option::is_some(&sponsor_opt)) {
        *option::borrow(&sponsor_opt)
    } else { ctx.sender() };
    assert!(admin_acl.authorized_sponsors.contains(authorized_address), EUnauthorizedSponsor);
}
```

This is a **hybrid check** — it inspects Sui's native `tx_context::sponsor()` first, falling back to `ctx.sender()`. The address must be pre-enrolled in `AdminACL.authorized_sponsors` (a `Table<address, bool>`).

**Enrollment is gated by `GovernorCap`** — only EVE Frontier/CCP can call `add_sponsor_to_acl`.

| Scenario | Works? | Why |
|----------|--------|-----|
| Player wallet-signed PTB (no sponsor) | **No** | Player address not in AdminACL |
| Custom third-party sponsor service | **No** | Cannot self-enroll; requires GovernorCap |
| Custom sponsor enrolled by CCP | **Theoretically yes** | If CCP calls `add_sponsor_to_acl` for the address |
| EVE Frontier official backend (EVE Vault) | **Yes** | Server address is enrolled in AdminACL |

**Note:** The source code contains a TODO: *"Remove admin_acl once a location service is exposed for signed server proofs."* (`gate.move` L216–217). The sponsor check is a temporary guard for distance proof verification, not a permanent design.

---

## Posture Switch — Idempotency Fix (2026-03-17)

**Problem:** Switching to Defense mode failed with `ECoinTollNotSet` because `remove_coin_toll` was called on ALL gates blindly, including gates with no toll configured.

**Root cause:** `postureSwitchTx.ts` emitted `remove_coin_toll` for every gate ID without checking which gates actually had a coin toll dynamic field on `GateConfig`.

**Fix:** The posture switch now pre-reads gate policies via `fetchBatchGatePolicies()` before building the PTB. Gates are split into `gatesWithToll` and `gatesWithoutToll`. Only relevant operations are included:
- Defense switch: `remove_coin_toll` only for `gatesWithToll`
- Commercial switch: `set_coin_toll` only for `gatesWithoutToll`

This makes the posture switch safe against:
- Gates with no coin toll configured
- Gates already matching target posture
- Mixed infrastructure state (some gates with tolls, some without)

---

## Operator Test Procedure

### Gate Authorization
1. Navigate to the Gates screen.
2. Click **"Authorize GateAuth (N)"** button.
3. Approve the wallet transaction.
4. List updates immediately (query invalidation).

### Gate Online/Offline (Single)
1. Navigate to Gates → click a specific gate.
2. In the **Power State** section, click "Bring Online" or "Take Offline".
3. Approve the wallet transaction.
4. Gate status updates on next refresh.

### Gate Online/Offline (Bulk)
1. Navigate to Gates list screen.
2. Click **"Bring All Online (N)"** or **"Take All Offline (N)"** buttons.
3. Approve the wallet transaction.

### Turret Online/Offline (Single)
1. Navigate to Turrets → click a specific turret.
2. In the **Power State** section, click "Bring Online" or "Take Offline".
3. Approve the wallet transaction.

### Turret Online/Offline (Bulk)
1. Navigate to Turrets list screen.
2. Click **"Bring All Online (N)"** or **"Take All Offline (N)"** buttons.

### TradePost / SSU Online/Offline (Single)
1. Navigate to TradePosts → click a specific trade post.
2. In the **Power State** section, click "Bring Online" or "Take Offline".

### TradePost / SSU Online/Offline (Bulk)
1. Navigate to TradePosts list screen.
2. Click **"Bring All Online (N)"** or **"Take All Offline (N)"** buttons.

### Network Node Power Control
1. Navigate to Network Nodes → click a specific node.
2. In the **Power State** section, click "Bring online" or "Take offline".
3. Approve the wallet transaction.
4. If taking the node offline, confirm the point-of-action prompt.
5. Node status updates on the next refresh.

### Network Node Bulk Online
1. Navigate to Network Nodes list screen.
2. Click **"Bring Online (N offline)"** button.
3. Note: Currently processes one node at a time.

### Tribes Autocomplete (Gate Policy)
1. Navigate to Gates → click a gate with extension authorized.
2. In the Tribe Filter section, click "Set Rule" (or edit existing).
3. Type a tribe name or tag in the autocomplete field.
4. Select a tribe from the dropdown — rule is applied using the tribe's numeric ID.

### Posture Switch
1. Navigate to Command (Dashboard).
2. Resolve any remaining blockers (turret auth, gate auth).
3. Click "Defense Mode" (or "Stand Down" to return to Commercial).
4. Approve the wallet transaction.
5. Tolls are only removed/set where needed — no abort on mixed state.

---

## Posture Switch Readiness Note

Gate authorization is classified as **severity: warning** — it does NOT block the posture switch button. Only turret authorization (severity: error when `unauthorized > 0`) blocks `isReady`. Gates being unauthorized is advisory: the posture switch PTB operates on `GateConfig` (shared config object), not individual gate objects.
