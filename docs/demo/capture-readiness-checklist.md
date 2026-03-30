# Capture-Readiness Checklist

**Date:** 2026-03-29
**Branch:** `feat/demo-production`
**Status:** Audio-ready. Pre-capture.
**Prerequisite:** TTS narration package verified complete (24 files in `recordings/voiceovers/`).

---

## 1. Per-Beat Audio → Scene Mapping

Each row maps: audio files → post-production silence → total audio duration → UI scene → capture method.

Durations are measured from actual generated files (Shell metadata, integer-second precision).

| Beat | Audio Files | Post-Prod Silence | Narration (s) | Silence (s) | Total Audio (s) | Beat Window (s) | UI Scene | Capture |
|------|------------|-------------------|---------------|-------------|-----------------|-----------------|----------|---------|
| **1 — Pain** | `b01-pain-a` | 500ms internal trim | 21 | 0.5 | ~21 | 22 | Text-on-black (ffmpeg) | G |
| **2 — Power** | `b02-power-a` → `sfx-1500ms` → `b02-power-b` | 1.5s between files | 1+9=10 | 1.5 | ~11.5 | 20 | Command Overview (full) | S |
| **3 — Policy** | `b03-policy-a` → `sfx-3000ms` → `b03-policy-b` | 3.0s between files | 3+10=13 | 3.0 | ~16 | 26 | Gate detail → Directive → batch apply → Signal Feed | S+L |
| **4 — Denial** | `b04-denial-a` → `sfx-300ms` → `b04-denial-b` | 300ms between files | 4+5=9 | 0.3 | ~9.3 | 18 | CC gate detail + hostile inset (post-prod) | X |
| **5 — Revenue** | `b05-revenue-a` | None | 10 | 0 | ~10 | 18 | Signal Feed toll entry + revenue metric | S |
| **6 — Defense** | `b06-defense-a` → `sfx-1000ms` → `b06-defense-b` → `sfx-2000ms` → c1/c2/c3 splice (§4) | 1.0s + 2.0s + 0.8s | 1+1+~4=~6 | 3.8 | ~9.8 | 30 | PostureControl → cascade → Signal Feed | S+L |
| **7 — Commerce** | `b07-commerce-a` | None | 12 | 0 | ~12 | 22 | Trade post storefront → buy → Signal Feed | S |
| **8 — Command** | `b08-command-a` → `sfx-500ms` → `b08-command-b` | 500ms between files | 5+3=8 | 0.5 | ~8.5 | 15 | Full Command Overview (wide shot) | S |
| **9 — Close** | None | 13s hold | 0 | 13 | 13 | 13 | Title card over Command Overview | G |

**Legend:** G=generated asset, S=pre-seeded state capture, L=live action, X=external insert

### Timing Observations

- **Beat 1 extended to ~22s (decided 2026-03-29).** Narration (21s) drives the beat window. Slower delivery accepted. All downstream beats shift +4s. Total demo: ~3:04 (under 3:05 ceiling).
- **Beat 6 has ~20s of non-audio time** within a 30s window. The cascade (~1.6s), holds, and world footage fill the remaining visual time. Beat 6C uses phrase-splice approach adding ~0.8s of inter-phrase silence.
- **Beat 8 audio (~8.5s) fits comfortably** in the 15s window. ~6.5s of pure visual hold on the Command Overview.
- **Beat 3 audio (~16s) fits within 26s.** ~10s of pure scene manipulation / transitions.

---

## 2. Capture Order (Risk-Ordered)

Record the hardest / most failure-prone beats first.

| Priority | Beat | Why First | Pre-Capture Requirement |
|----------|------|-----------|------------------------|
| 1 | **6 — Defense** | Live posture switch. Cascade timing. Highest visual complexity. | Posture in Commercial. Turrets rebound after upgrade. |
| 2 | **3 — Policy** | Live batch-apply. Wallet interaction. Signal Feed cascade. | Gate with tribe presets configured. |
| 3 | **4 — Denial** | Separate wallet. MoveAbort capture. External insert. | Second wallet not in allowed tribe. |
| 4 | **5 — Revenue** | Pre-seeded Transit Proof event. Signal Feed timing. | Transit Proof fired ≤30min before capture. |
| 5 | **7 — Commerce** | Pre-seeded trade listing + buy. | Listing created + bought before capture. |
| 6 | **2 — Power** | Static hold. Low risk. | Wallet connected, all surfaces populated. |
| 7 | **8 — Command** | Static hold. Low risk. | Post-Defense posture. Accumulated events. |
| 8 | **1 — Pain** | ffmpeg title card. Zero UI risk. | None. |
| 9 | **9 — Close** | ffmpeg title card. Zero UI risk. | None. |

---

## 3. Pre-Capture Chain State Checklist

Run through this before starting any recording session.

- [ ] **Sui active env:** Utopia testnet (`sui client active-env`)
- [ ] **App running:** `npm run dev` on port 5173
- [ ] **Wallet connected:** Eve Vault unlocked + connected in stable Chromium profile
- [ ] **All structures visible:** 10 Gates / 10 Governed / 2 Posts / 6 Nodes in Command Overview
- [ ] **Posture state:** Commercial (required for Beat 6 Defense switch)
- [ ] **Turrets rebound:** No "Turret Doctrine Rebind Required" banner in Turret List
- [ ] **Signal Feed populated:** Recent events visible (policy, toll, posture events from prep txs)
- [ ] **Map locked:** Camera angle locked via map lock button (persists via localStorage)
- [ ] **Gate Directive configured:** ≥1 gate with tiered tribe pricing (Static Conclave 1K, Wartime Republic 25K, Peaceful Trade Empire 5K, default 10K Lux)
- [ ] **Transit Proof ready:** At least one TollCollectedEvent available (or ready to fire)
- [ ] **Trade listing ready:** Eupraxite listing at 100,000 Lux on at least one trade post (or pre-bought for event capture)
- [ ] **Second wallet available:** For Beat 4 hostile denial capture (separate session)
- [ ] **Recordings directory clean:** No stale files from prior sessions in `recordings/segments/`

---

## 4. Beat 6C Assembly — DECIDED

**Decision (2026-03-29):** Use the phrase-splice path. The combined `b06-defense-c.mp3` is not used.

**Full Beat 6 assembly sequence:**
1. `b06-defense-a.mp3` — "Threat inbound."
2. `sfx-silence-1000ms.wav`
3. `b06-defense-b.mp3` — "One click."
4. `sfx-silence-2000ms.wav` (visual dominance window)
5. `b06-defense-c1.mp3` — "Gates locked."
6. `sfx-silence-400ms.wav`
7. `b06-defense-c2.mp3` — "Turrets armed."
8. `sfx-silence-400ms.wav`
9. `b06-defense-c3.mp3` — "One transaction."

Both combined and phrase-split files exist in `recordings/voiceovers/`. Only c1/c2/c3 are used in the final edit.

---

## 5. Beat 1 Timing — DECIDED

**Decision (2026-03-29):** Beat 1 extended to ~22s. Slower delivery accepted — sounds better. No re-record.

- Narration measured: 21s. Beat window: 22s (was 18s).
- All downstream beats shift +4s.
- Total demo: ~3:04 (under 3:05 ceiling).
- No compensating trims needed — Beat 2's hard cut from black absorbs the shift cleanly.

---

## 6. Beat 6 Rehearsal Protocol

**Purpose:** Verify posture switch timing against audio before committing to full capture. This is the single highest-risk beat — rehearse it first.

### Pre-rehearsal checks
- [ ] `npm run dev` running on port 5173
- [ ] Wallet connected, Command Overview loaded
- [ ] Posture shows **Commercial** ("Open for Business")
- [ ] Turret List: no "Turret Doctrine Rebind Required" banner
- [ ] Signal Feed visible and populated with recent events

### Rehearsal sequence

Play the Beat 6 audio files in a media player or editor timeline. Watch the app and execute the posture switch at the marked cue.

| Offset | Audio File | Visual Action / Check |
|--------|-----------|----------------------|
| 0:00 | `b06-defense-a` (1.4s) | Command Overview on screen. PostureControl visible. |
| ~0:01.4 | `sfx-silence-1000ms` (1.0s) | Hold. |
| ~0:02.4 | `b06-defense-b` (1.4s) | **Click "Defensive" NOW.** |
| ~0:03.8 | `sfx-silence-2000ms` (2.0s) | PostureControl: "Executing…" → wallet popup (separate window) → approve → "Confirming…" |
| ~0:05.8 | `b06-defense-c1` (1.4s) | Cascade should be completing. Turrets shift teal→amber. |
| ~0:07.2 | `sfx-silence-400ms` (0.4s) | Hold on amber state. |
| ~0:07.6 | `b06-defense-c2` (1.4s) | Full amber topology visible. |
| ~0:09.0 | `sfx-silence-400ms` (0.4s) | Hold. |
| ~0:09.4 | `b06-defense-c3` (1.6s) | Signal Feed: PostureChangedEvent visible. |

**Total audio runtime:** ~11.0s. Remaining visual buffer in 30s beat: ~19s.

### Verification
- [ ] Cascade completed before or during "Gates locked." narration?
- [ ] PostureChangedEvent visible in Signal Feed by end of sequence?
- [ ] Wallet popup did NOT contaminate viewport recording?
- [ ] Total elapsed: click → cascade complete = ____s (target: <3s)

### Recovery
After rehearsal, posture is Defensive. Switch back to Commercial before real capture — this is a second rehearsal of the same tx flow.
