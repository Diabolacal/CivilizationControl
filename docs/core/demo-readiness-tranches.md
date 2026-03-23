# Demo Readiness — Execution Tranches

**Retention:** Carry-forward
**Created:** 2026-03-22
**Source:** Systematic audit of map, signal feed, posture, gate policy, attention markers, and beat sheet alignment
**Purpose:** Drive build decisions for demo recording. What is real, what is close, what is blocked.

---

## 1. Confirmed Live Capabilities

These are proven on-chain and working in the operator UI today. No further work needed unless polish is desired.

| Capability | Evidence | Beat Sheet Beat |
|---|---|---|
| Gate permit acquisition (free + tolled) | `request_jump_permit` / `request_jump_permit_free` callable from gate detail Transit Proof section | Beat 5 (Revenue) |
| Linked-gate topology on map | Real gate-to-gate edges from `linkedGateId`, deduped, dashed teal lines | Beat 2 (Power Reveal) |
| Solar system coordinate projection | Pinned nodes → `SpatialPin` → solar system catalog → 2D projection with uniform scaling | Beat 2 |
| Per-gate policy preset set/remove (v2a) | PolicyPreset entries with per-tribe access + toll, default_access, default_toll via PolicyPresetEditor UI | Beat 3 (Policy) |
| Posture-aware gate enforcement | Gate reads active mode (Commercial/Defense) and loads matching PolicyPreset dynamically | Beat 6 (Defense Mode) |
| Posture switch (commercial ↔ defense) | Atomic PTB: `set_posture` + N × turret extension swaps (`CommercialAuth` ↔ `DefenseAuth`) | Beat 6 (Defense Mode) |
| Signal Feed (13 event types) | Real Sui `queryEvents` across 5 modules, 30s polling, parsed and categorized | Beat 2, 5, 6, 7 |
| Revenue counter (sum of toll + trade events) | Dashboard aggregates `amount` from `variant === "revenue"` signals | Beat 5, 8 |
| Trade post listing create/purchase | `ListingCreatedEvent` + `ListingPurchasedEvent` in Signal Feed | Beat 7 (Commerce) |
| Offline structure detection | Dashboard `AttentionAlerts` (critical), topology red glyphs + labels, detail header badges | Beat 2 |
| Extension gap detection | Dashboard `AttentionAlerts` (warning), gates/turrets without authorized extension flagged | Beat 2 |
| Turret doctrine difference | CommercialAuth (commercial): passive, aggressors-only +10000. DefenseAuth: non-tribe +5000 (hostile), aggressors +15000 | Beat 6 |

## 2. UI Truth Gaps (Real Data, Weak Visuals)

These are wired to real on-chain state but visually underpowered for demo recording.

| Gap | Current State | Impact | Fix Complexity |
|---|---|---|---|
| **Gate glyphs unchanged by posture** | Gates stay teal in both modes; only turrets/nodes change color | Beat 6 "infrastructure-wide response" claim weakened — gates are ~half the structures | ~10 lines in `StrategicMapPanel` |
| **Gate edge lines static** | Always teal dashes; `--topo-link-defense` (amber) is defined in CSS but unreferenced | Beat 6 spatial drama weakened | ~5 lines in `StrategicMapPanel` |
| **No revenue pulse on topology** | Toll/trade events show as text in Signal Feed only; `badge_revenue.svg` + `pulse_base.svg` exist on disk, zero imports | Beats 5, 7, 8 feel text-only; map looks static during economic activity | ~40–60 lines, 1–2 files |
| **Revenue label says "24h"** | Actually sums last ~25 polled events, not a 24-hour window | Misleading if inspected; handled gracefully with empty-state text | Label change only |
| **Sparkline is cosmetic** | Hardcoded static bars `[5,7,3,9,6,8,4,10,7,11,9]` | Looks good but is decorative; low risk | Could be removed or fed real data |
| **Low fuel threshold** | Zero-fuel shown; no intermediate warning (e.g. <20%) | Dashboard lacks operational depth for Beat 2 reveal | ~15 lines |
| **Unlinked gate alert** | Only visible as "Not linked" text on gate detail page; no dashboard or topology alert | Missing from `AttentionAlerts` | ~10 lines |
| **No zoom/pan on map** | Fixed viewport 900×360; no interaction | Map is view-only; acceptable for demo recording | Significant effort; defer |
| **10 overlay SVG assets unused** | `badge_warning`, `badge_denied`, `badge_revenue`, `pulse_base`, etc. exist on disk, zero imports | Design infrastructure exists but is not connected | Per-asset wiring |
| **Posture-change transient cue** | Smooth 800ms transition exists; no "just changed" flash/toast | Minor — static state well-reflected | ~20 lines |

## 3. Contract / Model Gaps

These cannot be solved by frontend work alone. They require contract changes or new Move modules.

| Gap | Current Limit | Operator Intent | Blocked By |
|---|---|---|---|
| ~~**Single tribe rule per gate**~~ | ~~DF key `TribeRuleKey { gate_id }` → one `TribeRule { tribe: u32 }`~~ | ~~Multiple tribe-specific entries with different access/toll per tribe~~ | **RESOLVED in v2a** — PolicyPreset vector-of-entries model with per-tribe access + toll |
| ~~**Single toll rule per gate**~~ | ~~DF key `CoinTollKey { gate_id }` → one `CoinTollRule { price, treasury }`~~ | ~~Per-tribe toll ladders, default fallback toll~~ | **RESOLVED in v2a** — PolicyPreset has default_toll + per-entry toll overrides |
| ~~**No blacklist / deny-by-default**~~ | ~~Whitelist only: match this tribe or fail~~ | ~~Defensive posture wants deny-all + allowlist~~ | **RESOLVED in v2a** — default_access: DENY (0) blocks all non-listed tribes |
| ~~**Posture does not change gate rules**~~ | ~~PTB only sets posture label + swaps turret extensions~~ | ~~Posture switch should swap active gate policy preset~~ | **RESOLVED in v2a** — gate enforcement reads active mode dynamically via PolicyPresetKey{gate_id, mode} |
| **No subscription/time-limited permits** | Permits have `expires_at_timestamp_ms` (upstream) but CC hardcodes 5-day TTL, no subscription ledger | Operator wants 24h/7d subscription passes priced higher than single transit | Contract: `SubPassLedger` designed in spec but not implemented |
| ~~**No per-tribe pricing**~~ | ~~Toll is flat for all permitted jumpers~~ | ~~Allied tribe A: low toll; neutral B: higher toll; default: highest~~ | **RESOLVED in v2a** — per-entry toll_override in PolicyPreset |

### Stale / Misleading Documentation

| Item | Location | Issue |
|---|---|---|
| ~~Beat sheet says "gate rule changes" in posture PTB~~ | ~~`docs/core/civilizationcontrol-demo-beat-sheet.md` Beat 6~~ | **RESOLVED** — Beat sheet updated; posture PTB now documented correctly with mode-based preset enforcement |
| Spec §3.4 describes Subscription Pass in rule evaluation order | `docs/core/spec.md` §3.4 | Not implemented. Spec says "if SubPassLedger DF exists" but no such DF or module exists in contracts. |

## 4. Demo-Critical Tranche Order

Ordered by impact on beat sheet recording quality.

### Tranche 1: Defense Mode Visual Completeness
**Target beats:** Beat 6 (climax, 30 seconds of camera time)
**Scope:** Gate glyphs + gate edge lines respond to posture switch
- `ChildGlyph`: add posture-conditional coloring for gates (match turret pattern)
- `gateEdges` memo: swap stroke to `--topo-link-defense` when defensive
- ~20 lines, 1 file (`StrategicMapPanel.tsx`)

### Tranche 2: Gate Policy v2a — COMPLETE ✅
**Target beats:** Beat 3 (Policy), Beat 4 (Denial), Beat 6 (Defense Mode gate behavior)
**Status:** ✅ **Implemented, published (v2 package), and deployed.** PolicyPreset model with vector-of-entries, per-tribe access+toll, default_access, default_toll, mode-aware enforcement. 26/26 Move tests passing. Frontend PolicyPresetEditor with batch apply operational.
- Contract: `PolicyPreset`, `PolicyPresetKey{gate_id, mode}`, `set_policy_preset`, `remove_policy_preset`
- Frontend: `PolicyPresetEditor` (two-tab Commercial/Defense), `TribePicker`, batch deploy PTB
- Package upgraded from v1 to v2 on Utopia testnet

### Tranche 3: Revenue Pulse on Topology
**Target beats:** Beat 5 (Revenue), Beat 7 (Commerce), Beat 8 (Command)
**Scope:** Brief pulse/flash on gate or trade post glyph when toll/trade event detected
- Wire `badge_revenue.svg` or inline pulse ring
- ~40–60 lines, 1–2 files

### Tranche 4: Attention Alerts Expansion
**Target beats:** Beat 2 (Power Reveal — dashboard operational depth)
**Scope:** Add low-fuel threshold + unlinked gate alerts to `AttentionAlerts`
- ~25 lines in `Dashboard.tsx`

### Tranche 5: Beat Sheet Corrections
**Scope:** Fix stale text in beat sheet and spec so narration matches reality
- Remove "gate rule changes" from Beat 6 PTB description (or update after Tranche 2 delivers)
- Clarify Revenue label ("recent events" not "24h")

## 5. Deferred to Post-Demo / Stillness

| Item | Reason |
|---|---|
| Solar system aggregate glyph on map | Exists as component but not needed for current demo topology |
| Zoom/pan/rotation on map | Significant interaction work; fixed viewport is acceptable for recorded demo |
| Defense cascade wave animation | Simultaneous 800ms transition is sufficient; staggered wave is polish |
| Subscription permit system | Designed in spec, not needed for demo. Can be v2b tranche after policy richness (v2a) |
| Turret fire/engage indicators on topology | Game engine calls `get_target_priority_list` via devInspect (read-only simulation) — events are NOT persisted on-chain. No live turret engagement signal reaches Signal Feed. Engagement is observable only in the game world, not as dashboard telemetry. Structurally impossible, not merely deferred. |
| Multi-coin toll support | Hardcoded to `Coin<EVE>`; no other tokens in scope |
| Per-direction gate rules | Source gate rules apply; destination unchecked by design |
| Permit multi-use (upstream TODO) | Upstream `validate_jump_permit` deletes permit after use; future option noted in world-contracts |

## 6. Decision Summary

| # | Decision | Rationale |
|---|---|---|
| 1 | Gate policy richness is the primary contract gap | Current model (1 tribe + 1 toll per gate) cannot express the operator's intended commercial or defensive policy scenarios |
| 2 | Posture switch must change gate rules, not just turret doctrine | Operator's core demo claim is "one click changes everything" — gates must participate |
| 3 | Contract upgrade required before further UI polish on policy screens | UI cannot fake richer policy; model must exist first |
| 4 | v2a/v2b split confirmed | Policy richness (v2a) is demo-critical; subscriptions (v2b) deferred |
| 5 | Fresh publish confirmed | Cleaner than maintaining deprecated stubs; re-auth is a known workflow |
| 6 | Author-once workflow required | Operator authors a preset once in UI, batch-deploys to multiple gates in a single PTB |
| 7 | Defense Mode visual tranche is the highest-yield UI fix | ~20 lines, 1 file, transforms the climax beat from "partial response" to "total response" |
| 8 | Map zoom/pan deferred | Fixed viewport is acceptable for recorded demo; interaction is Stillness-scope |
