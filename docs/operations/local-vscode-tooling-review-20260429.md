# Local VS Code And Tooling Review — 2026-04-29

## 1. Executive summary

Overall assessment:
- The workspace-level VS Code and Copilot setup is mostly sound for CivilizationControl.
- The repo already uses the right core defaults: `AGENTS.md`, `.github/copilot-instructions.md`, scoped instruction files, built-in browser tools, narrow extension recommendations, and no workspace-local MCP config.
- The biggest current noise and cost risks come from local autonomy settings and duplicated global extensions, not from the checked-in repo files.
- The biggest repo-level tooling drift is missing root runtime pinning for Node/npm and repo-root Wrangler usage.

Top 5 safe recommendations:
1. Remove the stale `docs/COPILOT_MEMORY_GUIDELINES.md` comment reference from `.vscode/settings.json` in a later workspace-settings branch.
2. Review `chat.autopilot.enabled = true` and `chat.agent.maxRequests = 100` in a dedicated workspace-settings branch; they are the clearest token/request multipliers.
3. Keep built-in browser tools as the default browser validation surface and continue avoiding shared browser MCP config for routine work.
4. Add a dedicated runtime-pinning/toolchain-policy branch later to decide `engines`, `packageManager`, or root Node pinning.
5. Do a separate manual global-extension review for duplicate token trackers, duplicate SQLite viewers, redundant Move syntax support, and older duplicate GitHub PR installs.

Top 5 things not to change:
1. Do not disable `chat.useAgentsMdFile`, `chat.useAgentSkills`, or the repo instruction stack without a deliberate instruction-system review.
2. Do not disable built-in browser chat tools for this repo; they are the preferred default.
3. Do not add workspace-local MCP config unless a repeated workflow proves a real need.
4. Do not remove Mysten Move tooling; it remains essential for CivilizationControl.
5. Do not treat Python, Docker, Mermaid, or GitHub PR tools as repo-specific noise problems without a broader cross-repo/global review.

Manual approval required items:
- `chat.autopilot.enabled`
- `chat.agent.maxRequests`
- any user-level terminal auto-approve rules
- any user-level URL auto-approve rules
- any global extension removals or workspace disables outside this repo
- any future workspace-local MCP additions

Immediate next action:
- If you want to reduce local tool/token noise, do a small dedicated workspace-settings cleanup branch focused only on `.vscode/settings.json` and nothing else.

## 2. Workspace configuration inventory

| File/setting | Current value or summary | Purpose | Risk/noise level | Recommendation | Confidence |
|---|---|---|---|---|---|
| `.vscode/settings.json` `chat.useAgentsMdFile` | `true` | Loads `AGENTS.md` as agent context | Low | Keep | High |
| `.vscode/settings.json` `chat.useAgentSkills` | `true` | Enables `.github/skills/` discovery | Low | Keep | High |
| `.vscode/settings.json` `github.copilot.chat.copilotMemory.enabled` | `true` | Enables Copilot memory | Medium | Keep enabled; rely on memory discipline, not a setting change | High |
| `.vscode/settings.json` comment for memory guidance | Refers to missing `docs/COPILOT_MEMORY_GUIDELINES.md` | Pointer for memory usage policy | Low | Fix later; stale comment only | High |
| `.vscode/settings.json` `github.copilot.chat.searchSubagent.enabled` | `true` | Enables search subagent flow | Medium | Keep; aligned with repo subagent-first guidance | High |
| `.vscode/settings.json` `github.copilot.chat.organizationInstructions.enabled` | `true` | Org instruction support | Low | Keep | High |
| `.vscode/settings.json` `github.copilot.chat.codeGeneration.instructions` | Explicit `.github/copilot-instructions.md` file entry | Settings-based instruction injection | Medium | Leave unchanged for now; review later because file discovery already exists | Medium |
| `.vscode/settings.json` `chat.tools.terminal.enableAutoApprove` | `false` | Keeps terminal approvals narrow | Low | Keep | High |
| `.vscode/settings.json` `chat.tools.terminal.autoApproveWorkspaceNpmScripts` | `true` | Auto-approves workspace package scripts | Low | Keep | High |
| `.vscode/settings.json` `chat.tools.terminal.preventShellHistory` | `true` | Prevents agent shell-history pollution | Low | Keep | High |
| `.vscode/settings.json` `chat.promptFilesRecommendations` | `{ "plan": true }` | Promotes prompt discovery in chat welcome view | Low | Keep; consider whether `rehydrate` also deserves discovery later | Medium |
| `.vscode/settings.json` `chat.agent.maxRequests` | `100` | Allows long autonomous runs | High | Manual-review candidate; likely too high for default repo noise profile | High |
| `.vscode/settings.json` `chat.autopilot.enabled` | `true` | Enables Autopilot | High | Manual-review candidate; biggest tool/request amplifier | High |
| `.vscode/settings.json` `workbench.browser.enableChatTools` | `true` | Enables built-in browser chat tools | Medium | Keep; preferred default for this repo | High |
| `.vscode/settings.json` search and TS vendor exclusions | Vendor `node_modules`, `build`, `dist`, `target`, `.turbo`, `Move.lock`, and TS watch exclusions | Suppresses vendor noise | Low | Keep | High |
| `.vscode/extensions.json` recommendations | `GitHub.copilot-chat`, `humao.rest-client`, `GitHub.vscode-pull-request-github` | Narrow workspace extension recommendations | Low | Keep | High |
| `.vscode/extensions.json` unwanted recommendations | `GitHub.copilot` | Avoids deprecated standalone Copilot extension | Low | Keep | High |
| `.vscode/tasks.json` Sui tasks | Build/test/env/publish tasks with `reveal: always` | Sui Move workflow support | Medium | Keep; review terminal reveal noise later only if it becomes annoying | Medium |
| Workspace MCP config | No `.vscode/mcp.json` or repo `.mcp.json` | MCP server configuration | Low | Keep absent unless a repeated workflow proves a real need | High |

## 3. Installed extensions inventory

| Extension | Version | Purpose | CivilizationControl usefulness | Token/tool noise risk | Recommendation | Scope |
|---|---|---|---|---|---|---|
| `github.copilot-chat` | `0.45.1` | Core local Copilot agent surface | Essential | Medium | Keep | Global/workspace |
| `github.vscode-pull-request-github` | `0.140.0` | PR and issue workflows | Useful but not always needed | Low | Keep | Global/workspace |
| `github.remotehub` | `0.64.0` | Remote repo browsing | Useful but not always needed | Low | No action | Global |
| `ms-vscode.remote-repositories` | `0.42.0` | Remote repo workflows | Useful but not always needed | Low | Manual review only if you want a global cleanup | Global review |
| `mysten.move` | `1.0.42` | Primary Move/Sui language support | Essential | Low | Keep | Global/workspace |
| `mysten.prettier-move` | `0.3.5` | Move formatting | Useful but not always needed | Low | Keep | Global |
| `mysten.move-trace-debug` | `0.0.19` | Move trace debugging | Useful but not always needed | Low | Keep | Global |
| `damirka.move-syntax` | `0.8.0` | Additional Move syntax support | Redundant candidate | Low | Manual review after verifying Mysten Move covers your needs | Global review |
| `humao.rest-client` | `0.25.1` | Manual HTTP checks | Useful but not always needed | Low | Keep | Global/workspace |
| `bierner.markdown-mermaid` | `1.32.0` | Mermaid rendering | Useful but not always needed | Low | Keep | Global |
| `alexcvzz.vscode-sqlite` | `0.14.1` | SQLite browsing | Duplicate class | Low | Manual review because another SQLite viewer is installed | Global review |
| `qwtel.sqlite-viewer` | `25.12.2` | SQLite browsing | Duplicate class | Low | Manual review because another SQLite viewer is installed | Global review |
| `ckolkman.vscode-postgres` | `1.4.3` | Postgres browsing | Useful but not always needed | Low | No action | Global |
| `grafana.grafana-vscode` | `0.0.19` | Grafana workflows | Low direct relevance | Low | No action unless broader global cleanup is desired | Global/manual |
| `ms-python.python` | `2026.4.0` | Python support | Safe global tooling | Low | No action | Global |
| `ms-python.vscode-pylance` | `2026.2.1` | Python analysis | Safe global tooling | Low | No action | Global |
| `ms-python.vscode-python-envs` | `1.28.0` | Python env management | Safe global tooling | Low | No action | Global |
| `ms-python.debugpy` | `2026.4.0` | Python debugging | Safe global tooling | Low | No action | Global |
| `charliermarsh.ruff` | `2026.40.0` | Python linting/formatting | Safe global tooling | Low | No action | Global |
| `ms-azuretools.vscode-docker` | `2.0.0` | Docker workflows | Useful but not always needed | Low | Keep | Global |
| `ms-azuretools.vscode-containers` | `2.4.3` | Container workflows | Useful but not always needed | Low | Keep | Global |
| `ms-vscode-remote.remote-containers` | `0.454.0` | Dev Containers | Useful but not always needed | Low | Keep | Global |
| `robbos.copilot-token-tracker` | `0.2.2` | Token/count telemetry | High-noise candidate | Medium | Keep only if you actively use it; duplicates make this a global review target | Global review |
| `ms-vscode.cpptools` | `1.32.2` | C/C++ support | Low repo relevance | Low | No repo-specific action; consider only in a broader global cleanup | Global review |
| `ms-vscode.cpptools-extension-pack` | `1.5.1` | C/C++ tooling bundle | Low repo relevance | Low | No repo-specific action | Global review |
| `ms-vscode.cpp-devtools` | `0.4.7` | C/C++ developer tools | Low repo relevance | Low | No repo-specific action | Global review |
| `ms-vscode.cmake-tools` | `1.23.52` | CMake workflows | Low repo relevance | Low | No repo-specific action | Global review |
| `ms-vscode.powershell` | `2025.4.0` | PowerShell support | Useful on Windows | Low | Keep | Global |
| `esbenp.prettier-vscode` | `12.4.0` | General formatter | Useful but not critical here | Low | No action | Global |
| `mechatroner.rainbow-csv` | `3.24.1` | CSV readability | Useful but not critical here | Low | No action | Global |

## 4. MCP and agent-tool inventory

| Tool/server | Source | Purpose | Overlap | Risk/noise | Recommendation |
|---|---|---|---|---|---|
| Built-in browser chat tools | Workspace setting `workbench.browser.enableChatTools = true` | Routine browser navigation, reads, screenshots, interaction | Overlaps with browser MCP for basic workflows | Medium | Keep as the repo default |
| Workspace MCP config | None found in `.vscode/mcp.json` or repo `.mcp.json` | Shared workspace MCP surface | None | Low | Keep absent unless a repeated workflow proves a need |
| User-level MCP config path | `C:\Users\micha\AppData\Roaming\Code\User\mcp.json` exists by name | Global/user MCP configuration | Unknown without opening it | Medium | Manual review only; do not change from this repo task |
| Chrome DevTools MCP | Likely global if installed; no repo config found | Deeper network/performance/memory inspection | High overlap with built-in browser tools for routine checks | Medium | Workspace-disable candidate only if globally enabled and noisy |
| Playwright MCP | Likely global if installed; no repo config found | Browser automation via MCP | Overlaps with built-in browser tools and root `playwright` package | Medium | Do not make default for this repo |
| Search subagent | Built-in/Copilot setting | Isolated codebase search loops | No direct overlap with MCP | Medium | Keep enabled |
| Copilot Memory | Built-in/Copilot setting | Cross-session context carryover | No direct overlap with MCP | Medium | Keep enabled with disciplined usage |

Clear note:
- No workspace-local MCP config exists in this repo.

## 5. Browser automation recommendation

Default recommendation:
- Use built-in VS Code browser tools for routine preview validation, UI smoke checks, screenshots, navigation, and light interaction.

When Chrome DevTools MCP is justified:
- network-body/header inspection
- performance traces and Lighthouse-style audits
- memory analysis or console-heavy debugging
- real Chrome profile/session attachment workflows

When Playwright MCP is justified:
- only if you specifically want MCP-exposed browser automation instead of the built-in browser toolset or the repo’s normal Playwright dependency
- in practice, plain Playwright or the built-in browser tools are usually the better defaults here

Duplication and tool noise:
- built-in browser tools already cover the routine path for this repo
- adding Chrome DevTools MCP or Playwright MCP on top of that likely increases available-tool noise without enough benefit for day-to-day work

Workspace recommendation:
- Do not add or enable workspace-local browser MCP config for this repo by default.

## 6. Python/container/Grafana/global tooling

| Tool class | Classification | Reason |
|---|---|---|
| Python / Pylance / Python Envs / Ruff / debugpy | Keep | Safe global tooling; not a repo-specific noise problem |
| Docker / Containers / Dev Containers | Keep | Still relevant to broader workflows and not causing repo-local noise |
| Grafana | No action | Low-confidence relevance; not a repo-specific problem |
| SQLite viewers | Global review candidate | Two viewers installed; duplication is global, not repo-specific |
| REST Client | Keep | Explicitly recommended by the workspace and useful for manual checks |
| Mermaid | Keep | Low-risk and useful for docs/reviews |
| GitHub PR tools | Keep | Explicitly recommended and useful for review workflows |
| Token trackers | Global review candidate | Duplicate/noisy class; not needed for every repo |

## 7. Autopilot, auto-approval, and token-noise settings

Main spend/noise drivers:
- `chat.autopilot.enabled = true`
- `chat.agent.maxRequests = 100`

Useful for long autonomous tasks:
- search subagent enablement
- Copilot memory enablement
- workspace npm-script auto-approval in a trusted repo
- built-in browser tools enablement

Should remain unchanged:
- `chat.useAgentsMdFile = true`
- `chat.useAgentSkills = true`
- `chat.tools.terminal.enableAutoApprove = false`
- `chat.tools.terminal.autoApproveWorkspaceNpmScripts = true`
- `chat.tools.terminal.preventShellHistory = true`
- `workbench.browser.enableChatTools = true`

Manual-review items:
- `chat.autopilot.enabled`
- `chat.agent.maxRequests`
- any user-level terminal auto-approve rules
- any user-level URL auto-approvals

Safer values if later approved for CivilizationControl:
- `chat.autopilot.enabled = false`
- `chat.agent.maxRequests = 40`

Cost/noise trade-off:
- the current defaults are strong for long autonomous audit/branch tasks, but they are likely wasteful as an always-on default in a repo with a large instruction and docs surface.

## 8. Local CLI and dependency/toolchain freshness

| Tool | Detected version | Repo-pinned version if any | Latest or researched status if checked | Recommendation | Risk |
|---|---|---|---|---|---|
| VS Code | `1.117.0` | None | Current local install observed directly | No repo action | Low |
| Node | `22.19.0` | None at repo root | Not researched externally in this pass | Add root pinning later in a dedicated branch | Medium |
| npm | `10.9.3` | None at repo root | Not researched externally in this pass | Consider `packageManager` pinning later | Medium |
| Wrangler global CLI | `4.47.0` | None at repo root | Local CLI reports update available `4.86.0` | Treat as local-only drift; prefer project-local `npx wrangler` | Low |
| Wrangler worker-local | `^4.0.0` manifest, 4.85.0 lockfile resolution | `workers/sponsor-service/package.json` | Cloudflare guidance prefers local project installation | Keep local-to-worker; do not change outside dedicated branch | Medium |
| Sui CLI | `1.68.1-3c0f387ebb40-dirty` | None in repo | Not researched externally in this pass | Do not update outside dedicated compatibility branch | High |
| Git | `2.50.1.windows.1` | None | Current local install observed directly | No repo action | Low |
| TypeScript (root) | `^5.8.3` manifest | No exact pin | No external research in this pass | No action in this audit | Low |
| Vite (root) | `^6.3.5` manifest | No exact pin | No external research in this pass | No action in this audit | Low |
| React (root) | `^19.2.4` manifest | No exact pin | No external research in this pass | No action in this audit | Low |
| `@evefrontier/dapp-kit` | `^0.1.7` | No exact pin | No external research in this pass | Keep; update only in dedicated wallet/runtime branch | Medium |
| Root `@mysten/sui` | `^2.4.0` | No exact pin | No external research in this pass | Keep; update only in dedicated wallet/runtime branch | Medium |
| Sponsor worker `@mysten/sui` | `2.7.0` | Exact manifest pin | No external research in this pass | Keep; update only in dedicated worker/runtime branch | Medium |

Key freshness finding:
- the repo has no root `engines`, no root `packageManager`, and no root `.nvmrc` or `.node-version`; this is the clearest repo-level toolchain-policy gap.

## 9. Recommended changes

### Safe workspace-level changes
- None implemented in this audit.
- Best candidate for a later tiny branch: review `.vscode/settings.json` only.

### Global/manual review changes
- review duplicate token tracker installs
- review duplicate SQLite viewers
- review redundant Move syntax extension alongside Mysten Move
- review duplicate/older GitHub PR extension installs
- review whether Autopilot should remain enabled by default in this workspace

### Repo-doc updates
- keep this review document as the current local-tooling audit
- update the earlier audit so it records that the local tooling review was completed

### Do-not-change items
- built-in browser tools
- core instruction discovery settings
- narrow terminal safety posture
- Mysten Move tooling
- GitHub PR extension family

### Deferred items
- root runtime pinning and Node/npm policy
- any workspace-local MCP additions
- any real workspace settings cleanup

## 10. Proposed implementation sequence

1. Workspace settings cleanup branch, only if you want to review `.vscode/settings.json` noise settings.
2. Duplicate extension review, manual only.
3. MCP/tool availability cleanup, only if globally enabled browser MCP surfaces are visibly noisy.
4. Runtime pinning/toolchain policy branch.
5. Optional tasks/build-script ergonomics cleanup if terminal reveal noise becomes a recurring issue.

## 11. Web references

All accessed on 2026-04-29.

| URL | What it supports |
|---|---|
| `https://code.visualstudio.com/docs/copilot/customization/custom-instructions` | Current VS Code custom-instructions model |
| `https://code.visualstudio.com/docs/copilot/customization/overview` | Current VS Code customization model across instructions, prompts, skills, MCP |
| `https://code.visualstudio.com/docs/copilot/customization/mcp-servers` | MCP configuration locations, trust model, workspace vs user scope |
| `https://code.visualstudio.com/docs/copilot/agents/agent-tools` | Tool-selection behavior, approval model, Autopilot behavior |
| `https://code.visualstudio.com/docs/debugtest/integrated-browser` | Built-in browser and chat-tool behavior |
| `https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions` | Current GitHub repository instruction guidance |
| `https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide` | Current IDE-side repository instruction guidance |
| `https://docs.github.com/en/copilot/concepts/about-copilot-coding-agent` | Current GitHub Copilot coding-agent model |
| `https://developers.cloudflare.com/workers/wrangler/install-and-update/` | Cloudflare recommendation to install Wrangler locally per project |
| `https://developers.cloudflare.com/workers/wrangler/commands/` | Current Wrangler command guidance |
| `https://developers.cloudflare.com/workers/wrangler/commands/pages/` | Current `wrangler pages` behavior and branch-related guidance |
| `https://docs.npmjs.com/cli/v11/configuring-npm/package-json` | `engines`, `packageManager`, and npm package metadata guidance |
| `https://nodejs.org/api/packages.html` | Node package metadata and module-format guidance |
| `https://docs.sui.io/getting-started/onboarding/sui-install` | Current Sui install guidance |
| `https://docs.sui.io/references/cli` | Sui CLI reference |
| `https://docs.sui.io/references/cli/client` | Sui client reference |
| `https://github.com/ChromeDevTools/chrome-devtools-mcp` | Chrome DevTools MCP scope and capabilities |
| `https://github.com/microsoft/playwright-mcp` | Playwright MCP scope and token-efficiency guidance |
| `https://playwright.dev/docs/intro` | Current Playwright baseline guidance |

## 12. Open questions

1. Do you want a dedicated branch to review `.vscode/settings.json` noise settings, or should the current defaults stay in place?
2. Do you want `chat.autopilot.enabled` to remain the default for this workspace?
3. Do you want `chat.agent.maxRequests` lowered for this repo, and if so, to what ceiling?
4. Do you want root runtime pinning (`engines`, `packageManager`, or a root Node version file) added in a later dedicated branch?
5. Do you want a manual global-extension cleanup pass for duplicate token trackers, SQLite viewers, and redundant Move syntax support?
6. Do you want to keep relying on built-in browser tools only, or explicitly document browser MCP exceptions in a later repo doc?