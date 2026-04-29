# CivilizationControl Strategy Memo

**Retention:** Carry-forward

> **Date:** 2026-02-15 (environment model to be confirmed March 11)
> **Type:** Adversarial strategy review — thesis, critique, reconciliation
> **Inputs:** V3 judging-aligned rankings, shortlist recommendations, capability analysis, Sui + EVE Frontier docs
> **Mode:** Analytical. No hype. No default agreement.

---

## 1. Thesis Statement

**Proposal:** CivilizationControl should be the primary hackathon entry — a unified infrastructure governance command surface for EVE Frontier consisting of two tightly integrated Move modules and two stretch modules, submitted as a single cohesive system. *(Scope narrowed from original 3+1 through adversarial review — see §3 and §5.)*

### Core Modules (Non-Negotiable in Thesis)

| Priority | Module | Function | Weighted Score | Risk |
|----------|--------|----------|----------------|------|
| 1 | **GateControl** | Composable gate policy engine — tribe filters, time windows, item tolls via dynamic field rule dispatch within a single extension | 7.97 | Green |
| 2 | **TradePost** | Shared-listing storefront — list items, browse/buy with atomic PTB escrow, SUI-denominated (SSU-backed option architecturally supported, not yet devnet-validated) | 7.91 | Yellow |

### Stretch Modules

| Priority | Module | Function | Weighted Score | Risk |
|----------|--------|----------|----------------|------|
| S1 | **TribeMint** | Faction currency — `Coin<TribeToken>` flows through GateControl tolls and TradePost purchases as economic glue | 6.31 | Green |
| S2 | **LootDrop** | VRF loot crate via `sui::random` — gamified item distribution through TradePost SSUs | 7.53 | Yellow |

### Standalone Side Projects (Considered Separately)

- ZK GatePass (technical flex — validated on local devnet; integrated into CC as GateControl rule type; to re-validate on hackathon test server March 11)
- Salvage Protocol (creative flex)
- Fortune Gate (weird flex)
- Flappy Frontier (meme)

### Assumptions Behind the Thesis

1. System design scores materially higher than one-off mods on ModDesign criterion (12.5% of judge score).
2. GateControl is the strongest "Best Entry" backbone based on weighted composite (7.97).
3. TradePost improves player vote by adding an immediately understood mechanic ("space shop").
4. TradePost provides an immediately understood mechanic ("space shop") that raises player vote appeal.
5. Two tightly integrated modules are planned to ship with high polish within the hackathon timeline; TribeMint and LootDrop are stretch goals that add depth without threatening core delivery.
6. Over-scope is the primary execution risk, managed by strict priority ordering.

---

## 2. Case For the Thesis

### Alignment with Judging Criteria

The 8 judging criteria each carry 12.5% weight (combined 75%), with player vote at 25%. CivilizationControl targets the multiplier effect:

- **ModDesign (12.5%):** A composable system with shared auth, shared data model, and cross-module economic flow is the textbook definition of a 10/10. Single-module entries cap at ~7-8 on this criterion.
- **Concept & Feasibility (12.5%):** Gate access control and field-deployable commerce address real, documented pain points. The grounded analysis confirms Green risks across all validated components — including ZK GatePass (validated on local devnet; to re-validate on hackathon test server March 11). Full gate lifecycle (13 steps, 20 transactions) rehearsed end-to-end on local devnet (2026-02-16); see [gate lifecycle runbook](../../operations/gate-lifecycle-runbook.md) and the [archived reimplementation checklist](../../archive/hackathon-2026/core/march-11-reimplementation-checklist.md).
- **Concept Implementation (12.5%):** Three deployed Move packages with event emission, dynamic field state, and PTB composition demonstrate tangible depth. Template code exists for GateControl's toll pattern.
- **Frontier Vibe (12.5%):** Gate policy is access governance. Field-deployed commerce extends the economic frontier. Faction currencies create tribal identity. All three map to EVE Online's meta-game culture.

### System vs Feature Advantage

Web3 gaming hackathon analysis identifies a consistent pattern: **winners build integrated systems, not isolated features.** A gate policy engine is a feature. A gate policy engine that feeds tolls into a storefront economy denominated in faction currency is an integrated system. The ModDesign criterion explicitly rewards this — "composable system other builders can extend."

### Technical Grounding

Each module exercises distinct Sui primitives:
- **GateControl:** Dynamic fields (rule dispatch), typed witness extension pattern, hot-potato OwnerCap borrow
- **TradePost:** PTB composition (split coin → buy → transfer), shared object inventory
- **TribeMint:** Coin<T> standard, one-time witness, TreasuryCap governance

This breadth positions CivilizationControl for "Best Technical Implementation" as a secondary prize target.

### Demo Clarity

The proposed demo has a clear narrative arc: problem ("you're blind") → progressive capability (gate policy → storefront → economy) → system reveal ("one system, not three standalone instruments"). The climactic moment — a buyer paying SUI toll at the gate, then spending SUI at the nearby storefront for the very item the gate demands — crystallizes the toll→commerce→revenue loop in a single session.

---

## 3. Strongest Critique of the Thesis

### 3.1 Is Three Modules Too Ambitious?

**Yes, probably.** The thesis assumes three Move packages, three UI panels, three test harnesses, and meaningful inter-module integration — all within a hackathon timeline. Standard hackathon completion rates hover around 25-40% of planned scope. Three modules means three failure surfaces, and the weakest module degrades the entire system narrative.

The shortlist document's 7-day implementation plan allocates:
- Days 1-2: GateControl + TradePost de-risking
- Day 3: TribeMint + integration
- Days 4-5: UI + integration polish
- Days 6-7: Demo + buffer

This is tight even with LLM-accelerated iteration. If TradePost's cross-address PTB transfer (marked Yellow) fails de-risking on Day 1, the cascade delay compresses TribeMint and integration.

**Counter-argument the thesis would offer:** The priority ordering means you can ship 1 or 2 modules and still have a competitive entry. This is true, but it means TribeMint is implicitly acknowledged as cuttable — which contradicts calling it "core."

### 3.2 Is TribeMint Weaker Than Assumed?

**The scoring data says yes.** TribeMint (ID 24 / Faction Mint) has:
- **Weighted composite: 6.31** — rank 10 of 28. Barely top third.
- **Player vote: 5/10** — the lowest of the three core modules. Players don't instinctively care about custom currencies until they have a reason to use them.
- **ModDesign: 7** — decent but not distinctive. The `Coin<T>` standard is well-documented and straightforward; judges who know Sui will recognize it as a standard pattern, not novel engineering.

The thesis claims TribeMint is "connective tissue" that elevates the system score. But this assumes judges will appreciate the feedback loop in a 3-minute demo. In practice:
- Faction currency flowing through tolls and trades requires explaining three concepts (currency, toll, trade) before the payoff lands.
- The demo moment ("pays 25 ALPHA_COIN at the TradePost for a trophy — same ALPHA_COIN accepted as gate toll") takes ~40 seconds to set up and deliver. In a 3-minute demo, that's 22% of time budget for a module scoring 6.31.
- The "economic feedback loop" is intellectually compelling but visually unremarkable. A coin balance decrementing from 100 to 75 looks the same whether the coin is SUI or ALPHA_COIN.

**What TribeMint is really providing:** A talking point for judge Q&A ("how do the modules connect?"), not a demo moment. That's valuable, but it does not warrant Priority 3 status.

### 3.3 Would a Single Ultra-Polished GateControl Score Higher?

**Plausibly.** Consider:
- GateControl alone scores 7.97 weighted — already highest individual idea.
- With full polish (5+ rule types, beautiful policy builder UI, live deployment on hackathon test server, ZK privacy rule as differentiator), it could credibly reach 8.5+ weighted.
- A single module means deeper implementation: more rule types, better error handling, edge case coverage, comprehensive events.
- Demo is simpler: 90 seconds of focused "before/after" gate behavior, leaving 90 seconds for system depth and narrative in the recorded video.
- UX can be excellent because all design time goes into one workflow.

**The cost:** ModDesign drops from 10/10 to ~7-8/10 because a single module is a module, not a system. That's a 2-3 point loss on one criterion (12.5% weight), or roughly 0.25-0.38 points of weighted composite. Is that loss offset by gains in Implementation, UX, and Demo from deeper focus? Possibly.

### 3.4 Is Player Vote Overstated in the Thesis Rationale?

**Partially.** Player vote is 25% of total score — significant but not dominant. The thesis claims TradePost "improves player vote" (true — 8/10), but:
- GateControl's player vote is 6/10. For a "primary backbone" module, this is the weakest dimension. Players understand shops; access-list management is boring.
- TribeMint's player vote is 5/10. Custom currency is an abstraction most players don't instinctively value.
- The system's average player vote is (6 + 8 + 5) / 3 = 6.33. TradePost carries this. Without TradePost, it's 5.5.

A focused GateControl + ZK GatePass entry could score 6 + 7 = 6.5 average player vote, comparable to the full suite. The suite's player vote advantage is almost entirely from TradePost — which could also be built as a two-module entry.

### 3.5 Is Integration Complexity Underestimated?

**This is the most dangerous blind spot.** The V3 analysis scores each module individually and then asserts system synergy. But the integration has specific technical challenges:

1. **Coin<T> type parameterization across modules:** For GateControl to accept ALPHA_COIN as toll, the toll rule must know the coin type at compile time — Move's type system requires this. Either GateControl is generic over all coin types (complex), or it's hardcoded to one (fragile), or there's a registry indirection (adds a module). The V3 document waves at this with "gate/SSU integration" but doesn't address the type-resolution problem.

2. **TradePost accepting faction tokens:** Same issue. `Listing` dynamic fields need to specify payment currency. Supporting both SUI and ALPHA_COIN means either two separate buy functions or a generic `Coin<T>` parameter. Neither is free.

3. **Shared dashboard state:** Three modules querying three different object types, with events from three different packages, all rendered in one UI. The off-chain complexity is non-trivial — event aggregation, state synchronization, and multi-package GraphQL queries.

4. **Testing matrix:** 3 modules × 2+ rule types × 2 currencies × owner/non-owner = 12+ test scenarios minimum for integration. On local devnet, each requires manual transaction construction.

None of these are blockers, but each adds 4-8 hours of unanticipated work. Collectively, they could consume an entire day.

### 3.6 Are We Optimizing for Judges at the Cost of Clarity?

**Somewhat.** The V3 analysis is explicitly a judge-prediction model. It optimizes for rubric scores, not for "what will judges actually remember 30 minutes after the demo." Research on hackathon judging suggests:

- Judges remember **one thing** from each entry — the "moment." In a recorded video, this moment can be precisely timed and highlighted.
- Systems with clear "before/after" transformations score higher than systems requiring explanation of interconnections.
- Complexity perceived as over-scope is penalized more than simplicity perceived as focus.

A three-module system with economic feedback loops requires the demo to **teach** three concepts before delivering the payoff. A single-module demo with a dramatic reveal (ZK-gated jump, for example) delivers the moment in 30 seconds and spends remaining time on depth.

---

## 4. Alternative Strategies

### Strategy A: Single-Module Ultra-Polish (GateControl)

**Build:** GateControl as a standalone masterpiece — 4-5 rule types (tribe filter, time window, item toll, SUI toll, ZK privacy proof), web-based policy builder with drag/drop rule composition, live hackathon test server deployment with full evidence chain.

| Criterion | Estimated Score | vs Thesis |
|-----------|----------------|-----------|
| Concept & Feasibility | 9 | Equal |
| Mod Design | 8 | -2 |
| Concept Implementation | 9 | +1 |
| Player Utility | 9 | Equal |
| Frontier Vibe | 9 | Equal |
| Creativity | 8 | +1 (ZK rule) |
| UX & Usability | 9 | +1 |
| Demo | 9 | Equal |
| **Judge Average** | **8.75** | **+0.12** |
| Player Vote | 7 | +1 (ZK wow) |
| **Weighted Total** | **8.31** | **+0.34** |

**Advantages:**
- Maximum certainty of delivery. One package, one UI, one test suite.
- Deeper implementation quality — could include the ZK privacy rule as a differentiator nobody else will have.
- Simpler demo. More time for depth and narrative polish in the recorded video.
- Could still target "Best Technical Implementation" if ZK rule is included.

**Disadvantages:**
- ModDesign ceiling is lower. "Composable module" vs "composable system."
- No economic narrative.
- Doesn't demonstrate Coin<T> or PTB composition — narrower Sui primitive coverage.
- Less material for judge Q&A depth.

### Strategy B: Two-Module Tight Integration (GateControl + TradePost)

**Build:** GateControl + TradePost as a tightly integrated pair. Gate tolls generate inventory items or fees; TradePost sells items near gates. No custom currency — SUI-denominated.

| Criterion | Estimated Score | vs Thesis |
|-----------|----------------|-----------|
| Concept & Feasibility | 9 | Equal |
| Mod Design | 9 | -1 |
| Concept Implementation | 8 | Equal |
| Player Utility | 9 | Equal |
| Frontier Vibe | 9 | Equal |
| Creativity | 7 | Equal |
| UX & Usability | 8.5 | +0.5 |
| Demo | 9 | +1 |
| **Judge Average** | **8.56** | **-0.07** |
| Player Vote | 8 | +1 (TradePost carries) |
| **Weighted Total** | **8.42** | **+0.45** |

**Advantages:**
- Two modules still reads as "system design" — two interconnected structures (gate + SSU) sharing auth and economy.
- TradePost's 7.91 weighted score is substantial. GateControl + TradePost average 7.94 — higher baseline than adding TribeMint (which drags the average to 7.40).
- SUI-denominated trades remove the entire Coin<T> integration challenge.
- Demo is cleaner: "Control who jumps. Sell what they need. Three clicks." Under 2 minutes with room for system narrative and visual polish.
- 40% less code surface means more time for edge cases, error states, and UI polish.

**Advantages over Strategy A:**
- Still earns higher ModDesign for system composition.
- TradePost's player vote (8/10) raises ensemble player appeal.
- Two distinct Sui primitives demonstrated (dynamic fields + PTB composition).

**Disadvantages:**
- No faction currency narrative (but this can be described as "future roadmap" in the presentation).
- TradePost's Yellow risk (cross-address PTB transfer) still exists — but with more time budget to resolve.

### Score Comparison Matrix

| Strategy | Judge Avg | Player Vote | Weighted Total | Modules | Delivery Confidence |
|----------|-----------|-------------|----------------|---------|-------------------|
| **Thesis (3 modules)** | 8.63 | 6.3 | 7.97 | 3 | Medium |
| **A: Solo GateControl** | 8.75 | 7 | 8.31 | 1 | Very High |
| **B: GateControl + TradePost** | 8.56 | 8 | 8.42 | 2 | High |

Note: Thesis weighted total uses the ensemble average from the V3 scoring. Strategies A and B are estimated from the same rubric with adjustments for focus, polish, and reduced integration overhead. These estimates carry uncertainty — take the directional comparison seriously, not the decimal precision.

---

## 5. Reconciled Final Recommendation

### Decision: Modify the Thesis

**Adopt Strategy B (GateControl + TradePost) as the core submission, with TribeMint demoted to first stretch goal ahead of LootDrop.**

### Rationale

1. **TribeMint does not survive critique.** Its weighted score (6.31) is the weakest of the three core modules. Its player vote (5/10) is below average. Its "connective tissue" value is real but modest — a 40-second demo payoff for a module that adds significant integration complexity (Coin<T> type parameterization across packages). The claim that it elevates the system above the sum of its parts is plausible but unproven, and the integration cost is tangible.

2. **Two modules still earns the system narrative.** GateControl (gate extension) + TradePost (shared-listing escrow; SSU extension pattern supported by code analysis but not yet devnet-validated) spans two of the three smart assembly types (turrets implemented via custom extension swap — BouncerAuth/DefenseAuth — in v2 upgrade) with shared auth and a natural economic connection (gate tolls → nearby storefront). Judges will recognize this as system design. The ModDesign drop from 10 to 9 is ~0.125 points of weighted composite — less than the delivery risk of adding a third module.

### CC Governance Preset Mapping (Extension-Swap Posture Modes)

CivilizationControl uses custom turret extensions to control targeting behavior. Posture is managed via extension swap — `BouncerAuth` (commercial) or `DefenseAuth` (defense) — paired with gate policy. Turrets remain online in both postures:

| Posture | Gates | Turrets | Effect |
|---------|-------|---------|--------|
| **Trade** | Open (permit-based, toll rules active) | **BouncerAuth** (commercial) | Commerce-friendly: turrets online but restrained — aggressors targeted (+10000), non-tribe deprioritized (+1000). |
| **Defensive** | Tribe-only (tribe filter active) | **DefenseAuth** (defense) | Territorial lockdown: only tribe members pass; turrets fully armed — aggressors +15000, non-tribe +5000. |

> **Note:** Turrets remain online in both postures — the extension swap changes targeting priorities, not power state. `BouncerAuth` emits `BouncerTargetingEvent`; `DefenseAuth` emits `DefenseTargetingEvent`.

3. **Delivery confidence matters more than peak theoretical score.** A polished two-module system with robust error handling, comprehensive events, and a clean recorded demo will outscore a shaky three-module system with integration bugs. Hackathon judges penalize visible incompleteness more than missing ambition.

4. **TribeMint is a better stretch goal than a core module.** If Days 1-4 go smoothly and GateControl + TradePost are stable, TribeMint can be added in Day 5 as a Coin<T> layer. If not, the core submission is already strong. Either way, TribeMint's existence on the roadmap can be mentioned in the demo's closing 15 seconds as "what's next."

5. **TradePost is the player vote engine.** At 8/10 player vote, TradePost is the most voter-friendly module. Pairing it with GateControl's judge-friendly system narrative creates the broadest scoring base.

### What Changes From the Original Thesis

| Aspect | Original Thesis | Modified Recommendation |
|--------|----------------|----------------------|
| Core modules | GateControl + TradePost + TribeMint | GateControl + TradePost |
| TribeMint status | Priority 3 (core) | Stretch 1 (build if time permits) |
| LootDrop status | Stretch 1 | Stretch 2 |
| Trade denominated in | SUI + ALPHA_COIN | SUI only (ALPHA_COIN if TribeMint ships) |
| Demo length | 3 minutes (5 acts) | 2 minutes (3 acts) + 1 minute system narrative / visual polish |
| Integration complexity | High (3-way Coin<T> plumbing) | Medium (shared auth + event feed) |
| Delivery confidence | Medium | High |

### Final Module Stack

| Priority | Module | Status | Rationale |
|----------|--------|--------|-----------|
| 1 | **GateControl** | Core | Highest weighted score (7.97), Green risk, proven template code |
| 2 | **TradePost** | Core | Second-highest score (7.91), strongest player vote (8/10), extends to second assembly type |
| S1 | **TribeMint** | Stretch | Adds Coin<T> depth if time allows, but not essential for system narrative |
| S2 | **LootDrop** | Stretch | VRF showcase, strong player appeal, only if S1 is stable |

### UX Constraint: List-First Control Plane

> **Confirmed (2026-02-16 auth surface analysis):** Structure coordinates are NOT on-chain — only a Poseidon2 hash is stored. Wallet auth does not grant raw coordinates. Map display is not feasible from chain data alone.

CivilizationControl's dashboard is a **list-first control plane** — structures enumerated by ID/name/status/links, not positioned on a map. Any future map layer requires a server/API coordinate feed, manual user pinning, or third-party mapping tools. The demo and UX framing should reflect this: the gate selector is a structured list with status indicators, not a spatial view. See [authenticated-user-surface-analysis.md §2.5](../../architecture/authenticated-user-surface-analysis.md).

> **Update 2026-02-19:** Spatial architecture resolved via **Hybrid model** — list-first remains primary, supplemented by a CivControl-native SVG topology (Strategic Network Map) + EF-Map embed iframe (Cosmic Context Map). See [Spatial Embed Requirements](../../architecture/spatial-embed-requirements.md).

---

## 6. Scope Discipline Rules

### Non-Negotiable Core (Ship or Don't Submit)

- GateControl Move module: tribe filter + item toll rule types, dynamic field dispatch
- GateControl web UI: policy builder with toggle-based rule configuration
- TradePost Move module: listing CRUD + atomic PTB buy flow
- TradePost web UI: browse listings, one-click buy
- Shared command shell with structure inventory sidebar
- Live event feed showing JumpEvents and TradeEvents

### First Cut (Drop Before Cutting Core Quality)

- TribeMint Coin<T> module + gate toll integration
- Time-window rule type in GateControl
- Revenue tracking analytics
- Responsive/mobile layout

### Second Cut (Drop Before Cutting First Cut)

- LootDrop VRF module
- ZK privacy rule in GateControl *(validated on local devnet; membership circuit implemented, standalone module published; to re-validate on hackathon test server March 11)*
- Cross-faction exchange
- Stillness deployment *(deferred to post-submission bonus window; primary build uses hackathon test server)*

### Hard Stop Conditions

| Condition | Action |
|-----------|--------|
| TradePost cross-address PTB transfer fails de-risking by end of Day 1 | Pivot to Strategy A (Solo GateControl). TradePost becomes stretch. |
| More than 2 modules have unresolved Move compiler errors by end of Day 3 | Freeze scope to what compiles. No new module starts. |
| Demo rehearsal at Day 5 exceeds 4 minutes | Cut the weakest-demoing module entirely. Trim for recorded video. |
| Any module requires >50 lines of mock data to demo | Replace with live on-chain data or cut the module. |

---

## 7. Demo Strategy

> **⚠ Superseded.** This section reflects an earlier 5-act / 2+1-minute demo concept. The canonical demo structure is the **9-beat / ~2:56 arc** in [CivilizationControl — Demo Beat Sheet v2](../../archive/hackathon-2026/core/civilizationcontrol-demo-beat-sheet.md). Retain this section for historical context only.

### Aligned to Modified Recommendation (2+1 Minutes)

> **Format:** Recorded demo video for Deepsurge submission. Script the flow, pre-deploy state, record with screen capture, and edit for clarity. Multiple takes expected.

**Pre-deployed state:** 2 linked gates, 1 SSU (near Gate Alpha), 1 NWN (fueled), 3 characters (2× Tribe Alpha, 1× Tribe Beta), 5 test items of varying types, 50 SUI distributed.

**Act 1 — "The Problem" (0:00–0:20)**
> "You've deployed gates and a storage unit in the frontier. But you have no control and no economy. CivilizationControl changes that."

Open Command Overview → structure cards show status → click Gate Alpha → currently open to everyone.

**Act 2 — "Control" (0:20–1:00)**
> "Let's make Gate Alpha smart."

Open GateControl panel → enable Tribe Filter (Alpha only) → enable Toll (Item Type 42) → click "Deploy Policy" → single PTB executes.

- **Tribe Alpha member with Item-42:** Access granted ✓ → item consumed → access event in feed *(Note: devnet validated `request_access()` → `AccessGrant`; integration with `issue_jump_permit` → `JumpPermit` → `jump_with_permit` is code-analysis supported but not yet devnet-tested)*
- **Tribe Beta member:** Denied ✘ → "Access Denied"

> "One extension. Composable rules. Configured from a browser."

**Act 3 — "Commerce" (1:00–1:40)**
> "Now let's monetize the outpost."

Switch to TradePost → create 2 listings (Rare Component: 10 SUI, Fuel Cell: 5 SUI) → buyer browses → clicks "Buy Fuel Cell" → PTB: split coin → buy → item transfers → TradeEvent in feed.

> "Atomic, trustless commerce at a player-deployed structure. The first frontier storefront."

**Act 4 — "The System" (1:40–2:00)**
> "Same auth. Same command view. Two assembly types — gates and storage units — one control plane. Gate policy feeds demand. Storefront fulfills it. This is CivilizationControl."

Command Overview wide shot — structures, events scrolling, both modules active.

**The Moment:** When the buyer pays SUI for the Fuel Cell — an item the gate toll is also demanding — judges see two modules creating emergent economic interaction without explicit coupling.

**Remaining 1:00:** System narrative wrap-up, visual command-surface showcase, and "what's next" roadmap slide. (If a live Q&A format is offered, this segment can be adapted for audience interaction.)

### If TribeMint Ships (Stretch Demo Insert)

Insert 30 seconds between Act 3 and Act 4:
> "Where does loyalty come in?" → Mint ALPHA_COIN → relist Trophy at 25 ALPHA_COIN → buy → same currency accepted as gate toll. → "Every tribe can have its own economy."

---

## 8. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **TradePost cross-address PTB transfer fails** — `deposit_item<Auth>()` may not support buyer-to-SSU item transfer in the way the storefront model assumes | Medium | Critical — TradePost is unusable | Day-1 de-risk on local devnet. If it fails, pivot to Strategy A (solo GateControl). The `deposit_item` function is extension-mediated and doesn't require proximity proof — but the item transfer path needs validation. |

> **v0.0.15 update:** Risk CONFIRMED. `deposit_item<Auth>` now validates `parent_id` — items can only return to origin SSU. Cross-player delivery must use `deposit_to_owned<Auth>` instead.
| 2 | **Demo recording discipline** — a poorly structured or unclear recorded demo undermines the system narrative just as much as a live failure would | Medium | High — judges see a confusing video, not a polished system | Storyboard the full flow before recording. Script each segment. Pre-deploy all state on devnet. Record multiple takes and select the best. Add captions and annotations in post-production. |
| 3 | **Scope creep into TribeMint** — "just one more day" pulls effort from core polish | Medium | Medium — degrades GateControl/TradePost quality | Hard rule: TribeMint starts only after both core modules pass a complete demo rehearsal. No exceptions. |
| 4 | **`sui::random` calling convention blocks LootDrop** — `entry` function constraint prevents PTB composition with storefront flow | Low | Low — LootDrop is S2 stretch | Test calling convention early. If blocked, LootDrop uses hash-based pseudo-random fallback or is cut entirely. |
| 5 | **AdminACL/sponsored tx misconfiguration** — sponsored transactions require AdminACL registration; hackathon test server may provide GovernorCap access, Stillness (live server) requires CCP cooperation | High (if attempting Stillness) | Medium — demo falls back to hackathon test server or local devnet | Default to hackathon test server (from March 11) for build and evidence. Stillness deployment deferred to post-submission bonus window (14 days post-close). Local devnet as fallback where GovernorCap is available. |

---

## 9. Standalone Decision

### Pick: ZK GatePass

**Justification:**

1. **Differentiation.** No other hackathon entry will have ZK-gated game infrastructure. The technical moat is real — Groth16 proof generation, on-chain verification, and gameplay integration is a 3-layer achievement.

2. **Existing foundation.** The `eve-frontier-proximity-zk-poc` in this workspace is a working proof-of-concept with Circom circuits, browser-side proof generation via snarkjs, and Move verification code. The gap is integration with the gate extension pattern, not building from scratch.

3. **Prize targeting.** ZK GatePass is ranked #1 for "Best Technical Implementation" and #2 for "Most Creative" in the bonus prize analysis. These are distinct prizes from "Best Entry" — a standalone ZK submission does not cannibalize CivilizationControl's primary prize target.

4. **Risk containment.** All ZK primitives validated on local devnet (sandbox). Standalone `zk_gate` module published with zero world-contracts dependencies. Membership circuit (depth 10, Poseidon(2), 2,430 constraints) implemented and verified on-chain. No remaining feasibility risks — only world-contracts integration remains (to re-validate on hackathon test server March 11). See [ZK feasibility report](../../operations/zk-gatepass-feasibility-report.md) §2.2.

5. **Demo impact.** "'Generating zero-knowledge proof...' → proof verified on-chain → gate opens → and the blockchain never learned who you were." This is a 30-second moment that lands with any audience. High variance, high reward.

**Why not Salvage Protocol:** While Salvage Protocol (ranked #1 Most Creative) is the most novel concept, it requires calling `unanchor()` — an admin-only function. On testnet, you'd need AdminCap access, which may not be available. ZK GatePass operates at the extension layer, which is builder-accessible.

**Why not Fortune Gate:** Weighted score 5.38. Fun but insubstantial. Not worth the opportunity cost.

**Constraint:** ZK GatePass should only be pursued if CivilizationControl's core (GateControl + TradePost) is fully stable before Day 5. If it threatens core polish, cut it.

---

## Summary of Findings

| Question | Answer |
|----------|--------|
| **Final recommended core modules** | GateControl + TradePost (two-module tight integration) |
| **Does TribeMint survive critique?** | No, as a core module. Demoted to Stretch 1. Its weighted score (6.31) is below average, its player vote (5/10) is weak, and Coin<T> cross-module integration complexity makes it a poor risk/reward trade for core status. It becomes valuable stretch if time permits. |
| **Is standalone ZK/Salvage still advised?** | Yes — ZK GatePass, conditional on core stability. Targets "Best Technical Implementation" without competing with CivilizationControl's "Best Entry" positioning. Salvage Protocol is less viable due to AdminCap dependency. |

---

## UI Naming & Demo Alignment

All UI-facing labels, navigation, page titles, headings, empty states, and demo narration must follow the canonical voice and narrative guide:

> **[CivilizationControl — Voice & Narrative Guide](civilizationcontrol-voice-and-narrative.md)**

Key mandate: CivilizationControl communicates **calm authority, sovereignty, and governance** — not generic SaaS vocabulary. Evaluate every player-facing label against the mapping table and apply the Narrative Impact Check before finalizing UI or demo surfaces. This rule does not apply to internal technical documentation, README files, or vendor code.
