# Extension Integration E2E Validation Report

**Retention:** Carry-forward

## Summary

**All 4 E2E claims PASS on localnet** — the cross-package extension witness pattern is fully functional with world-contracts v0.0.14.

> **v0.0.15 update (2026-03-03):** world-contracts updated to v0.0.15. Gate/turret/access modules unchanged. Key inventory changes: `withdraw_item` now takes `quantity: u32` + `ctx`, `deposit_item` validates `parent_id`, new `deposit_to_owned`. Original validation results below remain valid for gate extension claims. See decision-log 2026-03-03.

## Claims Validated

| Claim | Status | Evidence |
|-------|--------|----------|
| E2E-01: Separate package defines `XAuth has drop` | **PASS** | Package published: `0x12c3...d62e` |
| E2E-02: `gate::authorize_extension<XAuth>` cross-package | **PASS** | TX `GWL7Wo...VtS` (Gate 1), TX `3KLmFD...V6s` (Gate 2) |
| E2E-03: `gate::issue_jump_permit<XAuth>` with witness | **PASS** | JumpPermit created: `0x65b4...23d0` |
| E2E-04: Extension config DF pattern (add/read rules) | **PASS** | AllowConfig DF set + read during permit issuance |

## Environment

- **Sui CLI:** v1.66.1
- **Network:** local (http://127.0.0.1:9000)
- **World package:** `0x67e4a180d82ee235bb38d508ff81ba778a375f322971528980418fce1051e728`
- **Extension package:** `0x12c3968e67b3757faf5835f32f9a57996718a4badf179ef71f810ce431d4d62e`

## Object IDs Created

| Object | ID |
|--------|-----|
| Character | `0x89eeda8c833ccec1f54a7e418495dec8307863466219bfb3633103b6791eead3` |
| NetworkNode | `0x2b9659dcc18392ee12b3f2aeff2624208117b80483fc9079225054aaf17532c5` |
| Gate 1 (source) | `0x8086df4e44989dbbcb59527bc99dbaac656bd7c22126ae629fd70d8f00e9aadc` |
| Gate 2 (destination) | `0xb5e59bc3badf76790b32e468af1a806959706ac6e72e32d0af938a3b4c12c4ab` |
| ExtensionConfig | `0x0dc9b2a8ba8658ffb077d58e94900e56c57df5c9124fe876ff904782ced2fd5b` |
| AdminCap (extension) | `0x81e1341000a0b9320747ad5b76fe3f2c5a3227fe81d1264ced87c71da53835dd` |
| JumpPermit | `0x65b49601993d712c55e48c610ca1f7d8793b1ffcaa6d1c68bcbfb9907c3723d0` |

## Execution Steps (Reproducible)

All steps executed via `sui client ptb` and `sui client call` on localnet.

### Step 0: Publish world-contracts
```bash
sui client test-publish vendor/world-contracts/contracts/world --build-env local --json
```

### Step 1: AdminACL self-enrollment
```bash
sui client call --package $WORLD --module access --function add_sponsor_to_acl \
  --args $ADMIN_ACL $GOVERNOR_CAP $MY_ADDRESS --gas-budget 100000000
```

### Step 2: Publish extension package
```bash
sui client test-publish sandbox/validation/extension_auth_test --build-env local --json
```

### Step 3: Create Character
```bash
sui client ptb \
  --move-call $WORLD::character::create_character @$REG @$ACL 1u32 "test_tenant" 1u32 @$ADDR "TestValidator" --assign char \
  --move-call $WORLD::character::share_character char @$ACL --gas-budget 100000000
```

### Step 4: Create NetworkNode
```bash
sui client ptb \
  --move-call $WORLD::network_node::anchor @$REG @$CHAR @$ACL 100u64 1u64 vector[1..32] 1000000u64 60000u64 100u64 --assign nwn \
  --move-call $WORLD::network_node::share_network_node nwn @$ACL --gas-budget 100000000
```

### Step 5: Create Gates (×2)
```bash
sui client ptb \
  --move-call $WORLD::gate::anchor @$REG @$NWN @$CHAR @$ACL 200u64 1u64 vector[...] --assign gate \
  --move-call $WORLD::gate::share_gate gate @$ACL --gas-budget 100000000
```

### Step 6: Authorize extension on both gates
```bash
sui client ptb \
  --move-call $WORLD::character::borrow_owner_cap "<$WORLD::gate::Gate>" @$CHAR @$GATE_CAP --assign result \
  --move-call $EXT::gate_extension::authorize @$GATE result.0 \
  --move-call $WORLD::character::return_owner_cap "<$WORLD::gate::Gate>" @$CHAR result.0 result.1 --gas-budget 100000000
```

### Step 7: Configure extension
```bash
sui client call --package $EXT --module gate_extension --function set_allow_config \
  --args $CONFIG $ADMIN_CAP 300000 --gas-budget 50000000
```

### Step 8: Issue JumpPermit
```bash
sui client call --package $EXT --module gate_extension --function issue_jump_permit \
  --args $CONFIG $GATE1 $GATE2 $CHAR 0x6 --gas-budget 100000000
```

## Key Findings

1. **Cross-package Auth works.** A separate package _can_ define `XAuth has drop`, authorize it on world's Gate, and mint witnesses for `issue_jump_permit`. No type system or runtime barriers.

2. **OwnerCap hot-potato pattern works with `sui client ptb`.** The `borrow_owner_cap` → use → `return_owner_cap` flow executes cleanly in one PTB.

3. **AdminACL sender-fallback confirmed.** On localnet without a sponsor, `verify_sponsor` correctly falls back to `ctx.sender()`. Self-enrollment + subsequent admin operations work without dual-signing.

4. **Complete bootstrap chain validated.** Character → NetworkNode → Gate → Extension authorization → Permit issuance — all steps succeed. This is the full CivilizationControl runtime path.

5. **`sui client ptb` PowerShell quirk.** PowerShell 5.1 strips embedded double quotes from native commands. Workaround: use `cmd /c` with doubled quotes for string arguments.

## Risk Update

| Prior Risk | Status |
|-----------|--------|
| SR-1: AdminACL enrollment unknown | **ELIMINATED** — sender fallback confirmed |
| SR-2: Cross-package Auth rejection | **ELIMINATED** — full E2E pass |
| SR-3: OwnerCap borrow/return failures | **ELIMINATED** — hot-potato pattern works |
| SR-4: Extension config DF reads | **ELIMINATED** — AllowConfig set + read + used |

## March 11 Re-verification

On the hackathon test server, re-run Steps 2-8 against the deployed world-contracts. The only delta expected is the world package address (which will differ from localnet).
