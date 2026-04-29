# EF-Map Indexer Awareness — 2026-04-28

> Archived historical document. Preserved for initial shared-backend discovery and VPS inventory context. Current shared-backend guidance lives in `docs/operations/shared-backend-assembly-enrichment-20260429.md` and `docs/llm-reference-guide.md`.

## 1. Executive summary

A shared EVE Frontier data backend already exists. It is currently source-controlled and operated through the EF-Map repo/runtime, with the local checkout found at `C:/EF-Map-main`, the browser app under `C:/EF-Map-main/eve-frontier-map`, and the live runtime reachable through the `ef-map-vps` SSH alias on the VPS under `/opt/ef-map`.

This shared backend runtime is not just a static map app. It includes a Dockerized Postgres-backed Sui indexer, a Sui event emitter, enrichment jobs, a snapshot exporter, assembly and SSU APIs, a Worker layer, and a realtime universe-events worker. The normalized Postgres tables inspected during this task were populated and current: `ef_sui.raw_events` had 5,310,234 rows, `ef_sui.activity_log` had 653,664 rows, `ef_sui.assemblies` had 53,945 rows, and both `raw_events` and `activity_log` were current through checkpoint `331021283` at `2026-04-28 21:39:55.546+00`.

This matters to CivilizationControl because the current app still does most discovery and event work directly in the browser through Sui JSON-RPC and fixed module polling, while the shared backend already appears to hold richer structure, ownership, type, tribe, inventory, and recent-event data. EF-Map is the original and current primary consumer of that backend, but CivilizationControl and future apps should also treat it as shared infrastructure available through safe shaped APIs, snapshots, and filtered streams.

The important boundary is architectural, not technical: CivilizationControl should not connect its browser directly to the shared backend's Postgres database or internal bearer-protected service hostnames. The backend is currently implemented and operated through the EF-Map repo/runtime, and any later CivilizationControl integration should consume a shaped shared-backend Worker/API/snapshot surface, or a thin CC proxy, through a provider/client abstraction.

The most likely next step is not direct app wiring. It is to prove one small read-only data contract for CC on the shared backend, most likely a structure-summary or network-node-summary endpoint currently to be implemented in the EF-Map repo/runtime and keyed by structure IDs or system IDs rather than by raw DB access.

### Update: replacement analysis added

The follow-on read-path replacement analysis now lives in `docs/operations/cc-read-path-to-efmap-indexer-replacement-plan-20260428.md`.

That document maps current CivilizationControl browser-side JSON-RPC, polling, static-catalog, and World API reads against shared-backend replacement or enrichment candidates, and recommends the safest first slice.

Current status is still planning and awareness only. No EF-Map integration has been implemented in CivilizationControl yet.

## Shared backend ownership model

The runtime infrastructure discovered in this task is a shared EVE Frontier backend: the VPS, Postgres store, Sui indexer containers, Cloudflare tunnels, event emitter, internal APIs, snapshot exporters, and realtime worker all form one backend stack that can serve multiple apps.

Today, that backend is mostly source-controlled through the EF-Map repo because the backend grew out of EF-Map's needs and operational workflows. That means the current backend source of truth for indexer code, Worker/API routes, event emission, snapshot export, deploy docs, and VPS operational knowledge lives in `C:/EF-Map-main` and its deployed runtime under `/opt/ef-map`.

That does not mean EF-Map is the only conceptual owner of the data. The better mental model is:

- shared backend runtime and data plane
- EF-Map as the original/current primary consumer and operator
- CivilizationControl as another consumer
- future Frontier apps as additional consumers

Practical implications:

- backend runtime knowledge can be inspected read-only from the CivilizationControl workspace when needed
- additive backend endpoints for CivilizationControl should be committed to the backend source repo, currently EF-Map, rather than hand-edited on the VPS
- the VPS should be treated as deployed infrastructure, not as the place where product behavior is manually patched
- multiple apps should share one backend where possible so event/history/type/universe truth stays consistent and duplicate indexers are avoided

## 2. Local repo discovery

### Confirmed local paths

- EF-Map root repo: `C:/EF-Map-main`
- EF-Map frontend/app: `C:/EF-Map-main/eve-frontier-map`

### Local repo state

- The EF-Map checkout was on `main...origin/main [ahead 1]` during inspection.
- The worktree was otherwise clean in the local read-only check.
- The repo contains a large amount of temporary SQL, JSON, and diagnostic artifacts in the root. Those files are useful for operator debugging but make the repo noisier than a narrowly-scoped app repo.

### Relevant code and docs discovered

| Area | Paths | Notes |
|---|---|---|
| Frontend app | `eve-frontier-map/`, `eve-frontier-map/_worker.js` | Browser app plus the main Worker bridge |
| Main Worker | `worker.js`, `eve-frontier-map/_worker.js` | Handles public and protected `/api/*` routes |
| Sui indexer/runtime | `tools/ef-sui-indexer/`, `tools/pg-indexer/` | Containerized Postgres/indexer path |
| Event emitter | `tools/event-emitter/sui_event_emitter.js` | Polls Postgres and emits live Sui events |
| World API ingestion | `tools/worldapi-pipeline/`, `tools/worldapi-cron/` | Pulls type, tribe, and related enrichment data |
| Snapshot/export | `tools/snapshot-exporter/` | Publishes compact snapshots to KV |
| Assembly API | `tools/assembly-api/` | FastAPI read wrapper over indexed structure data |
| SSU API | `tools/ssu-api/` | Separate SSU/item-type/search service |
| Realtime events | `workers/universe-events/` | Durable Object/WebSocket event surface |
| VPS helpers | `tools/vps/open-tunnel.ps1`, `tools/vps/backup-postgres-r2.sh` | Confirms VPS and Postgres operational patterns |
| Architecture/docs | `README.md`, `docs/LLM_TROUBLESHOOTING_GUIDE.md`, `docs/primordium-indexer.md`, `docs/THIRD_PARTY_API_ACCESS.md`, `docs/ASSEMBLY_API_DOCKER_SETUP.md`, `docs/SSU_API_SEPARATION.md`, `docs/CLI_WORKFLOWS.md` | Primary repo-grounded documentation |

### Repo-grounded architecture summary

- EF-Map treats Postgres as the primary live data store for indexed/exported reads.
- Cloudflare KV and R2 are derived distribution layers for snapshots, shares, usage data, and large static assets.
- The current live direction is Sui-era indexing and export; older D1/local-indexer/EVM-era paths are still present as history or compatibility residue.
- The frontend consumes a mix of public static assets, Worker routes, and protected Worker-mediated backends.

### Caveats from local repo inspection

- Not every checked-in path is current production truth; some folders and scripts are clearly legacy or compatibility residue.
- The repo still contains historical D1/local-indexer schemas and older event-emitter/exporter variants, so any implementation work should prefer the Sui-era paths over older EVM-era files.
- The repo's public/static data story is stronger than its public cross-origin API story. Several richer routes exist, but they are currently Worker-protected or internal-service-only.

## 3. VPS/indexer runtime discovery

### SSH availability and inspection method

- Local SSH config existed and exposed a likely EF-Map host alias: `ef-map-vps`.
- VPS inspection was completed through read-only `ssh` commands only.
- All remote commands used in this task were classified as read-only safe before execution:
  - host identity and time checks
  - `docker ps`
  - bounded `docker logs --tail`
  - directory listing under likely deploy roots
  - container-local `psql` schema and metadata queries
- No services were restarted.
- No files were edited.
- No migrations or writes were run.
- No secrets, keys, or connection strings were copied into this doc.

### Confirmed VPS runtime layout

- Host reachable through `ef-map-vps`
- Runtime path found: `/opt/ef-map`
- DB/runtime model: Dockerized services with a local Postgres container

### Services and containers found

| Service/container | Observed status | Relevance |
|---|---|---|
| `pg-indexer-reader-postgres-1` | Up | Core Postgres store |
| `ef-sui-indexer` | Up | Main Sui indexer |
| `ef-sui-event-emitter` | Up (healthy) | Emits live event updates from indexed data |
| `ef-sui-enrichment` | Up (healthy) | Sui-era enrichment service |
| `worldapi-cron-snapshot-exporter-1` | Up (healthy) | Exports snapshots to KV |
| `worldapi-cron-worldapi-cron-tribes-1` | Up (healthy) | Tribe ingestion |
| `worldapi-cron-worldapi-cron-tribes-details-1` | Up (healthy) | Tribe detail enrichment |
| `worldapi-cron-worldapi-cron-tribe-members-1` | Up (healthy) | Tribe member enrichment |
| `worldapi-cron-worldapi-cron-daily-1` | Up (healthy) | Daily type/world refresh |
| `worldapi-cron-worldapi-cron-ships-1` | Up (healthy) | Ship-related enrichment |
| `ef-assembly-api` | Up (healthy) | Assembly detail API |
| `ef-ssu-api` | Up (healthy) | SSU/item search API |
| `intel-api` | Up | Intel service |
| `intel-refresh` | Up (unhealthy) | Refresh pipeline exists but had health issues during inspection |
| `ef-grafana` | Up | Dashboard/ops surface |
| Cloudflared sidecars | Up / mixed | External routing/tunnel components |

### Runtime health observations

- `ef-sui-indexer` logs showed active sequential watermark updates every few seconds, with checkpoints advancing into the `331021xxx` range during inspection.
- `ef-sui-event-emitter` logs showed active event emission activity during inspection.
- `worldapi-cron-snapshot-exporter-1` completed its scheduled run successfully while inspected.
- The snapshot exporter logs also showed that one specific gate snapshot path was currently empty: `smart_gate_links_v1` wrote `0` links and `gate_access_snapshot_v1` wrote `0` rules during the sampled run.

### Database type and live schema summary

- Database type: Postgres
- Access method used: container-local `psql` inside `pg-indexer-reader-postgres-1`
- The live data model includes normalized schemas such as:
  - `ef_sui`
  - `world_api_dlt`
  - `world_api_dlt_staging`
  - `public`
- `pg_stat_user_tables` also showed many hex/package-address schemas produced by the lower-level indexer stack. Those appear to hold raw/store-indexed world data across multiple package or world revisions. They are useful for EF-Map internals but are not a good default direct-consumption surface for CivilizationControl.

### Safe live row counts captured

| Table | Row count | Notes |
|---|---|---|
| `ef_sui.assemblies` | 53,945 | Indexed structure/object inventory |
| `ef_sui.assembly_owners` | 41,771 | Ownership/cap mapping surface exists and is populated |
| `ef_sui.characters` | 11,049 | Character enrichment exists |
| `ef_sui.inventory_items` | 66,789 | Inventory/item quantities exist |
| `ef_sui.raw_events` | 5,310,234 | Full raw event history is substantial |
| `ef_sui.activity_log` | 653,664 | Server-side normalized activity feed exists |
| `world_api_dlt.type` | 392 | Type catalog/enrichment |
| `world_api_dlt.tribe` | 243 | Tribe enrichment |

### Freshness checks captured

- `ef_sui.raw_events.max(checkpoint_seq)` = `331021283`
- `ef_sui.raw_events.max(timestamp)` = `2026-04-28 21:39:55.546+00`
- `ef_sui.activity_log.max(checkpoint_seq)` = `331021283`
- `ef_sui.activity_log.max(timestamp)` = `2026-04-28 21:39:55.546+00`

### Recent 24-hour activity sample

The top sampled `activity_log` event families during the last 24 hours were:

- `item_minted` — 2,077 rows
- `item_burned` — 941 rows
- `structure_offline` — 872 rows
- `structure_online` — 662 rows
- `energy_reserved` — 604 rows
- `energy_released` — 362 rows
- `owner_cap_created` — 352 rows
- `structure_anchored` — 320 rows
- `metadata_changed` — 315 rows
- `assembly_created` — 219 rows

### Assembly coverage notes

- `ef_sui.assemblies` includes live columns for `assembly_id`, `type_id`, `assembly_type`, `name`, `solar_system_id`, `status`, `fuel_amount`, `last_updated`, `owner_cap_id`, `url`, `energy_source_id`, and location fields (`x`, `y`, `z`, `location_source`, `location_hash`).
- Assembly-type distribution at sample time:
  - `assembly` — 26,461
  - blank/unknown `assembly_type` — 12,151
  - `turret` — 6,048
  - `network_node` — 5,679
  - `storage_unit` — 3,558
  - `gate` — 48
- Coverage sample across all `assemblies` rows:
  - with `solar_system_id` — 830
  - with `energy_source_id` — 29,674
  - with `owner_cap_id` — 41,794
  - with `url` — 507

This means the indexer clearly has useful energy/ownership coverage, but location/system coverage is currently incomplete and should be treated as an enrichment layer rather than a guaranteed field.

### What was not verified remotely

- Full API auth and CORS behavior from a remote browser origin was not re-tested live in this task.
- No full-table dumps were taken.
- Ownership/character tables were not sampled row-by-row because the goal was bounded structural awareness, not private data extraction.
- Not every package-address schema was exhaustively classified.

## 4. Data inventory

| Data category | Where it exists | Freshness / coverage | Likely usefulness for CivilizationControl | Access surface |
|---|---|---|---|---|
| Live/recent events | `ef_sui.raw_events`, `ef_sui.activity_log`, `ef-sui-event-emitter`, `workers/universe-events/` | Live at checkpoint `331021283` and current to `2026-04-28 21:39:55+00` | Strong candidate for `Recent Signals`, node/structure event history, and reduced browser polling | Internal DB, internal event emitter, Worker/WebSocket path |
| Smart assemblies / structure status | `ef_sui.assemblies`, assembly API, structure snapshot tooling | 53,945 rows; live `last_updated` values; type/status/fuel/url/energy fields present | Strong candidate for network-node detail, structure status, topology enrichment, and operator inventory | Protected Worker/API, internal DB, snapshots |
| Structure ownership / cap relationships | `ef_sui.assembly_owners`, `owner_cap_id` in `assemblies`, `ef_sui.characters` | Populated; 41,771 owner rows and 11,049 character rows | Valuable for ownership-aware inventory and tribe/operator enrichment, but privacy-sensitive | Internal DB / filtered API only |
| Inventory / item quantities | `ef_sui.inventory_items` | 66,789 rows | Useful for TradePost, industry readiness, SSU summaries, and downstream economic views | Internal DB, SSU API, possible filtered API |
| Type taxonomy / labels / categories | `world_api_dlt.type` | 392 rows; includes `id`, `name`, `description`, `group_name`, `category_name`, `icon_url` | Very useful for structure labels, type names, icons, and category grouping | Public-through-Worker `/api/item-types`, internal DB |
| Tribe enrichment | `world_api_dlt.tribe`, World API cron jobs | 243 rows | Useful for tribe names, counts, ownership context, and UI enrichment | Internal DB, possible Worker route |
| Universe/system/static map data | Public DB/static assets, `/api/solar-system-db`, `worlds.json`, `versionInfo.json`, static SQLite assets | Static or batch-updated rather than event-live | Useful for solar-system context, overlays, and canonical location labeling | Public static/R2/Worker assets |
| Energy / power / network relationships | `energy_source_id` on `ef_sui.assemblies`; package-address schemas include `network_node` and `assembly_energy` tables | 29,674 assemblies had `energy_source_id`; coverage is meaningful | High-value for CC node grouping, dependency views, and future node-level posture summaries | Internal DB, likely new API surface needed |
| Location data | `solar_system_id`, `x`, `y`, `z`, `location_source`, `location_hash` in `ef_sui.assemblies` | Present but only 830 sampled rows had `solar_system_id` | Potentially useful for map context, but not complete enough to assume universal coverage | Internal DB / future enrichment endpoint |
| Smart gate links / access snapshots | Snapshot exporter, KV keys `smart_gate_links_v1`, `gate_access_snapshot_v1` | Export path is live, but sampled snapshot run produced zero links and zero rules | Potentially useful later, but not yet a trustworthy CC dependency | Snapshot exporter, KV, Worker |
| Realtime event stream | `workers/universe-events/`, main Worker comments for `/ws/universe-events` and `/api/universe-events/stats` | Live worker exists; auth contract for external consumers is not yet stable | Promising for live Recent Signals and richer event UI later | WebSocket/Worker path |

## 5. Existing EF-Map consumption surfaces

### Public or intentionally open surfaces

- `GET /api/item-types`
- `POST /api/ssu-demo-search`
- `GET /api/solar-system-db`
- Public static assets such as `worlds.json`, `versionInfo.json`, `assembler_modules.json`, and SQLite/DB assets under the frontend public tree

These are the only clearly browser-usable surfaces discovered in this task without depending on EF-Map internal credentials or same-origin assumptions.

### Existing Worker/API surfaces that are real but not yet browser-safe for CC by default

- `GET /api/smart-gate-links`
- `GET /api/structure-snapshot`
- `GET /api/killboard-snapshot`
- `GET /api/system-overlays`
- `GET /api/assemblies`
- `GET /api/assemblies/:systemId`
- `GET /api/player-bases`
- `GET /api/gate-access`
- `GET /api/intel/*`
- `POST /api/ssu-search`

These routes are not raw public data contracts for another site today. The docs indicate they are mediated by the main Worker and protected through same-origin/referrer rules, partner API keys, or wallet-session/subscription logic.

### Internal raw service boundaries

The following are described as internal service boundaries and should not be treated as third-party integration targets for CivilizationControl:

- `intel.ef-map.com`
- `assemblies.ef-map.com`
- `ssu.ef-map.com`

EF-Map's Worker injects internal bearer credentials when calling those services. That is an explicit sign that EF-Map expects external consumers to come through `https://ef-map.com/api/*`, not through the raw service hosts.

### Realtime surfaces

- Durable Object worker under `workers/universe-events/`
- Documented/implemented routes include `/ws`, `/broadcast`, `/emit`, `/stats`, `/health`, and shoutbox routes
- Main Worker comments also reference app-facing universe-event proxy routes such as `/ws/universe-events` and `/api/universe-events/stats`

This is promising for future live CC event work, but it is not yet documented as a stable cross-origin contract for another app.

### Snapshot and storage layers

- KV keys documented/exported include `smart_gate_links_v1`, `gate_access_snapshot_v1`, `structure_snapshot_v1`, and killboard-related snapshots
- R2 backs large public assets such as the solar-system DB and media
- KV/R2 are derived distribution layers, not the source of truth for EF-Map's richer live state

### Auth, CORS, and rate-limit assumptions discovered

- Worker-facing protected routes use same-origin or allowed referrer traffic, or a flat `X-API-Key`, plus rate limiting
- Documented Worker rate limit: `120 requests/minute per IP`
- `POST /api/ssu-search` is wallet-session and subscription gated
- Raw service bearer tokens should not be distributed to external consumers
- No blanket public static CORS guarantee was confirmed for every asset path

## 6. CivilizationControl opportunities

### Network-node detail view

EF-Map already has indexed `network_node` rows, `energy_source_id` relationships, structure status, and a much richer event history than CC currently computes in-browser. This is the strongest opportunity area because CC's current node view is still derived from wallet-owned structure discovery and client-side grouping.

Potential EF-Map value:

- node-to-assembly grouping by `energy_source_id`
- richer structure status and last-updated timestamps
- node-level recent events
- fuel/power dependency context
- eventual system/location context when enrichment is present

### Structure taxonomy and icons

EF-Map already has a live `world_api_dlt.type` table plus a public `/api/item-types` route. That is immediately more authoritative than CC's current bundled type catalog for type names, groups, categories, and icon metadata.

### Per-node posture presets and node summaries

CC currently stores posture per gate and then projects node-level meaning in the UI. EF-Map's indexed structure relationships could later support a server-side or snapshot-based node summary that tells CC which gates, turrets, and storage units sit under the same power/network grouping.

### Live event feed / Recent Signals

CC currently polls fixed event modules from Sui JSON-RPC and folds them client-side. EF-Map already has:

- a large raw event table
- a normalized `activity_log`
- a live event emitter
- a realtime worker path

That makes EF-Map a strong candidate source for a future CC Recent Signals surface, especially if CC wants filtered, grouped, or node-aware event summaries without heavy browser polling.

### Ownership-aware infrastructure inventory

`assembly_owners`, `characters`, and tribe enrichment could later support richer operator summaries than CC currently has, but this is also the most privacy-sensitive area. Any use here should follow a minimal-identifier and filtered-access model.

### Industry / turret / power switching workflows

`assemblies`, `inventory_items`, `status`, `fuel_amount`, `url`, and recent events could later support stronger readiness indicators for:

- structure online/offline transitions
- trade post readiness
- turret doctrine switching context
- fuel/power warnings
- local recent activity near the operated node

### Structure discovery without browser polling

CC currently discovers structures by walking wallet -> player profile -> character -> owner caps -> shared objects in-browser. The shared backend could later reduce the amount of direct browser-side chain walking if CC uses it for enrichment or secondary discovery, but the safest first model is still:

1. CC resolves operator ownership context locally and on-chain.
2. CC asks the shared backend only for enrichment or summaries keyed by already-known structure IDs or system IDs.

## 7. Safe architecture boundaries

- CivilizationControl's browser should consume an API, Worker, snapshot, or WebSocket surface from the shared backend. It should not consume raw Postgres credentials or direct DB sockets.
- VPS/database access is acceptable for shared-backend server-side services and for bounded read-only operator investigations like this one. It is not an app-runtime dependency for CC's browser.
- The shared backend is currently implemented and operated through the EF-Map repo/runtime. If backend code changes are needed, make them in that source repo rather than by hand-editing the VPS.
- CivilizationControl should keep a provider/client abstraction so the shared backend becomes a stable optional read source rather than a hard-coded product-to-product dependency path.
- `VITE_*` values in CivilizationControl must remain browser-safe. Do not place DB credentials, Worker bearer tokens, or private upstream API secrets in `VITE_*`.
- The raw internal service hostnames and their bearer tokens should stay shared-backend-owned and server-side only.
- Ownership, character, and tribe joins should be filtered carefully. Public chain data can still become surveillance-heavy when reassembled into a reusable intelligence graph.
- The safest future CC contract is probably keyed by structure IDs or system IDs after CC has already resolved operator ownership locally.

## 8. Candidate integration shapes

| Candidate shape | Fit | Benefits | Constraints | Recommendation |
|---|---|---|---|---|
| Consume existing shared-backend public API/snapshot directly | Narrow | Lowest coordination; immediately usable for `/api/item-types` and some static map assets | Does not solve richer structure/event needs; some static assets may not have explicit cross-origin guarantees | Useful only for low-risk catalog/static enrichment |
| Add a CC-specific shared-backend Worker/API endpoint currently implemented in the EF-Map repo/runtime | Strong | Keeps one shared backend; lets the backend filter/auth/cache server-side; avoids DB exposure | Requires backend-repo implementation and endpoint contract | Best next implementation shape |
| Use shared-backend WebSocket/event stream | Medium later | Best path for live Recent Signals or low-latency event UI | Auth/filter/stability contract is not ready for CC yet | Consider after a simpler read-only endpoint exists |
| Create a thin CC Worker/proxy | Strong fallback | Lets CC own auth/CORS mediation while keeping the shared backend private | Adds another service hop and deploy surface | Good fallback if the backend cannot expose a direct CC-safe route |
| Generate/import static type or universe snapshots | Strong complementary slice | Low risk, easy cacheability, no privacy concerns | Helps taxonomy/location only, not live ownership/event needs | Good supporting slice, not enough by itself |
| Direct DB from CC server-side tooling only | Limited/internal | Useful for one-off admin/export jobs | Still tightly couples CC to the shared backend runtime and credentials | Acceptable only for internal tooling, not browser runtime |
| Direct DB from CC browser | Reject | None worth taking | Credential exposure, coupling, zero auth boundary, operationally unsafe | Reject |

## 9. Recommended next slice

### Recommendation

Create a CC-specific read-only shared-backend endpoint for structure and network-node enrichment, then consume it behind a new non-default client/provider in CivilizationControl.

This is the best next slice because:

- the most valuable data is already in the shared backend's indexed Postgres tables
- the most useful existing richer routes are not currently public cross-origin contracts for another browser app
- CC can keep direct on-chain ownership discovery while using the shared backend only for enrichment keyed by structure IDs or system IDs
- it avoids pushing database or bearer-token concerns into the browser

### First data contract to prove

Prefer a small structure-summary contract first, for example a route shaped like:

- `GET /api/civilization-control/assemblies?ids=<assemblyId,...>`

First payload should stay minimal and browser-safe:

- `assemblyId`
- `assemblyType`
- `typeId`
- `name`
- `status`
- `fuelAmount`
- `solarSystemId`
- `energySourceId`
- `url`
- `lastUpdated`
- optional derived fields such as `typeName` if the shared backend wants to join that server-side

That contract is enough to prove immediate CC value without exposing full ownership or character/tribe joins.

### Likely files in CivilizationControl

- `src/lib/efMapClient.ts` — new read-only EF-Map client
- `src/lib/suiReader.ts` — optional enrichment hooks or helper entry points
- `src/hooks/useAssetDiscovery.ts` — where EF-Map enrichment would likely join current chain-derived structure sets
- `src/types/domain.ts` — optional enrichment fields added to the CC domain model
- `docs/operations/efmap-indexer-awareness-20260428.md` — source doc for the plan and boundaries

### Likely files in the shared backend source repo today (currently EF-Map)

- `eve-frontier-map/_worker.js` or `worker.js` — preferred place for a CC-facing Worker route
- `tools/assembly-api/api_wrapper_v2.py` — only if the backend wants the Worker to call a richer internal API helper instead of querying an existing snapshot
- `tools/snapshot-exporter/sui_structure_snapshot_exporter.js` — only if the backend chooses a snapshot-first contract instead of a live query route

### Validation commands for that future slice

CivilizationControl:

- `npm run typecheck`
- `npm run build`

Shared backend source repo (currently EF-Map):

- frontend/Worker build for the modified route surface
- preview deploy of the backend Worker/app route
- a bounded endpoint smoke test from both same-origin EF-Map and the intended CC preview origin or proxy path

### Preview test plan for that future slice

1. Deploy the shared-backend route to preview only.
2. Verify the endpoint returns only the agreed structure-summary fields.
3. Point a CC preview build or local dev build at the preview endpoint or CC proxy.
4. Compare returned structure summaries against one operator's existing chain-discovered structures in CC.
5. Confirm no browser-visible DB credentials, no direct raw-service calls, and no broken CORS/auth behavior.

## 10. Risks and unknowns

- Schema drift: EF-Map contains both normalized `ef_sui` tables and older/indexer-native schemas. Future work must target the intended stable surface, not whichever table happens to exist.
- Stale or incomplete data: `solar_system_id` coverage is currently incomplete across `assemblies`, and `assembly_type` is blank for many rows.
- Snapshot reliability: the sampled `smart_gate_links_v1` and `gate_access_snapshot_v1` export run produced zero rows, so those specific outputs are not yet safe assumptions for CC.
- Auth/CORS assumptions: richer Worker routes are protected today and are not documented as ready-made third-party browser contracts.
- Tribe/player privacy: joining structures, characters, tribes, and locations raises real intelligence/privacy concerns even when the underlying chain data is public.
- VPS coupling: the more CC depends on the shared backend runtime, the more backend deploy health becomes a CC read dependency.
- Credential exposure risk: any attempt to shortcut through DB credentials, bearer tokens, or raw hostnames would be a design mistake.
- Runtime health variance: `intel-refresh` was unhealthy during inspection, which shows not every EF-Map service is equally healthy at all times.
- Future world/runtime migrations: EF-Map's lower-level package-address schemas and CC's own Stillness/World v2 work will likely keep shifting over time.

## 11. Recommended next prompt

"In the shared EVE Frontier backend, currently source-controlled and deployed through the EF-Map repo/runtime, design one preview-only read-only Worker endpoint for CivilizationControl that returns structure-summary data by assembly ID from the indexed `ef_sui.assemblies` table, without exposing DB credentials or raw internal hostnames. Do not wire CivilizationControl to it yet; only define the endpoint, payload, auth/CORS model, and preview validation path."