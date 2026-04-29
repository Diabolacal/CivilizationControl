# Read Provider Abstraction Layer

**Retention:** Carry-forward

> **Date:** 2026-03-05
> **Status:** Architectural design — zero implementation code exists
> **Scope:** Defines the read-path abstraction that decouples UI data consumption from specific backend data sources

---

## 1. Design Principle

CivilizationControl's UI consumes a **unified event/state feed** regardless of how the underlying data is retrieved. The backend data source is selected through a **read provider abstraction** — a thin interface boundary between UI components and chain data retrieval.

This is not a framework or a large engineering effort. It is an architectural clarity measure that:

- Insulates UI code from transport-layer changes (JSON-RPC deprecation, GraphQL migration)
- Enables a synthetic Demo Provider for repeatable demo recording and UI development
- Provides a clean upgrade path from browser-only polling to backend-assisted reads
- Keeps the hackathon implementation simple (RPC Provider is the only required implementation)

---

## 2. Provider Types

### 2.1 RPC Provider (Primary — Hackathon Implementation)

The Day-1 implementation. Uses Sui JSON-RPC methods directly from the browser.

| Aspect | Detail |
|--------|--------|
| **Transport** | HTTP POST to Sui full node (`suix_queryEvents`, `sui_multiGetObjects`, etc.) |
| **Polling** | Browser-side, 10-second interval via `@tanstack/react-query` |
| **Infrastructure** | None — browser only |
| **Suitability** | Single-operator demos, small user counts, hackathon submission |
| **Limitations** | No field-level event filtering, client-side scoping, rate limits at scale |

**This is the only provider that must be implemented for the hackathon.**

### 2.2 GraphQL Provider (Optional Alternative)

An alternative read path using Sui's GraphQL API when available.

| Aspect | Detail |
|--------|--------|
| **Transport** | GraphQL queries to Sui GraphQL endpoint |
| **Advantages** | Richer filtering, nested object lookups in single query, checkpoint-scoped reads |
| **Infrastructure** | Requires GraphQL endpoint (public good or self-hosted indexer stack) |
| **Suitability** | Post-hackathon if GraphQL is available on target environment |
| **Status** | Intentionally deferred. May be validated on Day-1 if a GraphQL endpoint exists. |

### 2.3 Indexer Provider (Post-Hackathon Scaling)

Used if CivilizationControl is deployed on Stillness and adoption grows beyond what browser-only polling can support.

| Aspect | Detail |
|--------|--------|
| **Transport** | REST/GraphQL to a custom backend (thin cache proxy or full indexer) |
| **Advantages** | Historical queries, aggregation, analytics, multi-user dashboards, rate limit elimination |
| **Infrastructure** | Node.js/Deno cache proxy on VPS ($5–20/mo) or full Sui indexer stack |
| **Suitability** | 10+ concurrent users, Stillness deployment, production analytics |
| **Status** | Intentionally deferred until post-submission. |

The Indexer Provider corresponds to **Option B** (thin backend) and **Option C** (full indexer) from the [read-path architecture validation](read-path-architecture-validation.md) §3.

### 2.4 Demo Provider (Development & Showcase Harness)

A synthetic event generator that replays scripted events and state transitions mimicking real chain behaviour.

| Aspect | Detail |
|--------|--------|
| **Transport** | In-memory — no network calls |
| **Data source** | Pre-scripted event sequences and object state snapshots |
| **Use cases** | See §3 below |
| **Infrastructure** | None — bundled with the frontend |
| **Status** | Development tool. Not required for hackathon submission proof moments. |

**The Demo Provider never replaces real chain verification.** All hackathon proof moments (transaction digests, MoveAbort denial codes, emitted events, object state reads) must come from real on-chain transactions.

---

## 3. Demo Provider — Detailed Design

### 3.1 Purpose

Two scenarios justify the Demo Provider's inclusion:

**Scenario A: Recording the official hackathon demo video**

Developers can trigger deterministic UI events without waiting for live chain timing:
- Hostile pilot attempts gate jump → denial signal
- Toll collected → revenue signal
- Trade settlement → commerce signal
- Posture change → defense activation signal

This allows repeatable UI capture with consistent timing. All proof moments in the official demo remain validated with real on-chain transactions — the Demo Provider is used only for the UI presentation layer during recording.

**Scenario B: Post-hackathon live showcase**

After submission, the project may be deployed publicly. At that point, most visitors will not own gates, turrets, or trade posts. Demo mode allows visitors to see how the dashboard works even without infrastructure.

### 3.2 Constraints

- Demo mode must be **clearly labeled** in the UI (persistent badge/indicator)
- Demo mode must **not** be confused with real chain telemetry
- Demo mode data must be visually distinguishable from live data
- Demo mode must never be used to generate hackathon proof evidence

### 3.3 Implementation Sketch

The Demo Provider implements the same read interface as the RPC Provider but returns pre-scripted data:

- **Events:** Replayed from a JSON fixture file with configurable timing
- **Object state:** Returned from static snapshots with scripted state transitions
- **Polling simulation:** Events appear at scheduled intervals to simulate the 10-second polling cadence

No chain connection is required. The provider is selected at startup via configuration (e.g., environment variable or URL parameter).

---

## 4. Interface Boundary

The provider abstraction is a **semantic query interface** — not a specific TypeScript interface at this stage. The boundary exists at the React hooks layer:

| Hook | Semantic Query | Provider Implementation |
|------|---------------|------------------------|
| `useOwnedStructures(characterId)` | Discover player's structures | RPC: `suix_getOwnedObjects` → `sui_multiGetObjects` |
| `useStructureState(objectId)` | Read structure state | RPC: `sui_getObject` with `showContent` |
| `useEventPolling(packageId, eventTypes)` | Poll events by type | RPC: `suix_queryEvents` with cursor pagination |
| `useGateRules(configId, gateId)` | Read configured rules | RPC: `suix_getDynamicFields` → `sui_getDynamicFieldObject` |
| `resolveCharacter(walletAddress)` | Map wallet to Character ID | RPC: event query or manual input |

Each hook calls through the active provider. Swapping providers (e.g., RPC → Demo, or RPC → Indexer) changes the implementation without modifying any consuming component.

This aligns with the existing `resolveCharacter()` abstraction pattern documented in the [UX architecture spec](../ux/civilizationcontrol-ux-architecture-spec.md) §12 — generalized to cover all read operations.

---

## 5. Hackathon Strategy

| Decision | Rationale |
|----------|-----------|
| **RPC Provider is the only required implementation** | Minimal infrastructure, deterministic behaviour, compatible with any Sui node, lowest operational risk |
| **GraphQL Provider is intentionally deferred** | Availability on hackathon server unconfirmed; JSON-RPC sufficient for demo |
| **Indexer Provider is intentionally deferred** | Post-submission scaling concern only |
| **Demo Provider is a development/showcase tool only** | Aids repeatable recording and post-launch showcase; never replaces chain evidence |

The read provider abstraction does not increase hackathon implementation complexity. The RPC Provider is functionally identical to a direct-RPC approach. The abstraction is a code organization choice — keeping provider logic behind named hooks rather than scattered across components — that happens to enable future transport switching.

---

## 6. Relationship to Existing Documentation

| Document | Relationship |
|----------|-------------|
| [read-path-architecture-validation.md](read-path-architecture-validation.md) | Options A/B/C map to RPC/Indexer provider implementations. This doc adds the provider interface concept and the Demo Provider. |
| [sui-read-path-options-analysis.md](../research/sui-read-path-options-analysis.md) | Technical analysis of RPC/GraphQL/WebSocket/Indexer capabilities. Informs provider implementation details. |
| [spec.md](../core/spec.md) | §2.2 Read Paths describes the semantic queries. The provider abstraction sits between those queries and the UI. |
| [archived implementation plan](../archive/hackathon-2026/core/civilizationcontrol-implementation-plan.md) | Historical S43 notes describe the React hooks that originally formed the provider interface boundary. |
| [civilizationcontrol-ux-architecture-spec.md](../ux/civilizationcontrol-ux-architecture-spec.md) | Data Source Reference appendix maps data elements to sources. The provider abstraction wraps these sources. |

---

*Created: 2026-03-05. This document establishes the architectural concept. Implementation details will be refined in the hackathon submission repo after March 11.*
