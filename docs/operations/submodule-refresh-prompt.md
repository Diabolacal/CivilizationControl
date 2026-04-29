# Submodule Refresh — Reusable Agent Prompt

**Retention:** Carry-forward

> **Created:** 2026-02-20  
> **Purpose:** Repeatable prompt + procedure for refreshing all git submodules, auditing changes, and updating local documentation.

---

## When to Run

- Weekly during active development
- Before hackathon submission freeze
- After notification of upstream changes to any submodule

## Prerequisites

- Clean working tree (no uncommitted changes outside `vendor/`)
- Network access to GitHub (submodule remotes)

## Procedure

### Step 1: Preflight

```bash
git status
git submodule status --recursive
# Record current pinned SHAs for each submodule
git diff -- vendor/  # Shows pinned vs checked-out SHA per submodule
```

### Step 2: Create Working Branch

```bash
git checkout -b chore/submodule-refresh-YYYYMMDD
```

### Step 3: Sync, Init, Fetch + Update Each Submodule

```bash
# Ensure submodule URLs and branch config are in sync with .gitmodules
git submodule sync --recursive
git submodule update --init --recursive

# Fetch all remotes
git submodule foreach --recursive 'git fetch --all --prune'

# Checkout + pull default branch for each submodule.
# NOTE: Not all submodules use 'main'. Detect the default branch first:
#   git -C vendor/<name> remote show origin | grep 'HEAD branch'
# Or check .gitmodules for a configured branch. Use the detected branch below.
cd vendor/builder-documentation && git checkout main && git pull origin main && cd ../..                      
cd vendor/builder-scaffold && git checkout main && git pull origin main && cd ../..                      
cd vendor/eve-frontier-proximity-zk-poc && git checkout main && git pull origin main && cd ../..                      
cd vendor/evevault && git checkout main && git pull origin main && cd ../..                      
cd vendor/world-contracts && git checkout main && git pull origin main && cd ../..                      

# Verify
git submodule status --recursive
git diff -- vendor/  # Confirms old→new SHA changes
```

### Step 4: Audit Changes Per Submodule

For each submodule with changes:

```bash
cd vendor/<name>
git log --oneline --decorate <oldSHA>..<newSHA>
git diff <oldSHA>..<newSHA> --stat
# Read key changed files (especially Move modules, TS scripts, documentation)
cd ../..
```

**Focus areas by submodule:**

| Submodule | Key areas to audit |
|---|---|
| **world-contracts** | `contracts/world/sources/` (Move modules), `extension_examples/`, function signature changes, new events, `verify_sponsor` call sites |
| **builder-documentation** | New/changed pages, AdminCap/AdminACL naming, extension patterns, SSU/gate/turret, deployment guides |
| **evevault** | Wallet adapter (`SuiWallet.ts`), chain support, sponsored tx (`walletHandlers.ts`), auth modules, SDK changes |
| **builder-scaffold** | Move contracts (`smart_gate_extension/`, `storage_unit_extension/` — renamed from `smart_gate/`, `storage_unit/` in v3c65b22), TS scripts, Docker config, deployment scripts, .env changes |
| **proximity-zk-poc** | Circuit changes, proof generation, verification patterns |

### Step 5: Update Local Documentation

#### 5a. Always-update targets

These files are structurally coupled to submodule state and must always be checked:

1. **`docs/research/evefrontier-builder-docs-map.md`** — Update review date, submodule commit SHAs, section summaries, gaps
2. **`docs/llm-reference-guide.md`** — Add findings that affect current package/runtime truth, update version refs, and note call-site signature changes that matter to active guidance
3. **`docs/strategy/_shared/hackathon-portfolio-roadmap.md`** — Update track status if upstream changes affect feasibility
4. **`docs/decision-log.md`** — Add entry for the refresh

#### 5b. Autonomous drift sweep (REQUIRED)

Do **not** stop at the four files above. Use subagents or `grep_search` to find **all** documents in the repository that reference patterns changed in the new version.

**Procedure:**
1. From the audit in Step 4, extract a list of **changed symbols** — function names, struct names, error codes, removed parameters, new functions, version strings, commit SHAs.
2. For each changed symbol, run `grep_search` across `docs/`, `sandbox/`, `experiments/`, `.github/`, and root `.md` files.
3. Consult `docs/README.md` (the documentation index) to identify thematic clusters likely affected (e.g., an inventory change affects TradePost, SSU, and Cargo Bond docs).
4. For each file with outdated references, add a brief `> **v0.0.15 update:**` callout annotation near the stale text. **Do not rewrite entire sections** — prefer addenda over rewrites.
5. For files that assert something now false (e.g., "no partial withdrawal" when partial withdrawal was added), use `> **RESOLVED (vX.Y.Z):**` annotations.
6. For archive docs, add a one-line `> **Outdated (vX.Y.Z):**` note — do not invest in full corrections.

**Typical search patterns (adapt to actual changes):**
```
# Function signature changes
grep_search: withdraw_item|deposit_item|deposit_to_owned

# Removed/renamed errors
grep_search: EItemVolumeMismatch|ETypeIdMismatch

# Auth model changes
grep_search: AdminACL.*(deposit|withdraw|energy)

# Version/SHA pins
grep_search: v0\.0\.14|78854fe   (replace with actual old version/SHA)

# SDK/tooling changes
grep_search: useSponsoredTransaction|useDAppKit

# Structural model changes
grep_search: ItemEntry|two access mode|VecMap.*Item
```

**Exclusion rule:** Skip files already updated in Step 5a. Skip `vendor/` (read-only).

### Step 6: Commit + Push

```bash
git add vendor/
git add docs/ sandbox/ experiments/ .github/
# Review staged changes — confirm no secrets, no vendor-internal files
git diff --cached --stat
git commit -m "chore: refresh submodules + docs (YYYY-MM-DD)"
git push -u origin chore/submodule-refresh-YYYYMMDD
```

## Expected Output Format

### Summary Table

| Submodule | Old SHA | New SHA | Commits | Impact |
|---|---|---|---|---|
| builder-documentation | `abc1234` | `def5678` | N | Low/Med/High |
| builder-scaffold | ... | ... | ... | ... |
| evevault | ... | ... | ... | ... |
| world-contracts | ... | ... | ... | ... |
| proximity-zk-poc | ... | ... | ... | ... |

### Per-Submodule Report

For each changed submodule:
- **Notable changes** (3-8 bullets)
- **Impact on CivilizationControl** (3-6 bullets)
- **Action items** (if any)

## Guardrails

- Do not create commits inside submodule repos; only update submodule pointers in the parent repo
- Never modify tracked files inside submodules
- If local changes exist in a submodule, stop and surface them
- If breaking changes are found, capture evidence and create a TODO note — don't speculatively fix
- Minimal doc edits: prefer addenda and callouts over rewrites
- Update stored memory facts if previously stored facts are now outdated

## Optional: Merge Back to Main (VS Code Flow)

After push + review of the feature branch, merge into `main`:

```bash
git checkout main
git pull origin main

# Prefer fast-forward; fall back to normal merge if main diverged
git merge chore/submodule-refresh-YYYYMMDD --ff-only \
  || git merge chore/submodule-refresh-YYYYMMDD

git push origin main

# Cleanup (only after main push succeeds)
git push origin --delete chore/submodule-refresh-YYYYMMDD
git branch -d chore/submodule-refresh-YYYYMMDD
```

If `-d` refuses (thinks branch is unmerged), **stop and investigate** — do not force-delete.

## Lessons Learned (2026-03-03)

From the v0.0.14→v0.0.15 refresh:
- The original prompt only listed 3 docs to update. The autonomous drift sweep (Step 5b) found **~30 additional files** with outdated references.
- Most impactful change patterns: function signature changes (withdraw_item), removed errors (EItemVolumeMismatch), new functions (deposit_to_owned), auth model changes (AdminACL removal from owner-path).
- `docs/README.md` is the best starting point for identifying thematic clusters of affected docs.
- Archive docs still need annotations ("Outdated") to prevent future agents from treating stale claims as current.
- Correct roadmap path is `docs/strategy/_shared/hackathon-portfolio-roadmap.md` (not `docs/strategy/`).

## Agent Prompt (Copy-Paste)

When asking an AI agent to perform this refresh, use:

> Update all git submodules to their latest upstream commits. For each submodule that changed: (1) record old→new SHA, (2) audit what changed in Move modules/docs/scripts/APIs, (3) assess impact on CivilizationControl architecture. Then update the always-update targets in Step 5a. After that, run the autonomous drift sweep (Step 5b) — search the ENTIRE repo for all docs referencing changed symbols and annotate them. Consult `docs/README.md` to identify thematic doc clusters. Add a decision-log entry. Commit on a `chore/submodule-refresh-YYYYMMDD` branch and push.