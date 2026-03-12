## Decision Log

Newest first. Use the template in `docs/operations/DECISIONS_TEMPLATE.md`.

---

## 2026-03-12 – EVE Vault Sponsorship Analysis: AdminACL Blocker Reclassified
- Goal: Determine whether EVE Vault's sponsored tx relay resolves the AdminACL blocker for CivilizationControl
- Files: `docs/architecture/evevault-sponsorship-analysis.md` (created), `docs/operations/day1-validation.md` (updated), `docs/README.md` (updated)
- Diff: +95 LoC (analysis doc), Day 1 Check 5 reclassified from BLOCKED → PASS
- Risk: low (research/documentation only, no code changes)
- Gates: N/A (no code changes)
- Decisions:
  - AdminACL sponsorship is **not required** for CivilizationControl's own functions — none call `verify_sponsor`
  - Game-level sponsored operations (`jump_with_permit`, etc.) are handled by EVE Frontier backend via Vault relay
  - Day 1 validation reclassified: no blockers remain for CC contract/app implementation
  - Live validation of end-to-end extended-gate jump flow remains a follow-up item (not a blocker)
- Follow-ups: Deploy extension to Utopia, test extended-gate jump with EVE Vault

---

## 2026-03-12 – Day 1 Chain Validation on Utopia Testnet
- Goal: Execute Day 1 checklist against live Utopia testnet, validate all source assumptions and environment IDs
- Files: `docs/operations/day1-validation.md` (created), `docs/decision-log.md` (updated)
- Diff: +180 LoC (validation results file)
- Risk: low
- Gates: move-build ✅ move-test ✅ (no frontend gates yet)
- Decisions:
  - Adopted Utopia testnet IDs as initial live baseline (all 8 LIVE-VERIFIED)
  - Feature branch `feature/day1-chain-validation` used for safe Day 1 execution
  - AdminACL sponsor enrollment marked BLOCKED — requires organizer action or EVE Vault confirmation
- Follow-ups: Confirm dapp-kit sponsored tx relay; request organizer AdminACL enrollment if needed

---

<!-- New entries above this line -->
