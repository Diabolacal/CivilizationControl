# Read-Path Architecture Validation — CivilizationControl

**Retention:** Carry-forward

- **Date:** 2026-02-18
- **Scope:** Wallet→structures discovery, signal feed data sources, read architecture options, scale considerations, demo requirements
- **Validated against:** world-contracts event audit (37 `event::emit` calls, 30 event types, 13 modules — updated 2026-03-05), Sui RPC/GraphQL documentation, all CivilizationControl docs

> **v0.0.18 update:** `ExtensionConfigFrozenEvent` added (~32 event types). New emit site in `extension_freeze.move`.

> **2026-03-10 submodule refresh:** Builder-scaffold renamed `smart_gate/` → `smart_gate_extension/`. `PlayerProfile` now enables on-chain wallet→Character lookup (resolves §1 discovery gap). `LocationRegistry` provides on-chain coordinates for revealed structures.

---

## 1. How It Works: Wallet Connect → Populated Command Overview

### Step-by-Step Read Path

```
Player opens CivilizationControl → Connect Wallet (EVE Vault / @mysten/dapp-kit)
  │
  ▼
Step 1: Resolve Character ID (OFF-CHAIN — see §1.1)
  │  wallet address → Character object ID
  │
  ▼
Step 2: Enumerate OwnerCaps (RPC)
  │  suix_getOwnedObjects(character_object_address,
  │    { filter: { StructType: "pkg::access::OwnerCap<pkg::gate::Gate>" }})
  │  Repeat for OwnerCap<NetworkNode>, OwnerCap<StorageUnit>
  │
  ▼
Step 3: Read authorized_object_id from each OwnerCap (RPC)
  │  Extract structure object IDs
  │
  ▼
Step 4: Batch-read structure objects (RPC)
  │  sui_multiGetObjects(structure_ids, { showContent: true })
  │  → status, linked_gate_id, extension, fuel, inventory metadata
  │
  ▼
Step 5: Populate Command Overview
  │  Metric cards: structure count, governance count, fuel warnings
  │  Revenue: requires event polling (see §2)
  │  Recent Signals: requires event polling (see §2)
  │  Attention Required: derived from object state (offline, low fuel)
  │
  ▼
Step 6: Start polling loop (10s interval)
  │  Re-read changed objects + query new events
```

### 1.1 Character Resolution Options (ranked by reliability)

| Option | Mechanism | Availability | UX Quality |
|--------|-----------|-------------|------------|
| **A. Event indexing** | Query `CharacterCreatedEvent` by `character_address` field via `suix_queryEvents` with `MoveEventType` filter | Requires historical event access on hackathon RPC | Automatic — best UX |
| **B. dapp-kit SDK** | `@evefrontier/dapp-kit` may provide `getCharacterByAddress()` or equivalent | Unknown — SDK docs incomplete | Automatic if available |
| **C. ObjectRegistry deterministic ID** | `derived_object::claim(registry_id, character_key)` computes Character ID from known inputs | Requires ObjectRegistry UID + tenant string — may not be public | Automatic if inputs known |
| **D. Manual fallback** | User pastes Character ID from game client | Always available | Poor — but functional |

**MVP decision:** Implement D (manual) on Day 1. Attempt A on hackathon test server within first 2 hours. Upgrade to A or B if successful.

**Day 1 validation script:** `suix_queryEvents({ MoveEventType: "pkg::character::CharacterCreatedEvent" }, null, 10, false)` — if this returns events with `character_address` fields, event indexing works.

---

## 2. Signal Feed & Attention Required Data Sources

### 2.1 World-Contracts Event Inventory

**37 event emissions across 13 modules, 30 distinct event struct types** (updated 2026-03-05; see [event inventory](../research/world-contracts-event-inventory.md)). Complete audit:

> **v0.0.18 update:** ~32 event types now (added `ExtensionConfigFrozenEvent` in `extension_freeze.move`).

| Event | Module | Trigger | User-scoped? | CivControl Relevance |
|-------|--------|---------|-------------|---------------------|
| `JumpEvent` | gate | `jump()` / `jump_with_permit()` | Yes — `character_id` | **PRIMARY** — passage signal |
| `FuelEvent` | fuel | deposit/withdraw/burn start-stop | Indirect — `assembly_id` | **Fuel lifecycle** — low fuel = `BURNING_STOPPED` |
| `StatusChangedEvent` | status | online/offline/anchor/unanchor | Indirect — `assembly_id` | **Infrastructure health** |
| `ItemDepositedEvent` | inventory | deposit to SSU | Yes — `character_id` | **Trade signal** |
| `ItemWithdrawnEvent` | inventory | withdraw from SSU | Yes — `character_id` | **Trade signal** |
| `ItemMintedEvent` | inventory | mint (game→chain) | Yes — `character_id` | Supply signal |
| `ItemBurnedEvent` | inventory | burn (chain→game) | Yes — `character_id` | Demand signal |
| `KillmailCreatedEvent` | killmail | kill recorded | Yes — killer + victim | Combat signal |
| `GateCreatedEvent` | gate | gate anchored | Indirect — `owner_cap_id` | Provisioning |
| `StorageUnitCreatedEvent` | storage_unit | SSU anchored | Indirect — `owner_cap_id` | Provisioning |
| `NetworkNodeCreatedEvent` | network_node | NWN anchored | Indirect — `owner_cap_id` | Provisioning |
| `AssemblyCreatedEvent` | assembly | generic assembly | Indirect — `owner_cap_id` | Low |
| `OwnerCapCreatedEvent` | access_control | cap created | Indirect — `authorized_object_id` | Capability grant |
| `OwnerCapTransferred` | access_control | cap transferred | Yes — `previous_owner` + `owner` | Ownership change |
| `EnergyReservedEvent` / `EnergyReleasedEvent` | energy | assembly online/offline | Indirect — `energy_source_id` | Resource allocation |
| `StartEnergyProductionEvent` / `StopEnergyProductionEvent` | energy | NWN power up/down | Indirect — `energy_source_id` | Infrastructure power |
| `FuelEfficiencySetEvent` / `FuelEfficiencyRemovedEvent` | fuel | admin config | None | Low |
| `MetadataChangedEvent` | metadata | name/desc change | Indirect — `assembly_id` | Low |

### 2.2 Signal-to-Source Mapping

| Signal Type (UI) | Source | Query Method | Status |
|-----------------|--------|-------------|--------|
| **Passage completed** | `JumpEvent` on-chain event | `suix_queryEvents({ MoveEventType: "...::gate::JumpEvent" })`, filter by owner's gate IDs client-side | **AVAILABLE** |
| **Toll collected** | **NO world-contracts event** — must be emitted by custom extension | Extension emits custom `TollCollectedEvent`; query by extension package + event type | **REQUIRES EXTENSION CODE** |
| **Trade settled** | **NO dedicated trade event** — `ItemDepositedEvent` + `ItemWithdrawnEvent` are closest | Query inventory events, correlate deposit/withdrawal pairs on SSU | **PARTIAL — requires correlation logic** |
| **Revenue earned** | Aggregation of toll + trade events | Sum custom extension events | **REQUIRES EXTENSION CODE** |
| **Gate online/offline** | `StatusChangedEvent` on-chain event | Query by event type, filter by gate IDs | **AVAILABLE** |
| **Fuel warning** | Derived from object state — NOT an event | Read `NetworkNode.fuel` fields, compute remaining time from `burn_rate_in_ms` | **AVAILABLE (polling)** |
| **Fuel depleted** | `FuelEvent` with `Action::BURNING_STOPPED` | Query fuel events | **AVAILABLE** |
| **Policy enforcement (deny)** | Transaction abort (MoveAbort) — failed tx stored with abort code | Demo: wallet adapter returns failure synchronously; Production: `suix_queryTransactionBlocks` by sender includes failed txs | **AVAILABLE (demo) / PARTIAL (production)** — see §2.3 |
| **Policy enforcement (allow)** | `JumpEvent` (successful passage = policy allowed it) | Same as Passage completed | **AVAILABLE (implied)** |
| **Active policy count** | Derived from gate object state (`extension` field) | Read gate objects, check presence of extension TypeName | **AVAILABLE (polling)** |
| **Governed structures** | Derived from gate object state | Count gates with non-null `extension` field | **AVAILABLE (polling)** |
| **Link established/broken** | `GateLinkedEvent` / `GateUnlinkedEvent` (world-contracts v0.0.13) | Subscribe or query by event type | **AVAILABLE (events)** |
| **Extension authorized** | ~~**NO event**~~ `ExtensionAuthorizedEvent` (world-contracts v0.0.15) | ~~Must poll `gate.extension` field changes~~ Subscribe or query by event type | **AVAILABLE (events)** *(Correction 2026-03-04)* |
| **Hostile detected** | `PriorityListUpdatedEvent` on-chain event (turret.move) | `suix_queryEvents({ MoveEventType: "...::turret::PriorityListUpdatedEvent" })`. Each candidate carries `behaviour_change`: ENTERED (proximity entry), STARTED_ATTACK (aggression). Filter candidates by `character_tribe` ≠ owner tribe. **Earlier signal than killmail** — fires at proximity entry, not destruction. | **AVAILABLE** — default turret path only (no extension); informational, no automation. **Requires runtime validation.** |
| **Combat detected** | `KillmailCreatedEvent` on-chain event | `suix_queryEvents({ MoveEventType: "...::killmail::KillmailCreatedEvent" })`, filter by operator's controlled `solar_system_id` client-side. Includes `loss_type` (SHIP/STRUCTURE), `killer_id`, `victim_id`. | **AVAILABLE** — lagging indicator (destruction already occurred); informational only, no automation |

> **v0.0.17 update:** `KillmailCreatedEvent` fields renamed: `killmail_id`→`key`, `killer_character_id`→`killer_id`, `victim_character_id`→`victim_id`. New field: `reported_by_character_id`.

### 2.3 Denial Observability

Gate jump denials (policy rejections) result in **transaction aborts** (MoveAbort), not on-chain events. However, Sui **does store failed transactions on-chain** and they are queryable:

- **Failed tx by digest:** `sui_getTransactionBlock(digest, { showEffects: true })` returns `effects.status: "failure"` with `effects.status.error` containing the MoveAbort module and abort code.
- **Failed tx by sender:** `suix_queryTransactionBlocks({ filter: { FromAddress: "..." } })` includes failed transactions in results. There is no native filter for failed-only, but client-side filtering on `effects.status` is trivial.
- **Events are still rolled back** — `suix_queryEvents` does NOT return events from failed transactions. Event-based queries cannot detect denials.
- **Gas is charged** — the gas coin is mutated, so the failed tx appears in the sender's transaction history.
- **Abort code is deterministic** — each extension and world-contracts module produces a unique `(module, code)` pair. Example: tribe mismatch = `MoveAbort(smart_gate::tribe_permit, 0)` (ETribeMismatch), distinct from gate-level aborts like `MoveAbort(world::gate, 5)` (ENotOnline).

#### Demo Mechanism (Zero Additional Infrastructure)

In the demo, the operator controls both the dashboard and the hostile pilot. The flow is:

1. **Hostile pilot's browser** submits `jump()` or `jump_with_permit()` via `signAndExecuteTransaction()`
2. **Wallet adapter returns the failure response synchronously** — includes tx digest + `effects.status.error` with the abort module and code
3. **Dashboard receives the failure** (same browser session, or via controlled orchestration) and parses the abort code:
   - Module `smart_gate::tribe_permit` + code `0` → "Jump denied. Tribe mismatch."
   - Module `world::gate` + code `5` → "Jump denied. Gate offline."
   - Module `world::gate` + code `10` → "Jump denied. Permit expired."
4. **Signal Feed displays** the denial with red accent, pilot address, gate name, and tx digest link

This requires **no indexer, no backend, no event subscription, and no extension code changes**. The failed tx digest is real and verifiable on any Sui explorer.

#### Production Considerations (Post-Demo)

For a production deployment where the gate owner's dashboard must observe **other users'** failed jump attempts:

| Approach | Complexity | Reliability |
|----------|-----------|-------------|
| **A. Query all txs touching the gate object** | Low — `suix_queryTransactionBlocks({ filter: { ChangedObject: gate_id } })`, but failed txs may NOT appear (object unchanged on abort) | **Unreliable** — gas coin is the only mutated object |
| **B. Two-step evaluate-then-execute** | Medium — separate "check" tx (always succeeds, emits `PolicyCheckEvent`) from "jump" tx | **Reliable** — evaluate tx always emits event; but adds UX step for pilots |
| **C. Backend relay** | Medium — backend evaluates rules, logs decisions, then submits or rejects PTB | **Reliable** — full control over deny logging; but adds infra |
| **D. Extension-emitted pre-check event** | Low code, but **does not work** — event rolled back on abort | **Not viable** |

For hackathon MVP: **Approach A (demo orchestration)** is sufficient. The demo operator controls both wallets and captures the failure response directly.

For Stillness production: **Approach B or C** would be needed if denial visibility for third-party jumpers is required. This is a post-submission enhancement.

**Recommendation:** Beat 4 ("Hostile denied") remains in the demo exactly as written. The tx digest is real. The abort code is deterministic. The Signal Feed entry is populated from the wallet adapter's failure response. No indexer required.

### 2.4 Revenue Tracking Architecture

**No world-contracts toll/revenue event exists.** Revenue tracking requires the CivilizationControl extension package to emit custom events.

**Required custom events in extension code:**

```move
public struct TollCollectedEvent has copy, drop {
    gate_id: ID,
    character_id: ID,
    amount: u64,          // Coin<SUI> amount in MIST
    timestamp_ms: u64,    // from Clock
}

public struct TradeSettledEvent has copy, drop {
    ssu_id: ID,
    buyer_character_id: ID,
    seller_character_id: ID,
    item_type_id: u64,
    quantity: u32,
    price: u64,           // Coin<SUI> amount in MIST
    timestamp_ms: u64,
}
```

These events are emitted by the extension's `issue_jump_permit` (for toll) and trade execution (for trade) functions. They are fully within the builder's control — no world-contracts modification needed.

**Revenue aggregation:** Query custom events by package + event type, sum `amount` fields, apply time-range filtering client-side or via cursor-based pagination with timestamp comparison.

---

## 3. Architecture Options Comparison

> **Read Provider Abstraction (2026-03-05):** Options A, B, and C below correspond to **provider implementations** behind a unified read interface. The UI consumes data through named hooks (`useOwnedStructures`, `useEventPolling`, etc.) that call through the active provider. Swapping from Option A to B or C changes only the provider implementation — no UI component modifications required. A fourth provider type, the **Demo Provider** (synthetic event replay for recording and showcase), is also supported. See [Read Provider Abstraction](read-provider-abstraction.md) for the full architectural concept.

### Option A: Browser-Only Direct Reads (→ RPC Provider)

| Aspect | Assessment |
|--------|-----------|
| **Components** | Browser app + Sui RPC/GraphQL endpoint only |
| **Complexity** | Lowest — no backend to deploy, operate, or secure |
| **Object reads** | `sui_multiGetObjects` for batch state reads; `suix_getOwnedObjects` for discovery; `suix_getDynamicFields` for inventory |
| **Event reads** | `suix_queryEvents` with `MoveEventType` filter + cursor pagination; poll every 10s |
| **User scoping** | Client-side: query all events by type, filter by owned gate/SSU IDs in browser |
| **Rate limits** | Public endpoints rate-limited; 500 concurrent users × 6 queries/10s = 300 req/s — **may exceed public limits** |
| **Pagination** | Cursor-based; consistent pagination window ~1 hour; manageable for demo |
| **Hackathon server** | Works if standard Sui RPC is exposed. GraphQL preferred but JSON-RPC sufficient. |
| **Stillness** | Works — public Sui RPC endpoints available |
| **Failure modes** | Rate limiting under load; no caching = repeated identical queries; event data pruned after retention window; no offline resilience |
| **Security** | Excellent — all reads are public Sui state; no user data stored; no backend to breach |
| **Demo quality** | Good for single-user demo. Real-time feel with 10s polling. |

### Option B: Browser + Thin Backend (Cache/Proxy) (→ Indexer Provider)

| Aspect | Assessment |
|--------|-----------|
| **Components** | Browser app + lightweight backend (Node.js/Deno on VPS) + optional Redis/SQLite |
| **Complexity** | Moderate — backend deployment, but minimal state management |
| **Backend responsibilities** | (1) Cache structure state with TTL, (2) Proxy and batch RPC calls, (3) Character resolution cache, (4) Event aggregation with dedup, (5) Rate limit buffering |
| **Object reads** | Backend caches `sui_multiGetObjects` results (TTL 10-30s); browser reads from cache |
| **Event reads** | Backend polls events on a schedule, deduplicates, stores recent window (last 24h-7d) in memory/SQLite |
| **User scoping** | Backend indexes events by structure ID; browser requests "events for my gates" — backend filters from cache |
| **Rate limits** | Backend makes 1 set of queries regardless of user count — **eliminates N×M query scaling** |
| **Pagination** | Backend handles cursor management; browser gets pre-paginated results |
| **Hackathon server** | Works with any Sui RPC endpoint |
| **Stillness** | Works — backend runs on VPS |
| **Failure modes** | VPS downtime (mitigated: browser can fall back to direct RPC); stale cache (mitigated: short TTL); backend memory limits with many events |
| **Security** | Backend stores no user secrets; all data is public chain state; CORS must be configured correctly; user scoping is by public object IDs only |
| **Demo quality** | Better — faster loads, pre-computed aggregates (revenue totals), smoother polling |

### Option C: Full Custom Indexer (→ Indexer Provider, full variant)

| Aspect | Assessment |
|--------|-----------|
| **Components** | Browser app + indexer service (Rust/Node) + PostgreSQL + backend API |
| **Complexity** | Highest — database schema, continuous indexing pipeline, monitoring, backup |
| **Backend responsibilities** | Continuous checkpoint streaming, event parsing, object state tracking, aggregate computation, historical queries |
| **Advantages** | Full historical queries, instant aggregation, complex cross-object analysis, no RPC pagination limits |
| **Hackathon server** | Overkill — indexer setup time competes with feature development |
| **Stillness** | Would work but requires ongoing maintenance |
| **Failure modes** | Indexer lag, missed checkpoints, database corruption, schema drift |
| **Security** | Largest attack surface — database, API, indexer process |
| **Demo quality** | Best if working — but setup risk outweighs demo benefit |

### Recommendation: **Option A (RPC Provider) for hackathon demo, Option B (Indexer Provider) for Stillness deployment**

**Rationale:**
- The hackathon demo is a single-user presentation. Option A's rate limit concern doesn't apply.
- 10-second polling with `suix_queryEvents` and `sui_multiGetObjects` provides sufficient "real-time" feel.
- Revenue aggregation can be computed client-side from a small event window (demo generates <100 events).
- Character resolution is the only component that benefits from a backend — and manual fallback is designed in.
- Option B should be deployed for Stillness if >10 concurrent users are expected. The backend is a simple cache/proxy (<200 lines).
- Option C is unjustified for the hackathon timeline. Building an indexer consumes 1-2 days that are better spent on extension code and demo polish.

**Provider abstraction note:** The read provider abstraction ensures this is a deployment-time configuration choice, not a code migration. Additionally, the **Demo Provider** enables repeatable demo recording and post-launch showcase without chain dependency. See [Read Provider Abstraction](read-provider-abstraction.md).

---

## 4. Scale Reality Check (500 Users)

### Query Load Model (Option A — Browser Only)

| Query Type | Per User (10s cycle) | 500 Users | Queries/Second |
|-----------|---------------------|-----------|----------------|
| OwnerCap discovery | 3 calls (Gate, NWN, SSU types) | 1,500 | 150/s |
| Structure reads | 1 multi-get (avg 10 structures) | 500 | 50/s |
| Event polling | 2 calls (JumpEvent + custom events) | 1,000 | 100/s |
| **Total** | **~6 calls/10s** | **3,000/10s** | **300/s** |

**300 req/s against a public Sui RPC endpoint will be rate-limited.** Public endpoints are "not meant for production-grade use" per Sui documentation.

### Mitigation (Option B)

| Strategy | Effect |
|----------|--------|
| **Backend polling** (single source) | Reduces RPC load to ~6 calls/10s regardless of user count |
| **Object state caching** (TTL 15-30s) | Eliminates redundant reads; 500 users read from cache, not RPC |
| **Event window** (latest 1000 events in memory) | One paginated sweep per poll cycle, served to all users |
| **Per-user query budget** | Backend serves pre-filtered results; no per-user RPC calls |
| **Pagination batching** | Backend maintains cursors; browser never paginates directly |

**With Option B, 500 concurrent users impose the same RPC load as 1 user.** Backend serves cached/aggregated data from memory. VPS requirements: <512MB RAM, <1 CPU core for this workload.

### Stillness Deployment Recommendation

For the Stillness deployment bonus window (14 days post-submission), deploy Option B if expecting >10 concurrent users. Implementation estimate: 4-6 hours for a Node.js/Deno cache proxy with:
- In-memory event buffer (last 1000 events per type)
- Object state cache (Map<ObjectID, CachedState> with TTL)
- Character resolution cache (Map<WalletAddress, CharacterID>)
- Simple REST API: `GET /structures?character=ID`, `GET /events?gates=ID1,ID2&since=cursor`

---

## 5. Demo Requirements

### 5.1 Signals That Can Be Real On-Chain (Hackathon Test Server)

| Signal | How to Produce | Evidence Quality |
|--------|---------------|-----------------|
| **Passage completed** | Execute `jump_with_permit` on test server → `JumpEvent` emitted | Real tx digest + real event |
| **Gate online/offline** | Call `online()` / `offline()` → `StatusChangedEvent` | Real tx digest + real event |
| **Fuel deposited/burned** | Call `deposit_fuel()` / `start_burning()` → `FuelEvent` | Real tx digest + real event |
| **Extension authorized** | Call `authorize_extension<Auth>()` — emits `ExtensionAuthorizedEvent` (v0.0.15+ / commit 3cc9ffa) | Real tx digest + real event |
| **Toll collected** | Custom extension emits `TollCollectedEvent` during `issue_jump_permit` | Real tx digest + real event |
| **Structure discovery** | OwnerCap enumeration via RPC | Real on-chain data |

### 5.2 Signals That Must Be Simulated (Demo Sample Data)

| Signal | Why Simulated | Presentation |
|--------|--------------|-------------|
| **Historical revenue totals** | Accumulating meaningful revenue requires many transactions over time | Display realistic aggregate with "(sample data)" disclosure; show 1-2 real toll events to prove mechanism |
| **Trade settled** | TradePost extension may not be fully implemented for demo | Show real `ItemDepositedEvent` + simulated trade completion in feed |
| **7d/30d time range data** | Test server won't have 30 days of history | Default to "All" time range; populate with demo-session events |

### 5.3 Demo Beat Sheet Alignment

| Beat | Data Source | Real or Simulated |
|------|-----------|-------------------|
| Beat 3: Policy Deployment | Extension authorization tx | **Real** (tx digest) |
| Beat 4: Hostile Denied | Failed tx digest + MoveAbort code from wallet adapter | **Real** (tx digest + deterministic abort code; see §2.3) |
| Beat 5: Ally Tolled | `JumpEvent` + custom `TollCollectedEvent` | **Real** (triggered by demo jump) |
| Beat 6: Revenue Visibility | Aggregation of `TollCollectedEvent`s | **Hybrid** — real events from demo + sample historical data |
| Beat 7: Closing Shot (Command Overview) | All signals populated | **Hybrid** — real state reads + sample historical feed |

---

## 6. Gap List

### 6.1 Invalid or Unproven Assumptions in Current Docs

| Assumption | Location | Status | Impact |
|-----------|----------|--------|--------|
| Toll revenue = "sum of Coin\<SUI\> transfers" | UX Spec Appendix | **INCORRECT** — generic Coin transfers are ambiguous; extension must emit dedicated revenue events | Must redesign revenue tracking to use custom events |
| `AccessGrant` event exists | Demo Beat Sheet Beat 5, Claim Proof Matrix | **INCORRECT** — sandbox mock only. Canonical CC event: `TollCollectedEvent` | Extension must emit `TollCollectedEvent` |
| `ItemPurchased` event exists | Product Vision §5, Claim Proof Matrix | **INCORRECT** — sandbox mock only. Canonical CC event: `TradeSettledEvent` | TradePost extension must emit `TradeSettledEvent` |
| Gate status change events exist | UX Spec §7 Signal Feed | **PARTIAL** — `StatusChangedEvent` exists in `status.move`, triggered by online/offline | **VALIDATED** — was incorrectly flagged as missing in some internal discussions |
| Time-range event filtering is native | UX Spec §7 time range selector | **INCORRECT** — `suix_queryEvents` uses cursor-based pagination, not native time-range windows; `TimeRange` filter exists in JSON-RPC but is deprecated | Client must paginate and filter by checkpoint timestamp |
| `suix_subscribeEvent` is available | UX Spec Appendix | **UNPROVEN** — availability on hackathon test server / Stillness RPC unknown | MVP should use polling (confirmed fallback design) |
| Lux→SUI exchange rate is defined | UX Spec §14 ("487 Lux") | **CLARIFIED** — confirmed rate: 10,000 Lux = 1 EVE token. Lux-to-SUI depends on EVE/SUI exchange (undefined) | App-level Lux/EVE constant (10,000:1); SUI conversion deferred until EVE/SUI rate known |
| Revenue card data is available from chain | UX Spec §14 hierarchy revision | **PARTIAL** — requires custom extension events; world-contracts provides no revenue data | Revenue metric depends entirely on custom extension event emission |

### 6.2 Missing Events (Cannot Be Produced Without Custom Code)

| Signal | world-contracts Status | Required Action |
|--------|----------------------|----------------|
| Toll collection | No event | Extension must emit `TollCollectedEvent` |
| Trade completion | No event | Extension must emit `TradeSettledEvent` |
| Policy denial | Transaction aborts — no event emitted; but failed tx IS queryable by digest, and abort code is deterministic | Demo: observe directly from wallet adapter failure response (zero infra). Production: two-step evaluate pattern or backend relay needed for third-party denial visibility. See §2.3. |
| Gate link/unlink | `GateLinkedEvent` / `GateUnlinkedEvent` (world-contracts v0.0.13) | Subscribe or query by event type; polling no longer required |
| Extension authorization | ~~No event~~ `ExtensionAuthorizedEvent` (v0.0.15) | ~~Detect via state polling~~ Subscribe or query by event type *(Correction 2026-03-04)* |
| Tribe change | No event | Detect via state polling (`character.tribe_id`) — low priority |

### 6.3 Unknowns Resolvable Only on Hackathon Test Server (March 11)

| Unknown | Validation Method | Time Budget |
|---------|------------------|-------------|
| Character resolution via event indexing | `suix_queryEvents({ MoveEventType: "...::CharacterCreatedEvent" })` | 30 minutes |
| RPC `suix_getOwnedObjects` on object address (OwnerCap discovery) | Query with known Character ID | 30 minutes |
| GraphQL availability on test server RPC | Attempt GraphQL query on test server endpoint | 15 minutes |
| `suix_subscribeEvent` availability | Attempt WebSocket subscription | 15 minutes |
| Event data retention window | Check oldest available event via pagination | 15 minutes |
| @evefrontier/dapp-kit SDK `getCharacterByAddress()` or equivalent | Inspect SDK exports and test | 1 hour |

---

## 7. Minimum Backend Specification (If Option B Deployed)

### 7.1 Responsibilities

**MUST do:**
1. Poll Sui RPC for events by type (JumpEvent, StatusChangedEvent, FuelEvent, custom extension events) every 10 seconds
2. Cache structure object state (TTL 15-30 seconds)
3. Cache Character resolution (wallet→Character ID mapping, TTL 1 hour)
4. Serve pre-filtered event feed by structure IDs
5. Compute revenue aggregates (sum of TollCollectedEvent amounts)

**MUST NOT do:**
- Store user credentials or wallet keys
- Sign transactions
- Modify on-chain state
- Store PII
- Act as a proxy for write operations
- Maintain long-term historical data beyond 7-day rolling window

### 7.2 Minimum Data Model

```
EventCache (in-memory or SQLite)
├── event_type: string (e.g., "JumpEvent", "TollCollectedEvent")
├── event_data: JSON (full event payload)
├── tx_digest: string
├── checkpoint_timestamp_ms: u64
├── structure_ids: string[] (gate_id, ssu_id — extracted from event fields)
└── ingested_at: u64

StructureCache (in-memory Map)
├── object_id: string → {
│   ├── object_data: JSON (full object content)
│   ├── fetched_at: u64
│   └── ttl_ms: u64 (default 15000)
│   }

CharacterCache (in-memory Map)
├── wallet_address: string → {
│   ├── character_id: string
│   ├── resolved_at: u64
│   └── ttl_ms: u64 (default 3600000)
│   }
```

### 7.3 Polling Strategy

```
Every 10 seconds:
  1. Query events since last cursor for each monitored event type
  2. Extract structure IDs from new events → add to structure watch list
  3. Re-read structure objects whose cache TTL has expired
  4. Update revenue aggregates incrementally
  5. Prune events older than 7 days from cache
```

### 7.4 API Endpoints

```
GET /api/character?wallet=0x...
  → { character_id, tribe_id, resolved_via }

GET /api/structures?character=0x...
  → [{ id, type, status, extension, fuel_pct, linked_gate, ... }]

GET /api/events?structures=id1,id2&types=JumpEvent,TollCollectedEvent&since=cursor&limit=50
  → { events: [...], next_cursor }

GET /api/revenue?structures=id1,id2&period=24h
  → { total_lux, breakdown: [{ structure_id, amount }] }

GET /health
  → { last_poll_at, events_cached, structures_cached }
```

### 7.5 User Scoping

- All queried data is **public chain state** — no access control needed for reads
- Structure scoping is by object ID (provided by browser after OwnerCap discovery)
- No user session management; no authentication required
- Backend is a read-only cache — cannot modify chain state
- If privacy of "which wallet owns which structures" is a concern, the browser can do OwnerCap discovery directly and only ask the backend for cached event/state data by structure ID (never sending wallet address)

---

## 8. Recommendations Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Hackathon demo architecture** | Option A / RPC Provider (browser-only) | Single-user demo; no rate limit concern; eliminates backend deployment risk |
| **Stillness deployment** | Option B / Indexer Provider (thin backend) if >10 users expected | Prevents RPC rate limiting; enables pre-computed revenue; <200 lines additional code |
| **Demo recording & showcase** | Demo Provider (synthetic event replay) | Repeatable timing for video capture; post-launch visitor experience; clearly labeled simulation |
| **Character resolution** | Manual fallback Day 1; attempt event indexing within first 2 hours | Risk-ordered; don't block on unknowns |
| **Revenue tracking** | Custom extension events (TollCollectedEvent, TradeSettledEvent) | No world-contracts support; must be self-sovereign |
| **Denial signals** | Demo: wallet adapter failure response (synchronous, zero infra); Production: two-step or backend relay | Failed tx stored on-chain with deterministic abort code; demo operator controls both wallets |
| **Polling interval** | 10 seconds | Matches UX spec; within public RPC limits for single user |
| **Lux exchange rate** | App-level constant: 10,000 Lux = 1 EVE; SUI conversion deferred until EVE/SUI rate known | Lux/EVE rate confirmed; user-configurable SUI display as stretch |
| **Event subscription** | Polling preferred; WebSocket as stretch | `suix_subscribeEvent` availability unconfirmed on target RPC |
| **Time-range filtering** | Client-side filtering on checkpoint timestamp from paginated events | No native time-range support in GraphQL; JSON-RPC `TimeRange` filter exists but is deprecated |

---

*Analysis performed: 2026-02-18. Sources: world-contracts main branch, Sui documentation, all CivilizationControl docs.*
*Items marked as March 11 Day 1 validations are the minimum empirical tests required before committing to architecture.*
