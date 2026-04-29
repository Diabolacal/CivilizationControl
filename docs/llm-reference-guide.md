# CivilizationControl LLM Reference Guide

Last repo-grounded synthesis: 2026-04-28.

This guide is written for LLM agents and fresh ChatGPT sessions. It summarizes what CivilizationControl is, how the current repository is organized, what the implementation can do, what is only documented or historical, and what future agents must verify before changing code.

The most important rule: runtime code and current configuration beat older planning docs. If a claim appears in older docs but disagrees with `src/`, `contracts/civilization_control/`, or current config files, treat the code as the stronger source and record the conflict.

## 1. Purpose of this document

This is a self-contained, repo-grounded briefing for CivilizationControl. It is meant to be pasted into an LLM conversation so the model can quickly understand the product, architecture, EVE Frontier/Sui integration, validation surface, and risks without re-reading the whole repo.

Evidence style in this guide:

- Claims tied to current code are described as implemented in paths such as `src/lib/suiReader.ts` or `contracts/civilization_control/sources/gate_control.move`.
- Claims tied only to docs are marked as documented, planned, historical, or unverified.
- Known stale or conflicting material is called out directly in section 13.

## 2. Product summary

CivilizationControl is the governance command layer for EVE Frontier infrastructure. It pairs a Sui Move extension package with a browser-based React frontend so infrastructure owners can operate gates, storage units, turrets, and network nodes from a product surface rather than hand-building programmable transaction blocks or scripting raw RPC calls. This framing is stated in `README.md` and implemented through the Move package in `contracts/civilization_control/` and the frontend in `src/`.

The primary user is an EVE Frontier infrastructure owner or tribe operator, especially a solo or small-group operator who needs practical control without specialized developer tooling. The product intentionally hides or simplifies dynamic field lookups, package IDs, witness types, owner-capability borrowing, Sui transaction construction, and gas sponsorship details behind clear operator-facing controls.

The repo's current product language is not generic SaaS. `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md` frames the app as command-layer software for player sovereignty. Current navigation in `src/components/Sidebar.tsx` uses labels like Command Overview, Signal Feed, and Configuration.

## 3. Product vision and design doctrine

CivilizationControl should feel like a calm command surface for frontier infrastructure, not a marketing site or admin panel. The voice guide in `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md` prioritizes calm power, governance, and authority. The current UI follows that direction in many places: `src/components/Sidebar.tsx` uses command-layer labels, `src/screens/Dashboard.tsx` centers the Command Overview, and `src/styles/theme.css` defines a dark-first governance palette.

Design doctrine to preserve:

- Show practical control over real infrastructure, not speculative future systems.
- Prefer short, definitive labels over explanatory UI text.
- Hide backend and on-chain complexity behind actions like authorize, deploy directive, bring online, switch posture, and settle trade.
- Avoid duplicate text and unnecessary buttons. The docs in `docs/ux/ui-polish-reference-brief.md` emphasize reduced noise and visual hierarchy.
- Use orange sparingly for primary action and focus, red for offline/fault/denied, amber for warning/defense, teal for online/healthy, and green for economic/revenue events. These tokens are encoded in `src/styles/theme.css`.
- Preserve product vocabulary: Command Overview, Signal Feed, Configuration, Gates, TradePosts, Turrets, Network Nodes, Policy/Directive, Online/Offline, Operator, Pilot, Structures.

Known doctrine drift: `src/components/StatusDot.tsx` still maps online to green in a generic status component, while `src/styles/theme.css` says green should be reserved for economic events and online should be muted teal. Treat this as a UX polish risk, not an architectural blocker.

## 4. Current implemented capabilities

This section separates code-backed implementation from documented or unverified claims.

Implemented in current source:

- Wallet-to-structure discovery: `src/lib/suiReader.ts` implements wallet to `PlayerProfile` to `Character` to `OwnerCap` to shared structure discovery. `src/hooks/useAssetDiscovery.ts` exposes this to the operator shell.
- Operator shell and routes: `src/App.tsx` defines standalone player routes `/gate`, `/gate/:gateId`, `/ssu`, `/ssu/:ssuId`, plus the operator shell and nested routes for overview, gates, trade posts, turrets, network nodes, activity, and configuration.
- Gate policy presets: `contracts/civilization_control/sources/gate_control.move` defines `GateAuth`, `PolicyPresetKey`, `PolicyPreset`, treasury storage, paid permit issuance, free permit issuance, and policy events. `src/lib/gatePolicyTx.ts`, `src/hooks/useGatePolicy.ts`, and `src/hooks/useGatePolicyMutation.ts` build and mutate these policies from the frontend.
- Gate permits: `src/screens/GatePermitPage.tsx`, `src/hooks/useGatePermit.ts`, and `src/lib/gatePermitTx.ts` implement player-facing permit acquisition using either free or toll-paid permit transactions.
- TradePost marketplace: `contracts/civilization_control/sources/trade_post.move` defines `TradeAuth`, shared `Listing` objects, `create_listing`, `buy_to_inventory`, and `cancel_listing`. `src/lib/tradePostTx.ts`, `src/hooks/useListings.ts`, `src/hooks/useCreateListing.ts`, `src/hooks/useBuyListing.ts`, and `src/hooks/useCancelListing.ts` wire this to the UI.
- Posture state: `contracts/civilization_control/sources/posture.move` stores per-gate Commercial or Defense posture as a dynamic field on `GateConfig`. `src/lib/postureSwitchTx.ts` builds a broader posture PTB that records posture and can re-authorize turret doctrine.
- Turret doctrine dispatcher: `contracts/civilization_control/sources/turret.move` contains the unified `turret` module required by the game engine's extension lookup and defines `CommercialAuth` and `DefenseAuth` doctrine behavior. `src/screens/TurretListScreen.tsx` and `src/hooks/useAuthorizeExtension.ts` expose rebind/authorization flows.
- Direct power control: `src/lib/structurePowerTx.ts` builds power-control PTBs for supported structures using owner-cap borrow/return. UI surfaces live in gate, trade post, turret, and network node screens.
- Strategic Network Map: topology UI is implemented under `src/components/topology/`, with layout helpers in `src/components/topology/topologyLayout.ts`, map transform hooks in `src/hooks/useMapViewTransform.ts`, and spatial pin persistence in `src/hooks/useSpatialPins.ts` and `src/lib/spatialPins.ts`.
- Signal Feed: `src/lib/eventParser.ts`, `src/lib/suiReader.ts`, `src/lib/signalFolder.ts`, `src/hooks/useSignalFeed.ts`, `src/screens/ActivityFeedScreen.tsx`, and `src/components/SignalEventRow.tsx` implement event querying, parsing, folding, and display.
- Sponsored execution client path: `src/lib/sponsorship.ts` and `src/hooks/useSponsoredExecution.ts` implement a sponsor-worker request path with fallback to wallet-paid execution.
- On-chain DApp URL update flows: `src/hooks/useAuthorizeExtension.ts` and gate/trade post screens include metadata URL setup for gate and SSU DApp surfaces.

Documented as live or validated, but not revalidated in this guide:

- `README.md` claims Stillness-live validation for gate presets, batch deployment, posture switching, trade settlement, offline-seller trade, direct power, topology, 13 event types, DApp URL configuration, and sponsored governance transactions.
- `docs/decision-log.md` records successful Move build/test, typecheck, and build gates for the Stillness migration on 2026-04-01.
- This guide did not run chain transactions or browser smoke tests. Treat live-chain validation claims as documented evidence unless re-run.

Planned, partial, or not currently implemented:

- Subscription passes are described in older strategy/spec documents such as `docs/core/spec.md`, but the archived `docs/archive/hackathon-2026/core/demo-readiness-tranches.md` explicitly says no subscription ledger exists. No current source module implements a subscription pass ledger.
- Network node offline is not implemented in the current UI; `src/screens/NetworkNodeListScreen.tsx` explicitly says offline is not yet implemented.
- The sponsor worker implementation now lives in this repo under `workers/sponsor-service/`. The older `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` file remains historical context for the earlier Flappy-owned setup.
- Turret targeting events emitted during `devInspect` evaluation are diagnostic and not reliable persisted dashboard telemetry. `contracts/civilization_control/sources/turret.move` comments and demo docs warn about this.

## 5. Major user workflows

Connect and discover infrastructure:

1. The app is wrapped by `EveFrontierProvider` in `src/main.tsx`.
2. Wallet state comes from `@evefrontier/dapp-kit` and `@mysten/dapp-kit-react`, with the visible wallet UI in `src/components/WalletControl.tsx`.
3. `src/lib/suiReader.ts` discovers a `PlayerProfile` owned by the wallet, fetches the shared `Character`, finds `OwnerCap` objects owned by the character, then resolves shared structures.
4. `src/hooks/useAssetDiscovery.ts` polls and derives structures, node groups, and overview metrics.
5. `src/App.tsx` provides `CharacterContext` to nested screens.

Gate governance workflow:

1. Operator opens Gates or a gate detail route from `src/screens/GateListScreen.tsx` or `src/screens/GateDetailScreen.tsx`.
2. Gate policy state is loaded from `GateConfig` dynamic fields through `src/lib/suiReader.ts` and `src/hooks/useGatePolicy.ts`.
3. Policy presets are authored as Commercial or Defense configurations and deployed through `src/lib/gatePolicyTx.ts` and `src/hooks/useGatePolicyMutation.ts`.
4. Extension authorization and DApp URL setup are handled through `src/hooks/useAuthorizeExtension.ts`.
5. Players use `/gate/:gateId` in `src/screens/GatePermitPage.tsx` to acquire a permit if the policy allows their tribe and toll state.

TradePost workflow:

1. Operator authorizes `TradeAuth` on an SSU from `src/screens/TradePostListScreen.tsx` or `src/screens/TradePostDetailScreen.tsx`.
2. Operator creates listings from SSU inventory through `src/hooks/useCreateListing.ts` and `src/lib/tradePostTx.ts`.
3. Buyers use `/ssu/:ssuId` in `src/screens/SsuMarketplacePage.tsx` or marketplace UI to buy listings through `src/hooks/useBuyListing.ts`.
4. The current contract target is `buy_to_inventory`, which deposits items into the buyer's owned inventory on the SSU rather than returning a raw item object.
5. Sellers can cancel listings through `src/hooks/useCancelListing.ts`.

Posture and turret doctrine workflow:

1. The operator uses `src/components/PostureControl.tsx` from the Strategic Network surface.
2. `src/lib/postureSwitchTx.ts` records gate posture and can swap turret extension authorization to Commercial or Defense doctrine in the same PTB.
3. `contracts/civilization_control/sources/posture.move` stores the posture audit trail. `contracts/civilization_control/sources/turret.move` defines doctrine behavior.
4. Signal Feed can show posture and authorization events, but it must not claim full live turret combat telemetry unless separately validated.

Power workflow:

1. Structure screens call hooks that use `src/lib/structurePowerTx.ts`.
2. PTBs borrow the relevant `OwnerCap`, call world-contract functions such as gate/turret/storage unit online/offline, then return the cap in the same transaction.
3. Network node online exists in the code path. Network node offline is marked incomplete in UI.

Sponsored/gasless workflow:

1. A hook builds a `Transaction` and calls `useSponsoredExecution`.
2. If `VITE_SPONSOR_URL` is configured, `useSponsoredExecution` builds `TransactionKind` bytes only, calls `requestSponsorship`, asks the wallet to sign the sponsored transaction, then submits player and sponsor signatures together.
3. If sponsorship is missing or fails, the same hook falls back to standard wallet-paid execution.
4. Current permit, listing, policy, posture, power, authorization, and trade hooks route through `useSponsoredExecution`. The committed worker policy now lives in `config/sponsorship/civilizationControlPolicy.ts`, deploy config lives in `workers/sponsor-service/wrangler.toml`, and `npm run sponsor:validate-policy` checks current repo drift. Production is already cut over to the repo-owned worker `civilizationcontrol-sponsor`; the custom-domain CORS fix for `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com` is complete; and the older `flappy-frontier-sponsor` Worker remains rollback-only during soak.

Deployment/demo/test workflow:

- Local app development uses `npm install`, `npm run dev`, `npm run typecheck`, and `npm run build` from `package.json` and `README.md`.
- Move verification uses `sui move build --path contracts/civilization_control` and `sui move test --path contracts/civilization_control` from `README.md` and `docs/core/validation.md`.
- Cloudflare Pages deployment is documented only as a template in `templates/cloudflare/README.md`; this repo has no root Wrangler config.

## 6. Repository map

Top-level map:

- `README.md`: current public overview, Stillness identifiers, setup commands, and claimed validated capabilities.
- `AGENTS.md` and `.github/copilot-instructions.md`: authoritative agent guardrails, repo workflow, deployment policy, and safety rules.
- `GITHUB-COPILOT.md` and `llms.txt`: AI-facing guidance and documentation pointers.
- `package.json` and `package-lock.json`: active frontend dependency and script definitions.
- `vite.config.mts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`: active Vite/TypeScript/static entry configuration.
- `.env.example`: example environment variables. It is partly stale because it labels the world package as Utopia while current runtime constants are Stillness.
- `src/`: active React frontend.
- `contracts/civilization_control/`: active Sui Move package.
- `docs/`: active product, architecture, validation, operations, archive material, and this LLM guide.
- `assets/icons/`: topology glyphs and icon asset guidance.
- `public/`: static hosting files such as `_headers`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, and public assets.
- `scripts/`: active data generation plus a few stale diagnostic scripts. Historical demo-capture scripts live under `docs/archive/hackathon-2026/scripts/`.
- `templates/cloudflare/`: generic Cloudflare Pages/Workers scaffold and deploy instructions.
- `vendor/`: read-only submodules for `world-contracts`, `builder-scaffold`, `builder-documentation`, and `evevault`. Do not modify tracked files inside `vendor/`.

Important frontend paths:

- `src/main.tsx`: React mount, TanStack `QueryClient`, `ErrorBoundary`, `EveFrontierProvider`, global runtime error surfacing.
- `src/App.tsx`: route table, operator shell, `CharacterContext`, dashboard composition.
- `src/screens/`: page-level operator/player screens.
- `src/components/`: shared UI, shell, feedback, topology, metrics, signal rows, wallet control.
- `src/hooks/`: query/mutation hooks for discovery, policies, listings, posture, power, authorization, sponsorship, wallet auto-connect, spatial pins.
- `src/lib/`: Sui reader, transaction builders, sponsorship client, event parser, signal folder, catalogs, currency helpers, spatial helpers.
- `src/types/domain.ts`: domain model for structures, profiles, listings, policies, signals, and transaction feedback.
- `src/data/`: generated/bundled data such as catalogs where present.
- `src/styles/`: Tailwind entry and design tokens.

Important contract paths:

- `contracts/civilization_control/Move.toml`: Move package dependencies and environments.
- `contracts/civilization_control/Published.toml`: Stillness v1 publish and Utopia v6 history.
- `contracts/civilization_control/sources/config.move`: shared `GateConfig` object.
- `contracts/civilization_control/sources/gate_control.move`: gate policies, tolls, permit issuance, treasury, events.
- `contracts/civilization_control/sources/trade_post.move`: SSU listing marketplace and inventory delivery.
- `contracts/civilization_control/sources/posture.move`: per-gate posture state and event.
- `contracts/civilization_control/sources/turret.move`: unified turret extension dispatcher.
- `contracts/civilization_control/tests/`: Move unit/simulation tests. Some files explicitly say end-to-end behavior needs devnet/testnet integration.

Important docs paths:

- `docs/README.md`: documentation index and canonical terminology.
- `docs/decision-log.md`: newest-first decision history. The 2026-04-01 entries are key for Stillness migration.
- `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md`: concrete replacement matrix for current CC browser-side JSON-RPC, polling, static-catalog, and World API reads versus shared-backend replacement or enrichment candidates, plus the recommended first implementation slice.
- `docs/operations/efmap-indexer-awareness-20260428.md`: read-only awareness report for the shared EVE Frontier backend currently source-controlled and operated through the EF-Map repo/runtime, including the confirmed local EF-Map repo at `C:/EF-Map-main` and the reachable `ef-map-vps` runtime.
- `docs/core/validation.md`: validation procedures, but partially stale because it predates current implementation in places.
- `docs/archive/hackathon-2026/README.md`: historical hackathon demo, submission, recording, and evidence bundle.
- `docs/operations/migrate-to-stillness.md`: Stillness migration playbook, useful but time-specific.
- `docs/operations/sponsor-worker-runbook.md`: live sponsor-worker source of truth for current runtime state, validation commands, policy-update flow, and operational guardrails.
- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md`: archived sponsor worker handoff, retained for historical allowlist context and stale-failure evidence.
- `docs/archive/sponsor-worker-20260428/README.md`: archive index for the completed sponsor-worker migration, cutover, validation, and production-fix evidence bundle.
- `docs/strategy/civilization-control/`: product vision, voice, narrative, and future direction.
- `docs/ux/`: UX architecture, topology specs, and polish/audit notes.

Shared Frontier backend summary:

- A shared EVE Frontier data backend exists and is currently implemented and operated through the EF-Map repo/runtime, with the local repo at `C:/EF-Map-main` and the live runtime reachable through `ef-map-vps`.
- EF-Map is the original/current primary consumer and operator of that backend, but it is not the only logical consumer. CivilizationControl and future apps should also treat it as shared infrastructure.
- The active replacement matrix is `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md`, which identifies which current CC reads should stay direct-on-chain and which should move toward shared-backend enrichment.
- Future agents may inspect backend state read-only from the CC workspace when needed, but backend code changes should be made in the backend source repo, currently EF-Map, not by hand-editing the VPS.
- Current integration status is still awareness and planning only. CivilizationControl does not yet consume shared-backend data at runtime.
- Future CC integration should use shaped backend APIs, snapshots, filtered streams, or a CC proxy through provider/client abstractions, not raw DB credentials or direct browser-to-DB access.
- Do not put DB credentials or bearer tokens into `VITE_*`, and avoid broad player or tribe intelligence surfaces. Prefer assembly-ID keyed enrichment after CC has already discovered ownership on-chain.

Future agents should start with `README.md`, `docs/decision-log.md`, `src/constants.ts`, `src/App.tsx`, `src/lib/suiReader.ts`, `src/hooks/useSponsoredExecution.ts`, and the relevant `src/lib/*Tx.ts` or Move module for the requested surface.

## 7. Frontend architecture

Framework and build:

- The app is a Vite SPA using React 19, TypeScript, React Router 7, TanStack Query, Tailwind CSS 4, `@evefrontier/dapp-kit`, `@mysten/dapp-kit-react`, and `@mysten/sui`. Source: `package.json`.
- `package.json` scripts are `dev`, `build`, `typecheck`, `preview`, `generate:solar-systems`, `generate:tribes`, and `generate:types`.
- `vite.config.mts` uses React SWC and Tailwind plugins, aliases `@` to `src`, and ignores `vendor` and `contracts` in dev-server watch.
- `tsconfig.json` is strict, uses bundler resolution, React JSX, and the `@/*` path alias.

Entry points and providers:

- `index.html` mounts `#root` and loads `src/main.tsx`.
- `src/main.tsx` creates a `QueryClient`, wraps the app in `ErrorBoundary`, then `EveFrontierProvider`, then `App`.
- `src/main.tsx` also suppresses known benign Eve Vault/browser extension errors and renders a bottom runtime error strip for unexpected failures, useful in CEF or demo environments without DevTools.

Routing:

- `src/App.tsx` uses `BrowserRouter`, `Routes`, and `Route` from `react-router`.
- Standalone player routes are `/gate`, `/gate/:gateId`, `/ssu`, and `/ssu/:ssuId`. These bypass the operator header/sidebar.
- Operator routes live inside `OperatorShell`: `/`, `/gates`, `/gates/:id`, `/tradeposts`, `/tradeposts/:id`, `/turrets`, `/turrets/:id`, `/nodes`, `/nodes/:id`, `/activity`, and `/settings`.

Data and state flow:

- Server/chain state uses TanStack Query. Examples: `src/hooks/useAssetDiscovery.ts`, `src/hooks/useGatePolicy.ts`, `src/hooks/useListings.ts`, `src/hooks/usePosture.ts`, and `src/hooks/useSignalFeed.ts`.
- Chain read logic is concentrated in `src/lib/suiReader.ts`.
- Transaction builders are focused files such as `src/lib/gatePolicyTx.ts`, `src/lib/gatePermitTx.ts`, `src/lib/tradePostTx.ts`, `src/lib/postureSwitchTx.ts`, `src/lib/structurePowerTx.ts`, and `src/lib/authorizeExtensionTx.ts`.
- Domain types are centralized in `src/types/domain.ts`.
- Local UI persistence exists for spatial pins and map view preferences through `src/hooks/useSpatialPins.ts`, `src/lib/spatialPins.ts`, and topology map code.

Styling and UI:

- `src/styles/index.css` imports Tailwind and theme tokens.
- `src/styles/theme.css` defines dark-first design tokens and topology colors.
- Topology glyphs live in `src/components/topology/Glyphs.tsx` and are backed by asset rules in `assets/icons/README.md`.
- Current UI leans utilitarian and dense: fixed header/sidebar, compact tables, status badges, topology map, telemetry feed, and action panels.

Wallet/auth UI:

- `src/components/WalletControl.tsx` combines Mysten `ConnectButton` and EVE `useConnection` address/disconnect state.
- `src/hooks/useAutoConnect.ts` is used by standalone player pages for Eve Vault auto-connect behavior.
- There is no backend login session in this repo. Identity is derived from wallet connection and on-chain EVE Frontier character/profile objects.

## 8. On-chain / Sui / EVE Frontier integration

Current environment and IDs:

- `src/constants.ts` is the source of active frontend IDs.
- Current local and production `WORLD_RUNTIME_PACKAGE_ID`: `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780`.
- Current local `WORLD_ORIGINAL_PACKAGE_ID`: `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`.
- Upstream `vendor/world-contracts` now records Stillness world v2 with `published-at` `0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780` and original/type-origin ID `0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c`. Do not migrate runtime calls without splitting latest/runtime IDs from original/type-origin IDs.
- `docs/operations/mvr-world-package-audit-20260429.md` is the planning source of truth for `@evefrontier/world` / MVR adoption.
- `docs/operations/world-runtime-original-split-20260429.md` records the implemented Phase 2 split between world runtime targets and original/type-origin surfaces.
- `docs/operations/world-v2-runtime-migration-plan-20260429.md` is the planning record for the World v2 migration that has now been merged and deployed.
- Phase 1 automation now exists at `scripts/check-world-mvr-drift.mjs` with baseline data in `config/chain/worldMvrBaseline.json`.
- Run `npm run world:mvr:check` before package/runtime work. Scheduled CI now runs `.github/workflows/world-package-drift.yml`, which calls `npm run world:mvr:ci`.
- The GitHub Actions workflow requires recursive submodule checkout because the drift checker reads required vendored metadata from `vendor/world-contracts/contracts/world/Published.toml`; if that file is missing, the script now raises `MISSING_REQUIRED_FILE` with CI and local remediation guidance.
- Known Stillness v1-versus-v2 drift is now resolved on `master`: runtime config targets World v2, `WORLD_ORIGINAL_PACKAGE_ID` remains pinned to `0x28b497...`, sponsor policy and worker config accept both world runtimes during soak, and `npm run world:mvr:strict` now passes.
- `WORLD_PACKAGE_ID` remains only as a compatibility alias to `WORLD_RUNTIME_PACKAGE_ID`; new code should choose runtime versus original explicitly.
- Future agents must not blindly replace world runtime/original constants, sponsor allowlists, or Move dependencies with `@evefrontier/world` / `0xd2fd...`. Follow the phased strategy in `docs/operations/mvr-world-package-audit-20260429.md` instead.
- Future agents must change runtime targets and original/type-origin surfaces separately. Runtime entrypoints and sponsor allowlists follow `WORLD_RUNTIME_PACKAGE_ID`; type strings, exact event types, `StructType` filters, and deterministic type tags follow `WORLD_ORIGINAL_PACKAGE_ID`.
- Production frontend is now cut over: `master` was merged and pushed, the production Pages environment on branch `main` was redeployed from commit `ebc052d91d93ef545a95f7decf81de49a3740721`, the served production asset contains World v2 runtime plus the preserved original/type-origin package, and manual production smoke is now operator-confirmed with sponsor-wallet payment observed, no fallback-to-player-paid observed, and no recorded digest.
- Current `CC_PACKAGE_ID`: `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021`.
- Current `CC_ORIGINAL_PACKAGE_ID`: same as `CC_PACKAGE_ID` because Stillness is a fresh v1 publish.
- Current shared `GATE_CONFIG_ID`: `0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e`.
- Current `ENERGY_CONFIG_ID`: `0xd77693d0df5656d68b1b833e2a23cc81eb3875d8d767e7bd249adde82bdbc952`.
- Current Stillness EVE assets package: `0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60`.
- `contracts/civilization_control/Published.toml` records Stillness v1 plus Utopia v6 history.
- `contracts/civilization_control/Move.toml` maps `testnet_internal`, `testnet_utopia`, and `testnet_stillness` to the same chain ID `4c78adac`. Do not use chain ID alone to distinguish Utopia from Stillness.

Move package structure:

- `config.move` creates and shares `GateConfig`, whose UID hosts policy, treasury, and posture dynamic fields.
- `gate_control.move` defines gate policy storage, treasury, permit issuance, toll handling in `Coin<EVE>`, `GateAuth`, and events.
- `trade_post.move` defines `TradeAuth`, shared listings, listing create/buy/cancel flow, and `buy_to_inventory` for correct SSU inventory delivery.
- `posture.move` records Commercial or Defense posture per gate.
- `turret.move` is the unified extension dispatcher. The module name `turret` is intentional because the game engine resolves that module name.
- Legacy/parallel turret modules and shared turret events also exist; inspect `contracts/civilization_control/sources/` before changing turret behavior.

Transaction-building patterns:

- Frontend PTBs use `Transaction` from `@mysten/sui/transactions`, not deprecated Sui SDK imports.
- Owner operations borrow and return `OwnerCap` in the same PTB through world-contract character functions. This pattern appears in `src/lib/gatePolicyTx.ts`, `src/lib/postureSwitchTx.ts`, and `src/lib/structurePowerTx.ts`.
- Gate toll and trade purchases split/use player `Coin<EVE>` objects, not SUI gas coins, and route payment to treasury/seller addresses.
- Extension authorization targets world-contract `authorize_extension` functions using `GateAuth`, `TradeAuth`, `CommercialAuth`, or `DefenseAuth` type arguments.

Read/query/event patterns:

- `src/lib/suiReader.ts` creates a `SuiJsonRpcClient` for `https://fullnode.testnet.sui.io:443` and network `testnet`.
- Asset discovery uses owned-object queries and shared object reads, not a backend indexer.
- Gate policy and posture read dynamic fields from `GateConfig` using type-origin key types built from `CC_ORIGINAL_PACKAGE_ID`.
- Listing discovery uses event queries and then verifies live listing objects.
- Signal Feed fetches recent events with `MoveModule` queries across current CC/world runtime modules, then parses type strings in `src/lib/eventParser.ts`.
- Important upgrade rule: on Sui, event type strings and dynamic field key types use type-origin package IDs, while `MoveModule` query filters should use the runtime package that emitted via the entry module. On Stillness v1 `CC_PACKAGE_ID` equals `CC_ORIGINAL_PACKAGE_ID`, which hides this distinction. Future upgrades must preserve it.

Ownership and authority assumptions:

- CivilizationControl uses EVE Frontier owner-capability authority. Management actions require the operator's `OwnerCap` for the specific structure.
- There is no centralized admin key for normal operator governance in current app flows.
- `vendor/world-contracts` is canonical for world-contract signatures. Always verify function signatures there before changing PTB builders or Move calls.

Environment differences:

- Utopia was the iterative hackathon environment; Stillness is the current fresh v1 production/testnet target in `README.md`, `src/constants.ts`, and `Published.toml`.
- Several root fixtures and scripts remain Utopia-era or mixed. Examples include `gate_obj.json`, `playerprofile.json`, `wallet_objects.txt`, `scripts/test-sponsor.mjs`, and `scripts/test-turret-targeting.mjs`.
- `src/lib/tribeCatalog.ts` still contains a stale Utopia comment, while `scripts/fetch-tribes.mjs` and current constants are Stillness-oriented.

## 9. Sponsorship / gas abstraction

Sponsorship is present on the frontend path, and the current worker implementation now lives in this repo under `workers/sponsor-service/`.

Frontend implementation:

- `src/lib/sponsorship.ts` reads `VITE_SPONSOR_URL` and optional `VITE_SPONSOR_API_KEY` from Vite env.
- `requestSponsorship` POSTs to `${VITE_SPONSOR_URL}/sponsor` with `txKindB64` and `sender`.
- `src/hooks/useSponsoredExecution.ts` centralizes execution. It builds `TransactionKind` bytes, requests sponsorship, asks the wallet to sign the sponsored transaction, submits dual signatures, and falls back to standard wallet execution if sponsorship is unavailable or rejected.
- Current hooks for gate permits, listing creation, listing purchase, listing cancellation, policy, posture, power, authorization, and transit proof use `useSponsoredExecution`.

Worker/server-side model:

- `workers/sponsor-service/src/index.ts` implements the Worker handler and returns `{ txB64, sponsorSignature }`.
- `workers/sponsor-service/src/validation.ts` enforces command-kind allowlists, cross-app rejection, and `GasCoin` blocking.
- `config/chain/stillness.ts` and `config/sponsorship/civilizationControlPolicy.ts` are the committed Stillness/policy references checked by `scripts/validate-sponsor-policy.mjs`.
- `docs/operations/sponsor-worker-runbook.md` is the live operational guide.
- The worker is no longer externalized to Flappy Frontier; source, committed config, and policy now live in this repo.
- Production currently uses `civilizationcontrol-sponsor`, and the custom-domain CORS fix for `https://civilizationcontrol.com` and `https://www.civilizationcontrol.com` is complete.
- The old `flappy-frontier-sponsor` Worker remains deployed only as rollback during soak.
- The shared worker currently allows both world runtime package IDs so production can soak on the World v2 runtime bundle without removing old-runtime sponsorship support yet.
- The local untracked `.env` still pointed at `flappy-frontier-sponsor` during this experiment, so both the preview and production cutover builds used an explicit `VITE_SPONSOR_URL=https://civilizationcontrol-sponsor.michael-davis-home.workers.dev` override instead of relying on local env state.
- Public HTML verification confirms `https://civilizationcontrol.com` and `https://civilizationcontrol.pages.dev` now serve `index-MUH2Qmi3.js`, whose asset content contains the World v2 runtime constant, the preserved original/type-origin package, and `civilizationcontrol-sponsor` with no `flappy-frontier-sponsor` string.
- If future agents need historical execution evidence for the migration, preview cutover, production cutover, or production CORS fix, start from `docs/archive/sponsor-worker-20260428/README.md`.
- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` remains historical evidence of the earlier external-worker setup and the stale-allowlist failure mode.

Operations and limits:

- Sponsorship is optional. If `VITE_SPONSOR_URL` is unset or the worker fails, users pay gas normally through the connected wallet.
- `VITE_SPONSOR_API_KEY` is optional in current client code. If a real worker requires auth, configure it via environment without committing secrets.
- Value-transfer actions involving `Coin<EVE>` can still be sponsored for gas because the player signs and authorizes their EVE coin. The sponsor contributes gas only.
- The in-repo worker policy and validation suite exist in this repo, and production sponsor-paid behavior is manually confirmed by sponsor-wallet observation. Transcript-grade digest evidence is still missing for the production smoke, so future claims should avoid inventing a digest.

## 10. Authentication/session/wallet model

CivilizationControl has no conventional backend auth session. The app uses wallet connection plus EVE Frontier on-chain identity.

Model:

- `src/main.tsx` wraps the app in `EveFrontierProvider` with a TanStack Query client.
- `src/components/WalletControl.tsx` displays wallet connect/disconnect state.
- `src/hooks/useAutoConnect.ts` supports standalone player pages that should auto-connect when Eve Vault is available.
- `src/lib/suiReader.ts` resolves wallet address to `PlayerProfile`, then `Character`, then character-owned `OwnerCap` objects.
- `src/App.tsx` stores the resolved character ID in `CharacterContext` for nested hooks.

Identity assumptions:

- A connected wallet is expected to own an EVE Frontier `PlayerProfile`.
- The profile points to a shared `Character`.
- The character owns `OwnerCap` objects for structures the operator controls.
- Structure management is authorized by the relevant `OwnerCap`, not by a centralized CivilizationControl admin account.

Connected/disconnected UI behavior:

- If disconnected, the operator shell can render empty discovery states and prompts to connect.
- If connected but no profile or caps are found, discovery returns no structures and the sidebar/list screens render empty states.
- Standalone gate/SSU pages use route parameters and wallet state to resolve player-specific action eligibility.

Preview/production and in-game caveats:

- Demo/recording docs in `docs/decision-log.md` note wallet persistence limitations across browser relaunches.
- `docs/architecture/in-game-dapp-surface.md` documents constraints in the EVE in-game Chromium surface and historically describes it as read-only/no-wallet by default. Current code includes player-facing auto-connect pages, but actual in-game wallet behavior should be validated before claiming full in-game buying or signing.

## 11. Environment and configuration

Runtime constants:

- Active package/object IDs are hardcoded in `src/constants.ts`, not loaded from `.env.example`.
- Future agents must not assume `.env.example` is authoritative for world/package IDs. It still labels a Utopia world package, while current code uses Stillness IDs.
- `contracts/civilization_control/Published.toml` is the Move publish record and should be checked before changing package ID logic.

Environment variables:

- `.env.example` lists `VITE_EVE_WORLD_PACKAGE_ID`, `VITE_SUI_GRAPHQL_ENDPOINT`, `VITE_SPONSOR_URL`, and `VITE_SPONSOR_API_KEY`.
- In current source, only sponsor env variables are actively consumed by `src/lib/sponsorship.ts`.
- `VITE_SPONSOR_URL` enables sponsorship.
- `VITE_SPONSOR_API_KEY` adds a bearer token if configured.
- Do not commit real secrets or private keys. Keep API keys in local or Cloudflare environment configuration.

Cloudflare/static hosting:

- There is no root `wrangler.toml`, `wrangler.json`, or `wrangler.jsonc` for the active app.
- `templates/cloudflare/wrangler.example.jsonc` is a generic template with `pages_build_output_dir` set to `dist`.
- `templates/cloudflare/README.md` documents `wrangler pages deploy dist --project-name <project> --branch <branch>`.
- `public/_headers` sets static security headers.
- `public/robots.txt`, `public/sitemap.xml`, and `public/site.webmanifest` contain public hosting metadata.

Preview/production differences:

- `docs/decision-log.md` records a production deploy pitfall: Cloudflare Pages production branch is `main`, so deploying with `--branch master` created Preview deployments only. Production deploys must use `--branch main` for the `civilizationcontrol` Pages project.
- Feature branches should deploy to previews only. Do not production deploy from feature branches.

## 12. Build, test, validation, and deploy commands

Actual root npm scripts from `package.json`:

- Install dependencies: `npm install`.
- Dev server: `npm run dev`.
- TypeScript check: `npm run typecheck`.
- Production build: `npm run build`.
- Local production preview: `npm run preview`.
- Generate solar systems: `npm run generate:solar-systems`.
- Generate tribes: `npm run generate:tribes`.
- Generate item types: `npm run generate:types`.

There is no root `npm run lint` or `npm test` script in `package.json`.

Move commands documented in `README.md`, `.github/copilot-instructions.md`, and `docs/core/validation.md`:

- Build Move package: `sui move build --path contracts/civilization_control`.
- Run Move tests: `sui move test --path contracts/civilization_control`.
- Verify Sui environment: `sui client active-env`.
- Publish to active network: `sui client publish --path contracts/civilization_control`.
- Dry-run publish, documented in validation: `sui client publish --path contracts/civilization_control --dry-run`.

Cloudflare deploy commands are documented only in `templates/cloudflare/README.md`:

- Preview deploy pattern: build, then `wrangler pages deploy dist --project-name <project> --branch <feature-branch>`.
- Production deploy pattern: build, then `wrangler pages deploy dist --project-name <project> --branch main`.
- This guide creation did not run deploy commands.

Smoke/diagnostic scripts:

- Historical recording and capture scripts now live under `docs/archive/hackathon-2026/scripts/` and should not be treated as current validation commands.
- `scripts/test-sponsor.mjs` and `scripts/test-turret-targeting.mjs` contain stale Utopia-era IDs and should not be trusted without refresh.

Markdown validation:

- No markdown lint/format script is defined in `package.json`. Use manual review unless a future script is added.

## 13. Known risks, gaps, and unverified assumptions

Stale or conflicting docs:

- `docs/core/validation.md` is explicitly marked pre-hackathon/provisional and partially stale. It remains useful for validation patterns, not as current implementation truth.
- `.env.example` labels a Utopia world package, while `src/constants.ts` and `README.md` use Stillness IDs.
- `docs/archive/superseded/sponsor-worker/stillness-sponsor-worker-handoff.md` contains a section saying several hooks still need rerouting through sponsorship, but current hooks such as `src/hooks/useGatePermit.ts`, `src/hooks/useBuyListing.ts`, `src/hooks/useCreateListing.ts`, and `src/hooks/useCancelListing.ts` already use `useSponsoredExecution`.
- `docs/operations/migrate-to-stillness.md` records a point-in-time migration state, including limited gate availability, while `README.md` later claims Stillness-live gate validation. Treat the README as newer but revalidate on-chain before using the claim externally.
- Root fixtures and diagnostic scripts include Utopia-era or mixed IDs: `gate_obj.json`, `playerprofile.json`, `wallet_objects.txt`, `scripts/test-sponsor.mjs`, and `scripts/test-turret-targeting.mjs`.

On-chain and environment risks:

- Stillness and Utopia share the same Sui testnet chain ID `4c78adac`; world/package IDs distinguish them.
- Future package upgrades can reintroduce type-origin vs runtime-package bugs. Use `CC_ORIGINAL_PACKAGE_ID` for type strings and dynamic field key types, and current `CC_PACKAGE_ID` for runtime MoveCall targets and MoveModule filters.
- Sponsor worker policy drift can still happen, but the committed worker package, policy config, and validation script now live in this repo so the risk is localised to one codebase.
- Move unit tests include notes that some end-to-end behavior needs devnet/testnet integration, especially permit issuance and trade buy settlement.

Auth/session risks:

- The app assumes the wallet has an EVE Frontier `PlayerProfile`. Empty states should not be mistaken for broken discovery without checking wallet/profile state.
- In-game browser wallet behavior remains environment-dependent. Validate actual Eve Vault behavior before claiming in-game signing, purchases, or gasless transactions.

UX/product risks:

- Fixed sidebar layout in `src/App.tsx` may not satisfy narrow in-game viewport guidance from `docs/ux/civilizationcontrol-ux-architecture-spec.md`.
- Optional map stars in `src/components/topology/StrategicMapPanel.tsx` conflict with one polish brief that advises no star fields in topology.
- Some empty states use generic wording instead of the canonical voice guide examples.
- Signal/event badges may become dense at large fleet scale; `docs/ux/strategic-network-map-implementation-audit.md` flags overlay-density questions.

Validation gaps for this guide:

- This guide was created by code/docs inspection, not by running frontend build, Move tests, chain transactions, browser smoke tests, or Cloudflare deploys.
- README's “on-chain, live” claims were not independently revalidated during guide creation.
- Sponsor worker allowlist and deployed worker behavior were not tested.

## 14. Agent operating rules for future work

Follow these repo-specific rules before making changes:

- Use a feature branch for non-trivial work. Do not merge to `master` or production-deploy from a feature branch.
- Inspect current code before trusting older docs. Runtime code and current config beat stale planning docs.
- Never modify tracked files inside `vendor/*`. Read submodules for reference only.
- Do not discard user work. If the tree is dirty, inspect and preserve safely before continuing.
- For expensive/high-context tasks, do not hard-stop on recoverable setup issues. Inspect, preserve, ask only if preservation is unsafe, then continue.
- Do not change Move contract entry points, public signatures, package IDs, schema/data shapes, or global state patterns without treating the work as high risk.
- Verify world-contract signatures in `vendor/world-contracts` before changing PTB builders.
- Keep type-origin and runtime-package IDs separate in Sui event, dynamic field, and MoveModule query logic.
- Use `useSponsoredExecution` for transaction hooks that should support gas sponsorship and fallback.
- Keep UI language aligned with command-layer doctrine in `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md`.
- Be honest about validation. Browser automation, build success, and chain proof each prove different things; do not claim manual UI or live-chain behavior unless actually checked.
- For UI changes, use preview deploys for feature branches. Production deploys only from main/production branch protocol, and for this Cloudflare project production deploys must use `--branch main`.
- Update tracked docs when behavior, public workflow, environment IDs, validation status, or deployment process changes. Avoid untracked scratch docs.
- Preserve the existing product direction unless explicitly instructed to redesign it.

## 15. Fast-start briefing for a new LLM

CivilizationControl is an EVE Frontier governance command layer: a React/Vite/Tailwind browser app plus a Sui Move extension package that lets infrastructure owners govern gates, SSUs, turrets, and network nodes without hand-building Sui transactions. The active app code is in `src/`, contracts are in `contracts/civilization_control/`, product/architecture docs are in `docs/`, Cloudflare templates are in `templates/cloudflare/`, and upstream references are read-only submodules in `vendor/`. Current runtime target is Stillness testnet. Active IDs live in `src/constants.ts`; `README.md` and `contracts/civilization_control/Published.toml` record the Stillness v1 package `0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021` and shared `GateConfig` `0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e`.

The main source truth is code, not older planning docs. The app discovers wallet-owned infrastructure through `src/lib/suiReader.ts`: wallet to PlayerProfile to Character to OwnerCaps to shared structures. `src/App.tsx` defines player routes `/gate/:gateId` and `/ssu/:ssuId` plus operator routes for Command Overview, Gates, TradePosts, Turrets, Network Nodes, Signal Feed, and Configuration. Chain reads use TanStack Query hooks; writes use focused PTB builders in `src/lib/*Tx.ts`. Sponsorship is centralized in `src/hooks/useSponsoredExecution.ts` and `src/lib/sponsorship.ts`, with `VITE_SPONSOR_URL` enabling a worker-based gas path and fallback to wallet-paid execution. The worker package, its Stillness policy config, and the policy validator now live in this repo.

Implemented Move modules include `config.move` for shared `GateConfig`, `gate_control.move` for policy presets/tolls/permits/treasury, `trade_post.move` for SSU listings and `buy_to_inventory`, `posture.move` for Commercial/Defense posture state, and `turret.move` for the unified turret doctrine dispatcher. Current UI surfaces include gate governance, player permit acquisition, trade post marketplace/listings, posture switching with turret rebinding, power controls, topology map, and Signal Feed. Treat subscription passes, network node offline, some in-game wallet claims, sponsor worker status, and live Stillness validation claims as requiring revalidation. Beware stale Utopia references in `.env.example`, root fixtures, and some scripts. For future work, preserve command-layer UX language, verify Sui/world-contract signatures before changing PTBs, keep type-origin IDs separate from runtime package IDs, avoid modifying `vendor/`, and run relevant gates before committing.