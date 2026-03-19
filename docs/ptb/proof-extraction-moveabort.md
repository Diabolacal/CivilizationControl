# Proof Extraction & MoveAbort Constraints

**Retention:** Carry-forward

- **Status:** Pattern/Template (Non-Canonical)
- **Last Verified:** Not yet verified on hackathon test server
- **Revalidation Required:** Yes

---

## Purpose

CivilizationControl's demo and judging strategy depends on **capturing proof of on-chain governance actions**. This document covers proof extraction patterns and the critical constraint that MoveAbort transactions produce no events.

For the full evidence mapping, see `civilizationcontrol-claim-proof-matrix.md`.

---

## 1. MoveAbort Produces No Events

**This is the single most important constraint for demo proof capture.**

When a Sui Move transaction aborts via `assert!()` or `abort`, the following happens:
- The transaction is **not executed** — all state changes revert
- **No events are emitted** — even events emitted before the abort line are discarded
- The transaction **does** appear on-chain with status `failure`
- The **abort code** and **module** are recorded in the transaction effects
- **Gas is still consumed** (charged to the sender/sponsor)

### Implications for CivilizationControl

- **Positive proof** (successful governance action): Events + created objects + mutated state provide rich evidence
- **Negative proof** (denied action): MoveAbort means only the transaction digest and abort code are available
- A toll gate **denial** (player lacks funds, wrong tribe, etc.) produces a MoveAbort with an abort code but NO `TollCollected` or `JumpDenied` event
- Demo evidence for "access denied" scenarios must use **digest-based** proof, not event-based proof

---

## 2. Digest-Based Proof Extraction

Every Sui transaction (success or failure) produces a **transaction digest** — a unique hash identifier. This is the foundation of proof extraction when events are unavailable.

### Successful Transaction Proof

```
Evidence available:
  ├── Transaction digest (unique hash)
  ├── Transaction effects (created, mutated, deleted objects)
  ├── Emitted events (typed, queryable, indexed)
  ├── Gas usage (computation + storage)
  └── Sender / sponsor addresses

Proof capture:
  1. Execute transaction → capture digest from response
  2. Query events by digest: sui_getEvents(digest)
  3. Query effects by digest: sui_getTransactionBlock(digest, {showEffects: true, showEvents: true})
  4. Store digest + relevant event data as evidence
```

### Failed Transaction (MoveAbort) Proof

```
Evidence available:
  ├── Transaction digest (unique hash)
  ├── Status: failure
  ├── Abort code (u64) + module location
  ├── Gas usage (still charged)
  └── Sender / sponsor addresses

Evidence NOT available:
  ├── Events (all discarded on abort)
  ├── Object mutations (all reverted)
  └── Created objects (all reverted)

Proof capture:
  1. Execute transaction → capture digest from error response
  2. Query transaction: sui_getTransactionBlock(digest, {showEffects: true})
  3. Extract abort code from effects.status.error
  4. Map abort code to human-readable denial reason (requires Move source cross-reference)
  5. Store digest + abort code as evidence
```

### Abort Code Mapping

Abort codes are `u64` values defined in Move source. They are **not self-describing** — you need the Move source to interpret them.

```
Pattern: Abort Code → Denial Reason Mapping

Move source (example):
  const E_NOT_AUTHORIZED: u64 = 1;
  const E_INSUFFICIENT_FUNDS: u64 = 2;
  const E_WRONG_TRIBE: u64 = 3;

Off-chain mapping (build from source at deploy time):
  { 1: "Not authorized", 2: "Insufficient funds", 3: "Wrong tribe" }

CRITICAL: Abort codes may change between world-contracts versions.
Rebuild mapping after every redeployment.
```

---

## 3. Demo-Proof Capture Strategy

### Proof Moments (from Demo Beat Sheet)

Each demo "beat" requires specific evidence. The capture method depends on whether the action succeeds or fails:

| Scenario | Transaction Status | Primary Evidence | Fallback Evidence |
|----------|-------------------|-----------------|-------------------|
| Toll collected successfully | Success | Event: `TollCollected` (if emitted) + digest | Digest + effects showing coin transfer |
| Jump completed | Success | Event: `JumpExecuted` (if emitted) + permit object deletion | Digest + effects |
| Access denied (wrong tribe) | Failure (MoveAbort) | Digest + abort code | None — this IS the evidence |
| Access denied (no funds) | Failure (MoveAbort) | Digest + abort code | None — this IS the evidence |
| Gate topology reconfigured | Success | Events: `GateLinked` / `GateUnlinked` | Digest + effects |
| Extension authorized | Success | Digest + effects | Query gate object to confirm extension field |

### Capture Workflow

```
For each demo proof moment:

1. PRE-CAPTURE
   - Document expected outcome (success / denial)
   - Prepare PTB with all required inputs
   - If denial is expected: note the expected abort code

2. EXECUTE
   - Submit transaction
   - Capture FULL response (digest, effects, events, errors)
   - Log timestamp

3. POST-CAPTURE
   - For success: extract events + object changes
   - For MoveAbort: extract digest + abort code
   - Store as structured evidence (see claim-proof-matrix)

4. VALIDATE
   - Confirm evidence matches expected outcome
   - If unexpected result: investigate before continuing demo
```

### Evidence Storage Format

```
{
  "proof_moment": "toll_gate_denial_wrong_tribe",
  "timestamp": "2026-03-11T...",
  "tx_digest": "ABC123...",
  "status": "failure",
  "abort_code": 3,
  "abort_module": "PACKAGE::civcontrol::tribe_permit",
  "human_readable": "Player denied: wrong tribe",
  "screenshot": "screenshots/beat-3-denial.png"
}
```

> **NOTE:** `devInspectTransactionBlock` may not perfectly replicate full execution behavior. Always validate critical demo proof flows using a real execution transaction on the hackathon test server before capturing final evidence.

---

## 4. Abort Code Revalidation

**Abort codes are NOT stable across deployments.** They are integer constants defined in Move source and may change when:

- World-contracts is updated (new error codes added, existing ones renumbered)
- CivilizationControl extension code is modified
- A different branch of world-contracts is deployed to the test server

### Revalidation Procedure

```
On March 11 (before demo capture):

1. Check the deployed world-contracts version on the hackathon test server
2. Read the relevant Move source files for all abort constants:
   - gate.move → gate-level abort codes
   - storage_unit.move → SSU abort codes
   - access_control.move → auth abort codes
   - civcontrol extension sources → extension-specific codes
3. Build a fresh abort-code → human-readable mapping
4. Test each expected denial scenario once:
   - Confirm the abort code matches your mapping
   - Update mapping if codes have changed
5. Only then proceed with demo evidence capture
```

### Known Abort Code Sources (Sandbox — Revalidate)

These are observed during sandbox testing and **may not be valid on the hackathon test server**:

| Module (placeholder) | Code | Meaning (sandbox) |
|----------------------|------|--------------------|
| `gate` | Various | Auth failures, extension mismatches, invalid permits |
| `access_control` | Various | Sponsor verification failures, ACL membership |
| `civcontrol::*` | TBD | Extension-specific denials (tribe, toll, etc.) |

> **Do not hardcode abort codes.** Build the mapping dynamically from Move source after deployment.

---

## 5. Event Availability Summary

| Event Source | Available on Success | Available on MoveAbort |
|-------------|---------------------|----------------------|
| Move `event::emit()` calls | Yes | **No** |
| Transaction effects (object changes) | Yes | **No** (all reverted) |
| Transaction digest | Yes | Yes |
| Abort code + module | N/A | Yes |
| Gas consumption | Yes | Yes |
| Sender/sponsor addresses | Yes | Yes |

---

## Assumptions & Unknowns

- World-contracts may change pre-March-11
- Turret extension architecture: posture.move (PostureKey DF, set_posture), turret_bouncer.move (BouncerAuth witness), turret_defense.move (DefenseAuth witness). Extension swap (BouncerAuth ↔ DefenseAuth), not online/offline toggle
- SSU withdraw/deposit may delete/recreate objects
- Do not assume object continuity across game boundary
- Package IDs are placeholders
- Event types and names may change in upstream updates
- Abort code values are not guaranteed stable across versions

## Invalidation Triggers

- World-contracts merge changing signatures
- SSU semantics differ on test server
- Auth model change
- Any new dependency on indexer/events
- Abort code renumbering in upstream Move source
