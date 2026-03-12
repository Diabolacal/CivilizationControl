# CivilizationControl — System Specification

**Retention:** Carry-forward

## Document Authority

| Role | Document |
|------|----------|
| Execution authority | `march-11-reimplementation-checklist.md` |
| Intent authority | `spec.md` (this document) |
| Validation authority | `validation.md` |
| Expanded reference | `civilizationcontrol-implementation-plan.md` |

> If conflicts exist, defer to the March-11 Reimplementation Checklist for execution decisions.

> **PRE-HACKATHON PROVISIONAL PLAN**
> Must be re-audited against live world contracts and documentation before March 11 execution.

> **Date:** 2026-02-24
> **Version:** 1.0
> **Status:** Pre-hackathon — zero production code exists
> **Sources:** 22 architecture/strategy/UX/research documents synthesized from sui-playground sandbox

### Status Legend (planning repo)

| Label | Meaning |
|-------|---------|
| **CONFIRMED** | Validated in local devnet sandbox (pre-hackathon) |
| **PROVISIONAL** | Architecturally sound; requires validation on hackathon test server (March 11+) |
| **BLOCKED** | Requires hackathon infrastructure or organizer-provided access (March 11+) |

---

## 1. System Boundaries

### 1.1 What CivilizationControl IS

A **browser-only governance command layer** for EVE Frontier tribe leaders. Two core modules designed as a single published Move extension package:

| Module | Purpose | World-Contracts Surface |
|--------|---------|------------------------|
| **GateControl** | Policy authoring (tribe filter + coin toll) on Smart Gates, enforced on-chain via typed witness extension | `gate.move`: `authorize_extension`, `issue_jump_permit`, `jump_with_permit` |
| **TradePost** | SSU-backed storefronts with cross-address atomic buy settlement using `Coin<SUI>` | `storage_unit.move`: `authorize_extension`, `withdraw_item<Auth>`, `deposit_item<Auth>` |
| **TurretControl** | Binary state toggle (online/offline) for owned turrets. No custom extension — native targeting only. Orchestrated via Posture Presets. | `turret.move`: `online`, `offline` (player-callable via `OwnerCap<Turret>`) |

> **Note:** Turret assembly exists in world-contracts v0.0.14 (`turret.move`) using the same extension pattern. CivilizationControl uses turrets at the state-toggle level only (`online`/`offline` via `OwnerCap<Turret>`) — CivilizationControl does not implement a custom turret extension. Default turret targeting already matches tribe_only policy. See [Turret Contract Surface](../architecture/turret-contract-surface.md). Turret state is orchestrated alongside gate policy via **Posture Presets** (Open for Business / Defense Mode).

**Architecture model:** Publish-once, configure-via-data. One extension package is published by the CivControl team. Players configure pre-built rule types via PTBs that write dynamic fields to a shared `ExtensionConfig` object. No end user writes Move code.

**Runtime:** Single-page React application served from static hosting (Cloudflare Pages). All chain reads flow through a **read provider abstraction** — a thin interface boundary that decouples UI components from the specific data backend. The Day-1 provider is direct Sui JSON-RPC from the browser. See [Read Provider Abstraction](../architecture/read-provider-abstraction.md).

**Tech stack:**
- Move (Sui edition 2024.beta) — extension package
- React + TypeScript + Vite — frontend SPA
- @evefrontier/dapp-kit — wallet adapter (wraps @mysten/dapp-kit-react + VaultProvider + SmartObjectProvider)
- @tanstack/react-query — RPC query caching + polling
- Tailwind CSS — styling

> **In-game browser constraint (2026-02-28):** The EVE Frontier in-game embedded browser (Chromium 122 CEF) provides NO Sui Wallet Standard provider. `@mysten/dapp-kit` wallet discovery finds zero Sui wallets in-game. In-game users are read-only. Write operations require an external browser with EVE Vault. See [In-Game DApp Browser Surface](../architecture/in-game-dapp-surface.md).

### 1.2 What CivilizationControl IS NOT (Non-Goals)

| Exclusion | Rationale |
|-----------|-----------|
| No backend / indexer / database | Browser-only for Day-1. The read provider abstraction enables switching to Option B (proxy) or Option C (indexer) post-hackathon without UI changes |
| No visual Move programming | Users configure opinionated rule blocks, not code |
| No custom token for Day-1 | `Coin<SUI>` only. TribeMint (`Coin<TribeToken>`) is stretch. **Currency display:** demo narration uses "EVE" as the on-chain denomination; "Lux" (10,000 Lux = 1 EVE) is the player-facing display denomination. Dual-display (EVE + Lux) is valid in dashboard contexts. On-chain implementation remains `Coin<SUI>`. |
| No real-time coordinate mapping | ~~Coordinates are not on-chain — only Poseidon(2) hashes.~~ **2026-03-10:** `LocationRegistry` now stores plain-text coordinates on-chain (`reveal_location()` on all assemblies). Manual spatial pinning remains fallback; auto-placement from chain data is now feasible. |
| No auto-discovery of structures | ~~Character resolution requires manual ID input (fallback).~~ **2026-03-10:** `PlayerProfile` (v0.0.16) enables wallet→Character lookup. Automated resolution is now standard path, not stretch. |
| No multi-chain support | Sui only |
| No PII storage | Events are aggregate only |
| No EF-Map visual primitives | 0/12 required primitives available. CivControl-native SVG topology for Day-1 |
| No drag-and-drop rule ordering | Fixed evaluation order enforced in Move module |
| No server-side analytics | No backend |
| No in-game write operations for Day-1 | In-game browser lacks Sui wallet. Read-only in-game surface; external browser for writes. EVE Vault relay is stretch. |
| No turret extension for Day-1 | Turret assembly exists (v0.0.14). CivilizationControl toggles turret online/offline state only — no custom turret extension will be built. Default turret targeting already matches tribe_only policy. Turret extensions cannot access external state (closed-world constraint). |

### 1.3 External Dependencies

| Dependency | Type | Status | Fallback |
|------------|------|--------|----------|
| Sui RPC (fullnode) | Read/Write | Available | Local devnet via Docker |
| world-contracts v0.0.13 | Move dependency | Pinned @ e508451 | Carry cached copy |
| EVE Vault wallet | Browser extension (external browser only); FusionAuth OAuth → zkLogin address — effectively "Sign in with EVE Frontier" (no seed phrase) | Functional (a6673949, v0.0.5) | Standard Sui wallet |
| @evefrontier/dapp-kit | NPM ^0.1.0 (wraps @mysten/dapp-kit-react ^1.0.2 + @mysten/dapp-kit-core ^1.0.4) | Stable | Raw @mysten/dapp-kit-react |
| In-game embedded browser | DApp runtime | Confirmed (787×1198 portrait, no Sui wallet) | Read-only mode; external browser for writes |
| AdminACL (sponsored tx) | On-chain whitelist | **BLOCKED until Day-1** | Non-sponsored fallback |
| EF-Map iframe | Visual context | Optional | SVG topology only |

---

## 2. On-Chain Interaction Model

### 2.1 Write Paths

Every chain write the app performs, with exact Move targets:

#### Phase: Setup (one-time per gate/SSU)

| Operation | Move Call | Auth Required | PTB Structure |
|-----------|----------|---------------|---------------|
| Authorize GateControl on gate | `gate::authorize_extension<GateAuth>(&mut Gate, &OwnerCap<Gate>)` | OwnerCap<Gate> | borrow_owner_cap → authorize_extension → return_owner_cap |
| Authorize TradePost on SSU | `storage_unit::authorize_extension<TradeAuth>(&mut StorageUnit, &OwnerCap<StorageUnit>)` | OwnerCap<StorageUnit> | borrow_owner_cap → authorize_extension → return_owner_cap |

#### Phase: Rule Configuration

| Operation | Move Call | Auth Required | Notes |
|-----------|----------|---------------|-------|
| Set tribe filter | `civcontrol::gate_rules::set_tribe_rule(&mut Config, gate_id, tribe_id)` | OwnerCap<Gate> | Dynamic field write |
| Set coin toll | `civcontrol::gate_rules::set_coin_toll(&mut Config, gate_id, price_mist, treasury)` | OwnerCap<Gate> | Dynamic field write |
| Set subscription tier | `civcontrol::gate_rules::set_subscription_tier(&mut Config, gate_id, price_mist, duration_ms)` | OwnerCap<Gate> | Dynamic field write — configures subscription pricing & duration for a gate |
| Remove rule | `civcontrol::gate_rules::remove_*(&mut Config, gate_id)` | OwnerCap<Gate> | Dynamic field remove |

#### Phase: Gate Jump (player-initiated)

| Operation | Move Call | Auth Required | Notes |
|-----------|----------|---------------|-------|
| Request jump permit | `civcontrol::gate_permit::request_jump_permit(config, src, dst, character, payment, clock, ctx)` | Extension witness (GateAuth) | Evaluates all rules, emits TollCollectedEvent. Auth is the typed `GateAuth` witness — no AdminACL or verify_sponsor involved. |
| Execute jump | `gate::jump_with_permit(src, dst, character, permit, clock, ctx)` | AdminACL sponsor | Consumes JumpPermit (owned, deleted on use — not a hot-potato; `key, store` abilities). **CONFIRMED (source-verified 2026-03-07):** Issue + jump are two separate transactions. `issue_jump_permit` calls `transfer::transfer(permit, character.character_address())`, placing the permit in the player's wallet; `jump_with_permit` takes `JumpPermit` by value (owned input). These cannot be composed in the same PTB. Runtime model: TX1 = permit issuance (extension-signed or player-signed), TX2 = sponsored jump execution. |

#### Phase: Trade

| Operation | Move Call | Auth Required | Notes |
|-----------|----------|---------------|-------|
| Create listing | `civcontrol::trade_post::create_listing(config, ssu, owner_cap, type_id, price, ctx)` | OwnerCap<StorageUnit> | Creates shared Listing object |
| Buy | `civcontrol::trade_post::buy(config, ssu, character, listing, payment, ctx)` | None (buyer signs) | Cross-address: withdraw_item<TradeAuth> + transfer |
| Cancel listing | `civcontrol::trade_post::cancel_listing(listing, owner_cap, ctx)` | OwnerCap<StorageUnit> | Sets is_active = false |

> **⚠️ v0.0.15 constraint (Day-1 validation required):** `deposit_item<Auth>` now validates `parent_id` — items can only be deposited back to their origin SSU. Cross-SSU item transfer in the buy flow may require using the new `deposit_to_owned<Auth>` function instead. This is not yet a resolved design choice; validate the buy-path item routing on the hackathon test server before committing to an approach.

### 2.2 Read Paths

All reads flow through the **read provider abstraction layer** ([architecture doc](../architecture/read-provider-abstraction.md)). The Day-1 provider implementation uses browser-side Sui JSON-RPC:

| Query | RPC Method (RPC Provider) | Purpose |
|-------|-----------|---------|
| Structure discovery | `suix_getOwnedObjects(character_addr, filter: OwnerCap<Gate>)` | Find player's gates |
| Structure state | `sui_multiGetObjects(ids, { showContent: true })` | Read gate/SSU fields |
| Rule inspection | `suix_getDynamicFields(config_id)` + `sui_getDynamicFieldObject(config_id, key)` | Read configured rules |
| Event polling | `suix_queryEvents({ MoveEventType: "..." }, cursor, limit)` | Signal Feed data |
| Balance | `suix_getBalance(address, "0x2::sui::SUI")` | SUI balance display |
| Inventory | `suix_getDynamicFields(inventory_uid)` | SSU item listing |

**Polling interval:** 10 seconds (MVP default). Per-data-type intervals may vary — see [in-game-dapp-surface.md §10](../architecture/in-game-dapp-surface.md) for granular rates (structure state: 5–10s, rules: 15–30s, events: 5s). No WebSocket, no indexer subscription.

**Provider abstraction:** The RPC methods above are implementation details of the RPC Provider. A Demo Provider (synthetic event replay for recording and showcase) and future GraphQL/Indexer providers share the same semantic query interface. See [Read Provider Abstraction](../architecture/read-provider-abstraction.md) for the four supported provider types.

### 2.3 Sponsored Transaction Model

**Requirement:** `gate::jump()` and `gate::jump_with_permit()` call `admin_acl.verify_sponsor(ctx)`. The sponsor (gas payer) must be in the `AdminACL.authorized_sponsors` table.

**Sponsorship semantics:** `verify_sponsor(ctx)` checks `tx_context::sponsor(ctx)` first; if `Option::none` (non-sponsored tx), it falls back to `tx_context::sender(ctx)`. Therefore a non-sponsored transaction succeeds if the **sender** is in `AdminACL.authorized_sponsors`. Self-sponsorship (sender == sponsor) is equivalent to a non-sponsored tx from the sender — it does not cause a special failure.

**Dual-sign pattern** (from builder-scaffold `transaction.ts`):
1. Player constructs PTB
2. Player signs (user signature)
3. Sponsor (admin key — team-held keypair) co-signs for gas
4. Both signatures submitted together

**Day-1 validation required:** Whether CivControl team address can be added to `AdminACL.authorized_sponsors`. Requires `GovernorCap` held by CCP.

**Fallback chain:**
- Branch A (65%): Auto-sponsorship via test server admin tools
- Branch B (25%): Request CCP to add sponsor address
- Branch C (10%): Demo on local devnet where we own GovernorCap

---

## 3. Move Module Architecture

### 3.1 Package Structure

Single published package: `civcontrol`

```
contracts/civcontrol/
├── Move.toml          # Depends on world-contracts World package
└── sources/
    ├── config.move       # CivControlConfig + AdminCap + GateAuth + TradeAuth
    ├── gate_rules.move   # Tribe filter + coin toll + subscription pass dynamic field rules
    ├── gate_permit.move  # request_jump_permit (rule evaluation + permit issuance)
    ├── trade_post.move   # Listing + buy + cancel
    └── zk_gate.move      # (stretch) ZK membership verification
```

### 3.2 Core Types

| Type | Abilities | Purpose |
|------|-----------|---------|
| `CivControlConfig` | `key` | Shared object — UID hosts dynamic field rules |
| `AdminCap` | `key, store` | Created at init, gates global config operations |
| `GateAuth` | `drop` | Package-internal typed witness for gate extension |
| `TradeAuth` | `drop` | Package-internal typed witness for SSU extension |
| `TribeRuleKey` | `copy, drop, store` | DF key: `{ gate_id: ID }` |
| `TribeRule` | `drop, store` | DF value: `{ tribe_id: u32 }` |
| `CoinTollKey` | `copy, drop, store` | DF key: `{ gate_id: ID }` |
| `CoinTollRule` | `drop, store` | DF value: `{ price_mist: u64, treasury: address }` |
| `SubPassKey` | `copy, drop, store` | DF key: `{ gate_id: ID }` |
| `SubPassLedger` | `store` | DF value: `{ Table<ID, u64> }` — maps character_id → expiry_timestamp_ms |
| `SubTierKey` | `copy, drop, store` | DF key: `{ gate_id: ID }` |
| `SubTierConfig` | `drop, store` | DF value: `{ price_mist: u64, duration_ms: u64 }` — subscription pricing & duration |
| `Listing` | `key, store` | Shared object — links SSU + item + price |

### 3.3 Custom Events

| Event | Fields | Emitted By |
|-------|--------|-----------|
| `TollCollectedEvent` | `gate_id, character_id, amount_mist, timestamp_ms` | `request_jump_permit` |
| `SubscriptionPurchasedEvent` | `gate_id, character_id, price_mist, expires_at_ms` | `purchase_subscription` |
| `ListingCreatedEvent` | `listing_id, ssu_id, seller, item_type_id, price_mist` | `create_listing` |
| `TradeSettledEvent` | `ssu_id, buyer, seller, item_type_id, quantity, price_mist` | `buy` |
| `ListingCancelledEvent` | `listing_id, ssu_id` | `cancel_listing` |

### 3.4 Rule Evaluation Order

Fixed AND composition inside `request_jump_permit`:

1. **Tribe Filter** — if DF exists: `character.tribe() == rule.tribe_id` → abort on mismatch. **Note:** `character.tribe()` is the public accessor; `tribe_id()` is `#[test_only]`.
2. **Subscription Pass** — if SubPassLedger DF exists: look up `character_id` in Table → if found AND `expiry >= clock.timestamp_ms()` → **skip toll collection** (pass holder jumps free). Expired entries are not auto-cleaned; subscription must be re-purchased.
3. **Coin Toll** — if DF exists AND subscription did not bypass: `coin::value(&payment) >= rule.price_mist` → transfer to treasury → return change
4. All passed → `gate::issue_jump_permit<GateAuth>(...)`

Allow/Block list rules (stretch, not in Day-1 MVP) would insert at positions 0-1 before tribe:
0. Block List → instant deny
1. Allow List → instant allow (bypass toll)

### 3.5 Extension Integration

**Critical constraint:** Each gate supports exactly ONE extension (`Option<TypeName>`). `authorize_extension` uses `swap_or_fill`. Both gates in a linked pair must have the same extension from the same package for `issue_jump_permit` to succeed.

**Authorization flow:**
```
borrow_owner_cap<Gate>(character, gate_receiving, ctx) → (OwnerCap, Receipt)  // ctx asserts sender == character address
gate::authorize_extension<GateAuth>(&mut gate, &owner_cap)   // stores TypeName
return_owner_cap(character, owner_cap, receipt)               // requires &Character
// Repeat for linked gate (if same owner)
```

---

## 4. UX Hierarchy

### 4.1 Screen Structure

| Level | Screen | 3-Second Check Answer |
|-------|--------|----------------------|
| L1 | **Command Overview** | What am I governing? What is under my authority? What is producing value? What is at risk? What am I building? |
| L2 | **Gates** (list) | What gates do I control? |
| L2 | **Trade Posts** (list) | What storefronts do I operate? |
| L2 | **Signal Feed** | What is happening right now? |
| L2 | **Configuration** | System preferences |
| L3 | **Gate Detail** | Control surface for one gate |
| L3 | **Trade Post Detail** | Inventory + listings for one SSU |

### 4.2 Rule Composer

Opinionated card-based UI (not visual programming). Two MVP module cards:

| Module | Config | Display |
|--------|--------|---------|
| **Tribe Filter** | Toggle + tribe ID (u32) | "Tribe Filter: Allow Tribe 7 only" |
| **Coin Toll** | Toggle + amount (MIST) + treasury (address) | "Coin Toll: 5 SUI per jump → 0x1a2b..." |
| **Subscription Pass** | Toggle + price (MIST) + duration (days) | "Subscription: 50 SUI for 30 days — bypasses toll" |

7-step deployment flow: select gate → toggle modules → configure → preview → diff → sign → confirm.

### 4.3 Wallet Integration

6 connection states: In-Game (Read-Only) → Disconnected → Connecting → Connected (no character) → Connected (with character) → Connected (sponsored). In-game state detected automatically when EVM wallet present and zero Sui wallets registered.

Character resolution: Manual paste of Character ID (MVP). Automated event-based lookup (stretch).

### 4.4 Narrative Constraints

All UI labels follow canonical mapping. Banned terms: Dashboard, Admin, Settings, Notifications, Objects, Submit, Error, Active/Inactive. Required: Command Overview, Configuration, Signal Feed, Structures, Deploy, Fault, Online/Offline.

---

## 5. Demo Architecture

### 5.1 Narrative Spine

> Pain → Power → Policy → Denial → Revenue → Defense Mode → Commerce → Command → Close

Arc: A frontier operator wakes up to chaos. By the end, every gate, turret, and trade post is under sovereign command — policy enforced, hostiles denied, revenue flowing, and the entire network locked down in one click. Defense Mode is the climax.

> Canonical demo blueprint: [CivilizationControl — Demo Beat Sheet v2](civilizationcontrol-demo-beat-sheet.md)

### 5.2 Primary Variant (~2:56, 9 beats)

| Beat | Name | Duration | Non-Negotiable Proof |
|------|------|----------|---------------------|
| 1 | Pain — text-on-black, specific loss | 18s | — (the "before") |
| 2 | Power Reveal — Command Overview loads | 20s | Package ID overlay |
| 3 | Policy — tribe filter + toll deployed | 22s | ★ Policy deploy tx digest |
| 4 | Denial — hostile pilot blocked | 18s | ★ Denied tx + MoveAbort |
| 5 | Revenue — ally tolled, operator paid | 18s | ★ Toll tx + balance delta |
| 6 | Defense Mode — posture switch, turrets online | 30s | ★ Single PTB tx digest (posture + turrets) |
| 7 | Commerce — TradePost atomic buy | 22s | ★ Buy tx + balance deltas |
| 8 | Command — full system view, aggregate revenue | 15s | UI screenshot (live) |
| 9 | Close — title card, no subtitle | 13s | — |

★ = Non-negotiable proof moment (5 total). Beat 6 (Defense Mode) is the 30-second climax.

### 5.3 Fallback Variant

If TradePost UI not ready: 2-minute GateControl-only (Beats 1–5 + close). Drops commerce proof.

### 5.4 ZK Accent (stretch)

30-second insert before closing. Only if ZK is stable by Day 5 rehearsal.

---

## 6. Risk Model

| # | Risk | Severity | Mitigation | Detection |
|---|------|----------|------------|-----------|
| 1 | AdminACL sponsor access unavailable | HIGH | Branch A/B/C protocol, local devnet fallback | S05 Day-1 validation |
| 2 | Partial-quantity withdrawal impossible | HIGH | Full-stack-only listings, pre-split items | Design around it |
| 3 | EVE Vault sponsored tx stub | HIGH | Standard wallet dual-sign fallback | Known (hardcoded digest) |
| 4 | Character resolution fails | HIGH | Manual Character ID input | S27 UX fallback |
| 5 | world-contracts API breaking change | MEDIUM | Pin to known commit, check Day-1 | S03 signature verification |
| 6 | In-game browser has no Sui wallet | MEDIUM | Read-only in-game mode + external browser for writes. EVE Vault relay is stretch goal. | Context detection on page load |

---

## 7. Embargo Assumptions

### Must Validate Before March 11 Implementation

| ID | Assumption | Status | Validation Step |
|----|-----------|--------|-----------------|
| H1 | Sponsor address addable to AdminACL | BLOCKED | S05 |
| H2 | Wallet → Character resolution works | PROVISIONAL | S27 |
| H3 | In-game dApp surface works | BLOCKED | Day-1 test: (a) HTTPS loads in embedded browser, (b) portrait layout renders at 787×1198, (c) Sui RPC calls succeed from webview, (d) read-only mode with "Viewing Mode" badge, (e) objectId parsed from URL |
| H4 | Coin<SUI> toll works on target network | PROVISIONAL | S14 |
| H5 | Event query performance ≤ 10s | PROVISIONAL | S26 |
| H6 | world-contracts v0.0.13 stable | PROVISIONAL | S03 |
| H7 | Single-PTB posture switch feasible | **VALIDATED** | Localnet validation: single PTB confirmed for both directions (~2–3s end-to-end; chain finality ~250ms + indexer sync). See [posture-switch validation](../sandbox/posture-switch-localnet-validation.md). |
| H8 | NWN fueled+online for turret toggle | **VALIDATED** | Energy prerequisite chain required: `set_fuel_efficiency` → `deposit_fuel` → `network_node::online`. `turret::online()` aborts with `ENotProducingEnergy` otherwise. Demo dependency. |
| H9 | Off-chain pre-check for turret state | **VALIDATED** | `status::online()`/`offline()` abort if already in target state. PTB construction must read current turret status before including toggle calls. |

### Day-1 Hard Stops

1. `authorize_extension` fails on test gates → investigate object ownership
2. `issue_jump_permit` TypeName mismatch → verify both gates have same extension
3. Sponsored tx rejected by AdminACL → activate Branch B/C
4. Cross-address `withdraw_item<Auth>` fails → fall back to escrow
5. World-contracts API breaking change → assess impact, potentially fork
6. Wallet adapter cannot resolve Character → manual input fallback

---

## 8. Gap Classification Summary

| Status | Count | Examples |
|--------|-------|---------|
| **CONFIRMED** | 25 | Extension auth, jump permits, withdraw_item<Auth>, cross-address buy, AdminACL, hot-potato, DF reads, events, Groth16, single-PTB posture switch, NWN energy prerequisite, turret state pre-check |
| **PROVISIONAL** | 18+ | Coin toll in extension, allow/block lists, Listing objects, React SPA, wallet adapter, event polling, Rule Composer |
| **BLOCKED** | 4 | AdminACL enrollment, partial-quantity withdrawal, in-game dApp, test server chain ID |

**Repository maturity: HIGH.** On-chain layer thoroughly validated (22 CONFIRMED items with devnet tx digests). BLOCKED items are environment-dependent, not design-dependent — resolvable on Day-1. Full spec-driven implementation plan is supportable.

---

## References

| Document | Purpose |
|----------|---------|
| [march-11-reimplementation-checklist.md](march-11-reimplementation-checklist.md) | Pattern catalog + Day-1 procedure |
| [civilizationcontrol-implementation-plan.md](civilizationcontrol-implementation-plan.md) | 45 atomic implementation steps |
| [civilizationcontrol-demo-beat-sheet.md](civilizationcontrol-demo-beat-sheet.md) | Demo script |
| [civilizationcontrol-claim-proof-matrix.md](civilizationcontrol-claim-proof-matrix.md) | Evidence mapping |
| [../architecture/gatecontrol-feasibility-report.md](../architecture/gatecontrol-feasibility-report.md) | Gate architecture validation |
| [../architecture/policy-authoring-model-validation.md](../architecture/policy-authoring-model-validation.md) | Publish-once model VERIFIED |
| [../architecture/world-contracts-auth-model.md](../architecture/world-contracts-auth-model.md) | 3-tier auth model |
| [../architecture/read-path-architecture-validation.md](../architecture/read-path-architecture-validation.md) | Browser-only read paths |
| [../ux/civilizationcontrol-ux-architecture-spec.md](../ux/civilizationcontrol-ux-architecture-spec.md) | Full UX specification |
| [../strategy/civilization-control/civilizationcontrol-strategy-memo.md](../strategy/civilization-control/civilizationcontrol-strategy-memo.md) | Strategy & modules |
