# Operator Validation Checklist — Manual Testing Runbook

**Date:** 2026-03-17  
**Preview URL:** https://feature-dashboard-foundation.civilizationcontrol.pages.dev  
**Purpose:** Smoke test covering all implemented dashboard surfaces, truthful extension detection, and EVE settlement.

> **Prerequisites:** EVE Frontier wallet with at least one Character that owns gates, turrets, SSUs, and/or network nodes on Utopia testnet. You must hold EVE tokens for toll/trade operations (SUI is gas-only).

---

## Pre-Flight: Fresh Publish State Reset

The CivilizationControl package was **freshly republished** on 2026-03-17 (new package `0x0f28...9adc`). All prior on-chain state is orphaned:

- **Extensions from the old package show as "STALE — RE-AUTH"** in the Gates/Turrets/Trade Posts lists and detail views.
- **Gate policies (tribe rules, coin tolls)** must be recreated after re-authorization.
- **Trade post listings** must be recreated.
- **Posture state** must be re-set if it was operator-configured.
- **AdminCaps belong to the publisher wallet** after fresh publish. They must be transferred to the operator wallet before policy/posture mutations will work. See "AdminCap Transfer" below.

**AdminCap Transfer (required after every fresh publish):**

Fresh publish mints new AdminCap objects to the publisher wallet. If the operator wallet is different, transfer both caps before using Defense Mode or gate policy features:

```bash
# GateControl AdminCap → operator wallet
sui client transfer --object-id 0xeba584423e82098457628c43295ef25a3e048b4cceaa486783e1ee841093f067 --to 0xad0221857e57908707762a74b68e6f340b06a6e9f991c270ae9c06cf1a92fb71

# TradePostAdminCap → operator wallet (not currently used by frontend, but transfer for consistency)
sui client transfer --object-id 0x1e3b214a00c7094ac77559f37e13199c8e6bb38bd903d6ceeb53d3219d2641cf --to 0xad0221857e57908707762a74b68e6f340b06a6e9f991c270ae9c06cf1a92fb71
```

⚠ Run these from the **publisher wallet** (`sui client active-address` must show `0xacff...54b1`).

**What changed in this build:**
- Extension authorization is now **type-aware** — it checks the on-chain TypeName against the current CC package ID. Old-package extensions show "STALE" instead of "AUTHORIZED".
- Re-authorize buttons appear on both list and detail screens when status is stale or none.
- Coin toll treasury address auto-fills with the connected wallet address.
- Tribe picker has 20 curated tribe names from the EVE Frontier API.
- **AdminCap ownership readiness gate** — Defense Mode and gate policy composer now check on-chain AdminCap ownership. If the connected wallet doesn't own the AdminCap, a clear blocker is shown instead of allowing a failing transaction.

---

## Step 1 — Wallet Connect & Asset Discovery

1. Open the preview URL.
2. Click "Connect Wallet" (EveVault).
3. **Expected:** Sidebar populates with your character name. Navigation shows: Command, Gates, Turrets, SSUs, Network Nodes, Trade Posts.
4. **Verify:** The count badges next to each nav item match the number of structures your character owns.

**Pass criteria:** All owned structures appear; no "Resolving chain state…" spinner persisting > 5 seconds.

---

## Step 2 — Gate List & Bulk Power Controls

1. Navigate to **Gates**.
2. Confirm all owned gates appear with their current online/offline status.
3. Select 2+ gates using checkboxes.
4. Click **"Bring Offline"** (bulk action bar).
5. Sign wallet transaction.
6. **Expected:** Selected gates show "Offline" status after ~3 seconds. Transaction toast confirms success.
7. Re-select the same gates → **"Bring Online"** → sign → confirm they return to "Online".

**Pass criteria:** Bulk online/offline round-trips successfully. Gate status updates in the list.

---

## Step 3 — Gate Detail & Extension Auth

1. Click any gate row to open the detail view.
2. Verify: gate metadata (name, solar system, online status) displays correctly.
3. If the gate has **not** been authorized for the CivilizationControl extension:
   - Click the "Authorize Extension" action.
   - Sign transaction.
   - Confirm the auth status changes.
4. Use the single-gate **Online / Offline** toggle and sign → verify state updates.

**Pass criteria:** Detail view renders. Extension auth succeeds. Single-gate power toggle works.

---

## Step 4 — Gate Tribe Rule & Tribes Autocomplete

1. On the gate detail screen, locate the tribe-access rule editor.
2. Start typing a tribe name (e.g., a known Utopia tribe) or enter a numeric tribe ID directly.
3. **Expected:** If a name match exists in the curated catalog, autocomplete appears. If a numeric ID is entered, the picker accepts it with fallback label "Tribe #<id>".
4. Select a tribe → confirm it is added to the rule list.
5. Remove a tribe → confirm it disappears.

**Pass criteria:** Autocomplete returns relevant options for known tribes. Numeric ID entry works for unknown tribes. Selection persists visually.

> **Note:** Tribe names come from a curated catalog (environment-specific). Unknown tribe IDs display as "Tribe #<id>". Tribe rules are config-level data (CivilizationControl's GateConfig).

---

## Step 5 — Turret List & Bulk Power Controls

1. Navigate to **Turrets**.
2. Confirm all owned turrets appear with status indicators.
3. Select 2+ turrets → **"Bring Offline"** → sign.
4. **Expected:** Selected turrets show "Offline" after confirmation.
5. Re-select → **"Bring Online"** → sign → confirm they return to "Online".

**Pass criteria:** Bulk online/offline round-trips for turrets.

---

## Step 6 — Turret Detail & Extension Auth

1. Click any turret row to open its detail view.
2. Verify metadata renders (name, solar system, online/offline status).
3. If not yet authorized, run **Authorize Extension** → sign → confirm.
4. Toggle single-turret power state → sign → verify.

**Pass criteria:** Detail view renders. Single-turret operations succeed.

---

## Step 7 — SSU List & Bulk Power Controls

1. Navigate to **SSUs**.
2. Confirm all owned storage units appear.
3. Select 2+ SSUs → **"Bring Offline"** → sign.
4. **Expected:** Selected SSUs show "Offline."
5. Re-select → **"Bring Online"** → sign → confirm.

**Pass criteria:** Bulk SSU online/offline round-trips.

---

## Step 8 — SSU Detail, Inventory & Extension Auth

1. Click any SSU row to open its detail view.
2. Verify metadata renders.
3. Scroll to **Inventory** section → verify item entries show item name, quantity, volume.
4. Run **Authorize Extension** if needed → sign → confirm.
5. Toggle single-SSU power state → sign → verify.

**Pass criteria:** Inventory displays correctly with resolved item names. Power toggle works.

---

## Step 9 — Network Node List & Online Control

1. Navigate to **Network Nodes**.
2. Confirm all owned network nodes appear.
3. Select an offline node → **"Bring Online"** → sign.
4. **Expected:** Node shows "Online" after confirmation.
5. For **Bring Offline**: the UI should display a limitation notice ("not yet implemented — use in-game controls").

**Pass criteria:** Online toggle works. Offline action correctly shows limitation notice (does not attempt a broken transaction).

---

## Step 10 — Posture Switch (Gate Detail)

1. Return to any **Gate detail** screen.
2. Locate the posture control section (e.g., "Lockdown / Restricted / Open").
3. Switch to a different posture (e.g., Lockdown → Open).
4. **Expected:** Posture indicator updates. This is a local/config operation.
5. Confirm the posture label matches what you selected.

**Pass criteria:** Posture selector renders and switches cleanly.

---

## Step 10a — Toll Denomination Validation

1. Open any **Gate detail** → gate policy composer → Coin Toll editor.
2. Click **Edit** (or set a new toll if none exists).
3. **Input:** Enter "100" in the price field.
4. **Expected below input:** "≈ 10,000 Lux" helper text appears.
5. Click **Set Toll** → sign.
6. **Expected display:** "Price: 100 EVE (10,000 Lux)".
7. Click **Edit** again → input should pre-fill with "100".
8. **Verify edge cases:**
   - Enter "0.1" → Lux shows "≈ 10 Lux" → chain stores 100,000,000 base units.
   - Enter "5" → Lux shows "≈ 500 Lux".

**Denomination truth (non-negotiable):**
- 1 EVE = 100 Lux = 1,000,000,000 base units (on-chain)
- User types EVE → UI displays EVE + Lux → chain receives base units
- Existing chain value of 100,000,000 base units displays as "0.1 EVE (10 Lux)"

**Pass criteria:** Correct EVE/Lux ratio everywhere. No mislabeled base units.

---

## Step 10b — Network Node Fuel Type & Runtime

1. Navigate to **Network Nodes** list.
2. **Expected fuel column format:** `D1 • 3,571 / 3,571 units • ~14d 21h` (for D1 fuel at 10%).
3. Verify fuel type label matches what is loaded in-game (D1, D2, EU-40, SOF-40, SOF-80, or EU-90).
4. Click a node row → detail view Power State section.
5. **Expected:** Fuel shows type label, unit count / max, fill bar, and estimated runtime with efficiency annotation (e.g., "D1 @ 10% efficiency").
6. If fuel type is unknown, expect "Unknown fuel type — cannot estimate runtime" instead of a fake number.

**Fuel efficiency truth:**
| Fuel | Efficiency | 3,571 units runtime |
|------|-----------|---------------------|
| D1 | 10% | ~14d 21h |
| D2 | 15% | ~22d 7h |
| EU-40 / SOF-40 | 40% | ~59d 11h |
| SOF-80 | 80% | ~118d 22h |
| EU-90 | 90% | ~133d 17h |

**Pass criteria:** Runtime is NOT the old ~148d value. Fuel type name is resolved. Fill bar shows tank fullness.

---

## Step 10c — Posture Toll Preservation (Non-Regression)

1. Set a custom toll on a gate (e.g., "5 EVE" = 500 Lux).
2. Switch posture to **Defense Mode** → sign.
3. Switch back to **Commercial** → sign.
4. **Expected:** Toll still shows "5 EVE (500 Lux)" — NOT overwritten or removed.

**Pass criteria:** Toll survives posture round-trip. No flat 10 Lux restore.

---

## Step 10d — Posture Visual Confirmation Timing

1. Start in **Commercial** posture. Note the teal colors on topology glyphs (gates, turrets, NWN nodes) and the PostureControl dot.
2. Click **"Defense Mode"** → sign wallet transaction.
3. **Expected during execution:** PostureControl button shows "Executing…". Topology colors remain teal (no premature change).
4. **Expected after tx confirmation:** PostureControl label shows "Confirming…" briefly (while the chain re-read is in progress).
5. **Expected after chain re-read completes (~1–3s):** All posture-dependent colors transition from teal to amber over ~800ms:
   - Topology NWN node center glyph: teal → amber
   - Turret glyphs: teal → amber
   - Defense overlay: fades in over topology canvas
   - Node overlay label borders: teal → amber
   - PostureIndicator badges: "Commercial" deactivates, "Defensive" activates
   - PostureControl dot: teal → amber
   - TurretListScreen PostureBadge: teal → amber
6. PostureControl label transitions from "Confirming…" to "Defense Mode".
7. Signal Feed shows **PostureChangedEvent** ("Network posture: Commercial → Defense") within 30 seconds.

**Pass criteria:** Colors do NOT snap instantly on button click. Colors transition smoothly after confirmed chain re-read. The ~800ms animation is visible and feels deliberate, not fake.

**What to check for regressions:**
- If colors change BEFORE the button shows "Executing…": optimistic update bug (should not happen).
- If colors change but PostureChangedEvent does NOT appear in Signal Feed: possible parsing issue.
- If colors snap instantly with no visible transition: CSS transition not applied (check browser DevTools for `transition` styles).

---

## Step 10e — Transit Proof (Toll Collection via UI)

**Prerequisites:** Gate must have (1) extension authorized, (2) a linked destination gate (set in-game), (3) a tribe rule set (matching your character's tribe), and (4) optionally a coin toll configured. Operator wallet must hold EVE tokens if a toll is configured.

1. Navigate to a **Gate detail** screen where extension status is "AUTHORIZED."
2. Scroll to the **Transit Proof** section (appears only when extension is authorized).
3. **Expected:** Section shows the linked destination gate ID (truncated). If no linked gate, a "No linked destination gate" message appears — this gate cannot generate transit proof.
4. If a toll is configured, the button reads **"Generate Transit Proof (X Lux toll)"**.
5. Click **"Generate Transit Proof"** → sign wallet transaction.
6. **Expected on success:**
   - TxFeedbackBanner shows "Transit proof generated — check Signal Feed."
   - Signal Feed shows **TribeCheckPassedEvent** ("Transit Authorized") within 30 seconds.
   - If a toll was configured, Signal Feed also shows **TollCollectedEvent** ("X Lux toll collected").
7. **Expected on failure (wrong tribe):** TxFeedbackBanner shows error "Tribe not allowed — character tribe does not match gate rule." Transaction was aborted on-chain.

**Pass criteria:** Transit proof button fires, Signal Feed shows transit event(s). Toll amount matches configured toll.

**What this proves vs. does not prove:**
- **Proves:** Tribe rule enforcement works (TribeCheckPassed). Toll collection works (TollCollected). Events appear in Signal Feed. Revenue flows to operator.
- **Does NOT prove:** Actual character jump (requires AdminACL co-signature for `jump_with_permit`). Hostile denial observation (MoveAbort reverts all events — no Signal Feed entry for the operator).

---

## Known Limitations (Expect These)

| Behavior | Explanation |
|----------|-------------|
| NWN offline disabled | Hot-potato PTB pattern not yet implemented. Use in-game. |
| `link_gates` not available | Requires `verify_sponsor` — cannot be done from web wallet. |
| Stale read after tx | Data may take 1–3 seconds to refresh after a signed transaction. Refresh the page if stuck. |
| Large bundle warning | The JS bundle exceeds 500 KB (code-splitting planned for later). Does not affect functionality. |
| EVE balance required | Toll and trade operations require EVE tokens. SUI is used for gas only. If you have no EVE, toll/trade tests will fail with insufficient balance. |
| Fresh publish state reset | All extensions, policies, and listings from the previous package are orphaned. Re-authorize and recreate before testing. |

---

## Pre-Take Reset Procedure

Run this sequence before **every** demo recording take to return to a known starting state. Without this, leftover state from rehearsals will bleed into the recording.

### 1. Verify Environment

| Check | How | Expected |
|---|---|---|
| Correct chain | `sui client active-env` | `testnet_utopia` |
| Operator wallet connected in browser | Open app, check header | Character name + wallet badge visible |
| AdminCap ownership | App shows no "AdminCap not owned" blocker on posture control or gate policy | Posture switch button is enabled (or only blocked by extension auth) |

### 2. Reset Posture to Commercial Baseline

| Check | How | Expected |
|---|---|---|
| Current posture | Dashboard → PostureControl reads "Defense Mode" or "Commercial" | If already Commercial, skip |
| Switch to Commercial | Click "Stand Down" → sign tx | PostureControl reads "Commercial". Topology colors = teal. |

> **Why:** Demo starts with Commercial posture (Beat 2 shows "Open for Business"). If posture is Defense from a prior rehearsal, the demo spine sequence breaks.

### 3. Clear Gate Rules/Tolls

This ensures Beat 3 (tribe rule) and Beat 4 area (toll set) start from a clean state.

| Action | How | Resettable? |
|---|---|---|
| Remove existing tribe rules | Gate detail → TribeRuleEditor → ✕ button → sign | ✅ UI |
| Remove existing coin tolls | Gate detail → CoinTollEditor → Remove → sign | ✅ UI |

> **Important:** Each rule/toll removal is a separate transaction. If multiple gates have rules, remove them one gate at a time.

### 4. Verify Extension Authorization

| Structure | Check | Reset if stale? |
|---|---|---|
| Demo gate(s) | Gate detail → extension status = "AUTHORIZED" (not STALE, not NONE) | ✅ Click "Authorize Extension" → sign |
| Demo turret(s) | Turret detail → extension status = "AUTHORIZED" | ✅ Click "Authorize Extension" → sign |
| Demo SSU/TradePost | TradePost detail → extension status = "AUTHORIZED" | ✅ Click "Authorize Extension" → sign |

> **Note:** Extensions survive posture switches and rule changes. They only go stale after a contract republish. If extensions show "AUTHORIZED," no action needed.

### 5. Verify Trade Post State

| Check | How | Expected |
|---|---|---|
| No leftover listings | TradePost detail → Marketplace section | Either empty or listings you want to keep |
| Cancel unwanted listings | Click "Cancel" on any stale listing → sign | Listing disappears |
| SSU has saleable inventory | TradePost detail → Inventory section shows items | At least one item type with quantity > 0 |

> **Important:** Creating a listing escrows the item from inventory. Cancelling returns it. If inventory is empty, you cannot create listings during the demo.

### 6. Verify Signal Feed Baseline

| Check | How | Expected |
|---|---|---|
| Signal Feed loads | Dashboard → Signal Feed panel | Shows recent events (or empty if fresh state) |
| No misleading old entries | Scroll Signal Feed | Entries should not show confusing timestamps from hours/days ago that will appear during recording |

> **Note:** Signal Feed polls every 30 seconds. Old events from rehearsals WILL appear. They cannot be cleared — they are on-chain history. Plan narration to either start recording immediately after a fresh reset sequence (so new events are at the top), or accept that prior events are visible in the feed.

### 7. Pre-Record State Confirmation

Before pressing record, confirm:

- [ ] Posture: Commercial ("Open for Business")
- [ ] All demo gates: AUTHORIZED, no tribe rules, no coin tolls
- [ ] Demo gate for Beat 5: has linked destination gate (check Transit Proof section — if "No linked gate," Beat 5 falls back to narration)
- [ ] All demo turrets: AUTHORIZED (BouncerAuth for commercial posture)
- [ ] Demo SSU/TradePost: AUTHORIZED, has inventory, no unwanted listings
- [ ] Operator wallet has: SUI for gas, EVE for toll/trade demos
- [ ] Browser: clean (no bookmarks bar, no other tabs, no console open)
- [ ] Signal Feed: loading, no stale spinner

---

## Demo Spine Rehearsal Sequence

This is the exact sequence to rehearse and later record. Each step corresponds to a beat-sheet moment.

### Step R1 — Wallet Connect & Structure Discovery (Beat 2)

1. Load the app (cold or refresh).
2. Connect wallet (EveVault).
3. **Verify:** Sidebar populates with structures. Dashboard shows Command Overview with metrics, topology, Signal Feed.
4. **Confirm:** Posture reads "Commercial" / "Open for Business."

### Step R2 — Set Tribe Rule on Gate (Beat 3)

1. Navigate to Gates → click demo gate.
2. In TribeRuleEditor, select a tribe (e.g., your character's tribe) → click Set Rule → sign.
3. **Verify:** TribeRuleSetEvent appears in Signal Feed within 30 seconds.
4. **Verify:** Gate detail shows active tribe rule.

### Step R3 — Set Coin Toll on Gate (Beat 3)

1. In CoinTollEditor, enter toll amount in EVE (e.g., "5") → click Set Toll → sign.
2. **Verify:** CoinTollSetEvent appears in Signal Feed within 30 seconds.
3. **Verify:** Gate detail shows active toll with Lux secondary display.

### Step R3a — Generate Transit Proof (Beat 5 — Revenue)

1. Remaining on the demo gate detail screen, scroll to **Transit Proof** section.
2. **Prerequisite:** Gate must have a linked destination gate (set in-game). If "No linked destination gate" is shown, skip this step — Beat 5 must use narration/overlay instead.
3. Click **"Generate Transit Proof (X Lux toll)"** → sign.
4. **Verify:** TribeCheckPassedEvent ("Transit Authorized") appears in Signal Feed within 30 seconds.
5. **Verify:** TollCollectedEvent ("X Lux toll collected") appears in Signal Feed.
6. These are the live evidence moments for Beat 5. Note the tx digest for post-production overlay.

### Step R4 — Switch to Defense Mode (Beat 6)

1. Return to Dashboard.
2. Click "Defense Mode" on PostureControl → sign.
3. **Verify:** PostureChangedEvent appears in Signal Feed.
4. **Verify:** Topology colors shift teal → amber. Posture indicator updates.
5. **Verify:** TxFeedbackBanner shows tx digest.

### Step R5 — Create Trade Listing (Beat 7)

1. Navigate to Trade Posts → click demo SSU.
2. In CreateListingForm, select item type, set quantity and price → click Create → sign.
3. **Verify:** ListingCreatedEvent appears in Signal Feed.
4. **Verify:** Listing appears in the Marketplace grid.

### Step R6 — Buy Trade Listing (Beat 7)

1. On the same TradePost detail, click "Buy" on the listing just created → sign.
2. **Verify:** ListingPurchasedEvent appears in Signal Feed.
3. **Verify:** Listing disappears from grid (consumed).
4. **Verify:** TxFeedbackBanner shows success + digest.

### Step R7 — Return to Dashboard (Beat 8)

1. Navigate back to Dashboard.
2. **Verify:** Signal Feed shows the full cascade of events from steps R2–R6.
3. **Verify:** Revenue metrics reflect toll/trade activity.

### Post-Rehearsal: Reset for Next Take

Run the **Pre-Take Reset Procedure** above before the next rehearsal or recording take.

---

## Failure Escalation

If a step fails:
1. Note which step and the error message (screenshot or text).
2. Check browser console (F12 → Console) for red errors.
3. Confirm wallet is on **Utopia testnet** (not mainnet or devnet).
4. Report: step number + error + wallet address + structure ID if visible.
