# Extension Freeze: Operator Safety Guide

**Status:** Active  
**Last updated:** 2026-03-17

## What "freeze" means

`freeze_extension_config()` is a **one-time, irreversible** operation on individual assemblies (gates, turrets, SSUs). It prevents any future `authorize_extension<T>()` call on that assembly.

This is **not** package-level or network-wide. Each assembly is frozen individually.

## What freeze prevents

Once frozen on an assembly:
- No new extensions can be authorized
- No extension swaps (the current extension is locked permanently)
- Only the world package's internal `remove_frozen_marker_if_present` (called during unanchor/destroy) can undo it

## Why this matters for CivilizationControl

**Posture switching depends on extension swaps.** The PostureControl flow executes:

```
BouncerAuth (commercial) ←→ DefenseAuth (defense)
```

via `authorize_extension<BouncerAuth>` / `authorize_extension<DefenseAuth>` on each turret.

**If turret extensions are frozen, posture switching breaks permanently.** The operator loses the ability to change between commercial and defense modes for that turret.

## When to freeze

| Phase | Gates | Turrets | SSUs |
|-------|-------|---------|------|
| Development / iteration | Do NOT freeze | Do NOT freeze | Do NOT freeze |
| Demo recording | Do NOT freeze | Do NOT freeze | Do NOT freeze |
| Post-demo hardening | Consider freezing | **Do NOT freeze** (posture switching) | Consider freezing |
| Production (if applicable) | Freeze after final config | **Do NOT freeze** (posture switching) | Freeze after final config |

**Key rule:** Never freeze assemblies whose extensions need to change at runtime. Turrets with posture-switching must remain unfrozen.

## How to freeze (when appropriate)

```bash
# Freeze a gate's extension config (irreversible)
sui client call \
  --module gate --function freeze_extension_config \
  --package $WORLD_PACKAGE_ID \
  --args $GATE_OBJECT_ID $GATE_OWNER_CAP_ID
```

Replace `gate` with `turret` or `storage_unit` for other assembly types. The `OwnerCap<T>` must be authorized for the assembly.

## Anti-rugpull value

Freezing is the mechanism by which operators prove to players that an extension will not change. A frozen gate with `GateAuth` permanently guarantees the CivilizationControl gate policy cannot be swapped to a malicious extension.
