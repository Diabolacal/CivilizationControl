# CivilizationControl — Hackathon Emotional Objective

**Retention:** Carry-forward

Extends and refines [civilizationcontrol-voice-and-narrative.md](civilizationcontrol-voice-and-narrative.md) with a formalized emotional framework for hackathon delivery. That document defines voice, labels, and microcopy. This document defines why those choices exist and what emotional outcome they must produce.

**Status:** v1.0 — 2026-02-17  
**Scope:** UI-facing elements, page titles, empty states, demo scripts, player-facing confirmations & errors  
**Does NOT govern:** README, internal docs, code comments, architecture specs

---

## 1. Primary Emotional Target

When an operator opens CivilizationControl, the immediate, instinctive reaction must be:

> **"I'm building something meaningful."**

Not "I'm using a tool." Not "I'm managing objects." Not "I'm looking at a dashboard."

The operator should feel that their gates, trade posts, and rules represent real infrastructure they have constructed and govern — infrastructure that produces revenue, enforces policy, and has consequences.

This is the single emotional metric against which every UI surface is measured.

---

## 2. Beyond Vocabulary Avoidance

The [Voice & Narrative Guide](civilizationcontrol-voice-and-narrative.md) defines what CivilizationControl does NOT say — no "Dashboard," no "Settings," no "Congratulations!" That is necessary but insufficient.

| Passive approach | Active approach |
|---|---|
| Replace "Dashboard" with "Command Overview" | Design the Command Overview to communicate sovereignty — structures under authority, revenue flowing, policies active |
| Remove "Notifications" and use "Signals" | Make the Signal Feed feel like an intelligence stream — events that matter to a governor, not a log that scrolls |
| Don't celebrate with "Success!" | Confirm with the finality of a system that expects to succeed — "Policy deployed." |
| Avoid SaaS vocabulary | Build toward governance vocabulary where every element implies the operator built this, controls this, profits from this |

The distinction: vocabulary avoidance removes the wrong signal. Active narrative design installs the right one. Both are required. The emotional objective is the active side.

---

## 3. Active Network as Consequence Layer

The operator's network of structures (gates, trade posts, NWNs) is not decorative. It is the **consequence layer** — the surface where governance decisions produce visible, measurable outcomes.

### Design Principles

- **Dominance through consequence, not size.** A network with 3 gates and clear policy impact is more compelling than 20 gates with no visible effect. The UI must surface consequences: jumps governed, tolls collected, access denied, revenue earned.
- **Governance impact visualization.** Every structure should communicate what it is doing — not just that it exists. A gate is not a dot on a map. It is a checkpoint with a policy, a throughput, and a revenue stream.
- **Power, uptime, revenue, control.** These four dimensions define a structure's value. The UI should make each visible at a glance: Is it online? What rules apply? What has it earned? Who has it blocked?
- **Not decorative.** If a UI element does not communicate consequence, authority, or value production, it does not earn its space. Ornamentation is noise. Every pixel must serve the emotional objective.

### What "Consequence Layer" Means in Practice

| UI Surface | Consequence Signal |
|---|---|
| Gate card | Online status + active policy summary + jump count + toll revenue |
| Trade post card | Listing count + settled trades + revenue earned |
| Signal Feed | What just happened as a result of the operator's governance decisions |
| Command Overview | Aggregate: total structures, total revenue, total events — the operator's frontier, quantified |
| Empty state | What the operator has not yet built — framed as opportunity, not absence |

---

## 4. Five-Pillar Narrative Lens

Every major UI surface and demo moment must be evaluable through these five pillars. They extend the three-signal priority (calm power, governance, authority) from the Voice & Narrative Guide into actionable design criteria.

| Pillar | Question it answers | UI implication |
|---|---|---|
| **Governance** | What rules have I set? What policies are active? | Rule composer, policy status badges, access control summaries |
| **Authority** | What is under my command? What responds to my decisions? | Structure ownership list, OwnerCap visualization, online/offline controls |
| **Control** | What can I change right now? What levers do I have? | Action buttons, configuration panels, deploy/revoke controls |
| **Profit** | What value is my infrastructure producing? | Toll revenue, trade settlement amounts, economic activity counters |
| **Construction** | What have I built? What am I building next? | Structure count, extension status, linking state, progression signals |

### Pillar Priority

In cases of conflict (screen space, information density, demo time), prioritize in the listed order: Governance > Authority > Control > Profit > Construction. Governance is what differentiates CivilizationControl from a generic management panel. Construction is the emotional anchor but surfaces last because it is implicit in the other four.

---

## 5. Three-Second Emotional Check

Every major UI surface must pass this check. If a screen cannot answer at least three of these five questions within three seconds of viewing, it needs redesign.

1. **What am I governing?** — Policies, rules, access controls visible
2. **What is under my authority?** — Structures, assets, infrastructure enumerated
3. **What is producing value?** — Revenue, throughput, economic activity shown
4. **What is at risk?** — Low fuel, offline structures, policy gaps surfaced
5. **What am I building?** — Progression, construction state, expansion path implied

### Application

| Screen | Must answer (minimum 3) |
|---|---|
| Command Overview | All five |
| Gate Detail | 1, 2, 3, 4 |
| Trade Post Detail | 2, 3, 5 |
| Signal Feed | 1, 3, 4 |
| Configuration | 2, 3 (minimum acceptable — this is a utility screen) |
| Empty State (any) | 5 (what you could build) + 2 (what you will command) |

---

## 6. Scope Boundaries

This emotional guardrail applies to:

- UI-facing labels and headings
- Page titles and navigation
- Empty states and system messages
- Player-facing confirmations and error/fault messages
- Demo scripts, narration, and framing materials

This emotional guardrail does **NOT** apply to:

- README files (internal/technical)
- Internal documentation (architecture, operations, research, decision logs)
- Code comments and variable names
- Architecture specifications and feasibility reports
- Vendor code
- Marketing copy (handled externally)

This boundary is intentionally identical to the Voice & Narrative Guide scope. The two documents share scope; this one adds the *why* and the evaluation framework.

---

## 7. Hackathon Strategy Implication

### Judges Decide Emotionally

Hackathon judges form their core impression within the first 5–10 seconds of a demo. The emotional signal — "this person built something real and governs it" — precedes any feature evaluation. If the first impression is "another admin panel," no amount of technical depth recovers it.

### Narrative Clarity Amplifies Feature Value

A toll collection feature presented as "we added a payment field" is forgettable. The same feature presented as "the operator sets economic policy on their gate — every pilot who passes contributes to the frontier's economy" is memorable. The feature is identical. The narrative framing determines the score.

### Demo Strategy: Governance Over Feature Density

We are building toward a winning demo, not a feature checklist. The demo must show:

1. An operator who commands infrastructure
2. Policies that enforce themselves on-chain
3. Economic consequences that are visible and quantified
4. A system that communicates sovereignty, not software

Cutting a feature to make the remaining features land with full emotional weight is always the correct tradeoff. A demo with three features and a clear governance narrative outperforms a demo with eight features and no emotional anchor.

### Implication for Build Decisions

When choosing what to implement next, evaluate against this framework:

- Does this feature strengthen the emotional signal? → Prioritize it.
- Does this feature add capability without emotional weight? → Deprioritize or cut.
- Can this feature be narrated through a governance lens? → Keep it. Otherwise, reconsider.

---

## Cross-References

- **Voice & Narrative Guide:** [civilizationcontrol-voice-and-narrative.md](civilizationcontrol-voice-and-narrative.md) — label mapping, microcopy, demo framing, Narrative Impact Check
- **UX Architecture Spec:** [../../ux/civilizationcontrol-ux-architecture-spec.md](../../ux/civilizationcontrol-ux-architecture-spec.md) — screen hierarchy, interaction flows, data models
- **Product Vision:** [civilizationcontrol-product-vision.md](civilizationcontrol-product-vision.md) — problem/vision/demo narrative
- **Strategy Memo:** [civilizationcontrol-strategy-memo.md](civilizationcontrol-strategy-memo.md) — adversarial review, reconciled recommendation
