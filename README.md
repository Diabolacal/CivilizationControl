# CivilizationControl

**The governance command layer for EVE Frontier infrastructure.**

EVE Frontier gives players real ownership of frontier structures: gates that control space lanes, storage units that power trade, turrets that enforce defense, and network nodes that anchor territory. But actually _operating_ that infrastructure today means hand-building Sui transactions or scripting against raw RPC endpoints.

CivilizationControl makes it usable. It is a Sui Move extension package paired with a browser frontend that turns every governance operation into a click-level action. If you own infrastructure, you can govern it from a browser, without writing Move code, building transactions by hand, or touching a CLI.

> Built for the [EVE Frontier Hackathon](https://www.evefrontier.com/) (Deepsurge / CCP Games, March 2026).
> Deployed on the Utopia testnet.

**[Live App](https://civilizationcontrol.pages.dev)** · **[Demo Video](https://www.youtube.com/watch?v=nSctJ9gfZT4)** · **[Judged Branch](https://github.com/Diabolacal/CivilizationControl/tree/hackathon)**

---

## Why This Exists

The world contracts give you ownership. They don't give you a way to exercise it.

Right now, configuring a Smart Gate's access policy means assembling programmable transactions with the right dynamic fields, package origins, and witness types. Setting up a trade post means understanding cross-address settlement mechanics. Switching your fleet's defensive posture means rebinding turret extensions one at a time.

CivilizationControl replaces all of that with a product surface. The architecture is **publish-once, configure-via-data**: one extension package provides the governance logic, and operators configure rule types through transactions that write structured dynamic fields. No operator writes Move code. The package has been upgraded repeatedly on Utopia using Sui's compatible upgrade policy, without breaking deployed state.

Governance operations that require gas can optionally run through a Cloudflare Worker sponsor signer, so operators don't need to hold SUI for routine actions. The sponsor path is configured per-deployment; operations fall back to standard wallet signing when sponsorship is unavailable.

---

## Who This Is For

Anyone who owns EVE Frontier infrastructure and wants to govern it without developer tooling.

---

## Core Modules

| Module | What It Does |
|--------|-------------|
| **GateControl** | Author policy presets on Smart Gates: tribe-specific access filters, per-tribe tolls, and default fallback rules. Presets are authored once and batch-deployed across multiple gates. Posture-aware, so commercial and defensive presets swap automatically when you change stance. Enforced on-chain via typed witness extension. |
| **TradePost** | SSU-backed storefronts with cross-address atomic buy settlement in `Coin<EVE>`. Buyers purchase directly; items transfer and revenue settles to the seller's treasury in a single programmable transaction block. Works even when the seller is offline. |
| **Posture System** | Infrastructure-wide defensive stance switching. Two custom turret extensions (commercial targeting, defense targeting) swapped via posture presets. One PTB switches the posture of all connected structures simultaneously. |
| **Direct Power Control** | Per-structure and bulk online/offline for gates, turrets, SSUs, and network nodes. All operations use `OwnerCap`-only auth. |
| **Strategic Network Map** | SVG topology view of the operator's infrastructure fleet with live power state, extension health, and event overlays. Structure positions are derived from real solar system coordinates, with optional background stars for spatial orientation and operator-lockable layout positioning. |
| **Signal Feed** | Real-time governance event stream across 13 event types, folded into human-readable digests: posture changes, gate policy enforcement, trade settlement, turret response, power state transitions. Each digest links to its Sui Explorer transaction proof. |

---

## What's Validated (On-Chain, Live)

These capabilities are implemented, deployed, and demonstrated against the Utopia testnet:

- Gate policy presets with tribe-specific access and per-tribe toll amounts
- Batch preset deployment across multiple gates in a single PTB
- Posture-based preset switching (commercial ↔ defensive)
- Cross-address atomic buy settlement (buyer pays EVE, item transfers, revenue to treasury)
- Offline-seller trade (buyer purchases from SSU while seller is disconnected)
- Infrastructure-wide posture switch in one PTB
- Per-structure and bulk online/offline power control
- Extension health detection (stale bindings, missing auth)
- Revenue counter with Lux ↔ EVE normalization
- Strategic topology map with 54-structure fleet visualization
- Signal Feed with 13 event types and transaction proof links
- Sponsored governance transactions via Cloudflare Worker signer (with standard-signing fallback)

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

The package has been upgraded 6 times using Sui's compatible upgrade policy (additive-only, no breaking changes to public function signatures).

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
| **Sponsor signer** | Cloudflare Worker (optional, for gas-free governance operations) |

The frontend is a static SPA. All chain reads go directly from the browser to Sui RPC. All writes are signed client-side via the connected wallet (or optionally through the sponsor signer for governance operations).

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
npm run dev            # Dev server at http://localhost:5173
npm run typecheck      # TypeScript check
npm run build          # Production build into dist/
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
├── assets/icons/                     SVG glyphs and overlays for topology UI
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

CivilizationControl uses the EVE Frontier owner-capability model for administrative operations. There is no centralized admin key. Each structure owner manages their own infrastructure through their ownership capability. The frontend borrows the owner cap via the character contract's `borrow_owner_cap<Gate>` / `return_owner_cap<Gate>` pattern within a single programmable transaction block.

---

## License

MIT. See [LICENSE](LICENSE).

Vendor submodules retain their own upstream licenses.
