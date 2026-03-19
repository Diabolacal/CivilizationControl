# CivilizationControl — The Frontier Control Room

**Retention:** Carry-forward

> *"The frontier doesn't reward the strongest. It rewards whoever builds the infrastructure that everyone else depends on."*

---

## The Problem (In Human Terms)

You lead a tribe of forty pilots in EVE Frontier. You control a dozen gates, a handful of storage units, and a fragile web of network nodes burning fuel around the clock.

Here's what your day looks like:

You wake up, check in, and discover that two of your gates went offline six hours ago because a network node ran dry. Nobody told you. There were no alerts, no warnings — it just stopped working. Hostile pilots used the gap. Two killmails on your people. One was hauling fuel to the station that needed it.

You have eight storage units scattered across three systems. Someone in your tribe asks where the fuel reserves are. You don't know. You'd have to query each SSU individually, manually, one at a time. So you ask around in Discord.

An ally from another tribe wants to trade ammo for fuel cells. There's no marketplace. No escrow. No listings. No trust layer. You could manually coordinate a deposit — you put fuel in an SSU, they put ammo in another SSU — and hope nobody walks away. There is no atomic trade. No receipts. No storefront.

Meanwhile, your gates are open to anyone. You want a simple policy: *free for your tribe, a small toll for allies, closed to hostiles.* But the current system gives you one extension slot per gate. Binary access: everyone in, or everyone out. To do anything more nuanced, you'd need to write Move smart contracts yourself, deploy them, configure each gate individually, and hope you don't break the one your logistics pilots depend on.

**This is the state of infrastructure management on the frontier today.**

Smart assemblies are powerful. The on-chain architecture supports composable access rules, cross-address inventory operations, and atomic multi-step transactions. The primitives are there. But the instruments to wield them — the command layer, the policy builder, the marketplace, the monitoring layer — don't exist.

The gap between "what the blockchain can do" and "what a tribe leader can actually do" is the entire product.

---

## The Vision

**CivilizationControl is the control room that the frontier doesn't have yet.**

Imagine a single screen where you see your entire infrastructure at a glance. Every gate you own, every storage unit, every turret, every network node — listed by name, status, and link state. Green indicators for gates passing traffic. Amber for fuel running low. Red for offline. Turret indicators showing commercial or defense posture.

On one side, your gate policies: who gets in, what they pay, and when. Not as raw contract calls — as toggles, dropdowns, and clear language. *Tribe 7: free passage. Tribe 12: toll required. Everyone else: blocked.* Apply to one gate, or select a group and apply to all.

On the other side, your storefronts. Items stocked in your SSUs, listed with prices, browsable by anyone in range. A buyer clicks. Payment flows. The item transfers. One atomic transaction, no trust required, no coordination in Discord.

In the center, a live Signal Feed. Gate jumps. Purchases. Toll revenue. Turret posture changes. Combat telemetry from controlled systems. Who's coming through your territory, how much they're paying, what they're buying, and where threats are being engaged. Not raw blockchain events — readable, filterable, human information.

**CivilizationControl doesn't add new primitives to EVE Frontier. It takes the primitives that already exist — the extension system, the shared objects, the PTB composition layer — and makes them usable by the people who actually run civilizations.**

This is a control plane for the infrastructure you already own. A way to finally *govern your frontier* — structure by structure, policy by policy.

### Location Constraint — Why List-First, Not Map-First

> **Confirmed constraint (2026-02-16 deep dive):** Structure coordinates are intentionally off-chain. The world-contracts Location struct stores only a 32-byte Poseidon2 hash — **not** raw (x, y, z) coordinates. The hash is irreversible. Wallet authentication does not grant access to raw coordinates. See [authenticated-user-surface-analysis.md §2](../../architecture/authenticated-user-surface-analysis.md).

CivilizationControl is a **control plane over owned structure IDs and on-chain state** — not a map. The gate selector is **list-first** (name/ID/status/links/extension), not map-first. All structure data visible in the Command Overview (status, fuel, extensions, link partners, inventory) is readable on-chain. Location data is not.

Any future map view would require one of:
1. **Server/API coordinate feed** — game server provides hash→coordinate mapping
2. **Manual user pinning** — operator labels structures with positions stored off-chain in app DB
3. **Third-party mapping tools** — community tools that maintain coordinate datasets

These are optional enhancements, not MVP requirements.

> **Update 2026-02-19:** Spatial architecture resolved. Hybrid model adopted: **Strategic Network Map** (CivControl-native SVG topology from manual pins) for operational governance display + **Cosmic Context Map** (EF-Map embed iframe) for EVE Frontier universe grounding. See [Spatial Embed Requirements](../../architecture/spatial-embed-requirements.md) and [UX Architecture Spec §9](../../ux/civilizationcontrol-ux-architecture-spec.md).

---

## Currency Model: EVE, Lux, and On-Chain Settlement

> **Status:** Implemented. On-chain settlement uses `Coin<EVE>` from the EVE Frontier assets package (`0xf0446b93345c1118f21239d7ac58fb82d005219b2016e100f074e4d17162a465::EVE::EVE`). **Lux** (100 Lux = 1 EVE) is the primary player-facing display denomination. **EVE** is the secondary on-chain denomination used in demo narration and proof overlays. Dual-display (Lux + EVE) is valid in dashboard contexts. SUI is hidden gas only.

### How Players Think About Money

- **Lux** is the primary player-facing display denomination (100 Lux = 1 EVE). Players earn Lux, see prices in Lux, and think in Lux. Lux is always displayed first in dual-display contexts.
- **EVE** is the on-chain settlement token. Tolls, trades, and storefront purchases all settle in `Coin<EVE>`. EVE is meaningful to players — it bridges the in-game economy and the chain. Dual-display (Lux + EVE) is valid where dashboard context allows.
- **Gas (SUI)** is a separate concern — the transaction fee for executing on-chain operations. Gas should be abstracted from the player experience. SUI labels do not appear in player-facing UI.

### CivilizationControl UX Implications

| Layer | What Players See | What Happens On-Chain |
|-------|-------------------|----------------------|
| **Toll** | "Toll: 500 Lux" (dual: "5 EVE") | `Coin<EVE>` transfer to treasury |
| **Trade** | "Fuel Rod: 1,000 Lux" (dual: "10 EVE") | `Coin<EVE>` payment in atomic PTB |
| **Revenue** | "Revenue: 4,200 Lux today" (dual: "42 EVE") | Aggregated `Coin<EVE>` receipts |
| **Gas** | Hidden / "Sponsored" | SUI gas fee (separate from settlement) |

### Design Principle

**CivilizationControl uses Lux as the primary player-facing display denomination. EVE is the on-chain settlement token.** Gas fees (SUI) are implementation concerns that the UI abstracts away. Where both values are relevant, the UI displays both (Lux first):

> *Toll: 500 Lux · 5 EVE*
> *Fuel Rod: 1,000 Lux · 10 EVE*

Conversion rate: **100 Lux = 1 EVE = 1,000,000,000 base units**. 1 Lux = 10,000,000 base units.

---

## What It Feels Like to Use

You open CivilizationControl and log in through EVE Vault.

The Command Overview loads and you see your structures listed in the sidebar: six gates, four SSUs, three network nodes. The first four gates show green status — all online, all passing traffic. Gates five and six show amber — fuel below 30% on the connected NWN.

You click into Gate North-3. The policy panel shows your current rules: **Tribe Filter** (Tribe 7 allowed) and **Toll** (200 Lux per jump). Both rules are active, composed as layers — not either/or, but both-and. A small counter shows 47 jumps in the last 24 hours and 9,400 Lux collected in tolls.

You toggle the toll from 200 to 500 Lux. One click. The policy updates on-chain. No Move code, no CLI, no deploy step.

Then you notice the posture indicator at the top of the Command Overview: **Open for Business**. Gates are broadly accessible. Toll is active. Turrets are running commercial targeting — BouncerAuth active, light deterrence engaged. Your forward logistics corridor is generating revenue.

A Discord ping from your scout: hostile fleet spotted two jumps out. Then the Signal Feed confirms it — "Hostile detected — System Alpha-7." On-chain turret proximity data — a ship entered your turret's perimeter, triggering a priority-list recalculation — surfaced as readable intelligence. You click **Defense Mode**. Gate link colors shift from green to amber. Turret icons shift to defense posture. The Signal Feed reflects the change: "Posture: Defense Mode. Gates restricted. Turrets armed." Your gates now admit only Tribe 7. Your turrets swap to DefenseAuth — aggressive targeting, non-tribe pilots prioritized, aggressors at maximum. One click. The frontier locked down.

Then you switch to TradePost. Your forward supply depot — SSU Echo-2 — is listed as a storefront. Four items stocked: fuel rods, repair paste, ammo cells, and a rare lens module. Each has a price in Lux. You see that two fuel rod listings sold overnight. Revenue: 600 Lux. The buyer history shows two different pilots — one from an allied tribe, one unaffiliated. Both paid, both received their items, both transactions settled atomically on-chain.

You stock five more fuel rods and list them at 300 Lux each.

The Signal Feed scrolls quietly in the sidebar. A jump signal from Gate North-1: pilot from Tribe 12, toll paid 500 Lux. A purchase signal from SSU Echo-2: pilot bought repair paste, 200 Lux. A turret posture change: Turret South-1 switched to defense targeting after the posture switch. A fuel warning from NWN-South: estimated 8 hours remaining.

For the first time, you can see your toll and trade revenue in real time — in EVE, the denomination that maps directly to on-chain value. Not in a spreadsheet. Not in Discord messages. On a control surface that shows you what's happening, right now, across every structure you own.

---

## Core Modules

### GateControl — Gate Access Governance

Gates are the arteries of the frontier. Whoever sets the rules on gates shapes who moves through their space — and in a universe where distance is vast and resources are scarce, access policy is power.

GateControl turns gate policy configuration from a technical chore into a governance instrument. A tribe leader doesn't need to understand Move's type system to say: *my gates are open to allies and closed to hostiles.* They don't need to deploy contracts to charge a toll. They don't need to reconfigure twenty gates one at a time.

GateControl is not about access lists. It's about **governance** — the ability to define, in clear terms, who passes through your gates and under what conditions. It plugs into the existing gate extension model and layers composable rules on top of Frontier's jump system, enforced on-chain, trustlessly, without relying on honor systems or Discord agreements.

What's validated and real:
- Tribe-based filtering: matching tribe passes, non-matching tribe is blocked atomically.
- Toll collection: CivilizationControl extension code that transfers payment to the gate operator's address on jump (settled on-chain via `Coin<EVE>`). Toll is implemented in the CC extension's `request_jump_permit`, not in world-contracts — no native toll primitive exists.
- Rule composition: tribe filter AND toll as independent, stackable layers on the same gate, evaluated sequentially by the CC extension.
- Tribe filter tested and passing on devnet. Toll implementation is CC extension code (~30-50 LoC), pending March 11 sandbox validation.

> **Toll implementation note:** World-contracts provides no native toll/fee mechanism for gates. Toll collection is entirely a CivilizationControl extension capability — the CC `request_jump_permit` function accepts a `Coin<EVE>`, validates the amount against a `CoinTollRule` dynamic field, transfers payment to the configured treasury address, and then issues the jump permit via the typed witness. This means toll semantics (who pays, how much, exemptions) are fully under CC's control.

### TradePost — Frontier Commerce

Every frontier eventually needs a market. Not a centralized exchange — a network of storefronts, each attached to a physical storage unit in space, each stocked by its owner, each open to buyers ready to pay.

TradePost turns SSUs into shops. An operator stocks items from their inventory, sets prices (displayed in EVE), and publishes listings. A buyer browsing the storefront sees what's available, clicks buy, and the entire transaction settles atomically on-chain — payment to the seller, item to the buyer, listing marked complete. One signature. No counterparty risk. No coordination. No trust required.

What's validated and real:
- Atomic buy flow: buyer pays, receives item, seller receives payment — single on-chain transaction (`Coin<EVE>`).
- Cross-address item transfer: the extension's typed witness authorizes withdrawal from the seller's SSU without the seller being online.
- SSU-backed storefront: full lifecycle tested — publish, setup, authorize, stock, list, buy.
- Three successful cross-address buys at different prices, each with verifiable on-chain events.

### Posture System — Territorial Defense Posture

Turrets are the defensive infrastructure of the frontier. They anchor to network nodes, draw energy, and engage threats. CivilizationControl ships two custom turret extensions — BouncerAuth (commercial targeting) and DefenseAuth (defense targeting) — and a posture module that swaps between them network-wide.

The Posture System is a binary posture mode: commercial or defense. In commercial posture, turrets run BouncerAuth — light targeting that deters aggressors (+10000 priority) and flags non-tribe pilots (+1000). In defense posture, turrets run DefenseAuth — aggressive targeting that maximizes threat response (aggressors +15000, non-tribe +5000). Turrets remain online in both postures. The posture switch is an extension swap (`authorize_extension<BouncerAuth>` ↔ `authorize_extension<DefenseAuth>`), not a power toggle.

What the Posture System does:
- Swap turret extensions between BouncerAuth and DefenseAuth via `set_posture()`.
- Orchestrate all turrets in a single PTB via posture presets.
- Display turret posture in the Command Overview alongside gates and trade posts.

What the Posture System does NOT do:
- No per-turret targeting customization. Both postures apply network-wide.
- No anchor/unanchor operations. Those are admin-level world-contracts functions.
- No power toggle. Turrets remain online in both postures.

Technical basis:
- Three modules: `posture.move` (PostureKey DF on shared GateConfig, `set_posture()`), `turret_bouncer.move` (BouncerAuth witness, commercial targeting), `turret_defense.move` (DefenseAuth witness, defense targeting).
- `set_posture()` writes the posture mode to a PostureKey dynamic field on GateConfig. Turret extension swaps happen via `authorize_extension<BouncerAuth>` or `authorize_extension<DefenseAuth>` in the same PTB.
- Single-PTB posture switch: one operator action → one transaction → posture DF update + N turret extension swaps.
- Events: `PostureChangedEvent` + N × `DefenseTargetingEvent` or `BouncerTargetingEvent` per turret.
- **Operational prerequisite:** Turrets must be online and anchored to a fueled NetworkNode. The posture switch does not toggle power — turrets remain online in both modes.

> **Note:** The posture switch operates on extension authorization, not power state. Extension swaps via `authorize_extension` require the turret's `OwnerCap` (hot-potato borrow/return pattern). All turrets can be swapped in a single PTB.

### Posture Presets — Governance at the Infrastructure Level

Individual toggles are useful. But a tribe leader managing a dozen gates and half a dozen turrets doesn't want to flip switches one at a time. They want to say: *we're under threat — lock everything down* or *threat's passed — open for business.*

Posture Presets are named configurations that orchestrate gates and turrets together. Two presets ship with MVP:

| Preset | Gates | Turrets | Intent |
|--------|-------|---------|--------|
| **Open for Business** | Broad access — toll active, all paying pilots permitted | BouncerAuth (commercial targeting) | Commerce posture. Maximize traffic and revenue. Light deterrence active. |
| **Defense Mode** | Tribe-only — only matching tribe permitted, no toll needed | DefenseAuth (defense targeting) | Territorial posture. Lock gates to friendlies. Aggressive targeting engaged. |

One click applies the preset across all structures in the operator's infrastructure. The frontend constructs the necessary transactions — gate rule updates and turret state toggles — and executes them.

> **Implementation note:** "One click" means one operator action in the UI. On-chain, this executes as a **single PTB** — validated on local devnet with two gates and two turrets (Strategy A). Extension swaps and gate rule updates compose cleanly: `set_posture` + config DF mutations + per-turret extension authorization swaps, all in one transaction. End-to-end latency: ~2–3 seconds per direction (chain finality ~250ms; remainder is fullnode indexer sync). **Operational prerequisite:** Defense Mode requires the NetworkNode to be fueled and online before turrets can come online; `turret::online()` aborts with `ENotProducingEnergy` otherwise. See [posture-switch localnet validation](../../sandbox/posture-switch-localnet-validation.md) for full evidence.

> **Toll in "Open for Business":** The toll is a CC extension rule, not a world-contracts primitive. The CC extension's `request_jump_permit` evaluates a `CoinTollRule` dynamic field: if present, the jumper must provide sufficient `Coin<EVE>`. In "Open for Business" mode, the tribe filter is removed (or set to allow-all) and only the toll rule remains — any pilot who pays can pass. In "Defense Mode," the tribe filter is set to the operator's tribe and the toll rule is removed — only tribe members pass, free of charge.

> **Subscription Pass:** An optional time-based pass rule. When configured on a gate, pilots can purchase a subscription (e.g., 5,000 Lux for 30 days). Active subscribers bypass the per-jump toll entirely — the dispatch checks the subscription ledger before evaluating the coin toll. This creates a pricing tier: casual travelers pay per jump, regular commuters buy a pass. The subscription ledger is a `Table<ID, u64>` dynamic field mapping character IDs to expiry timestamps. Expired entries remain inert until re-purchased; no cleanup overhead.

### Why They're a System, Not Standalone Instruments

GateControl and TradePost aren't two separate features that happen to ship together. They create a feedback loop:

A gate toll charges for passage through your territory. Where do those pilots spend their funds? At the storefront on the other side. What does the storefront sell? Fuel, ammo, supplies — the things you need to keep jumping, keep fighting, keep surviving. The toll feeds the commerce. The commerce justifies the toll. The operator profits from both sides of the loop.

When a buyer at your TradePost pays 1,000 Lux for a fuel cell — an item that the gate on the other side of the system is also demanding as a toll condition — two modules create emergent economic interaction without explicit coupling. The gate drives demand. The storefront fills it. The tribe leader profits from both.

That's not two instruments. That's an integrated governance suite — gate policy and frontier commerce reinforcing each other.

---

## What Makes This Different

Smart assemblies already exist. Gate extensions already exist. The EVE Frontier builder docs explain how to write a tribe filter, how to create a toll, how to manage SSU inventories. So why does CivilizationControl matter?

**Because the primitives are not the product.**

The primitives are Move modules, typed witnesses, dynamic field dispatch, and PTB composition. They're powerful, elegant, and completely inaccessible to the 98% of tribe leaders who don't write smart contracts.

What doesn't exist yet:
- **No command layer.** No way to see all your structures — gates, turrets, SSUs — their status, their activity, in one place.
- **No policy builder.** No way to configure gate rules without writing Move code.
- **No posture control.** No way to shift an entire infrastructure between commerce and defense in one action.
- **No marketplace.** No way to list items for sale, discover prices, or buy trustlessly.
- **No monitoring.** No way to see toll revenue, gate traffic, turret state, fuel levels, or trade history.
- **No integration.** No way to see how gates, turrets, SSUs, and economy interact as a connected system.

CivilizationControl is not another Move contract demo. It's the missing layer between on-chain infrastructure and the people who operate it. Smart assemblies are already powerful — CivilizationControl makes that power accessible to tribe leaders who shouldn't need to be developers.

**The differentiator is not what it does on-chain. It's what it makes possible for players who never look at a chain.**

---

## Demo Narrative (~2:56 Video)

> **Canonical demo blueprint:** [CivilizationControl — Demo Beat Sheet v2](../../core/civilizationcontrol-demo-beat-sheet.md)
> This section summarizes the 9-beat arc. For full narration scripts, stage directions, evidence overlays, failure fallbacks, and pre-flight checklists, see the beat sheet.

**Arc:** Pain → Power → Policy → Denial → Revenue → Defense Mode → Commerce → Command → Close

### Beat 1 — Pain (0:00–0:18)

*[Screen: black background. White text fades in, one line at a time. No terminal. No UI. Just the words.]*

> "Nine gates link five systems on your EVE Frontier. Last night, two went offline. Nobody told you."

Stark text-on-black. Visceral, specific pain. The viewer must feel the gap before seeing the solution.

### Beat 2 — Power Reveal (0:18–0:38)

*[Hard cut from black to the Command Overview, fully loaded. Structures resolve. Status indicators light green. Posture reads "Open for Business." Signal Feed scrolls.]*

> "CivilizationControl. Every structure you own. Gates, turrets, trade posts, network nodes. Status, policy, revenue — one view."

### Beat 3 — Policy (0:38–1:00)

> "You decide who crosses and what they pay."

Click into a gate → Tribe filter: Tribe 7 → Toll: 5 EVE → Subscription: 50 EVE / 30 days → "Deploy Policy" → "Policy deployed. 3 rules active."

**★ Proof moment:** Policy deploy tx digest + gate object with extension + 3 DF rules.

### Beat 4 — Denial (1:00–1:18)

> "A hostile pilot — wrong tribe — tries to jump. Denied. The chain enforced it. No override. No appeal."

Signal Feed: red badge. Failed tx digest + MoveAbort `(tribe_permit, 0)`.

**★ Proof moment:** Denied tx digest + MoveAbort code.

### Beat 5 — Revenue (1:18–1:36)

> "An ally — right tribe — jumps through. Five EVE collected. Revenue to the operator. The gate pays for itself."

Signal Feed: green badge. Revenue counter increments.

**★ Proof moment:** Toll tx digest + `TollCollectedEvent` + balance delta: operator +5 EVE.

### Beat 6 — Defense Mode (1:36–2:06) — CLIMAX

> "Threat inbound. One click. Gates locked. Turrets armed. One transaction."

*[Posture indicator shifts: "Open for Business" → "Defense Mode." Gate colors shift green → amber. Turret icons shift to defense posture. Signal Feed floods with posture events.]*

30 seconds. The hammer moment. Everything the demo has built — policy, enforcement, revenue — escalates to infrastructure-wide command.

**★ Proof moment:** Single tx digest containing posture change + turret extension swaps. `PostureChangedEvent` + N × `DefenseTargetingEvent`.

### Beat 7 — Commerce (2:06–2:28)

> "A thousand Eupraxite. Ten EVE. Payment to the seller. Item to the buyer. One transaction."

Trade Post storefront → buy → atomic settlement.

**★ Proof moment:** Trade tx digest + `TradeSettledEvent` + buyer/seller balance deltas.

### Beat 8 — Command (2:28–2:43)

> "Toll revenue. Trade revenue. Turrets armed. Every structure reporting. Your infrastructure. Under your command."

Full Command Overview — the operator's entire infrastructure under command.

### Beat 9 — Close (2:43–2:56)

*[Title card fades in:]*

> **CivilizationControl**

No subtitle. No narration. The demo defined what it is.

---

## Why This Wins

### Player Utility — "Meaningfully changes how players operate"

This is the highest-leverage criterion. CivilizationControl solves a problem that every tribe leader currently handles through Discord, spreadsheets, and trust. Gate governance becomes a command surface. Trading becomes a storefront. Infrastructure monitoring becomes a feed. The utility isn't theoretical — it's the difference between 20 manual CLI commands and one screen.

### EVE Frontier Relevance & Vibe — "Natural extension of EVE Frontier"

CivilizationControl doesn't import a concept from another ecosystem. It emerges from EVE Frontier's own design: tribal identity, gate infrastructure, SSU inventories, territorial control. The language is frontier-native. The features map directly to how tribes already organize. It extends the game's own systems, not someone else's template.

### Mod Design — "Not a one-off feature"

Two interconnected modules sharing auth patterns and economic flow. GateControl and TradePost compose as a system — toll revenue drives commercial demand, commerce justifies infrastructure investment. This is system-level design, not a single trick. Judges who've read the docs will recognize the composable dynamic field rule pattern and the cross-address PTB composition as thoughtful architectural choices.

### Concept Implementation — "How well concept translated to working mod"

Everything shown in the demo is real. Seven validation tests passed on devnet. Tribe filters block. Tolls collect. Trades settle atomically. Cross-address operations work. This isn't a mockup with a contract that partially compiles. It's a working system built on validated patterns.

### Creativity & Originality — "Bold, novel, uniquely Frontier"

No one has built a governance layer for EVE Frontier gate and SSU operations. Tribe leaders have structures but no way to see, configure, or monetize them as a unified system. The composable rule engine — stackable tribe filters, tolls, and subscription passes on the same gate via dynamic field dispatch — is a novel pattern that the current builder docs don't demonstrate.

### UX & Usability — "Intuitive and usable in real play"

This is the core thesis. The on-chain primitives exist. The UX doesn't. CivilizationControl is, at its heart, a usability project — turning raw smart contract capability into a control surface that a non-developer tribe leader can operate. Toggle a policy. Stock a storefront. Watch the revenue. No CLI, no Move code, no PTB composition by hand.

### Visual Presentation & Demo — "Clarity and confidence of presentation"

The demo follows a cinematic narrative arc: Problem → Reveal → Control → Economy → System. It opens with the pain (raw CLI), delivers the solution (the control surface), demonstrates the mechanics (gate policy, atomic trade), and closes with the system-level payoff (interconnected economy). The recorded format gives full control over pacing, framing, and storytelling.

### Player Vote (25% of Best Entry Score)

Players vote for mods they want to use. A tribe leader watching the demo will see their own daily pain reflected in the opening — and their fantasy realized in the command view. CivilizationControl is the kind of project that makes a player say "I want that" because it solves a problem they already have. Not a clever toy. An instrument they need.

---

## MVP vs Stretch

### Must Ship (Core — Non-Negotiable)

| Deliverable | Why It's Core |
|---|---|
| **GateControl Move module** — tribe filter + coin toll + subscription pass, composable as dynamic field rules | The gate policy engine is the headline feature. Without it, there's no "control" in CivilizationControl. |
| **GateControl web UI** — toggle-based policy builder for gate rules | Without the UI, GateControl is just another Move contract. The control surface IS the product. |
| **TradePost Move module** — listing CRUD + atomic PTB buy flow | Commerce anchors the economy narrative. Gate tolls without a marketplace is half a story. |
| **TradePost web UI** — browse listings, one-click buy | Same principle: the UI surfaces the value. A contract without a frontend is a demo, not a product. |
| **Posture System UI** — commercial/defense posture switch for owned turrets | Turrets complete the infrastructure surface. Binary posture mode via three CC modules (`posture.move`, `turret_bouncer.move`, `turret_defense.move`). Two custom extensions ship in v2: BouncerAuth (commercial) and DefenseAuth (defense). |
| **Posture Presets** — Open for Business / Defense Mode | Orchestrates gates + turrets in one operator action. Transforms individual structure management into infrastructure-level governance. |
| **Command shell** — structure sidebar, module switching, connected layout | The "control room" framing requires a unified view. Individual screens don't tell the system story. |
| **Live Signal Feed** — gate jumps, trade completions, toll revenue, turret posture changes, threat detection, combat telemetry | Real-time activity turns a static command view into a living control room. Threat signals surface turret `PriorityListUpdatedEvent` data (hostile entered perimeter, aggression detected) as early-warning operator intelligence. Combat signals surface `KillmailCreatedEvent` as confirmation of destruction. Both informational only, no automation. This is the "wow" moment. |
| **Recorded demo video** (2–3 minutes) | Required for submission. The demo IS the presentation for judges and voters. |

### Would Be Amazing (Stretch — In Priority Order)

| Stretch Goal | What It Adds | Condition |
|---|---|---|
| **TribeMint** — faction currency (`Coin<TribeToken>`) | Completes the "tribal economy" narrative; tolls and trades denominated in faction currency instead of `Coin<EVE>`. Enables custom-denomination pricing in a builder-controlled token. Emotionally powerful but adds integration complexity. | Only after both core modules pass a complete demo rehearsal. |
| **LootDrop** — VRF loot crate via on-chain randomness | Adds a "surprise and delight" layer; storefronts can sell mystery crates. Compelling demo moment. | Only if TribeMint is stable. |
| **Stillness deployment** | Earns the "Best Live Frontier Integration" bonus criterion. Shows real-world deployment confidence. | Only if core is polished and time permits. Deferred to post-submission bonus window (14 days post-close). Primary build and evidence uses hackathon test server. |

### Not in Scope (Explicitly Excluded)

- Revenue analytics views (the feed provides live data; historical charts are polish)
- Mobile/responsive layout (desktop-first is fine for demo and hackathon)
- ZK privacy rules for gate access (validated on local devnet; integrated into CivilizationControl as GateControl rule type — see [ZK feasibility report](../../operations/zk-gatepass-feasibility-report.md); to re-validate on hackathon test server March 11)
- Cross-faction diplomatic exchange protocols (fascinating but scope creep)
- Per-turret targeting customization (both postures apply network-wide; individual turret overrides not supported)
- Turret anchor/unanchor operations (admin-level, not player governance)
- Additional posture presets beyond Open for Business and Defense Mode
- Scheduled or automated posture switching (manual operator action only)
- Turret analytics or engagement history

---

## Terminology

| Term | Definition |
|------|-----------|
| **GateControl** | The gate access governance module. Manages tribe filters, toll rules, and subscription passes on gates via the CC extension. |
| **Subscription Pass** | A time-based access pass for a gate. Pilots purchase a subscription (price + duration configured by operator); active subscribers bypass the per-jump toll. Stored as a Table mapping character IDs to expiry timestamps. |
| **TradePost** | The commerce module. Turns SSUs into storefronts with atomic buy settlement. |
| **Posture System** | Binary posture mode for turrets: commercial or defense. Three modules: `posture.move` (PostureKey DF, `set_posture()`), `turret_bouncer.move` (BouncerAuth witness), `turret_defense.move` (DefenseAuth witness). Targeting via extension swap, not power toggle. |
| **Posture Preset** | A named configuration that orchestrates gates and turrets together in one operator action. Two presets ship with MVP: Open for Business and Defense Mode. |
| **Commercial Posture** (turret) | BouncerAuth active. Light commercial targeting — aggressors +10000 priority, non-tribe +1000. Turret remains online and drawing energy. |
| **Defense Posture** (turret) | DefenseAuth active. Aggressive defense targeting — aggressors +15000 priority, non-tribe +5000. Turret remains online and drawing energy. |
| **Anchored** (turret) | Placed in the world and attached to a network node. Anchoring and unanchoring are admin-level operations outside CC scope. All CC turret operations assume turrets are already anchored. |
| **Open for Business** | Posture preset: gates broadly accessible with toll active, turrets in commercial posture (BouncerAuth). Commerce posture. |
| **Defense Mode** | Posture preset: gates restricted to tribe-only, turrets in defense posture (DefenseAuth). Territorial posture. |

---

## One Last Thing

EVE Frontier gives players programmable building blocks and drops them in a hostile, lawless frontier. The game says: *build your civilization.*

But right now, the builders are working blind. The contracts are powerful, the architecture is elegant, and nobody has built the control room that makes any of it usable.

CivilizationControl isn't just the most technically exotic entry in this hackathon — with ZK-verified gate access validated on local devnet (sandbox validation; to re-validate on hackathon test server March 11), it combines zero-knowledge proofs with the practical infrastructure governance that tribe leaders need.

What it does is something simpler and harder: it takes the building blocks that already exist — gates, storage units, tribes, tolls, trades — and turns them into a system that a real tribe leader can see, configure, and profit from. Without writing code. Without trusting strangers. Without flying blind.

The frontier is full of powerful primitives. It's waiting for someone to build the command layer.

**That's what we're building.**

---

*CivilizationControl*
*EVE Frontier Hackathon 2026*
