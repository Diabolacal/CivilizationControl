---
description: Plan a CivilizationControl change without implementing it
argument-hint: Goal or branch task to plan
agent: plan
---

Plan a concrete change in CivilizationControl without implementing it.

Use `.github/copilot-instructions.md` and `AGENTS.md` as canonical policy. Prefer current repo truth from `docs/llm-reference-guide.md`, `docs/decision-log.md`, and current dated operations docs over archived March-era material.

Constraints:
- Planning only. Do not edit files, run deploys, change runtime code, update dependencies, or execute the change in this prompt.
- Prefer tracked docs in place over scratch notes or untracked markdown.
- Inspect and preserve dirty trees. Never use `git reset --hard` or `git clean`.
- Use read-only subagents first for multi-file or research-heavy planning.
- Assume `master` is the repo base branch. If deploy context matters, note that Cloudflare Pages production deploys use branch `main`.
- Recognize the current repo model where relevant: direct-chain authority, the in-repo sponsor worker, additive shared-backend enrichment, and the `WORLD_RUNTIME_PACKAGE_ID` / `WORLD_ORIGINAL_PACKAGE_ID` split.

Return:
- Checklist
- Assumptions (max 2)
- Risk class
- Plan (files or surfaces, expected diff size)
- Validation gates
- Required tracked docs updates

Stop after the plan. Do not implement anything unless the user explicitly asks for execution.
