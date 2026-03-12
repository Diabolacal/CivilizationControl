# EVE Vault Sponsored Transaction Path Analysis

**Date:** 2026-03-12  
**Retention:** Carry-forward  
**Status:** Source-verified; live confirmation pending

## Summary

EVE Vault provides a **true server-managed sponsorship relay** — not just a signing UI. The EVE Frontier backend builds transactions, pays gas as sponsor, and executes on Sui. CivilizationControl's own functions (`authorize_extension`, `issue_jump_permit`, policy config) do NOT require sponsorship. The AdminACL blocker applies only to game-level operations (`jump`, `jump_with_permit`, `link_gates`, `share_gate`) which are handled by the EVE Frontier backend/base dApp, not by builder extensions.

## The AdminACL Blocker — Reframed

| Function | Calls `verify_sponsor`? | Who calls it? |
|----------|------------------------|---------------|
| `authorize_extension<Auth>` | No (OwnerCap only) | Gate owner / CivilizationControl |
| `issue_jump_permit<Auth>` | No (witness only) | CivilizationControl extension |
| Policy config (DF writes) | No (extension-internal) | CivilizationControl |
| `jump` | Yes | Game / base dApp |
| `jump_with_permit` | Yes | Game / base dApp |
| `link_gates` | Yes | Game / base dApp |
| `share_gate` | Yes | Game / base dApp |

**Conclusion:** CivilizationControl never needs to invoke a function that calls `verify_sponsor`. The blocker affects game-level operations only.

## EVE Vault Sponsorship Architecture

### Flow (3-step server-mediated)

1. **dApp → Vault Extension → Server (Prepare):**  
   `POST https://api.{tier}.tech.evefrontier.com/transactions/sponsored/{assemblyType}/{action}`  
   Body: `{ assemblyId, name?, description?, url? }`  
   Returns: `{ bcsDataB64Bytes, preparationId }` (server-built, sponsor-signed tx)

2. **User signs (popup):**  
   Vault opens popup → user approves → zkLogin signature over server-provided BCS bytes

3. **Vault Extension → Server (Execute):**  
   `POST https://api.{tier}.tech.evefrontier.com/transactions/sponsored/execute`  
   Body: `{ preparationId, userSignatureB64Bytes }`  
   Returns: `{ digest, effects }`

### Key facts

- Server is the gas sponsor (its address is in AdminACL)
- Utopia tenant forces `tier = "uat"` (hardcoded in `sponsoredTransactionHandler.ts` L13)
- Auth is JWT-based (FusionAuth OIDC, sent as `Authorization: Bearer`)
- `assemblyType` and `action` are required path parameters
- dApp never handles gas, never builds the sponsored PTB

### Source evidence

| File | What it shows |
|------|---------------|
| `vendor/evevault/apps/extension/src/lib/background/handlers/sponsoredTransactionHandler.ts` | Complete 3-step flow, Utopia special case |
| `vendor/evevault/apps/extension/src/lib/background/types.ts` | Input/output types, feature name `evefrontier:sponsoredTransaction` |
| `vendor/evevault/apps/extension/src/lib/adapters/SuiWallet.ts` L420-480 | dApp-facing method, window.postMessage bridge |
| `vendor/evevault/apps/extension/src/features/wallet/components/SignSponsoredTransaction.tsx` | User approval popup, zkSignAny |

### dApp integration interface

```typescript
// Wallet Standard feature
wallet.features["evefrontier:sponsoredTransaction"].signSponsoredTransaction({
  txAction: string,       // e.g. "jump"
  assembly: string,       // object ID
  assemblyType: string,   // e.g. "smart_gate"
  metadata?: { name?, description?, url? }
}) → Promise<{ digest, effects }>
```

`useSponsoredTransaction()` hook exists in `@evefrontier/dapp-kit` (npm package) but is NOT documented in builder docs. The evevault source only contains the wallet-side implementation.

## Gate Extension Jump Flow (2-TX model)

The builder-scaffold confirms a two-transaction jump flow for extended gates:

1. **TX 1 (not sponsored):** dApp/game calls extension's permit function (e.g., `tribe_permit::issue_jump_permit`). Player signs and pays gas. `JumpPermit` object created and transferred to player.

2. **TX 2 (sponsored):** dApp/game calls `gate::jump_with_permit`. EVE Frontier backend sponsors (AdminACL-enrolled). `JumpPermit` consumed; jump executed.

These cannot be combined into a single PTB because `issue_jump_permit` calls `transfer::transfer` (moves the object out of PTB scope).

## Unresolved Questions

1. **Does the game's base dApp handle the 2-TX flow for custom extensions?** If yes, CivilizationControl only needs the extension + governance UI. If no, CivilizationControl must provide a jump UI that uses EVE Vault's sponsored feature.

2. **Is the EVE Frontier backend's address actually enrolled in AdminACL on Utopia?** Virtually certain (same org controls GovernorCap), but not yet confirmed on-chain.

3. **What `action` strings does the server API accept?** The builder docs don't list valid action values. Likely includes "jump" and possibly "jumpWithPermit" but needs live confirmation.

4. **Does the server know how to construct PTBs that call custom extension functions?** For TX 1, the server would need to know about our extension package to build the permit PTB. If it doesn't, the dApp must build TX 1 itself.

## Implications for CivilizationControl

### What we need to build
- Extension Move package (GateControl + TradePost logic)
- Governance dApp UI (policy config, gate management)
- Standard `signAndExecuteTransaction` for owner operations (non-sponsored)

### What we probably do NOT need to build
- Custom sponsored transaction infrastructure
- AdminACL enrollment requests
- Transaction relay or gas management

### What MAY be needed (pending live test)
- Jump UI that uses `evefrontier:sponsoredTransaction` (only if the game's base dApp doesn't handle extended-gate jumps automatically)
