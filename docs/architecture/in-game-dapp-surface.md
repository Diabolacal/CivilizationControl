# In-Game DApp Browser Surface — Confirmed Constraints & Architecture

**Retention:** Carry-forward

> Canonical reference for the in-game embedded browser runtime environment.
> All CivilizationControl UI, wallet, and deployment decisions must align with these constraints.
> Source: `docs/research/capabilities.json` — EVE Frontier Embedded WebView Probe v1.2.6, captured 2026-02-28

---

## 1. Runtime Environment

| Property | Confirmed Value | Source |
|----------|----------------|--------|
| Engine | Chromium 122 (CEF-based, embedded in EVE Frontier game client) | `navigator.userAgent` |
| Platform | Windows (Win32) | `navigator.platform` |
| Protocol | HTTPS (secure context) | `location.protocol` |
| Hosting origin | `ef-map.com` (probe); DApp URLs are structure-configurable | `location.hostname` |
| Frame context | Top frame (not in iframe) | `navigation.In iframe: No` |

**Key implication:** The webview loads DApp URLs at the top-level frame. Standard web APIs and HTTPS security are available. The DApp URL is manually configured per structure by its owner.

---

## 2. Viewport & Rendering

| Property | Value | Design Implication |
|----------|-------|--------------------|
| Viewport | **787 × 1198 px** | Portrait-primary. All UI must work at ~800px width. |
| DPR | 1 | No HiDPI; 1 CSS px = 1 device px. No `@2x` assets needed. |
| Orientation | Portrait-primary, locked (0°) | No landscape variant needed in-game. |
| Screen = Viewport | Yes | No browser chrome, URL bar, or status bar. Full bleed. |
| Safe area insets | All 0px | No notch/cutout handling. |
| Zoom | 100% fixed | No user zoom detected. |
| `prefers-color-scheme` | **dark** | Default to dark theme. |
| `prefers-reduced-motion` | No | Animations acceptable. |

### CSS Support (All Confirmed)

- CSS Grid, Flexbox, Custom Properties
- Container Queries (component-level responsiveness)
- `:has()` selector
- `backdrop-filter` (glass/blur effects)
- `@layer` (cascade layers)
- `color-scheme` declaration

### Graphics

| Capability | Status |
|------------|--------|
| WebGL 1/2 | Supported (ANGLE / Direct3D11 / RTX 4070 SUPER) |
| OffscreenCanvas | Supported |
| Canvas 2D | Supported |

**Design constraint:** 787×1198 portrait is the hard layout constraint. All CivilizationControl screens must render in a single narrow column. Tables with >4 columns must collapse to card layouts. Sidebar navigation becomes a collapsible drawer or bottom tabs.

---

## 3. Storage

| API | Available | Persistence Across Sessions |
|-----|-----------|----------------------------|
| localStorage | Yes (read/write confirmed) | **UNVERIFIED** — CEF may clear on game restart |
| sessionStorage | Yes | Cleared when webview closes |
| IndexedDB | Yes (write test passed) | **UNVERIFIED** — same CEF caveat |
| CacheStorage | Yes (via ServiceWorker) | **UNVERIFIED** |
| Cookies | Yes | Session lifetime tied to game client |

**Storage quota:** ~285 GB (inherits system disk quota). Effectively unlimited.

**Policy:** Treat all client-side storage as **cache-tier only**. Nice-to-have for UX (preferences, query caches, draft data), but never the source of truth. All governance state must be on-chain. Graceful fallback required if storage is empty on next launch.

---

## 4. Wallet — CRITICAL CONSTRAINT

| Capability | Status | Impact |
|------------|--------|--------|
| `window.ethereum` | **Detected** (chainId: `0xaa37dc`) | EVM provider present — this is the game's native chain context |
| EIP-6963 providers | **"EVE Frontier Wallet"** detected | Game injects its own EVM-compatible wallet |
| Sui Wallet Standard | **0 wallets registered** | **NO Sui wallet available in-game** |
| Sui legacy injection | Not detected | No `window.suiWallet` or equivalent |
| Browser extensions | Not loadable | CEF does not load Chrome extensions (no EVE Vault, no Sui Wallet) |

### Implications for CivilizationControl

1. **`@mysten/dapp-kit` `WalletProvider` auto-discovery finds nothing.** The standard Sui wallet connection flow (ConnectButton → select wallet → approve) will not work in-game.

2. **All Sui transactions require an alternative signing path in-game:**
   - **Primary (in-game):** Read-only mode — no Sui wallet available, no signing possible. All data visible via Sui RPC; write operations disabled.
   - **Primary (external browser):** Sponsored transactions via AdminACL-enrolled sponsor address co-signing. Player signs PTB + sponsor co-signs for gas.
   - **Stretch:** EVE Vault `postMessage` relay — if EVE Vault exposes a signing bridge to the webview (unconfirmed)
   - **External browser fallback:** Player opens the DApp URL in a standalone browser where EVE Vault extension is installed

3. **In-game users are read-only by default.** Without a Sui wallet, the in-game surface can display governance state, structure status, signal feed, and revenue metrics — but cannot sign transactions.

4. **Dual-context architecture required:**
   - Detect context: `window.ethereum` present + 0 Sui wallets → in-game browser
   - In-game: Read-only mode with full data display + "Open in Browser" CTA for write operations
   - External browser: Full read-write with EVE Vault or standard Sui wallet

### Wallet Connection States (Updated)

| State | Context | Display | Behavior |
|-------|---------|---------|----------|
| **In-Game (Read-Only)** | In-game browser detected | "Viewing Mode — Open in browser to manage" | Full read access, no write operations |
| **Not Connected** | External browser, no wallet | "Connect Wallet" button | Standard @mysten/dapp-kit flow |
| **Connecting** | External browser | "Connecting..." spinner | Auto-resolves or times out (10s) |
| **Connected** | External browser + wallet | Truncated address + green dot | Full read-write access |
| **Wrong Network** | External browser | Address + amber badge | Network switch instructions |
| **Extension Missing** | External browser, no EVE Vault | "Install EVE Vault" link | Opens installation page |

---

## 5. Network

| Capability | Status |
|------------|--------|
| Fetch API | Supported |
| CORS | Working (cross-origin fetch returned 200) |
| WebSocket | Supported |
| Server-Sent Events | Supported |
| Beacon API | Supported |
| Connection quality | 4g / 9.7 Mbps reported |
| Latency (measured) | ~50ms to test endpoint |

**Implication:** Full network stack available. Sui RPC calls via Fetch work. Real-time features (WebSocket for live status, SSE for event push) are viable. No network-level restrictions detected from within the webview.

---

## 6. Security

| Property | Status | Impact |
|----------|--------|--------|
| HTTPS | Yes (secure context) | All Crypto APIs available |
| `crossOriginIsolated` | **No** | `SharedArrayBuffer` unavailable; multi-threaded WASM blocked |
| CSP | None detected (no `<meta>` tag) | No restrictions from DApp side; game client may enforce at network layer |
| `Crypto.subtle` | Available | Client-side hashing, signing, key derivation work |
| Notifications | **Not available** | No push notifications |

**ZK impact:** `snarkjs` WASM prover falls back to single-threaded mode without `SharedArrayBuffer`. Proof generation will be 5-10× slower. If ZK GatePass is included, verify generation time stays under the kill threshold in single-threaded mode.

---

## 7. Input Model

| Property | Value |
|----------|-------|
| Pointer type | Fine (mouse/trackpad) |
| Hover | Supported |
| Touch | **Not supported** (maxTouchPoints: 0) |
| Keyboard | Full keyboard capture |
| Clipboard | Read + write supported |
| Drag & Drop | Supported |
| Gamepad | Supported (unlikely relevant) |

**Implication:** This is a desktop-only input context. No touch targets needed. Hover states are reliable. Mouse-precision clicks are safe. Standard desktop interaction patterns apply.

---

## 8. DApp URL Strategy

### URL Structure

Each EVE Frontier structure can have a DApp URL configured by its owner. The URL loads in the in-game embedded browser when a player interacts with the structure.

**Proposed URL patterns:**

| Surface | URL Pattern | Purpose |
|---------|-------------|---------|
| Gate DApp | `https://<host>/gate/<gateObjectId>` | Visitor sees gate rules, status, and jump info. Owner sees full governance panel. |
| SSU / Trade Post DApp | `https://<host>/ssu/<ssuObjectId>` | Buyer sees listings. Owner sees inventory + listing management. |
| Configurator | `https://<host>/configure` | Owner-only: multi-structure governance dashboard (Command Overview). **External browser only** — requires wallet for write operations. In-game loads as read-only view. |

### Context Discovery

- **No automatic structure context injection.** The game does NOT inject the current structure's objectId into the webview via JavaScript globals, postMessage, or URL parameters.
- **ObjectId must be embedded in the URL** by the structure owner when configuring the DApp URL.
- **URL is the sole context source.** The DApp parses `gateObjectId` or `ssuObjectId` from the URL path to determine which structure to display.

### Validation Rules

1. DApp URL must be HTTPS (confirmed: secure context required)
2. URL must contain the structure's Sui objectId as a path parameter
3. DApp must gracefully handle invalid/missing objectId (show "Structure not found" state)
4. DApp must detect in-game vs external browser context for wallet mode selection

### Owner Setup Flow

1. Operator deploys CivilizationControl DApp to static hosting (Cloudflare Pages)
2. For each structure, the operator sets the DApp URL in EVE Frontier:
   - Gate: `https://civcontrol.pages.dev/gate/0x<gateObjectId>`
   - SSU: `https://civcontrol.pages.dev/ssu/0x<ssuObjectId>`
3. Any player visiting the structure in-game sees the DApp in the embedded browser
4. The DApp loads, reads the objectId from the URL, fetches on-chain state via Sui RPC

---

## 9. Gate UI Responsibilities

### Visitor View (In-Game, Read-Only)

When a non-owner player visits a gate and the DApp loads:

| Element | Content | Data Source |
|---------|---------|-------------|
| Gate status | Online / Offline indicator | RPC: `Gate.is_online` |
| Active rules | "Tribe Filter: Tribe 7 only" / "Toll: 5 SUI" | RPC: Dynamic fields on ExtensionConfig |
| Link info | Linked gate name/ID, link status | RPC: `Gate.linked_gate` |
| Recent signals | Last N jump events for this gate | RPC: `suix_queryEvents` filtered by gate ID |
| Fuel level | Fuel remaining / capacity | RPC: NWN fuel state (if linked) |
| Denied/Allowed count | Aggregate pass/deny stats | Derived from event query |

**Action buttons (in-game read-only):**

| Button | Behavior | Notes |
|--------|----------|-------|
| "Request Jump" | Disabled — "Open in browser to initiate jumps" | Requires Sui wallet (not available in-game) |
| "View on Explorer" | Opens Sui explorer link (clipboard copy as fallback) | `window.open` available |

### Visitor View (External Browser, Connected Wallet)

Same data display as above, plus:

| Button | Behavior | On-Chain Action |
|--------|----------|-----------------|
| "Request Jump" | Constructs jump PTB; wallet signs | `gate::jump_with_permit` (requires valid JumpPermit + AdminACL sponsor) |

### Owner View

When the gate owner visits (wallet connected, OwnerCap resolved):

| Element | Content |
|---------|---------|
| All visitor elements | Plus governance controls |
| Rule Composer | Card-based module configuration (Tribe Filter, Coin Toll) |
| Deploy Policy | Constructs PTB to write/remove dynamic field rules |
| Online/Offline toggle | `gate::bring_online` / `gate::bring_offline` |
| Extension status | Current extension type and authorization state |
| Revenue summary | Toll revenue collected (from TollCollectedEvent aggregation) |
| Signal Feed | Expanded event feed with governance events |

**Proof artifacts displayed:**
- Last deploy tx digest (governance was written on-chain)
- Denied jump tx digests (policy enforcement evidence)
- Toll collected amounts with tx digests (revenue proof)

**"Hostile denied" proof surfacing:**
- Signal feed entry: "Jump denied — Tribe mismatch" with tx digest link
- Event data: `MoveAbort` code from failed `request_jump_permit` call — parsed from **wallet adapter failure response** (`effects.status.error`), NOT from on-chain events (MoveAbort reverts all effects including events)
- Overlay: Digest + abort code as on-chain enforcement evidence

---

## 10. Trade Post (SSU) UI Responsibilities

### Buyer Flow (In-Game, Read-Only)

| Element | Content | Data Source |
|---------|---------|-------------|
| Listing browser | Available items, prices, quantities | RPC: Listing objects filtered by SSU ID |
| Item details | Type, quantity, price in SUI | RPC: Listing + Item fields |
| Seller info | Seller character/address | RPC: Listing.seller |
| Trade history | Recent trades at this SSU | RPC: `TradeSettledEvent` filtered by SSU ID |

**Action buttons (in-game):**

| Button | Behavior |
|--------|----------|
| "Buy" | Disabled — "Open in browser to purchase" |
| "Copy Listing ID" | Copies listing object ID to clipboard |

### Buyer Flow (External Browser, Connected Wallet)

| Button | On-Chain Action | PTB Structure |
|--------|----------------|---------------|
| "Buy" | `civcontrol::trade_post::buy` | Split coin → transfer payment → withdraw_item<TradeAuth> → transfer item to buyer |

**Atomic settlement:** Buyer pays `Coin<SUI>`, receives item, seller receives payment — all in a single PTB. No escrow, no intermediary.

### Seller / Owner Flow (External Browser Only)

| Action | On-Chain Operation |
|--------|-------------------|
| View inventory | RPC read of SSU contents via dynamic fields |
| Create listing | `civcontrol::trade_post::create_listing` — sets price, links item |
| Remove listing | `civcontrol::trade_post::cancel_listing` — unlists item |
| Revenue view | Aggregated `TradeSettledEvent` amounts |

### Toll / Tax Flow

| Revenue Type | Mechanism | Display |
|--------------|-----------|---------|
| Gate toll (SUI) | `Coin<SUI>` transferred to operator treasury on jump | Per-gate revenue in Gate Detail + aggregate in Command Overview |
| Trade commission | **OPEN QUESTION** — not yet implemented in civcontrol spec | Future: percentage of trade price to structure operator |

### Currency: `Coin<SUI>` vs `Coin<EVE>`

| Token | Status | Usage |
|-------|--------|-------|
| `Coin<SUI>` | **Day-1 confirmed** | Tolls, trade settlement, all on-chain payments |
| `Coin<EVE>` | **EXISTS on-chain** (10B supply, 9 decimals) but **not integrated** | Future: toll currency option. Requires EveTreasury interaction. |
| Lux | **No on-chain representation** | Display denomination only (100 Lux = 1 EVE) |

**OPEN QUESTION:** Should CivilizationControl support `Coin<EVE>` tolls for Day-1? The token contract exists but treasury access and exchange flow are unresolved. Recommendation: `Coin<SUI>` only for Day-1, with `Coin<T>` generic architecture allowing future EVE integration.

### Event Polling vs Caching

| Data | Source | Refresh Strategy |
|------|--------|-----------------|
| Structure state (online/offline, fuel) | RPC `suix_getObject` | Poll every 5-10s via `@tanstack/react-query` |
| Active rules (dynamic fields) | RPC `suix_getDynamicFields` + reads | Poll every 15-30s (rules change infrequently) |
| Listings | RPC object queries | Poll every 10-15s |
| Events (signals, revenue) | RPC `suix_queryEvents` | Poll every 5s; append-only cache in IndexedDB |
| Revenue aggregates | Derived from events | Recompute on event cache update |

**Cache policy:** Event history may be cached in IndexedDB for faster page loads, but must re-validate against chain on each session start. All current-state reads (structure status, rules, listings) always come from RPC — never from cache alone.

---

## 11. AdminACL Sponsorship Visibility in UX

The in-game DApp must clearly communicate sponsorship state to users:

| Scenario | UX Treatment |
|----------|-------------|
| Sponsor active + AdminACL enrolled | Green "Sponsored" badge — gas fees abstracted |
| Sponsor not enrolled | Amber warning: "Gas sponsorship unavailable — some operations require manual gas" |
| Self-sponsorship detected | Info: "Non-sponsored transaction — sender address used for AdminACL check" |
| Transaction pending sponsorship | Spinner: "Awaiting sponsor co-signature..." |

**Transparency:** Every sponsored transaction displays: "Gas paid by: [sponsor address]" in the transaction confirmation tooltip.

---

## 12. Turrets

(Updated 2026-03-02 after turret support confirmed in world-contracts v0.0.14.)

**Status:** Turret assembly exists (678 lines, `turret.move`). Same typed-witness extension pattern as Gate (`authorize_extension<Auth>` + `swap_or_fill`).

**Key difference from Gate:** Turret extensions control **targeting priority** (not allow/deny). The extension function `get_target_priority_list` has a fixed 4-argument signature and cannot access external state (no `uid()` accessor, no DF reads). Default behavior applies tribe-based filtering: same-tribe non-aggressors excluded, different-tribe and aggressors get priority boost.

**CivilizationControl relevance:** Turret governance is feasible for tribe-level targeting policies but not for identity-specific policies (bonds, permits, address-level allow/deny). The closed-world constraint means the extension cannot read ExtensionConfig DFs at targeting time. Day-1 scope: turret enrollment (authorize extension) is achievable; custom targeting logic is limited to tribe-based rules.

CivilizationControl turret architecture: posture.move (PostureKey DF, set_posture), turret_bouncer.move (BouncerAuth witness, commercial targeting), turret_defense.move (DefenseAuth witness, defense targeting). Extension swap (BouncerAuth ↔ DefenseAuth), not online/offline toggle. Events: PostureChangedEvent, BouncerTargetingEvent, DefenseTargetingEvent.

---

## 13. Deployment Implications Summary

### What Works

- Static SPA on HTTPS (Cloudflare Pages, Vercel, etc.)
- Modern React + Vite + Tailwind stack
- Full CSS Grid/Flexbox/Container Queries for responsive layout
- Sui RPC calls via Fetch API (no CORS issues detected)
- WebSocket/SSE for real-time features
- IndexedDB for event caching
- ServiceWorker for asset caching
- Web Workers for computation offloading
- `Crypto.subtle` for client-side hashing

### What Does NOT Work In-Game

- `@mysten/dapp-kit` standard wallet connection (no Sui wallet)
- Browser extensions (EVE Vault, MetaMask, Sui Wallet)
- Multi-threaded WASM (no `SharedArrayBuffer`)
- Push notifications (Notification API unavailable)

### Available But Cache-Only

- localStorage (persistence across game restarts unverified)
- IndexedDB (same caveat)
- CacheStorage (same caveat)
- Cookies (session lifetime tied to game client)

---

## References

- Source data: [research/capabilities.json](../research/capabilities.json) — probe captured 2026-02-28
- UX spec: [ux/civilizationcontrol-ux-architecture-spec.md](../ux/civilizationcontrol-ux-architecture-spec.md)
- System spec: [core/spec.md](../core/spec.md)
- Wallet integration: [core/spec.md §4.3](../core/spec.md)
- World-contracts auth: [architecture/world-contracts-auth-model.md](world-contracts-auth-model.md)
