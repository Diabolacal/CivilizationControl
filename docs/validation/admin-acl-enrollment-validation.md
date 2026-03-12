# AdminACL Self-Enrollment Validation Report

**Retention:** Carry-forward

## Summary

**AdminACL self-enrollment PASS** — `verify_sponsor` sender-fallback confirmed. No dual-sign required on localnet.

## Claims Validated

| Claim | Status | Evidence |
|-------|--------|----------|
| `add_sponsor_to_acl` adds address to ACL | **PASS** | TX `59PBAr...NGuy`, DF `Field<address, bool>` created |
| `verify_sponsor` falls back to `ctx.sender()` | **PASS** | All subsequent admin operations succeeded without sponsor |
| Self-enrollment enables admin operations | **PASS** | Character, NetworkNode, Gate creation all passed |

## Execution

```bash
sui client call --package $WORLD --module access --function add_sponsor_to_acl \
  --args $ADMIN_ACL $GOVERNOR_CAP $MY_ADDRESS --gas-budget 100000000
```

TX digest: `59PBArVe1uuEWyKvuAPsvGKurXDhnVKEYG1YDvHzNGuy`

## Verified Flow

1. `add_sponsor_to_acl(AdminACL, GovernorCap, our_address)` → created `Field<address, bool>` DF on AdminACL
2. `create_character` (calls `verify_sponsor` internally) → **success** without dual-sign
3. `network_node::anchor` (calls `create_owner_cap_by_id` → `verify_sponsor`) → **success**
4. `gate::anchor` (same flow) → **success**
5. `gate::share_gate` (calls `verify_sponsor`) → **success**

## Key Insight

`verify_sponsor` checks `tx_context::sponsor(ctx)` first. If `None` (not a sponsored tx), it falls back to `ctx.sender()`. Since our address is in the ACL, single-signer transactions pass. This eliminates the need for dual-sign infrastructure on localnet and simplifies the hackathon demo flow.

## Risk Update

SR-1 (AdminACL enrollment unknown) → **ELIMINATED**
