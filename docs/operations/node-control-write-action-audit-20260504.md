# Node Control Write-Action Audit - 2026-05-04

## 1. Executive summary

This is a docs-only audit of Node Control write actions, sponsor-policy gaps, signal-parity boundaries, and package-update pressure on `docs/node-control-write-action-audit`. It does not implement runtime code, Move changes, package updates, sponsor-worker deploys, EF-Map changes, or production deploys.

Current runtime truth is narrower and clearer than some older planning text:

- individual `online` / `offline` control is already real for gates, storage units, and turrets in the web app
- individual `online` is already real for network nodes in the web app, but network-node `offline` is still unwired
- metadata rename is already supported upstream for gates, storage units, turrets, generic assemblies, and network nodes, but CivilizationControl does not expose it yet
- the current sponsor allowlist is the main near-term gating seam for new sponsored actions; it already covers the shipped power and authorization flows, but not rename, network-node offline, revoke, or freeze
- signal-history v1 intentionally does not restore every legacy governance and revenue family; that parity backlog is separate from the first Node Control write slice

Package-update decision:

> Do not approve any CivilizationControl or world package update until a required operator action is proven impossible with the current Stillness runtime calls, current CC posture or policy surfaces, and sponsor-policy changes alone.

Zero-package feasibility statement:

> A first useful Node Control write slice is feasible with zero package changes by using existing gate, storage, turret, and network-node power calls plus metadata rename flows, while deferring network-node offline, extension freeze or revoke, marketplace settlement surfaces, and signal-history parity expansion.

## 2. Scope, non-goals, and confirmed facts

This audit assumes the following repo-grounded facts and keeps them fixed:

- normal Signal Feed routes already use the wallet-scoped shared `signal-history` endpoint; browser `queryEvents` must not return as the normal route contract
- Node Control is already operator-inventory-first for grouped node display and authority hints
- current frontend power rails already exist for gate, storage, turret, and network-node online flows
- current CC posture switching is gate-keyed and turret-doctrine-aware, but it is not a general-purpose node preset system
- shared-backend data remains additive and read-only; wallet and chain remain authoritative for writes
- package IDs and runtime or original split for this audit come from `config/chain/stillness.ts`

Out of scope for this pass:

- Move edits
- package publishes or package ID updates
- sponsor-worker policy implementation or deploy
- EF-Map or shared-backend schema changes
- runtime PTB implementation
- production deploys

## 3. Current repo-state anchors

| Surface | Current anchor | Why it matters |
|---|---|---|
| Stillness runtime IDs | `config/chain/stillness.ts` | Current package targets outrank older planning text |
| Sponsor allowlist | `config/sponsorship/civilizationControlPolicy.ts` | Determines what a new sponsored write can do without worker changes |
| Shipped structure power builder | `src/lib/structurePowerTx.ts` | Proves what online or offline actions are already wired |
| Shipped structure power hook | `src/hooks/useStructurePower.ts` | Proves current execution and invalidation behavior |
| Node-local action authority | `src/lib/nodeDrilldownActionAuthority.ts` | Proves Node Control only treats verified power actions as shipped today |
| Node-local model | `src/lib/nodeDrilldownModel.ts` | Proves only gate, storage, and turret families are mapped into node-local power support |
| Rename action hints | `src/types/domain.ts` | Proves operator inventory already models both `power` and `rename` action candidates |
| Network-node detail surface | `src/screens/NetworkNodeDetailScreen.tsx` | Confirms online is real and offline still says not implemented |
| Posture transaction builder | `src/lib/postureSwitchTx.ts` | Proves posture changes per-gate posture state plus turret doctrine only |
| Shared signal history contract | `src/lib/signalHistoryClient.ts` | Defines current event-parity boundary for normal routes |

## 4. Stillness runtime and policy anchor matrix

| Surface | Source of truth | Current state | Why it matters for this audit | Change required now? |
|---|---|---|---|---|
| World runtime package | `config/chain/stillness.ts` | Explicit `WORLD_RUNTIME_PACKAGE_ID` | Current runtime entry points for power and authorization | No |
| World original package | `config/chain/stillness.ts` | Explicit `WORLD_ORIGINAL_PACKAGE_ID` | Current type-origin surface for exact type tags | No |
| CC package | `config/chain/stillness.ts` | Explicit `CC_PACKAGE_ID` / `CC_ORIGINAL_PACKAGE_ID` | Current posture, gate policy, and trade-post surfaces | No |
| Gate config object | `config/chain/stillness.ts` | Explicit `GATE_CONFIG_ID` | Current per-gate posture state and gate policy reads or writes | No |
| Energy config object | `config/chain/stillness.ts` | Explicit `ENERGY_CONFIG_ID` | Required by current power builders | No |
| Sponsor policy | `config/sponsorship/civilizationControlPolicy.ts` | Covers shipped authorize, URL, and power calls only | Main gap for new sponsored actions | Not in this docs branch |
| Signal Feed source | `src/lib/signalHistoryClient.ts` | `signal-history.v1` for normal routes | Read-only parity backlog must stay separate | No |

## 5. Area A - capability matrix across structure families and actions

### 5.1 Current action surface matrix

| Action | Structure family | Indexed hint today | Current frontend seam | Sponsor allowlist | Verified upstream call | Package gap? | Audit decision |
|---|---|---|---|---|---|---|---|
| Individual `online` / `offline` | Gate | `actionCandidate.actions.power` and current direct-chain structure model | Already shipped through `useStructurePower(...)`, detail screens, and Node Control row or menu actions | Yes | `world::gate::{online,offline}` | No | Keep in the zero-package slice |
| Individual `online` / `offline` | Storage / TradePost | `actionCandidate.actions.power` and current direct-chain structure model | Already shipped through `useStructurePower(...)`, detail screens, and Node Control row or menu actions | Yes | `world::storage_unit::{online,offline}` | No | Keep in the zero-package slice |
| Individual `online` / `offline` | Turret | `actionCandidate.actions.power` and current direct-chain structure model | Already shipped through `useStructurePower(...)`, detail screens, and Node Control row or menu actions | Yes | `world::turret::{online,offline}` | No | Keep in the zero-package slice |
| Individual `online` | Network Node | Current detail and list surfaces use direct-chain structure model, not node-local row power mapping | Already shipped through `useStructurePower(...)` on node detail or list | Yes | `world::network_node::online` | No | Keep in the zero-package slice |
| Individual `offline` | Network Node | No shipped node-local candidate and detail screen still marks it unimplemented | Not wired | No | `world::network_node::offline` plus `OfflineAssemblies` handling | No contract gap, but PTB gap | Separate proof branch after hot-potato PTB work |
| Rename / edit name | Gate, Storage, Turret, Network Node | `IndexedActionCandidate.actions.rename` exists in the current type model | Not wired anywhere in current UI | No | `update_metadata_name` exists in family-specific modules and generic assembly or node metadata surfaces | No | Zero-package frontend plus sponsor-policy work |
| Update metadata URL | Gate, Storage | Current detail-screen product already treats URL as a separate governance seam | Already shipped on current gate or storage flows | Yes | `update_metadata_url` | No | Leave separate from Node Control write audit |
| Authorize extension | Gate, Storage, Turret | Not a node-local row action; already modeled elsewhere | Already shipped on detail surfaces where relevant | Yes | `authorize_extension` | No | Leave separate from first Node Control slice |
| Revoke extension | Gate, Storage, Turret | No node-local candidate today | Not wired | No | Revoke functions exist upstream | No | Document only; do not implement yet |
| Freeze extension config | Gate, Storage, Turret | No node-local candidate today | Not wired | No | Freeze functions and frozen event exist upstream | No | Document only; do not implement yet |
| Set posture | Gate-backed posture plus turret doctrine swap | Separate macro control; not modeled as node-local power or rename | Already shipped in dashboard posture control | Yes for current posture swap path | `cc::posture::set_posture` plus turret `authorize_extension` | No | Keep separate from Node Control actions |

### 5.2 Operator-inventory family coverage boundary

| Family shown in node taxonomy | Displayed today | Current frontend execution type | Current `actionCandidate` fit | Verified runtime surface | First-slice status |
|---|---|---|---|---|---|
| `networkNode` | Yes | `network_node` is in the current `StructureType` union | Partial; node-local rows do not use this family and detail screen still lacks offline | Network-node-specific power and metadata calls exist | Keep `online`; defer `offline`; rename can be added without package work |
| `gate` | Yes | `gate` | Full for current power flow | Gate-specific power and metadata calls exist | Zero-package supported |
| `tradePost` / storage | Yes | `storage_unit` | Full for current power flow | Storage-specific power and metadata calls exist | Zero-package supported |
| `turret` | Yes | `turret` | Full for current power flow | Turret-specific power and metadata calls exist | Zero-package supported |
| `printer` | Yes | No matching `StructureType` today | Current indexed model can hint future support, but execution types do not cover it | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `refinery` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `assembler` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `berth` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `relay` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `nursery` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `nest` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |
| `shelter` | Yes | No matching `StructureType` today | Same boundary as `printer` | Generic `world::assembly` power and metadata calls exist | Do not claim package need; widen frontend and read-model types first |

Current repo truth for Node Control is therefore narrower than the taxonomy it displays: only gate, storage, and turret families are mapped into node-local power support today, network-node power is handled outside the node-local row builder, and the remaining operator-inventory families exceed the current four-family execution type union even though generic assembly write surfaces already exist upstream.

## 6. Area B - old commercial or defensive posture behavior vs current runtime truth

Historical product intent described commercial or defensive posture as a unified operator mode that changed gate rules and turret doctrine together. Current runtime truth is narrower:

- the current PTB builder records per-gate posture through `cc::posture::set_posture`
- the same PTB swaps turret authorization between `CommercialAuth` and `DefenseAuth`
- the same PTB explicitly does **not** modify gate toll configuration
- gate policy and treasury remain separate operator surfaces managed through the gate policy composer

That means the old phrase "commercial vs defensive posture" now maps to three different seams:

| Seam | Current truth | Zero-package? | Package pressure |
|---|---|---|---|
| Persisted per-gate posture mode | Real CC state today | Yes | None for current behavior |
| Turret doctrine swap | Real world authorization behavior today | Yes | None for current behavior |
| Gate toll or access preset swap | Historical intent, not current runtime behavior | No | Separate CC policy-design discussion only if product wants posture-aware gate enforcement |

Implications for next work:

- do not treat posture switching as a substitute for node power presets
- do not assume posture changes gross yield, toll rules, or gate access today
- treat any gate-optional or turret-only posture convenience as frontend scoping work first, not as package justification

## 7. Area C - each current Node Control action

| Action surface | Current status | Missing seam | Package gap? | Recommended next step |
|---|---|---|---|---|
| Attached-structure `Take Offline` / `Bring Online` | Real for gate, storage, turret | None beyond normal UI rollout consistency | No | Reuse current power builder consistently across row, menu, and detail surfaces |
| Network-node `Bring Online` | Real on dedicated node surfaces | None | No | Keep as-is |
| Network-node `Take Offline` | Not implemented | Mixed-family PTB with child `OfflineAssemblies` handling and explicit cleanup | No | Separate proof branch after audit |
| Rename / edit name | Not implemented | Rename UI, validation, PTB builder, sponsor policy if sponsored | No | Add after individual power parity |
| Extension authorize | Real but not a node-local action | None for current detail surfaces | No | Leave separate |
| Extension revoke | Not implemented | UI, PTB builder, sponsor policy, clear product scope | No | Keep out of first slice |
| Extension freeze | Not implemented | UI, PTB builder, sponsor policy, explicit safety handling | No | Keep out of first slice |
| Macro posture switch | Real from dashboard | Node Control does not own it | No | Keep separate from attached-structure action work |

## 8. Area D - rename or edit-name feasibility

Rename is a frontend and policy gap, not a contract gap.

Evidence already in the repo:

- the current indexed action model includes `actions.rename`
- current world metadata primitives emit `MetadataChangedEvent`
- family-specific rename calls already exist for gate, storage, turret, and network node modules
- generic assembly metadata-name mutation also exists for the broader assembly families

What is missing today:

- no current UI path exposes rename on detail screens, context menus, or Node Control rails
- no current PTB builder wires rename calls
- current sponsor allowlist does not cover metadata-name or metadata-description updates

Decision:

- detail-screen rename for gate, storage, turret, and network node is zero-package work
- Node Control rename across the wider operator-inventory taxonomy is blocked first by frontend and read-model type narrowing, not by a proven contract gap
- sponsored rename requires a separate sponsor-policy update and worker preview proof; wallet-paid rename does not require a package update

## 9. Area E - Node Power State preset feasibility

The phrase "Node Power State" currently spans three different products. They should not be conflated.

| Preset concept | What it means | Feasible with current packages? | Main gap |
|---|---|---|---|
| Local saved preset | Browser-stored desired online or offline state for structures on one node | Yes | Frontend persistence and apply UX |
| One-PTB preset apply for gate, storage, and turret | Build one mixed-family PTB from existing per-structure calls | Likely yes | New PTB composer and execution proof |
| Full-node preset including node offline | Include network-node offline plus child assembly handling | Not ready | Hot-potato PTB handling and worker policy |
| Shared on-chain named presets | Cross-device, persistent governance artifact | Not proven with current contracts | Product and package design decision |

The minimal next slice is therefore local presets only, or even narrower, a non-persistent apply flow assembled from the already-supported individual power actions. On-chain named presets are not justified by current repo evidence.

## 10. Area F - signal and event parity matrix

### 10.1 Signal-history parity matrix

| Signal family | Normal-route source today | Present in `signal-history.v1`? | Current dashboard or activity impact | Relevant to write-action audit? | Decision |
|---|---|---|---|---|---|
| Structure online or offline | Shared history endpoint | Yes | Current status history works | Yes | Keep as-is |
| Node fuel changed / low / critical | Shared history endpoint | Yes | Current status and warning history works | Yes | Keep as-is |
| Extension authorized | Shared history endpoint | Yes | Current governance history works | Yes | Keep as-is |
| Extension frozen | Shared history endpoint | Yes | Exposed as `frozen`, not revoke or delete | Yes | Keep label stable |
| Ownership transferred | Shared history endpoint | Yes | Current governance history works | Low | Keep as-is |
| Gate transit | Shared history endpoint | Yes | Visible as informational transit history | Medium | Keep as-is |
| Storage deposit / withdraw | Shared history endpoint | Yes | Visible as informational trade history | Medium | Keep as-is |
| Posture changed | Not in current normal route | No | No current signal-history parity | High for posture history, low for first write slice | Defer |
| Gate policy / treasury / toll config | Not in current normal route | No | No current parity for gate governance mutations | High for policy audit, low for first write slice | Defer |
| Turret doctrine change | Not in current normal route | No | No dedicated parity for doctrine swaps | Medium | Defer |
| Marketplace listing creation / cancel / purchase | Browser event path only | No | Activity and dashboard do not regain old market history parity | High for marketplace, low for first write slice | Defer |
| Toll collection / gross yield settlement | Not in current normal route | No | `Gross Network Yield` remains effectively waiting for toll and market settlement families | High for revenue UI, low for first write slice | Defer |

### 10.2 Gross-yield boundary

Legacy dashboard revenue semantics depended on browser-event families that are not part of `signal-history.v1`. The current shared-history mapper treats `storage_deposit`, `storage_withdraw`, and `gate_transit` as informational signals, not revenue signals, and there is still no wallet-scoped toll-collection or marketplace-settlement family in the normal route contract.

Decision:

- do not block the first Node Control write slice on gross-yield restoration
- keep signal-history parity, toll history, and marketplace settlement as separate read-only backlog work

## 11. Area G - marketplace deferral

Marketplace listing discovery still relies on a separate browser event-scan surface. That is already documented as a deferred read-path seam and does not justify mixing marketplace work into the first Node Control write branch.

Marketplace is therefore deferred for two reasons:

- the first Node Control write slice can ship without any marketplace dependency
- current signal-history v1 still does not expose the settlement families required to restore old revenue semantics cleanly

Decision: keep marketplace listing and settlement work in a later revenue branch, after individual power and rename parity are settled.

## 12. Area H - single package-update minimization plan

1. Do not open a package branch yet.
2. Open the first implementation branch only for zero-package action parity:
   - consistent gate, storage, turret, and network-node online controls across node menus, rails, and detail screens
   - rename on the current four-family execution set
3. If sponsored rename is required, use a separate sponsor-worker policy branch and preview proof rather than widening the UI branch.
4. Treat network-node offline as its own PTB proof branch because the blocker is transaction composition, not a missing world call.
5. Treat local power presets as frontend-only until operators prove they need shared, on-chain named presets.
6. Revisit package change only if one of these conditions becomes true:
   - operators need posture-aware gate enforcement, not just current posture state plus turret doctrine
   - operators need on-chain shared preset objects rather than local saved presets
   - current runtime calls cannot express a required action even after PTB and sponsor-policy work is proven out

## 13. Area I - final decision matrix

| Candidate feature | Frontend-only work | Sponsor-policy work | EF-Map or shared-backend work | PTB complexity | CC or world package change | Decision |
|---|---|---|---|---|---|---|
| Gate / storage / turret power parity across all current UI surfaces | Yes | No new policy required | No | Low | No | Implement first |
| Network-node online parity cleanup | Yes | No new policy required | No | Low | No | Implement first |
| Network-node offline | No | Yes if sponsored | No | High | No proven package need | Separate proof branch |
| Rename for gate / storage / turret / network node | Yes | Yes if sponsored | No | Low | No | Zero-package candidate |
| Rename for printer / refinery / assembler / berth / relay / nursery / nest / shelter | Yes, but requires wider execution typing | Possibly later | Possibly later for better indexed hints, but not required to prove contract feasibility | Low to medium | No proven package need | Defer until type-model widening |
| Turret-only posture convenience when no gate is present | Yes | Likely no new policy required | No | Low | No | Treat as frontend scoping question |
| Posture-aware gate policy preset switching | No | No | No | Medium | Likely yes in CC policy design | Keep out of this wave |
| Local Node Power State presets | Yes | No | No | Low to medium | No | Later frontend slice |
| Shared on-chain named presets | No | No | No | Medium | Likely yes | Do not start |
| Signal-history parity for posture / policy / toll / market settlement | No | No | Yes | None | No | Separate read-only backlog |
| Marketplace listing and settlement integration | No | No | Yes | None | No proven package need | Separate revenue branch |

## 14. Recommended implementation order

1. Zero-package UI parity branch for current shipped power flows plus rename on the current four-family execution set.
2. Separate sponsor-worker policy branch only if sponsored rename is desired.
3. Separate PTB proof branch for network-node offline.
4. Separate frontend branch for local power-state presets if still desired after individual-action parity lands.
5. Separate read-path backlog for signal-history parity and marketplace settlement families.
6. Package discussion only after one of the minimization-plan triggers is proven real.

## 15. Do not implement yet

- Do not implement network-node offline yet; the upstream path exists, but it requires explicit child-offline handling and `OfflineAssemblies` cleanup in the same PTB.
- Do not implement extension freeze or revoke yet; freeze conflicts directly with posture-driven turret authorization flows and neither action is sponsor-allowlisted today.
- Do not reopen signal-history parity work for posture, gate policy, toll, turret doctrine, or marketplace settlement inside the first Node Control write branch.
- Do not mix sponsor-worker policy rollout into the same branch as the first UI write-action slice.
- Do not open any CC or world package branch yet.
- Do not widen the first slice into on-chain presets, marketplace settlement, or gross-yield restoration.