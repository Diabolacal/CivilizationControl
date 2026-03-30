# CivilizationControl — TTS Generation Guide

**Retention:** Carry-forward
**Status:** v1.0 — 2026-03-29
**Branch:** `feat/demo-production`
**Canonical sources:**
- [Demo Beat Sheet](../core/civilizationcontrol-demo-beat-sheet.md) — locked narration + visual direction
- [Narration Direction Spec](narration-direction-spec.md) — voice config, delivery control, micro-pause spec

---

## 1. Folder & Naming Conventions

### Audio Output Folder

All generated TTS files go to:

```
recordings/voiceovers/
```

This folder already exists in the workspace and is .gitignored (binary audio files are not committed). The `recordings/README.md` is the only tracked file under `recordings/`.

### Silence Assets Folder

Pre-rendered silence files go to:

```
recordings/voiceovers/
```

Silence assets live alongside narration files for simplicity. They use an `sfx-` prefix to sort separately.

### File Format

| Type | Format | Rationale |
|------|--------|-----------|
| **TTS narration** | `.mp3` | ElevenLabs default export. Sufficient quality for demo narration. |
| **Silence assets** | `.wav` | Lossless silence. Avoids MP3 encoder artifacts on empty audio. |
| **Normalized masters** | `.wav` | If you normalize/level-match in post, export WAV for the editor timeline. |

### Naming Pattern

Sortable, zero-padded beat numbers. Lowercase. Hyphen-separated.

```
b{NN}-{beat-name}-{segment-letter}.mp3
```

Examples:
- `b01-pain-a.mp3`
- `b02-power-a.mp3` (isolated "CivilizationControl.")
- `b02-power-b.mp3` (rest of Beat 2)
- `b06-defense-a.mp3` ("Threat inbound.")
- `b06-defense-b.mp3` ("One click.")
- `b06-defense-c.mp3` ("Gates locked. Turrets armed. One transaction.")

If a beat has only one file, use `-a`:
- `b05-revenue-a.mp3`

### Silence Asset Names

```
sfx-silence-{duration}.wav
```

Required silence assets:

| File | Duration | Used In |
|------|----------|---------|
| `sfx-silence-300ms.wav` | 300ms | Beat 4 inter-sentence pause (if needed) |
| `sfx-silence-400ms.wav` | 400ms | Beat 6 inter-phrase fallback splice |
| `sfx-silence-500ms.wav` | 500ms | Beat 1 pre-tagline, Beat 8 pre-closing |
| `sfx-silence-1000ms.wav` | 1000ms | Beat 6 post "Threat inbound." |
| `sfx-silence-1500ms.wav` | 1500ms | Beat 2 post "CivilizationControl." |
| `sfx-silence-2000ms.wav` | 2000ms | Beat 6 visual dominance window |
| `sfx-silence-3000ms.wav` | 3000ms | Beat 3 visual-lead window |

Generate silence assets in any DAW or with ffmpeg:
```bash
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.3 -q:a 0 sfx-silence-300ms.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -q:a 0 sfx-silence-400ms.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.5 -q:a 0 sfx-silence-500ms.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1.0 -q:a 0 sfx-silence-1000ms.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1.5 -q:a 0 sfx-silence-1500ms.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 2.0 -q:a 0 sfx-silence-2000ms.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 3.0 -q:a 0 sfx-silence-3000ms.wav
```

### Raw vs Normalized

Keep it simple. Save ElevenLabs exports directly to `recordings/voiceovers/`. If you later need level-matched WAVs for the editor timeline, create a `recordings/voiceovers/normalized/` subfolder — but do not pre-create it. Most editors handle MP3 import and level normalization natively.

---

## 2. Beat-by-Beat Generation Table

### Voice Configuration (all beats unless noted)

| Parameter | Value |
|-----------|-------|
| Voice | Adela — Neutral, British and Polished |
| Model | Eleven Multilingual v2 |
| Speed | 0.79 |
| Stability | 80 |
| Similarity | 73 |
| Style Exaggeration | 0 |
| Speaker Boost | OFF |

**Per-beat overrides** are noted in the Special Notes column.

---

### Beat 1 — Pain

| Field | Value |
|-------|-------|
| **Duration target** | ~18s total narration window |
| **Segmentation** | Single block |
| **Files** | 1 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b01-pain-a.mp3` | `Ten gates link five systems on your EVE Frontier… Last night, two went offline. Nobody told you. Your pilots rerouted through hostile territory. Hostiles caught them hauling fuel.` *(pause)* `Every rule, every gate — a manual transaction. You have ten gates.` | Style exaggeration: **10–15** (only beat with >0). The ellipsis after "EVE Frontier" creates a natural breath. |

**Post-production silence:** 500ms silence before "Every rule, every gate" — trim or extend the natural pause in the generated audio to ~500ms. If the TTS generates insufficient pause, splice `sfx-silence-500ms.wav` at that point.

**Pronunciation check:** "EVE Frontier" — confirm "EVE" is pronounced as a word (rhymes with "Steve"), not spelled out.

**Retake flexibility:** Low. Single block, single delivery. Re-record the whole file if needed.

---

### Beat 2 — Power Reveal

| Field | Value |
|-------|-------|
| **Duration target** | ~20s total narration window |
| **Segmentation** | 2 files — isolate the product name |
| **Files** | 2 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b02-power-a.mp3` | `CivilizationControl.` | Single word + period. Must sound like a name stated as fact, not a product launch. No upward inflection. |
| `b02-power-b.mp3` | `Every structure you own… Gates, turrets, trade posts, network nodes. Status, policy, revenue — one view.` | Ellipsis after "you own" creates a beat before enumeration. Equal weight on all four list items. |

**Post-production silence:** Insert `sfx-silence-1500ms.wav` between `b02-power-a` and `b02-power-b`.

**Pronunciation check:** "CivilizationControl" — one compound word, no pause between "Civilization" and "Control." If TTS inserts a gap, re-record.

**Retake flexibility:** High for file A (single word — easy to re-record independently). Low for file B.

---

### Beat 3 — Policy

| Field | Value |
|-------|-------|
| **Duration target** | ~26s total narration window |
| **Segmentation** | 2 files — split around visual-lead silence |
| **Files** | 2 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b03-policy-a.mp3` | `You decide who crosses — and what each tribe pays.` | Em-dash creates a breath. No emphasis on "you." |
| `b03-policy-b.mp3` | `Allies at a thousand. Rivals at twenty-five thousand. Everyone else — the default.` *(pause)* `One directive. Applied across the network.` | Clipped delivery on amounts. Equal cadence for each amount clause. 400ms pause before "One directive." |

**Post-production silence:** Insert `sfx-silence-3000ms.wav` between `b03-policy-a` and `b03-policy-b`. This is the visual-lead window where the tiered pricing table is on screen with no narration.

**Pronunciation check:** None required.

**Retake flexibility:** Medium. File A is one sentence (quick re-record). File B has the amount enumeration — if cadence is uneven, re-record file B only.

---

### Beat 4 — Denial

| Field | Value |
|-------|-------|
| **Duration target** | ~18s total narration window |
| **Segmentation** | 2 files |
| **Files** | 2 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b04-denial-a.mp3` | `A hostile pilot — wrong tribe — tries to jump.` | Em-dashes around "wrong tribe" are a parenthetical aside. |
| `b04-denial-b.mp3` | `Denied. The chain enforced it. No override. No appeal.` | **"Denied." stays in-block.** Do NOT isolate it. Stability: **85**, style exaggeration: **0**. Zero emotional coloring. |

**Post-production silence:** 300ms between files A and B. Use natural pause or `sfx-silence-300ms.wav`.

**Pronunciation check:** None required.

**Retake flexibility:** High. If "Denied." has wrong inflection, re-record file B only. File A is independent.

**Why "Denied." is not isolated:** As a standalone single-word clip, TTS produces either an over-emphasized bark or an awkward micro-clip. Keeping it as the first sentence in a block with "The chain enforced it…" lets the period create a natural sentence-final pause. The gravity comes from the flat delivery, not from audio isolation.

---

### Beat 5 — Revenue

| Field | Value |
|-------|-------|
| **Duration target** | ~18s total narration window |
| **Segmentation** | Single block |
| **Files** | 1 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b05-revenue-a.mp3` | `An ally jumps through. A thousand Lux — the rate you set.` *(pause)* `Revenue to the operator.` *(pause)* `The gate pays for itself.` | Three sentences, same register. "The gate pays for itself" must sound like a factual observation, not a sales claim. |

**Post-production silence:** None. Trust TTS sentence-final pauses (periods create natural gaps).

**Pronunciation check:** "Lux" — confirm it's pronounced as a word (rhymes with "bucks"), not spelled out.

**Retake flexibility:** Low. Single block. Re-record the entire file if "The gate pays for itself" sounds like a tagline.

---

### Beat 6 — Defense Mode (CLIMAX)

| Field | Value |
|-------|-------|
| **Duration target** | ~8.5s of narration within a 30s beat |
| **Segmentation** | 3 files — maximum timing control |
| **Files** | 3 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b06-defense-a.mp3` | `Threat inbound.` | Two words. Period. No audio tag direction. Stability: **85**, style exaggeration: **0**. If pitch rises on "inbound" — reject the take. |
| `b06-defense-b.mp3` | `One click.` | Two words. Period. Same register as "Threat inbound." Stability: **85**, style exaggeration: **0**. |
| `b06-defense-c.mp3` | `Gates locked.`<br><br>`Turrets armed.`<br><br>`One transaction.` | **Double-newline separation** between phrases (see ElevenLabs v3 input below). Stability: **85**, style exaggeration: **0**. Slight deceleration on "One transaction." |

**ElevenLabs v3 input for file C** — paste exactly:
```
Gates locked.

Turrets armed.

One transaction.
```

**Post-production silence:**
- Insert `sfx-silence-1000ms.wav` after `b06-defense-a.mp3`
- Insert `sfx-silence-2000ms.wav` after `b06-defense-b.mp3` (visual dominance window)
- c1/c2/c3 splice uses `sfx-silence-400ms.wav` between each phrase (see below)
- No silence after `b06-defense-c3.mp3`

**Beat 6C assembly — DECIDED (2026-03-29):** Phrase-splice path chosen. The combined `b06-defense-c.mp3` is not used.

Assembly sequence:
1. `b06-defense-c1.mp3` — "Gates locked."
2. `sfx-silence-400ms.wav`
3. `b06-defense-c2.mp3` — "Turrets armed."
4. `sfx-silence-400ms.wav`
5. `b06-defense-c3.mp3` — "One transaction."

**Pronunciation check:** None required.

**Retake flexibility:** Maximum. Each file is independent. Re-record any individual clip without affecting others.

**This is the hardest beat to get right.** Generate this beat first (see §5 Generation Order).

---

### Beat 7 — Commerce

| Field | Value |
|-------|-------|
| **Duration target** | ~22s total narration window |
| **Segmentation** | Single block |
| **Files** | 1 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b07-commerce-a.mp3` | `A trade post on the far side of the network… A thousand Eupraxite. One hundred thousand Lux.` *(pause)* `Payment to the seller. Item to the buyer. One transaction.` | Ellipsis after "network" creates a scene-setting pause. "One hundred thousand" must be articulated clearly. |

**Post-production silence:** None. Trust TTS punctuation pauses.

**Pronunciation check:** **"Eupraxite"** — target pronunciation: **you-PRAX-ite** (3 syllables, stress on second). Do a standalone test generation before the full take. If TTS mispronounces, try phonetic variant: `"A thousand You-prax-ite."` and document which variant worked.

**Retake flexibility:** Medium. If "Eupraxite" pronunciation is wrong, re-record the entire file — it's one block.

---

### Beat 8 — Command

| Field | Value |
|-------|-------|
| **Duration target** | ~15s total narration window |
| **Segmentation** | 2 files — isolate closing line for deceleration control |
| **Files** | 2 |

| File | Narration Text | Notes |
|------|---------------|-------|
| `b08-command-a.mp3` | `Toll revenue. Trade revenue. Turrets armed. Every structure reporting.` | Four status items, period-separated. Systems-check cadence. Equal weight, equal pace. |
| `b08-command-b.mp3` | `Your infrastructure… Under your command.` | **Slowest delivery in the demo.** Stability: **85**, style exaggeration: **0**. Ellipsis creates a deliberate pause. "Under your command" must sound like a status confirmation, not a slogan. |

**Post-production silence:** Insert `sfx-silence-500ms.wav` between files A and B.

**Pronunciation check:** None required.

**Retake flexibility:** High. File B is the key — re-record independently if delivery sounds like a tagline. File A is a simple enumeration.

---

### Beat 9 — Close

| Field | Value |
|-------|-------|
| **Duration target** | 13s |
| **Segmentation** | No narration |
| **Files** | 0 |

No TTS generation. Title card hold with silence. Use silence in the editor timeline (or `sfx-silence-3000ms.wav` × 4 if a pre-built silence track is needed).

---

## 3. Complete File Inventory

### Narration Files (14 files)

| # | Filename | Beat | Content Summary |
|---|----------|------|-----------------|
| 1 | `b01-pain-a.mp3` | 1 — Pain | Full pain narrative + tagline |
| 2 | `b02-power-a.mp3` | 2 — Power | "CivilizationControl." |
| 3 | `b02-power-b.mp3` | 2 — Power | Structure enumeration + "one view" |
| 4 | `b03-policy-a.mp3` | 3 — Policy | "You decide who crosses…" |
| 5 | `b03-policy-b.mp3` | 3 — Policy | Tiered pricing + batch apply |
| 6 | `b04-denial-a.mp3` | 4 — Denial | Hostile pilot setup |
| 7 | `b04-denial-b.mp3` | 4 — Denial | "Denied. The chain enforced it…" |
| 8 | `b05-revenue-a.mp3` | 5 — Revenue | Ally toll + revenue |
| 9 | `b06-defense-a.mp3` | 6 — Defense | "Threat inbound." |
| 10 | `b06-defense-b.mp3` | 6 — Defense | "One click." |
| 11 | `b06-defense-c.mp3` | 6 — Defense | "Gates locked. Turrets armed. One transaction." |
| 12 | `b07-commerce-a.mp3` | 7 — Commerce | Trade post + settlement |
| 13 | `b08-command-a.mp3` | 8 — Command | Status enumeration |
| 14 | `b08-command-b.mp3` | 8 — Command | "Your infrastructure… Under your command." |

### Silence Assets (7 files)

| # | Filename | Duration |
|---|----------|----------|
| 1 | `sfx-silence-300ms.wav` | 300ms |
| 2 | `sfx-silence-400ms.wav` | 400ms |
| 3 | `sfx-silence-500ms.wav` | 500ms |
| 4 | `sfx-silence-1000ms.wav` | 1000ms |
| 5 | `sfx-silence-1500ms.wav` | 1500ms |
| 6 | `sfx-silence-2000ms.wav` | 2000ms |
| 7 | `sfx-silence-3000ms.wav` | 3000ms |

### Potential Fallback Files (3 files, only if Beat 6C pauses collapse)

| # | Filename | Content |
|---|----------|---------|
| 1 | `b06-defense-c1.mp3` | "Gates locked." |
| 2 | `b06-defense-c2.mp3` | "Turrets armed." |
| 3 | `b06-defense-c3.mp3` | "One transaction." |

**Total:** 14 narration + 7 silence = **21 files** (+ up to 3 fallback)

---

## 4. Post-Production Pause Handling

### Trusted to TTS Punctuation

These pauses are expected to come from the TTS engine via periods, ellipses, and em-dashes. No manual insertion needed unless the output is unusually compressed.

| Beat | Pause Point | Mechanism |
|------|-------------|-----------|
| 1 | Between sentences | Periods |
| 2B | After "you own" | Ellipsis |
| 3B | Between amount clauses | Periods |
| 3B | Before "One directive" | Period + natural gap |
| 4A | Around "wrong tribe" | Em-dashes |
| 4B | After "Denied." | Period (sentence boundary) |
| 5 | Between all sentences | Periods |
| 7 | After "network" | Ellipsis |
| 7 | Between trade sentences | Periods |
| 8A | Between status items | Periods |
| 8B | After "infrastructure" | Ellipsis |

### Inserted Manually in Post-Production

These pauses are silence splices — the TTS engine does not generate them. Insert the named silence asset at the specified point in the editor timeline.

| Beat | Between | Silence Asset | Duration |
|------|---------|---------------|----------|
| 1 | Before "Every rule, every gate" | `sfx-silence-500ms.wav` | 500ms |
| 2 | After `b02-power-a` | `sfx-silence-1500ms.wav` | 1500ms |
| 3 | After `b03-policy-a` | `sfx-silence-3000ms.wav` | 3000ms |
| 4 | After `b04-denial-a` | `sfx-silence-300ms.wav` | 300ms |
| 6 | After `b06-defense-a` | `sfx-silence-1000ms.wav` | 1000ms |
| 6 | After `b06-defense-b` | `sfx-silence-2000ms.wav` | 2000ms |
| 8 | After `b08-command-a` | `sfx-silence-500ms.wav` | 500ms |

### Split for Timing Control

These beats are split into multiple files specifically so that silence and pacing can be controlled precisely in the editor.

| Beat | Why Split |
|------|-----------|
| 2 | "CivilizationControl." needs independent retake + 1.5s silence after |
| 3 | 3.0s visual-lead window separates opening line from pricing narration |
| 4 | Setup and consequence are visually distinct (CC viewport vs hostile inset) |
| 6 | Three distinct phrases with different silence windows; maximum retake isolation |
| 8 | Closing line needs independent speed/deceleration control |

---

## 5. Generation Order

Generate in risk order — hardest and most retake-prone first.

### Phase 1: Validation (before full generation)

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 1 | Generate test: `"CivilizationControl."` | Single compound word, no gap. Stated as fact, not launched. No upward inflection. |
| 2 | Generate test: `"A thousand Eupraxite."` | Pronounced "you-PRAX-ite." Three syllables. |
| 3 | Generate test: `"Denied."` | Flat. No emotional coloring. No pitch drop. No vocal emphasis. |
| 4 | Generate test: `"Under your command."` | Status confirmation, not tagline. No warmth swell. |

If any test fails, adjust parameters or try phonetic variants before proceeding. Do not proceed to Phase 2 until all 4 pass.

### Phase 2: Precision Beats (timing-critical)

| Step | File | Why First |
|------|------|-----------|
| 5 | `b06-defense-c.mp3` | Hardest timing — triple-phrase with micro-pauses. Must validate v3 pause behavior. |
| 6 | `b06-defense-a.mp3` | "Threat inbound." — pitch direction is critical. |
| 7 | `b06-defense-b.mp3` | "One click." — must match register of file A. |
| 8 | `b08-command-b.mp3` | Closing line — deceleration must be right. |
| 9 | `b04-denial-b.mp3` | "Denied." — zero-inflection delivery is hard to nail. |

### Phase 3: Standard Beats (lower risk)

| Step | File | Notes |
|------|------|-------|
| 10 | `b02-power-a.mp3` | Single word — quick. |
| 11 | `b02-power-b.mp3` | Enumeration — check equal weight on list items. |
| 12 | `b03-policy-a.mp3` | One sentence. |
| 13 | `b03-policy-b.mp3` | Amount enumeration — check cadence. |
| 14 | `b04-denial-a.mp3` | Setup sentence. |
| 15 | `b01-pain-a.mp3` | Longest block. Style exag 10–15 (only non-zero beat). |
| 16 | `b05-revenue-a.mp3` | Simple block. |
| 17 | `b07-commerce-a.mp3` | Check Eupraxite pronunciation in context. |
| 18 | `b08-command-a.mp3` | Status enumeration. |

### Phase 4: Silence Assets

| Step | Action |
|------|--------|
| 19 | Generate all 7 silence WAV files using ffmpeg commands from §1. |

---

## 6. Fallback Handling

### Beat 6C: Inter-phrase pauses collapse

**Symptom:** "Gates locked. Turrets armed. One transaction." runs together with <350ms between phrases.

**Fix:**
1. Re-generate as 3 separate files: `b06-defense-c1.mp3`, `b06-defense-c2.mp3`, `b06-defense-c3.mp3`
2. Splice in editor: clip → `sfx-silence-400ms.wav` → clip → `sfx-silence-400ms.wav` → clip
3. Export the spliced version as `b06-defense-c.mp3` (replace the original)

### "Eupraxite" pronunciation wrong

**Symptom:** TTS says "yoo-PRAX-eet" or "yoo-prax-EYE-t" or similar.

**Fix:** Replace with phonetic prompt: `"A thousand You-prax-ite."` in the TTS input. If still wrong, try: `"A thousand Euprax-ite."` Document which variant worked for future re-records.

### "CivilizationControl" over-emphasized

**Symptom:** TTS adds drama, pauses within the word, or inflects upward.

**Fix:** Re-generate `b02-power-a.mp3` only. Try lowering style exaggeration to exact 0 and stability to 85. The rest of Beat 2 (`b02-power-b.mp3`) is unaffected.

### "Under your command" sounds like a tagline

**Symptom:** Warmth surge, emphasis on "your" or "command," upward terminal inflection.

**Fix:** Re-generate `b08-command-b.mp3` only. Increase stability to 85–90. If still fails at 90, try: `"Your infrastructure. Under your command."` (period instead of ellipsis — removes the dramatic pause that may trigger expressive delivery).

### "Denied." is theatrical

**Symptom:** Vocal drop, emphasis, or dramatic weight on the word.

**Fix:** Re-generate `b04-denial-b.mp3` (the full block, not "Denied." alone). Increase stability to 90. If still theatrical, try prefixing the block with a throwaway lead-in sentence that you trim in post: `"The transaction was processed. Denied. The chain enforced it. No override. No appeal."` — then trim "The transaction was processed." from the output.

### General: Take sounds too fast or too slow

**Fix:** Adjust Speed parameter by ±0.03 increments. Do not change stability or style exaggeration to compensate for pacing — those control different axes.

### General: Volume mismatch between takes

**Fix:** Normalize all final files to -16 LUFS (web video standard) using ffmpeg:
```bash
ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 output.wav
```

---

## 7. QC Checklist

Use this checklist for every generated file before saving it as the final take.

### Per-File Checks

- [ ] **Pronunciation correct** — Lux, Eupraxite, CivilizationControl, EVE Frontier all sound right
- [ ] **No emotional over-inflection** — flat, measured delivery throughout
- [ ] **No clipping** — no audible distortion at peaks
- [ ] **No TTS artifacts** — no pops, clicks, breath artifacts, or hallucinated sounds
- [ ] **Pauses acceptable** — punctuation pauses are present and natural (not collapsed or exaggerated)
- [ ] **Pace matches beat timing** — spoken duration fits within the beat's time window
- [ ] **Register consistent** — this file sounds like it belongs with the others (same speaker, same tone)

### Beat-Specific Checks

| Beat | Check |
|------|-------|
| 1 | "Nobody told you." — flat, no sympathy |
| 2A | "CivilizationControl." — single word, no drama |
| 2B | List items equal weight — no emphasis on final item "network nodes" |
| 3B | Amount clauses equal cadence — "a thousand" / "twenty-five thousand" / "the default" |
| 4B | "Denied." — zero emotional coloring |
| 5 | "The gate pays for itself." — factual observation, not sales pitch |
| 6A | "Threat inbound." — no rising pitch on "inbound" |
| 6C | Inter-phrase pauses ≥350ms between "Gates locked." / "Turrets armed." / "One transaction." |
| 7 | "Eupraxite" — you-PRAX-ite (3 syllables) |
| 8B | "Under your command." — status confirmation, not slogan |

### Full-Sequence Check (after all files generated)

- [ ] **Listen to all 14 files in beat order** without interruption
- [ ] **Register consistency** — no file sounds noticeably different in tone, speed, or volume
- [ ] **No acceleration through the sequence** — later beats should not feel faster than earlier ones
- [ ] **Beat 1 sounds slightly graver** than Beats 2–8 (style exaggeration difference is audible but subtle)
- [ ] **Beat 6 files sound identical in register** to each other — all three at stability 85

---

## 8. Editor Handoff Notes

This section is for the video editor / capture-edit workflow — what to expect from the audio files.

### Expected Inventory

- **14 narration MP3 files** in `recordings/voiceovers/`
- **7 silence WAV files** in `recordings/voiceovers/`
- **0–3 fallback files** (only if Beat 6C needed phrase splitting)
- Total: **21–24 files**

### Assembly Pattern

Each beat's audio timeline follows this pattern:

```
[narration file A] → [silence asset] → [narration file B] → ...
```

The silence assets are the "glue" between narration segments. They are not embedded in the TTS files.

### Files Intended for Splicing

| Beat | Assembly |
|------|----------|
| 1 | `b01-pain-a` (internal 500ms pause may need trim/extend) |
| 2 | `b02-power-a` → `sfx-silence-1500ms` → `b02-power-b` |
| 3 | `b03-policy-a` → `sfx-silence-3000ms` → `b03-policy-b` |
| 4 | `b04-denial-a` → `sfx-silence-300ms` → `b04-denial-b` |
| 5 | `b05-revenue-a` (no splicing) |
| 6 | `b06-defense-a` → `sfx-silence-1000ms` → `b06-defense-b` → `sfx-silence-2000ms` → `b06-defense-c` |
| 7 | `b07-commerce-a` (no splicing) |
| 8 | `b08-command-a` → `sfx-silence-500ms` → `b08-command-b` |
| 9 | No audio. Title card hold. |

### Files That Should Remain Untouched

These files should be placed on the timeline as-is, without trimming or modification:

- `b05-revenue-a.mp3` — single continuous block
- `b07-commerce-a.mp3` — single continuous block
- All `sfx-silence-*.wav` files — exact-duration silence

### Files Likely to Require Alternate Takes

Listed in descending retake probability:

1. **`b06-defense-c.mp3`** — inter-phrase pause timing is hard to get right on first try
2. **`b08-command-b.mp3`** — deceleration delivery is subjective
3. **`b04-denial-b.mp3`** — "Denied." inflection is easy to get wrong
4. **`b02-power-a.mp3`** — single-word clips are unpredictable in TTS
5. **`b06-defense-a.mp3`** — pitch direction on "inbound" matters

### Audio Level Target

Normalize all narration files to **-16 LUFS** before placing on timeline. ElevenLabs output volume varies between generations. The silence WAV files are already at digital zero (no normalization needed).

### No Background Music

The demo uses no background music. The silence windows (Beat 2: 1.5s, Beat 3: 3.0s, Beat 6: 1.0s + 2.0s) are intentional dead silence — not gaps to be filled.
