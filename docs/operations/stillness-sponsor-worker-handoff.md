# Stillness Sponsor Worker Handoff

**From:** CivilizationControl repo (`feat/stillness-migration` branch)
**To:** Flappy-Frontier repo (`workers/sponsor-service/`)
**Date:** 2026-04-01
**Purpose:** Exact data needed to update the sponsor-worker `APP_POLICIES` for CivilizationControl on Stillness.

---

## Environment Summary

| Item | Value |
|------|-------|
| **Chain** | Sui testnet (`4c78adac`) — same chain as Utopia |
| **World** | Stillness |
| **WORLD_PACKAGE_ID** | `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c` |
| **CC_PACKAGE_ID** | `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` |
| **CC_ORIGINAL_PACKAGE_ID** | Same as CC_PACKAGE_ID (fresh v1 publish) |
| **EVE_ASSETS_PACKAGE_ID** | `0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60` |
| **RPC** | `https://fullnode.testnet.sui.io:443` (unchanged) |
| **Preview URL** | https://feat-stillness-migration.civilizationcontrol.pages.dev |

---

## Background: Stale Utopia Package IDs

The current `APP_POLICIES` in `wrangler.toml` uses:
- `WORLD_PACKAGE_ID`: `0xd12a70c7...` (Utopia) — **must change**
- `CC_PACKAGE_ID`: `0xeffb45b2...` (Utopia **v5**, not even the current v6) — **must change**

Because the CC package ID was stale (v5 vs v6 runtime), governance sponsorship was already **silently broken on Utopia**. All sponsored governance transactions were being rejected by the worker's allowlist, and the frontend was falling back to player-paid execution. The graceful fallback masked the issue — no user-visible error, just gas cost to the operator.

---

## Sponsorship Goals

On Stillness/testnet, users start with no SUI. Every action that can technically be sponsored SHOULD be sponsored.

Product priorities:
- **Minimize friction** — users should not need SUI for any CivilizationControl action
- **Maximize coverage** — sponsor everything the worker model can technically support
- **Learn from usage** — collect live data on sponsor cost/usage for future monetization planning
- **Testnet bias** — accept theoretical abuse risk in exchange for learning and completeness

Actions are only excluded from sponsorship when there is a **hard technical blocker** — not theoretical abuse risk.

The sponsor model works as follows: the frontend builds a `TransactionKind` (commands only, no gas), sends it to the worker, the worker validates MoveCall targets against APP_POLICIES, wraps with a gas coin from the sponsor wallet, and returns the full TX + sponsor signature. The player then signs (authorizing all their owned objects, including any `Coin<EVE>` involved in `splitCoins`), and the TX is submitted with dual signatures. If sponsorship fails at any step, the frontend falls back to player-paid execution silently.

**Key insight:** `splitCoins` on a player-owned `Coin<EVE>` is authorized by the **player's** signature, not the sponsor's. The sponsor only contributes the gas coin. The worker never touches or authorizes the player's EVE. Therefore, Coin<EVE> involvement is NOT a technical blocker.

---

## Complete Action Inventory

### SPONSORED (currently routed through `useSponsoredExecution`)

These 6 action categories already route through the sponsor worker. They fall back to player-paid execution if the sponsor is unavailable or rejects.

#### 1. Gate Policy Management

| Property | Value |
|----------|-------|
| **Hook** | `useGatePolicyMutation` / `useBatchPresetMutation` / `useBatchTreasuryMutation` |
| **Screen** | GateDetailScreen, GateListScreen |
| **Coin<EVE>** | No |
| **Value transfer** | No |
| **Should sponsor** | ✅ Yes — governance config |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| WORLD | `character` | `borrow_owner_cap` |
| WORLD | `character` | `return_owner_cap` |
| CC | `gate_control` | `set_policy_preset` |
| CC | `gate_control` | `remove_policy_preset` |
| CC | `gate_control` | `set_treasury` |

#### 2. Posture Switching

| Property | Value |
|----------|-------|
| **Hook** | `usePostureSwitch` |
| **Screen** | PostureControl → StrategicMapPanel |
| **Coin<EVE>** | No |
| **Value transfer** | No |
| **Should sponsor** | ✅ Yes — governance posture |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| WORLD | `character` | `borrow_owner_cap` (Gate type) |
| WORLD | `character` | `return_owner_cap` (Gate type) |
| CC | `posture` | `set_posture` |
| WORLD | `character` | `borrow_owner_cap` (Turret type) |
| WORLD | `turret` | `authorize_extension` |
| WORLD | `character` | `return_owner_cap` (Turret type) |

Note: Posture switch includes turret rebinding in the same PTB. Type args for `authorize_extension` are `{CC_PACKAGE_ID}::turret::DefenseAuth` or `{CC_PACKAGE_ID}::turret::CommercialAuth`.

#### 3. Structure Power Control

| Property | Value |
|----------|-------|
| **Hook** | `useStructurePower` |
| **Screen** | GateListScreen, GateDetailScreen, TurretListScreen, TurretDetailScreen, TradePostListScreen |
| **Coin<EVE>** | No |
| **Value transfer** | No |
| **Should sponsor** | ✅ Yes — governance power management |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| WORLD | `character` | `borrow_owner_cap` |
| WORLD | `character` | `return_owner_cap` |
| WORLD | `gate` | `online` |
| WORLD | `gate` | `offline` |
| WORLD | `turret` | `online` |
| WORLD | `turret` | `offline` |
| WORLD | `storage_unit` | `online` |
| WORLD | `storage_unit` | `offline` |
| WORLD | `network_node` | `online` |

Note: `network_node` only has `online` (no `offline` in the CC code path).

#### 4. Extension Authorization (Bind Gate/SSU/Turret)

| Property | Value |
|----------|-------|
| **Hook** | `useAuthorizeExtension` |
| **Screen** | GateListScreen, GateDetailScreen, TurretListScreen, TradePostListScreen, TradePostDetailScreen |
| **Coin<EVE>** | No |
| **Value transfer** | No |
| **Should sponsor** | ✅ Yes — one-time binding operation |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| WORLD | `character` | `borrow_owner_cap` |
| WORLD | `character` | `return_owner_cap` |
| WORLD | `gate` | `authorize_extension` |
| WORLD | `gate` | `update_metadata_url` |
| WORLD | `storage_unit` | `authorize_extension` |
| WORLD | `storage_unit` | `update_metadata_url` |
| WORLD | `turret` | `authorize_extension` |

Type args for `authorize_extension`:
- Gate: `{CC_PACKAGE_ID}::gate_control::GateAuth`
- SSU: `{CC_PACKAGE_ID}::trade_post::TradeAuth`
- Turret: `{CC_PACKAGE_ID}::turret::DefenseAuth` or `CommercialAuth`

#### 5. DApp URL Update

| Property | Value |
|----------|-------|
| **Hook** | `useAuthorizeExtension` (same hook, separate functions) |
| **Screen** | GateListScreen, TradePostListScreen |
| **Coin<EVE>** | No |
| **Value transfer** | No |
| **Should sponsor** | ✅ Yes — metadata update |

MoveCall targets: Same as authorization (borrow_owner_cap + update_metadata_url + return_owner_cap). Already covered in the allowlist above.

---

### SPONSOR WITH FRONTEND REROUTE (pending hook changes)

These 6 action categories currently use direct `signAndExecuteTransaction` and SHOULD be rerouted through `useSponsoredExecution`. All are technically compatible with the sponsor-worker model.

#### 6. Free Gate Permit

| Property | Value |
|----------|-------|
| **Hook** | `usePermitAction` (free branch, `effectiveToll === 0`) |
| **TX builder** | `buildPermitFreeTx()` in `src/lib/gatePermitTx.ts` |
| **Screen** | GatePermitPage |
| **Coin<EVE>** | No |
| **GasCoin referenced** | No |
| **Value transfer** | No |
| **PTB commands** | 1 MoveCall: `gate_control::request_jump_permit_free` |
| **On-chain auth** | `&Character` (read-only ref) — sender must own a Character |
| **Abuse surface** | Medium — anyone with a Character can spam permits |
| **Should sponsor** | ✅ Yes |
| **Requires** | Worker allowlist + frontend hook reroute |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| CC | `gate_control` | `request_jump_permit_free` |

#### 7. Gate Permit (Toll)

| Property | Value |
|----------|-------|
| **Hook** | `usePermitAction` (toll branch, `effectiveToll > 0`) |
| **TX builder** | `buildPermitTollTx()` in `src/lib/gatePermitTx.ts` |
| **Screen** | GatePermitPage |
| **Coin<EVE>** | **Yes** — `splitCoins(tx.object(eveCoinId), [tollPrice])` |
| **GasCoin referenced** | No — splits from player's EVE coin object, not `tx.gas` |
| **Value transfer** | Yes — toll payment consumed by contract, transferred to treasury |
| **PTB commands** | 1 splitCoins + 1 MoveCall: `gate_control::request_jump_permit` |
| **On-chain auth** | `&Character` (read-only ref) |
| **Abuse surface** | Low — each call costs real EVE (self-limiting) |
| **Should sponsor** | ✅ Yes — EVE cost self-limits abuse; player already paying value; removing gas removes SUI friction |
| **Requires** | Worker allowlist + frontend hook reroute |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| CC | `gate_control` | `request_jump_permit` |

#### 8. Create Listing + Share Listing

| Property | Value |
|----------|-------|
| **Hook** | `useCreateListing` in `src/hooks/useCreateListing.ts` |
| **TX builder** | `buildCreateListingTx()` in `src/lib/tradePostTx.ts` |
| **Screen** | TradePostDetailScreen |
| **Coin<EVE>** | No |
| **GasCoin referenced** | No |
| **Value transfer** | No (creates shared Listing object) |
| **PTB commands** | 2 MoveCalls: `trade_post::create_listing` → `trade_post::share_listing` |
| **On-chain auth** | `&StorageUnit` (read-only ref) — no ownership check in contract |
| **Abuse surface** | Medium — free to call, each creates a shared on-chain object |
| **Should sponsor** | ✅ Yes |
| **Requires** | Worker allowlist + frontend hook reroute |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| CC | `trade_post` | `create_listing` |
| CC | `trade_post` | `share_listing` |

#### 9. Cancel Listing

| Property | Value |
|----------|-------|
| **Hook** | `useCancelListing` in `src/hooks/useCancelListing.ts` |
| **TX builder** | `buildCancelListingTx()` in `src/lib/tradePostTx.ts` |
| **Screen** | TradePostDetailScreen |
| **Coin<EVE>** | No |
| **GasCoin referenced** | No |
| **Value transfer** | No |
| **PTB commands** | 1 MoveCall: `trade_post::cancel_listing` |
| **On-chain auth** | `ctx.sender() == listing.seller` — only seller can cancel |
| **Abuse surface** | Very low — bounded by the player's own listings |
| **Should sponsor** | ✅ Yes |
| **Requires** | Worker allowlist + frontend hook reroute |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| CC | `trade_post` | `cancel_listing` |

#### 10. Buy Listing

| Property | Value |
|----------|-------|
| **Hook** | `useBuyListing` in `src/hooks/useBuyListing.ts` |
| **TX builder** | `buildBuyListingTx()` in `src/lib/tradePostTx.ts` |
| **Screen** | TradePostDetailScreen, SsuMarketplacePage |
| **Coin<EVE>** | **Yes** — `splitCoins(tx.object(eveCoinId), [price])` |
| **GasCoin referenced** | No — splits from player's EVE coin object, not `tx.gas` |
| **Value transfer** | Yes — EVE coin transferred to seller by contract |
| **PTB commands** | 1 splitCoins + 1 MoveCall: `trade_post::buy_to_inventory` |
| **On-chain auth** | `&Character` (read-only ref), listing consumed by value |
| **Abuse surface** | Wash-trade possible (list + buy own item to drain gas) but on testnet this is acceptable for learning |
| **Should sponsor** | ✅ Yes — EVE cost provides natural friction; complete frictionless commerce is the product goal |
| **Requires** | Worker allowlist + frontend hook reroute |

MoveCall targets:

| Package | Module | Function |
|---------|--------|----------|
| CC | `trade_post` | `buy_to_inventory` |

---

### NOT SPONSORED (no UI / not applicable)

#### 11. Transit Proof

| Property | Value |
|----------|-------|
| **Hook** | `useTransitProofAction` |
| **Screen** | **None** (defined but not imported by any screen) |
| **Coin<EVE>** | **Yes** — when `effectiveToll > 0` |
| **Why excluded** | Not wired to any UI. Same MoveCall targets as gate permit — will be covered if/when transit proof UI is added. |

---

## Recommended APP_POLICIES Configuration

The following is the deduplicated allowlist of MoveCall targets that the sponsor worker should accept for CivilizationControl on Stillness.

**Replace both package IDs in the existing `civilization-control` policy block:**

```
WORLD_PACKAGE_ID: 0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c
CC_PACKAGE_ID:    0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021
```

### WORLD_PACKAGE_ID allowlist

| Module | Functions |
|--------|-----------|
| `character` | `borrow_owner_cap`, `return_owner_cap` |
| `gate` | `authorize_extension`, `update_metadata_url`, `online`, `offline` |
| `turret` | `authorize_extension`, `online`, `offline` |
| `storage_unit` | `authorize_extension`, `update_metadata_url`, `online`, `offline` |
| `network_node` | `online` |

### CC_PACKAGE_ID allowlist

| Module | Functions |
|--------|-----------|
| `gate_control` | `set_policy_preset`, `remove_policy_preset`, `set_treasury` |
| `posture` | `set_posture` |
| `gate_control` | `request_jump_permit_free`, `request_jump_permit` |
| `trade_post` | `create_listing`, `share_listing`, `cancel_listing`, `buy_to_inventory` |

All CivilizationControl MoveCall targets are in the allowlist. No functions are excluded.

---

## Resolved Decisions

**Policy:** Sponsor every action that is technically feasible. Testnet bias — learn from usage, minimize friction, accept theoretical abuse risk.

1. **`request_jump_permit_free`**: ✅ SPONSOR. No Coin<EVE>. Worker allowlist + frontend reroute.

2. **`request_jump_permit` (toll)**: ✅ SPONSOR. Coin<EVE> involved but player signs for their own coin (splitCoins on `tx.object(eveCoinId)`, NOT `tx.gas`). The sponsor only provides gas. Each call costs the player real EVE, which is a natural rate limiter. Worker allowlist + frontend reroute.

3. **`create_listing` + `share_listing`**: ✅ SPONSOR. No Coin<EVE>. Worker allowlist + frontend reroute.

4. **`cancel_listing`**: ✅ SPONSOR. No Coin<EVE>, on-chain seller auth. Worker allowlist + frontend reroute.

5. **`buy_to_inventory`**: ✅ SPONSOR. Coin<EVE> involved (same model as toll — player signs, player's coin). Wash-trade gas drain is theoretically possible but acceptable on testnet for usage learning. Worker allowlist + frontend reroute.

6. **Transit Proof**: Deferred — not wired to any UI. Same MoveCall targets as gate permit; already covered by the allowlist.

### Why Coin<EVE> is not a blocker

The sponsor-worker model sends `TransactionKind` (commands only) to the worker. The worker validates MoveCall targets, then wraps with a gas coin from the sponsor wallet. The player is the `sender` in the sponsored TX — their signature authorizes all owned objects, including `Coin<EVE>`. The `splitCoins` command operates on `tx.object(eveCoinId)` (player's coin), NOT `tx.gas` (sponsor's coin). The sponsor can't access the player's EVE and the player can't access the sponsor's gas beyond the gas budget.

### Abuse surfaces acknowledged (testnet-acceptable)

| Action | Abuse scenario | Natural limiter | Severity |
|--------|---------------|----------------|----------|
| `request_jump_permit_free` | Spam permits to drain gas | Must own a Character | Low |
| `create_listing` | Spam listings to drain gas | Each creates on-chain object (visible) | Medium |
| `buy_to_inventory` | Wash-trade (list + buy own item, recover EVE, drain gas) | Gas cost per round-trip ~0.01 SUI | Medium |
| `request_jump_permit` | Spam toll permits | Costs real EVE per call | Very low |

## Remaining Open Items

1. **Sponsor wallet SUI balance**: The sponsor wallet uses the same testnet keypair. Balance should be verified before deploying the updated worker.

2. **CORS**: `ALLOWED_ORIGINS` in the worker already includes `civilizationcontrol.pages.dev` and wildcard subdomains. No CORS changes needed.

3. **AdminACL**: CivilizationControl functions never call `verify_sponsor`. AdminACL enrollment is NOT required for CC governance operations.

4. **Worker rate limiting**: Optional. Per-address rate limiting would reduce abuse surface for `request_jump_permit_free` and `create_listing`, but is NOT a blocker for launch. If the worker has rate-limiting infrastructure, recommended limits: 10 permits/min/address, 5 listings/hr/address. If not, launch without it.

---

## Frontend Rerouting Requirements

Adding functions to the worker allowlist enables sponsorship but does NOT activate it. The frontend hooks must also be rerouted from direct `signAndExecuteTransaction` to `useSponsoredExecution`.

| Hook file | Function | Change needed |
|-----------|----------|---------------|
| `src/hooks/useGatePermit.ts` | `usePermitAction` (both free AND toll branches) | Import `useSponsoredExecution`, use `executeTx(tx)` for all permit paths |
| `src/hooks/useCreateListing.ts` | `useCreateListing` | Import `useSponsoredExecution`, use `executeTx(tx)` instead of `dAppKit.signAndExecuteTransaction` |
| `src/hooks/useCancelListing.ts` | `useCancelListing` | Import `useSponsoredExecution`, use `executeTx(tx)` instead of `dAppKit.signAndExecuteTransaction` |
| `src/hooks/useBuyListing.ts` | `useBuyListing` | Import `useSponsoredExecution`, use `executeTx(tx)` instead of `dAppKit.signAndExecuteTransaction` |

All sponsored hooks fall back to player-paid execution when the sponsor is unavailable, so this reroute is non-breaking.

---

## Implementation Steps (for the Flappy-Frontier agent)

1. Open `workers/sponsor-service/wrangler.toml`
2. In the `civilization-control` section of `APP_POLICIES`:
   - Replace WORLD_PACKAGE_ID with `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`
   - Replace CC_PACKAGE_ID with `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021`
3. Verify the function allowlists match the tables above
4. Add any missing functions (compare existing allowlist against the WORLD_PACKAGE_ID and CC_PACKAGE_ID tables above — the Stillness allowlist should be a superset of what was there before)
5. Redeploy: `npx wrangler deploy workers/sponsor-service`
6. Verify sponsor wallet SUI balance on testnet
7. Test: from the CivilizationControl preview URL, perform a governance action (e.g., posture switch) and confirm gas is paid by the sponsor, not the operator

---

## Verification

### Phase 1 — Worker allowlist update (no frontend changes)

After the worker update, these actions should be sponsored (gas paid by sponsor wallet):
- Bind gate/SSU/turret extension
- Set policy preset / remove preset / set treasury
- Switch posture
- Toggle structure power (online/offline)
- Update DApp URL

**Note:** All new functions (`request_jump_permit_free`, `request_jump_permit`, `create_listing`, `share_listing`, `cancel_listing`, `buy_to_inventory`) should also be added to the allowlist in Phase 1, but they will not be actively sponsored until the frontend hooks are rerouted in Phase 2.

### Phase 2 — Frontend hook rerouting (CivilizationControl repo)

After frontend rerouting, ALL CivilizationControl actions should be sponsored:
- Request gate permit (free and toll)
- Create listing + share listing
- Cancel listing
- Buy listing

No CivilizationControl actions should remain player-paid. The only unsponsored path is Transit Proof, which has no UI.
