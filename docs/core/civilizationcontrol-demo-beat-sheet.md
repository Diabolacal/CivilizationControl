# CivilizationControl — Demo Beat Sheet v2

**Retention:** Carry-forward

> Competitive demo blueprint for the CivilizationControl hackathon submission video.
> Arc: Pain → Power → Policy → Denial → Revenue → Defense Mode → Commerce → Command
> Target duration: **~3:04** (hard ceiling 3:05)
> Sources: v1 beat sheet, product vision, emotional objective, voice guide, claim-proof matrix, posture-switch validation, judging criteria digest, Phase 2 recording validation (2026-03-29)
> Last updated: 2026-03-29 (gate count, currency, tribe naming, capture validation pass)

---

## Narrative Spine

> A frontier operator wakes up to chaos. By the end of this demo, every gate, turret, and trade post is under sovereign command — policy enforced, hostiles denied, revenue flowing, and the entire network locked down in one click.

**Arc:** Pain → Power → Policy → Denial → Revenue → Defense Mode → Commerce → Command

**Structure counts (validated 2026-03-29):** 10 gates, 10 governed, 2 trade posts, 36 turrets, 6 network nodes (54 total structures).

This is not a feature tour. It is three minutes of escalating authority. Each beat raises the stakes. The climax is Defense Mode — one action, infrastructure-wide state change, chain-enforced. Everything that follows proves the system pays for itself.

---

## Voice Rules

| Use | Never Use |
|---|---|
| Command Overview | Dashboard |
| Signal Feed | Notifications / Activity Log |
| Structures | Objects / Smart Assemblies |
| Operator | User / Admin |
| Deploy | Save / Submit |
| Posture | Mode / Setting |
| Denied | Rejected / Failed |

**Tone:** Mission control. Measured confidence. No hedging, no celebration, no jargon. The narrator describes outcomes, not mechanics. Every sentence earns its time.

---

## Six Non-Negotiable Proof Moments

If stability forces cuts, protect these six. Everything else is expendable.

| # | Proof Moment | Beat | What It Proves | Live or Post-Prod |
|---|---|---|---|---|
| 1 | Policy preset deployed to multiple gates (batch PTB) | Beat 3 | Governance written on-chain via UI — one action, N gates | Live — Signal Feed shows PolicyPresetSetEvent per gate |
| 2 | Hostile denied — MoveAbort | Beat 4 | Chain enforcement, no appeal | Post-prod overlay — operator dashboard cannot observe other wallets' failed txs |
| 3 | Toll collected — balance delta | Beat 5 | Revenue flows to operator atomically | Live — Transit Proof button fires TollCollectedEvent in Signal Feed |
| 4 | Defense Mode — single tx digest containing posture + turret extension swaps | Beat 6 | Infrastructure-wide state change, one click | Live — PostureChangedEvent + ExtensionAuthorizedEvent in Signal Feed |
| 5 | Trade settlement — buyer/seller balances | Beat 7 | Atomic commerce, no trust required | Live — ListingCreated + ListingPurchased events |
| 6 | Player marketplace — SSU DApp URL | Beat 7 | Players interact with commerce posts from in-game browser | Live — player-facing /ssu/:id marketplace page |

---

## Transaction Latency Protocol

- Narrator stays ~2 seconds ahead of UI. Describe intent as the tx confirms, not after.
- If confirmation >3 seconds: continue narration. Never pause mid-sentence.
- If confirmation >5 seconds: hold on Signal Feed (always has prior entries). Retake the beat.
- Proof overlays appear ONLY after confirmation resolves on-screen. Never overlay an unresolved digest.

---

## Evidence Framing Principle

**CC claims command over infrastructure, not omniscient visibility.** When an action happens outside the operator's wallet — hostile denied at a gate, turret engages an outsider — the operator's dashboard has no direct signal. The chain enforces the policy silently.

Demo framing for these moments uses two techniques:

1. **Post-prod inset** (Beat 4): Pre-captured footage from the hostile's perspective, shown as a brief cut or overlay. The operator's dashboard is unchanged — that's the point.
2. **World footage** (Beat 6): In-game world view showing the physical consequence — turret fires, outsider destroyed. The operator set the doctrine; the world enforced it.

Both techniques are honest. They show real chain enforcement without fabricating dashboard telemetry. The product claim is *"I set policies; the chain enforces them"* — not *"my dashboard shows me everything that happens."*

---

## Beats

### Beat 1 — Pain (0:00–0:22)

**Duration:** 22 seconds (extended — slower delivery accepted, 2026-03-29)

**Spoken narration:**
> "Ten gates link five systems on your EVE Frontier. Last night, two went offline. Nobody told you. Your pilots rerouted through hostile territory. Hostiles caught them hauling fuel."

*[Screen: black background. White text fades in, one line at a time, matching narration cadence. No terminal. No UI. Just the words.]*

> "Every rule, every gate — a manual transaction. You have ten gates."

*[Beat. Text: "No visibility. No alerts. No control."]*

**On-screen:** Stark text-on-black. Optionally: a single raw CLI error screenshot flashes for 1 second before cutting to black again.

**Evidence:** None. This is the "before."

**Purpose:** Visceral, specific pain. Not abstract — personal ("your pilots died"). The viewer must feel the gap before seeing the solution.

**Visual direction (locked):** Text-on-black only. No UI, no terminal, no props. White text fades in one line at a time, synchronized to narration cadence. Brief pause (500ms) before the final "You have ten gates" to let viewer absorb the multiplication. 2560×1440 with generous letter-spacing for cinematic weight. The hard cut to Beat 2 should have zero transition — black frame, then Command Overview.

> **Command-count audit (2026-03-29):** The prior "thirteen commands" claim originated from `gate-lifecycle-runbook.md`, which documents 13 top-level steps for the *full lifecycle from world-package publish to first jump*. However, steps 1–5 are one-time world/admin setup that a tribe leader never performs — those are CCP/world-operator responsibilities. The per-gate policy configuration burden (what CC replaces) is 4–6 CLI transactions: authorize extension, set commercial preset, set defense preset, set treasury, plus verification reads. The specific number was replaced with a structural pain claim — "every rule, every gate — a manual transaction" — which is unchallengeable and emphasizes the per-gate repetition without a number that could be contested. See decision log 2026-03-29.

---

### Beat 2 — Power Reveal (0:22–0:42)

**Duration:** 20 seconds

**Spoken narration:**
> "CivilizationControl."

*[Hard cut from black to the Command Overview, fully loaded. Structures resolve — gates, turrets, trade posts, network nodes. Status indicators light green. Posture reads "Open for Business." Signal Feed scrolls with recent events.]*

*[Hold 2 seconds. Let the interface breathe.]*

> "Every structure you own. Gates, turrets, trade posts, network nodes. Status, policy, revenue — one view."

*[Camera moves slowly across the Command Overview: structure registry left, aggregate metrics center, Signal Feed right.]*

**On-screen:** Command Overview, fully populated. Package ID badge in corner.

**Evidence:** Package ID overlay: `[submission-package-ID]`

**Purpose:** Emotional pivot. Black despair → calm authority. The operator's frontier is under command. This is not a tool reveal — it is a power reveal.

**Capture note (2026-03-29):** Map camera angle and lock persist via localStorage (validated). Frame the topology once during setup; all subsequent captures reuse the same angle. The map lock button ("lock" label, top-right of map panel) freezes all orbit/zoom/pan. Posture should read "Commercial" at this point. Structure counts visible: "10 Gates / 10 Governed / 2 Posts / 6 Nodes."

**Visual direction (locked):**
- **Shot 1 (0:18–0:20):** "CivilizationControl." Hard cut from black to Command Overview. No transition effect — the cut IS the effect. Full viewport, fully loaded.
- **Shot 2 (0:20–0:22):** Hold. 2 seconds of silence. Let the interface breathe. No narration.
- **Shot 3 (0:22–0:32):** "Every structure you own…" Hold on the full Command Overview. Structure counts (top), metric cards, topology map, Signal Feed all visible at native resolution. No camera movement — let the viewer read the interface.
- **Shot 4 (0:32–0:38):** "Status, policy, revenue — one view." Continue hold. The Command Overview earns the line — everything it claims is already visible.
- **Emphasis:** No zoom, no crop, no dim, no pan. The hard cut from black is the only dramatic device. The Command Overview fills the screen at native resolution. Let it carry the moment.
- **Silence window:** 2 seconds after "CivilizationControl" (0:20–0:22).

**Three-Second Check:**
- What am I governing? Policies visible ✓
- What is under my authority? Structure registry ✓
- What is producing value? Revenue counter ✓
- What is at risk? Status indicators ✓

---

### Beat 3 — Policy (0:42–1:08)

**Duration:** 26 seconds

**Spoken narration:**
> "You decide who crosses — and what each tribe pays."

*[Click into a gate. Gate Directive panel opens. Commercial tab active. Three named tribes visible with differentiated toll rates: Static Conclave at 1,000 Lux, Wartime Republic at 25,000 Lux, Peaceful Trade Empire at 5,000 Lux. Default rate for all others: 10,000 Lux.]*

*[Hold 3 seconds. Let the viewer read the tiered pricing table.]*

> "Allies at a thousand. Rivals at twenty-five thousand. Everyone else — the default."

*[Operator clicks "Apply to All Gates (9)." Wallet popup appears briefly (separate window). Transaction confirms.]*

> "One directive. Applied across the network."

*[Signal Feed: PolicyPresetSetEvent entries cascade — one per gate.]*

**On-screen:** Gate detail → Gate Directive panel (Commercial tab) → tiered tribe pricing table → "Apply to All Gates (9)" → Signal Feed cascade.

**Exact operator action sequence:**
1. Navigate to gate detail (click gate name or topology node)
2. Gate Directive section is immediately visible — no extra navigation
3. Commercial tab is active by default — tiered pricing already configured
4. Camera/viewer reads the existing tribe entries for 3 seconds
5. Click "Apply to All Gates (9)" button in "Deploy to Other Gates" section
6. Wallet popup appears (separate OS window — does not contaminate viewport)
7. Approve transaction
8. Signal Feed shows PolicyPresetSetEvent cascade

**Visual direction (locked):**
- **Shot 1 (0:38–0:42):** Gate Directive panel, Commercial tab. Hold on the tribe pricing table. No narration yet — let the visual register. 3-second silence window.
- **Shot 2 (0:42–0:49):** Hold on tribe table. Narrate: "Allies at a thousand. Rivals at twenty-five thousand. Everyone else — the default." Each amount should be visually readable as narrator speaks it.
- **Shot 3 (0:49–0:54):** Hold widens to include "Apply to All Gates (9)" button. Operator clicks. Wallet popup is ignored (separate window).
- **Shot 4 (0:54–1:00):** Cut to Signal Feed. PolicyPresetSetEvent entries cascade in — one per gate. Hold 2 seconds on the cascade. Narrate: "One directive. Applied across the network."
- **Shot 5 (1:00–1:04):** Brief hold on full gate detail showing confirmed directive. Transition to Beat 4.
- **Emphasis:** Static holds. No zoom, no dim, no crop. The tribe pricing table and the batch-apply button are intrinsically readable. The Signal Feed cascade is the only motion.
- **Silence window:** 3 seconds (0:38–0:41) before first narration line. Let the policy table speak for itself.

**Evidence overlay (post-production):**
- Tx digest of batch preset deployment (single PTB, N gates)
- Signal Feed showing PolicyPresetSetEvent for each gate
- "Apply to All Gates (9)" button visible with gate count
- Toll rate spread visible: 1,000 / 5,000 / 25,000 / 10,000 Lux

**Purpose:** Core governance claim — the operator sets *differentiated commercial policy per tribe*. This is not binary allow/deny. This is tiered economic governance: trusted traffic moves cheap, rivals pay premium, unknowns pay the default. The UI proves the operator has granular control AND can deploy network-wide in one action. The batch apply across 9 other gates is the conversion moment: manual per-gate CLI → one click.

**Why tiered pricing is the stronger claim (2026-03-29):** The previous narration ("Tribe filter: only your allies. Toll: one thousand Lux per jump.") described binary access with a flat toll. The actual UI — confirmed by operator screenshot — demonstrates tiered commercial pricing with four distinct rates. This is a fundamentally stronger governance claim: the operator doesn't just allow or block — they set economic policy at tribal granularity. The screenshot showing Static Conclave (1,000 Lux), Wartime Republic (25,000 Lux), Peaceful Trade Empire (5,000 Lux), and default (10,000 Lux) is canonical evidence.

**Scope note (2026-03-18):** Freeze and Subscription Pass are intentionally excluded from the live demo. Freeze is irreversible and permanently breaks posture switching on turrets (see `extension-freeze-safety-guide.md`). Subscription Pass is not implemented.

---

### Beat 4 — Denial (1:08–1:26)

**Duration:** 18 seconds

**Spoken narration:**
> "A hostile pilot — wrong tribe — tries to jump."

*[CC gate detail on screen — active tribe filter visible. The operator's policy is in frame.]*

*[Brief inset (post-prod): hostile wallet view. The transaction fails. MoveAbort. Red error.]*

> "Denied. The chain enforced it. No override. No appeal."

*[Return to CC. Gate detail unchanged. The operator's infrastructure never noticed — the chain handled it silently.]*

**On-screen:**
1. CC gate detail showing active tribe rule — the operator's policy is visible.
2. Inset cut (post-prod): hostile wallet or Sui explorer showing the failed transaction (MoveAbort).
3. Return to CC — gate detail unchanged. No Signal Feed entry. The chain enforced the policy without the operator lifting a finger.

**Evidence overlay (post-production):**
- Pre-captured failed tx digest from hostile wallet (Sui explorer screenshot or wallet error screen)
- MoveAbort code: `(gate_control, EAccessDenied)`
- Shortened hostile pilot address

**Purpose:** First consequence. Policy → enforcement. The operator set it; the chain enforced it. The hostile's failure is shown from *their* perspective — because the operator's dashboard has no reason to know. That's the point.

**Visual direction (locked):**
- **Shot 1 (1:04–1:08):** CC gate detail on screen. Active tribe filter/toll table visible. This is the same gate from Beat 3 — the viewer recognizes the policy they just watched deploy.
- **Shot 2 (1:08–1:12):** Inset (post-prod): hostile wallet view. Small inset rectangle in lower-right (~30% of viewport). The hostile's transaction fails. MoveAbort error visible. 4-second hold.
- **Shot 3 (1:12–1:18):** Return to full CC viewport. Gate detail unchanged. No Signal Feed entry. Narrate: "No override. No appeal."
- **Emphasis:** The inset is the only embellishment. Keep it small and brief. The power of this beat is the ABSENCE of change in the operator's dashboard — the chain enforced the policy silently.
- **Silence window:** None. Narration carries this beat.

**Framing note (2026-03-18):** The hostile denied path produces NO on-chain events — `assert!` in `request_jump_permit` causes a MoveAbort that reverts everything, including any events that might have been emitted earlier in the transaction. The only evidence of denial is the failed transaction response in the hostile's own wallet. The operator's Signal Feed cannot observe other wallets' failed transactions. Evidence for this beat must be pre-captured from a hostile wallet and shown as a post-production overlay, or narrated honestly as "the hostile's transaction fails — the chain rejected it." Do not script the Signal Feed showing a denied entry — it will not happen live.

---

### Beat 5 — Revenue (1:26–1:44)

**Duration:** 18 seconds

**Spoken narration:**
> "An ally jumps through. A thousand Lux — the rate you set."

*[Signal Feed: new entry, green badge. "Transit Authorized. Toll: 1,000 Lux."]*

> "Revenue to the operator."

*[Revenue counter in Command Overview ticks up.]*

> "The gate pays for itself."

**On-screen:** Signal Feed with toll entry. Revenue counter increments visibly.

**Evidence overlay (post-production):**
- Tx digest of tolled jump
- `TollCollectedEvent` (CC extension event)
- `JumpEvent` (world-contracts event)
- Balance delta: operator +1,000 Lux (10 EVE)

**Purpose:** Same policy, opposite outcome. The gate discriminates and generates revenue. "A thousand Lux — the rate you set" ties directly back to Beat 3's tiered pricing. "The gate pays for itself" — six words that reframe infrastructure as an asset, not a cost.

**Visual direction (locked):**
- **Shot 1 (1:22–1:28):** Signal Feed receives new entry: "Transit Authorized" (green badge). Narrate: "An ally jumps through. A thousand Lux — the rate you set."
- **Shot 2 (1:28–1:32):** Hold on Signal Feed entry. Hover over tx digest link — DigestHoverLink proof card appears showing tx details (status, type, gas, timestamp). Hold 2 seconds on the proof card. This shows depth without narrating it.
- **Shot 3 (1:32–1:36):** "Revenue to the operator." Brief zoom (1.2×) on hero metric card ("Gross Network Yield") as Lux value increments.
- **Shot 4 (1:36–1:40):** "The gate pays for itself." Pull back to show full metric row. Hold.
- **Emphasis:** Hover proof card on the tx digest is the key visual innovation. Brief zoom on revenue metric card as it increments. Keep both subtle.
- **Silence window:** None.

> **Currency note (2026-03-29):** The UI displays Lux-first with EVE in brackets (e.g., "1,000 Lux"). Narration matches: "one thousand Lux collected." Do not use EVE-first phrasing. The Signal Feed already shows "1,000 Lux" in toll entries and "Transit Authorized" as the event label.

**Precondition note (updated 2026-03-18):** `jump_with_permit` (actual jump execution) requires AdminACL sponsor co-signature. However, `request_jump_permit` (permit issuance + toll collection) is **now callable from the operator dashboard** via the Transit Proof section on any gate detail screen with a linked destination and authorized extension. This fires `PermitIssuedEvent` and `TollCollectedEvent` live in the Signal Feed, making this beat partially self-demonstrable. The operator generates a real toll-paid permit on their own gate — the distinction is that the character doesn't physically jump (that still requires AdminACL), but the revenue event and tribe check are real and on-chain.

**Recommended recording approach:** Use the Transit Proof button on the gate detail screen to fire toll collection live, then cut to Signal Feed showing the TollCollectedEvent. Narrate as "An ally jumps through. Revenue collected." The permit issuance is genuine — the jump execution is implied.

---

### Beat 6 — Defense Mode (1:44–2:14)

**Duration:** 30 seconds. This is the climax. Give it room.

*[Brief world footage: an unaffiliated vessel approaches the gate perimeter. Tension cue — scanner ping, proximity alert. The frontier is no longer safe.]*

*[Hard cut to Command Overview. PostureControl clearly visible.]*

**Spoken narration:**
> "Threat inbound."

*[Pause. 1 second.]*

> "One click."

*[Operator clicks "Defense Mode."]*

*[PostureControl shows "Executing…" — topology holds current teal colors (no premature change).]*

*[Tx confirms. PostureControl shows "Confirming…" briefly. Then, over ~1.6s, turret glyphs shift teal → amber. NWN nodes shift teal → amber. Defense overlay fades in across the topology canvas. Posture indicator transitions from "Commercial" to "Defensive."]*

*[Hold 2 seconds. Let the confirmed state change settle visually.]*

> "Gates locked. Turrets armed. One transaction."

*[Signal Feed: PostureChangedEvent appears.]*

*[Hold 2 seconds on the transformed Command Overview. The teal→amber transition is smooth and deliberate — a visual confirmation of on-chain state, not an instant UI toggle.]*

*[Cut to world footage: outsider enters turret range. Turret engages. The doctrine the operator just deployed is enforced on the frontier — not in the dashboard, but in the world itself.]*

**On-screen:** The full Command Overview transforming — posture indicator, gate colors, turret states, Signal Feed. The transition is animated (~1.6s) and tied to confirmed chain state — colors change only after the on-chain posture re-read completes, not on button click.

**Evidence overlay (post-production):**
- **Single tx digest** containing all posture changes (single PTB)
- `PostureChangedEvent`: `old_mode: COMMERCIAL → new_mode: DEFENSE`
- Before/after state summary: turrets bouncer→defense extension swap

**Purpose:** The hammer moment. Everything the demo has built — policy, enforcement, revenue — now escalates to infrastructure-wide command. One human decision, one on-chain transaction, every structure responds. This is the "command layer" claim made undeniable.

**Signal cue note (updated 2026-03-23):** The game engine calls `get_target_priority_list` via **devInspect** (read-only simulation) — events emitted during devInspect are NOT persisted on-chain. No live turret engagement signal reaches the Signal Feed. **CC proves doctrine authorization** via `ExtensionAuthorizedEvent` (which IS persisted). The posture switch (doctrine swap) is the proven, DApp-callable proof. Do NOT script targeting or engagement events in narration.

**Module name fix (2026-03-23):** The game engine hardcodes module `"turret"` when resolving extensions (SDK `get-priority-list.ts:109`). CC's original `turret_bouncer`/`turret_defense` modules were never executed by the game — turrets used default world targeting. Fixed by adding a unified `turret` module with `CommercialAuth`/`DefenseAuth` auth witnesses. **After every package upgrade, turrets must be re-authorized** via "Authorize All" or posture switch.

**Turret doctrine semantics (2026-03-23):** Commercial (CommercialAuth) is passive until aggression — turrets stand down for ALL neutral traffic and engage ONLY aggressors (+10000). Defense (DefenseAuth) actively targets non-tribe visitors (+5000) and aggressors at highest priority (+15000). Both modes exclude same-tribe non-aggressors.

**Technical reality (implemented v3):** Single PTB contains: `set_posture` + N × (`borrow_owner_cap<Turret>` → `authorize_extension<CommercialAuth|DefenseAuth>` → `return_owner_cap`). Unified `turret.move` dispatches by reading stored TypeName. Old `turret_bouncer.move` / `turret_defense.move` are legacy (never called by the game engine). ExtensionAuthorizedEvent (world module) persists on posture switch.

**Capture validation (2026-03-29):** A real Commercial → Defensive posture switch was executed and validated on-chain. Signal Feed showed "Network Posture Set: Defense posture applied." Wallet popup appeared as a separate window (does NOT contaminate viewport recording). The topology cascade and posture indicator transition were visible in the app viewport. For recording: capture the live switch — it produces compelling footage without requiring post-production simulation.

**Visual direction (locked):**
- **Shot 1 (1:40–1:44):** Brief world footage (if available): unaffiliated vessel near gate perimeter. Tension cue. 4 seconds max.
- **Shot 2 (1:44–1:46):** Hard cut to Command Overview. PostureControl clearly visible. Narrate: "Threat inbound."
- **Shot 3 (1:46–1:48):** Pause 1 second. Narrate: "One click." Operator clicks "Defensive" button.
- **Shot 4 (1:48–1:52):** PostureControl shows "Executing…" → "Confirming…". Topology holds current teal colors (no premature change). Wallet popup appears in separate window — ignored. 4-second hold on the transition.
- **Shot 5 (1:52–1:54):** Tx confirms. Over ~1.6s, turret glyphs shift teal → amber. NWN nodes shift teal → amber. Defense overlay fades in across topology canvas. Posture indicator transitions to "Defensive." **DO NOT CUT during this transition. Let the color propagation complete.**
- **Shot 6 (1:54–1:56):** Hold 2 seconds on confirmed amber state. No narration. The visual IS the proof.
- **Shot 7 (1:56–2:00):** Narrate: "Gates locked. Turrets armed. One transaction." Signal Feed: PostureChangedEvent appears.
- **Shot 8 (2:00–2:04):** Hold 2 seconds on transformed Command Overview.
- **Shot 9 (2:04–2:10):** If available: cut to world footage — outsider enters turret range, turret engages. The doctrine deployed in the dashboard is enforced in the world.
- **Emphasis:** The teal→amber topology cascade is the visual climax of the entire demo. No additional effects. No zoom. No dim. Let the color transition fill the viewport and breathe.
- **Silence windows:** 2 seconds after posture confirms (Shot 6). 2 seconds on transformed state (Shot 8).

**Preconditions:** ≥1 turret anchored + online with CommercialAuth extension configured (commercial posture). Gates in "Open for Business" (tribe+toll). OwnerCap<Turret> accessible via character borrow. **Turrets must be rebound after upgrade** — the Turret List shows an amber "Turret Doctrine Rebind Required" banner with "Rebind Doctrine" button. Old extensions show "STALE — REBIND". After rebinding, turrets show "CC ACTIVE".

---

### Beat 7 — Commerce (2:14–2:36)

**Duration:** 22 seconds

**Spoken narration:**

*[Cut to Trade Post view. Storefront: Eupraxite, fuel, repair paste. Prices listed.]*

> "A trade post on the far side of the network. A thousand Eupraxite. One hundred thousand Lux."

*[Buyer clicks. Transaction confirms: "Trade settled. Eupraxite acquired."]*

> "Payment to the seller. Item to the buyer. One transaction."

*[Signal Feed: "Trade Settled. 1,000 Eupraxite. 100,000 Lux." Revenue counter ticks up again.]*

**On-screen:** Trade Post storefront → Buy → confirmation → Signal Feed + revenue update.

**Evidence overlay (post-production):**
- Tx digest of buy
- `ListingPurchasedEvent` (CC extension event)
- Balance deltas: buyer −100,000 Lux (1,000 EVE), seller +100,000 Lux (1,000 EVE)
- Listing state: `is_active: true → false`

**Purpose:** Close the economic loop. Gate toll drove traffic. Commerce captured demand. The operator profits from both sides. Infrastructure → governance → revenue.

**Visual direction (locked):**
- **Shot 1 (2:10–2:16):** Cut to Trade Post detail/storefront. Listing visible: Eupraxite with price (100,000 Lux) and quantity (1,000). Clean framing on the listing card.
- **Shot 2 (2:16–2:22):** Narrate amounts. Buyer clicks "Buy." Wallet popup (separate window, ignored). Transaction confirms. Signal Feed: "Trade Settled."
- **Shot 3 (2:22–2:28):** "Payment to the seller. Item to the buyer. One transaction." Revenue counter ticks up. Hold on Signal Feed showing trade settlement event.
- **Shot 4 (2:28–2:32):** Brief hold on trade post showing updated listing state. Transition to Beat 8.
- **Emphasis:** None. Clean and subordinate. Commerce is a supporting beat — Defense Mode (Beat 6) is the climax. Don't over-produce this beat.
- **Silence window:** None.

> **Commerce amount note (2026-03-29):** Prior draft used "One thousand Lux" (= 10 EVE) which read as implausibly low for a cargo of Eupraxite. Operator feedback: 100,000 Lux (= 1,000 EVE) is a more credible trade amount. Larger Lux numbers also make the economic counters and revenue framing feel more substantial.

---

### Beat 8 — Command (2:36–2:51)

**Duration:** 15 seconds

**Spoken narration:**
> "Toll revenue. Trade revenue. Turrets armed. Every structure reporting."

*[Pull back to full Command Overview. Signal Feed scrolling. Revenue totals visible. Posture: Defense Mode. Turrets: ONLINE. Gates: tribe-locked.]*

*[Hold 3 seconds on the full system view.]*

> "Your infrastructure. Under your command."

**On-screen:** Complete Command Overview — the operator's entire infrastructure under command.

**Evidence overlay (post-production):**
- Aggregate revenue total visible in UI
- Structure count + status summary
- Signal Feed showing mixed events (policy, toll, trade, posture)

**Visual direction (locked):**
- **Shot 1 (2:32–2:40):** Pull back to full Command Overview. All four metric cards visible. Revenue shows combined toll + trade. Posture indicator: Defensive. Signal Feed scrolling with mixed event types. Topology: amber defense posture state.
- **Shot 2 (2:40–2:47):** "Your infrastructure. Under your command." Slow deceleration. Hold on the full system view. No zoom, no crop — the wide shot is the proof. This is the most important static hold in the demo.
- **Emphasis:** None. Clean wide shot. The accumulated state of the Command Overview — defense posture, active structures, revenue, mixed Signal Feed — IS the proof. Any visual effect would diminish the authority.
- **Silence window:** None, but the final line should be delivered with visible deceleration.

---

### Beat 9 — Close (2:51–3:04)

**Duration:** 13 seconds

*[Title card fades in over the Command Overview:]*

> **CivilizationControl**

*[Hold. No narration. No subtitle. The demo defined what it is.]*

**On-screen:** Name only. Clean. Final.

**Visual direction (locked):** Title card fades in over the Command Overview. No animation, no effects. Hold 13 seconds. The demo defined what it is — the title card confirms it.

---

## Timing Summary

| Beat | Name | Start | End | Duration |
|---|---|---|---|---|
| 1 | Pain | 0:00 | 0:22 | 22s |
| 2 | Power Reveal | 0:22 | 0:42 | 20s |
| 3 | Policy | 0:42 | 1:08 | 26s |
| 4 | Denial (narrated) | 1:08 | 1:26 | 18s |
| 5 | Revenue | 1:26 | 1:44 | 18s |
| 6 | Defense Mode | 1:44 | 2:14 | 30s |
| 7 | Commerce | 2:14 | 2:36 | 22s |
| 8 | Command | 2:36 | 2:51 | 15s |
| 9 | Close | 2:51 | 3:04 | 13s |
| **Total** | | | | **3:04** |

> **Timing shift note (2026-03-29):** Beat 1 extended from 18s to 22s (slower delivery accepted). All downstream beats shifted +4s. Shot-level timestamps within each beat's visual direction still show pre-shift values — add 4 seconds to any absolute timestamp in Beats 2–9. Total 3:04 remains under the 3:05 ceiling.

---

## Proof Moments Registry

Every major claim has a corresponding on-chain evidence moment.

| Beat | Claim | Evidence Artifact | Overlay Format | Source |
|---|---|---|---|---|
| 3 — Policy | Governance deployed via UI | Tx digests + `PolicyPresetSetEvent` (per gate) | Digest badge per preset | Live Signal Feed |
| 4 — Denial | Hostile blocked by chain enforcement | Failed tx digest + MoveAbort code | Red overlay: digest + abort code | Post-prod (hostile wallet capture) |
| 5 — Revenue | Toll revenue flows to operator atomically | Tx digest + `TollCollectedEvent` + balance delta | Green overlay: digest + balance | Live — Transit Proof on gate detail |
| 6 — Defense Mode | Infrastructure-wide state change, single tx | Single tx digest + `PostureChangedEvent` | Digest badge + topology color shift | Live Signal Feed + topology |
| 7 — Commerce | Atomic settlement, no counterparty risk | Tx digest + `ListingCreatedEvent` / `ListingPurchasedEvent` | Digest badge + balance comparison | Live Signal Feed |
| 8 — Command | System produces visible, aggregate value | Revenue totals in Command Overview + Signal Feed | UI screenshot (live) | Live UI |

---

## Pre-Flight Checklist

Complete every item before pressing record. Incomplete items = retake risk.

### Environment

| # | Check | Status |
|---|---|---|
| 1 | Sui CLI connected to submission chain (or local devnet) | ☐ |
| 2 | `sui client active-env` returns expected environment | ☐ |
| 3 | World-contracts package ID recorded | ☐ |
| 4 | CC extension package published and package ID recorded | ☐ |
| 5 | Operator wallet connected to frontend | ☐ |

### Structures & State

| # | Check | Status |
|---|---|---|
| 6 | ≥1 gate online, extension authorized (GateAuth), NO tribe rules, NO coin tolls (clean baseline for Beat 3) | ☐ |
| 7 | ≥1 trade post (SSU) online, extension authorized (TradeAuth), inventory present | ☐ |
| 8 | ≥1 turret online, extension authorized (CommercialAuth for commercial posture) | ☐ |
| 9 | ≥1 NetworkNode online, fueled | ☐ |
| 10 | Posture baseline: Commercial ("Open for Business") | ☐ |
| 10a | Extension config NOT frozen on any demo structures (verify `is_extension_frozen()` returns false) | ☐ |

### Accounts

| # | Check | Status |
|---|---|---|
| 12 | Operator address funded: SUI for gas + EVE for trade demo | ☐ |
| 13 | All overlay addresses shortened for display (post-production) | ☐ |

### Recording

| # | Check | Status |
|---|---|---|
| 17 | Browser: no bookmarks, history, autofill, other tabs visible | ☐ |
| 18 | Terminal history cleared (no unrelated commands visible) | ☐ |
| 19 | Beat 1 text-on-black assets prepared | ☐ |
| 20 | Post-production overlay templates ready (digest badge, balance delta, event) | ☐ |
| 21 | Narration script printed / teleprompter ready | ☐ |
| 22 | Screen resolution set to **2560×1440** (validated pipeline resolution) | ☐ |
| 23 | Stable profile directory set up with solar systems + map lock + starfield configured | ☐ |
| 24 | Map camera framed and locked (persists via localStorage — one-time) | ☐ |
| 25 | Wallet popup capture strategy confirmed (viewport-only = no contamination) | ☐ |

---

## Failure Fallbacks

If a proof moment fails during recording, do NOT derail. Use these alternatives.

| Beat | Failure | Fallback |
|---|---|---|
| 3 — Policy | Deploy tx doesn't confirm in 5s | Retake. If persistent: pre-record the deploy, stitch in post. Signal Feed entry is fallback evidence. |
| 4 — Denial | Hostile jump doesn't produce clean MoveAbort | Show wallet error response ("transaction failed") + describe abort code verbally. Overlay can use a pre-captured digest from rehearsal. |
| 5 — Revenue | Revenue counter doesn't visibly tick | Narrate the toll collection. Show Signal Feed entry as primary evidence. Balance delta overlay in post-production using explorer data. |
| 6 — Defense Mode | Single PTB fails (gas budget / contention) | Fall back to Strategy B: separate policy tx + per-turret txs (~3 seconds total). Still fast, still impressive. Note: "orchestrated in under 3 seconds." Overlay shows multiple digests grouped. |
| 6 — Defense Mode | Turret `online()` aborts (already online or NWN not producing) | Pre-check all turret states + NWN energy before recording. If abort during take, restart from Beat 6 with corrected state. |
| 7 — Commerce | Trade tx fails | Pre-record a trade tx and stitch. Signal Feed entry for the recorded tx is fallback evidence. |
| Any | Explorer/wallet unresponsive | All proof overlays can be added in post-production from pre-captured data. Continue narration. |

---

## Fallback Variant: GateControl-Only (2:00)

If Trade Post UI is not ready, compress to this variant. Same emotional arc, no commerce beat.

| Beat | Name | Time | Duration |
|---|---|---|---|
| 1 | Pain | 0:00–0:15 | 15s |
| 2 | Power Reveal | 0:15–0:30 | 15s |
| 3 | Policy | 0:30–0:50 | 20s |
| 4 | Denial | 0:50–1:05 | 15s |
| 5 | Revenue | 1:05–1:25 | 20s |
| 6 | Defense Mode | 1:25–1:45 | 20s |
| 7 | Command + Close | 1:45–2:00 | 15s |

**Trigger:** Switch to fallback if Trade Post tx fails repeatedly, or TradePost UI is not stable at recording time. Record Beats 1–2 first (reusable across variants).

---

## Appendix A: What Changed vs v1

- **Opening rewritten:** Replaced generic "20 commands" + terminal scroll with specific human scenario (pilots dying, fuel haulers lost, 13×12=156 commands math). Text-on-black instead of terminal footage — forces emotional engagement, not technical recognition.
- **Beat structure compressed:** 8 named beats + close (v1: 7 beats + variants + optional accents). Tighter flow, no feature tourism.
- **Defense Mode elevated to climax:** Moved from Beat 5b (a sub-beat, half-hidden) to Beat 6 — the peak of the arc. Given 27 seconds (was 15). Now the single loudest moment.
- **Revenue beat verbalized:** Added "The gate pays for itself" — a one-line reframe of infrastructure as asset. v1 showed revenue updating silently.
- **Denial language hardened:** "Denied. The chain enforced it. No override. No appeal." replaces softer "Blocked. No passage. No appeal. On-chain enforcement."
- **Timing tightened:** 3:00 flat (v1: 3:10). Cut optional ZK accent and preset switching accent from the primary flow — these can supplement but don't compete for the main 3 minutes.
- **Failure fallbacks formalized:** Full table mapping each beat to a concrete fallback action. v1 had a general "fallback variant" but no per-beat failure protocol.
- **Pre-flight checklist expanded:** 22 items covering environment, structure state, accounts, and recording setup. v1 had a partial evidence capture checklist.
- **Tagline sharpened:** "The command layer for frontier infrastructure" replaces "The Frontier Control Room."
- **Beat 1 removes Discord screenshot:** The text-on-black format is more emotionally controlled than mixing terminal footage + Discord screenshots + error messages.

## Appendix B: Why This Improves Judging Outcomes

- **Concept & Feasibility:** Opening pain is now a concrete scenario judges can feel ("your pilots died"), not an abstract complaint about CLI complexity. The feasibility claim lands harder because the problem is visceral.
- **Visual Presentation & Demo:** Defense Mode as a dedicated climax beat (27s, full visual transformation) gives judges one unforgettable moment instead of spreading impact across sub-beats. Text-on-black opening is a deliberate cinematic choice that signals production quality.
- **Player Utility:** "The gate pays for itself" reframes CivilizationControl from a convenience tool to an economic engine. Judges evaluating player utility will hear a revenue argument, not just a UX argument.
- **Mod Design:** Single PTB posture switch (validated, with tx digest) proves system-level design, not feature-level. Judges see architecture thinking.
- **Proof discipline:** Six non-negotiable proof moments mapped to specific on-chain artifacts. Judges never have to wonder "is this real?" — every claim has a deterministic evidence anchor.
- **Compression at 3:00:** Respects judges' time. Every second is earned. No padding, no optional accents diluting the core arc. The fallback variant ensures delivery even under instability.
- **EVE Frontier Relevance & Vibe:** The narrative is explicitly frontier governance — tribes, territory, hostiles, turrets. Not generic blockchain UX. Judges evaluating "vibe" hear the right language throughout.
- **UX & Usability:** "One click" appears three times organically (deploy policy, buy item, Defense Mode) — each proving a different facet of usability without ever explicitly saying "our UX is good."

---

## Do Not Show During Recording

- Private keys, seed phrases, mnemonics, `.env` files, keystore contents
- Full wallet addresses (use shortened: `0x1a2b…3c4d`)
- Browser bookmarks, history, autofill, other tabs
- Local file paths, terminal history from unrelated sessions
- Devnet reset warnings, chain genesis messages
- Move function names, PTB details, dynamic field terminology — in narration or visible UI

---

## Demo Account Roles

| Role | Description | Address |
|---|---|---|
| **Operator** | Owns structures. Receives all revenue. Signs policy + posture txs. | `[TBD]` |
| **Hostile Pilot** | Character with tribe ≠ filter value. Must be denied at gate. | `[TBD]` |
| **Ally Pilot / Buyer** | Character with tribe = filter value. Jumps gate (tolled), buys at trade post. | `[TBD]` |
| **Sponsor** | AdminACL-authorized co-signer for jump txs (if sponsored tx path). | `[TBD]` |

---

## Recommended Recording Order

1. Prepare all overlay templates + Beat 1 text assets
2. Run full tx rehearsal: capture all proof digests, balances, events for overlays
3. Record live UI: Beat 2 → 3 → 4 → 5 → 6 → 7 → 8 (continuous if possible)
4. Record Beat 1 (text-on-black, separate)
5. Record Beat 9 (title card, separate)
6. Assemble in editor: Beat 1 → 2–8 (live) → 9. Add proof overlays in post.

---

## Post-Assembly Review Checklist

Review the assembled video before exporting the final cut. Items 4–6 catch the most common demo failure mode: narration continuing over a static screen.

| # | Check | Status |
|---|---|---|
| 1 | Total duration ≤ 3:05 (target: 3:00) | ☐ |
| 2 | All 6 non-negotiable proof overlays present and legible | ☐ |
| 3 | No secrets, full addresses, or prohibited content visible (see Do Not Show) | ☐ |
| 4 | **Muted playback test:** watch with audio OFF — every beat has visible on-screen change; no segment >3s where the screen is static while narration continues | ☐ |
| 5 | Beat 6 silence window: ≥2s of visual-only transformation after click, before narrator resumes | ☐ |
| 6 | Signal Feed entries appear before or simultaneous with their narrated references (not after) | ☐ |
| 7 | Proof overlay timing: each overlay appears after tx confirmation, never before | ☐ |
| 8 | Audio levels consistent across beats; no clipping, no silence artifacts | ☐ |

---

## Appendix C: Competitive Refinement Pass (2026-03-03)

### What Changed

- **Beat 1 — Removed "156 commands" stat.** The narrator says "thirteen commands" and "nine gates" — the judge multiplies. Spoon-feeding the arithmetic felt like a pitch deck stat. Letting the viewer compute it is engagement, not exposition.
- **Beat 2 — Cut second "Every" and "sovereign."** "Gates, turrets, trade posts, network nodes" is more percussive than repeating "Every." Removed "sovereign" from narration — the concept is saved for Beat 8 where it's structurally load-bearing. Overuse dilutes authority.
- **Beat 5 — Cut "Atomic. Irrevocable." → replaced with "Revenue to the operator."** Three words, no jargon. "Atomic" pings as chain-speak to non-crypto judges. The proof overlay shows the delta — no need to assert irrevocability verbally. Duration 20→18s.
- **Beat 6 — Added 2 seconds of deliberate silence after the click.** The visual transformation must dominate before the narrator speaks. Post-click narration compressed from four sentences to three: "Gates locked. Turrets armed. One transaction." Past tense = fait accompli, not description. Duration 27→30s.
- **Beat 7 — Compressed from 25s to 22s.** Cut "no trust required" (crypto-speak). Merged opening scene-setting with product line. Commerce is now clearly subordinate to Defense Mode in weight.
- **Beat 8 — Replaced "Your frontier. Your rules. Your revenue." with "Your infrastructure. Under your command."** Closes the loop from Beat 1 ("no control" → "under your command"). The possessive triad was catchy but didn't complete the narrative arc. Cut "All on-chain. All sovereign." — listing chain attributes at the end is crypto-pride, not authority. Duration 20→15s.
- **Beat 9 — Title card reduced to name only.** "CivilizationControl" — no subtitle. Three minutes defined what it is. Adding a descriptor undercuts the confidence. Duration 10→13s for a longer hold.
- **Total duration tightened from 3:00 to ~3:00 (with freeze).** Freeze action adds 4 seconds but replaces narrative padding — every surviving second is functional.

### Why Each Improves Judge Impact

- **Removing "156"** → Judge feels smart (they computed it), not sold to. Engagement > exposition.
- **Silence after Defense Mode click** → First thing judges process after the click is the transformed state, not a narrator explaining it. The moment imprints visually before it's verbalized.
- **Past-tense narration ("Gates locked")** → Authority. The change already happened. The narrator reports fact, not process.
- **"Under your command" close** → Completes the pain→power arc explicitly. A judge who skimmed Beats 2–7 still gets the thesis from Beat 1 + Beat 8.
- **Name-only title card** → Signals maximum confidence. No explanation needed. The demo was the explanation.
- **Cutting crypto-speak ("atomic," "no trust required")** → Non-crypto judges (game design, UX) hear governance language, not chain language. CivilizationControl wins on player utility, not technical novelty.
- **3:00 at ceiling** → Judges watching 30+ demos notice the entry that respects their time. Tight runtime = implicit competence signal.

### What Was Intentionally NOT Changed (and Why)

- **Beat 1 storytelling ("Your pilots died")** — Verified against EVE Frontier reality: killmails happen, fuel hauling is real, offline gates have consequences. Authentic frontier pain, not manufactured drama.
- **Beat 3 policy flow** — "You decide who crosses and what they pay" is the most efficient framing possible. Already at maximum compression.
- **Beat 4 denial language ("No override. No appeal.")** — Already at maximum compression and impact. Changing it would reduce, not improve.
- **"The gate pays for itself" (Beat 5)** — The single most memorable non-climax line. Reframes infrastructure as revenue engine. Untouched.
- **"Threat inbound." / "One click." (Beat 6 setup)** — Two words + two words. Maximum tension compression. Not melodramatic in Frontier context where hostile incursions are gameplay.
- **Six non-negotiable proof moments** — Evidence structure is correct and complete. Freeze proof (1b) added to demonstrate trustless governance.
- **Pre-flight checklist and failure fallbacks** — Operational content, not narrative. Already comprehensive.
- **Fallback variant** — Insurance policy. Independent of primary narrative changes.

---

## References

- [Demo Beat Sheet v1](../archive/civilizationcontrol-demo-beat-sheet.v1.md)
- [Claim → Proof Matrix](civilizationcontrol-claim-proof-matrix.md)
- [Posture-Switch Localnet Validation](../sandbox/posture-switch-localnet-validation.md)
- [Product Vision](../strategy/civilization-control/civilizationcontrol-product-vision.md)
- [Hackathon Emotional Objective](../strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md)
- [Voice & Narrative Guide](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md)
- [Hackathon Rules Digest](../research/hackathon-event-rules-digest.md)
