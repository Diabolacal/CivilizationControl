# Demo Production Pipeline — Planning & Feasibility

**Date:** 2026-03-29 (updated)
**Branch:** `feat/demo-production`
**Purpose:** Working source of truth for automated demo video production planning.
**Status:** Audio-ready — TTS narration + silence assets generated. Pre-capture planning phase.

---

## 1. Pipeline Architecture (Recommended for CivilizationControl)

Adapted from the reference Video Production Guide pattern. Four stages, each a standalone script:

```
STAGE 1: record-demo-scenes       Playwright records the app in headless Chromium
├─ Start vite dev server           2560×1440, dark theme
├─ Connect real wallet or          Real chain state preferred; minimal mock
│  selective data injection        only for wallet-gated read paths
├─ Execute scripted interactions   Timed to voiceover durations
├─ Capture per-scene .webm         Split by scene timestamps
└─ Merge voiceover audio           Output: XX-name-voiced.mp4

STAGE 2: assemble-trailer          Assemble scenes + inserts + title/outro
├─ Title card (post-prod)          Beat 1: Pain text-on-black
├─ Browser-captured scenes         Beats 2, 3, 5, 6, 7, 8
├─ Pre-captured inserts            Beat 4: hostile denial, Beat 6: world footage
├─ Outro card (post-prod)          Beat 9: brand hold
├─ Dark boundary fades             No white flashes
└─ Color grade + timing sync       Minimal — the app is already tuned

STAGE 3: mix-audio                 Voiceover + silence design
├─ Per-scene voice merge           Matched to voiceover MP3 durations
├─ Silence windows (Beats 4, 6, 9) Hard silence — no ambient, no music
└─ Optional ambient bed            Sub-perceptible only, if at all (see §9)

STAGE 4: quality-check             Verify proof moments visible
├─ Key frame comparison            Proof cards, Signal Feed entries, cascade
└─ Duration check                  ≤3:05 total
```

### Key design decisions

| Decision | Rationale |
|---|---|
| **2560×1440 capture resolution** | UI explicitly polished for 1440p; YouTube upload-quality benefit |
| **Real chain state preferred** over blanket mocking | Auth/proof credibility; pre-seed transactions before recording |
| **Per-scene recording** (not single continuous run) | Each beat has different chain-state and wallet requirements |
| **TxProofCard hover replaces most post-prod overlays** | The app's DigestHoverLink on Signal Feed entries shows proof cards live — 500ms hover → full digest/checkpoint/gas display |
| **Silence is the sound design tool** | Narration direction spec builds emotional architecture on silence windows, not music |

### Differences from Reference Guide

| Reference Guide | CC Adaptation | Reason |
|---|---|---|
| 1920×1080 resolution | **2560×1440** | UI tuned for 1440p; YouTube quality |
| Single continuous .webm | **Per-scene recording** | Different wallet/chain state per beat |
| Generic SPA | **Wallet-dependent SPA** | Wallet or selective mock needed for operator screens |
| No chain interaction | **Live Sui RPC against Utopia testnet** | Events/data from real chain |
| No external inserts | **2 insert beats** (hostile denial, world footage) | Cannot automate cross-wallet or in-game footage |
| Music + sidechain ducking | **Silence-first audio design** | Narration spec uses silence as emotional weapon |
| Dev server + record | **Pre-seed state → record** | Deterministic chain state required |

---

## 2. Beat-by-Beat Capture Strategy

### Legend
- **L** = Live browser capture against real chain state
- **S** = Browser capture against pre-seeded chain state (tx already executed)
- **X** = External pre-captured insert / post-production
- **G** = Generated asset (ffmpeg text card, no app)

| Beat | Name | Time | Type | Capture Method | Wallet Needed? |
|------|------|------|------|----------------|----------------|
| 1 | Pain | 0:00–0:22 | **G** | ffmpeg `drawtext` title card | No |
| 2 | Power Reveal | 0:22–0:42 | **S** | Navigate `/` → dashboard with topology, hold 3s | Yes (read-only) |
| 3 | Policy | 0:42–1:08 | **S+L** | Pre-seed policy → record: form-fill + Signal Feed proof card hover | Yes (form fill); Pre-seeded events |
| 4 | Denial | 1:08–1:26 | **X** | Pre-captured hostile wallet MoveAbort on CC UI or script output | No (separate capture with 2nd wallet) |
| 5 | Revenue | 1:26–1:44 | **S** | Pre-fire Transit Proof → record Signal Feed TollCollectedEvent + hover proof card | Pre-seeded events; read-only wallet |
| 6 | Defense Mode | 1:44–2:14 | **S+X** | Pre-switch posture → record CSS cascade + Signal Feed. World footage = separate insert | Yes (read-only for cascade); Insert for turret footage |
| 7 | Commerce | 2:14–2:36 | **S** | Pre-create listing + pre-execute buy → record `/ssu/:ssuId` (no wallet) + trade post detail with events | No for marketplace; Pre-seeded data |
| 8 | Command | 2:36–2:51 | **S** | Record dashboard with accumulated events, metrics, topology | Yes (read-only) |
| 9 | Close | 2:51–3:04 | **G** | ffmpeg outro card | No |

### Key capability upgrades since initial assessment

1. **TxProofCard hover is now live** — each Signal Feed row contains a `DigestHoverLink`. A 500ms hover on any tx digest shows a proof card with: status, tx kind, digest, checkpoint, timestamp, gas cost, and sponsorship badge. This replaces the prior assumption that most proof moments need post-production overlays.

2. **Defense cascade is fully implemented** — ~1.6s left-to-right sweep, CSS `transition-delay` computed from screen X position. Teal→amber on gates, turrets, corridors.

3. **PostureControl inline in map header** — the posture switch button lives inside the Strategic Network Panel, so the switch action and visual cascade are in the same frame.

4. **Player marketplace is standalone** — `/ssu/:ssuId` renders without wallet, no sidebar. Pure read-only capture.

---

## 3. Proof Moment Staging Strategy

Six non-negotiable proof moments. Updated with real-chain-first approach:

### Proof 1: Policy preset deployed to multiple gates (Beat 3)
- **Method:** Pre-execute batch policy deployment on Utopia via operator wallet (CLI or live UI) shortly before recording session.
- **Capture:** Record the PolicyPresetEditor showing the saved preset + batch-apply section. Navigate to Signal Feed → show `PolicyPresetSetEvent` entries. Hover a digest → TxProofCard shows batch tx proof live.
- **Operator prep:** Fire `set_policy_preset` batch PTB from operator wallet before recording. Note the tx digest.

### Proof 2: Hostile denied — MoveAbort (Beat 4)
- **Method:** Separate capture using second wallet/character on Utopia. Attempt transit through a tribe-filtered gate from a non-matching tribe.
- **Capture options (choose one):**
  - (a) Screen-record the CC `GatePermitPage` showing the denial error state — the page has a staged flow (init→resolve→wallet→loading→error) and shows the error message
  - (b) CLI script + terminal output of the MoveAbort
  - (c) SuiScan failed tx view
- **Recommended:** Option (a) — real app capture with second wallet. The `GatePermitPage` error state is cleaner than explorer screenshots.
- **Operator prep:** Second wallet address. Ensure it is NOT in the allowed tribe list for at least one gate.

### Proof 3: Toll collected — TollCollectedEvent (Beat 5)
- **Method:** Fire Transit Proof or have a real character transit a tolled gate before recording.
- **Capture:** Record Signal Feed showing `TollCollectedEvent` with Lux amount. Hover the digest → TxProofCard shows proof live.
- **Operator prep:** Execute Transit Proof on gate detail page (or CLI equivalent) before recording session. Verify event appears in Signal Feed within polling window.

### Proof 4: Defense Mode — PostureChangedEvent + ExtensionAuthorizedEvent (Beat 6)
- **Method:** Execute posture switch before recording, or capture the live switch in a separate take.
- **Capture:** Record the topology cascade (CSS transition) + Signal Feed showing both events. Hover digest → proof card.
- **Best approach:** Capture the actual posture switch live (click PostureControl button → wallet signs → cascade animates → Signal Feed updates). This creates the most compelling footage. If wallet interaction is problematic in headless, fall back to pre-seeded state + CSS cascade replay.
- **Operator prep:** Ensure posture is in Commercial state before the recording so Defense switch is available. Turrets must be re-bound after any contract upgrade.

### Proof 5: Trade settlement — ListingPurchasedEvent (Beat 7)
- **Method:** Pre-create a listing on the operator's SSU. Pre-execute a buy from a second address (or operator self-buy if contract allows).
- **Capture:** Record `/ssu/:ssuId` showing listings (pre-buy snapshot) + Signal Feed showing `ListingPurchasedEvent`. Hover proof card.
- **Operator prep:** Create a listing with known item + price. Execute buy. Note both tx digests.

### Proof 6: Player marketplace — SSU DApp URL (Beat 7)
- **Method:** Direct Playwright navigation to `/ssu/:ssuId`.
- **Capture:** Fully automatable. Page renders as standalone marketplace with no wallet required (auto-connect shows pilot identity if Eve Vault present, but page works without it).
- **No operator prep needed** beyond having active listings on the SSU.

---

## 4. Wallet Strategy (Revised)

### Primary approach: Headed Playwright with real Eve Vault extension

Run Playwright in headed mode (visible Chromium window) with the Eve Vault browser extension loaded. Script interactions via Playwright automation; wallet approvals happen in the extension.

- **Pros:** Most authentic capture — real data, real wallet, real proofs. Zero code changes required.
- **Cons:** Wallet approval introduces timing variability; not fully deterministic.
- **Suitable for:** All operator-screen beats (2, 3, 5, 6, 7, 8). Manual wallet intervention is brief and can be edited out or timed into the scene.

### Fallback: Thin data injection for read paths only

If Eve Vault extension does not load in Playwright Chromium, inject fixture data at the `useAssetDiscovery` hook level. All chain reads (`useSignalFeed`, `useGatePolicy`, etc.) still hit real Utopia RPC.

- **Pros:** Fully headless; wallet only needed for pre-seeding phase.
- **Cons:** Asset discovery fixture must match real chain state; requires a build flag or test entry point.
- **Complexity:** Medium — override one hook, keep all RPC reads real.

### What never needs a wallet

| Capture | Reason |
|---------|--------|
| Beat 1, 9 (title/outro cards) | Generated by ffmpeg |
| Beat 4 (hostile denial) | Separate capture with second wallet |
| Beat 6 world footage insert | In-game capture, not the CC app |
| Beat 7 player marketplace | `/ssu/:ssuId` works without wallet |

---

## 5. Required Tooling & Environment

### Already Present
| Item | Status | Notes |
|------|--------|-------|
| Vite 6 dev server | ✅ | `npm run dev` (port 5173 default) |
| TypeScript 5.8 | ✅ | tsconfig.json |
| ESM project | ✅ | `"type": "module"` in package.json |
| `@types/node` | ✅ | devDependencies |
| `.mjs` script pattern | ✅ | scripts/ (fetch-*.mjs) |
| Voiceover config | ✅ | docs/demo/narration-direction-spec.md |
| Beat sheet with timing | ✅ | docs/core/civilizationcontrol-demo-beat-sheet.md |
| ffmpeg 6+ on PATH | ✅ | 2025-03-31 build verified, GPL, full codec support |
| ffprobe on PATH | ✅ | Ships with ffmpeg |
| Utopia testnet access | ✅ | Sui RPC endpoints hardcoded in suiReader.ts |
| Operator wallet + structures | ✅ | Hardcoded in constants.ts |

### Needs Installation (Easy)
| Item | Command | Purpose |
|------|---------|---------|
| Playwright | `npm i -D @playwright/test && npx playwright install chromium` | Browser recording |
| tsx | `npm i -D tsx` | TypeScript script runner for pipeline scripts |
| recordings/ directory | `mkdir recordings` + subdirs | Pipeline workspace |

### External Assets Needed (Operator-Provided)
| Asset | Status | Notes |
|-------|--------|-------|
| Voiceover MP3s (all beats) | **✅ Complete** | 14 narration + 7 silence + 3 fallback = 24 files in `recordings/voiceovers/`. See `docs/demo/tts-generation-guide.md` for inventory. |
| Second wallet/character | **Available** | Operator confirmed. Needed for Beat 4 hostile denial. |
| Turret/world footage | **Can be captured** | Operator confirmed separate capture feasible. |

---

## 6. Validated Recording Environment (Phase 2 Evidence — 2026-03-29)

All findings below were validated in headed Playwright + Eve Vault sessions on branch `feat/demo-production` (commits through `afa7a61`). Screenshots and videos in `recordings/phase2/`.

### 6.1 Headed Real-Wallet Path — VIABLE

The primary capture method is confirmed:
- **Playwright `launchPersistentContext` + `--load-extension`** loads Eve Vault v0.0.6 in headed Chromium.
- After a manual wallet unlock + connect (~15s), all operator surfaces populate: Command Overview, gate list, trade posts, turrets, posture controls, Signal Feed, topology map, and structure counts (54 structures: 10 Gates / 10 Governed / 2 Posts / 6 Nodes).
- No code changes, no data injection, no mocking required for operator read paths.

### 6.2 Persistence Model — One-Time Setup

| Data Item | localStorage Key | Reload | Navigate Away/Back | Browser Relaunch (Same Profile) |
|---|---|---|---|---|
| Solar system pins | `cc_spatial_pins` | ✅ Persists | ✅ Persists | ✅ Persists |
| Camera position | `cc:strategic-map:camera` | ✅ Persists | ✅ Persists | ✅ Persists |
| Map lock state | `cc:strategic-map:camera` `.locked` | ✅ Persists | ✅ Persists | ✅ Persists |
| Starfield toggle | `cc:strategic-map:starfield` | ✅ Persists | ✅ Persists | ✅ Persists |
| Wallet connection | Eve Vault session | ✅ Persists | ✅ Persists | ❌ Needs reconnect |

**Operational conclusion:**
- Solar system assignment is **one-time** — configure once, persists forever in the stable profile.
- Map framing + lock is **one-time** — frame and lock once, all future captures use the same angle.
- Only wallet reconnect is needed per browser launch (~15s manual step).

Validated camera state from Phase 2 run: `locked: true`, azimuth ≈ 2.076, polar ≈ 0.15, zoom ≈ 3.994.

### 6.3 Signed Transaction Validation

A real on-chain posture switch (Commercial → Defensive) was executed successfully:
- Signal Feed confirmed: "Network Posture Set: Defense posture applied"
- Success banner visible in the app
- PostureChangedEvent persisted on-chain
- Topology cascade (teal → amber) rendered correctly

This validates that signed transactions requiring wallet approval work within the headed Playwright capture flow.

### 6.4 Wallet Popup & Recording Capture Truth

| Observation | Implication |
|---|---|
| Wallet approval is a **separate browser window/popup**, not an in-page overlay | ✅ Does NOT contaminate viewport-only video recording |
| Playwright `recordVideo` captures **only the page viewport** (no chrome, no popups) | ✅ App state changes (pending → confirmed) appear cleanly in recordings |
| After tx approval, popup closes; browser context shows only `about:blank` + app page | ✅ No wallet artifact persists in the recording surface |
| Popup itself is **not capturable** by Playwright viewport recording | ⚠️ If wallet approval flow must be shown, use OBS/ffmpeg desktop capture |

**For normal demo footage:** Signed actions (posture switch, policy deploy) are safe to capture. The app viewport shows the pending → confirmed transition cleanly while wallet approval happens externally.

### 6.5 Capture Session Strategy — HYBRID (Recommended)

| Phase | Description | Frequency |
|---|---|---|
| **One-time setup** | Assign solar systems, frame + lock map, configure starfield | Once per profile |
| **Per-launch warmup** | Unlock Eve Vault, connect wallet, wait for data population | ~15s per browser launch |
| **Per-scene capture** | Short Playwright recording burst for each demo beat | Per scene |

**Key constraint:** Avoid long-running `recordVideo` sessions at 2560×1440 on persistent contexts — `context.close()` video finalization can hang. Use short per-scene recordings (< 60s each) or disable `recordVideo` for interactive validation and use it only for automated capture passes.

### 6.6 Stable Profile Directory

Profile directory: `recordings/.chromium-profile` (gitignored via `recordings/*`).

- Use `--clean` flag on validation scripts to start fresh.
- Default: reuse existing profile for persistence testing or rapid iteration.
- Profile contains: localStorage state, extension prefs, session cookies (not wallet keys — those are in Eve Vault keystore).

---

## 7. Known Blockers & Risks (Revised 2026-03-29)

### Critical — RESOLVED

| Risk | Original Status | Resolution |
|------|--------|------------|
| **Wallet connection for operator screens** | CRITICAL | ✅ **Resolved.** Headed Playwright + Eve Vault extension works. All surfaces populate after manual connect. |
| **Eve Vault extension compatibility** | CRITICAL | ✅ **Resolved.** Extension loads via `--load-extension` arg in `launchPersistentContext`. Confirmed Phase 1b (2026-03-29). |

### Moderate

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| **Signal Feed polling window** | Events >25 polls old may not appear | Pre-seed proof txs ≤30 min before recording; use manual Refresh button | Open |
| ~~Topology camera position~~ | ~~May not frame well~~ | Camera + lock persist via localStorage (§6.2) | ✅ Resolved |
| **Defense cascade at 2560×1440** | Larger viewport may change sweep timing | Verify ~1.6s sweep covers full canvas at 1440p in testing | Open |
| ~~Gate glyphs don't change on posture switch~~ | ~~Resolved~~ | Gate glyphs + corridor lines respond to posture | ✅ Resolved |
| **Voiceover timing drift** | Scene ≠ voiceover duration | Match hold time to measured VO durations — see capture-readiness checklist | Mitigated — durations measured |
| **Long `recordVideo` sessions hang** | `context.close()` stalls during video finalization at 2560×1440 | Use short per-scene recordings (<60s). Disable `recordVideo` for interactive sessions. | NEW — confirmed 2026-03-29 |

### Low

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Console noise in headless** | Wallet detection warnings | Already suppressed in main.tsx |
| **Testnet state mutation** | Other users/txs change state | Use specific structure IDs; minor drift acceptable |
| **Sparkline is cosmetic** | MetricCard sparkline is hardcoded | Acceptable visual — not scrutinized in 3s hold |

---

## 7. Beat Sheet Reassessment

Analysis of the current beat sheet against actual app capabilities. **No edits here — findings for operator review.**

### Beats that should stay exactly as-is

- **Beat 1 (Pain):** Text-on-black opener. Timeless. No change.
- **Beat 9 (Close):** Title card hold. 13s silence creates authority. Keep it.
- **Beat 4 (Denial):** Post-production insert is unavoidable. The hostile wallet failure is invisible to the operator's CC dashboard by design. Correctly handled.

### Beats where capabilities now exceed spec assumptions

**Beat 2 (Power Reveal):**
- Command Overview now has: 5-metric grid (hero revenue card + 4), full topology map with posture-aware rendering, inline PostureControl, Signal Feed preview (6 rows), AttentionAlerts.
- At 1440p, this reads as a genuine command surface. The 20s hold is justified.
- **Possible improvement:** Replace post-prod Package ID overlay with a live DigestHoverLink hover on a Signal Feed entry — showing a TxProofCard with an actual on-chain digest. More natural than a text overlay.

**Beat 3 (Policy):**
- PolicyPresetEditor has: two-tab Commercial/Defense, per-tribe access + toll, default fallback, batch-apply to all gates.
- "One preset. Applied to all gates. One transaction." is literally what batch-apply does.
- **Possible improvement:** After applying, cut to Signal Feed → hover `PolicyPresetSetEvent` digest → TxProofCard live. Replaces the "post-production tx digest overlay" from the spec.

**Beat 5 (Revenue):**
- Transit Proof is live. TollCollectedEvent + PermitIssuedEvent appear in Signal Feed.
- **Possible improvement:** Instead of showing the Transit Proof test button, pre-fire the transit and record Signal Feed + revenue metric already ticked up. More natural — "Revenue accrues automatically" rather than "let me click this test button."

**Beat 6 (Defense Mode):**
- PostureControl inline in map header. Topology cascade: ~1.6s sweep. Signal Feed: PostureChangedEvent + ExtensionAuthorizedEvent with proof cards.
- ~~Key gap:~~ **Resolved.** Gate glyphs and corridor lines now respond to posture change — gates switch to amber via `NodeCluster.tsx`, corridors switch via `--topo-link-defense` in `StrategicMapPanel.tsx`. The cascade covers the ENTIRE topology (gates, turrets, corridors, NWN nodes).
- **2.0s silence window is perfect** — cascade takes ~1.6s, Signal Feed populates during the hold.

**Beat 7 (Commerce):**
- Both operator-side (TradePostDetailScreen) and player-side (SsuMarketplacePage) exist as real routes.
- **Possible improvement:** Proof card hover after buy — showing ListingPurchasedEvent in Signal Feed with TxProofCard popup. Not possible when the spec was written.

**Beat 8 (Command):**
- Dashboard now shows accumulated revenue, structure counts, posture, mixed Signal Feed. Delivers on "All six ledgers. One screen." framing. **No changes needed.**

### Timing observations

- Beat 3 (26s) could compress 2-4s; PolicyPresetEditor flow is faster than spec assumed.
- Beat 9 (13s) could reallocate 3-5s to Beat 6 if cascade needs more breathing room.
- Total 3:00 target is achievable. No structural timing issues.

### Pre-recording code changes (recommended, not required)

1. ~~**Tranche 1 (~20 LoC):**~~ **Already implemented.** Gate glyph + edge line posture coloring is live.
2. **Tranche 3 (~40-60 LoC):** Revenue pulse on topology. Strengthens Beats 5, 7, 8. Lower priority.

---

## 9. Implementation Roadmap (Updated 2026-03-29)

### Phase 1: Recording Environment Setup — ✅ COMPLETE
1. ✅ Playwright + tsx installed
2. ✅ `recordings/` directory structure created (screenshots, video, profile)
3. ✅ Eve Vault extension loads in headed Playwright Chromium
4. ✅ Smoke test: dashboard at 2560×1440, wallet connected, all surfaces populated
5. ✅ Camera framing + lock persists via localStorage — no code change needed
6. ✅ Signed transaction (posture switch) works through headed wallet flow
7. ✅ Wallet popup does not contaminate Playwright viewport recording

Scripts on `feat/demo-production`:
- `scripts/smoke-test-basic.mts` — Phase 1 headless smoke
- `scripts/smoke-test-extension.mts` — Phase 1b extension loading
- `scripts/smoke-test-manual-connect.mts` — Phase 1c manual wallet connection
- `scripts/smoke-test-phase2-persistence.mts` — Phase 2 persistence + signed tx validation

### Phase 2: Pre-Seed Chain State — NEXT
1. Execute policy preset batch deployment on operator gates
2. Fire Transit Proof on at least one gate (TollCollectedEvent)
3. Create trade listing on operator SSU
4. Execute buy (from second wallet or self-buy)
5. Verify posture is in Commercial state
6. Record all tx digests for proof card verification

### Phase 3: Capture External Inserts
1. Record hostile denial (Beat 4): second wallet → GatePermitPage error state
2. Record turret/world footage (Beat 6): in-game capture from operator
3. Generate title card (Beat 1) and outro card (Beat 9) via ffmpeg

### Phase 4: Record Browser Scenes
1. Record Beats 2, 3, 5, 6, 7, 8 as individual scenes at 2560×1440
2. Include DigestHoverLink proof card captures during Signal Feed moments
3. Time each scene to voiceover durations
4. Use headed Playwright with scripted interactions + real wallet

### Phase 5: Audio + Assembly
1. Generate voiceover MP3s (ElevenLabs)
2. Merge per-scene voice + video
3. Stitch all beats in order with dark boundary fades
4. Apply silence windows per narration spec
5. Duration check (≤3:05)

---

## 9. Sound/Music Strategy

### Analysis

The voice and narrative documents establish a clear position:
- **"The climax is the silence, not the voice"** (narration-direction-spec.md, Beat 6)
- **"Restrained > Dramatic"** — the narrator sounds like a mission controller on a routine shift
- Defense Mode has explicit silence windows: 1.0s after "Threat inbound." and 2.0s visual dominance with zero audio
- Beat 9 is 13s of absolute silence over the title card
- Delivery control is surgical (0.79 speed, per-beat stability/exaggeration tuning)

This production is designed around voice and silence as emotional tools. Music competes with both.

### Recommendation: No music. Voice + silence only.

| Audio element | Recommendation | Rationale |
|---------------|----------------|-----------|
| Background music | **No** | Competes with silence windows that carry emotional weight |
| Ambient drone/pad | **No** | Even sub-perceptible ambient undermines silence as a tool |
| Sound effects / UI sounds | **No** | The app has no sound. Synthetic sounds would be dishonest. |
| Transition sounds | **No** | Dark fades should be visual only. Sound transitions imply artifice. |

**If the operator strongly prefers ambient presence,** the only defensible option is a sub-20dB low-frequency pad (40-80 Hz) in Beats 2, 3, 5, 7 only, with hard cuts to true silence for Beats 4, 6, 8, 9. Default recommendation: no audio bed at all.

### Sourcing (if ambient is overridden in)

- **Artlist.io** / **Epidemic Sound** — subscription, royalty-free, good ambient/drone category
- **Freesound.org** — free CC0 ambient drones
- **YouTube Audio Library** — free, limited ambient quality
- Style keyword: dark ambient, sub-bass drone, no melody, no rhythm. Reference: Blade Runner 2049 background hum.

---

## 10. Operator Assets & Inputs Checklist

Everything the operator must provide or decide before recording begins:

### Must Provide

| Asset | For Beat(s) | Status | Notes |
|-------|-------------|--------|-------|
| Operator wallet connected to Utopia with owned structures | All | ✅ Available | Constants.ts has hardcoded IDs |
| Second wallet/character (non-matching tribe) | 4 | ✅ Available | Operator confirmed |
| In-game turret footage (world view) | 6 | Needs capture | Provide as MP4/MOV clip, 1440p or higher |
| Pre-seeded policy presets on gates | 3 | Needs execution | Batch policy deployment before recording |
| Pre-seeded toll event (TollCollectedEvent) | 5 | Needs execution | Fire Transit Proof or real transit before recording |
| Pre-seeded trade listing + buy event | 7 | Needs execution | Create listing, execute buy, verify Signal Feed |
| Posture set to Commercial | 6 | Needs verification | Must be Commercial so Defense switch is available |
| Turrets re-bound after contract upgrade | 6 | Needs verification | Extension auth must be fresh |

### Must Decide

| Decision | Options | Impact |
|----------|---------|--------|
| Voiceover line revisions | Revise first vs use current narration spec | Lines predate proof cards and use stale gate counts / currency phrasing; revision needed (see §7 and narration review) |
| Music / ambient | None (recommended) vs sub-perceptible ambient | See §10 |
| Revenue pulse (Tranche 3) before recording | Yes (~40-60 LoC) vs accept static | Pulse badges strengthen Beats 5, 7, 8 |
| ~~Headed vs headless recording~~ | **Headed + real wallet (validated)** | ✅ Decided — see §6.1 |

---

## 11. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| Demo Beat Sheet (v2) | Scene-by-scene specification | [docs/core/civilizationcontrol-demo-beat-sheet.md](../core/civilizationcontrol-demo-beat-sheet.md) |
| Narration Direction Spec | Voice config + per-beat delivery | [docs/demo/narration-direction-spec.md](narration-direction-spec.md) |
| Claim-Proof Matrix | Every claim → evidence mapping | [docs/core/civilizationcontrol-claim-proof-matrix.md](../core/civilizationcontrol-claim-proof-matrix.md) |
| Demo Evidence Appendix | Beat → script/artifact mapping | [docs/operations/demo-evidence-appendix.md](../operations/demo-evidence-appendix.md) |
| Demo Readiness Tranches | Live capabilities + UI gaps | [docs/core/demo-readiness-tranches.md](../core/demo-readiness-tranches.md) |
| Voice & Narrative Guide | Labels, tone, Narrative Impact Check | [docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md) |
| Emotional Objective | Five-Pillar Lens, 3-Second Check | [docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md](../strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md) |
| UI Polish Reference | Resolution, layout, visual hierarchy | [docs/ux/ui-polish-reference-brief.md](../ux/ui-polish-reference-brief.md) |
| Strategic Network Map Audit | Current map implementation vs spec | [docs/ux/strategic-network-map-implementation-audit.md](../ux/strategic-network-map-implementation-audit.md) |
| UX Architecture Spec | Screen hierarchy, component map | [docs/ux/civilizationcontrol-ux-architecture-spec.md](../ux/civilizationcontrol-ux-architecture-spec.md) |
| Video Production Guide (Reference) | Automated recording pipeline patterns (Playwright + ffmpeg) | [docs/demo/video-production-guide-reference.md](video-production-guide-reference.md) |
