# CivilizationControl — Voice & Narrative Guide

**Retention:** Carry-forward

Canonical reference for UI language, narrative voice, and demo framing across CivilizationControl. This document governs all player-facing surfaces: navigation labels, page titles, headers, microcopy, empty states, system messages, and demo scripts.

**Status:** v1.0 — 2026-02-17
**Scope:** UI-facing elements and demo framing only
**Does NOT govern:** README, internal technical docs, marketing copy, vendor code

---

## Table of Contents

1. [Positioning Statement](#1-positioning-statement)
2. [Emotional Signal Definition](#2-emotional-signal-definition)
3. [Label Mapping Table](#3-label-mapping-table)
4. [Navigation Label Recommendation](#4-navigation-label-recommendation)
5. [Do / Don't Language List](#5-do--dont-language-list)
6. [UI Microcopy Examples](#6-ui-microcopy-examples)
7. [Demo Framing Guidance](#7-demo-framing-guidance)
8. [Narrative Impact Check](#8-narrative-impact-check)

---

## 1. Positioning Statement

CivilizationControl is the **command layer for player sovereignty** on EVE Frontier.

It is not a management tool. It is not an admin panel. It is the surface through which tribe leaders exercise governance over gates, commerce, and territorial infrastructure — without writing code, without trusting strangers, without flying blind.

Every label, heading, and system message should communicate one thing: **you are in command of your frontier.**

---

## 2. Emotional Signal Definition

CivilizationControl's voice conveys three qualities in strict order of priority:

| Priority | Signal | What it means | What it does NOT mean |
|----------|--------|---------------|----------------------|
| 1 | **Calm power** | Composed confidence. The interface speaks as if the operator's authority is already established — not something being sold or proved. | Not aggressive. Not urgent. Not hyperbolic. |
| 2 | **Governance** | Decisions, policies, oversight. The language of someone who sets rules and observes outcomes — not someone who clicks buttons and watches spinners. | Not bureaucratic. Not procedural. Not checkbox-driven. |
| 3 | **Authority** | Finality and precision. When the system speaks, it is definitive. Status is stated, not suggested. Actions are confirmed, not hoped for. | Not commanding the user. Not militaristic. Not theatrical. |

### Voice Calibration

- **Temperature:** Cool, not cold. Measured, not flat.
- **Register:** Professional governance — think mission control, not corporate SaaS.
- **Density:** Spare. Prefer fewer words with higher signal. An empty state with two sentences is better than one with five.
- **Tense:** Present and active. "Policy deployed" not "Your policy has been successfully deployed."

---

## 3. Label Mapping Table

When naming UI elements, prefer command-layer language over generic software terms. This table provides direct substitutions.

| Generic Term | Command-Layer Alternative | Rationale |
|---|---|---|
| Dashboard | **Command Overview** | Positions the view as a command post, not a data dashboard |
| Admin / Admin Panel | **Governance** or omit entirely | "Admin" implies technical backend; governance implies authority |
| Settings | **Configuration** or **Preferences** | "Settings" is consumer software; "Configuration" is operational |
| Objects / Items | **Structures** or **Assets** | Use the frontier's own vocabulary |
| Users | **Operators** or **Pilots** | Players are operators of infrastructure, not users of software |
| Notifications | **Signals** or **Alerts** | Governance language; "notifications" is phone-tier |
| Status: Active | **Online** | Matches world-contracts vocabulary and frontier context |
| Status: Inactive | **Offline** or **Standing Down** | Definitive state, not a passive absence |
| Error | **Fault** or **Obstruction** | "Error" implies user mistake; "Fault" implies system state |
| Loading... | **Resolving...** or **Acquiring...** | Active posture; the system is working, not waiting |
| Submit | **Deploy** or **Execute** or **Confirm** | "Submit" is passive; "Deploy" is an act of authority |
| Delete | **Revoke** or **Disband** | Context-appropriate finality |
| Create | **Establish** or **Commission** | Authority vocabulary |
| Edit | **Modify** or **Reconfigure** | Operational precision |
| Search | **Locate** or **Query** | Operational vocabulary |
| List / Table | **Registry** or **Manifest** | Frontier-native framing |
| Help | **Reference** or **Field Manual** | Avoids consumer software connotation |
| Home | **Command Overview** or omit | "Home" is domestic; command posts don't have a "home" |
| Profile | **Identity** or **Operator Record** | Sovereignty language |
| Log Out | **Disconnect** | Wallet-native terminology |
| Filter | **Filter** *(no change)* | Already precise and operational |
| Sort | **Sort** *(no change)* | Already precise |

### When to Break the Table

Use generic terms when:
- The command-layer alternative would confuse rather than clarify
- Wallet interaction standards expect specific labels (e.g., "Connect Wallet" is universally understood)
- Accessibility guidelines require standard terminology
- Technical documentation (not user-facing) needs precision over narrative

Document any deviation in the Narrative Impact Check (§8).

---

## 4. Navigation Label Recommendation

Three candidate navigation sets were evaluated against four criteria: Authority (does it sound like governance?), Clarity (is it immediately understood?), Restraint (is it free of theatrics?), and Hackathon Impact (will judges and voters remember it?).

### Option A — Operational Command

| Position | Label |
|----------|-------|
| Primary | Command Overview |
| Section | Gate Governance |
| Section | Frontier Commerce |
| Section | Signal Feed |
| Section | Configuration |

### Option B — Sovereign Control

| Position | Label |
|----------|-------|
| Primary | Control Room |
| Section | Gates |
| Section | Trade Posts |
| Section | Activity |
| Section | Settings |

### Option C — Frontier Authority (Recommended)

| Position | Label |
|----------|-------|
| Primary | Command Overview |
| Section | Gates |
| Section | Trade Posts |
| Section | Signal Feed |
| Section | Configuration |

### Evaluation Matrix

| Criterion | Option A | Option B | **Option C** |
|-----------|----------|----------|------------|
| Authority | Strong — "Governance" carries weight | Medium — "Control Room" is strong but "Settings" undermines it | **Strong** — "Command Overview" anchors; individual sections stay clean |
| Clarity | Medium — "Frontier Commerce" requires a beat to parse | **Strong** — every label is instantly legible | **Strong** — all labels immediately clear |
| Restraint | Medium — "Gate Governance" borders on overstatement for a nav item | **Strong** — minimal, grounded | **Strong** — narrative only where it earns its space |
| Hackathon Impact | Medium — memorable but verbose | Medium — "Control Room" is good but "Settings" is forgettable | **Strong** — top-level "Command Overview" is the anchor; sections don't compete |

### Recommendation: Option C — Frontier Authority

**Rationale:** Option C places narrative weight where it matters most — the primary view label ("Command Overview") and the activity stream ("Signal Feed") — while keeping section labels short and immediately parseable. It avoids over-narrating every navigation item, which would dilute the effect. "Configuration" over "Settings" is a small signal that costs nothing in clarity and gains frontier register.

---

## 5. Do / Don't Language List

### Do

- **State facts.** "Policy deployed." "Gate offline." "3 jumps in the last hour."
- **Use active voice.** "Toll collected: 5 EVE." Not "A toll of 5 EVE has been collected."
- **Match world-contracts vocabulary.** Online/Offline, Gate, SSU, NWN, Extension, Jump, Tribe.
- **Affirm the operator's authority.** "Your gates, your rules." Framing assumes the player is in charge.
- **Be brief.** Every word in a heading or status message should earn its space.
- **Use present tense for status.** "Online" not "Is currently online."
- **Use past tense for completed actions.** "Policy deployed" not "Policy is being deployed."

### Don't

- **Don't use consumer SaaS language.** No "Dashboard," "Admin," "Notifications," "Your account," or "Settings" in primary surfaces.
- **Don't celebrate.** No "Congratulations!" No "Success!" No "Great job!" A policy deployment is confirmed, not applauded.
- **Don't hedge.** No "We think..." No "It looks like..." No "Something may have gone wrong." State the situation.
- **Don't use filler interjections.** No "Oops!" No "Hmm..." No "Uh oh!" Faults are stated plainly.
- **Don't over-narrate.** One sentence is better than three. If a status label communicates the same information as a paragraph, use the label.
- **Don't militarize.** "Gate Governance" is authority. "Gate Commander HQ Battle Station" is theater. No ranks, no military jargon, no combat metaphors in management surfaces.
- **Don't use "smart" as an adjective.** Smart assemblies is the platform's term; in CivilizationControl surfaces, use "structures" or the specific type (gate, SSU, NWN).

---

## 6. UI Microcopy Examples

### Page Headers

| Screen | Header | Subheader (optional) |
|--------|--------|---------------------|
| Main view | **Command Overview** | Your infrastructure at a glance |
| Gate list | **Gates** | *(none — the list is self-explanatory)* |
| Gate detail | **[Gate Name]** | Gate · [Online/Offline] · [Link Partner or Unlinked] |
| Trade post list | **Trade Posts** | *(none)* |
| Trade post detail | **[SSU Name]** | Storefront · [n] active listings |
| Activity | **Signal Feed** | Activity across all structures |
| Configuration | **Configuration** | *(none)* |

### Empty States

| Context | Message |
|---------|---------|
| No gates found | **No gates under your command.** Connect your wallet to discover structures tied to your identity. |
| No trade posts | **No storefronts established.** Authorize the TradePost extension on an SSU to begin listing items. |
| No activity | **No signals yet.** Activity will appear here as jumps, trades, and policy changes occur across your structures. |
| No rules configured | **No access rules active.** This gate is open to all pilots. Configure rules to govern passage. |
| No listings | **No items listed.** Stock this storefront from the SSU's inventory to create listings. |

### Action Confirmations

| Action | Confirmation |
|--------|-------------|
| Policy deployed | **Policy deployed.** [n] rules active on [Gate Name]. |
| Rule removed | **Rule revoked.** [Rule type] removed from [Gate Name]. |
| Gate brought online | **[Gate Name] online.** |
| Gate taken offline | **[Gate Name] standing down.** |
| Listing created | **Listing established.** [Item] at [Price]. |
| Listing cancelled | **Listing withdrawn.** [Item] returned to inventory. |
| Purchase completed | **Trade settled.** [Item] acquired for [Price]. |
| Extension authorized | **Extension authorized.** [Extension type] active on [Structure Name]. |

### Alert/Fault Messages

| Condition | Message |
|-----------|---------|
| Transaction failed | **Transaction failed.** [Specific reason if available]. Review and retry. |
| Wallet disconnected mid-action | **Wallet disconnected.** Reconnect to continue. |
| Insufficient funds for toll | **Insufficient funds.** [Amount] required; [Amount] available. |
| Gate unlinked unexpectedly | **Link severed.** [Gate Name] is no longer linked to [Partner Name]. |
| Fuel critically low | **Fuel critical.** [NWN Name]: estimated [n] hours remaining. |

### Tooltip / Contextual Copy

| Element | Tooltip |
|---------|---------|
| Status badge (Online) | Structure is online and operational |
| Status badge (Offline) | Structure is offline — not processing transactions |
| Toll amount field | Amount collected per jump in the configured token |
| Tribe filter | Restrict passage to pilots matching the selected tribe |
| Deploy Policy button | Apply the configured rules to this gate on-chain |

---

## 7. Demo Framing Guidance

### Principles

1. **Open with the problem, not the product.** The first 30 seconds should make the viewer feel the pain of managing infrastructure without tools. Raw CLI. Discord coordination. Manual queries. Establish *why* before showing *what*.

2. **Show governance, not features.** Don't narrate "and then I click this button." Narrate what the operator is *deciding*: "I set the policy: allies pass free, hostiles pay. The gate enforces it on-chain."

3. **Let the interface breathe.** After a key moment (policy deployed, trade settled), hold the shot for 2-3 seconds. Don't immediately click away. The stillness communicates confidence.

4. **Close on the system, not the feature.** The final shot should be the full Command Overview — multiple structures, multiple events, the system working as a whole. The closing message is about sovereignty, not functionality.

5. **Never say "dashboard."** In demo narration, use "command view," "control surface," or simply refer to what the operator sees. "Here's your infrastructure" — not "Here's the dashboard."

### Narration Register

- **Tone:** Steady. Unhurried. The narrator should present the system as if it already works, not pitch something that might.
- **Vocabulary:** Match the label mapping table (§3). Use "deploy" not "save." Use "signals" not "notifications." Use "structures" not "objects."
- **Pacing:** One idea per sentence. Pause between segments. The demo should feel like watching someone competent at work, not like a feature tour.

### Screen-by-Screen Framing

| Screen | Narrative Frame | Avoid |
|--------|----------------|-------|
| Command Overview | "This is your frontier. Every structure you own, its status, and what's happening — in one view." | Don't list features. Let the screen speak. |
| Gate Detail + Rule Config | "You decide who passes and what they pay. The blockchain enforces it." | Don't explain the technical implementation. |
| TradePost + Buy Flow | "Stock your storefront. Set your prices. Settlement is atomic — one signature, no counterparty risk." | Don't over-explain PTBs or escrow mechanics. |
| Signal Feed | "Every jump, every trade, every policy change — visible in real time." | Don't call it a "log" or "event stream." |
| Closing shot | "Your gates. Your rules. Your revenue. CivilizationControl." | Don't add a feature checklist or roadmap. |

### Demo Anti-Patterns

- **Feature tourism.** Clicking through every screen quickly to "show everything." Show less. Show it well.
- **Technical narration.** "This calls the `issue_jump_permit` function with a typed witness..." Save this for judge Q&A.
- **Apology or qualification.** "This is just a prototype" / "We didn't have time to..." Present what exists with full confidence.
- **Comparison to competitors.** Let CivilizationControl stand on its own.
- **Speed.** If the demo feels rushed, cut scope. Never speed up narration to fit features.

---

## 8. Narrative Impact Check

Use this checklist when creating or reviewing any UI-facing element or demo material. Not every item applies to every change — use judgment. The purpose is to catch generic language before it ships.

### Checklist

- [ ] **Labels reviewed against §3 mapping table.** No generic terms used where a command-layer alternative exists without loss of clarity.
- [ ] **Empty states reviewed against §6 examples.** States convey what the operator *can do*, not what went wrong.
- [ ] **Confirmations are definitive.** Past tense, no celebration, no filler. "Policy deployed." — done.
- [ ] **Faults state facts.** No hedging ("something went wrong"), no interjections ("Oops!"), no blame.
- [ ] **Navigation labels match recommended set (§4, Option C).** Deviations documented with rationale.
- [ ] **Demo narration uses governance framing.** Operator is deciding, not clicking. The system is governing, not managing.
- [ ] **No military theatrics.** Authority without militarism. Governance without bureaucracy.
- [ ] **Brevity check.** Can any heading, label, or message be shorter without losing meaning? If yes, shorten it.
- [ ] **Voice calibration.** Does the copy sound like mission control on a routine shift? If it sounds like a SaaS onboarding flow or a military briefing, revise.

### When to Skip

This check is **not required** for:
- Internal technical documentation (architecture docs, runbooks, feasibility reports)
- README files
- Decision logs
- Code comments
- Vendor code
- Marketing copy (handled externally)

---

*This document is the canonical source for CivilizationControl's UI voice and narrative framing. All UI-facing work and demo material should reference it. For technical architecture, see the [UX Architecture Spec](../../ux/civilizationcontrol-ux-architecture-spec.md). For strategic context, see the [Strategy Memo](civilizationcontrol-strategy-memo.md) and [Product Vision](civilizationcontrol-product-vision.md).*
