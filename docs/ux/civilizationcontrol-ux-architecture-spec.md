# CivilizationControl — UX Architecture Specification

**Retention:** Carry-forward

Structural UX planning document for the CivilizationControl governance command layer. Defines screen hierarchy, interaction flows, data models, and upgrade paths. This is NOT UI implementation or visual styling — it is the architectural blueprint that implementation follows.

**Status:** Draft v1.1 — 2026-02-17  
**Scope:** Gate governance (GateControl) + frontier commerce (TradePost)  
**Validated against:** world-contracts auth model, devnet-validated capabilities, authenticated user surface analysis, product vision, strategy memo

---

## Table of Contents

1. [Capability Summary](#1-capability-summary)
2. [Constraint Summary](#2-constraint-summary)
3. [Screen Hierarchy](#3-screen-hierarchy)
4. [Gate List Layout](#4-gate-list-layout)
5. [Gate Detail Layout](#5-gate-detail-layout)
6. [Rule Composer Model](#6-rule-composer-model)
7. [Linking Flow](#7-linking-flow)
8. [Manual Pinning Model](#8-manual-pinning-model)
9. [Optional Spatial Layer Model](#9-optional-spatial-layer-model)
10. [Wallet Integration & Authentication Flow](#10-wallet-integration--authentication-flow)
11. [MVP vs Stretch Table](#11-mvp-vs-stretch-table)
12. [Design Principles & Upgrade Path](#12-design-principles--upgrade-path)
13. [Figma-Ready UX Brief (Condensed)](#13-figma-ready-ux-brief-condensed)
14. [Hierarchy Compression Revision — 2026-02-18](#14-hierarchy-compression-revision--2026-02-18)
15. [In-Game DApp Surface Architecture](#15-in-game-dapp-surface-architecture-2026-02-28)

---

## 1. Capability Summary

### Player-Only Operations (OwnerCap — no server needed)

- Bring gate / NWN / SSU online or offline
- Authorize extension on gate or SSU (`authorize_extension<Auth>`)
- Replace extension on gate (`swap_or_fill`)
- Unlink two gates (requires OwnerCaps for both)
- Read any structure's full state via RPC (status, fuel, extensions, link partners, inventory, location hash)
- Enumerate owned structures: Character → `suix_getOwnedObjects` → OwnerCap objects → `authorized_object_id` → structure data

### Server-Proof Operations (OwnerCap + server-signed attestation)

- Link gates — requires distance proof (Ed25519 signed by server in `ServerAddressRegistry`) + AdminACL `verify_sponsor()` required
- Bridge chain→game items — requires location proof

### Sponsored Operations (AdminACL-listed sponsor paying gas)

- Default jump (no extension) — `verify_sponsor()` required
- Jump with permit — valid `JumpPermit` + sponsor
- Deposit/withdraw fuel to/from NWN — OwnerCap + sponsor
- Deposit/withdraw items to/from SSU (owner-path) — `verify_sponsor()` required (proximity proof removed)

### Extension-Controlled Operations (extension witness — only from extension packages)

- Issue jump permit — `issue_jump_permit<Auth>` requires extension's witness type; both source and destination gates must share the same extension type
- Extension deposit/withdraw item to SSU — typed witness authorization enables cross-address operations without owner being online

### Devnet-Validated Capabilities

- **Tribe-based filtering** — matching tribe passes, non-matching tribe blocked atomically
- **Coin toll collection** — on-chain `Coin<SUI>` payment transfers to gate operator on jump
- **Rule composition** — tribe filter AND toll as independent, stackable layers via dynamic field dispatch
- **Full 13-step gate lifecycle** — end-to-end on local devnet (20 successful transactions, 2026-02-16)
- **ZK privacy rule (Groth16)** — membership circuit (depth 10, Poseidon(2), 2,430 constraints) on-chain verified; standalone `zk_gate` module published on local devnet (sandbox validation, to re-validate on hackathon test server March 11)
- **Atomic buy flow** — buyer pays, receives item, seller receives payment in single on-chain transaction
- **Cross-address item transfer** — extension's typed witness authorizes withdrawal from seller's SSU without seller online
- **SSU-backed storefront lifecycle** — publish → setup → authorize → stock → list → buy (devnet validated)

### Currency & Economic Capabilities

- On-chain settlement in `Coin<SUI>` — tolls, trades, storefront purchases
- `Coin<T>` generic toll support architecturally possible (any coin type)
- **Dual-display currency model:** **EVE** is the on-chain denomination used in demo narration and proof overlays (e.g., "5 EVE toll"). **Lux** (10,000 Lux = 1 EVE) is the in-game player-facing display denomination. Dashboard contexts may show both (e.g., "5 EVE · 50,000 Lux"). On-chain implementation remains `Coin<SUI>` for Day-1.

---

## 2. Constraint Summary

### Location & Coordinates

- **Raw coordinates NOT on-chain** — `Location` stores only a 32-byte Poseidon2 hash; no (x, y, z) fields exist
- **Hash is irreversible** — cannot recover coordinates; brute-force infeasible
- **No map from chain data** — absolute position requires off-chain coordinate source
- **No "structures near me" query** — requires server proof
- **Distance revealed in proof transactions** — `LocationProofMessage.distance` is visible in tx data

### Wallet & Identity

> **2026-03-10 update:** `PlayerProfile` (v0.0.16) now enables wallet→Character lookup on-chain. The "off-chain resolution" constraint below is largely resolved. `LocationRegistry` (v0.0.18/8eb197e) now stores plain-text coordinates on-chain via `reveal_location()`. Several spatial constraints below are softened.

- **~~No on-chain wallet→Character mapping~~** — ~~first discovery step requires off-chain resolution~~ **Now available via PlayerProfile (v0.0.16)**
- **Character is a shared object** — `suix_getOwnedObjects` on wallet address does NOT find the Character
- **Character ID resolution requires off-chain data** — event indexing, game server API, or deterministic ID computation
- **OwnerCaps use transfer-to-object** — live under Character's UID, not player's wallet address

### Structure Discovery

- **No auto-discovery** — no on-chain enumeration mechanism; must use RPC with known Character ID
- **4-step discovery chain**: wallet → Character ID (off-chain) → OwnerCaps (RPC) → authorized_object_id → structure data (RPC)
- **RPC-based discovery unverified on live network** — confirmed on local devnet only (Yellow risk). Hackathon test server (from March 11) is the primary validation target; Stillness (live server) deferred to post-submission.

### Sponsorship & Server

- **`verify_sponsor` has sender fallback** — when no sponsor is present (non-sponsored tx), `verify_sponsor(ctx)` falls back to `tx_context::sender(ctx)`. Self-sponsorship (sender == gas_payer) is equivalent to a non-sponsored tx. A non-sponsored transaction succeeds if the sender is in AdminACL.
- **Sponsor must be in AdminACL** — added via `add_sponsor_to_acl()` (requires GovernorCap)
- **No `remove_sponsor_from_acl` function** — once added, non-removable without package upgrade
- **Location proofs bind to sender** — `message.player_address == ctx.sender()`, non-transferable

### Extension Constraints

- **Both gates must share extension type** — for `issue_jump_permit` to work
- **JumpPermit is single-use** — deleted after consumption
- **OwnerCap transfer restricted** — only Character-type transfers allowed

### Currency Constraints

- **EVE Token exists on Sui** — `Coin<EVE>` is published (10B supply, 9 decimals, burn-only after init) but **not yet integrated** into CivilizationControl. Day-1 settlement uses `Coin<SUI>` only.
- **Lux has no on-chain representation** — purely in-game engine currency (confirmed rate: 10,000 Lux = 1 EVE token; Lux-to-SUI depends on EVE/SUI exchange)

### Hard UX Constraints

- **List-first, not map-first is mandatory** — ~~spatial data unavailable from chain~~ **2026-03-10:** `LocationRegistry` now provides coordinates; list-first remains the design choice but map-first is now technically feasible
- **~~Wallet→Character mapping is off-chain~~** — ~~bootstrapping constraint on first use~~ **2026-03-10:** `PlayerProfile` enables on-chain wallet→Character lookup
- **Server involvement for linking and inventory** — cannot be purely client-side
- **Sponsorship required for core gameplay** — gas abstraction needs separate sponsor address
- **Currency display requires conversion logic** — players think Lux, settlement is SUI

### In-Game DApp Browser (Confirmed 2026-02-28)

- **Portrait viewport: 787 × 1198 px** — all layouts must render in ~800px width; tables >4 columns must collapse to cards
- **Dark mode default** — `prefers-color-scheme: dark`; UI must default to dark theme
- **No Sui Wallet Standard in-game** — game injects EVM wallet only (EIP-6963); `@mysten/dapp-kit` discovers zero Sui wallets
- **Read-only in-game default** — without Sui wallet, in-game users can only view governance state. Write operations require external browser with EVE Vault
- **No `crossOriginIsolated`** — `SharedArrayBuffer` unavailable; ZK WASM prover limited to single-threaded mode
- **ObjectId from URL only** — no automatic structure context injection; DApp URL must contain structure objectId
- **Storage is cache-tier only** — localStorage/IndexedDB available but persistence across game restarts unverified
- **No browser extensions** — CEF doesn't load Chrome extensions; no EVE Vault, no Sui Wallet in-game
- **Full reference:** [In-Game DApp Browser Surface](../architecture/in-game-dapp-surface.md)

---

## 3. Screen Hierarchy

> **Display label convention:** Player-facing navigation labels follow [Voice & Narrative Guide §4, Option C](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md). The structural names below map to display labels as follows: Dashboard → **Command Overview**, Activity → **Signal Feed**, Settings → **Configuration**. Gates and Trade Posts retain their names. Apply the [Narrative Impact Check](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md) (§8) when implementing any UI surface defined here.

> **In-game viewport constraint (2026-02-28):** The in-game browser viewport is 787×1198 portrait. The sidebar navigation described below collapses to a hamburger drawer at ≤800px. The contextual panel becomes a full-screen overlay. All content flows single-column. See [In-Game DApp Browser Surface](../architecture/in-game-dapp-surface.md) §2.

```
CivilizationControl (Command Nexus)
├── Command Overview (Dashboard)
│   ├── Posture Indicator ("Open for Business" / "Defense Mode" — always visible)
│   ├── Strategic Network Panel (SVG topology: structures, links, status indicators)
│   ├── Aggregated Metrics (structure counts, online/offline, revenue, fuel)
│   ├── Alert / Warning Cards (fuel critical, offline, unlinked, unconfigured)
│   ├── Quick Action Shortcuts (deploy policy, create listing, bring online, posture switch) — **external browser only; hidden in-game read-only mode**
│   └── Recent Signal Preview (last 5 events)
├── Gates (Primary Control Plane)
│   ├── Gate List View (sortable, filterable, taggable)
│   └── Gate Detail View
│       ├── Overview (name, ID, status, extension, link, energy, tags)
│       ├── Access Rules (rule composer entry point)
│       ├── Economic Rules (toll config + revenue)
│       ├── Linking (partner display + link/unlink flow)
│       ├── Signals (gate-scoped event stream)
│       └── Spatial Assignment (manual system pin)
├── Trade Posts
│   ├── SSU List View (name, ID, status, listings, revenue, inventory)
│   └── SSU Detail View
│       ├── Inventory (item browser)
│       ├── Listings (create, edit, cancel; active + completed)
│       ├── Trade History (completed transactions)
│       └── Revenue (economic summary)
├── Signal Feed (Global Event Feed)
│   ├── Event Stream (chronological, filterable)
│   └── Event Detail (timestamp, structure, type, amount, counterparty, tx)
└── Configuration
    ├── Account (wallet, Character ID, tribe)
    ├── Structure Labels Registry
    ├── Spatial Mappings Registry
    ├── Group / Tag Registry
    └── Currency / Display Preferences
```

### Primary Navigation (Sidebar)

| Nav Item     | Purpose                                                    | Primary Content         | Key Metrics                                           |
| ------------ | ---------------------------------------------------------- | ----------------------- | ----------------------------------------------------- |
| **Command Overview** | At-a-glance health and economic summary               | Aggregated cards + alerts | Total structures, online/offline, revenue, fuel alerts |
| **Gates**       | Primary control plane for policy, linking, status          | Sortable/filterable list | Per-gate: status, link, extension, rules, fuel, revenue |
| **Trade Posts** | Storefront management — listings, inventory, revenue       | SSU list → detail        | Per-SSU: status, listings, revenue, extension status   |
| **Signal Feed** | Real-time event feed aggregating all operations            | Chronological stream     | Event count by type (24h), revenue total               |
| **Configuration** | Account, labels, spatial mappings, tags                  | Form-based panels        | Connected wallet, Character ID, label/pin counts       |

### Sidebar Structure Inventory (Below Primary Nav)

Collapsible structure list grouped by type, always visible:

```
── Gates (6)
   ├── Gate North-1      ● Online
   ├── Gate North-3      ● Online
   ├── Gate South-1      ◐ Low Fuel
   └── + 3 more...
── TradePosts (2)
   ├── Echo Depot        ● Online
   └── Forward Supply    ○ Offline
── Network Nodes (3)
   ├── NWN-Alpha         ● Online
   └── + 2 more...
```

Status indicators: green (online), amber (low fuel/warning), red (offline), gray (unlinked/unconfigured). Clicking any structure navigates to its detail view.

---

## 4. Gate List Layout

The gate list is the most important screen — every gate is a policy enforcement point, revenue generator, and network topology node.

### Columns

| Column         | Display Format                           | Notes                                     |
| -------------- | ---------------------------------------- | ----------------------------------------- |
| **Status**        | Color dot (●/○)                          | Green = online, red = offline, gray = unanchored |
| **Name**          | User-assigned label (editable inline)    | Default: truncated object ID              |
| **ID**            | `0x1a2b...9f0e` (first 8 + last 4)      | Copy-to-clipboard on click                |
| **Link Partner**  | Partner gate name or "Unlinked" badge    | Muted badge if unlinked                   |
| **Extension**     | Badge: "GateControl" / "None"            | Blue = active, gray = none                |
| **Rules**         | Compact tags: "Tribe + Toll"             | Or "No rules"                             |
| **Fuel Source**   | Icon + text                              | "● Fueled" / "◐ Low" / "○ Offline"       |
| **Revenue**       | "42 EVE"                                 | Configurable period (24h default)         |
| **Tags**          | Colored pill badges                      | User-assigned grouping                    |

### Search & Filter

| Filter         | Type             | Options                                    |
| -------------- | ---------------- | ------------------------------------------ |
| **Status**        | Toggle chips     | Online · Offline · All                     |
| **Extension**     | Dropdown         | GateControl · None · Any                   |
| **Link State**    | Toggle chips     | Linked · Unlinked · All                    |
| **Tags**          | Multi-select     | User-defined tags                          |
| **Fuel Status**   | Toggle chips     | Healthy · Low · Critical · All             |
| **Free Text**     | Text input       | Name, ID, tag, partner name (partial match) |

Filters compose as AND. Active filter count shown as badge.

### Sort Options

| Sort Field            | Default Direction |
| --------------------- | ----------------- |
| **Name**                 | A → Z             |
| **Status**               | Offline first (surface problems) |
| **Fuel Level**           | Lowest first       |
| **Revenue**              | Highest first      |
| **Recently Modified**    | Newest first       |

Default sort: **Status (offline first)** — surface problems immediately.

### Tagging System

- User-created, color-coded text labels (e.g., "North Corridor", "Revenue Gates")
- Multiple tags per gate; created inline or managed in Configuration
- Stored in app storage (not on-chain); serve as filter criteria and visual grouping

### Empty State

**Heading:** "No Gates Found"  
**Body:** "CivilizationControl manages gates you own in EVE Frontier. Gates are assigned to your Character by the game server — once you have gates in-game, they'll appear here automatically."  
**Secondary:** "If you own gates but don't see them, check that your wallet is connected to the correct Character in Configuration."

No "Create Gate" action — gate creation requires AdminCap (server-side, not player-accessible).

---

## 5. Gate Detail Layout

Single-page layout with vertically stacked, independently collapsible sections.

### 5a. Overview (Header)

| Field            | Display                    | Editable? | Source          |
| ---------------- | -------------------------- | --------- | --------------- |
| **Gate Name**       | Large heading + pencil icon | Yes (app storage) | User-assigned label |
| **Object ID**       | Monospaced, full hex + copy | No        | On-chain        |
| **Status**          | Color badge: "● Online"    | Via toggle | On-chain        |
| **Extension Type**  | Badge: "GateControl"       | Via authorize | On-chain     |
| **Link Partner**    | Partner name/ID or "Unlinked" | Via link/unlink | On-chain  |
| **Energy Source**   | NWN name + fuel status     | No        | On-chain (NWN read) |
| **Tags**            | Editable tag pills          | Yes (app storage) | User-assigned |

**Quick Actions (inline):**
- Online/Offline Toggle → PTB: `borrow_owner_cap<Gate>` → `gate::online/offline` → `return_owner_cap`
- Link/Unlink → opens Linking Flow (§7)

### 5b. Access Rules Section

- **Extension status banner:** "GateControl Active" (blue) or "No Extension — gate is open to all jumpers" (gray)
- **Active rules list:** each rule module displayed as a card (see §6 Rule Composer)
- **Rule summary sentence:** auto-generated: "Jumpers must: belong to Tribe 7 AND pay 5 EVE toll"
- **Configure Rules button** → opens Rule Composer panel

**Extension compatibility banner (when linked):**
> "Both gates in a link must have the same extension type. Partner gate (**Gate South-1**) currently has: **GateControl** ✓"

Or warning:
> "⚠️ Partner gate (**Gate South-1**) has a different extension type (**None**). Jump permits will not work until both gates match."

### 5c. Economic Rules Section

| Element           | Content                                           |
| ----------------- | ------------------------------------------------- |
| **Toll Config**      | "Toll: 5 EVE per jump" or "No toll"              |
| **Treasury Address** | Truncated address where toll payments route       |
| **Total Revenue**    | "487 EVE all-time" (dual-display: "4,870,000 Lux") |
| **Period Revenue**   | "42 EVE last 24h"                                |
| **Jump Count**       | "94 jumps (last 24h) · 1,247 all-time"            |
| **Configure Toll**   | → opens Rule Composer economic module             |

**Currency display convention:** **EVE** is primary in demo narration and proof overlays. **Lux** (10,000 Lux = 1 EVE) is the player-facing in-game denomination. Dual-display (EVE + Lux) is valid in dashboard/detail contexts. On-chain settlement uses `Coin<SUI>` for Day-1; conversion to `Coin<EVE>` is stretch.

### 5d. Linking Section

| State       | Display                                      | Actions                          |
| ----------- | -------------------------------------------- | -------------------------------- |
| **Linked**     | Partner name, ID, status, extension match    | "Unlink" → `unlink_gates` PTB   |
| **Unlinked**   | "This gate is not linked to a partner"       | "Link Gate" → Linking Flow (§7) |

When linked, shows: partner extension match status, partner online status, bidirectional link note.

### 5e. Signals Section

Gate-scoped event stream. Event types:

| Event Type          | Example Display                                          |
| ------------------- | -------------------------------------------------------- |
| **Jump**               | "14:23 · Pilot-0x3f2a (Tribe 7) · North→South · Toll: 5 EVE" |
| **Rule Application**   | "14:22 · Pilot-0x7b1c (Tribe 3) · Tribe Filter · BLOCKED"    |
| **Toll Collection**    | "14:23 · 5 EVE from Pilot-0x3f2a"                           |
| **Status Change**      | "09:00 · Offline → Online · You"                              |
| **Extension Change**   | "08:55 · None → GateControl"                                  |
| **Link Change**        | "08:50 · Linked to Gate South-1" (on-chain: `GateLinkedEvent` / `GateUnlinkedEvent`) |

Time range selector: 1h · 24h · 7d · 30d · All. Auto-refresh: polling every 10 seconds.

### 5f. Spatial Assignment Section

| State          | Display                                          | Actions                        |
| -------------- | ------------------------------------------------ | ------------------------------ |
| **Assigned**      | "📍 Assigned to: **Jita** (operator-curated)"       | "Change System" / "Clear"      |
| **Unassigned**    | "No system assigned"                              | "Assign to System" button      |

**Always-visible disclosure (muted):** "Operator-curated placement — not derived from on-chain data."

---

## 6. Rule Composer Model

### Design Principles

1. **No visual programming.** No node graphs, no flow charts, no drag-and-drop logic.
2. **Opinionated modules only.** Each rule is predefined with 1-3 configuration fields.
3. **Dropdown + toggle interface.** Every rule toggles on/off and configures via dropdowns, number inputs, or address lists.
4. **Composable AND logic.** Multiple active modules compose as AND — all must pass for permit issuance.
5. **Preview before deploy.** Human-readable summary of the complete stack before signing.

### Available Modules

#### Tribe Filter (Access Rule)

| Property     | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **Purpose**     | Restrict gate access to members of a specific tribe                    |
| **Toggle**      | On / Off                                                               |
| **Config**      | **Allowed Tribe ID**: Dropdown / numeric input (u32)                   |
| **Status**      | "Tribe Filter: Allow Tribe 7 only" or "Tribe Filter: Off"             |
| **On-Chain**    | Dynamic field `TribeRuleKey → TribeRule { tribe_id }` on GateConfig |

#### Coin Toll (Economic Rule)

| Property     | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **Purpose**     | Require payment for each gate jump                                     |
| **Toggle**      | On / Off                                                               |
| **Config**      | **Toll Amount**: Numeric input in EVE (Lux equivalent shown). **Treasury**: Auto-filled with connected wallet; editable (advanced). |
| **Status**      | "Coin Toll: 5 EVE per jump → Treasury: 0x1a2b...9f0e"               |
| **On-Chain**    | Dynamic field `CoinTollKey → CoinTollRule { price_mist, treasury }` |

#### Allow List (Access Rule)

| Property     | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **Purpose**     | Explicitly allow specific wallet addresses                             |
| **Toggle**      | On / Off                                                               |
| **Config**      | **Allowed Addresses**: Address list editor (add/remove Sui addresses)  |
| **Status**      | "Allow List: 12 addresses" or "Allow List: Off"                        |
| **On-Chain**    | Dynamic field `AllowListKey → AllowList { addresses: Table<address, bool> }` |

#### Block List (Access Rule)

| Property     | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **Purpose**     | Explicitly block specific wallet addresses                             |
| **Toggle**      | On / Off                                                               |
| **Config**      | **Blocked Addresses**: Address list editor (add/remove)                |
| **Status**      | "Block List: 5 addresses blocked" or "Block List: Off"                 |
| **Precedence**  | Always evaluates first; block cannot be overridden by other rules      |

#### ZK Membership (Access Rule — Stretch)

| Property     | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| **Purpose**     | Require Groth16 ZK proof of membership without revealing identity      |
| **Toggle**      | On / Off                                                               |
| **Config**      | **Membership Root**: Auto-computed Poseidon hash. **Member List**: Upload/edit (stored off-chain; only root goes on-chain). |
| **Status**      | "ZK Membership: Active (root: 0x3f2a...)" or "Off"                   |

### Module Card Layout (Universal Pattern)

```
┌─────────────────────────────────────────────────┐
│  [Toggle Switch]  Tribe Filter         [Status] │
│─────────────────────────────────────────────────│
│  Allowed Tribe ID:  [ 7        ▼ ]             │
│                                                  │
│  Status: ● Active — "Allow Tribe 7 only"       │
│  Last deployed: 2026-02-15 14:23                │
└─────────────────────────────────────────────────┘
```

Status states:
- **● Active** (green) — rule on and deployed on-chain
- **◐ Configured (not deployed)** (amber) — configured locally, changes not yet deployed
- **○ Off** (gray) — rule toggled off

### Composition Logic (Fixed Order)

```
Jump Permit Evaluation:
  1. Block List   → if blocked, DENY (no override possible)
  2. Allow List   → if on list, SKIP tribe check
  3. Tribe Filter → if tribe mismatch, DENY
  4. ZK Membership → if proof invalid, DENY
  5. Coin Toll    → if payment insufficient, DENY
  6. All passed   → issue_jump_permit<GateAuth>(...)
```

Evaluation order is fixed and opinionated. Users do not arrange or reorder rules.

### Deployment Flow

| Step | Action                                                                          |
| ---- | ------------------------------------------------------------------------------- |
| 1    | Configure modules — toggle on/off, set values                                  |
| 2    | **Rule stack preview** — "Active Policy: Tribe 7 only + 5 EVE toll"            |
| 3    | **Diff display** (if modifying) — "Toll: 2 → 5 EVE. Tribe filter unchanged."  |
| 4    | **"Deploy Policy"** → constructs PTB (borrow OwnerCap → set dynamic fields → return OwnerCap) |
| 5    | Wallet signature prompt                                                         |
| 6    | Confirmation — "Policy deployed ✓"                                              |
| 7    | Status indicators update: "Configured" → "Active"                               |

---

## 7. Linking Flow

### Step-by-Step

| Step | Screen                          | Action / System Behavior                                    |
| ---- | ------------------------------- | ----------------------------------------------------------- |
| 1    | Gate list or detail             | User selects source gate, clicks "Link Gate"                 |
| 2    | Source confirmation             | Panel header: "Linking: [Gate North-1]"                      |
| 3    | **Target selector**             | Searchable list: own unlinked gates. Shows name, status, extension type, system (if pinned) |
| 4    | Target filtering                | Search by name/ID, filter by tag/system                      |
| 5    | Target selection                | User clicks target gate                                      |
| 6    | Spatial preview *(conditional)* | If both pinned: "Linking Gate North-1 (Jita) ↔ Gate South-1 (Amarr)" |
| 7    | **Pre-flight checks**           | Validates: neither already linked, both owned. Displays ✓/✗  |
| 8    | **Distance proof request**      | "Requesting distance proof from server..." loading state     |
| 9    | Proof received                  | "Distance proof verified ✓ — distance: [X]"                 |
| 10   | PTB preview                     | "Ready to link" checklist + PTB details                      |
| 11   | Wallet signature                | User signs PTB                                                |
| 12   | **Confirmation**                | "Gates linked successfully ✓" + tx digest link               |

### Error States

| Error                    | Message                                                     | Recovery                    |
| ------------------------ | ----------------------------------------------------------- | --------------------------- |
| Already linked           | "Gate is already linked to another gate"                     | Select different target     |
| Extension mismatch       | "⚠️ Extension types differ — permits won't work until matched" | Warning only (allow link)   |
| Distance exceeds max     | "Gates too far apart (distance: X, max: Y)"                 | Select closer target        |
| Proof request failed     | "Could not obtain proof — try again later"                   | Retry button                |
| Proof expired            | "Proof expired — requesting fresh proof..."                  | Auto-retry                  |
| Transaction failed       | "Transaction failed: [code]"                                 | Retry / check preconditions |
| Both OwnerCaps not held  | "You must own both gates to link them"                       | Cannot proceed              |

### Constraints

- `link_gates` requires OwnerCaps for **both** gates — same-owner or multi-party coordination
- `link_gates` requires **AdminACL sponsor** — the transaction must be sponsored by an address in `AdminACL.authorized_sponsors` (or sent by a sender in AdminACL). This is a server-dependent operation.
- Distance proof is server-signed and ephemeral (has expiry)
- Route hash is direction-agnostic: A↔B is the same link
- **Unlinking is simpler:** `unlink_gates` — no server proof needed, but still requires both OwnerCaps

---

## 8. Manual Pinning Model

> **2026-03-10 update:** `LocationRegistry` now stores plain-text coordinates on-chain for all assembly types. Manual pinning becomes a fallback/override instead of the only option. Auto-placement from `LocationRegistry` data is feasible for structures whose owners have called `reveal_location()`. The flow below still applies for structures without on-chain coordinates.

### Purpose

Users manually assign structures to solar systems for visual organization and grouping. ~~Explicitly user-curated — not chain-derived.~~ Works on day one regardless of CCP API availability. **2026-03-10:** Now supplementary to `LocationRegistry` auto-placement.

### Flow

| Step | Action                                                               |
| ---- | -------------------------------------------------------------------- |
| 1    | User selects gate/SSU/NWN from list or detail view                   |
| 2    | Opens "Assign to System" in Spatial Assignment section               |
| 3    | **System selector**: searchable dropdown with solar system names      |
| 4    | User types partial name (e.g., "Jit") → dropdown filters to matches  |
| 5    | User selects system from filtered list                                |
| 6    | Confirmation: "Assign [Gate North-1] to [Jita]?"                     |
| 7    | Saved to app storage (localStorage keyed by object ID)                |
| 8    | Structure now shows "📍 Jita" in list and spatial views               |
| 9    | Change/clear available at any time                                    |

### Data Model

```typescript
interface SpatialPin {
  objectId: string;           // Sui object ID
  structureType: 'gate' | 'ssu' | 'nwn';
  systemName: string;         // e.g., "Jita"
  systemId?: string;          // optional game system identifier
  pinnedAt: number;           // timestamp
  pinnedBy: string;           // wallet address
}
```

### UI Labels & Disclosures

- Pinned structures display 📍 icon to distinguish user-curated from (future) auto-placement
- Always-visible: **"Operator-curated placement — not derived from on-chain data"** *(Review: positions may now be LocationRegistry-sourced)*
- Future-ready note (tooltip): ~~"If CCP exposes a coordinate API, automatic placement will replace manual pins"~~ **2026-03-10:** `LocationRegistry` now provides coordinates. Auto-placement is available for revealed structures.

### Solar System Dataset

- **Source:** Static JSON bundled with the app (EVE Frontier public solar system names)
- **Search:** Client-side fuzzy search (no backend required)
- **Extensibility (stretch):** User can add custom system names

---

## 9. Spatial Layer Model (Resolved — Hybrid Architecture)

> **Decision status: RESOLVED** — Hybrid Spatial Architecture formally adopted 2026-02-19. Full rationale and capability inventory: [Spatial Embed Requirements](../architecture/spatial-embed-requirements.md). Decision log entry: [2026-02-19 — Hybrid Spatial Architecture](../decision-log.md).

CivilizationControl uses **two complementary spatial layers**, each assigned to its natural strength. Neither is required for any governance or commerce action — the list view remains the primary navigation surface.

### 9a. Strategic Network Map (CivControl-native SVG)

**Role:** Primary operational spatial surface. Displays governance topology with real-time state encoding.

**Characteristics:**

- **Rendering:** React SVG component (~150–200 LoC). Nodes represent systems or structures; edges represent gate links.
- **Data source:** Manual spatial pins (§8) provide system-level positions. On-chain state provides structure status, policy, links, fuel. **2026-03-10:** `LocationRegistry` can now supplement/replace manual pins for revealed structures.
- **State encoding:** Node color/border reflects online/offline/warning. Edge styling encodes link status (active, degraded, unlinked). Optional badges for policy type, revenue, fuel.
- **Interactivity:** Click node → navigate to structure detail. Hover → tooltip with status summary. Expandable to occupy primary screen space.
- **Reactivity:** Standard React state propagation. Structure state changes reflected immediately.
- **Disclaimer:** Always visible: "User-curated placement; not on-chain."

**What It Is NOT:**

- Not a real-time position tracker (manual pins, not coordinates) *(Review: LocationRegistry now provides coordinates)*
- Not derived from chain data (positions are user-curated; only _state_ is on-chain) *(Review: positions CAN now be chain-derived via LocationRegistry)*
- Not the primary navigation surface (the list is)

**Representation Options:** Three approaches identified (system-level nodes with badges, expandable per-system clusters, lens-based toggling). To be finalized during build phase. See [Spatial Embed Requirements — Representation Options](../architecture/spatial-embed-requirements.md).

### 9b. Cosmic Context Map (EF-Map Embed iframe)

**Role:** Secondary orientational layer. Grounds the governance view in the EVE Frontier universe.

**Characteristics:**

- **Rendering:** EF-Map embed iframe (~10 LoC). URL parameters: `systems` (cyan highlight rings on operator systems), `zoom`, `orbit` (cinematic rotation), `color` (theme).
- **Colored link lines:** EF-Map embed will support drawing colored lines between linked systems (feature being added by EF-Map maintainer). This provides universe-scale visual link representation that complements the SVG topology's operational link lines.
- **Interactivity:** Read-only inside CivilizationControl. No click event propagation, no custom markers, no runtime state updates. Reload-based parameter updates only.
- **Position:** Collapsible panel or secondary tab. Not the primary surface.
- **Non-blocking:** If ef-map.com is unavailable, CivControl topology still functions.

### Stretch Enhancements

- Drag-to-reposition nodes within the Strategic Network Map
- Zoom/pan across system regions in the Strategic Network Map
- Link-line styling (color by status, thickness by revenue) in the Strategic Network Map
- Sync EF-Map `systems` parameter from manual pin data (auto-highlight pinned systems)
- Deep-link from Strategic Network Map node → EF-Map centered on that system

### Upgrade Path

> **2026-03-10:** The coordinate API trigger below is now substantively resolved by `LocationRegistry`. Coordinates are available on-chain for structures whose owners call `reveal_location()`.

If CCP exposes a coordinate API:
- Manual pins replaced with real positions in the Strategic Network Map
- Strategic Network Map promoted from supplementary overlay to first-class tab
- "User-curated" disclaimer removed for API-sourced positions
- EF-Map embed role unchanged (cosmic context remains secondary)
- All other UX structures unchanged

---

## 10. Wallet Integration & Authentication Flow

CivilizationControl requires wallet connection for all write operations. This section defines the connection lifecycle, Character resolution, sponsor verification, and failure handling that gate the user into the operational dashboard.

> **In-game wallet constraint (2026-02-28):** The in-game embedded browser has NO Sui Wallet Standard provider — only an EVM wallet (EIP-6963 "EVE Frontier Wallet"). In-game users operate in **read-only mode** by default. Write operations require either (a) a Sui wallet in an external browser, or (b) a future EVE Vault relay bridge (unconfirmed). The DApp must detect in-game vs external browser context and adapt accordingly. See [In-Game DApp Browser Surface](../architecture/in-game-dapp-surface.md) §4.

### 10a. Connect Wallet (EVE Vault)

**Button placement:** Top-right of global header, persistent across all screens.

**Connection states:**

| State | Display | Behavior |
|-------|---------|----------|
| **In-Game (Read-Only)** | "Viewing Mode" badge + "Open in Browser" link | Detected automatically: EVM wallet present, 0 Sui wallets. Full data display, no write operations. |
| **Not Connected** | "Connect Wallet" button (outlined, prominent) | Click opens EVE Vault connection dialog |
| **Connecting** | "Connecting..." with spinner | Auto-resolves or times out (10s) |
| **Connected** | Truncated address + green dot (e.g., `0x1a2b...9f0e ●`) | Click reveals dropdown: Character info, network, disconnect |
| **Wrong Network** | Address + amber "Wrong Network" badge | Click reveals network switch instructions |
| **Extension Missing** | "Install EVE Vault" link (styled as button) | Opens EVE Vault installation page |

**Session behavior:**
- Connection persists across page reloads via session storage
- Wallet disconnect clears all cached structure data and returns to "Not Connected" state
- Address change (wallet switch) triggers full Character re-resolution

**Pre-connect state:** Command Overview shows app branding and a centered "Connect Wallet to Begin" prompt. No structure data loads until wallet is connected and Character is resolved.

### 10b. Character Resolution

After wallet connection, the app resolves the player's Character from their wallet address. Character is a **shared object** on-chain — it cannot be discovered via `suix_getOwnedObjects` on the wallet address. Resolution requires off-chain context.

**Resolution sequence:**

| Step | Action | Success | Failure |
|------|--------|---------|---------|
| 1 | Wallet connects → wallet address captured | Proceed to step 2 | — |
| 2 | Attempt automatic resolution (event index or game server API) | Character ID obtained → step 4 | Service unavailable → step 3 |
| 3 | **Manual fallback:** "Enter your Character ID" input field | User provides Character ID → step 4 | — |
| 4 | RPC lookup: verify Character object exists | Character found → step 5 | "No Character found for this ID" |
| 5 | Verify `character_address == connected wallet` | Match confirmed → step 6 | "This Character belongs to a different wallet" |
| 6 | Enumerate OwnerCaps via Character ID → load structures | Structures populate | Empty state (no structures owned) |

**Error states:**

| Error | Message | Recovery |
|-------|---------|----------|
| Character not found | "No Character found. Verify your Character ID or check your in-game account." | Re-enter ID, switch wallet |
| Invalid format | "Invalid Character ID format — must be a Sui object ID (0x...)" | Re-enter |
| Wallet mismatch | "This Character is controlled by a different wallet address." | Connect the correct wallet |
| Resolution service unavailable | "Automatic lookup unavailable. Enter your Character ID manually." | Manual input appears |

**MVP concession:** Manual Character ID input is required until a wallet→Character mapping API is available. See [Upgrade Path Trigger 1 (§12)](#12-design-principles--upgrade-path) for the automatic resolution upgrade.

### 10c. Sponsor Verification

After Character resolution, the app checks whether gas sponsorship is available for operations that require it (fuel deposit, jump).

| Check | Method | Failure Display |
|-------|--------|-----------------|
| Sponsor address known | App configuration | Warning banner: "Sponsorship not configured — some operations require manual gas payment" |
| Sponsor in AdminACL | On-chain read of AdminACL table | Error banner: "Sponsor not authorized in access control list" |
| Sponsor not same as player | Structural note | *(Correction 2026-03-04: self-sponsorship does NOT silently fail. `verify_sponsor` falls back to `ctx.sender()` when no distinct sponsor is present — validated on localnet 2026-02-28. Enforced by app if distinct sponsor address is desired.)* |

**Degradation behavior:** When sponsorship is unavailable, all read and player-signed operations remain functional. Actions requiring sponsorship (fuel deposit, jump) display as "Unavailable — gas sponsorship required" with a tooltip explaining the constraint. The dashboard does not block or hide — it degrades gracefully per [Design Principle 7 (§12)](#12-design-principles--upgrade-path).

### 10d. Permission Surface (User-Facing)

The UI surfaces permission boundaries so users understand what they can do at their current connectivity level.

| Permission Level | Requirements | Actions Available |
|-----------------|-------------|-------------------|
| **In-Game (View-Only)** | In-game browser detected (EVM wallet, no Sui) | View all structure state, events, revenue. "Open in Browser" CTA for write operations. |
| **Read-only** | Sui RPC only (no wallet) | View structure state, event history, fuel levels, link topology |
| **Player actions** | Connected wallet + Character resolved | Online/offline toggle, authorize extension, unlink gates, deploy policy, create/remove listings |
| **Server-dependent actions** | Connected wallet + CCP server reachable | Link gates (distance proof) |
| **Sponsored actions** | Connected wallet + authorized sponsor | Jump, fuel deposit/withdraw, SSU item deposit/withdraw (owner-path) |

**UI treatment:**
- Unavailable actions show disabled buttons with tooltip explaining the missing requirement
- The Configuration panel displays current permission level as a summary: "Connected · Character resolved · Sponsor active" (or partial states)
- Admin-only operations (AdminCap) are never shown in the UI under any circumstance

### 10e. Failure States Summary

| Failure | Severity | UI Treatment | Recovery Path |
|---------|----------|-------------|---------------|
| Wallet extension not installed | Blocking | Full-page overlay with install link | Install EVE Vault, refresh |
| Wrong Sui network | Blocking | Persistent amber banner below header | Switch network in wallet |
| No Character found | Blocking (write ops) | Post-connect modal with manual input | Enter Character ID manually |
| Character/wallet mismatch | Blocking | Error in resolution flow | Connect correct wallet |
| Sponsor not authorized | Partial | Inline warning on affected actions | Contact administrator |
| Server unreachable | Partial | Inline warning on proof-dependent actions | Retry; non-proof actions unaffected |
| Transaction rejected by wallet | Transient | Toast notification | Review and retry |
| Transaction failed on-chain | Transient | Error card with tx digest link | Diagnose via explorer; retry |
| In-game browser (no Sui wallet) | Expected | "Viewing Mode" badge, full read access, "Open in Browser" for writes | Open DApp in external browser with EVE Vault |

---

## 11. MVP vs Stretch Table

### MVP Features (25 items — demo-strong minimum)

| # | Feature | Justification |
|---|---------|---------------|
| 1 | Gate list view | Core navigation surface — the dashboard IS the product |
| 2 | Gate detail (overview, rules, linking) | Drill-down for policy config; demo centerpiece |
| 3 | Online/offline toggle | Devnet-validated; visually dramatic 1-click status change |
| 4 | Extension authorization | Core thesis: gate → governed infrastructure |
| 5 | Structure labeling | 64-char hex IDs are unusable; labels make the list comprehensible |
| 6 | Tribe filter rule | Devnet-validated; "allies pass, hostiles blocked" headline moment |
| 7 | Coin toll rule | Devnet-validated; economic narrative cornerstone |
| 8 | Rule stack preview | Visual feedback for deployed rules; essential UX |
| 9 | Deploy policy (PTB + sign) | Makes on-chain changes real; not a mockup |
| 10 | Unlink gates | Player-callable; demonstrates governance over topology |
| 11 | SSU list view | Core TradePost navigation |
| 12 | SSU detail view | Core TradePost information display |
| 13 | Inventory browser | Prerequisite for listing creation |
| 14 | Create listing | Core CRUD; "stock your storefront" moment |
| 15 | Remove listing | Minimum CRUD lifecycle |
| 16 | Buyer-facing listing browser | Half the TradePost demo |
| 17 | Aggregated metrics (Command Overview) | "Control room" opening shot — big numbers |
| 18 | Alert/warning cards | Amber/red indicators; visual drama for fuel/offline |
| 19 | Fuel status overview | Fuel depletion is the opening pain point in demo script |
| 20 | Real-time event stream | Core non-negotiable per strategy memo; "living control room" |
| 21 | Toll revenue display (basic) | Inline in feed/gate detail; closes economic narrative |
| 22 | Trade revenue display (basic) | Inline in feed/SSU detail; closes commerce narrative |
| 23 | Command Overview view | Landing page; no-click summary of infrastructure health |
| 24 | Signal Feed (basic, unfiltered) | Chronological event stream across all structures |
| 25 | Manual system assignment | Spatial organization — user-curated system pinning enables structure grouping by solar system |
| 26 | Portrait-responsive layout | In-game browser viewport is 787×1198 portrait; not polish — deployment surface requirement for "Best Live Frontier Integration" bonus |
| 27 | In-game read-only detection | Auto-detect in-game browser (EVM wallet, no Sui); display "Viewing Mode" badge; required for in-game deployment |

### Stretch Features (31 items)

| # | Feature | Justification |
|---|---------|---------------|
| 1 | Extension replacement | Edge case; low demo impact |
| 2 | Search/filter in gate list | Polish; demo dataset is small |
| 3 | Sort options in gate list | Polish; low demo impact |
| 4 | Bulk operations (batch online/offline) | Complex multi-object PTB; high implementation cost |
| 5 | ZK membership rule toggle | **Stretch Priority 1** — all primitives validated but integration untested |
| 6 | Allow list editor | Unvalidated additional rule type |
| 7 | Block list editor | Mirror of allow list; not core |
| 8 | Multi-gate policy deployment | Batch PTB complexity; impressive but not defining |
| 9 | Link gates (with distance proof) | Requires server-side proof generation; uncertain capability |
| 10 | Link target selection | Cascading dependency on link gates |
| 11 | Link topology view | Visualization polish |
| 12 | Visual link lines on map | **Resolved**: Hybrid Spatial Architecture adopted (Strategic Network Map + EF-Map embed). SVG topology draws link lines from manual pin data. EF-Map embed draws colored link lines between system highlights. See §9. |
| 13 | Edit listing | Create + remove suffices for demo |
| 14 | Trade history | Requires event aggregation/persistence |
| 15 | Revenue analytics | Charting library; polish |
| 16 | Visual system map overlay | **Resolved**: Strategic Network Map (SVG) uses manual pins for system-level placement. EF-Map embed provides cosmic context. See §9. |
| 17 | Link-line visualization on map | **Resolved**: Same as #12. SVG topology link lines + EF-Map colored link lines. See §9. |
| 18 | Drag-to-reposition nodes | Depends on map |
| 19 | Grouping/tagging | Data model complexity; no demo payoff |
| 20 | Multi-gate network view | Graph layout engine needed |
| 21 | Map layer toggle | Depends on having map layers |
| 22 | Quick action shortcuts (dashboard) | UX convenience; demo walks modules explicitly |
| 23 | Revenue overview (dashboard card) | `suix_queryEvents` polling + client-side aggregation sufficient for single-operator demo; indexer only needed for multi-user Stillness deployment |
| 24 | Event type filtering | Polish for activity feed |
| 25 | Structure-specific filtering | Polish for activity feed |
| 26 | Time range filtering | Polish for activity feed |
| 27 | Structure label manager (configuration) | Inline renaming suffices |
| 28 | Spatial mappings manager | Maps are stretch |
| 29 | Group/tag manager | Tags are stretch |
| 30 | Account info display | Wallet visible in header |
| 31 | Dual-currency display (EVE + Lux) | EVE primary, Lux secondary; raw SUI fallback for Day-1 |
| 32 | EVE Vault in-game relay | postMessage bridge for Sui signing from in-game browser; unconfirmed feasibility |

### Demo Scenario — 3-Minute Script (MVP Only)

**Pre-deployed state:** 2 linked gates, 1 SSU, 1 NWN (fueled), 3 characters (2× Tribe Alpha, 1× Tribe Beta), 5 test items, 50 SUI. Labels pre-assigned.

| Time | Act | Content |
|------|-----|---------|
| 0:00–0:25 | **"The Problem"** | Raw CLI terminal, manual `sui client call` commands, error output. "You're flying blind." |
| 0:25–0:45 | **"The Control Room"** | Command Overview loads — structure list, 4 structures, status indicators, amber fuel warning. "One screen. Every gate. Live status." |
| 0:45–1:20 | **"Control" (GateControl)** | Click Gate Alpha → authorize extension → configure tribe filter (Tribe Alpha) + toll (2 SUI) → deploy policy → sign. Friendly pilot jumps (✓). Hostile pilot blocked (✗). "On-chain enforcement. No appeals." |
| 1:20–2:00 | **"Commerce" (TradePost)** | Click SSU → create listing (Fuel Rod: 10 SUI) → buyer browses → buys → atomic settlement. "One click. Atomic settlement. No counterparty risk." |
| 2:00–2:30 | **"The System"** | Full Command Overview. Signal Feed scrolling. Toll: 2 SUI. Trade: 10 SUI. "The pilot who paid the toll is now your customer. Your infrastructure pays for itself." |
| 2:30–3:00 | **"The Vision"** | Wide shot. "The control plane the frontier doesn't have yet. Gate governance and frontier commerce — integrated, composable, accessible." **"Your gates. Your rules. Your revenue."** |

### MVP Risk Flags

| MVP Feature | Risk | Mitigation |
|---|---|---|
| **Deploy policy** (PTB) | Medium — wallet adapter integration untested in browser | Validate wallet signing Day 1. Fallback: CLI-triggered with UI showing result. |
| **Real-time event stream** | Medium — `suix_subscribeEvent` availability uncertain on all endpoints | MVP default: polling 3-5s. WebSocket is stretch. |
| **Buyer-facing listing browser** | Low-Medium — cross-address atomic buy PTB via SDK untested | Validate SDK PTB construction Day 3. Flow is proven; SDK wrapper is the risk. |
| **Extension authorization** | Low-Medium — type mismatches fail silently | Validated on devnet via CLI; web needs testing. |
| **In-game portrait layout** | Low-Medium — confirmed viewport (787×1198) but untested with CivControl UI | Validate on simulated viewport Day 1. Card layouts degrade gracefully. |
| **No Sui wallet in-game** | Low (by design) — read-only mode is acceptable in-game | Read-only is the planned in-game experience. External browser for writes. |

**Systemic risk:** Wallet adapter integration. Every write operation goes through browser wallet. If EVE Vault or Sui wallet adapter has PTB compatibility issues, all writes are blocked. **Validate wallet signing of a simple PTB on Day 1 before building any UI.**

---

## 12. Design Principles & Upgrade Path

### Design Principles

#### 1. List-First Control Plane

The primary interface is a structured list of owned structures, not a map. All governance actions are accessible from the list. A map is optional overlay, never primary navigation.

**Example:** A tribe leader sees six gates listed with status indicators. They click Gate North-3, open the policy panel, toggle a tribe filter, and set a toll — never needing spatial coordinates.

**Why:** ~~Structure coordinates are not on-chain (Poseidon2 hash only).~~ **2026-03-10:** `LocationRegistry` now stores coordinates on-chain. List-first remains the design choice for governance clarity, not due to data unavailability. Building a map-first UI on data that doesn't exist would require unconfirmed external API dependencies.

#### 2. Manual Spatial Augmentation

Users optionally assign structures to solar systems for visual organization. Explicitly user-curated, not chain-derived. The UI labels spatial data as "user-assigned positions" to prevent players from mistaking curated labels for authoritative coordinates.

**Example:** A tribe leader pins Gate North-3 to "Epsilon Eridani." A subtle "(user-placed)" badge distinguishes it from future auto-placement. If never pinned, the structure appears in an "Unplaced" group — fully functional.

#### 3. Opinionated Rule Blocks

Policy configuration uses predefined, dropdown-based rule modules with bounded configuration surfaces. No visual programming canvas, no arbitrary logic builder, no raw Move code input.

**Example:** The policy panel shows two cards: "Tribe Filter" (dropdown: Tribe 7) and "Toll" (slider: 5 EVE). Adding or removing a rule is a single click. Dynamic field dispatch is invisible.

**Why:** Move's type system and dynamic fields are powerful but require developer-level understanding. Opinionated blocks constrain configuration to validated, tested, safe-to-compose patterns.

#### 4. Progressive Disclosure

Complexity surfaces in calibrated layers:

| Level | Content | User |
|-------|---------|------|
| **Level 1** | Dashboard glance — status indicators, aggregate counters | Non-technical tribe leader |
| **Level 2** | Structure detail — extension, link, fuel, ownership, policy summary | Operational user |
| **Level 3** | Rule composer — tribe filter, toll slider, allow/block list | Power user |
| **Level 4** | ZK config, raw tx inspection, event log filtering, diagnostics | Advanced/developer |

#### 5. Server-Proof Abstraction

Operations requiring server computation (distance proofs for gate linking) or AdminACL sponsorship (SSU item transfer, jump) are presented as single-step actions. The user clicks "Link Gates" and sees a result — never "Step 1: Request proof, Step 2: Verify signature, Step 3: Submit transaction."

**Example:** User selects two gates, clicks "Link," sees "Linking..." → "Linked ✓." Behind the scenes: coordinate computation, Ed25519 attestation, PTB construction, submission — all invisible.

#### 6. Dual-Currency Display

Economic values use a dual-display model: **EVE** is the on-chain denomination shown in demo narration, proof overlays, and as the primary value in dashboards (e.g., "Toll: 5 EVE"). **Lux** (10,000 Lux = 1 EVE) is the in-game player-facing denomination shown as a secondary value where context allows (e.g., "5 EVE · 50,000 Lux"). On-chain settlement uses `Coin<SUI>` for Day-1.

**Why:** Players price things in Lux; the chain settles in SUI. EVE bridges both worlds — meaningful to players and verifiable on-chain. Dual-display keeps the frontier metaphor intact without hiding the governance layer.

#### 7. Graceful Degradation

The dashboard works at every connectivity level:

| Service Available       | Capabilities                                              |
| ----------------------- | --------------------------------------------------------- |
| Sui RPC only            | Read structure state, event history, fuel levels, links   |
| + Wallet connected      | + policy changes, toll config, online/offline, unlink     |
| + CC server online      | + gate linking (distance proof), inventory operations     |
| + Sponsorship active    | + gas-free transactions for players                       |

#### 8. Extension-Aware Symmetry

The UI communicates that both gates in a link must share the same extension type. Policy deployment flows guide toward matched-pair configurations. Linking validates extension compatibility before submission.

**Example:** The target gate selector shows compatibility badges: green = same extension, red = mismatch with explanation. Extension type mismatch is a silent failure mode on-chain — UI prevents this class of error before it reaches the chain.

---

### Upgrade Path

#### Trigger 1: Wallet→Character Mapping API

> **2026-03-10:** This trigger is now substantively resolved by `PlayerProfile` (v0.0.16). Wallet→Character lookup is available on-chain.

| Aspect | Detail |
|--------|--------|
| **Current** | Character ID requires off-chain event indexing or manual input |
| **If available** | Wallet connect → automatic Character resolution → immediate structure enumeration |
| **UX change** | Remove "Enter Character ID" from onboarding. Auto-populate structure list on connect. |
| **Code change** | `resolveCharacter(walletAddress)` swaps from RPC scan to API call — single function body replacement |
| **Unchanged** | All downstream UX: list, detail, policy, trade, events, fuel, linking |
| **Classification** | **Additive.** No breaking changes. Trivial rollback. |

#### Trigger 2: Coordinate API (Structure Position Data)

> **2026-03-10:** This trigger is now substantively resolved by `LocationRegistry` (world-contracts 2aed50b). Plain-text coordinates stored on-chain via `reveal_location()` on all assembly types.

| Aspect | Detail |
|--------|--------|
| **Current** | No coordinates on-chain. Manual pinning provides user-curated spatial organization. Hybrid Spatial Architecture adopted: Strategic Network Map (SVG) for operations + Cosmic Context Map (EF-Map embed) for universe grounding. See §9. |
| **If available** | Auto-place structures using real game coordinates. Replace manual pins with real positions in Strategic Network Map. |
| **UX change** | Manual Pinning → "Position Override" (optional). Strategic Network Map → first-class tab. Link visualization → accurate distances. "User-curated" disclaimer removed for API-sourced positions. EF-Map embed role unchanged. |
| **Code change** | `structure.position` field fills with API data (currently nullable by design). SVG topology component's conditional render path fires. Pin storage gains `source: 'api' \| 'manual'` discriminator. |
| **Unchanged** | List view (still primary), detail panels, rule composer, trade flows, events, fuel. EF-Map embed (cosmic context). |
| **Classification** | **Additive.** Position field is nullable by design — filling it triggers existing render paths. Manual pin data migrates to "override" semantics. |

#### Trigger 3: EVE Token on Sui (`Coin<EVE>`)

| Aspect | Detail |
|--------|--------|
| **Current** | All settlement in `Coin<SUI>`. Lux as display denomination. |
| **If available** | Toll and trade settlement can use `Coin<EVE>`. |
| **UX change** | Currency selector in toll/trade config (SUI or EVE). Exchange rate display. Revenue in multiple denominations. |
| **Code change** | `formatCurrency()` gains `'EVE'` denomination. PTB construction branches by token type. Config adds `settlementToken` field. Move extensions require re-publish. |
| **Unchanged** | Lux remains primary display. All UX structures unaffected. |
| **Classification** | **Additive with Move re-publish.** Existing SUI flows continue working. |

#### Trigger 4: Live Environment RPC Compatibility

| Aspect | Detail |
|--------|--------|
| **Current** | Structure discovery validated on local devnet only. Manual "add by ID" fallback present. |
| **If confirmed** | Auto-discovery is sole path. |
| **UX change** | Remove "Add structure by ID" fallback from onboarding. Simplify empty-state messaging. |
| **Code change** | Remove manual-add code path (or retain as hidden dev tool). Simplify error handling. |
| **Unchanged** | All downstream UX unaffected. |
| **Classification** | **Additive.** Removing a fallback is simplification, not breaking change. |

### Architectural Guardrails for Upgrade Readiness

| # | Guardrail | Pattern |
|---|-----------|---------|
| 1 | **Nullable position field** | `structure.position !== null ? renderOnMap() : renderUnplacedBadge()` — filling with API data requires no schema migration |
| 2 | **Abstracted Character resolution** | All components call `resolveCharacter()`, never directly invoke RPC — swap implementation without changing callers |
| 3 | **Denomination-parameterized currency** | `formatCurrency(amount, 'LUX' \| 'SUI' \| 'EVE')` — adding EVE is utility-layer only |
| 4 | **Standard pin storage interface** | `PinStorage.get(id)` / `PinStorage.set(id, pos, source)` — swap localStorage → API without touching UI |
| 5 | **Service-wrapped proof operations** | `linkGates(sourceId, targetId): Promise<Result>` — proof source is encapsulated; UI calls one function |

---

## Appendix: Data Source Reference

> **Read Provider Abstraction (2026-03-05):** The sources listed below are implementation details of the **RPC Provider** (Day-1 default). All data flows through the [read provider abstraction layer](../architecture/read-provider-abstraction.md), enabling future transport switching (GraphQL, Indexer backend, Demo Provider) without UI component changes. The semantic query interface is defined by the hooks in S43 of the [implementation plan](../core/civilizationcontrol-implementation-plan.md).

| Data Element          | Source (RPC Provider)                    | Latency     | Notes                          |
| --------------------- | ---------------------------------------- | ----------- | ------------------------------ |
| Structure list        | RPC: `suix_getOwnedObjects` on Character | ~1s         | Requires Character ID first    |
| Structure status      | RPC: `sui_getObject` per structure       | ~1s         | Can be cached, polled          |
| Gate extension type   | On-chain: `gate.extension` field         | Same read   | TypeName includes package ID   |
| Gate link partner     | On-chain: `gate.linked_gate_id`          | Same read   |                                |
| NWN fuel level        | On-chain: `network_node.fuel` fields     | Same read   | `amount / max_capacity` = %    |
| SSU inventory         | On-chain: dynamic fields on StorageUnit  | ~2-3s       | Query DF keys then read items  |
| Jump events           | Event polling (`suix_queryEvents`)       | Near real-time | `JumpEvent` (world-contracts); polling preferred over subscription (availability unconfirmed) |
| Trade events          | Custom extension events                  | Near real-time | Extension must emit `TradeSettledEvent`; no world-contracts trade event exists |
| Toll revenue          | Custom extension events                  | Derived     | Extension must emit `TollCollectedEvent`; generic `Coin<SUI>` transfers are ambiguous — see [read-path-architecture-validation.md](../architecture/read-path-architecture-validation.md) §2.4 |
| Structure labels      | App storage (localStorage)               | Instant     | Not on-chain                   |
| Spatial pins          | App storage (localStorage)               | Instant     | Not on-chain                   |
| Tags                  | App storage (localStorage)               | Instant     | Not on-chain                   |
| Lux exchange rate     | App configuration (user-configured)      | Instant     | Display convenience only       |
| Character→Wallet      | Off-chain resolution                     | Bootstrap   | Event index or server API      |

---

## Appendix: TradePost Screens

### SSU List View

| Column           | Display Format               | Notes                                |
| ---------------- | ---------------------------- | ------------------------------------ |
| **Status**          | Color dot (●/○)              | Same as gate list                    |
| **Name**            | User-assigned label          | Editable inline                      |
| **ID**              | Truncated object ID          | Copy-to-clipboard                    |
| **Extension**       | Badge: "TradePost" / "None"  | Blue = TradeAuth active              |
| **Active Listings** | Number badge                 | e.g., "4 listings"                   |
| **Revenue (24h)**   | "60 Lux (6.0 SUI)"          | Aggregated from trade events         |
| **Inventory**       | Total items count            | From `inventory_keys.length`         |
| **Tags**            | Colored pills                | Same tagging system as gates         |

### SSU Detail View (Tabs)

**Inventory Tab:** Item list with type, name (if mapped), quantity, "Create Listing" action per item.

**Listings Tab:** Active listings as cards (item, price, date, status). Per-listing: edit price, cancel. "New Listing" button → create flow. Completed listings in collapsible section.

**Trade History Tab:** Timestamp, item, price (Lux + SUI), buyer ID, tx digest link.

**Revenue Tab:** Total revenue, period revenue (24h/7d/30d), trade count, average price.

### Create Listing Flow

| Step | Content                                                            |
| ---- | ------------------------------------------------------------------ |
| 1    | Select item from SSU inventory                                     |
| 2    | Set price — input field with dual display: "[___] Lux (≈ ___ SUI)" |
| 3    | Review — "List [Item] for [Price]" confirmation card                |
| 4    | Sign — PTB constructed → wallet signature                          |
| 5    | Success — "Listing created ✓" + link to listings tab               |

---

## 13. Figma-Ready UX Brief (Condensed)

Condensed structural reference for Figma prototyping. Defines layout zones, core components, and interaction patterns. No visual styling decisions (colors, typography, spacing) — structure and behavior only.

### Core Screens

**Command Overview:** Landing page after wallet connection and Character resolution. **Revenue-dominant metric row:** revenue card takes 2× visual width of other metrics (primary anchor); secondary metrics (total structures, status/policy count, fuel) share remaining width. Revenue displays in Lux with SUI parenthetical and trend indicator. Structures subtitle references governance: "3 Gates (2 governed), 2 TradePosts, 2 Nodes." **Strategic Network Map section** (below metrics, above signals): Compact SVG topology rendering operator's network — system nodes with structure badges, gate link lines with status encoding. Expandable to full-width. Collapsible for list-focused operators. "User-curated placement" disclosure. EF-Map Cosmic Context available as expandable panel or secondary tab within this section. See §9. **Recent Signals section** (promoted): consequence-differentiated rows — denied events (red accent), revenue events (green accent + right-aligned Lux amount), status events (neutral). **Attention Required section** (demoted): compact collapsible one-line items for fuel/offline warnings — max 3 visible, not full cards. Quick action shortcuts to common flows. Zero-click information surface. See §14 for hierarchy rationale.

**Gate List:** Primary navigation surface. Sortable, filterable table of all player-owned gates. Columns: status dot, user-assigned name, truncated object ID, link partner, extension badge, rules summary tags, fuel indicator, revenue figure, tag pills. Default sort: offline-first (surface problems). Inline-editable names. Search bar + filter chip row at top.

**Gate Detail:** Single-page drill-down with vertically stacked collapsible sections. Sections: Overview header (status toggle, name, ID, extension badge, link partner, energy source, tags, quick actions), Access Rules (active rule cards + "Configure Rules" button), Economic Rules (toll config + revenue metrics), Linking (partner info + link/unlink flow entry), Activity (gate-scoped chronological event stream with time range selector), Spatial Assignment (manual system pin with "user-curated" disclosure).

**Rule Composer:** Panel or slide-over accessed from Gate Detail's Access Rules section. Shows available rule modules as toggleable cards. Each card: header (toggle + title + status badge), body (1-3 config fields: dropdown, number input, or address list), footer (last deployed timestamp). Stack preview generates human-readable summary sentence. "Deploy Policy" button at bottom with diff display when modifying. Wallet signature prompt on deploy.

**TradePost (SSU Detail):** Tabbed detail view accessed from SSU List. Tabs: Inventory (item list with "Create Listing" action per item), Listings (active listing cards with edit/cancel, "New Listing" button, completed listings collapsible), Trade History (transaction log: timestamp, item, price, buyer, tx link), Revenue (totals + period summaries with time range selector).

**Signal Feed:** Global chronological event stream across all structures. Each event row: timestamp, structure name (linked to detail), event type indicator, description text, amount (right-aligned if economic), tx link icon. Time range selector at top (1h / 24h / 7d / 30d / All). Auto-refresh via polling.

**Wallet Connection:** Entry point in global header (top-right). Pre-connect state: centered "Connect Wallet to Begin" prompt on main content area. Post-connect: Character resolution flow (automatic attempt → manual fallback modal if needed). See §10 for full state machine.

### Layout Zones

| Zone | Position | Content | Behavior |
|------|----------|---------|----------|
| **Global Header** | Top, full width, fixed | App title (left), wallet button + connection status + network indicator (right) | Always visible; persists across all routes. **Portrait (≤800px):** wallet/status moves below title row or becomes icon-only. |
| **Sidebar** | Left, fixed width | Primary nav items (Command Overview, Gates, Trade Posts, Signal Feed, Configuration) above divider; collapsible structure inventory list below divider | Always visible; structure inventory collapses independently; entire sidebar collapses on narrow viewports. **Portrait (≤800px):** collapses to hamburger drawer (top-left icon). |
| **Main Content** | Center, fluid width | Active screen content — list views, detail views, dashboard cards | Changes per route; scrollable. **Portrait (≤800px):** full-width single-column; tables collapse to card grids. |
| **Contextual Panel** | Right, overlay or slide-in | Rule composer, linking flow steps, listing creation — contextual multi-step flows | Visible only during specific interactions; dismissed on completion or cancel. **Portrait (≤800px):** becomes full-screen overlay with back navigation. |

### Core UI Components

| Component | Structure | Usage Context |
|-----------|-----------|---------------|
| **Rule Module Card** | Header row: toggle switch + module title + status badge (Active/Configured/Off). Expandable body: 1-3 config fields (dropdown, numeric input, address list editor). Footer: "Last deployed: [timestamp]" | Rule Composer |
| **Tag Chip** | Small pill badge with text label + background color. Edit mode adds "×" remove button | Gate list, SSU list, detail view headers |
| **Status Badge** | Colored dot or pill. States: green (online/active), amber (warning/low fuel/configured-not-deployed), red (offline/error/blocked), gray (unconfigured/unlinked/off) | List columns, detail headers, sidebar inventory |
| **Signal Feed Item** | Single row: timestamp (left-aligned), structure name (linked), event type icon, description text, amount if economic (right-aligned), tx link icon (far right) | Global activity feed, gate detail activity section |
| **Modal Dialog** | Centered overlay with backdrop dimming. Header: title + close button. Body: content area. Footer: primary action button + secondary/cancel button | Character ID input, linking confirmation, error displays |
| **Confirmation Panel** | Inline expandable card. Shows: action summary text, diff display (if modifying existing state), collapsible PTB preview (advanced), "Confirm" + "Cancel" buttons | Deploy policy, create listing, link gates, unlink |
| **Wallet Button** | Header-positioned button. States: default (outlined "Connect Wallet"), connected (address pill + green status dot, click reveals dropdown), error (amber or red badge with tooltip) | Global header, always visible |
| **Empty State Card** | Centered in main content area. Heading (bold), body text (muted), optional primary action button | Gate list (no gates), SSU list (no SSUs), activity feed (no events) |

### Interaction Philosophy

1. **List-first.** Every primary screen opens on a sortable, filterable list. Structure lists are the navigation spine — not a map, graph, or canvas. All governance and commerce actions are reachable from the list without spatial data.

2. **Opinionated rule blocks.** Policy configuration uses predefined modules with bounded input surfaces (dropdowns, toggles, number fields). No visual programming, no node-graph editors, no raw code input. Each module has a fixed schema — users configure, not construct.

3. **Progressive disclosure.** Information layers by click depth: Dashboard (0 clicks, aggregate view) → List (0 clicks, structure inventory) → Detail (1 click, single structure) → Composer (2 clicks, policy editing) → Advanced (3+ clicks, ZK config, raw tx data, diagnostics). Non-technical users never need to go past Level 2.

4. **Manual spatial augmentation with hybrid rendering.** Users optionally assign structures to solar systems for organizational grouping. All spatial labels carry "user-curated" disclosure. No spatial data is required for any governance or commerce action. Spatial layer is supplementary — always available, never mandatory, never primary navigation. The Strategic Network Map (SVG) renders operational topology from manual pins; the Cosmic Context Map (EF-Map embed) provides universe grounding. See §9.

---

## UI Language & Narrative Voice

All UI labels, navigation items, page titles, headings, empty states, confirmations, and fault messages in CivilizationControl must follow the canonical voice and narrative guide:

> **[CivilizationControl — Voice & Narrative Guide](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md)**

When implementing screens defined in this specification, apply the label mapping table (§3 of the narrative guide) and run the Narrative Impact Check (§8) before finalizing copy. Preferred navigation labels are defined in the guide's §4 (Option C — Frontier Authority).

This requirement applies to player-facing surfaces only. Internal component naming, code comments, and technical documentation are excluded.

---

## 14. Hierarchy Compression Revision — 2026-02-18

Revision based on visual hierarchy critique of the initial Command Overview layout (Figma Make static screenshot, 2026-02-18). No scope expansion — reordering, resizing, label correction, and consequence differentiation only.

### Problem

The initial layout reads as a generic SaaS monitoring dashboard: equal-weight metric cards, alert-dominated mid-section, undifferentiated signal rows, and label violations ("Dashboard," "Activity," "Settings," "CRDT"). Fails the 3-Second Emotional Check (§5 of Hackathon Emotional Objective) at 2/5 — below the 3/5 minimum for Command Overview.

### Visual Hierarchy Changes

| Section | Before | After | Rationale |
|---|---|---|---|
| **Metric Row** | 4 equal-width cards (Structures, Status, Revenue, Fuel Alerts) | Revenue card at 2× width (hero metric); Structures, Status+Policies, Fuel as secondary | Revenue is the payoff of Control→Consequence→Revenue demo loop; must dominate closing shot (Beat 7) |
| **Revenue Card** | "18,425 CRDT" | "18,425 Lux (1,842.5 SUI)" with breakdown line: "Gate tolls + Trade revenue" | Canonical currency per spec §5c; breakdown surfaces both revenue streams |
| **Fuel Alerts Card** | Dedicated metric card slot | Replaced by **Active Policies** count ("3 rules across 2 gates") | Answers "What am I governing?" (3-Second Check pillar 1); fuel warnings surface in Attention Required |
| **Structures Card** | Subtitle: "3 Gates, 2 TradePosts, 2 Nodes" | "3 Gates (2 governed), 2 TradePosts, 2 Nodes" | One-word governance signal without new data |
| **Signal Feed** | "Recent Activity" — equal-weight rows, generic type badges | "Recent Signals" — consequence-differentiated: red accent (denied/blocked), green accent + Lux amount (toll/trade), neutral (status) | Enables demo Beats 4-5 distinction; transforms log into intelligence stream |
| **Alerts Section** | "Alerts" — 3 large cards (~30% viewport) | "Attention Required" — compact one-line items, collapsible (~10% viewport) | Demotes reactive monitoring; promotes governance posture over problem-surfacing |

### Label Corrections (vs. Screenshot)

| Element | Screenshot | Canonical | Source |
|---|---|---|---|
| Sidebar nav | Dashboard | **Command Overview** | Voice Guide §4 Option C |
| Sidebar nav | Activity | **Signal Feed** | Voice Guide §4 Option C |
| Sidebar nav | Settings | **Configuration** | Voice Guide §4 Option C |
| Page heading | Dashboard | **Command Overview** | Voice Guide §3 |
| Subtitle | "Overview of your infrastructure operations" | **"Your infrastructure at a glance"** | UX Spec §6 microcopy |
| Section | Alerts | **Attention Required** | Governance register |
| Section | Recent Activity | **Recent Signals** | Voice Guide §3 |
| Currency | CRDT | **EVE** (Lux secondary) | UX Spec §5c |

### Signal Feed Event Copy Corrections

| Screenshot Copy | Canonical Copy |
|---|---|
| "Fleet passage recorded" | "Passage completed. +5 EVE" |
| "Item sold: Advanced Components x50" | "Trade settled. Advanced Components ×50" |
| "Fuel level warning threshold reached" | "Fuel warning. Beta Gate." |
| "Linked to Delta Gate in Sector 7" | "Link established. Delta Gate." |
| "Gate went offline" | "Gamma Gate offline." |
| "Low fuel - 2 hours remaining" | "Fuel critical. ~2 hours remaining." |
| "Offline for 45 minutes" | "Offline. 45 minutes." |
| "Unusual traffic pattern detected" | "Elevated passage rate." |

### 3-Second Check (Post-Revision)

| Question | Before | After |
|---|---|---|
| What am I governing? | FAIL — no policy visibility | PASS — Active Policies card + governed gate count |
| What is under my authority? | PASS | PASS |
| What is producing value? | PARTIAL — underweight, wrong currency | PASS — revenue-dominant, Lux-denominated |
| What is at risk? | PASS | PASS — Attention Required section |
| What am I building? | WEAK | WEAK (acceptable — implicit in structure counts) |

Score: 4/5 pass (up from 2/5). Meets the Command Overview minimum of "all five" answerable.

### Implementation Note

No new Figma brief required — §13 Command Overview description updated inline with hierarchy guidance. All changes are reordering, resizing, label correction, and consequence differentiation within existing data. No new tabs, modules, data types, or scope added.

---

## 15. In-Game DApp Surface Architecture (2026-02-28)

Confirmed constraints from the EVE Frontier embedded Chromium browser. Full reference: [In-Game DApp Browser Surface](../architecture/in-game-dapp-surface.md).

> **Viewport priority:** The primary design target is **1440p widescreen** (2560×1440 or 1920×1080) for the external browser and demo recording. The in-game portrait layout below is the secondary adaptation. Demo video is always recorded in the external browser.

### Portrait Layout — In-Game Adaptation (787 × 1198 px)

All CivilizationControl screens must also render in the in-game portrait viewport approximately 800px wide and 1200px tall.

| Desktop Element | Portrait Adaptation |
|----------------|-------------------|
| Sidebar navigation | Collapsible hamburger drawer (top-left icon) |
| Gate/SSU list table (9 columns) | Card grid — prioritize: Status, Name, Rules, Revenue; expand for details |
| Rule Composer modules | Full-width stacked cards |
| Contextual panel (detail, linking) | Full-screen overlay with back navigation |
| Revenue metric row (“2× width” card) | First card in vertical stack (no side-by-side) |
| Strategic Network Map (SVG) | Full-width, collapsible (collapsed by default) |
| EF-Map embed (iframe) | Full-width iframe, aspect ratio preserved |
| Signal Feed | Full-width chronological list (already narrow-friendly) |

### Action-Card Pattern

In-game UI uses a card-based action pattern:

| Card Type | Content | In-Game Behavior | External Browser Behavior |
|-----------|---------|-------------------|---------------------------|
| Gate Status | Online/Offline + rule summary | Read-only display | Toggle + configure |
| Listing | Item + price + seller | "View" only | "Buy" button active |
| Rule Module | Filter/toll configuration | Read-only preview | Edit + deploy |
| Revenue | Aggregate toll/trade amounts | Display with tx links | Display with tx links |

### Proof Overlay Pattern

Evidence overlays (tx digests, event data) display identically in both contexts — they are read-only data. The "View on Explorer" link uses `window.open` (available in-game) or clipboard copy fallback.

### Event Polling Model

| Event Type | Poll Interval | Cache |
|------------|--------------|-------|
| Structure state changes | 5-10s | No (always fresh from RPC) |
| Jump events (permit, deny) | 5s | IndexedDB append-only |
| Trade events | 5s | IndexedDB append-only |
| Revenue aggregates | Derived from cached events | Recompute on update |

Polling uses `@tanstack/react-query` with configurable `refetchInterval`. IndexedDB cache enables instant page loads for historical data, with chain re-validation on session start.

**Provider note:** Polling intervals and caching apply to the RPC Provider (Day-1 implementation). The Demo Provider replays events from scripted fixtures at simulated intervals. Future providers (GraphQL, Indexer) may use different polling strategies. The polling model is an implementation detail of the active provider, not a UI-layer concern.

### Failure State UX

| Failure | In-Game Treatment | External Browser Treatment |
|---------|-------------------|----------------------------|
| RPC unreachable | "Chain data unavailable — retrying" banner | Same |
| Invalid objectId in URL | "Structure not found" centered message | Same |
| No wallet (in-game expected) | "Viewing Mode — Open in browser to manage" | "Connect Wallet" prompt |
| Transaction failed | N/A (no writes in-game) | Error toast with tx digest |
| Wallet rejected | N/A (no writes in-game) | "Transaction cancelled" toast |

### Wallet Prompt Expectations

- **In-game:** No wallet prompts ever appear. All interactions are read-only.
- **External browser:** Standard EVE Vault popup for each transaction. One approval per PTB.
- **Sponsored transactions:** Backend co-signs after user; no additional user prompt for gas.

### Demo-Beat Alignment

The 3-minute demo captures in the beat sheet are compatible with both contexts:

| Beat | In-Game Capture | External Browser Capture |
|------|----------------|---------------------------|
| Beat 2 (Command Overview) | Valid — portrait layout shows structure list, status, alerts | Valid — standard layout |
| Beat 3 (Policy deploy) | Not possible in-game (requires signing) | **Primary capture source** |
| Beat 4-5 (Hostile denied, Ally tolled) | Signal Feed visible in-game (read-only evidence) | **Primary capture source** for tx signing |
| Beat 6 (Trade buy) | Not possible in-game | **Primary capture source** |
| Beat 7 (Revenue visible) | Valid — Command Overview revenue display | Valid |

**Recommendation:** Demo video captures writes in external browser, but can optionally show the in-game read-only view as supplementary footage demonstrating live Frontier integration (Stillness deployment bonus).

---

*End of specification.*
