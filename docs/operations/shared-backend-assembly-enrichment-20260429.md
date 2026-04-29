# Shared-Backend Assembly Enrichment — 2026-04-29

## Summary

CivilizationControl now consumes the production shared-backend assembly summary endpoint opportunistically:

- endpoint: `https://ef-map.com/api/civilization-control/assemblies?ids=<assemblyId,...>`
- request shape: explicit decimal assembly IDs only, max `100` IDs per request
- auth model: no API key required from CivilizationControl
- browser secret model: no browser-visible token, no `ASSEMBLY_API_TOKEN`, no EF-Map internal secret in the frontend
- fallback model: direct-chain asset discovery remains authoritative and continues to work when the shared backend fails, times out, returns `missingIds`, or is unavailable

This is an additive read-path enhancement only. No write path, wallet flow, sponsorship flow, package ID, or Move contract behavior changes.

## Endpoint contract consumed

- base URL default: `https://ef-map.com`
- override: optional public env var `VITE_SHARED_BACKEND_URL`
- route: `GET /api/civilization-control/assemblies?ids=<comma-separated-decimal-assembly-ids>`
- Worker CORS model: route-specific CivilizationControl browser-origin allowlist
- production is the source of truth for positive-path validation in this slice

## How CivilizationControl collects assembly IDs

CivilizationControl does not ask EF-Map to discover owned structures.

Instead it:

1. resolves owned structures directly from Sui RPC through the existing wallet → PlayerProfile → Character → OwnerCap → structure discovery path
2. reads the on-chain `key: TenantItemId` field from each discovered structure
3. extracts `key.fields.item_id` as the decimal `assemblyId`
4. sends only those already-known assembly IDs to the shared backend

That keeps ownership and action authority on the direct-chain path.

## Fields consumed now

The shared-backend client normalizes the v1 summary payload and stores it as optional `summary` data on the local `Structure` model.

Consumed fields:

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
- optional `typeName`

Fields currently used by the UI in this slice:

- `name` only when the direct-chain name is still the synthetic type + short-ID fallback
- `solarSystemId` as a display-only location fallback when no manual spatial pin exists
- `url`, `lastUpdated`, `typeId`, `typeName`, `assemblyType`, `status`, `fuelAmount`, and `energySourceId` are stored as optional enrichment for later slices but do not replace authority-critical chain fields in this implementation

## Fallback behavior

- direct-chain discovery remains primary for ownership, owner-cap resolution, structure identity, extension status, network-node linkage, fuel state, and action eligibility
- enrichment runs only after direct-chain discovery has already produced known structures
- endpoint failures do not surface as app-fatal discovery failures
- `missingIds` leave those structures unchanged
- invalid or partial backend payloads are discarded defensively
- the app continues to function with the existing direct-chain data if the endpoint returns no usable enrichment

## What remains direct-chain

Still direct-chain and authoritative:

- wallet connection and player-profile discovery
- OwnerCap discovery
- structure object resolution by Sui object ID
- extension authorization status
- power state used for control actions
- network-node object linkage used for action paths
- fuel data used by runtime and power UI
- all write paths, PTBs, sponsorship, and transaction execution

## What not to use this endpoint for

Do not use this route for:

- owner, tribe, character, or wallet discovery
- owner-cap lookup
- write authorization decisions
- power, posture, policy, or extension actions
- raw search or browsing by system, owner, or tribe
- browser-visible secret transport

## Future candidates

Reasonable future additive slices:

1. shared-backend network-node summary enrichment
2. recent activity or signal-feed enrichment through a separate filtered backend contract
3. richer type labeling once the summary contract explicitly stabilizes those fields
4. optional display of backend freshness metadata where it helps operators without replacing chain truth

## Validation notes

- the client chunks requests at `100` IDs per request to match the backend contract
- timeout is bounded per request chunk
- no browser Authorization header or EF-Map internal secret is used
- direct-chain fallback remains available even when the shared backend is unavailable