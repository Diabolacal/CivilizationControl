# VS Code 1.118 Tooling Review — 2026-05-01

## 1. Executive summary

Overall assessment:
- CivilizationControl already uses the correct workspace customization layout for current VS Code Copilot features: `.github/prompts/`, `.github/instructions/`, `AGENTS.md`, `.github/copilot-instructions.md`, and built-in browser chat tools.
- The highest-value safe repo-level change from VS Code 1.118 is to recommend `ms-vscode.vscode-chat-customizations-evaluations` so maintainers can analyze the repo's prompt and instruction files.
- No workspace `.mcp.json` should be added. The repo already prefers built-in browser tools for routine checks, and 1.118's MCP additions do not create a new repo need by themselves.
- No new workspace settings should be committed for 1.118's experimental or contributor-private features. Those belong in operator guidance, not shared repo defaults.

Applied change:
- Added `ms-vscode.vscode-chat-customizations-evaluations` to `.vscode/extensions.json` recommendations.

No-change decisions:
- Keep `.vscode/settings.json` unchanged for this review.
- Keep workspace MCP config absent.
- Keep TypeScript Native / TS 7 preview out of the repo default path.

## 2. Current repo truth relevant to 1.118

Workspace customization surface:
- Prompt files exist in `.github/prompts/plan.prompt.md` and `.github/prompts/rehydrate.prompt.md`.
- Scoped instructions exist in `.github/instructions/*.instructions.md`.
- No repo-owned `.agent.md` files exist today.
- Repo-owned `SKILL.md` files exist in `.github/skills/`, but they are not the best baseline for this review because the marketplace support matrix currently guarantees only `.prompt.md`, `.agent.md`, and `.instructions.md`.

Workspace tooling posture:
- `.vscode/settings.json` already enables built-in browser chat tools and the existing repo customization stack.
- `.vscode/extensions.json` already recommends a narrow set of repo-relevant extensions.
- No `.mcp.json` exists at the repo root or under `.vscode/`.
- Prior local tooling reviews already prefer built-in browser tools over shared browser MCP config for routine work.

Conservative interpretation of extension support:
- The VS Code 1.118 release notes say the new analyzer can target prompt, agent, instructions, or skill definition files.
- The marketplace page for `ms-vscode.vscode-chat-customizations-evaluations` currently documents support for `.prompt.md`, `.agent.md`, and `.instructions.md` only.
- For CivilizationControl, the safe documented workflow is to use the analyzer on prompt and instruction files first, and treat `SKILL.md` analysis as unverified rather than guaranteed.

## 3. Chat Customizations Evaluations guidance

Recommended extension:
- `ms-vscode.vscode-chat-customizations-evaluations`

Best supported repo targets:
- `.github/prompts/plan.prompt.md`
- `.github/prompts/rehydrate.prompt.md`
- `.github/instructions/deployment.instructions.md`
- `.github/instructions/typescript-react.instructions.md`

Files that should not be treated as primary Analyze targets:
- `.github/copilot-instructions.md`
- `AGENTS.md`
- `GITHUB-COPILOT.md`
- `llms.txt`
- `.github/skills/*/SKILL.md` unless future extension docs explicitly confirm stable skill support

Manual workflow:
1. Install `ms-vscode.vscode-chat-customizations-evaluations`.
2. Open one supported file, preferably `.github/prompts/plan.prompt.md`.
3. Run `Chat Customizations Evaluations: Analyze Prompt` from the Command Palette, or use the Analyze / beaker action in the editor title bar.
4. Review diagnostics in the Problems panel.
5. Repeat on `.github/prompts/rehydrate.prompt.md` and one `.instructions.md` file.

Why Analyze might be missing:
- The extension is not installed or is disabled.
- The active file does not match a supported file pattern.
- The supported file is not open in the editor.
- GitHub Copilot is not signed in.
- `chatCustomizationsEvaluations.enable` is disabled.
- VS Code needs a window reload after install.

Related prompt-file guidance worth keeping:
- Continue using `.github/prompts/` as the shared workspace prompt location.
- Do not add `chat.promptFilesLocations` just to restate the default path.
- Use `chat.useCustomizationsInParentRepositories` only for subfolder-open workflows; do not commit it as a repo default.

## 4. VS Code 1.118 feature decisions for this repo

| Feature | Classification | Repo action | Reason |
|---|---|---|---|
| Chat Customizations Evaluations extension | Enable/apply now in repo | Recommend the extension in `.vscode/extensions.json` | Directly improves maintenance of the repo's prompt and instruction files without forcing a global setting |
| Semantic indexing / Build Codebase semantic index | Document as optional/manual | No setting change | Semantic indexing is already available automatically; the manual build command is only needed if workspace grounding looks stale |
| `github.copilot.chat.cli.remote.enabled` | Recommend user-level setting only | No repo change | Experimental remote control for Copilot CLI is workflow-specific and should not be forced on all contributors |
| `git.addAICoAuthor` | Recommend user-level setting only | No repo change | Commit attribution is a contributor preference, not a shared repo policy |
| `github.copilot.chat.skillTool.enabled` plus `context: fork` | Reject/defer with reason | No repo change | Experimental, and a separate skills cleanup would be needed before changing repo skill behavior |
| Workspace `.mcp.json` support and MCP deduplication | Reject/defer with reason | No repo change | This repo has no concrete shared MCP need and already prefers built-in browser tools for routine validation |
| `github.copilot.chat.responsesApi.toolSearchTool.enabled` | Recommend user-level setting only | No repo change | Useful only for supported GPT Responses API workflows; not a repo-wide requirement |
| `github.copilot.chat.anthropic.cacheBreakpoints.lastTwoMessages` | Reject/defer with reason | No repo change | Experimental and Anthropic-specific; not appropriate as a shared default for this repo |
| `github.copilot.chat.localIndex.enabled` / Chronicle | Reject/defer with reason | No repo change | Stores local chat history in a personal SQLite index and should remain an operator choice |
| Sandboxing default read permissions | Document as optional/manual | No repo change | This is a platform behavior change to be aware of, not a repo setting to enable |
| `dev.containers.lockfile` | Reject/defer with reason | No repo change | No active devcontainer feature lockfile surface exists in this repo today |
| TypeScript Native preview / TypeScript 7 beta | Reject/defer with reason | No repo change | Preview tooling with no repo-specific safety proof yet |

## 5. Release-note conclusions that do not require repo changes

Good to know, but not worth a checked-in config change:
- GitHub text search across repos and orgs is useful when comparing behavior outside the workspace, but it is a built-in capability rather than a repo setting.
- Tool-search and cache-efficiency improvements are mostly automatic or model-specific and should stay outside shared workspace settings.
- The default Git co-author behavior changed in VS Code 1.118, but this repo should not force a shared attribution preference.
- The new sandbox read-default behavior matters for debugging commands that touch arbitrary home-directory paths, but the correct response is to keep commands workspace-scoped.

## 6. Sources consulted

- Official VS Code 1.118 release notes: <https://code.visualstudio.com/updates/v1_118>
- Chat Customizations Evaluations marketplace page: <https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-chat-customizations-evaluations>
- VS Code prompt files documentation: <https://code.visualstudio.com/docs/copilot/customization/prompt-files>
- Existing workspace tooling review: `docs/operations/local-vscode-tooling-review-20260429.md`
- Existing agent/tooling audit: `docs/operations/agent-environment-and-guidance-audit-20260429.md`