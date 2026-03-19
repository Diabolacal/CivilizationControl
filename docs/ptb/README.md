# PTB Pattern Library

**Retention:** Carry-forward

- **Status:** Pattern/Template (Non-Canonical)
- **Last Verified:** Not yet verified on hackathon test server
- **Revalidation Required:** Yes

---

## What This Is

A **pattern substrate for LLM-assisted coding** — transaction assembly templates, skeleton PTBs, and proof-extraction guidance designed to accelerate CivilizationControl implementation on March 11.

These documents capture structural patterns learned from world-contracts analysis and builder-scaffold reference implementations. They use **placeholders** for all contract-specific values (package IDs, module names, function signatures, type arguments).

## What This Is NOT

- **Not canonical spec.** `spec.md` defines what CivilizationControl does. These docs describe how PTBs are assembled generically.
- **Not verified contract wiring.** Function signatures may have changed since these patterns were drafted. Upstream merges may alter parameters, object types, or auth requirements. Turret extension architecture: posture.move (PostureKey DF), turret_bouncer.move (BouncerAuth), turret_defense.move (DefenseAuth).
- **Not copy-paste production code.** No TypeScript implementation exists here. These are documentation templates only.
- **Not execution authority.** The March-11 Reimplementation Checklist (`march-11-reimplementation-checklist.md`) remains the execution authority for all implementation decisions.

> **Note:** Patterns validated against world-contracts v0.0.14. Upstream now at v0.0.15 — inventory functions changed (withdraw_item, deposit_item). Gate/turret patterns unchanged. Verify signatures before use.

## How to Use on March 11

1. **Read spec + March-11 checklist first.** These establish intent, boundaries, and execution order.
2. **Open this PTB README** as the entry point to transaction assembly guidance.
3. **Revalidate all placeholders** against the latest `world-contracts` commit on the hackathon test server:
   - Confirm function signatures (parameter count, types, ordering)
   - Confirm object types and abilities (`key`, `store`, `drop`)
   - Confirm auth requirements (AdminACL, extension witness, OwnerCap)
   - Confirm shared vs owned object status
4. **Only then generate TypeScript** — using revalidated patterns as input to LLM-assisted code generation.

> **Always confirm signatures against the latest deployment.** World-contracts is actively evolving. A pattern that was valid during sandbox testing may require adjustment.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [ptb-patterns.md](ptb-patterns.md) | Core PTB assembly patterns — coin handling, shared/owned objects, capability patterns, multi-call ordering, failure surfaces |
| [proof-extraction-moveabort.md](proof-extraction-moveabort.md) | Proof extraction under MoveAbort constraints — digest-based evidence, demo capture strategy, abort code revalidation |
| [atomic-settlement-skeleton.md](atomic-settlement-skeleton.md) | Contract-agnostic settlement skeleton — placeholder-based step sequence with revalidation checklist |
| [governance-admin-skeletons.md](governance-admin-skeletons.md) | Governance/admin PTB skeletons — capability handling, shared object mutation, admin-operation templates |

---

## LLM Generation Guardrail Prompt (Use Before Writing Code)

When generating PTB TypeScript, use the following procedure:

### Step 1 — Context Bundle
Provide the LLM with only:
- `spec.md`
- `march-11-reimplementation-checklist.md`
- `docs/ptb/README.md`
- The relevant skeleton file from `docs/ptb/`

Do not overload with unrelated documents.

### Step 2 — Mandatory Revalidation
Before generating TypeScript, explicitly confirm:
- Current world-contracts commit hash
- Function signatures (parameter count, types, ordering)
- Generic type arguments
- Object ownership model (shared vs owned)
- Capability requirements (AdminACL, OwnerCap, extension witness)
- Abort code definitions (for denial scenarios)
- Published package IDs
- Shared object versions (fetch latest on-chain versions before PTB construction)

If any uncertainty exists, fetch Move source and re-derive signatures.

### Step 3 — No Assumptions Rule
Never assume:
- Package IDs
- Struct field names
- Abort code values
- Auth model behavior
- Dynamic field key/value names

Always verify against deployed code.

### Step 4 — Dry-Run First
Generate TypeScript that:
- Performs a dry-run first
- Logs digest + effects
- Validates expected outcome before real execution
- For demo-critical flows, confirm with one real execution on the hackathon test server before recording evidence (dry-run may differ from full execution)

### Step 5 — Evidence Capture Discipline
For demo flows:
- Capture digest
- Capture effects
- Capture abort code (if failure)
- Store structured evidence object

> Pattern libraries accelerate implementation but do not replace live verification.

### Step 6 — Minimal Transaction Scope
- Keep PTBs minimal; do not add commands not required for the specific action.
- Prefer smaller PTBs to reduce failure surface area and gas variability.

---

## Assumptions & Unknowns

- World-contracts may change pre-March-11 (hotfixes, breaking changes)
- Turret extension architecture: posture.move (PostureKey DF, set_posture), turret_bouncer.move (BouncerAuth witness), turret_defense.move (DefenseAuth witness). Extension swap (BouncerAuth ↔ DefenseAuth), not online/offline toggle
- SSU withdraw/deposit may delete/recreate objects (do not assume object continuity across game boundary)
- Package IDs used in these docs are **placeholders only** — real IDs are assigned at publish time
- Auth model may change (AdminACL membership rules, verify_sponsor fallback behavior)
- MoveAbort behavior and abort codes must be revalidated on the hackathon test server

## Invalidation Triggers

Any of the following events invalidates patterns in this library and requires re-verification:

- [ ] World-contracts merge changing function signatures or parameter types
- [ ] SSU semantics differ on hackathon test server vs local devnet
- [ ] Auth model change (AdminACL, verify_sponsor, extension witness requirements)
- [ ] New dependency on indexer or events not available in test environment
- [ ] Object ability changes (key/store/drop) affecting PTB construction
- [ ] Shared object conversion (owned↔shared) changing transaction ordering rules

---

## Document Authority Reminder

| Role | Document |
|------|----------|
| Execution authority | `march-11-reimplementation-checklist.md` |
| Intent authority | `spec.md` |
| Validation authority | `validation.md` |
| Pattern acceleration (this library) | `docs/ptb/` — subordinate to all of the above |

Pattern libraries accelerate implementation but **never override** checklist, spec, or validation authority.
