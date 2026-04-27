# Manual OBS Capture Runbook — CivilizationControl Demo

**Retention:** Carry-forward
**Last updated:** 2026-03-30
**Canonical beat sheet:** [Demo Beat Sheet v2](../core/civilizationcontrol-demo-beat-sheet.md)
**Narration spec:** [Narration Direction Spec](narration-direction-spec.md)
**Voice files:** `recordings/voiceovers/`

---

## 1. Capture Philosophy

- **Final capture is manual in OBS.** No automated Playwright pipeline.
- **Editing is manual in Descript.** Voice files are the audio spine; visual clips are trimmed to fit.
- **The locked TTS narration files are the source of truth for timing.** Visual clips should be longer than needed — Descript trims to match.
- **Each beat is captured intentionally.** Record each beat to match the locked narration, not to "get footage and hope."
- **The automated rough-cut footage is retired.** It was a proof-of-concept. This runbook replaces it.

### OBS Settings

| Setting | Value |
|---|---|
| Resolution | 2560×1440 (matches locked pipeline spec) |
| FPS | 30 (OBS native — Descript handles any conversion) |
| Encoder | x264 / NVENC, CRF 18 or equivalent quality |
| Audio | None — voice is added in Descript from the locked MP3s |
| Format | MKV (remux to MP4 after recording for safety) |
| Source | Display Capture or Window Capture (full browser viewport) |
| Cursor | **OBS cursor capture OFF** for static holds. ON only when demonstrating a click. |

---

## 2. OBS Capture Technique — This Demo

These are not generic tips. They are specific to the CivilizationControl demo aesthetic.

1. **Move the mouse deliberately and slowly.** If you need to click something, move in a slow straight line to the target. No zigzagging. No overshooting.
2. **Park the cursor off-screen or in the lower-right corner** when not actively clicking. Do not leave it hovering over UI elements.
3. **Hold longer than feels necessary.** If the beat sheet says "hold 2 seconds," hold 4 seconds in OBS. Descript will trim. The worst outcome is not having enough clean hold footage.
4. **Do not scroll unless the beat sheet specifically calls for it.** Let static views breathe.
5. **Record 2–3 clean seconds of nothing before and after each action.** This gives Descript clean in/out points for cuts.
6. **Do not fidget.** No random highlighting of text, no idle scrolling, no "exploring" the UI during takes. Every frame should look intentional.
7. **If a mouse movement looks wrong, stop, park the cursor, and redo the action.** Better to have a 4-second dead spot you can cut than a twitchy movement that ruins the take.
8. **Wallet popups appear in a separate OS window.** They do not contaminate the browser viewport. Approve them cleanly and quickly — the OBS viewport recording is unaffected.
9. **Signal Feed events may take 2–5 seconds to appear after tx confirmation.** Hold on the Signal Feed area after any on-chain action. Do not cut away early.
10. **Re-record immediately if the take is bad.** Do not "fix it in post." Each beat is short enough to redo.

---

## 3. Beat-by-Beat OBS Shot List

### Beat 1 — Pain (22s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b01-pain-a.mp3` (21.5s) |
| **Beat window** | 22 seconds |
| **Capture type** | **Generated card — NOT OBS.** This is a text-on-black sequence created in Descript or a video editor, not a screen recording. |
| **What to create** | Seven slides, each with white text centered on pure black background. Each slide fades in from black and fades out to black, timed to the narration cadence. |

**Slide sequence:**

| Slide | Text | Approx. timing in VO |
|---|---|---|
| 1 | Ten gates link five systems / on your EVE Frontier. | 0:00–4.0s |
| 2 | Last night, two went offline. / Nobody told you. | 4.0–7.5s |
| 3 | Your pilots rerouted through / hostile territory. | 7.5–10.5s |
| 4 | Hostiles caught them hauling fuel. | 10.5–13.0s |
| 5 | Every rule, every gate — / a manual transaction. | 13.0–16.5s |
| 6 | You have ten gates. | 16.5–19.0s |
| 7 | No visibility. No alerts. No control. | 19.0–22.0s |

**Visual direction:**
- Pure black background. No blue, no gradient, no vignette.
- White text, vertically and horizontally centered on each slide.
- Font: clean sans-serif (Inter, Helvetica Neue, or system default). ~50px equivalent at 1440p.
- Slide 7 should be slightly larger text (~60px) — it's the thesis statement.
- Use the actual em dash character (—) in slide 5, not `\u2014` or `--`.
- Each slide: 0.5s fade in, hold, 0.5s fade out, then black for ~0.3s before next slide.
- No animation, no typewriter effect, no motion graphics.

**Best created in:** Descript (title cards), Keynote/PowerPoint exported to video, or ffmpeg if the text rendering is clean. Ensure 2560×1440 output.

**Retake trigger:** Text is not centered. Background is not pure black. Wrong character renders. Text is too small to read comfortably at 1440p.

---

### Beat 2 — Power Reveal (20s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b02-power-a.mp3` (1.9s — "CivilizationControl."), `b02-power-b.mp3` (9.8s — "Every structure you own…") |
| **Beat window** | 20 seconds |
| **Capture type** | **Static hold — live OBS capture** |
| **Starting state** | Command Overview (homepage `/`). Posture: **Commercial.** All structures loaded. Map framed and locked. |
| **Capture objective** | The hard cut from black (Beat 1) to a fully loaded Command Overview. This is the emotional pivot. |

**Operator actions:**
1. Open the app at `/` (Command Overview). Ensure everything is loaded before recording.
2. Verify posture reads "Commercial" (or "Open for Business").
3. Verify structure counts are visible: "10 Gates / 10 Governed / 2 Posts / 6 Nodes."
4. Verify topology map is framed with solar system labels visible, camera locked.
5. Verify Signal Feed has recent events scrolling.
6. **Start OBS recording.**
7. **Do nothing.** Hold for 25+ seconds. No mouse movement. Cursor parked off-screen or lower-right corner.
8. **Stop OBS recording.**

**Mouse:** Off-screen or parked. No movement at all. The interface is the entire visual.

**Silence/hold:** The first 2 seconds after the Beat 1→2 cut are pure silence in the narration ("CivilizationControl" is the only word, then 2s silence). Let the interface breathe.

**Must be visible:** Posture indicator, structure counts, topology map, metric cards, Signal Feed. All at native resolution — no zoom, no crop.

**Retake triggers:**
- Wrong posture (shows Defensive instead of Commercial)
- Structures not fully loaded (spinners, empty panels)
- Map not framed / solar system labels missing
- Signal Feed empty
- Mouse visible and moving
- Any popup, tooltip, or unintended overlay

---

### Beat 3 — Policy (26s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b03-policy-a.mp3` (4.0s — "You decide who crosses — and what each tribe pays."), `b03-policy-b.mp3` (10.9s — "Allies at a thousand. Rivals at twenty-five thousand…") |
| **Beat window** | 26 seconds |
| **Capture type** | **Interactive — live OBS capture** |
| **Starting state** | Gate detail page for a gate with the tiered tribe pricing table already configured. Navigate to `/gates/<GATE_ID>` before recording. |
| **Capture objective** | Show the tiered pricing policy table, then batch-apply it to all gates. Signal Feed cascade as proof. |

**Pre-seeded state (before recording):**
- Gate has Commercial tab active with tiered tribe pricing already configured:
  - Static Conclave: 1,000 Lux
  - Wartime Republic: 25,000 Lux
  - Peaceful Trade Empire: 5,000 Lux
  - Default: 10,000 Lux
- The "Apply to All Gates" button should show a gate count (e.g., "(9)").

**Operator actions:**
1. Start on the gate detail page. Gate Directive section visible. Commercial tab active.
2. **Start OBS recording.**
3. Hold 3–4 seconds on the tribe pricing table. Let the viewer read it. No mouse movement.
4. Slowly move mouse to "Apply to All Gates (9)" button.
5. Click it. Wallet popup appears in separate window.
6. Approve the wallet transaction quickly.
7. Wait for transaction to confirm.
8. Signal Feed shows PolicyPresetSetEvent entries cascading — one per gate.
9. Hold 3–4 seconds on the Signal Feed cascade.
10. **Stop OBS recording.**

**Mouse:** Parked during the initial 3–4s hold on the pricing table. Slow, deliberate move to the button. After clicking, park again.

**Must be visible:**
- Tiered pricing table with all four tribe/rate entries readable
- "Apply to All Gates (9)" button with gate count
- Signal Feed cascade showing PolicyPresetSetEvent entries

**Can be captured separately:** The Signal Feed cascade (after tx confirms) could be a separate short clip if the initial take's cascade doesn't look clean. Splice in Descript.

**Capture as:** One continuous clip preferred. If the wallet popup timing is awkward, capture in two clips: (1) table hold + click, (2) Signal Feed cascade after confirmation.

**Retake triggers:**
- Pricing table not readable (too small, text cut off)
- Wrong tribe names or toll amounts visible
- "Apply to All Gates" button missing or shows wrong count
- Transaction fails
- Signal Feed doesn't show the cascade within 5 seconds
- Mouse movement was twitchy

---

### Beat 4 — Denial (18s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b04-denial-a.mp3` (4.1s — "A hostile pilot — wrong tribe — tries to jump."), `b04-denial-b.mp3` (5.3s — "Denied. The chain enforced it. No override. No appeal.") |
| **Beat window** | 18 seconds |
| **Capture type** | **Composite — two separate captures + Descript assembly** |
| **Capture objective** | Show that the operator's policy enforcement works — a hostile is denied by the chain. |

This beat requires **two separate pieces of footage:**

**Clip A — Operator dashboard (OBS capture):**
1. Record a clean 10-second static hold on the gate detail page (same gate from Beat 3).
2. The tribe pricing table / active policy is visible in frame.
3. No mouse movement. The point is: the operator's dashboard is unchanged — the chain enforced the policy silently. The operator didn't have to do anything.
4. This footage is reusable from Beat 3 (the hold before clicking "Apply to All Gates").

**Clip B — Hostile wallet denial (separate capture):**
1. Open a different browser/profile with a **non-tribe wallet** (a wallet whose address is NOT in the tribe allowlist).
2. Attempt to call `request_jump_permit` against an operator gate.
3. The transaction fails with a MoveAbort error.
4. Capture the wallet error screen or Sui explorer showing the failed transaction.
5. This becomes a post-production **inset** (lower-right corner, ~30% of viewport) overlaid on Clip A in Descript.

**Descript assembly:**
- Main frame: Clip A (gate detail, static hold).
- Inset overlay: Clip B (hostile wallet error). Lower-right, ~4 seconds, starting when narration says "tries to jump."
- Return to full-frame Clip A for "No override. No appeal."

**Special notes:**
- The hostile denial produces NO on-chain events in the operator's Signal Feed. MoveAbort reverts everything. This is correct behavior — do not try to show a denial event.
- If you cannot capture a real hostile wallet denial, a Sui explorer screenshot of a failed tx (showing MoveAbort + `EAccessDenied`) works as the inset.

**Retake triggers:**
- Hostile tx unexpectedly succeeds (tribe filter is misconfigured)
- Gate detail screenshot doesn't match Beat 3's gate
- MoveAbort error is not clearly visible in the hostile capture

---

### Beat 5 — Revenue (18s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b05-revenue-a.mp3` (10.0s — "An ally jumps through. A thousand Lux — the rate you set. Revenue to the operator. The gate pays for itself.") |
| **Beat window** | 18 seconds |
| **Capture type** | **Interactive + static hold — live OBS capture** |
| **Starting state** | Gate detail page. Signal Feed visible in sidebar. Transit Proof section accessible. |
| **Capture objective** | Show revenue flowing from a tolled transit. Signal Feed entry proves the toll collection. |

**Operator actions:**
1. Navigate to gate detail page (same gate or any gate with the Commercial policy applied).
2. **Start OBS recording.**
3. Hold 1–2 seconds. Signal Feed visible.
4. Use the **Transit Proof** button to fire a `request_jump_permit` tx with toll collection.
5. Approve wallet popup.
6. Wait for Signal Feed to show "Transit Authorized" with toll amount (1,000 Lux).
7. Optionally: hover over the tx digest link in Signal Feed to show the DigestHoverLink proof card (2 second hold on proof card).
8. Hold 3–4 seconds showing the event entry.
9. **Stop OBS recording.**

**Mouse:** Park during initial hold. Move deliberately to Transit Proof button. After clicking, park again until Signal Feed updates, then optionally slow-move to hover the digest link.

**Must be visible:**
- Signal Feed entry: "Transit Authorized" with toll amount visible
- Proof card (if hovering): tx status, type, gas, timestamp

**Retake triggers:**
- Transit Proof button not available (no linked destination or no extension authorized)
- Signal Feed doesn't update within 5 seconds
- Wrong toll amount appears
- Proof card is unreadable when hovered

---

### Beat 6 — Defense Mode (30s) ⚠️ CLIMAX

| Field | Detail |
|---|---|
| **Voice file(s)** | `b06-defense-a.mp3` (1.6s — "Threat inbound."), `b06-defense-b.mp3` (1.3s — "One click."), `b06-defense-c1.mp3` (1.4s — "Gates locked."), `b06-defense-c2.mp3` (1.4s — "Turrets armed."), `b06-defense-c3.mp3` (1.6s — "One transaction.") |
| **Silence files** | `sfx-silence-1000ms.wav` (between a/b), `sfx-silence-2000ms.wav` (after b, during visual transition), `sfx-silence-400ms.wav` (between c1/c2, c2/c3) |
| **Beat window** | 30 seconds — the longest beat. This is the climax of the entire demo. |
| **Capture type** | **Interactive — live OBS capture. This is the highest-risk beat.** |
| **Starting state** | Command Overview (`/`). Posture: **Commercial.** All structures loaded. Map framed and locked. |
| **Capture objective** | The single most important moment: operator clicks Defensive, the entire topology shifts teal→amber in one transaction. |

**Preconditions (verify before recording):**
- Posture is Commercial (not Defensive — if you recorded Beat 6 in a prior take, switch back to Commercial first)
- All turrets are bound with CC extension (no "STALE — REBIND" warnings)
- All turrets are online
- Map camera is framed and locked
- Signal Feed is visible

**Operator actions:**
1. Start on Command Overview. Posture indicator reads "Commercial."
2. **Start OBS recording.**
3. Hold 2 seconds. Cursor off-screen. Let the commercial state register.
4. Move cursor slowly to the "Defensive" button in PostureControl.
5. Click "Defensive."
6. Wallet popup appears in separate window. Approve it quickly.
7. **DO NOT MOVE THE MOUSE.** Park it. The visual transition is the star.
8. Watch: PostureControl shows "Executing…" → "Confirming…"
9. Watch: Topology glyphs shift teal → amber over ~1.6 seconds. Defense overlay fades in.
10. Hold 3–4 seconds on the fully transformed amber state. No mouse. No interaction. Let it breathe.
11. Signal Feed shows PostureChangedEvent.
12. Hold 2 more seconds on the Signal Feed event.
13. **Stop OBS recording.**

**Total OBS recording time:** Aim for 35–40 seconds to give Descript headroom for trimming.

**Mouse:** Visible only for the one click on "Defensive." Before the click: off-screen. After the click: parked immediately. The teal→amber transition must play out with zero mouse distraction.

**Must be visible:**
- Posture indicator transition: "Commercial" → "Executing…" → "Confirming…" → "Defensive"
- Topology cascade: teal → amber on turret glyphs and NWN nodes
- Signal Feed: PostureChangedEvent entry
- Structure counts and metric cards (wide shot, no zoom)

**Audio spine in Descript:**
The voice files for this beat use the **phrase-splice path**:
```
b06-defense-a.mp3          → "Threat inbound."
sfx-silence-1000ms.wav     → 1s silence
b06-defense-b.mp3          → "One click."
sfx-silence-2000ms.wav     → 2s silence (visual transition window)
b06-defense-c1.mp3         → "Gates locked."
sfx-silence-400ms.wav      → micro-pause
b06-defense-c2.mp3         → "Turrets armed."
sfx-silence-400ms.wav      → micro-pause
b06-defense-c3.mp3         → "One transaction."
```
Total spoken + silence: ~10s. Remaining ~20s is visual hold on the transformed state.

**Can be captured separately:** World footage (turret engaging an outsider) — if you have it — is a separate clip spliced after the main Command Overview footage in Descript.

**Capture as:** One continuous clip. Do NOT stop recording between the click and the cascade. This must be one unbroken take.

**Retake triggers (redo immediately):**
- Started in wrong posture (already Defensive)
- Turrets showed "STALE — REBIND" during the transition
- Cascade transition was not visible (page didn't update)
- Mouse was moving during the teal→amber transition
- Transaction failed (gas issue, network error)
- PostureChangedEvent didn't appear in Signal Feed
- Any popup or tooltip appeared over the topology during the transition

**Post-recording:** After this capture, posture is now Defensive. If you need to recapture Beat 2 (which requires Commercial), you must switch back to Commercial first.

---

### Beat 7 — Commerce (22s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b07-commerce-a.mp3` (12.6s — "A trade post on the far side of the network. A thousand Eupraxite. One hundred thousand Lux. Payment to the seller. Item to the buyer. One transaction.") |
| **Beat window** | 22 seconds |
| **Capture type** | **Interactive — live OBS capture** |
| **Starting state** | Trade Post / SSU marketplace page: `/ssu/<SSU_ID>`. A listing for Eupraxite must already exist: 1,000 Eupraxite at 100,000 Lux. |
| **Capture objective** | Show an atomic trade settlement — buyer purchases, events confirm in Signal Feed. |

**Pre-seeded state (before recording):**
- A listing exists on the SSU: 1,000 Eupraxite at 100,000 Lux (= 1,000 EVE).
- The operator wallet has sufficient funds to buy (or a second wallet is the buyer).

**Operator actions:**
1. Navigate to `/ssu/<SSU_ID>`. Listing is visible.
2. **Start OBS recording.**
3. Hold 2–3 seconds on the storefront view showing the listing. Let the viewer read the item and price.
4. Click "Buy" (or equivalent purchase button).
5. Approve wallet popup.
6. Wait for transaction confirmation.
7. Signal Feed shows trade settlement event ("Trade Settled" or `ListingPurchasedEvent`).
8. Hold 3 seconds on the Signal Feed entry.
9. **Stop OBS recording.**

**Mouse:** Parked during initial hold. Slow deliberate move to Buy button. Park after click.

**Must be visible:**
- Listing card: Eupraxite, quantity (1,000), price (100,000 Lux)
- Signal Feed: settlement confirmation event

**Retake triggers:**
- No listing visible on the storefront
- Wrong item/price displayed
- Transaction fails
- Signal Feed doesn't show settlement event
- Mouse movement was distracting

---

### Beat 8 — Command (15s)

| Field | Detail |
|---|---|
| **Voice file(s)** | `b08-command-a.mp3` (5.6s — "Toll revenue. Trade revenue. Turrets armed. Every structure reporting."), `b08-command-b.mp3` (3.2s — "Your infrastructure. Under your command.") |
| **Beat window** | 15 seconds |
| **Capture type** | **Static hold — live OBS capture** |
| **Starting state** | Command Overview (`/`). Posture: **Defensive** (the state left by Beat 6). All prior events visible in Signal Feed. |
| **Capture objective** | The wide-shot payoff — everything the demo built is now visible in one view. Revenue, defense posture, active structures, mixed Signal Feed. |

**Operator actions:**
1. Navigate to Command Overview (`/`). Verify everything is loaded.
2. Verify posture indicator shows "Defensive" (amber state from Beat 6).
3. Verify Signal Feed shows mixed event types (policy, toll, trade, posture).
4. Verify revenue metric cards show accumulated values.
5. **Start OBS recording.**
6. **Do nothing.** Hold for 20+ seconds. No mouse. No interaction. Cursor off-screen.
7. **Stop OBS recording.**

**Mouse:** Off-screen. No movement at all. This is the most important static hold in the demo.

**Must be visible:**
- Posture: Defensive (amber state)
- Structure counts
- Revenue metric cards with values
- Signal Feed with mixed events (scrolling is fine — it's live data)
- Topology in amber defense state

**Retake triggers:**
- Wrong posture (somehow switched back to Commercial)
- Empty metric cards / zero revenue
- Signal Feed empty or showing only one event type
- Mouse visible in frame

---

### Beat 9 — Close (13s)

| Field | Detail |
|---|---|
| **Voice file(s)** | None — silent title hold |
| **Beat window** | 13 seconds |
| **Capture type** | **Generated card in Descript** |
| **What to create** | Single slide: "CivilizationControl" centered on black. Fades in over 2 seconds, holds, then fades to black at the end. |

**Visual direction:**
- Pure black background.
- "CivilizationControl" in white, centered vertically and horizontally.
- Font size: ~80px equivalent at 1440p. Same font family as Beat 1 slides.
- Fade in from black over 2 seconds. Hold. Gentle fade to black at the end (optional — hard cut to black also works).
- No tagline, no URL, no subtitle. The demo defined what CivilizationControl is.

**Best created in:** Descript title card, Keynote, or any editor. Match Beat 1's typography.

**Retake trigger:** Text not centered. Background not black. Any extra text visible.

---

## 4. Separate Asset List

These items are **NOT** part of the main operator-screen OBS recording session. Capture or create them separately.

| Asset | Type | Used In | Notes |
|---|---|---|---|
| Beat 1 text slides (7 slides) | Generated card sequence | Beat 1 | Create in Descript or a slide tool. Pure black + white text. See slide table above. |
| Beat 4 hostile wallet denial | Separate browser capture | Beat 4 inset | Different browser profile with a non-tribe wallet. Capture the MoveAbort error. Alternatively: Sui explorer screenshot of a failed tx. |
| Beat 6 world footage (optional) | In-game capture or pre-existing footage | Beat 6 tail | Turret engaging an outsider in the game world. If available, splice after the topology cascade in Descript. If not: skip — the Command Overview cascade is sufficient. |
| Beat 9 title card | Generated card | Beat 9 | Single slide in Descript. "CivilizationControl" on black. |
| Beat 7 player-facing marketplace (optional) | Separate browser capture | Beat 7 | If you want to show the `/ssu/:id` marketplace from a player's browser (no wallet — anonymous), capture it separately and insert as a brief cut. |

---

## 5. Recommended Capture Order

Record in this order to minimize setup churn and reduce recapture risk.

| Order | Beat | Reason |
|---|---|---|
| **1** | Beat 2 — Power Reveal | Static hold. Commercial posture. Establishes the baseline state for all subsequent beats. Easiest take — zero interaction. |
| **2** | Beat 8 — Command | If captured at the end of a session (after Beat 6 leaves you in Defensive), this is just another static hold but in the amber state. **However**, you can also capture this after a prior Beat 6 take while the Defensive state is still fresh. |
| **3** | Beat 5 — Revenue | Requires Commercial posture (same as Beat 2 state). Fire Transit Proof. Low risk — one click + Signal Feed event. |
| **4** | Beat 3 — Policy | Requires navigating to gate detail. Interactive (batch apply click + wallet). Medium risk — depends on tx confirmation. |
| **5** | Beat 7 — Commerce | Requires navigating to SSU marketplace. Interactive (buy click + wallet). Medium risk. Listing must already exist. |
| **6** | Beat 6 — Defense Mode ⚠️ | **Record last among live beats.** This is the highest-risk take (live posture switch). After this, posture is Defensive — if you need to redo any Commercial-posture beat, you'll need to switch back. Record Beat 6 only when you are satisfied with all Commercial-posture takes. |
| **7** | Beat 8 — Command (if not captured earlier) | After Beat 6: posture is Defensive, Signal Feed has PostureChangedEvent, topology is amber. This is the ideal moment for Beat 8. Record the static hold immediately. |
| **8** | Beat 4 — Hostile denial | Separate session entirely. Different browser profile, different wallet. Capture the failed tx attempt. |
| **9** | Beats 1 + 9 — Title cards | Generated in Descript. No OBS needed. Do these last since they don't depend on app state. |

### Why this order:

- **Beats 2, 5, 3 first:** All require Commercial posture. Capture all Commercial-state footage before switching to Defensive.
- **Beat 6 last among live beats:** The posture switch is destructive to state — once you're in Defensive, going back to Commercial requires another tx and another Beat 6 won't work until you reset.
- **Beat 8 immediately after Beat 6:** The Defensive state is exactly what Beat 8 needs. The Signal Feed is freshly populated with the posture change event. Capture it while the state is perfect.
- **Beat 4 separately:** Different wallet, different browser. Don't contaminate the operator session.
- **Title cards last:** No dependencies, no risk.

---

## 6. Per-Beat Retake Triggers

Quick reference. If any of these occur, **stop and re-record immediately.**

| Beat | Redo if… |
|---|---|
| 2 — Power Reveal | Wrong posture visible. Structures not loaded. Map not framed. Mouse visible. |
| 3 — Policy | Pricing table not readable for ≥3s. Batch apply count wrong. Cascade didn't appear in Signal Feed. Mouse twitchy. |
| 4 — Denial | Hostile tx succeeded (policy misconfigured). MoveAbort error not visible. |
| 5 — Revenue | Transit Proof unavailable. Toll amount wrong. Signal Feed didn't update. |
| 6 — Defense Mode | Started in wrong posture. Cascade not visible. Mouse moved during transition. Tx failed. "STALE" banner appeared on turrets. Topology didn't shift colors. |
| 7 — Commerce | Listing not visible. Wrong price/item. Trade tx failed. No settlement event in Signal Feed. |
| 8 — Command | Wrong posture. Empty Signal Feed. Zero revenue. Mouse visible. |

Universal retake triggers (any beat):
- Any browser popup/notification appeared in frame
- OBS recording indicator was visible in frame
- An error toast or unexpected UI state appeared
- The browser URL bar was visible (should be in fullscreen or hidden)
- The recording was too short (less than the beat duration + 5s buffer)

---

## 7. Descript Assembly Notes

### Audio spine

The voice files in `recordings/voiceovers/` are the **primary timing reference.** All visual clips are trimmed to match, not the other way around.

Import all voice files and silence files into Descript. The narration timeline drives everything.

### Beat-by-beat audio assembly

| Beat | Audio track(s) | Notes |
|---|---|---|
| 1 | `b01-pain-a.mp3` | Single continuous VO. Visual slides are timed to match narration phrases. |
| 2 | `b02-power-a.mp3` → 2s silence → `b02-power-b.mp3` | The 2s silence after "CivilizationControl" is the interface breathing. |
| 3 | `b03-policy-a.mp3` → ~1s gap → `b03-policy-b.mp3` | Initial 3s silence before VO starts (visual hold on pricing table). |
| 4 | `b04-denial-a.mp3` → `b04-denial-b.mp3` | Continuous narration. Inset overlay appears during denial-a. |
| 5 | `b05-revenue-a.mp3` | Single continuous VO. |
| 6 | See phrase-splice path below | Most complex audio assembly. |
| 7 | `b07-commerce-a.mp3` | Single continuous VO. |
| 8 | `b08-command-a.mp3` → ~1s gap → `b08-command-b.mp3` | Final line has visible deceleration. |
| 9 | Silence (13s) | No narration. Just the title card hold. |

### Beat 6 phrase-splice assembly

This is the most precisely timed audio in the demo. In Descript, assemble in this order:

```
b06-defense-a.mp3          "Threat inbound."
sfx-silence-1000ms.wav     Dead silence — 1 second
b06-defense-b.mp3          "One click."
sfx-silence-2000ms.wav     Dead silence — 2 seconds (the visual transition plays here)
b06-defense-c1.mp3         "Gates locked."
sfx-silence-400ms.wav      Micro-pause
b06-defense-c2.mp3         "Turrets armed."
sfx-silence-400ms.wav      Micro-pause
b06-defense-c3.mp3         "One transaction."
```

After "One transaction," the remaining ~20 seconds of Beat 6 is **visual hold with silence.** The Signal Feed cascade and the amber topology are the only content.

### General assembly principles

- **Visual clips can be longer than needed.** Record long holds in OBS. Trim in Descript.
- **Silence windows are sacred.** Do not fill them with music, ambient sound, or narration. Voice + silence only (locked decision: no music in this demo).
- **Readability over motion.** When in doubt between a smooth camera movement and a static hold, choose the static hold. The UI communicates authority by being still.
- **Cuts between beats should be hard cuts.** No transitions, no crossfades, no wipes. Black → interface is the only allowed transition (Beat 1→2). All other beat transitions are straight cuts.
- **Beat 6 transition is NOT cut.** The teal→amber cascade must be one unbroken clip. Do not cut during the color transition.
- **Beat 4 inset** is the only picture-in-picture effect in the demo. Keep it small (lower-right, ~30% of viewport) and brief (~4 seconds).

---

## 8. Pre-Recording Verification Checklist

Complete every item before opening OBS.

### App State

- [ ] App is running at `localhost:5173` and fully loaded
- [ ] Wallet connected (operator wallet)
- [ ] Posture: Commercial
- [ ] All structures visible and loaded (10 gates, 2 trade posts, 36 turrets, 6 network nodes)
- [ ] Map camera framed with solar system labels visible
- [ ] Map camera locked (lock button engaged)
- [ ] Signal Feed has recent events (not empty)
- [ ] Revenue metric cards show values (not zero)
- [ ] No "STALE — REBIND" banners on turrets
- [ ] No error toasts or unresolved warnings

### Gate State (for Beats 3, 4, 5)

- [ ] At least one gate has tiered tribe pricing configured:
  - Static Conclave: 1,000 Lux
  - Wartime Republic: 25,000 Lux
  - Peaceful Trade Empire: 5,000 Lux
  - Default: 10,000 Lux
- [ ] "Apply to All Gates" button shows correct count
- [ ] Transit Proof section is functional on at least one gate

### Trade State (for Beat 7)

- [ ] SSU marketplace page loads at `/ssu/<SSU_ID>`
- [ ] A listing exists: 1,000 Eupraxite at 100,000 Lux
- [ ] Buying wallet has sufficient funds

### Browser

- [ ] Browser in fullscreen or URL bar hidden
- [ ] No bookmarks bar visible
- [ ] No other tabs open
- [ ] No browser extensions showing notifications
- [ ] Browser notifications disabled
- [ ] No autofill or password prompts pending

### OBS

- [ ] Resolution: 2560×1440
- [ ] Source: full browser viewport (no desktop/taskbar visible)
- [ ] Audio: disabled (no microphone, no desktop audio)
- [ ] Cursor: verify OBS cursor capture setting (OFF for static holds)
- [ ] Recording format: MKV
- [ ] Output directory: clean, named folder (e.g., `obs-captures/`)
- [ ] Test recording: 5-second test clip plays back at correct resolution

### Hostile Wallet (for Beat 4 — separate session)

- [ ] Separate browser profile with non-tribe wallet
- [ ] Wallet has SUI for gas (the tx will fail, but gas is still consumed)
- [ ] Know which gate ID to target for the failed jump attempt
