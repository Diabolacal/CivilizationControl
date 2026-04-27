# Operator Validation Checklist — Manual Testing Runbook

**Date:** 2026-03-25
**Preview URL:** https://feature-ui-polish.civilizationcontrol.pages.dev
**Purpose:** Smoke test covering all implemented operator surfaces, extension lifecycle, gate policy presets, posture switch, trade post commerce, SSU player marketplace, turret doctrine, and demo rehearsal spine.

> **Prerequisites:** EVE Frontier wallet with at least one Character that owns gates, turrets, SSUs, and/or network nodes on Utopia testnet. You must hold EVE tokens for toll/trade operations (SUI is gas-only).

---

## Pre-Flight: Authority Model & State Baseline

CivilizationControl uses the **OwnerCap\<Gate\>** authority model. Each gate owner's Character already holds the OwnerCap for their owned structures — no capability transfer ceremony is needed. The frontend uses the `character::borrow_owner_cap<Gate>()` / `character::return_owner_cap<Gate>()` hot-potato pattern for every policy mutation.

**Current package:** `0xf2f1...d22f` (v3, published 2026-03-23)

**What this means for validation:**
- Any wallet that owns the gate's Character can manage that gate's policies — no capability transfer or publisher-wallet dependency.
- Extension authorization is **type-aware** — it checks the on-chain TypeName suffix against known CC auth types (`::gate_control::GateAuth`, `::turret::CommercialAuth`, `::turret::DefenseAuth`). Old-module extensions (e.g., `turret_bouncer::BouncerAuth`) show "STALE — RE-AUTH."
- After a fresh publish or package upgrade:
  - Extensions from old packages show as "STALE — RE-AUTH" in the list and detail views.
  - Gate policy presets must be recreated after re-authorization.
  - Trade post listings must be recreated.
  - Turret extensions must be re-authorized.

**State readiness checks:**

| Check | How | Expected |
|---|---|---|
| Correct chain | `sui client active-env` | `testnet_utopia` |
| Wallet owns gates | Open app → Gates nav | Count badge > 0; gate rows appear |
| OwnerCap resolved | Gate detail → policy editor loads | PolicyPresetEditor renders (not a blocker) |

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
   - Confirm the auth status changes to "AUTHORIZED."
4. Use the single-gate **Online / Offline** toggle and sign → verify state updates.

**Pass criteria:** Detail view renders. Extension auth succeeds (GateAuth registered on-chain). Single-gate power toggle works.

---

## Step 4 — Gate Policy Preset Editor

1. On the gate detail screen, locate the **PolicyPresetEditor** (two-tab interface: Commercial / Defense).
2. Select the **Commercial** tab.
3. Click **Create Preset** (or **Edit** if one exists).
4. Use the **TribePicker** to add a tribe entry — start typing a tribe name or enter a numeric tribe ID directly.
5. **Expected:** Autocomplete shows matches from the curated catalog. Numeric IDs are accepted with fallback label "Tribe #\<id\>".
6. For each tribe entry, toggle **access** (allow/deny) and set a per-tribe **toll** in EVE.
7. Set the **default_access** toggle (applies to tribes not listed).
8. Set the **default_toll** field (applies to tribes without a specific toll).
9. Click **Apply** → sign transaction.
10. **Verify:** `PolicyPresetSetEvent` appears in Signal Feed within 30 seconds.
11. **Verify:** Gate detail shows active preset with entry count, default access, and default toll.

12. Switch to the **Defense** tab and repeat (optional — verifies per-mode presets are independent).

**Removal test:**
1. Click **Remove Preset** on the Commercial tab → sign.
2. **Verify:** `PolicyPresetRemovedEvent` appears in Signal Feed.
3. **Verify:** Tab now shows "No commercial preset configured."

**Pass criteria:** Preset creation and removal round-trips. Events appear in Signal Feed. Each mode tab is independent.

> **Note:** Presets are per-gate, per-mode. Each gate can have one Commercial and one Defense preset stored as dynamic fields on the shared GateConfig.

---

## Step 4a — Batch Preset Deployment

1. Create or edit a preset on one gate (Commercial or Defense tab).
2. Below the preset form, locate the **Batch Apply** section listing other owned gates.
3. Select 2+ target gates using checkboxes.
4. Click **Apply to Selected Gates** → sign.
5. **Expected:** A single PTB deploys the same preset to all selected gates. One `PolicyPresetSetEvent` per gate appears in Signal Feed.
6. Navigate to one of the target gates to verify the preset was applied.

**Pass criteria:** Batch apply executes in one transaction. All target gates receive the preset.

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
3. **Extension section** shows:
   - "CC Extension Active" if authorized
   - "Stale — old package" if from a previous CC package
   - "None" if no extension registered
4. If not yet authorized or stale, click **Authorize Extension** → sign → confirm status changes to "CC Extension Active."
5. Toggle single-turret power state → sign → verify.

**Pass criteria:** Detail view renders. Turret extension shows active status. Single-turret operations succeed.

> **Note:** Turret extensions use the unified `turret` module (`CommercialAuth` / `DefenseAuth`). **After a package upgrade**, the Turret List shows a prominent amber **"Turret Doctrine Rebind Required"** banner with a **"Rebind Doctrine (N)"** button. Turrets with old extensions show "STALE — REBIND" (amber); turrets never authorized show "UNBOUND" (red). Clicking the button fires posture-aware `authorize_extension` (CommercialAuth for commercial posture, DefenseAuth for defense posture). No revoke is needed — `swap_or_fill` overwrites atomically. After rebind, turrets show "CC ACTIVE" (green). Posture switches also rebind turrets. The game engine hardcodes module name `turret` — old `turret_bouncer`/`turret_defense` modules are never resolved.

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
6. Locate the **In-Game DApp URL** section → verify the URL pattern for the SSU marketplace is displayed.

**Pass criteria:** Inventory displays correctly with resolved item names. Power toggle works. DApp URL section renders.

---

## Step 9 — Network Node List & Online Control

1. Navigate to **Network Nodes**.
2. Confirm all owned network nodes appear.
3. Select an offline node → **"Bring Online"** → sign.
4. **Expected:** Node shows "Online" after confirmation.
5. For **Bring Offline**: the UI should display a limitation notice ("not yet implemented — use in-game controls").

**Pass criteria:** Online toggle works. Offline action correctly shows limitation notice (does not attempt a broken transaction).

---

## Step 10 — Posture Switch

1. Navigate to the **Dashboard** (Command view).
2. Locate the **PostureControl** section. Current posture reads either "Open for Business" (Commercial) or "Defense Mode."
3. Click **"Defense Mode"** (or **"Stand Down"** if already in Defense) → sign wallet transaction.
4. **Expected during execution:** Button shows "Executing…" Topology colors remain unchanged.
5. **Expected after tx confirmation:** Button shows "Confirming…" briefly while chain re-read executes.
6. **Expected after chain re-read (~1–3s):** All posture-dependent colors transition over ~800ms:
   - Topology NWN node center glyph: teal → amber
   - Turret glyphs: teal → amber
   - Defense overlay: fades in
   - PostureIndicator badges: "Commercial" deactivates, "Defensive" activates
   - PostureControl dot: teal → amber
7. **PostureChangedEvent** appears in Signal Feed within 30 seconds ("Network posture: Commercial → Defense").
8. Sign "Stand Down" (back to Commercial) → verify reverse color transition (amber → teal).

**What happens on-chain:** A single PTB atomically:
- Calls `posture::set_posture()` for each gate (emits `PostureChangedEvent` per gate)
- Swaps turret extensions: `CommercialAuth` → `DefenseAuth` (or reverse)
- Each call borrows/returns `OwnerCap<Gate>` or `OwnerCap<Turret>` via the hot-potato pattern

**Pass criteria:** Posture round-trips Commercial → Defense → Commercial. Colors transition smoothly after confirmed chain re-read (not instant on button click). Events appear in Signal Feed.

---

## Step 10a — Toll Denomination Validation

1. Open any **Gate detail** → **PolicyPresetEditor** → Commercial tab → **Edit** (or Create).
2. Set the **default_toll** field to "100" EVE.
3. **Expected below input:** "≈ 10,000 Lux" helper text appears.
4. Click **Apply** → sign.
5. **Expected display:** Preset summary shows default toll "100 EVE (10,000 Lux)."
6. Click **Edit** again → input should pre-fill with "100."
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

## Step 10c — Posture Preset Preservation (Non-Regression)

1. Set a commercial preset on a gate with a default toll (e.g., "5 EVE" = 500 Lux).
2. Switch posture to **Defense Mode** → sign.
3. Switch back to **Commercial** → sign.
4. Navigate to the gate detail → PolicyPresetEditor → Commercial tab.
5. **Expected:** Preset still shows default toll "5 EVE (500 Lux)" — NOT overwritten or removed.

**Pass criteria:** Commercial preset survives posture round-trip. Presets are per-mode and independent of posture switches.

> **Architecture note:** Posture switches do NOT modify gate policy presets. Presets are stored as independent dynamic fields keyed by `(gate_id, mode)`. Switching posture only changes which mode's preset is evaluated during gate traversal.

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

**Prerequisites:** Gate must have (1) extension authorized, (2) a linked destination gate (set in-game), (3) a policy preset with at least default_access = true and a default_toll > 0. Operator wallet must hold EVE tokens if a toll is configured.

1. Navigate to a **Gate detail** screen where extension status is "AUTHORIZED."
2. Scroll to the **Transit Proof** section (appears only when extension is authorized).
3. **Expected:** Section shows the linked destination gate ID (truncated). If no linked gate, a "No linked destination gate" message appears — this gate cannot generate transit proof.
4. If a toll is configured, the button reads **"Generate Transit Proof (X Lux toll)"**.
5. Click **"Generate Transit Proof"** → sign wallet transaction.
6. **Expected on success:**
   - TxFeedbackBanner shows "Transit proof generated — check Signal Feed."
   - Signal Feed shows **PermitIssuedEvent** ("Transit Authorized") within 30 seconds.
   - If a toll was configured, Signal Feed also shows **TollCollectedEvent** ("X Lux toll collected").
7. **Expected on failure (wrong tribe):** TxFeedbackBanner shows error "Tribe not allowed — character tribe does not match gate policy." Transaction aborted on-chain with `(gate_control, EAccessDenied)`.

**Pass criteria:** Transit proof button fires, Signal Feed shows transit event(s). Toll amount matches configured policy preset default_toll.

**What this proves vs. does not prove:**
- **Proves:** Policy preset enforcement works (PermitIssued). Toll collection works (TollCollected). Events appear in Signal Feed. Revenue flows to operator treasury.
- **Does NOT prove:** Actual character jump (requires `verify_sponsor` co-signature for `jump_with_permit`). Hostile denial observation (MoveAbort reverts all events — no Signal Feed entry for the operator).

---

## Step 10f — Gate Permit Page (Player-Facing)

**Prerequisites:** Gate must have (1) extension authorized, (2) a linked destination gate, (3) a policy preset active for the current posture mode. A second wallet with a Character is ideal for testing the player perspective.

1. **Preferred (query-context) path:** Navigate to `https://<preview-host>/gate?itemId=1000000015746&tenant=utopia`.
2. **Expected:** Page auto-resolves the gate Sui object ID from the in-game itemId. Same permit page loads as the direct URL.
3. **Fallback (direct) path:** Navigate to `https://<preview-host>/gate/<gateObjectId>` using a gate you control.
4. Open in a browser with a **different wallet** (player wallet, not operator).
5. **Expected:** Wallet auto-connects (if EVE Frontier Client Wallet is present). If using EVE Vault in external browser, click Connect.
6. Page shows: gate ID (truncated), linked destination, player character name + tribe.
7. **Gate Policy section:** Shows preset entries (if any), default access/toll, or "Open passage."
8. If access denied by preset: button is disabled, red text explains the mismatch.
9. If toll required: button shows "Pay X Lux & Acquire Permit."
10. If no restrictions: button shows "Acquire Transit Permit."
11. Click the permit button → sign wallet transaction.
12. **Expected on success:** Page shows "Permit acquired" with tx digest.
13. **Expected on failure:** Error message in plain English (access denied, insufficient EVE, etc.).

**URL model (preferred):** The operator configures all gates' DApp URL in-game to `/gate`. The game client appends `?itemId=<inGameId>&tenant=utopia` automatically. The page derives the correct Sui object ID via deterministic derivation — no per-gate URL needed.

**URL model (fallback/debug):** `/gate/<gateObjectId>` — direct Sui object ID in URL path. Useful for testing or when the in-game item ID is unknown.

**Pass criteria:** Permit acquired by a non-operator player wallet. JumpPermit transferred to the player's character on-chain.

---

## Step 10g — SSU Marketplace Page (Player-Facing)

**Prerequisites:** An SSU/TradePost must have (1) extension authorized, (2) at least one active listing.

1. **Preferred (query-context) path:** Navigate to `https://<preview-host>/ssu?itemId=<ssuItemId>&tenant=utopia`.
2. **Expected:** Page auto-resolves the SSU Sui object ID from the in-game itemId. Standalone marketplace page loads (no operator sidebar).
3. **Fallback (direct) path:** Navigate to `https://<preview-host>/ssu/<ssuObjectId>`.
4. Open in a browser with a **player wallet** (not operator).
5. **Expected:** Wallet auto-connects. Page shows "Commerce Post — Marketplace" header with SSU ID.
6. **Listings section:** Shows all active listings with item name, quantity, price.
7. Click **"Buy"** on a listing → sign wallet transaction.
8. **Expected on success:** TxFeedbackBanner shows "Purchase confirmed." Listing disappears from grid. Signal Feed (on operator side) shows **ListingPurchasedEvent**.
9. If no listings: "No active listings" empty state with "Check back later" text.

**Pass criteria:** Player can browse and purchase listings from the standalone marketplace page. Purchase consumes listing and transfers item.

---

## Step 10h — Turret Doctrine Events in Signal Feed

1. Navigate to **Turrets** → click a turret to open detail view.
2. If not yet authorized, click **Authorize Extension** → sign.
3. **Verify:** Signal Feed shows "Turret Doctrine Set" event (parsed from `ExtensionAuthorizedEvent`) within 30 seconds.
4. If extension is authorized and revoke is available, click **Revoke Extension** → sign.
5. **Verify:** Signal Feed shows "Turret Doctrine Revoked" event (parsed from `ExtensionRevokedEvent`).

**Pass criteria:** Turret extension authorize/revoke events appear in Signal Feed with descriptive labels.

---

## Step 10i — Turret Engagement Proof (Defense Mode Beat)

This step verifies CivilizationControl's turret doctrine authorization capability.

**Critical finding (2026-03-22):** Turret targeting events (`BouncerTargetingEvent` / `DefenseTargetingEvent`) exist in Move code but the game engine almost certainly calls `get_target_priority_list` via **devInspect** (read-only simulation). Events emitted during devInspect are NOT persisted to the chain event store and cannot be queried. Additionally, no "turret fired" or "target damaged" event exists at any layer — engagement/damage is purely game-engine behavior. CC can only prove doctrine *authorization*, not live engagement.

**Turret doctrine semantics (2026-03-23, corrected):** Commercial (CommercialAuth) is passive until aggression — turrets stand down for ALL non-aggressors and engage ONLY active threats (+10000). Defense (DefenseAuth) actively targets non-tribe visitors (+5000) and aggressors at highest priority (+15000). Same-tribe non-aggressors excluded in both modes. Commercial = safe for neutral traffic; Defense = territorial.

### Proof Tier 1 — Doctrine Change (DApp-Only, Always Available)

This proves the operator controls turret targeting logic. This is the **only provable claim** from the web DApp.

1. Ensure at least one turret has CC extension authorized (Step 6).
2. Switch posture to Defense Mode (Step 10).
3. **Verify:** Signal Feed shows:
   - `PostureChangedEvent` ("Network posture: Commercial → Defense")
   - `ExtensionAuthorizedEvent` per turret ("Turret Doctrine Set — Defense")
4. Switch back to Commercial.
5. **Verify:** Reverse events appear (Defense → Commercial).

**Pass criteria:** Doctrine swap events appear in Signal Feed. This is the baseline and maximum proof for the beat sheet.

### Proof Tier 2 — Live Engagement (Observation Only — No Signal Feed Event)

Turret engagement can be observed in the EVE Frontier game client but **will not produce Signal Feed entries**. The game engine determines firing from the extension's priority list but handles all damage/engagement off-chain.

**What the operator can verify in-game:**
- In commercial mode, turrets stand down for neutral visitors (no firing on non-aggressors)
- In defense mode, turrets fire at non-tribe visitors who enter range
- Switching doctrine (Bouncer → Defense) changes engagement rules: passive → territorial
- Same-tribe members are protected in both modes
- Aggressors are targeted in both modes

**What CC cannot surface:**
- Turret "fired at target" events (no such on-chain event exists)
- Targeting evaluation events (emitted via devInspect, not persisted)
- Damage/kill events (game-engine only)

### Honest Framing for Demo

| Proof Level | What It Shows | Demo Claim Strength |
|---|---|---|
| Tier 1 (doctrine swap) | Operator controls what targeting logic runs | "Turrets re-armed" — **strong** |
| Tier 2 (in-game observation) | Turret actually fires under CC doctrine | "Infrastructure responds to threats" — **strong but not DApp-provable** |

> **Note:** Never script or promise engagement events in Signal Feed. They will not appear. The beat sheet (Beat 6) uses the posture switch + doctrine authorization events as the provable action.


---

## Known Limitations (Expect These)

| Behavior | Explanation |
|----------|-------------|
| Extension persists after preset removal | Removing all policy presets does NOT deregister the GateAuth extension. The gate still requires a JumpPermit, blocking default `gate::jump()` in-game. To fully open a gate, you must also call `gate::revoke_extension_authorization()` via CLI PTB. |
| Gate permit URL supports both query-context and direct paths | **Preferred:** Set gate URL to `/gate` — game client appends `?itemId=&tenant=` and page derives the Sui object ID. **Fallback:** `/gate/<objectId>` still works for debug/manual use. The ObjectRegistry address (`0xc2b9...dc57`) is hardcoded for Utopia testnet — if the world package is redeployed, this address would need updating. |
| SSU marketplace URL supports both paths | **Preferred:** `/ssu?itemId=&tenant=` (query-context). **Fallback:** `/ssu/<ssuObjectId>` (direct). |
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
| Posture switch enabled | PostureControl button is enabled (or only blocked by "missing extension" warning) | No critical blockers |

### 2. Reset Posture to Commercial Baseline

| Check | How | Expected |
|---|---|---|
| Current posture | Dashboard → PostureControl reads "Defense Mode" or "Open for Business" | If already Commercial, skip |
| Switch to Commercial | Click "Stand Down" → sign tx | PostureControl reads "Open for Business." Topology colors = teal. |

> **Why:** Demo starts with Commercial posture (Beat 2 shows "Open for Business"). If posture is Defense from a prior rehearsal, the demo spine sequence breaks.

### 3. Clear Gate Policy Presets

This ensures Beat 3 (preset creation) starts from a clean state.

| Action | How | Resettable? |
|---|---|---|
| Remove existing commercial preset | Gate detail → PolicyPresetEditor → Commercial tab → Remove Preset → sign | ✅ UI |
| Remove existing defense preset | Gate detail → PolicyPresetEditor → Defense tab → Remove Preset → sign | ✅ UI |

> **Note:** Preset removal deletes the entire preset (entries + default_access + default_toll) in one transaction per mode.

### 4. Verify Extension Authorization

| Structure | Check | Reset if stale? |
|---|---|---|
| Demo gate(s) | Gate detail → extension status = "AUTHORIZED" (not STALE, not NONE) | ✅ Click "Authorize Extension" → sign |
| Demo turret(s) | Turret detail → extension status = "CommercialAuth (CivilizationControl)" | ✅ Click "Authorize Extension" → sign |
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
- [ ] All demo gates: AUTHORIZED, no policy presets set
- [ ] Demo gate for Beat 5: has linked destination gate (check Transit Proof section — if "No linked gate," Beat 5 falls back to narration)
- [ ] All demo turrets: AUTHORIZED (CommercialAuth for commercial posture)
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
4. **Confirm:** Posture reads "Open for Business" (Commercial).

### Step R2 — Set Policy Preset on Gate (Beat 3)

1. Navigate to Gates → click demo gate.
2. In **PolicyPresetEditor** → Commercial tab, click **Create Preset**.
3. Use **TribePicker** to add a tribe entry (e.g., your character's tribe) → set access = allow, toll = desired amount.
4. Set **default_access** (optional — allow/deny for unlisted tribes).
5. Set **default_toll** in EVE (e.g., "5").
6. Click **Apply** → sign.
7. **Verify:** `PolicyPresetSetEvent` appears in Signal Feed within 30 seconds.
8. **Verify:** Gate detail shows active preset summary.

### Step R2a — Batch Deploy Preset (Beat 3 — Batch)

1. Below the preset form, locate the **Batch Apply** section.
2. Select 2+ other gates → click **Apply to Selected Gates** → sign.
3. **Verify:** One `PolicyPresetSetEvent` per gate appears in Signal Feed.

### Step R3 — Generate Transit Proof (Beat 5 — Revenue)

1. On the demo gate detail screen, scroll to **Transit Proof** section.
2. **Prerequisite:** Gate must have a linked destination gate (set in-game). If "No linked destination gate" is shown, skip — Beat 5 uses narration/overlay instead.
3. Click **"Generate Transit Proof (X Lux toll)"** → sign.
4. **Verify:** `PermitIssuedEvent` ("Transit Authorized") appears in Signal Feed within 30 seconds.
5. **Verify:** `TollCollectedEvent` ("X Lux toll collected") appears in Signal Feed.
6. These are the live evidence moments for Beat 5. Note the tx digest for post-production overlay.

### Step R4 — Switch to Defense Mode (Beat 6)

1. Return to Dashboard.
2. Click "Defense Mode" on PostureControl → sign.
3. **Verify:** `PostureChangedEvent` appears in Signal Feed.
4. **Verify:** Topology colors shift teal → amber. Posture indicator updates.
5. **Verify:** TxFeedbackBanner shows tx digest.

### Step R5 — Create Trade Listing (Beat 7)

1. Navigate to Trade Posts → click demo SSU.
2. In **CreateListingForm**, select item type, set quantity and price → click Create → sign.
3. **Verify:** `ListingCreatedEvent` appears in Signal Feed.
4. **Verify:** Listing appears in the Marketplace grid.

### Step R6 — Buy Trade Listing (Beat 7)

1. On the same TradePost detail, click "Buy" on the listing just created → sign.
2. **Verify:** `ListingPurchasedEvent` appears in Signal Feed.
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
