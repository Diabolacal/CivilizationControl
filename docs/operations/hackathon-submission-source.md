# Hackathon Submission Source

Canonical source document for all downstream writing tasks — Deep Surge submission, Discord posts, YouTube descriptions, social copy. Optimized for completeness and reuse.

**Last updated:** 2026-03-30

---

## 1. Project Name

**CivilizationControl**

---

## 2. One-Sentence Summary

CivilizationControl is a browser-based governance command layer that turns EVE Frontier's raw on-chain infrastructure primitives into operator-usable controls for gates, trade posts, turrets, and network topology.

---

## 3. Short Description (2–3 sentences)

CivilizationControl gives EVE Frontier tribe leaders a unified command surface over the infrastructure they own — Smart Gates that control space lanes, Smart Storage Units that power commerce, turrets that enforce defense doctrine, and network nodes that anchor territory. It replaces manual CLI transaction-building with a browser-based control plane backed by a custom Sui Move extension package. Every governance action — setting gate policy, switching defensive posture, listing trade goods, powering structures on or off — is a click-level operation enforced on-chain.

---

## 4. Medium Description (~1 paragraph)

CivilizationControl is the governance command layer for EVE Frontier infrastructure. Built as a Sui Move extension package paired with a React browser frontend, it solves a concrete problem: EVE Frontier gives players real ownership of frontier structures (gates, trade posts, turrets, network nodes), but operating them today means constructing raw Sui transactions by hand. CivilizationControl bridges that gap with a publish-once, configure-via-data architecture. Tribe leaders author gate policy presets (tribe-specific access, per-tribe tolls, default fallback rules), manage SSU-backed storefronts with atomic cross-address buy settlement, switch infrastructure-wide defensive posture in a single transaction, and monitor their entire fleet through a strategic network topology map with live event overlays. No player writes Move code. No backend server — the browser reads directly from Sui RPC and signs transactions client-side via the EveVault wallet.

---

## 5. Long Description (~300–500 words)

EVE Frontier is built on a radical promise: players own and operate the infrastructure that defines the frontier. Smart Gates control who passes through space lanes and what they pay. Smart Storage Units power commerce. Turrets enforce defense policy. Network Nodes anchor territorial presence. But right now, exercising that ownership means constructing Sui Move transactions from the command line or scripting against raw RPC endpoints.

CivilizationControl turns that capability into a usable product.

It is a governance command layer — a custom Sui Move extension package deployed to the Utopia testnet, paired with a browser-based frontend served from Cloudflare Pages. The architecture is publish-once, configure-via-data: one extension package provides the governance logic; operators configure rule types through transactions that write structured dynamic fields. No player writes Move code.

The system implements four core modules:

**GateControl** lets operators author policy presets on Smart Gates — tribe-specific access filters, per-tribe toll amounts, and default fallback rules. Presets are designed once and batch-deployed across multiple gates in a single programmable transaction block. Posture-aware presets swap automatically when the operator changes defensive stance.

**TradePost** enables SSU-backed storefronts with cross-address atomic buy settlement. A buyer pays in EVE coin; the item transfers and revenue settles to the seller's treasury in a single PTB. This works even when the seller is offline — the on-chain state handles settlement without requiring both parties to be present.

**Posture System** provides infrastructure-wide defensive stance switching. Two custom turret extensions (commercial targeting and defense targeting) swap via posture presets. A single PTB re-binds all connected turrets simultaneously, shifting the entire fleet's defensive doctrine in one operation.

**Direct Power Control** handles per-structure and bulk online/offline operations for all structure types, using OwnerCap-only authorization.

The frontend surfaces these capabilities through a strategic network topology map (SVG visualization of the operator's 54-structure fleet with live power state, extension health, and event overlays), a real-time Signal Feed (13 event types folded into human-readable governance digests with transaction proof links), and dedicated control panels for each module.

CivilizationControl has been upgraded 6 times on Utopia testnet using Sui's compatible upgrade policy. All capabilities described above are implemented, deployed, and demonstrated against live chain state — not mocked, not simulated. The demo video shows real transactions producing real on-chain state changes.

The thesis is simple: the infrastructure exists on-chain, but without a command layer to make it usable, ownership is theoretical. CivilizationControl makes governance operational.

---

## 6. Core Feature Bullets

- Gate policy presets with tribe-specific access filters and per-tribe toll amounts
- Batch preset deployment across multiple gates in a single PTB
- Posture-aware preset switching (commercial ↔ defensive)
- SSU-backed trade post storefronts with cross-address atomic buy settlement
- Offline-seller trade (buyer purchases while seller is disconnected)
- Infrastructure-wide posture switch (all turrets re-bound in one PTB)
- Per-structure and bulk online/offline power control
- Extension health detection (stale bindings, missing auth)
- Revenue counter with Lux ↔ EVE normalization
- Strategic network topology map with live power state and event overlays
- Real-time Signal Feed with 13 event types and transaction proof links
- Publish-once, configure-via-data architecture — no player writes Move code

---

## 7. What Is Genuinely Implemented and Validated

All of the following have been executed against Utopia testnet with real transactions:

| Capability | Evidence |
|-----------|---------|
| Gate policy presets (tribe filter + toll) | On-chain dynamic fields, demo video |
| Batch preset deployment | Single PTB deploying to multiple gates |
| Posture-based preset swap | Commercial ↔ Defensive switching with auto-rebind |
| Cross-address atomic buy | Buyer pays EVE → item transfers → revenue to treasury in one PTB |
| Offline-seller trade | Buyer completes purchase with seller wallet disconnected |
| Infrastructure-wide posture switch | All turrets re-bound in single PTB |
| Bulk power control | Multiple structure types toggled in batch |
| Extension health detection | Stale auth detection with re-bind prompts |
| Revenue tracking | Accumulated toll/trade revenue with Lux normalization |
| 54-structure topology view | SVG network map with live state overlays |
| Signal Feed (13 event types) | Real-time event digestion with Sui Explorer proof links |
| 6 compatible upgrades | Additive-only upgrades without breaking deployed state |

---

## 8. Package IDs / On-Chain Identifiers

| Identifier | Value |
|-----------|-------|
| Package ID (v6, current) | `0x656006a3a68da4465dc60efc3a5d72154bdbf2dc31ac9b21c4f9fe475581b941` |
| Package ID (v1, type-origin) | `0xf2f1e8ea4467977c90fbd17d9d54a717f3c2ef58e034ed9e5af29e17f075d22f` |
| GateConfig (shared object) | `0x3695f8978ab8cc36b6ff3ebdf8b8882e2f4d73c5a9cce0918a04d0a6a29a3eee` |
| Upgrade Capability | `0xd373fd5b12516c4fe97ad79bd1920ab01b301cbadca76def86e9aac139486e81` |
| World Package | `0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75` |
| Chain ID | `4c78adac` (Utopia testnet) |
| Upgrade Count | 6 (compatible policy, additive only) |

---

## 9. Deployment URL

- **Production:** https://civilizationcontrol.pages.dev
- **Hackathon branch preview:** https://hackathon.civilizationcontrol.pages.dev
- **Hosting:** Cloudflare Pages (static SPA, no backend)

---

## 10. Demo URL

https://www.youtube.com/watch?v=nSctJ9gfZT4

---

## 11. Repository

- **URL:** https://github.com/Diabolacal/CivilizationControl
- **Judged branch:** `hackathon`
- **Default branch:** `master`

---

## 12. Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Sui Move (edition 2024.beta) |
| Frontend | React 19 + TypeScript 5.8 + Vite 6 |
| Wallet | @evefrontier/dapp-kit (wraps @mysten/dapp-kit-react + EveVault) |
| Styling | Tailwind CSS 4 |
| Data layer | Sui JSON-RPC → @tanstack/react-query |
| Hosting | Cloudflare Pages |
| Architecture | Browser-only SPA, no backend server |

---

## 13. Proof Moments / Differentiators

1. **Governance, not dashboarding.** This is not a block explorer skin. It's a command layer that creates real on-chain governance state — policy presets, posture doctrine, trade settlement — through player-authored transactions.

2. **Publish-once, configure-via-data.** The extension package deploys once. All operator configuration happens through dynamic field writes, not code changes. New rule types compose through preset parameters, not new deployments.

3. **Cross-address atomic settlement.** The trade post module solves a real problem: atomic buy where the buyer pays, the item transfers, and revenue settles to the seller — all in one PTB, even when the seller is offline.

4. **Infrastructure-wide posture switching.** A single transaction re-binds all turret extensions, switching the operator's entire defensive doctrine. This demonstrates real multi-structure governance, not per-object CRUD.

5. **54-structure fleet visualization.** The strategic network map shows the operator's full infrastructure fleet with live power state, extension health, and event overlays — making the normally invisible on-chain state legible at a glance.

6. **6 compatible on-chain upgrades.** The package has been iterated 6 times using Sui's compatible upgrade policy, demonstrating real production-grade contract evolution without breaking deployed state.

7. **No backend dependency.** All reads come from Sui RPC, all writes are signed client-side. The entire app is a static page served from a CDN.

---

## 14. "Why This Matters" Bullets

- EVE Frontier gives players ownership of infrastructure, but no way to govern it without building raw transactions
- CivilizationControl makes that governance operational — policy, commerce, defense, and visibility in a browser
- It proves that on-chain infrastructure can be made genuinely usable, not just technically possible
- The configure-via-data model means new operators can participate without developer tooling
- Atomic cross-address settlement and offline-seller trade solve real commerce problems on-chain
- Infrastructure-wide posture switching demonstrates composed multi-structure governance at scale

---

## 15. Deep Surge Submission Fields

**Project Name:** CivilizationControl

**Tagline/Short Description:**
Governance command layer for EVE Frontier infrastructure — manage gates, trade posts, turrets, and fleet topology from a browser.

**Description (for submission form):**
CivilizationControl is a browser-based governance command layer for EVE Frontier tribe leaders. It turns raw on-chain infrastructure primitives into operator-usable controls: author gate policy presets with tribe-specific access and tolls, run SSU-backed storefronts with atomic cross-address buy settlement, switch infrastructure-wide defensive posture in a single transaction, and monitor fleet topology through a strategic network map with live event overlays. Built as a Sui Move extension package (6 compatible upgrades on Utopia testnet) paired with a React frontend on Cloudflare Pages. No backend, no CLI required — all governance happens in the browser.

**Demo Video URL:** https://www.youtube.com/watch?v=nSctJ9gfZT4

**Repository URL:** https://github.com/Diabolacal/CivilizationControl

**Live URL:** https://civilizationcontrol.pages.dev

**Technologies Used:** Sui Move, React, TypeScript, Vite, Tailwind CSS, @evefrontier/dapp-kit, Cloudflare Pages

**Team Size:** Solo

---

## 16. Discord Post Source Copy

**Title:** CivilizationControl — Governance Command Layer for EVE Frontier Infrastructure

**Post body:**

CivilizationControl is a browser-based command layer that makes EVE Frontier infrastructure actually governable.

What it does:
• Author gate policy presets — tribe-specific access, per-tribe tolls, batch deploy to multiple gates
• Run trade post storefronts — atomic cross-address buy in EVE coin, works offline
• Switch defensive posture — one transaction re-binds all turrets
• Monitor your fleet — strategic network map with live power/health/event overlays
• Signal Feed — 13 event types with Sui Explorer proof links

Built as a Sui Move extension package (v6, 6 upgrades on Utopia testnet) + React browser frontend. No backend, no CLI — everything in the browser.

🎬 Demo: https://www.youtube.com/watch?v=nSctJ9gfZT4
🌐 Live: https://civilizationcontrol.pages.dev
📦 Repo: https://github.com/Diabolacal/CivilizationControl

---

## 17. YouTube Description Source Copy

CivilizationControl — Governance Command Layer for EVE Frontier

CivilizationControl turns the raw power of EVE Frontier's on-chain world contracts into an operator-usable governance surface. Tribe leaders manage Smart Gates, trade posts, turrets, and network topology through a browser — no CLI, no Move code, no manual transactions.

Core capabilities demonstrated:
• Gate policy presets — tribe filters, tolls, batch deployment
• Trade post storefronts — cross-address atomic buy settlement in EVE coin
• Posture switching — infrastructure-wide defensive doctrine in one PTB
• Strategic network map — 54-structure fleet with live state overlays
• Signal Feed — real-time governance events with transaction proofs

Built for the EVE Frontier Hackathon (Deepsurge / CCP Games, March 2026).
Deployed on Sui (Utopia testnet). 6 compatible on-chain upgrades.

🌐 Live app: https://civilizationcontrol.pages.dev
📦 Source: https://github.com/Diabolacal/CivilizationControl
📄 Judged branch: hackathon

Tech: Sui Move + React + TypeScript + Vite + Tailwind CSS + Cloudflare Pages
Wallet: @evefrontier/dapp-kit (EveVault)

---

## 18. Caveats and Terminology Notes

For anyone writing copy about CivilizationControl, these are important accuracy guardrails:

**Terminology:**
- **Utopia testnet** — the EVE Frontier test network. Not "devnet," not "mainnet."
- **Lux** — the in-game display unit for EVE currency. 1 EVE = 1,000,000 Lux. UI shows Lux; on-chain values are in raw EVE (wei-equivalent).
- **PTB** — Programmable Transaction Block. Sui's atomic multi-operation transaction model. When we say "single PTB," we mean multiple operations composed into one atomic transaction.
- **Smart Gate / Smart Storage Unit (SSU)** — EVE Frontier world objects. These are actual on-chain objects with owner capabilities, not metaphors.
- **Extension package** — a Sui Move package that extends world contract objects via the world's hook/extension model. CivilizationControl is an extension package, not a standalone contract.
- **OwnerCap** — ownership capability object. The key pattern for authorization in EVE Frontier. CivilizationControl uses `OwnerCap<Gate>` — there is no centralized admin key.
- **Posture** — the infrastructure-wide defensive stance (commercial or defensive). Not "mode" or "setting."
- **Dynamic fields** — Sui's mechanism for storing structured data on objects. Policy presets, posture state, and treasury config are stored as dynamic fields on gates.

**Accuracy constraints:**
- Do NOT say "mainnet" — the app is on Utopia testnet
- Do NOT say "AI-powered" — there is no AI component
- Do NOT say "decentralized app" without context — it's a browser SPA that talks to Sui RPC
- Do NOT say "DAO" — CivilizationControl is operator governance, not collective voting
- Do NOT imply financial returns or investment characteristics — tolls and trade revenue are in-game mechanics
- Do NOT say "serverless functions" or "API endpoints" — there is no backend
- Do NOT call it a "dashboard" — it is a command layer / control plane
- The demo video shows **real transactions** against **live testnet state** — not mocked data
