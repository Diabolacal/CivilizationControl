# CivilizationControl

A **browser-only governance command layer** for EVE Frontier tribe leaders. Built on Sui Move for the EVE Frontier hackathon (Deepsurge / CCP Games, March 2026).

## What It Does

CivilizationControl gives tribe leaders a unified command surface over the structures they own — gates, storefronts, turrets, and network nodes — without writing any code.

| Module | Purpose |
|--------|---------|
| **GateControl** | Author policies (tribe filter + coin toll) on Smart Gates. Enforced on-chain via typed witness extension. Tribe autocomplete selector for policy authoring. |
| **TradePost** | SSU-backed storefronts with cross-address atomic buy settlement using `Coin<EVE>`. |
| **Posture System** | Two custom turret extensions (commercial + defense targeting) swapped via posture presets. Single-PTB infrastructure-wide posture switch. |
| **Direct Power Control** | Per-structure and bulk online/offline for gates, turrets, SSUs, and network nodes. All operations use OwnerCap-only auth (no sponsored transactions needed). |

**Architecture:** Publish-once, configure-via-data. One extension package publishes the governance logic. Players configure pre-built rule types via transactions that write dynamic fields. No end user writes Move code.

## Tech Stack

- **Move** (Sui edition 2024.beta) — on-chain extension package
- **React + TypeScript + Vite** — frontend SPA
- **@evefrontier/dapp-kit** — wallet adapter
- **Tailwind CSS** — styling
- **Cloudflare Pages** — static hosting

## Quickstart

### Prerequisites

- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) installed
- Node.js 18+ and npm
- Git with submodule support

### Setup

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>
cd CivilizationControl

# If already cloned without submodules
git submodule update --init --recursive

# Build Move contracts
sui move build --path contracts/civilization_control

# Run Move tests
sui move test --path contracts/civilization_control

# Verify active Sui environment
sui client active-env
```

### Frontend

```bash
npm install            # Install dependencies
npm run dev            # Vite dev server (http://localhost:5173)
npm run typecheck      # TypeScript check
npm run build          # Production build → dist/
npm run preview        # Preview production build
```

### Static Data Generation

```bash
npm run generate:solar-systems   # Refresh solar system catalog (24.5k entries)
npm run generate:types           # Refresh item type catalog
npm run generate:tribes          # Refresh tribe catalog from Stillness API (optional enrichment)
```

## Repository Structure

```
CivilizationControl/
├── .github/              Agent guardrails, instructions, prompts, skills
├── .vscode/              Editor config, tasks, prompts
├── assets/icons/         SVG glyphs + overlays for topology UI
├── contracts/
│   └── civilization_control/   Move extension package
├── docs/
│   ├── core/             System spec, implementation plan, demo beat sheet
│   ├── architecture/     Design validation docs
│   ├── strategy/         Voice, narrative, product vision
│   ├── analysis/         Assumption registries, fragility audits
│   ├── validation/       Pre-start validation evidence
│   ├── ux/               UX architecture, SVG specs
│   ├── ptb/              PTB pattern library (revalidation required)
│   ├── operations/       Runbooks, templates
│   └── demo/             Narration specs
├── templates/cloudflare/ Deployment scaffold
└── vendor/               Upstream submodules (read-only)
    ├── world-contracts/  EVE Frontier on-chain world contracts
    └── builder-scaffold/ Builder scaffold (devnet, templates, scripts)
```

## Vendor Submodules

Submodules under `vendor/` are **read-only upstream references**. Never commit, modify, or create tracked files inside them.

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
