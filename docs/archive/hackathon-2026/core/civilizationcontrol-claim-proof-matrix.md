# CivilizationControl — Claim → Proof Matrix

**Retention:** Carry-forward

> Evidence ledger mapping every demo claim to its proof artifact.
> Sources: shortlist-viability-validation-report.md, gate-lifecycle-runbook.md, gatecontrol-feasibility-report.md, tradepost-cross-address-ptb-validation.md, zk-gatepass-feasibility-report.md, civcontrol-independent-audit.md
> Last updated: 2026-03-29 (Lux-first currency alignment, capture validation, gate count 10)

> **Currency note:** The demo narrative uses **Lux** as the primary player-facing display denomination and **EVE** as the secondary on-chain denomination (e.g., "1,000 Lux toll · 10 EVE"). Conversion: 100 Lux = 1 EVE. Sandbox validation artifacts in this matrix were captured using **SUI** (the native devnet coin). Submission-grade evidence will use the Lux/EVE denomination on the hackathon test server.
>
> **Capture note (2026-03-29):** Phase 2 Playwright validation confirmed: headed Chromium + Eve Vault is the viable recording path. Wallet popup opens in a separate OS window and does NOT contaminate the Playwright viewport capture. localStorage persistence (spatial pins, map camera, starfield) survives reload/navigation/relaunch. Per-scene short recordings (<60s) at 2560×1440 are the recommended capture strategy.

---

## How to Use This Document

Every claim made in the demo must trace to a row in this matrix. During demo recording, overlay the relevant evidence artifact (tx digest, object ID, balance delta) on-screen at the moment the claim is narrated. Rows marked `[TBD-digest]` require capture during hackathon build on the **hackathon test server** (primary build environment from March 11) — sandbox digests below are proof-of-pattern, not submission artifacts.

### Six Non-Negotiable Proof Moments

If the demo shows nothing else, these six overlays must appear on-screen with their tx digest or state proof. They are marked **★ Tier A** in the matrix below.

1. **Policy deploy** — tx digest proving gate policy preset was deployed to multiple gates in one batch PTB.
2. **Hostile denied** — pre-captured tx digest from hostile wallet showing MoveAbort when a wrong-tribe pilot attempts to jump. Shown as post-production overlay (operator dashboard cannot observe cross-wallet failures).
3. **Ally tolled + revenue** — tx digest showing `TollCollectedEvent` (CC custom event) + toll transfer, with operator balance delta.
4. **Defense mode** — single tx digest containing `PostureChangedEvent` + N × turret `ExtensionAuthorizedEvent` (world turret module), proving infrastructure-wide posture switch.
5. **Trade buy + settlement** — tx digest showing atomic buy (payment to seller, item to buyer, listing deactivated).
6. **Player marketplace** — player accesses SSU DApp URL from in-game browser, browses and purchases listing.

---

## GateControl

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| Gate extension system supports custom access rules | Code analysis — `gate.move` L105 `authorize_extension<Auth>()` | gatecontrol-feasibility-report.md §A | N/A (architecture proof) | Architecture diagram slide |
| ★ Tribe filter blocks non-matching tribes atomically | Devnet test — PLAYER_B (tribe 2) denied, MoveAbort code 0 (EAccessDenied) | shortlist-viability-validation-report.md Test 2 | Devnet checkpoint ~6500 (sandbox); `[TBD-digest]` (submission) | Red "Access Denied" overlay + error code callout |
| Tribe filter allows matching tribes | Devnet test — PLAYER_A (tribe 1) granted passage + 1 SUI toll transferred | shortlist-viability-validation-report.md Test 3 | Devnet checkpoint ~6260 (sandbox); `[TBD-digest]` (submission) | Green "Passage completed" overlay + `TollCollectedEvent` (CC custom event; see [read-path validation](../architecture/read-path-architecture-validation.md) §2.4) |
| ★ Coin toll collects payment atomically on jump | Devnet test — 1 SUI transferred to collector (ADMIN) address | shortlist-viability-validation-report.md Test 3 | GateConfig: `0xfbb73175002a87f1ffd6f56056e4e24d741176dd24d871b952c9c0abd1ce4160` (sandbox) | Balance delta overlay: collector +1 SUI |
| Rules compose as independent layers (tribe + toll on same gate) | Devnet test — PolicyPreset stored as dynamic fields on shared GateConfig (keyed by PolicyPresetKey{gate_id, mode}) | shortlist-viability-validation-report.md §Key Architectural Findings | GateConfig object ID above (sandbox) | Dynamic field inspector screenshot |
| Extension authorization registers on gate | Devnet lifecycle — `authorize_extension<TestAuth>` on both gates | gate-lifecycle-runbook.md Step 11c-d | `2miDiePXprTSj1Hfso88fHnwTUrE8ZbgaTVCiRLHF75x` (Gate A), `FPDV7Ur72fhEGfdVSi6kkTRyjntKfjidU23tcHYDZcS2` (Gate B) | Gate object `extension: Some(TypeName)` field. Also observable via `ExtensionAuthorizedEvent` (v0.0.15+ / commit 3cc9ffa) — Signal Feed enrichment via `suix_queryEvents` by `MoveEventType`. Fields: `assembly_id`, `assembly_key`, `extension_type`, `previous_extension`, `owner_cap_id`. |
| Jump permit issued to authorized pilot | Devnet lifecycle — JumpPermit created and transferred | gate-lifecycle-runbook.md Step 12 | `HTAR5Hmsj8LsFfzuunDJxNBEk2amHisCi95nzsMLetRa` | JumpPermit object fields overlay |
| Jump with permit succeeds (permit consumed) | Devnet lifecycle — JumpEvent emitted, permit deleted | gate-lifecycle-runbook.md Step 13 | `CzjEQmyRnKmUuCCLyEn8SmVVFogG4mmp6iZMPtvrXGs6` | Tx digest + JumpEvent in event list |
| Default jump blocked when extension is set | Code analysis + world-contracts tests — `gate_tests.move` L388-419 | gatecontrol-feasibility-report.md §A | N/A (test evidence) | "Default jump: BLOCKED" badge |
| Full 13-step gate lifecycle reproducible | Devnet lifecycle — all 13 steps executed with digests | gate-lifecycle-runbook.md Evidence section | 17 tx digests (see runbook) | Step count indicator |
| ~~Subscription pass bypasses toll for active subscribers~~ | DEFERRED — not implemented for demo | — | — | — |
| ~~Subscription purchase emits SubscriptionPurchasedEvent~~ | DEFERRED — not implemented for demo | — | — | — |
| ★ Policy change is a single operator action (UI claim) | Live — batch preset PTB deploys to N gates in one action | PolicyPresetEditor batch apply | `[TBD-digest]` (submission UI tx) | Before/after policy state + batch count overlay |

### Posture & Turret Doctrine (added 2026-03-24, revised 2026-03-23)

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| ★ Defense Mode — single click, infrastructure-wide posture switch | Live — single PTB fires set_posture + N × authorize_extension | postureSwitchTx.ts, posture.move, turret.move (unified module) | `[TBD-digest]` (submission UI tx) | PostureChangedEvent + ExtensionAuthorizedEvent entries in Signal Feed |
| Turret doctrine changes from Commercial → Defense atomically | Live — authorize_extension<DefenseAuth> replaces CommercialAuth per turret | world::turret::authorize_extension | `[TBD-digest]` | ExtensionAuthorizedEvent overlay: assembly_id, extension_type |
| Posture switch is reversible (Defense → Commercial) | Live — operator clicks Commercial mode, turrets swap back to CommercialAuth | postureSwitchTx.ts | `[TBD-digest]` | Before/after posture indicator + turret extension state |
| Turret targeting under CC doctrine (Tier 2 — revised) | **Downgraded.** Game engine calls `get_target_priority_list` via devInspect (read-only simulation). Events emitted during devInspect are NOT persisted. CC can only prove doctrine *authorization* (ExtensionAuthorizedEvent), not live engagement. **Module name fix (v3):** Unified `turret.move` module matches game engine's hardcoded `moduleName = "turret"` — extensions are now resolvable. Requires re-authorization after upgrade. | turret.move (unified), world::turret.move | N/A — no on-chain event | Proof-of-command: ExtensionAuthorizedEvent confirms CC doctrine is bound. Behavioral proof: fly neutral outsider to commercial gate → not targeted. |

### Batch Preset Deployment (added 2026-03-24)

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| ★ Policy preset authored once, deployed to N gates in one PTB | Live — batch apply button in PolicyPresetEditor | gatePolicyTx.ts buildBatchSetPolicyPresetTx | `[TBD-digest]` | Batch gate count + PolicyPresetSetEvent per gate in Signal Feed |
| Per-gate OwnerCap borrow/return in batch PTB | Code analysis — each gate's OwnerCap<Gate> borrowed and returned within the same PTB | gatePolicyTx.ts | N/A (pattern proof) | PTB structure diagram: borrow → set_policy_preset → return × N |

### Player-Facing Marketplace (added 2026-03-24)

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| Player marketplace page accessible via in-game DApp URL | Live — /ssu/:ssuId route renders standalone marketplace | SsuMarketplacePage.tsx | N/A (UI proof) | Screenshot of player-facing marketplace page |
| Player can buy listing from in-game browser | Live — useBuyListing hook signs purchase from player wallet | useBuyListing.ts, tradePostTx.ts | `[TBD-digest]` | ListingPurchasedEvent in Signal Feed |

## TradePost

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| ★ Cross-address atomic buy — buyer pays, receives item in one tx | Devnet test — 3 successful buys at different prices by different buyers | shortlist-viability-validation-report.md Test 5 | `3GtyTmJmLZxLQ3sqcuGTwoEm566Ts87c8Kedqjfh1NJ2` (Buy 3: Gem, 3 SUI) | Tx digest + `ListingPurchasedEvent` (CC custom) overlay |
| Seller receives payment without being online | Devnet test — seller balance increased, no seller signature at buy time | shortlist-viability-validation-report.md Test 5 | Same tx above; ADMIN balance +3 SUI confirmed | Balance delta overlay: seller +3 SUI |
| Listing deactivated after purchase | Devnet test — Listing `is_active: false` after buy | shortlist-viability-validation-report.md Test 5 | Listing `0x857a869108e853f26d48ae29886d1211514215643c829858e5649464bc8d9b69` | Before/after listing state |
| SSU-backed storefront — item withdrawn via extension witness (no OwnerCap sharing) | Devnet test — full SSU-backed buy lifecycle (6 txs) | shortlist-viability-validation-report.md Test 7 | Buy: `42Uc2VqSGuHx9rYqBRNFJ3gUhgDpGmY76mjtVDM6usvw` | SSU items before/after (1→0) + buyer owns item |
| Extension witness pattern enables cross-address withdrawal | Devnet test — `withdraw_item<TradeAuth>()` without OwnerCap | shortlist-viability-validation-report.md Test 7; tradepost-cross-address-ptb-validation.md §A | Authorize ext: `H3R3xKnzT1ksqYioxbnTSKbQfMdebrb75Dp8Qb2A3jcP` | Architecture diagram: buyer tx → TradeAuth witness → SSU main inventory |
| Atomic PTB composition (split-coins + buy in one tx) | Devnet test — `--split-coins gas → --assign payment → --move-call buy` | shortlist-viability-validation-report.md §Key Architectural Findings | All 3 buy tx digests above | PTB structure callout |
| Seller balance increases, buyer balance decreases (verified) | Devnet test — SSU-backed buy balance delta | shortlist-viability-validation-report.md Test 7 | Seller: +5,000,000,000 MIST; Buyer: −5,003,084,680 MIST | Balance comparison table overlay |
| Storefront lifecycle: publish → setup → authorize → stock → list → buy | Devnet test — 6 sequential transactions all succeeded | shortlist-viability-validation-report.md Test 7 | Publish: `49KABHpbQJ1sDmkHvYdUTr9S8JWgjpgwu152Nmz1Qg7z`; Setup: `3vjNNocmCDEnMeghPEwTQFow7RWzB56bxTKV72oRPyFg`; Stock: `CU6ZedANzjzpSiZtuicN2JjfwevjvtR1QRqhWHmCwfRt`; List: `VbTDAsE6xbDULr3jPXm6iXbJu8RFo6FUHvqjErRsuoc`; Buy: `42Uc2VqSGuHx9rYqBRNFJ3gUhgDpGmY76mjtVDM6usvw` | Step-by-step tx trail |

## ZK GatePass (Optional — Stretch Goal, Not in Demo)

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| Groth16 proof verifies on Sui (valid proof) | Devnet test — `is_valid=true` event emitted | shortlist-viability-validation-report.md Test 8; zk-gatepass-feasibility-report.md §2.1 | `AkEBgfdpGxHDNXVJ6HBAKFooWnD6F47gcYAzPnCbahQq` | VerificationResult event: `is_valid: true` |
| Invalid ZK proof correctly rejected | Devnet test — `is_valid=false` event emitted (wrong public inputs) | shortlist-viability-validation-report.md Test 9 | `5KeDVBqehTPfizA8GGm2VmySfvHWAdzTd375DMuFdJwt` | VerificationResult event: `is_valid: false` |
| ZK verification + gate witness consumption in single tx | Devnet test — ZKAuth issued, Auth consumed, CompositionResult event | shortlist-viability-validation-report.md Test 10; zk-gatepass-feasibility-report.md §2.1 | `EXM4RgMvYBba3RGFen6Ds8vtNthnaZvfsMP9BeEeDdik` | CompositionResult event: `zk_verified: true, auth_consumed: true` |
| Membership circuit (Merkle proof, depth 10, Poseidon(2)) works on-chain | Devnet test — valid Merkle proof verified, invalid root rejected | zk-gatepass-feasibility-report.md §2.2; shortlist-viability-validation-report.md §ZK addendum | Package: `0xc0af245bb364485749ccc8dae4cfd86b3af4fea6b2aa54b9a7970dbae322ea00` | ZKAuth + membership circuit stats (2,430 constraints, 128-byte proof) |
| ZK verification gas is negligible (~0.001 SUI) | Devnet measurement — ~1,009,880 MIST per verify | zk-gatepass-feasibility-report.md §2.1 | All 3 ZK tx digests above (each 1,009,880 MIST) | Gas cost callout: "< 0.001 SUI per ZK verify" |
| Dynamic ZK config (shared VK storage + verify + gate mock) | Devnet test — ZKGateConfig created, verify_and_pass_to_gate succeeded | zk-gatepass-feasibility-report.md §2.2 | `[TBD-digest]` (membership config tx) | Shared config flow diagram |

## Cross-Cutting / Architecture

| Demo Claim | Evidence Type | Source | Tx Digest / Object ID | Demo Overlay Format |
|---|---|---|---|---|
| Typed witness extension pattern is the foundation for both GateControl and TradePost | Code analysis + devnet validation | shortlist-viability-validation-report.md §Key Architectural Findings; tradepost-cross-address-ptb-validation.md §A | N/A (pattern proof) | Architecture slide: Auth{drop} → authorize → operate |
| All Move tests pass (26/26 GREEN) | Move test suite | `sui move test --path contracts/civilization_control` | 26 tests (16 gate_control + 10 trade_post) | Score badge: "26/26 GREEN" |
| Two published extension packages validated | Devnet publication | shortlist-viability-validation-report.md §Published Packages | `gate_toll_validation`: `0xe62e64a53bc28ef3a3bd5da9412bf4c8360884db912e42e16f2cac003d5e63ec`; `trade_post_validation`: `0x5c5598bf0d677db297539e9d78ca732573d50bc290d737bbeea50660bb43c0fe` | Package ID callout |
| Shared objects enable cross-address coordination | Code analysis + devnet validation | shortlist-viability-validation-report.md §Key Architectural Findings | GateConfig + Listing + SSU all shared objects | Shared object icon badges |

---

## Utility Metrics

Three quantified targets for the demo. Values marked `[TBD]` are refined during demo recording with real submission-chain data.

### 1. Operations Reduction

**Target:** 20+ CLI commands → 1 click per gate policy change

| Metric | Baseline (CLI) | CivilizationControl | Evidence Source |
|---|---|---|---|
| Configure tribe + toll rule on one gate | ~8 CLI commands (build, publish, authorize extension, set tribe rule, set toll rule, verify state × 2) | 1 click ("Deploy Policy") | gate-lifecycle-runbook.md Steps 11a-11d |
| Full gate lifecycle setup | 13+ sequential CLI steps | [TBD] steps in UI | gate-lifecycle-runbook.md (13 steps documented) |
| Cross-address buy transaction | ~4 CLI commands (split-coins, assign, move-call buy, verify) | 1 click ("Buy") | shortlist-viability-validation-report.md Test 5 PTB pattern |

**Demo proof:** Side-by-side comparison — raw CLI vs CivilizationControl UI for the same policy change operation.

### 2. Governance Consequence

**Target:** [TBD] policy enforcements captured in demo (minimum 3: one deny, one toll-pass, one permit-jump)

| Metric | Target | Evidence Required |
|---|---|---|
| Hostile denied (tribe mismatch) | ≥1 pre-captured from hostile wallet (post-prod overlay) | Failed tx digest + MoveAbort code `(gate_control, EAccessDenied)` from hostile wallet. Operator Signal Feed does NOT show denial — MoveAbort reverts all events. Evidence is a post-production inset from the hostile’s perspective. |
| Ally tolled (payment + passage) | ≥1 visible in Signal Feed | Tx digest showing `PermitIssuedEvent` + `TollCollectedEvent` (CC custom events) via Transit Proof. `JumpEvent` requires AdminACL co-sign and is not dashboard-triggerable. |
| Revenue visible in real-time | Toll revenue counter updates during demo | Before/after balance delta for collector address |
| Policy change reflected in enforcement | ≥1 policy change → subsequent behavior change shown | Two tx digests: before policy (open) and after policy (filtered) |

**Demo proof:** Uninterrupted consequence sequence — set policy → hostile denied → ally tolled → revenue shown.

### 3. Economic Utility

**Target:** [TBD] SUI toll + trade revenue visible in Signal Feed during demo

| Metric | Target | Evidence Required |
|---|---|---|
| Toll revenue captured | ≥[TBD] SUI across demo gate jumps | Collector address balance delta |
| Trade revenue captured | ≥[TBD] SUI across demo TradePost buys | Seller address balance delta |
| Combined revenue visible | Total shown in Command Overview or Signal Feed | Aggregate balance summary |
| Atomic settlement proof | ≥1 complete buy showing payment + item transfer in one tx | Tx digest with `ListingPurchasedEvent` (CC custom) + balance changes |

**Demo proof:** Revenue counter in Signal Feed ticking up as toll + trade events occur.

---

## Evidence Gaps (To Capture During Hackathon Build)

| Gap | What's Needed | When to Capture | Risk if Missing |
|---|---|---|---|
| Hackathon test server tx digests | All `[TBD-digest]` rows above | During build on hackathon test server (March 11+) | Cannot overlay tx proof in demo |
| UI-driven policy change tx | Single tx from "Deploy Policy" button | After GateControl UI is functional | Cannot prove operations reduction claim |
| UI-driven buy tx | Single tx from "Buy" button | After TradePost UI is functional | Cannot prove commerce UX claim |
| Real-time Signal Feed screenshot | Screenshot/recording of feed updating in real-time | During demo recording | Cannot prove monitoring claim |
| Revenue totals | Aggregate SUI revenue figures | At end of demo recording session | Cannot state quantified economic utility |
| Sponsored tx evidence (stretch) | Tx showing sponsor ≠ sender | If AdminACL access resolved on test server | Cannot prove gas abstraction claim |

---

## References

- [Shortlist Viability Validation Report](../operations/shortlist-viability-validation-report.md)
- [Gate Lifecycle Runbook](../operations/gate-lifecycle-runbook.md)
- [GateControl Feasibility Report](../architecture/gatecontrol-feasibility-report.md)
- [TradePost Cross-Address PTB Validation](../architecture/tradepost-cross-address-ptb-validation.md)
- [ZK GatePass Feasibility Report](../operations/zk-gatepass-feasibility-report.md)
- [CivilizationControl Independent Audit](../research/civcontrol-independent-audit.md)
- [Gate Lifecycle Evidence Notes](../../notes/gate-lifecycle-evidence.md)
