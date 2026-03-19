# CivilizationControl — Narration Direction Spec (ElevenLabs v3)

**Retention:** Carry-forward

Production narration direction for the CivilizationControl hackathon demo video. Governs vocal delivery, pacing, silence windows, and TTS engine configuration for ElevenLabs Eleven v3.

**Status:** v1.2 — 2026-03-04 (gameplay/currency realism pass)
**Canonical source:** [Demo Beat Sheet v2](../core/civilizationcontrol-demo-beat-sheet.md)
**Voice doctrine:** [Voice & Narrative Guide](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md)
**Emotional target:** [Hackathon Emotional Objective](../strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md)

---

## Baseline Voice Configuration — Tested Reference Profile

The following configuration has been tested and confirmed as the demo baseline for all CivilizationControl demo narration. It is not permanently locked — future iterations may adjust parameters — but all future work must begin from this configuration to eliminate voice re-selection drift.

### Tested Parameters

| Parameter | Value |
|---|---|
| **Voice** | Adela — Neutral, British and Polished |
| **Model** | Eleven Multilingual v2 |
| **Speed** | 0.79 |
| **Stability** | 80 |
| **Similarity** | 73 |
| **Style Exaggeration** | 0 |
| **Speaker Boost** | OFF |

### Selection Rationale

- **Adela** selected for institutional neutrality and non-theatrical delivery. The voice's baseline register matches the command-layer authority doctrine without requiring suppression of natural expressiveness.
- **Speed 0.79** controls cadence under high stability. Default speed (1.0) at Stability 80 produces delivery that outpaces the visual pacing of the demo. 0.79 aligns spoken narration with the 2-second-ahead-of-UI protocol without dragging.
- **Stability 80** preserves authority without monotony. Sits in the Robust range where take-to-take consistency is high, while retaining enough natural micro-variance to avoid robotic delivery.
- **Similarity 73** avoids over-polished broadcast tone. Higher similarity values push Adela toward a studio-perfect sound that reads as "produced content" rather than "mission control." 73 retains clarity while sounding operational.
- **Style Exaggeration 0** preserves governance authority. Any style exaggeration introduces tonal variance that conflicts with the flat-delivery doctrine for Beats 4, 6, and 8.
- **Speaker Boost OFF** prevents artificial presence lift. Speaker Boost adds low-frequency warmth and proximity that shifts the voice toward "podcast host" rather than "systems operator." Locked off for the baseline.

### Revalidation Checklist

When onboarding a new session, switching machines, or after any ElevenLabs platform update, regenerate these three test phrases at the baseline parameters above and confirm:

| # | Test Phrase | Pass Criteria |
|---|---|---|
| 1 | "Denied." | Flat delivery. No emotional coloring. No pitch drop. No upward inflection. |
| 2 | "The gate pays for itself." | Measured pace. No vocal emphasis on "pays" or "itself." Sounds like a factual observation, not a sales claim. |
| 3 | "Under your command." | No warmth swell. No upward inflection on "command." Sounds like a status summary, not a tagline. |
| 4 | "Gates, turrets, trade posts, network nodes." | Identical cadence across all four items. No acceleration. No emphasis on the final item. |

If any test phrase fails, do not proceed with generation. Adjust parameters or re-select the voice per §2 Voice Selection Procedure.

---

## Table of Contents

1. [Rationale](#1-rationale)
2. [ElevenLabs Settings Recommendation](#2-elevenlabs-settings-recommendation)
3. [Delivery Control Table](#3-delivery-control-table)
4. [Annotated Narration Script](#4-annotated-narration-script)
5. [Defense Mode Moment Spec](#5-defense-mode-moment-spec)
6. [Voice Direction Appendix](#6-voice-direction-appendix)

---

## 1. Rationale

### Why Restrained > Dramatic

CivilizationControl's narration must sound like a mission controller on a routine shift — not a cinematic trailer, not a keynote pitch, not a crypto hype reel. The reasons are structural, not aesthetic:

1. **Confidence is the product signal.** The narrator should present the system as if it already works. Dramatic delivery implies the system needs selling. Restrained delivery implies the system speaks for itself.
2. **Judges evaluate 30+ demos.** Hype fatigue sets in by entry #5. A calm, measured voice cuts through because it is the anomaly. Restrained delivery is a competitive advantage.
3. **The demo carries the emotion.** Defense Mode — gates locking, turrets coming online, the silence after the click — creates the moment. The narrator's job is to frame it, not amplify it. Overdirection competes with the visual.
4. **The 3-Second Clarity Rule.** Every sentence must be immediately parseable. Dramatic inflection adds cognitive load. Flat, measured delivery keeps attention on content.
5. **Alignment to command-layer positioning.** CivilizationControl's voice is "professional governance — think mission control, not corporate SaaS." The narrator is the voice of the product. If the narrator sounds like a SaaS demo, the product sounds like SaaS.

### Alignment to Voice Doctrine

| Voice doctrine principle | Narration implication |
|---|---|
| Calm power — composed confidence | Narrator never raises voice. No urgency. Tempo does not accelerate. |
| Governance — decisions and oversight | Narrator describes what the operator decided, not what was clicked. |
| Authority — finality and precision | Statements land as fait accompli. Past tense. No hedging. |
| Temperature: cool, not cold | Warmth exists in the voice timbre, not in enthusiasm or inflection. |
| Density: spare | One idea per sentence. No subordinate clauses. No run-on narration. |

---

## 2. ElevenLabs Settings Recommendation

### Engine Configuration

| Parameter | Recommended Value | Rationale |
|---|---|---|
| **Model** | Eleven v3 (Eleven Multilingual v2 fallback) | v3 supports audio tags and punctuation-based pacing. Multilingual v2 as fallback if v3 produces instability. |
| **Stability slider** | **75–85 (toward Robust)** | Restrained delivery requires consistency. Creative/Natural settings introduce expressiveness that conflicts with the authority doctrine. See §6 for risk analysis. |
| **Speed** | **0.90–0.95** | Slightly below default (1.0). Measured pacing without dragging. Beat 6 (Defense Mode) should use 0.90. Opening and closing beats can use 0.95. |
| **Similarity / Clarity** | **80–90** (if available for selected voice) | High clarity ensures consonant articulation — critical for short declarative sentences. |
| **Style exaggeration** | **0–15** (minimal) | Style exaggeration introduces tonal variance. This demo requires near-zero variance. Only exception: Beat 1 (Pain) may tolerate up to 15 for slight gravity. |

### Voice Archetype

Do not select a specific voice. Select against these profile characteristics:

| Characteristic | Target |
|---|---|
| **Gender** | Male or female — no preference. Authority is register, not pitch. |
| **Age range** | 30–50. Neither youthful energy nor elderly gravitas. Professional middle. |
| **Accent** | Neutral English (GenAm or RP). No regional markers. No affect. |
| **Timbre** | Medium-low. Avoid breathy, nasal, or sibilant voices. |
| **Baseline delivery** | Flat-to-measured. The unmodified voice should already sound restrained. Do not choose an expressive voice and attempt to suppress it — that produces instability. |
| **Training samples** | If creating an IVC, source clips should be steady narration (documentary, instructional) — not acting, not conversation, not presentation. |
| **Emotional range** | Narrow. The voice should not naturally swing between excitement and calm. Choose a voice whose neutral state is the target. |

### Voice Selection Procedure

1. Filter ElevenLabs Voice Library for "Neutral" category voices.
2. Generate Beat 8 ("Your infrastructure. Under your command.") as test phrase at Stability 80.
3. **Pass criteria:** The output sounds like a status report. No upward inflection. No warmth surge. No emphasis on "your."
4. **Fail criteria:** The output sounds like a brand tagline, a motivational statement, or a question.
5. Generate Beat 6 post-silence line ("Gates locked. Turrets armed. One transaction.") at Stability 80.
6. **Pass criteria:** Each phrase is a separate declarative statement. No acceleration between phrases. Micro-pauses audible.
7. Select the voice that passes both tests with the least post-processing.

---

## 3. Delivery Control Table

| Beat | Time | Tone | Pacing | Stability | Style Exag. | Pause Notes |
|---|---|---|---|---|---|---|
| **1 — Pain** | 0:00–0:18 | Grave, measured — stating facts about loss, not dramatizing | Slow-measured. Each sentence is a separate weight. | 80 | 10–15 | 300ms between sentences. 500ms before "Configuring one gate takes thirteen commands." |
| **2 — Power Reveal** | 0:18–0:38 | Calm authority. The solution exists. It is not being introduced — it is being revealed. | Measured, unhurried. Hold after "CivilizationControl." | 80 | 0–5 | 1500ms silence after "CivilizationControl." 300ms between structure types in enumeration. |
| **3 — Policy** | 0:38–1:00 | Neutral-operational. Describing a governance action. | Slightly clipped — action sequence, not reflection. | 80 | 0–5 | 200ms between "Tribe filter: only Tribe 7" and "Toll: five EVE per jump." 400ms before "One action." |
| **4 — Denial** | 1:00–1:18 | Cold-precise. The system acted. The narrator reports the outcome. | Measured. "Denied" lands with zero inflection change. | 85 | 0 | 500ms between "Denied." and "The chain enforced it." 300ms before "No override. No appeal." |
| **5 — Revenue** | 1:18–1:36 | Neutral-factual. Revenue is stated, not celebrated. | Steady. No acceleration when toll is mentioned. | 80 | 0–5 | 200ms after "Five EVE collected." 400ms before "The gate pays for itself." |
| **6 — Defense Mode** | 1:36–2:06 | Restrained gravity. The climax is the silence, not the voice. | Slow. Deliberate. Each word in the post-silence line is isolated. | 85 | 0 | **See §5 for full Defense Mode timing spec.** Turrets armed, not "online." |
| **7 — Commerce** | 2:06–2:28 | Neutral-operational. Commerce is subordinate to Defense Mode. | Slightly faster than Beat 6 — returning to operational cadence. | 80 | 0–5 | 200ms between trade description sentences. |
| **8 — Command** | 2:28–2:43 | Authoritative finality. Closing the arc. | Slow-measured. The final line is the slowest delivery in the demo. | 85 | 0 | 500ms before "Your infrastructure. Under your command." Slight deceleration on "Under your command." |
| **9 — Close** | 2:43–2:56 | N/A — no narration | N/A | N/A | N/A | Title card hold. Silence. |

### Reading the Table

- **Stability** = ElevenLabs stability slider (0–100, higher = more Robust). 80–85 is the operational range for this demo. Never below 70.
- **Style Exag.** = Style exaggeration parameter. 0 = no exaggeration. Only Beat 1 (Pain) may exceed 10.
- **Pause Notes** = minimum silence between specified phrases. ElevenLabs v3 does not support SSML `<break>` tags. Pauses are achieved through punctuation (ellipses, periods, em-dashes) and post-production splicing.

---

## 4. Annotated Narration Script

The following script preserves the canonical narration from the Beat Sheet. Annotations are inline directives for ElevenLabs v3 delivery control.

### Formatting Key

- `[direction]` — ElevenLabs v3 audio tag (placed before the line, spoken silently by the engine as delivery context)
- `…` — Ellipsis: instructs v3 to add natural pause and weight
- `CAPS` — Emphasis via capitalization (v3 increases stress on capitalized words)
- `—` — Em-dash: short breath pause
- `//SILENCE Xs//` — Post-production silence insert (not a v3 tag — editor instruction)
- `//NOTE: ...//` — Production note, not spoken

---

### Beat 1 — Pain (0:00–0:18)

```
//NOTE: Speed 0.95. Stability 80. Style exaggeration 10-15.//

Nine gates link five systems on your EVE Frontier…
Last night, two went offline. Nobody told you.
Your pilots rerouted through hostile territory.
Hostiles caught them hauling fuel.

//SILENCE 0.5s//

Configuring one gate takes thirteen commands… You have nine gates.
```

**Delivery notes:**
- No audio tags. The gravity comes from content, not vocal affect.
- "Nine gates" lands first — numbers-before-context creates immediate grounding. Ellipsis after "EVE Frontier" creates a natural breath before the bad news.
- "Nobody told you." — Flat statement. No sympathy inflection.
- "Your pilots rerouted through hostile territory." — Cause stated. Period. The consequence follows as a separate sentence.
- "Hostiles caught them hauling fuel." — Six words, blunt, past tense. Fait accompli. No vocal dramatization.
- Ellipsis after "thirteen commands" lets the viewer multiply.

---

### Beat 2 — Power Reveal (0:18–0:38)

```
//NOTE: Speed 0.92. Stability 80. Style exaggeration 0-5.//

CivilizationControl.

//SILENCE 1.5s//

Every structure you own… Gates, turrets, trade posts, network nodes.
Status, policy, revenue — one view.
```

**Delivery notes:**
- "CivilizationControl." — Single word. Period. No upward inflection. This is a name stated as fact, not a product launch. The 1.5s silence after is a post-production insert.
- Ellipsis after "you own" creates a beat before the enumeration.
- "Gates, turrets, trade posts, network nodes." — Comma-separated list delivered with equal weight on each item. No acceleration through the list. No emphasis on the last item.
- Em-dash before "one view" creates a short pause that isolates the summary.

---

### Beat 3 — Policy (0:38–1:00)

```
//NOTE: Speed 0.95. Stability 80. Style exaggeration 0-5.//

You decide who crosses and what they pay.

Tribe filter — only Tribe Seven. Toll — five EVE per jump.

One action. Two rules. Deployed on-chain.
```

**Delivery notes:**
- "You decide" — No emphasis on "you." The operator's authority is assumed, not highlighted.
- Number normalization: "7" written as "Seven" to prevent TTS ambiguity. "5 EVE" written as "five EVE" — v3 handles small numerals well but explicit spelling is safer.
- "One action. Two rules. Deployed on-chain." — Three separate declarative statements. Period after each. Equal cadence. No acceleration. No emphasis on "on-chain."

---

### Beat 4 — Denial (1:00–1:18)

```
//NOTE: Speed 0.92. Stability 85. Style exaggeration 0.//

A hostile pilot — wrong tribe — tries to jump.

//SILENCE 0.3s//

Denied. The chain enforced it. No override. No appeal.
```

**Delivery notes:**
- Stability raised to 85 for this beat. Maximum consistency. No vocal variance.
- Em-dashes around "wrong tribe" create a parenthetical pause — informational aside, not dramatic aside.
- "Denied." — Period. Flat. This word must have zero emotional coloring. It is a status report.
- "No override. No appeal." — Two declarative phrases. Same pitch. Same speed. Same register as "Denied." The repetition of structure (No X. No Y.) provides rhythm without the narrator adding it.

---

### Beat 5 — Revenue (1:18–1:36)

```
//NOTE: Speed 0.95. Stability 80. Style exaggeration 0-5.//

An ally — right tribe — jumps through. Five EVE collected.

Revenue to the operator.

The gate pays for itself.
```

**Delivery notes:**
- Mirror structure of Beat 4 (ally/hostile, right/wrong tribe) — the narrator treats success and denial identically. Same register, same pacing. The system does not celebrate passage any more than it celebrates denial.
- "Revenue to the operator." — Factual. This is a ledger entry, not an achievement.
- "The gate pays for itself." — The single most important non-climax line. Deliver at the same measured pace. No vocal emphasis on "pays" or "itself." The insight is in the content. If the narrator emphasizes it, it becomes a sales pitch. If the narrator states it flatly, it becomes an obvious truth.

---

### Beat 6 — Defense Mode (1:36–2:06)

> **See §5 for complete Defense Mode timing spec.**

```
//NOTE: Speed 0.90. Stability 85. Style exaggeration 0.//

Threat inbound.

//SILENCE 1.0s//

One click.

//SILENCE 2.0s — visual dominance window//

Gates locked. Turrets armed. One transaction.
```

**Delivery notes:** Full spec in §5 below.

---

### Beat 7 — Commerce (2:06–2:28)

```
//NOTE: Speed 0.95. Stability 80. Style exaggeration 0-5.//

A trade post on the far side of the gate… A thousand Eupraxite. Ten EVE.

Payment to the seller. Item to the buyer. One transaction.
```

**Delivery notes:**
- Ellipsis after "gate" creates a scene-setting pause.
- "A thousand Eupraxite. Ten EVE." — Clipped. Product and price. No elaboration. "Eupraxite" pronounced "you-PRAX-ite."
- "Payment to the seller. Item to the buyer." — Parallel structure, equal weight. No emphasis on either actor.
- "One transaction." — Same cadence as Beat 3's "Deployed on-chain" and Beat 6's "One transaction." The repetition is structural, not accidental. The narrator's delivery must be identical each time — the viewer recognizes the pattern subconsciously.

---

### Beat 8 — Command (2:28–2:43)

```
//NOTE: Speed 0.90. Stability 85. Style exaggeration 0.//

Toll revenue. Trade revenue. Turrets armed. Every structure reporting.

//SILENCE 0.5s//

Your infrastructure… Under your command.
```

**Delivery notes:**
- "Toll revenue. Trade revenue. Turrets armed. Every structure reporting." — Four status items, period-separated. Enumerated like a systems check. Equal weight, equal pace.
- Ellipsis before "Under your command" creates a deliberate pause that separates the final statement.
- "Under your command." — The slowest line in the demo. Slight deceleration. No upward inflection. This is not a promise — it is a summary of what the viewer just witnessed. If the narrator delivers it like a tagline, it fails. If the narrator delivers it like a status confirmation, it succeeds.

---

### Beat 9 — Close (2:43–2:56)

```
//No narration. Title card: "CivilizationControl" — hold 13 seconds.//
//SILENCE: full duration//
```

---

## 5. Defense Mode Moment Spec

This is the climax. The narrator's restraint here determines whether the moment lands as authority or as theater.

### Timeline (30 seconds total)

| Time Offset | Duration | Content | Audio State |
|---|---|---|---|
| 0:00 (1:36 abs) | ~1.2s | Narrator: "Threat inbound." | Voice only |
| 1.2s | 1.0s | **Silence** | Dead silence — no music, no ambient, no narration |
| 2.2s | ~0.8s | Narrator: "One click." | Voice only |
| 3.0s | **2.0s** | **Silence — visual dominance window** | Dead silence. Screen shows posture shifting, gates changing color, turrets activating. This is the demo's hammer. |
| 5.0s | ~3.5s | Narrator: "Gates locked. Turrets armed. One transaction." | Voice only |
| 8.5s | 3.0s | Hold on transformed Command Overview | Silence or minimal ambient |
| 11.5s | ~18.5s | Signal Feed cascade + hold | Background state — narrator is done for this beat |

### Micro-Pause Specification: "Gates locked. Turrets armed. One transaction."

This three-phrase line is the most precisely timed narration in the demo.

| Phrase | Duration | Pause After | Notes |
|---|---|---|---|
| "Gates locked." | ~0.9s | **400ms** | Past tense. Fait accompli. The gates are already locked when the narrator speaks. |
| "Turrets armed." | ~0.9s | **400ms** | Same register, same pace as "Gates locked." No escalation. |
| "One transaction." | ~1.0s | — (beat ends) | Slight deceleration on "transaction." This is the proof claim. |

**Total spoken duration:** ~3.5 seconds (including micro-pauses)

### ElevenLabs v3 Implementation

Eleven v3 does not support SSML `<break>` tags. The pauses in this line are achieved through:

1. **Period separation.** Each phrase ends with a period. v3 inserts natural sentence-final pauses.
2. **Line separation.** If generating as a single block, write each phrase on a separate line. v3 interprets line breaks as paragraph boundaries and increases pause duration.
3. **Post-production trim.** Generate the three phrases as a single block. Measure inter-phrase silence in the output. If less than 350ms, add silence in audio editor. If greater than 500ms, trim.

**Recommended v3 input for this line:**

```
Gates locked.

Turrets armed.

One transaction.
```

**Alternative if v3 collapses the pauses:**

Generate each phrase as a separate TTS request and splice in post-production with 400ms silence between clips.

### Silence Windows: Implementation

The 1.0s and 2.0s silence windows are NOT generated by the TTS engine. They are:

1. **Silence files** — pre-rendered WAV/FLAC files of the target duration (1000ms, 2000ms).
2. **Editor splices** — inserted in the audio/video editor between narration clips.
3. **Never TTS-generated.** Do not attempt to produce silence via ellipses, blank text, or audio tags. TTS engines fill silence with artifacts.

### "Threat inbound." — Delivery Specification

- Two words. Period.
- No audio tag. No `[serious]` or `[grave]` direction.
- The words carry their own weight. The narrator states a fact at the same register as every other sentence in the demo.
- If the voice naturally drops pitch on "inbound" — acceptable. If it rises — reject the take. Rising inflection implies question or uncertainty.

### "One click." — Delivery Specification

- Two words. Period.
- Same register as "Threat inbound." These two phrases are a pair: situation → response.
- No pause within the phrase. "One" and "click" are spoken as a single unit.
- The click sound (if any) comes from the UI recording, not from the narration.

---

## 6. Voice Direction Appendix

### Justification for Stability Settings (75–85 Robust)

ElevenLabs v3 stability slider controls the variance envelope:

| Range | v3 Behavior | CivilizationControl Fit |
|---|---|---|
| 0–30 (Creative) | High expressiveness, emotional range, potential hallucinations (unexpected sounds, vocal artifacts) | **Reject.** Expressiveness conflicts with authority doctrine. Hallucination risk unacceptable for production narration. |
| 30–60 (Natural) | Balanced. Closest to reference voice. Some emotional responsiveness to audio tags. | **Marginal.** Acceptable for Beat 1 (Pain) if gravitas is needed. Too variable for Beats 4, 6, 8 where consistency is critical. |
| 60–85 (Robust) | Highly stable. Minimal responsiveness to directional prompts. Consistent delivery across takes. | **Target range.** Consistency is the priority. Reduced tag responsiveness is acceptable — this demo uses almost no audio tags by design. |
| 85–100 (Maximum Robust) | Near-monotone. May sound robotic. Minimal natural variation. | **Avoid.** Over-suppression removes the warmth that distinguishes "calm authority" from "flat reading." |

**Operating point: 80 (±5).** Beats requiring maximum consistency (4, 6, 8) use 85. Beats with more narrative content (1, 2, 5) use 75–80.

### Risks of Creative Instability

If stability drops below 70:
- v3 may introduce vocal fry, breath sounds, or micro-hesitations that sound natural in conversation but wrong in narration.
- Audio tags (if any are used) become unpredictable — a `[sighs]` tag may produce an audible sigh mid-sentence.
- Repeated generation of the same text produces noticeably different output, making splicing and retakes inconsistent.
- The voice may add emphasis where none is directed, particularly on emotionally charged words ("denied," "locked," "threat"), undermining the flat-delivery doctrine.

### Recording Checklist

Complete before generating any final narration audio.

| # | Check | Status |
|---|---|---|
| 1 | Voice selected per §2 Voice Selection Procedure — passes both test phrases | ☐ |
| 2 | Stability slider set to 80 (baseline) | ☐ |
| 3 | Speed set to 0.92 (baseline, adjust per beat) | ☐ |
| 4 | Style exaggeration set to 0 (baseline, Beat 1 may use 10–15) | ☐ |
| 5 | All numerals written as words in script ("Seven," "five EVE," "thirteen," "A thousand") | ☐ |
| 6 | "CivilizationControl" pronunciation verified — all syllables articulated | ☐ |
| 7 | "SUI" pronunciation verified — rhymes with "sweet," not "sue-ee" | ☐ |
| 8 | Test generation: Beat 4 "Denied." — confirm flat delivery, no emotional coloring | ☐ |
| 9 | Test generation: Beat 6 post-silence line — confirm micro-pauses between phrases | ☐ |
| 10 | Test generation: Beat 8 closing — confirm no upward inflection on "command" | ☐ |
| 11 | Silence files prepared: 0.3s, 0.5s, 1.0s, 1.5s, 2.0s WAV/FLAC | ☐ |
| 12 | Post-production editor configured for splice workflow | ☐ |
| 13 | Narration generated per-beat (not as single monolithic block) | ☐ |
| 14 | All takes reviewed for prohibited delivery patterns (see below) | ☐ |

### Prohibited Delivery Patterns

Reject any take that exhibits:

| Pattern | Why It Fails |
|---|---|
| Upward inflection on declarative sentences | Implies uncertainty. "Denied?" vs. "Denied." |
| Vocal emphasis on "you" or "your" | Sounds like direct address / sales pitch. Authority is assumed, not directed at the viewer. |
| Acceleration through enumerations | "Gates, turrets, trade posts, network nodes" must not speed up. Each item has equal weight. |
| Dramatic pitch drop on "Denied," "locked," or "threat" | Adds emotional coloring. These are system status words, not dramatic beats. |
| Warmth surge on closing lines | "Under your command" must not sound inspirational. It is a summary. |
| Breath sounds between short phrases | "Gates locked. [breath] Turrets armed." — the breath fills the micro-pause that should be silence. |
| Aspirated word-initial consonants | Over-emphasized "p" or "t" sounds (plosives) at sentence starts. Indicates the voice is "performing." |

### Pronunciation Dictionary

If using ElevenLabs pronunciation dictionary feature, include these entries:

| Grapheme | Alias/Phoneme | Reason |
|---|---|---|
| SUI | "SWEE" | Prevent "SOO-ee" or "SOO-eye" |
| EVE | "EEV" | Prevent "EH-vee" — single syllable, rhymes with "leave" |
| Eupraxite | "you-PRAX-ite" | Smart material item name — stress on second syllable |
| CivilizationControl | "Civilization Control" | Ensure compound word is articulated as two words with brief juncture |
| SSU | "S.S.U." | Spell out acronym — prevent "sue" |
| NWN | "N.W.N." | Spell out acronym |
| PTB | "P.T.B." | Spell out acronym (appears in post-production overlays only, but included for completeness) |

### Segment Generation Order

Generate and review narration in this order (matches recommended recording sequence from Beat Sheet):

1. **Beat 6 — Defense Mode** (climax — most demanding, generates the voice quality standard)
2. **Beat 4 — Denial** (stress test: flat delivery on emotionally charged content)
3. **Beat 8 — Command** (closing: must match Beat 6 register)
4. **Beat 2 — Power Reveal** (product name pronunciation + enumeration pacing)
5. **Beat 3 — Policy** (operational cadence baseline)
6. **Beat 5 — Revenue** (must match Beat 4 register — success and denial treated identically)
7. **Beat 7 — Commerce** (subordinate beat — must not exceed Defense Mode's weight)
8. **Beat 1 — Pain** (separate generation — may use slightly different stability/speed settings)

Generate the hardest beats first. If the voice cannot deliver Beat 6 and Beat 4 to spec, the voice is wrong — discard and re-select before generating remaining beats.

### Post-Production Assembly

1. Generate each beat as a separate audio file.
2. Normalize loudness across all beat files (target: -16 LUFS for web delivery).
3. Insert silence files at marked `//SILENCE Xs//` points.
4. Verify total narration audio duration aligns with beat timing (±1 second per beat).
5. Export assembled narration as single WAV (48kHz, 24-bit) for video editor import.
6. Final video assembly includes narration track + screen recording + post-production overlays.
7. Run [Post-Assembly Review Checklist](../core/civilizationcontrol-demo-beat-sheet.md#post-assembly-review-checklist) from the beat sheet before exporting the final cut.

---

## References

- [Demo Beat Sheet v2](../core/civilizationcontrol-demo-beat-sheet.md) — canonical timing, proof moments, pre-flight checklist
- [Voice & Narrative Guide](../strategy/civilization-control/civilizationcontrol-voice-and-narrative.md) — label mapping, microcopy, Narrative Impact Check
- [Hackathon Emotional Objective](../strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md) — Five-Pillar Lens, 3-Second Check, consequence layer
- [Product Vision](../strategy/civilization-control/civilizationcontrol-product-vision.md) — problem/vision/demo narrative
- [ElevenLabs v3 TTS Best Practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices#prompting-eleven-v3) — audio tags, stability slider, punctuation control, voice selection
- [SVG Topology Layer Spec](../ux/svg-topology-layer-spec.md) — ISA-inspired visual doctrine (aligned authority signal)
