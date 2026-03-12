# Compound DF Key Validation Report

**Retention:** Carry-forward
**Date:** 2026-03-03
**Environment:** Sui CLI v1.66.1, testnet framework, Move unit tests (no network needed)

## Objective

Validate that compound dynamic field keys with embedded `ID` produce independent DFs on the same parent object. This is the foundation of CivilizationControl's per-gate rule storage pattern.

## Results

**Verdict: 6/6 PASS — Compound DF keys work as expected.**

| Test | Scenario | Result |
|------|----------|--------|
| `test_same_key_type_different_gate_ids` | `TribeRuleKey { gate_id: A }` vs `TribeRuleKey { gate_id: B }` vs `TribeRuleKey { gate_id: C }` | PASS — 3 independent DFs |
| `test_different_key_types_same_gate_id` | `TribeRuleKey { gate_id: A }` vs `TollRuleKey { gate_id: A }` (same gate!) | PASS — independent DFs |
| `test_full_composition_matrix` | 3 rule types × 2 gates = 6 DFs on one object | PASS — all 6 independent |
| `test_update_independence` | Update tribe rule, verify toll unchanged | PASS |
| `test_remove_independence` | Remove tribe rule, verify toll still exists | PASS |
| `test_exists_check` | `df::exists_` returns correct results for present/absent keys | PASS |

## Implications

- CivilizationControl can safely store `TribeRuleKey { gate_id }`, `TollRuleKey { gate_id }`, and `PostureKey { gate_id }` on a single shared `ExtensionConfig` object.
- Different key struct types with the same `gate_id` field occupy **separate** DF slots (BCS-serialized type name is part of the key).
- Per-gate independent configuration confirmed: modifying/removing one gate's rules does not affect other gates' rules.

## Harness Location

- Move module: `sandbox/validation/compound_df_key_test/sources/compound_keys.move`
- Run: `sui move test --path sandbox/validation/compound_df_key_test`

## Claims Validated

- GC-09: Per-gate compound DF keys → **CONFIRMED**
- GC-09 extended: Multiple rule types per gate → **CONFIRMED**
