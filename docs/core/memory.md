# CivilizationControl — Working Memory Template

**Retention:** Carry-forward

> **PRE-HACKATHON PROVISIONAL PLAN**
> Must be re-audited against live world contracts and documentation before March 11 execution.

> **Purpose:** Structured template for tracking implementation progress during hackathon sprints. Create a copy per session or per day.

---

## Usage

1. Copy this file to `docs/working_memory/YYYY-MM-DD_<task>.md`
2. Fill in the metadata block
3. Update Progress and Current State after each milestone
4. Update Checkpoint Log every 10-15 messages or before context compaction

---

## Template

```markdown
# Working Memory — CivilizationControl [Day X / Task Name]

**Date:** YYYY-MM-DD HH:MMZ
**Task Name:** [What you are doing — e.g., "Day 1: Foundation + GateControl Move"]
**Version:** 1
**Maintainer:** Agent + Operator
**Active Branch:** [branch name]
**Environment:** [local devnet / test server / Stillness]

## Objective
[1–2 sentence mission for this session]

## Progress
- [ ] S01 — Create fresh hackathon repo
- [ ] S02 — Add submodules
- [ ] S03 — Verify function signatures
- [ ] S04 — Connect to hackathon server
- [ ] S05 — Validate AdminACL sponsor access
- [ ] ...

## Key Decisions
- Decision: [What was chosen]
  Rationale: [Why]
  Files: [Affected files]
  Risk: [low/med/high]

## Current State
- Last file touched: ...
- Last tx digest: ...
- Next action: ...
- Open questions: ...
- Blockers: ...

## Environment State
- Network: [devnet / testnet / local]
- World Package ID: [0x...]
- CivControl Package ID: [0x...]
- CivControlConfig ID: [0x...]
- AdminCap ID: [0x...]
- Gate IDs: [...]
- SSU IDs: [...]
- Character IDs: [...]

## Evidence Captured
| Beat | Artifact | Tx Digest | Status |
|------|----------|-----------|--------|
| 3 | Policy deploy | | |
| 4 | Hostile denied | | |
| 5 | Ally tolled | | |
| 6 | Trade buy | | |
| 7 | Revenue visible | | |

## Checkpoint Log
- [HH:MM] — [What was verified / decided / blocked]

## Commands Run
| Time | Command | Result |
|------|---------|--------|
| | | |

## Observations
- [Unexpected behavior, performance notes, API differences from docs]

## Next Step Pointer
> [Exact next action to take when resuming — specific enough to continue without re-reading context]
```

---

## Recovery Procedure

When resuming after context loss (summarization, new session):

1. Read the most recent `docs/working_memory/*.md` file
2. Run `git status` and `sui client active-env` to verify state
3. Read the Current State and Next Step Pointer sections
4. Confirm with operator before resuming work
5. Continue from the Next Step Pointer

---

## Cleanup

- Move completed working memory files to `docs/archive/working_memory/`
- Keep at most one active file per task
- If exceeding ~200 lines, summarize into decision log and trim
