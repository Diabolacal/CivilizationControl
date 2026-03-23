# UI Polish Reference Brief — CivilizationControl

**Phase:** Command Overview first pass
**Date:** 2026-03-23
**Scope:** Layout hierarchy, panel sizing, visual noise reduction for 1440p demo capture

This is a practical implementation brief — not a design system. It distills relevant workspace docs into actionable rules for this polish pass and future screen work.

---

## 1. Product Feel / Design Intent

CivilizationControl is a **calm command layer** for infrastructure governance. The interface should feel like mission control on a routine shift — quiet confidence, not busy dashboards.

- **Emotional priority:** Calm power → Governance → Authority (in that order)
- **Tone:** Cool, not cold. Measured, not flat. Spare, not empty
- **Every pixel earns its space.** If a UI element doesn't communicate consequence, authority, or value production, it doesn't belong
- **Gray infrastructure, colored exceptions.** Normal operation looks unremarkable. Color signals deviation

Source: Voice & Narrative spec §2, Emotional Objective §3, SVG Topology Spec §3.1

---

## 2. Hierarchy Rules for Command Overview

The Command Overview is the single at-a-glance command surface. It must pass the **3-Second Emotional Check** — within 3 seconds, the viewer answers: What am I governing? What is producing value? What is at risk?

**Vertical reading order (top → bottom):**

1. **Page header** — screen title and contextual subtitle
2. **Metric cards** — aggregate KPIs. Revenue at 2× width (hero). Structures, grid status, policies secondary
3. **Strategic Network** — emotional and conceptual center. Topology anchors the page
4. **Supporting evidence** — Telemetry Signals (preview) + Attention Required (compact alerts)

**Weight distribution:**
- Topology should feel like the gravitational center, not one panel among peers
- Telemetry is supporting evidence, not the dominant mass
- Attention Required is demoted — compact one-line items, ~10% viewport or less

Source: UX Architecture Spec §14, Emotional Objective §5

---

## 3. Progressive Disclosure Rules

| Level | What's shown | Who | Surface |
|-------|-------------|-----|---------|
| L1 | Dashboard glance — status, aggregate counters, topology | Non-technical tribe leader | Command Overview |
| L2 | Structure detail — extension, link, fuel, policy summary | Operational user | Gate/Post detail |
| L3 | Rule composer — tribe filter, toll slider, allow/block | Power user | Policy panels |
| L4 | ZK config, raw tx, event log filtering, diagnostics | Developer | Configuration, Signal Feed |

- Non-technical users never need to go past L2
- Command Overview is strictly L1
- Sidebars and panels start collapsed; user expands on demand

Source: UX Architecture Spec §12–13

---

## 4. Panel Sizing / Layout Rules for 1440p Demo Capture

**Target resolution:** Full-screen 1440p (2560×1440 CSS viewport in F11 fullscreen)

**Layout shell:**
- Fixed header: `h-16` (64px)
- Fixed sidebar: `w-64` (256px)
- Main content: left-offset by sidebar (`ml-64`), `h-screen` with `pt-[5.5rem]` (4rem header offset + 1.5rem breathing room, inside the box) and `overflow-y-auto`; body margin reset to 0 in theme.css
- Horizontal inset: `px-6` (1.5rem) — enough breathing room without feeling boxed-in
- Content max-width: `1760px`, centered — midpoint between the too-boxed 1600px and the over-wide 1920px; hero cards and telemetry rows retain authority without excess horizontal slack
- Scrolling is contained within the main area — the document body does not scroll

**Vertical budget (1440px viewport):**
- Header: 64px
- Main padding: ~48px (py-6)
- Available for content: ~1328px
- Command Overview content should fit without scrollbar at 1440p in normal loaded state

**Section heights (guidance, not hard constraints):**
- Page header: ~50px (no bottom border — spacing provides separation)
- Metric cards row: ~110–130px
- Strategic Network canvas: 440–480px (gravitational center; more mass than telemetry + metrics combined)
- Lower evidence section: ~260–310px
- Inter-section gaps: hierarchical (16px header→metrics, 20px metrics→topology, 24px topology→lower)

**Inter-section spacing is hierarchical, not uniform.** Tighter gaps for grouped items (header→metrics), larger gaps entering/leaving the hero topology panel. This creates compositional weight rather than flat mechanical spacing.

**Rule:** At full-screen 1440p, no vertical page scrollbar in the normal loaded state. Smaller viewports may scroll. Demo resolution takes priority.

---

## 5. Sidebar Behavior Rules

- **Structure Inventory groups collapsed by default** on every page load
- Sections: Gates, TradePosts, Turrets, Network Nodes
- User can expand/collapse manually; state is session-ephemeral (not persisted)
- Primary navigation (top nav links) always visible
- Sidebar is a reference panel, not a primary interaction surface on Command Overview

---

## 6. Card and Panel Emphasis Rules

- **Hero metric (Revenue):** 2× column span, green accent, sparkline. Most prominent KPI
- **Supporting metrics:** Equal width, compact, monospace readouts
- **Card containers:** Dark background (`--card`), 1px border, rounded. Minimal padding. No shadows
- **Panel headers:** `text-xs font-semibold`, muted subtitle. No oversized titles
- **Lower section headers:** `text-xs font-semibold text-muted-foreground uppercase tracking-wide` — visually subordinate to topology panel headers
- **Page title block:** No bottom border/divider — spacing and the metric card row below provide sufficient separation
- **No decorative borders, shadows, or gradients.** Cards are information containers, not visual features

---

## 7. Telemetry / Exception Panel Rules

**Recent Telemetry Signals (Command Overview):**
- **Preview mode:** Show 6 items maximum. This is a preview, not the full operational log
- Full stream lives at Signal Feed (`/activity`)
- "View Log →" link in header for navigation to full feed
- Row height: `py-3` to `py-3.5` (~40–44px)
- Variant-colored left border: green (revenue), red (blocked), blue (info), transparent (neutral)

**Attention Required:**
- **Empty state:** Compact — "All clear / No issues detected" with reduced padding (py-4)
- **Populated state:** Cap to same range as telemetry preview (6 items max, though current max is 2 alerts)
- **Row rhythm:** Match telemetry row height as closely as possible. Use single-line layout for alerts when practical
- Do NOT force dead space in empty state to match populated telemetry height

**Alignment rule:** When both panels are populated, the per-row vertical cadence should feel intentionally matched, not accidentally mismatched.

---

## 8. Strategic Network Presentation Rules

- **The topology is the emotional center of Command Overview.** It should feel anchoring, not equal to other panels
- Canvas height: 440–480px (more vertical presence than telemetry/metrics combined)
- Background: Near-black cool (`hsl(220, 15%, 6%)` or darker)
- Grid: Present but barely visible (`rgba(255,255,255, 0.02)` or less). Purpose: orientation, not decoration
- **Defensive posture overlay:** Subtle red wash. Must remain restrained after background darkening
- SVG viewBox scales responsively — no fixed-pixel breakpoints
- **Diagrammatic, not astronomical.** No star fields, no decorative space textures

**Color in topology:**
| Priority | Color | Meaning |
|----------|-------|---------|
| 1 (highest) | Red | Offline, denied |
| 2 | Amber | Warning, armed, restricted |
| 3 | Muted teal | Online, healthy (unremarkable) |
| 4 (lowest) | Gray | Neutral, idle |

Source: SVG Topology Spec §4.2, §6.13

---

## 9. Color Usage Rules

- **Orange (`#ea580c`):** Sparse and meaningful. Used for: active nav state, selected topology element, primary interactive accent. Never decorative
- **Green:** Economic events ONLY (revenue, toll collected, trade settled). Green is a reward signal, not a baseline
- **Red:** Offline/failure/denied. Highest urgency
- **Amber:** Warning/armed/defensive. Second urgency
- **Muted teal:** Online/healthy. Unremarkable by design — normal operation looks calm
- **Gray:** Neutral/idle infrastructure. Most structures appear gray most of the time

**Anti-pattern:** Using green to mean "online" or "healthy." Online = muted teal. Green = money.

Source: SVG Topology Spec §4.1–4.3

---

## 10. Motion / Micro-Interaction Rules

- **All motion serves information transfer.** Every animation must answer: "What just changed?"
- **No elastic/bounce/spring physics.** Use `ease-out` or `linear`
- **Timing:** Hover 120ms, state transition 200–300ms, event pulse 200ms+200ms, defense cascade 400–600ms
- **No animation on neutral-to-neutral transitions.** Animation without information is noise
- **Defense Mode cascade is the climax visual event** — wave propagation with 80ms stagger per hop
- **Post-action stillness:** After a key action (policy deployed, trade settled), let the interface breathe for 2–3 seconds

Source: SVG Topology Spec §5.1–5.3

---

## 11. Empty State Rules

- Empty states frame **opportunity, not absence**
- Two sentences maximum. First sentence: bold, declarative. Second: directional guidance
- Language: "No gates under your command." / "No signals yet." — factual, not apologetic
- No "Oops!", "Hmm...", celebration, or hedging
- Visual weight: compact (py-4), vertically recessive, centered text

**Examples from voice guide:**
| Context | Message |
|---------|---------|
| No gates | **"No gates under your command."** Connect your wallet to discover structures tied to your identity. |
| No activity | **"No signals yet."** Activity will appear here as jumps, trades, and policy changes occur. |
| All clear | **"All clear."** No issues detected. |

Source: Voice & Narrative §6, Emotional Objective §5

---

## 12. "Do Not" Rules (Drift Prevention)

1. **Do not add decorative motion** — no entrance animations, no idle animations, no bouncing
2. **Do not use green to mean "online"** — green is money only
3. **Do not use generic SaaS labels** — no "Dashboard," "Admin," "Notifications," "Settings"
4. **Do not celebrate** — no "Success!", "Great job!", "Congratulations!"
5. **Do not hedge** — no "Something may have gone wrong," "We think..."
6. **Do not add starfield/space textures** to topology background
7. **Do not add gradients, shadows, or glows** to neutral-state elements
8. **Do not use HUD-style decorative elements** — no scan lines, brackets, crosshairs
9. **Do not make the topology decorative** — it is a governance schematic, not a map illustration
10. **Do not force empty-state symmetry** — empty panels stay compact
11. **Do not add features during polish** — polish is about hierarchy and noise reduction, not adding UI
12. **Do not overuse orange** — it must remain sparse and meaningful
13. **Do not replace restraint with emptiness** — this is about hierarchy, not stripping the UI bare
14. **Do not solve scrollbar problems by making everything tiny** — adjust allocation, not density
15. **Do not duplicate identity** — character name belongs in the wallet control, not in page subtitles
