# Sui Package Upgrade: Type-Origin & Dual-ID Model

**Status:** Active — applies to CivilizationControl on Utopia testnet  
**Last verified:** 2026-03-17 (package v2 upgrade)

## Why two package IDs?

After a Sui package upgrade, struct types are permanently anchored to the **package version that first introduced their module** (the "type origin"). This is a chain-level invariant, not a CivilizationControl convention.

| Module | Introduced In | Type Origin (package ID) | Constant |
|--------|--------------|--------------------------|----------|
| `gate_control` | v1 | `0xb41a7ce1…6a04` | `CC_ORIGINAL_PACKAGE_ID` |
| `trade_post` | v1 | `0xb41a7ce1…6a04` | `CC_ORIGINAL_PACKAGE_ID` |
| `posture` | v2 | `0x698d78b0…2c5a5` | `CC_PACKAGE_ID` |
| `turret_bouncer` | v2 | `0x698d78b0…2c5a5` | `CC_PACKAGE_ID` |
| `turret_defense` | v2 | `0x698d78b0…2c5a5` | `CC_PACKAGE_ID` |

## Rules

1. **MoveCall targets** always use the **latest** package ID (`CC_PACKAGE_ID`). The chain resolves function calls to the upgraded version regardless of which version introduced the module.

2. **Type strings** (DF key types, event type filters, `typeArguments` in PTBs) must use the **type-origin** package ID — the version that first introduced the module containing the type.

3. **queryEvents with MoveModule filter** must specify the type-origin package ID as `Package`, not the latest.

4. **Empty struct DF keys** (e.g. `PostureKey{}`) require `{ dummy_field: false }` in Sui JSON-RPC `getDynamicFieldObject` value parameter.

## What this means in code

```
src/constants.ts
├── CC_PACKAGE_ID             → v2 (latest) — all MoveCall targets
└── CC_ORIGINAL_PACKAGE_ID    → v1 (original) — v1 module type strings
```

Files that construct type strings must pick the right constant per module:
- `eventParser.ts` — event type match strings
- `suiReader.ts` — DF key types, event module queries
- `postureSwitchTx.ts` — typeArguments for v2 witnesses
- `useAuthorizeExtension.ts` — typeArguments for v1 witnesses

## DO NOT "clean up" this dual-constant model

This is **correct by design**. Collapsing both constants into one will silently break:
- DF reads (wrong type origin → "dynamicFieldNotFound")
- Event queries (wrong package → empty results)
- PTB type arguments (wrong origin → transaction failure)

## Fresh deployment note

If the package is published fresh to a new network (e.g. Stillness mainnet) without an upgrade, **all modules share one type origin**. In that case both constants would hold the same value. The dual-constant model remains safe — it's just redundant until a future upgrade introduces new modules.

## Verification

Empirically validated via on-chain RPC calls (2026-03-17):
- `TribeRuleKey` DF: v1 address resolves ✅, v2 returns `dynamicFieldNotFound`
- `PostureKey` DF: v2 address resolves ✅, v1 returns `Could not find module`
- `gate_control` events: v1 MoveModule returns events ✅, v2 returns empty
- `posture` events: v2 MoveModule returns events ✅
