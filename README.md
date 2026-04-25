# CivilizationControl

**The governance command layer for EVE Frontier infrastructure.**

EVE Frontier gives players real ownership of frontier structures: gates that control space lanes, storage units that power trade, turrets that enforce defense, and network nodes that anchor territory. But actually _operating_ that infrastructure today means hand-building Sui transactions or scripting against raw RPC endpoints.

CivilizationControl makes it usable. It is a Sui Move extension package paired with a browser frontend that turns every governance operation into a click-level action. If you own infrastructure, you can govern it from a browser, without writing Move code, building transactions by hand, or touching a CLI.

> Built for the [EVE Frontier Hackathon](https://www.evefrontier.com/) (Deepsurge / CCP Games, March 2026).
> Deployed on the Stillness testnet.

**[Live App](https://civilizationcontrol.pages.dev)** · **[Demo Video](https://www.youtube.com/watch?v=nSctJ9gfZT4)** · **[Judged Branch](https://github.com/Diabolacal/CivilizationControl/tree/hackathon)**

---

## Why This Exists

The world contracts give you ownership. They don't give you a way to exercise it.

Right now, configuring a Smart Gate's access policy means assembling programmable transactions with the right dynamic fields, package origins, and witness types. Setting up a trade post means understanding cross-address settlement mechanics. Switching your network's defensive posture means rebinding turret extensions one at a time.

CivilizationControl replaces all of that with a product surface. The architecture is **publish-once, configure-via-data**: one extension package provides the governance logic, and operators configure rule types through transactions that write structured dynamic fields. No operator writes Move code. The package was developed and upgraded iteratively on Utopia during the hackathon, then freshly published to Stillness for production use.

Governance operations that require gas can optionally run through a Cloudflare Worker sponsor signer, so operators don't need to hold SUI for routine actions. The sponsor path is configured per-deployment; operations fall back to standard wallet signing when sponsorship is unavailable.

---

## Who This Is For

Anyone who owns EVE Frontier infrastructure and wants to govern it without developer tooling.

---

## Core Modules

| Module | What It Does |
|--------|-------------|
| **GateControl** | Author policy presets on Smart Gates: tribe-specific access filters, per-tribe tolls, and default fallback rules. Presets are authored once and batch-deployed across multiple gates. Posture-aware, so commercial and defensive presets swap automatically when you change stance. Enforced on-chain via typed witness extension. Operators can set the in-game DApp URL on-chain from the app, connecting the gate's web surface to its in-world structure. |
| **TradePost** | SSU-backed storefronts with cross-address atomic buy settlement in `Coin<EVE>`. Buyers purchase directly; items transfer and revenue settles to the seller's treasury in a single programmable transaction block. Works even when the seller is offline. The in-game DApp URL is set on-chain from the app, so buyers reach the storefront directly from the structure in-game. |
| **Posture System** | Infrastructure-wide defensive stance switching. Two turret doctrines swapped via posture presets: commercial (fire only on aggression) and defensive (target non-tribe pilots by default). One PTB switches the posture of all connected structures simultaneously. |
| **Direct Power Control** | Per-structure and bulk online/offline for gates, turrets, SSUs, and network nodes. All operations use `OwnerCap`-only auth. |
| **Strategic Network Map** | SVG topology view of the operator's infrastructure fleet with live power state, extension health, and event overlays. Structure positions are derived from real solar system coordinates, with optional background stars for spatial orientation and operator-lockable layout positioning. |
| **Signal Feed** | Real-time governance event stream across 13 event types, folded into human-readable digests: posture changes, gate policy enforcement, trade settlement, turret response, power state transitions. Each digest links to its Sui Explorer transaction proof. |

---

## What's Validated (On-Chain, Live)

These capabilities are implemented, deployed, and demonstrated against the Stillness testnet:

- Gate policy presets with tribe-specific access and per-tribe toll amounts
- Batch preset deployment across multiple gates in a single PTB
- Posture-based preset switching (commercial ↔ defensive)
- Cross-address atomic buy settlement (buyer pays EVE, item transfers, revenue to treasury)
- Offline-seller trade (buyer purchases from SSU while seller is disconnected)
- Infrastructure-wide posture switch in one PTB
- Per-structure and bulk online/offline power control
- Extension health detection (stale bindings, missing auth)
- Revenue counter with Lux ↔ EVE normalization
- Strategic topology map validated across a live multi-structure network
- Signal Feed with 13 event types and transaction proof links
- On-chain in-game DApp URL configuration for gates and trade posts, set from the app with no manual URL editing
- Sponsored governance transactions via Cloudflare Worker signer (with standard-signing fallback)

---

## On-Chain Identifiers (Stillness Testnet)

| Identifier | Value |
|-----------|-------|
| **Package (v1, current)** | `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` |
| **GateConfig (shared)** | `0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e` |
| **Upgrade Capability** | `0xa2dabc23269bd395305958c49034cbf748e11a598afc7808682739231f2b7cc6` |
| **World Package (original/type-origin)** | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` |
| **World Package (upstream Stillness v2 published-at)** | `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` |
| **Chain ID** | `4c78adac` (Stillness) |

Fresh v1 publish on Stillness — all types share a single package origin, eliminating the multi-version type-origin complexity experienced during iterative development on Utopia.

As of the 2026-04-25 vendor refresh, upstream `world-contracts` records Stillness world v2 metadata. The local app has not yet migrated runtime calls to the v2 `published-at` package; do that in a dedicated runtime-ID pass that preserves original/type-origin IDs for dynamic fields and event type strings.

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
├── contracts/civilization_control/   Sui Move extension package (v1 on Stillness)
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

Post-hackathon direction: [Where CivilizationControl goes next](docs/strategy/civilization-control/where-civilizationcontrol-goes-next.md)

---

## Authority Model

CivilizationControl uses the EVE Frontier owner-capability model for administrative operations. There is no centralized admin key. Each structure owner manages their own infrastructure through their ownership capability. The frontend borrows the owner cap via the character contract's `borrow_owner_cap<Gate>` / `return_owner_cap<Gate>` pattern within a single programmable transaction block.

---

## License

MIT. See [LICENSE](LICENSE).

Vendor submodules retain their own upstream licenses.
