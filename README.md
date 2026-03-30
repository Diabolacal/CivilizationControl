# CivilizationControl

**The governance command layer for EVE Frontier infrastructure.**

CivilizationControl turns the raw power of EVE Frontier's on-chain world contracts into an operator-usable control surface. Tribe leaders manage gates, trade posts, turrets, and network nodes through a browser — no CLI, no Move code, no manual transaction building.

> Built for the [EVE Frontier Hackathon](https://www.evefrontier.com/) (Deepsurge / CCP Games, March 2026).
> Deployed on the Utopia testnet.

**[Live App](https://civilizationcontrol.pages.dev)** · **[Demo Video](https://www.youtube.com/watch?v=nSctJ9gfZT4)** · **[Judged Branch](https://github.com/Diabolacal/CivilizationControl/tree/hackathon)**

---

## Why This Exists

EVE Frontier gives players real ownership of frontier infrastructure — Smart Gates that control space lanes, Smart Storage Units that power trade, turrets that enforce defense policy. But operating that infrastructure today means constructing Sui transactions by hand or scripting against raw RPC endpoints.

CivilizationControl bridges that gap. It is a **publish-once, configure-via-data** extension package on Sui Move, paired with a browser frontend that makes every governance action a click-level operation. One extension package provides the logic; players configure rule types through transactions that write dynamic fields. No player writes Move code.

---

## Core Modules

| Module | What It Does |
|--------|-------------|
| **GateControl** | Author policy presets on Smart Gates — tribe-specific access filters, per-tribe tolls, and default fallback rules. Presets are authored once and batch-deployed across multiple gates. Posture-aware: commercial and defensive presets swap automatically. Enforced on-chain via typed witness extension. |
| **TradePost** | SSU-backed storefronts with cross-address atomic buy settlement in `Coin<EVE>`. Buyers purchase directly; items transfer and revenue settles to the seller's treasury in a single programmable transaction block. Works even when the seller is offline. |
| **Posture System** | Infrastructure-wide defensive stance switching. Two custom turret extensions (commercial targeting, defense targeting) swapped via posture presets. A single PTB switches the posture of all connected structures simultaneously. |
| **Direct Power Control** | Per-structure and bulk online/offline for gates, turrets, SSUs, and network nodes. All operations use `OwnerCap`-only auth — no sponsored transactions needed. |
| **Strategic Network Map** | SVG topology view of the operator's entire infrastructure fleet — gates, trade posts, turrets, NWNs — with live power state, extension health, and event overlays. |
| **Signal Feed** | Real-time governance event stream. 13 event types folded into human-readable digests: posture changes, gate policy enforcement, trade settlement, turret response, power state transitions. |

---

## What's Validated (On-Chain, Live)

These capabilities are implemented, deployed, and demonstrated against the Utopia testnet:

- Gate policy presets with tribe-specific access + per-tribe toll amounts
- Batch preset deployment across multiple gates in a single PTB
- Posture-based preset switching (commercial ↔ defensive)
- Cross-address atomic buy settlement (buyer pays EVE → item transfers → revenue to treasury)
- Offline-seller trade (buyer purchases from SSU while seller is disconnected)
- Infrastructure-wide posture switch (all turrets re-bound in one PTB)
- Per-structure and bulk online/offline power control
- Extension health detection (stale bindings, missing auth)
- Revenue counter with Lux ↔ EVE normalization
- Strategic topology map with 54-structure fleet visualization
- Signal Feed with 13 event types and transaction proof links

---

## On-Chain Identifiers (Utopia Testnet)

| Identifier | Value |
|-----------|-------|
| **Package (v6, current)** | `0x656006a3a68da4465dc60efc3a5d72154bdbf2dc31ac9b21c4f9fe475581b941` |
| **Package (v1, type-origin)** | `0xf2f1e8ea4467977c90fbd17d9d54a717f3c2ef58e034ed9e5af29e17f075d22f` |
| **GateConfig (shared)** | `0x3695f8978ab8cc36b6ff3ebdf8b8882e2f4d73c5a9cce0918a04d0a6a29a3eee` |
| **Upgrade Capability** | `0xd373fd5b12516c4fe97ad79bd1920ab01b301cbadca76def86e9aac139486e81` |
| **World Package** | `0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75` |
| **Chain ID** | `4c78adac` (Utopia) |

The package has been upgraded 6 times using Sui's compatible upgrade policy — additive-only (no breaking changes to public function signatures).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart contracts** | Sui Move (edition 2024.beta) |
| **Frontend** | React 19 + TypeScript + Vite |
| **Wallet** | @evefrontier/dapp-kit (wraps @mysten/dapp-kit-react + EveVault) |
| **Styling** | Tailwind CSS 4 |
| **Data** | Sui JSON-RPC → @tanstack/react-query |
| **Hosting** | Cloudflare Pages (static SPA) |

No backend. All chain reads go directly from the browser to Sui RPC. All writes are signed client-side via the connected wallet.

---

## Local Development

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) (v1.68.1+)
- Node.js 18+ and npm
- Git with submodule support

### Setup

```bash
git clone --recurse-submodules https://github.com/Diabolacal/CivilizationControl.git
cd CivilizationControl

# If already cloned without submodules
git submodule update --init --recursive
```

### Move Contracts

```bash
sui move build --path contracts/civilization_control     # Build
sui move test --path contracts/civilization_control       # Test
sui client active-env                                     # Verify network
```

### Frontend

```bash
npm install            # Install dependencies
npm run dev            # Dev server → http://localhost:5173
npm run typecheck      # TypeScript check
npm run build          # Production build → dist/
```

### Static Data Generation

```bash
npm run generate:solar-systems   # Solar system catalog (24.5k entries)
npm run generate:types           # Item type catalog
npm run generate:tribes          # Tribe catalog from Stillness API
```

---

## Repository Structure

```
CivilizationControl/
├── contracts/civilization_control/   Sui Move extension package (v6)
├── src/                              React frontend application
│   ├── components/                   UI components (topology, controls, feed)
│   ├── hooks/                        React hooks (chain reads, mutations)
│   ├── lib/                          Transaction builders, event parsers, RPC
│   ├── screens/                      Page-level components
│   └── types/                        TypeScript domain types
├── docs/
│   ├── core/                         System spec, implementation plan, demo
│   ├── architecture/                 Design validation, feasibility reports
│   └── strategy/                     Product vision, voice, narrative
├── assets/icons/                     SVG glyphs + overlays for topology UI
├── scripts/                          Data generation, demo tooling
└── vendor/                           Upstream submodules (read-only)
    ├── world-contracts/              EVE Frontier world contracts
    ├── builder-scaffold/             Builder scaffold
    ├── builder-documentation/        Official builder docs
    └── evevault/                     EveVault wallet adapter
```

---

## Key Documentation

| Document | Purpose |
|----------|---------|
| [System Spec](docs/core/spec.md) | Boundaries, on-chain model, risk model |
| [Implementation Plan](docs/core/civilizationcontrol-implementation-plan.md) | Build sequence and dependencies |
| [Demo Beat Sheet](docs/core/civilizationcontrol-demo-beat-sheet.md) | Narrated demo structure |
| [Product Vision](docs/strategy/civilization-control/civilizationcontrol-product-vision.md) | Design intent and product thesis |
| [Claim-Proof Matrix](docs/core/civilizationcontrol-claim-proof-matrix.md) | What's claimed vs. what's proven |
| [Decision Log](docs/decision-log.md) | Chronological record of design decisions |

---

## Authority Model

CivilizationControl uses **`OwnerCap<Gate>`** from the EVE Frontier world contracts for all administrative operations. There is no centralized admin key. Each structure owner manages their own infrastructure through their ownership capability. The frontend borrows the owner cap via the character contract's `borrow_owner_cap<Gate>` / `return_owner_cap<Gate>` pattern within a single programmable transaction block.

---

## License

See [LICENSE](LICENSE).

| Submodule | Purpose |
|-----------|---------|
| `vendor/world-contracts` | EVE Frontier on-chain world contracts — canonical Sui Move code |
| `vendor/builder-scaffold` | Builder scaffold — Docker local devnet, templates, TS/Rust scripts |

## Key Documents

| Doc | Purpose |
|-----|---------|
| [docs/core/spec.md](docs/core/spec.md) | System specification — boundaries, on-chain model, risk model |
| [docs/core/day1-checklist.md](docs/core/day1-checklist.md) | Day-1 chain validation checklist |
| [docs/core/civilizationcontrol-demo-beat-sheet.md](docs/core/civilizationcontrol-demo-beat-sheet.md) | Demo beat sheet — proof moments, recording plan |
| [docs/architecture/gate-lifecycle-function-reference.md](docs/architecture/gate-lifecycle-function-reference.md) | Gate lifecycle complete function reference |
| [docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md](docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md) | Voice & narrative guide |
| [docs/ptb/README.md](docs/ptb/README.md) | PTB pattern library entry point |

## Hackathon Compliance

| Event | Date |
|-------|------|
| Hackathon start | March 11, 2026 |
| Submission deadline | **March 31, 2026, 23:59 UTC** |
| Player voting deadline | April 15, 2026 |

This repository contains original work developed on or after the hackathon start date.

## License

MIT — see [LICENSE](LICENSE).

Vendor submodules retain their own upstream licenses.
