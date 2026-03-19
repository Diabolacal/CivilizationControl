# Assumption Registry and Demo Fragility Audit

**Retention:** Carry-forward

> Comprehensive registry of material assumptions underlying the CivilizationControl hackathon submission, cross-referenced with a beat-by-beat demo fragility assessment.
> Sources: spec.md, march-11-reimplementation-checklist.md, gate-lifecycle-runbook.md, civilizationcontrol-implementation-plan.md, civilizationcontrol-demo-beat-sheet.md, hackathon-portfolio-roadmap.md, vendor/world-contracts source analysis.
> Last updated: 2026-02-28

---

## Table of Contents

- [Part 1 — Assumption Registry](#part-1--assumption-registry)
  - [1.1 AdminACL and Sponsor Enrollment](#11-adminacl-and-sponsor-enrollment)
  - [1.2 Extension Authorization and Witness Model](#12-extension-authorization-and-witness-model)
  - [1.3 Permit Issuance and Validation](#13-permit-issuance-and-validation)
  - [1.4 Object Ownership and Capabilities](#14-object-ownership-and-capabilities)
  - [1.5 Shared Object Contention](#15-shared-object-contention)
  - [1.6 Event Emission and Indexing](#16-event-emission-and-indexing)
  - [1.7 PTB Composition and Behavior](#17-ptb-composition-and-behavior)
  - [1.8 Gas and Transaction Costs](#18-gas-and-transaction-costs)
  - [1.9 Package Publishing and Upgrades](#19-package-publishing-and-upgrades)
  - [1.10 Infrastructure and Environment](#110-infrastructure-and-environment)
  - [1.11 Wallet and Connection](#111-wallet-and-connection)
  - [1.12 Character Resolution and Object Discovery](#112-character-resolution-and-object-discovery)
  - [1.13 On-Chain vs Game Client Boundary](#113-on-chain-vs-game-client-boundary)
  - [1.14 TradePost-Specific](#114-tradepost-specific)
  - [1.15 ZK Proof Dependencies](#115-zk-proof-dependencies)
  - [1.16 Demo Sequencing and Timing](#116-demo-sequencing-and-timing)
- [Part 2 — Demo Fragility Audit](#part-2--demo-fragility-audit)
  - [2.1 Beat-by-Beat Analysis](#21-beat-by-beat-analysis)
  - [2.2 Beat Classification](#22-beat-classification)
- [Part 3 — Structural Risk Summary](#part-3--structural-risk-summary)
  - [3.1 Top 5 Structural Risks](#31-top-5-structural-risks)
  - [3.2 Top 3 Demo-Breaking Risks](#32-top-3-demo-breaking-risks)
  - [3.3 Pre-Recording Checklist](#33-pre-recording-checklist)
  - [3.4 If X Fails on March 11](#34-if-x-fails-on-march-11)

---

## Part 1 — Assumption Registry

### Legend

| Column | Description |
|--------|-------------|
| ID | Unique assumption identifier |
| Description | What is assumed |
| Source(s) | Document and section reference |
| Dependency Type | Contract / Game Client / Hackathon Rule / Wallet / Infrastructure |
| Risk | Low / Medium / High |
| March 11 Validation | Whether this must be validated on Day-1 of the hackathon |
| Fallback | Known mitigation if assumption is wrong |

---

### 1.1 AdminACL and Sponsor Enrollment

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-01 | CivControl team address can be added to `AdminACL.authorized_sponsors` on the hackathon test server | spec.md S2.3, march-11-checklist E5 | Infrastructure | High | Yes | Use local devnet with self-held GovernorCap |
| A-02 | `add_sponsor_to_acl` requires `GovernorCap`, held exclusively by world deployer (CCP/organizers) | access_control.move L187-192, march-11-checklist "Capability Hierarchy" | Contract behavior | High | Yes | Pre-arrange with organizers before March 11; devnet fallback |
| A-03 | `verify_sponsor` falls back to `ctx.sender()` when `ctx.sponsor()` returns `None`; if sender is in AdminACL, non-sponsored tx succeeds | access_control.move L156-163, march-11-checklist Pattern 7 | Contract behavior | Medium | Yes | If fallback removed, revert to dual-sign pattern |
| A-04 | Function name inconsistency: checklist says `add_sponsor_to_acl`, runbook uses `add_access` | march-11-checklist vs gate-lifecycle-runbook Step 3a | Contract behavior | Medium | Yes | Verify correct function name against world-contracts source |
| A-05 | `AdminACL` takes `&AdminACL` (immutable ref) in `verify_sponsor` — read-only shared object access, lower contention | access_control.move L156, spec.md S2.3 | Contract behavior | Medium | No | If mutable ref, concurrent jumps contend on AdminACL |
| A-06 | `link_gates` now requires `admin_acl: &AdminACL` param and authorized sponsored tx (v0.0.13 breaking change) | march-11-checklist "Breaking Changes" #2, gate.move L170-215 | Contract behavior | High | Yes | Pre-link gates on devnet; use pre-linked pairs on test server |

> **v0.0.17 update:** `link_gates` now also asserts `source_gate.type_id == destination_gate.type_id` (`EGateTypeMismatch`). Low CC impact — CivilizationControl doesn’t call `link_gates`.
| A-07 | `deposit_fuel` requires sponsored transaction | gate-lifecycle-runbook Step 6b | Contract behavior | High | Yes | Fuel on devnet before demo |

### 1.2 Extension Authorization and Witness Model

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-08 | `authorize_extension<Auth: drop>` is public and accepts any custom Auth type with `drop` ability | gate.move L121-125, march-11-checklist A1 | Contract behavior | High | Yes | If restricted to whitelist, CivControl is blocked; no workaround |
| A-09 | Each gate supports exactly ONE extension type (`Option<TypeName>`) via `swap_or_fill` | gate.move L121-125, spec.md S3.5 | Contract behavior | High | No | All rule types must compose inside one package with one extension witness |
| A-10 | `authorize_extension` silently replaces existing extension — ~~no event~~, no revert | gate.move L121-125, march-11-checklist GateControl validation #7 | Contract behavior | High | No | ~~Poll gate extension state~~ *(Correction 2026-03-04: v0.0.15 added `ExtensionAuthorizedEvent` on Gate, SSU, and Turret. Polling no longer required — subscribe to event.)* |
| A-11 | Extension identity uses `type_name::with_defining_ids<Auth>()` including the defining package ID (stable across compatible upgrades) | march-11-checklist GateControl validation #7 | Contract behavior | Medium | No | If unstable, every upgrade requires re-authorization on all gates |
| A-12 | `x_auth()` witness constructor MUST be `public(package)`, not `public` | builder-scaffold config.move L87, extension_examples config.move L22 (divergence) | Contract behavior | High | No | Security-critical; `public` allows any external package to forge witness |
| A-13 | There is no `deauthorize_extension` function — extensions can only be replaced, never removed | gate.move (no such function exists) | Contract behavior | Medium | No | Once registered, gate always requires permit; beneficial stickiness |
| A-14 | Both gates in a linked pair must authorize the SAME extension type for `issue_jump_permit` to succeed | gate.move L248-261, march-11-checklist GateControl validation #2 | Contract behavior | High | Yes | Operator must control both gates in a linked pair |

> **v0.0.18 update:** Extension freeze mechanism added (anti-rugpull) — `authorize_extension` now aborts with `EExtensionFrozen` if assembly is frozen. SSU now has open inventory. These don't break existing assumptions but add new capabilities.

### 1.3 Permit Issuance and Validation

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-15 | `issue_jump_permit` requires ONLY Auth witness + matching extension on both gates; NO AdminACL, NO OwnerCap | gate.move L244-278, spec.md S2.1 | Contract behavior | Medium | Yes | Player-callable; if AdminACL added, architecture changes |
| A-16 | `JumpPermit` has `key, store` abilities (not hot-potato); transferable to character address | spec.md S2.1, gate.move (struct definition) | Contract behavior | Medium | Yes | If hot-potato, issue+jump must be one PTB; two-tx model breaks |
| A-17 | `JumpPermit` is single-use — consumed (deleted) by `validate_jump_permit` | gate.move L705-707, march-11-checklist GateControl validation #3 | Contract behavior | Low | No | Accept toll-per-jump model; no multi-use pass until upstream change |
| A-18 | Permit expiry uses `clock::timestamp_ms()` compared at `jump_with_permit` time | gate-lifecycle-runbook Step 12-13, spec.md S2.1 | Contract behavior | Low | No | Set generous expiry (hours/days) to absorb tx delays |
| A-19 | `route_hash` computed as `blake2b256(gate_A || gate_B)` — order-dependent but validation checks both orderings | gate.move L686-714 | Contract behavior | Low | No | Off-chain computation must use source-first ordering |
| A-20 | Issue and jump are two separate transactions (PROVISIONAL) | spec.md S2.1 "Execute jump" note | Contract behavior | Medium | Yes | If one PTB required, frontend must compose combined PTB |

### 1.4 Object Ownership and Capabilities

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-21 | `OwnerCap<T>` is held BY Character objects (transfer-to-object, Receiving pattern) | march-11-checklist "Capability Hierarchy", Pattern 6 | Contract behavior | Medium | No | PTBs must use borrow/return pattern |
| A-22 | `borrow_owner_cap` / `return_owner_cap` is hot-potato pattern (ReturnReceipt has no `drop`) | march-11-checklist Pattern 6, gate-lifecycle-runbook | Contract behavior | Medium | No | Forgetting return_owner_cap aborts tx; must compose PTBs carefully |
| A-23 | `Character`, `NetworkNode`, `Gate` have ONLY `key` ability (no `store`/`drop`) | gate-lifecycle-runbook "Object Abilities" | Contract behavior | Medium | No | Must use PTB with share_object after creation |
| A-24 | `GovernorCap` is a singleton held by CCP/organizer on the test server | march-11-checklist "Capability Hierarchy" | Infrastructure | High | Yes | On devnet, operator holds GovernorCap; on test server, requires CCP cooperation |
| A-25 | `Item` struct has `key, store` abilities enabling `transfer::public_transfer` | march-11-checklist A4, spec.md S2.1 | Contract behavior | High | Yes | If `Item` lacks `store`, TradePost buy flow breaks entirely |

### 1.5 Shared Object Contention

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-26 | `CivControlConfig` (shared) is read during every permit request and written during rule changes | spec.md S3.2, implementation-plan S06 | Contract behavior | Low (MVP) | No | Irrelevant for demo; scale concern only |
| A-27 | Gate objects are shared; `issue_jump_permit` and `jump_with_permit` use immutable `&Gate` refs — no contention on jump path | gate.move (function signatures) | Contract behavior | Low | No | Confirmed: jump path is read-only on gates |
| A-28 | `StorageUnit` is shared; every deposit/withdraw takes `&mut StorageUnit` — concurrent inventory ops contend | storage_unit.move L66-79 | Contract behavior | Medium | No | Shard SSUs per seller; accept serialization for MVP |
| A-29 | `AdminACL` reads do not contend; only `add_sponsor_to_acl` mutations cause contention | access_control.move L156 (`&AdminACL`) vs L187 (`&mut AdminACL`) | Contract behavior | Low | No | Sponsor enrollment is one-time setup |

### 1.6 Event Emission and Indexing

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-30 | Custom events (`TollCollectedEvent`, `TradeSettledEvent`, `ListingCreatedEvent`) are emitted by CivControl extension and queryable via `suix_queryEvents` | spec.md S3.3, implementation-plan S26 | Contract behavior | High | Yes | If events not queryable, Signal Feed is empty |
| A-31 | ~~NO event emitted for `authorize_extension`~~ *(Correction 2026-03-04: v0.0.15 added `ExtensionAuthorizedEvent` on Gate, SSU, and Turret. Full fields: `assembly_id: ID`, `assembly_key: TenantItemId`, `extension_type: TypeName`, `previous_extension: Option<TypeName>`, `owner_cap_id: ID`. Confirmed PR #110 / commit 3cc9ffa.)* | gate.move | Contract behavior | ~~Medium~~ Low | No | ~~Must poll gate objects~~ Subscribe to `ExtensionAuthorizedEvent` via `suix_queryEvents` with `MoveEventType` filter |
| A-32 | NO event emitted for `issue_jump_permit` from world-contracts | gate.move (no event in issue_jump_permit) | Contract behavior | Medium | No | CivControl must emit its own permit-issuance events |
| A-33 | `JumpEvent` emitted by world-contracts on successful jump; filterable by gate ID client-side | gate.move L93-116 (event structs), L215+ (emission) | Contract behavior | Medium | Yes | If removed upstream, jump signals disappear from Signal Feed |
| A-34 | `ItemDepositedEvent` and `ItemWithdrawnEvent` emitted by world-contracts SSU operations | inventory.move L59-102 | Contract behavior | Low | No | Trade proof moments enhance Signal Feed |
| A-35 | MoveAbort reverts ALL effects including events — no on-chain events from denied jumps | Sui runtime semantics, demo-beat-sheet Beat 4 | Contract behavior | Medium | No | Detection relies on wallet adapter failure response |
| A-36 | Polling is the only query mechanism (no WebSocket, no indexer subscription) | spec.md S2.2 | Infrastructure | Medium | No | 10s polling interval; acceptable for demo |
| A-37 | `suix_queryEvents` supports cursor-based pagination with `MoveEventType` filter | spec.md S2.2, implementation-plan S26 | Infrastructure | Medium | Yes | If deprecated, entire event pipeline breaks |
| A-38 | NO event emitted for `add_sponsor_to_acl` — AdminACL changes are silent | access_control.move (no event in add_sponsor_to_acl) | Contract behavior | Low | No | One-time setup; monitor via object reads |

### 1.7 PTB Composition and Behavior

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-39 | PTB can compose multiple Move calls in a single atomic transaction (borrow -> use -> return) | march-11-checklist Pattern 6, Sui documentation | Contract behavior | Low | No | Core Sui feature; extremely unlikely to change |
| A-40 | PTB with dual OwnerCap borrows (two gates, same owner) works in a single transaction | gate-lifecycle-runbook Step 9 (link_gates) | Contract behavior | Medium | Yes | If Receiving conflict, gate linking requires different approach |
| A-41 | `splitCoins` in PTB creates exact payment coins for toll | march-11-checklist Pattern 3 "Coin splitting" | Contract behavior | Low | No | Standard Sui PTB operation |
| A-42 | `useSignAndExecuteTransaction` hook returns structured MoveAbort info (module + error code) | implementation-plan S29 | Wallet integration | Medium | Yes | If not returned, error display degrades to generic messages |

### 1.8 Gas and Transaction Costs

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-43 | Gas budget of 100M MIST (0.1 SUI) sufficient for most operations | gate-lifecycle-runbook (all steps) | Infrastructure | Low | No | Increase budget if needed |
| A-44 | Gas budget of 500M MIST (0.5 SUI) sufficient for package publishing | gate-lifecycle-runbook Step 1, Step 11b | Infrastructure | Low | No | Increase budget if needed |
| A-45 | Toll payment + gas costs both in SUI — buyer must have enough for both | spec.md S2.1 "Coin Toll", march-11-checklist Pattern 3 | Contract behavior | Medium | No | Split gas coin carefully in PTB |

### 1.9 Package Publishing and Upgrades

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-46 | Extension package published ONCE — redeployment changes TypeName and requires re-authorization on all gates | march-11-checklist Known Pitfalls | Contract behavior | High | No | Thorough testing before first publish; compatible upgrades preserve TypeName |
| A-47 | Compatible package upgrades preserve defining package ID (TypeName stable) | march-11-checklist GateControl validation #7 | Contract behavior | Medium | No | If unstable, every fix = full redeploy + re-authorize |
| A-48 | Extension `Pub.local.toml` must reference correct world-contracts package ID, chain-id, and upgrade-capability | gate-lifecycle-runbook Step 11a | Infrastructure | Medium | Yes | Delete stale Pub.local.toml and recreate after genesis |
| A-49 | ~~No turret module exists~~ Turret module exists (v0.0.14+). Custom turret extensions ARE implemented: `turret_bouncer.move` (BouncerAuth — commercial targeting) and `turret_defense.move` (DefenseAuth — defense targeting). Extension swap via `authorize_extension<BouncerAuth/DefenseAuth>`. Posture tracked by `posture.move` PostureKey DF. (Updated 2026-03-17.) | world-contracts turret.move, contracts/civilization_control/ | Contract behavior | Low | No | Proven: BouncerAuth returns filtered priority list; DefenseAuth returns full priority boost |

### 1.10 Infrastructure and Environment

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-50 | Hackathon test server available from March 11 with pre-published world-contracts | march-11-checklist E5, spec.md S7 H5 | Infrastructure | High | Yes | Self-publish on local devnet (adds 1-2 hours) |
| A-51 | Test server provides admin-spawnable structures and unlimited currency | march-11-checklist E6 | Infrastructure | Medium | Yes | Manual creation via PTBs; multiple faucet calls |
| A-52 | Test server world-contracts package IDs are discoverable | march-11-checklist E7 | Infrastructure | High | Yes | CivControl Move.toml cannot compile without correct dependency IDs |
| A-53 | World-contracts pinned at commit e508451 (v0.0.13) | spec.md S1.3, march-11-checklist | Infrastructure | Medium | Yes | Verify version on Day-1; re-validate if different |
| A-54 | Transaction confirmation latency less than 5 seconds on target network | implementation-plan S38, demo-beat-sheet "Transaction Latency Handling" | Infrastructure | Medium | Yes | Narrate over wait; re-take if gap exceeds 5 seconds |
| A-55 | EVE Frontier does NOT operate custom RPC middleware that filters non-game-client queries | hackathon-portfolio-roadmap S10.4 | Infrastructure | High | Yes | If filtered, all RPC reads fail on test server |
| A-56 | `link_gates` requires server-signed distance proof (Ed25519 over BCS-serialized LocationProof) | gate.move L170-215, location.move L153-173 | Contract behavior | High | Yes | Use pre-linked gates; or use devnet with known server key |
| A-57 | Distance proof is sender-bound — `message.player_address == ctx.sender()` | location.move L153-173 | Contract behavior | High | Yes | For sponsored tx, player (not sponsor) must match proof |
| A-58 | 72 effective hours available during March 11-31 hackathon window | implementation-plan scope header | Infrastructure | Medium | No | Cut ZK and Gate Presets first |
| A-59 | Total effort estimate of 70.5h fits within 72h window with 1.5h buffer | implementation-plan Effort Summary | Infrastructure | High | No | No margin for unexpected blockers; scope cuts mandatory if behind |

### 1.11 Wallet and Connection

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-60 | `@mysten/dapp-kit` is compatible with the hackathon test server Sui version | implementation-plan S07 | Wallet integration | High | Yes | Version mismatch crashes wallet provider |
| A-61 | EVE Vault implements standard `@mysten/wallet-standard` interface | hackathon-portfolio-roadmap S10.2 | Wallet integration | Medium | No | Fall back to Sui Wallet browser extension |
| A-62 | EVE Vault uses zkLogin addresses with MaxEpoch expiry — manual re-login may be required mid-demo | hackathon-portfolio-roadmap S10.2 | Wallet integration | Medium | Yes | If session expires mid-recording, re-take required |
| A-63 | Sponsored transaction signing composes with zkLogin (EVE Vault) flow | hackathon-portfolio-roadmap S10.2 | Wallet integration | Medium | Yes | If incompatible, use standard keypair wallet for sponsored ops |

### 1.12 Character Resolution and Object Discovery

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-64 | ~~No on-chain wallet-to-Character mapping exists; manual Character ID input is MVP~~ **2026-03-10:** `PlayerProfile` (v0.0.16) enables wallet→Character lookup. Reduces to LOW risk. | spec.md S1.2, implementation-plan S27 | Game client | ~~Medium~~ Low | No | Pre-populate known Character ID for demo |
| A-65 | `suix_getOwnedObjects` with StructType filter works on test server for OwnerCap discovery | implementation-plan S15 | Infrastructure | High | Yes | If filter fails, gate/SSU list pages are empty |
| A-66 | `suix_getOwnedObjects` on a Character object address returns object-owned children | hackathon-portfolio-roadmap S10.4 | Infrastructure | Medium | Yes | If different behavior, OwnerCap discovery fails |
| A-67 | `suix_getDynamicFields` returns DFs on CivControlConfig keyed by gate ID | implementation-plan S17 | Infrastructure | Medium | Yes | If DF read path fails, Rule Composer is blind |
| A-68 | Listing shared objects discoverable via event-based indexing (`ListingCreatedEvent` -> listing IDs) | implementation-plan S24 | Infrastructure | Medium | Yes | If listing discovery fails, buyer cannot browse |

### 1.13 On-Chain vs Game Client Boundary

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-69 | Coordinates are NOT on-chain — only Poseidon(2) hashes; manual spatial pinning required | spec.md S1.2 | Game client | Medium | No | No spatial visualization without manual configuration |
| A-70 | In-game embedded browser (CEF 122) provides NO Sui Wallet Standard provider | spec.md S1.1, implementation-plan S08 | Game client | Medium | No | Write operations impossible in-game; read-only surface |
| A-71 | SSU must be online for `withdraw_item` / `deposit_item` to succeed | march-11-checklist Known Pitfalls, Pattern 4 | Contract behavior | Medium | Yes | Seller must maintain SSU uptime for marketplace |
| A-72 | ~~Owner-direct SSU functions (`deposit_by_owner`, `withdraw_by_owner`) are explicitly temporary — ship inventory will replace them~~ | storage_unit.move L21 comment | Contract behavior | Medium | No | ~~Use extension-based paths (`deposit_item<Auth>`, `withdraw_item<Auth>`) as stable API~~ |

> **RESOLVED (v0.0.15):** A-72: `AdminACL` removed from `deposit_by_owner`/`withdraw_by_owner`. Owner-direct paths remain but are simplified. Extension-based paths (`deposit_item<Auth>`, `withdraw_item<Auth>`) are still the stable API and now accept `quantity: u32` + `ctx` parameters.

### 1.14 TradePost-Specific

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-73 | `withdraw_item<Auth>` does NOT require OwnerCap — only TradeAuth witness + shared object refs | march-11-checklist TradePost validation #1, A3, storage_unit.move | Contract behavior | High | Yes | If OwnerCap required, cross-address atomic buy is impossible; must pivot to escrow |
| A-74 | `withdraw_item<Auth>` accesses MAIN inventory keyed by `owner_cap_id`, not per-caller inventory | march-11-checklist TradePost validation #2 | Contract behavior | High | Yes | If keying changed, buyer PTB cannot access seller inventory |
| A-75 | ~~Listing sells FULL item quantity (no `split_item` in world-contracts)~~ | implementation-plan S19 | Contract behavior | ~~Low~~ **RESOLVED** | No | ~~UI must display "Full quantity" constraint~~ |

> **RESOLVED (v0.0.15):** `withdraw_item<Auth>` now accepts `quantity: u32`, enabling partial-quantity listings. "Full quantity" constraint no longer applies.
| A-76 | `deposit_item()` merges quantities for same-type items (volume match required) | march-11-checklist TradePost validation #8 | Contract behavior | Low | No | Simplifies restocking |

### 1.15 ZK Proof Dependencies

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-77 | Groth16 on-chain verification costs approximately 1M MIST in gas | demo-beat-sheet ZK accent, implementation-plan S33 | Contract behavior | Medium | No | If gas cost higher, ZK demo segment dropped |
| A-78 | Browser-side WASM proof generation completes in less than 2 seconds (kill threshold: 5s) | implementation-plan S32 | Infrastructure | Medium | No | If exceeds 5s, ZK feature killed |
| A-79 | snarkjs WASM prover works in modern browsers without CSP issues | implementation-plan S32 | Infrastructure | Medium | No | If CSP blocks WASM, ZK fails in browser |
| A-80 | Poseidon hash in browser (circomlibjs) matches circuit Poseidon implementation | implementation-plan S35 | Contract behavior | Medium | No | Hash mismatch invalidates all proofs |

### 1.16 Demo Sequencing and Timing

| ID | Description | Source(s) | Dependency Type | Risk | March 11 | Fallback |
|----|------------|-----------|-----------------|------|----------|----------|
| A-81 | 5 non-negotiable proof moments must each produce a verifiable transaction digest | spec.md S5.2 "Primary Variant" | Hackathon rule | High | Yes | If any proof moment fails, that beat is unverifiable |
| A-82 | Hostile player denied (wrong tribe) produces MoveAbort — this IS the proof of denial | spec.md S5.2 Beat 4, gate.move error code 4 | Contract behavior | High | Yes | If tribe filter does not abort, denial beat is unprovable |
| A-83 | 3 funded demo accounts with distinct tribe memberships: Operator, Hostile (tribe != 7), Ally (tribe = 7) | demo-beat-sheet "Demo Account Roles" | Infrastructure | High | Yes | If tribes cannot be set on test server, denial/allow scenarios cannot be staged |
| A-84 | Beats captured in sequence (2->3->4->5->6->7) because each beat depends on prior beat state | demo-beat-sheet "Recommended Recording Order" | Infrastructure | Medium | No | Out-of-order capture causes state inconsistencies |
| A-85 | Demo can be re-recorded (multiple takes); not strictly live | demo-beat-sheet "capture mode notes" | Hackathon rule | Low | No | If single-take required, any tx failure forces full restart |
| A-86 | Multiple submissions from one team/individual are permitted by hackathon rules | hackathon-portfolio-roadmap Risk #5 | Hackathon rule | High | ✅ Yes (FAQ 2026-03-02) | ~~If disallowed, portfolio strategy collapses to single CC entry~~ Confirmed allowed; each project must be unique |
| A-87 | Operator must own BOTH gates in a linked pair for paired authorization | implementation-plan S18, gate.move `authorize_extension` requires OwnerCap | Contract behavior | High | Yes | Cannot authorize partner-owned gates; must own both |

---

## Part 2 — Demo Fragility Audit

### 2.1 Beat-by-Beat Analysis

#### Beat 1 — Pain (0:00-0:18)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | None (text-on-black narrative frames; optionally a 1-second CLI error screenshot flash) |
| **Transaction count** | 0 |
| **Shared objects touched** | None |
| **Event dependencies** | None |
| **Assumptions referenced** | None |
| **Determinism score** | 5/5 |
| **Failure surface** | Text-on-black frames missing or unusable |
| **Recoverability** | Easy — post-production asset, re-create offline |
| **Mitigation** | Prepare text-on-black frames and optional CLI error screenshot in advance |

---

#### Beat 2 — Power Reveal (0:18-0:38)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | RPC reads: `suix_getOwnedObjects`, `sui_multiGetObjects`, `suix_queryEvents` |
| **Transaction count** | 0 (read-only) |
| **Shared objects touched** | None (reads only) |
| **Event dependencies** | Signal Feed queries prior events |
| **Assumptions referenced** | A-60, A-61, A-64, A-65, A-66, A-37 |
| **Determinism score** | 4/5 |
| **Failure surface** | Wallet connection fails; RPC queries return empty; structure list does not populate; Signal Feed shows no events |
| **Recoverability** | Moderate — wallet reconnect takes 10-30s; empty UI is not recoverable during recording |
| **Mitigation** | Pre-verify wallet connection and RPC health; pre-populate structures and events before recording session; have backup wallet (Sui Wallet) ready |

---

#### Beat 3 — Policy (0:38-1:00)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | 1. `authorize_extension` (if not already done). 2. Write TribeRule + TollRule dynamic fields to CivControlConfig |
| **Transaction count** | 1-2 (authorize extension may be separate from rule deploy) |
| **Shared objects touched** | Gate (mutable for authorize_extension), CivControlConfig (mutable for DF writes) |
| **Event dependencies** | Custom extension events for policy deployment |
| **Assumptions referenced** | A-08, A-09, A-14, A-21, A-22, A-26, A-30, A-39, A-46, A-48, A-81 |
| **Determinism score** | 3/5 |
| **Failure surface** | Extension package not published; authorize_extension fails (wrong OwnerCap or gate already has different extension); DF write fails; gas insufficient; gate not in clean state (has leftover extension from testing) |
| **Recoverability** | Hard — package publishing errors require debugging; DF write failures require state investigation; re-authorization on wrong extension requires replacement |
| **Mitigation** | Publish extension package well before recording; verify gate is in clean state (extension: None); rehearse the full deploy flow on devnet first; have pre-tested PTBs ready |

---

#### Beat 4 — Denial (1:00-1:18)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | Hostile pilot attempts `issue_jump_permit` or `jump_with_permit` — MoveAbort expected |
| **Transaction count** | 1 (expected to fail) |
| **Shared objects touched** | Gate (immutable ref), CivControlConfig (read for tribe rule) |
| **Event dependencies** | NO events emitted (MoveAbort reverts all effects). Detection via wallet adapter failure response parsing. |
| **Assumptions referenced** | A-14, A-15, A-30, A-35, A-42, A-82, A-83 |
| **Determinism score** | 3/5 |
| **Failure surface** | Hostile pilot has wrong wallet connected; tribe filter not active (Beat 3 tx unconfirmed); wallet adapter does not return structured abort info; hostile pilot accidentally has matching tribe; Signal Feed cannot display denied jump (no on-chain events) |
| **Recoverability** | Moderate — wrong wallet is quick fix; unconfirmed Beat 3 requires wait + retry; tribe mismatch requires account reconfiguration |
| **Mitigation** | Pre-verify hostile pilot tribe != filter value; confirm Beat 3 tx before proceeding; test wallet adapter MoveAbort parsing on devnet; have Signal Feed display denied entries from wallet failure response (not events) |

---

#### Beat 5 — Revenue (1:18-1:36)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | 1. `issue_jump_permit` (CivControl extension, player-signed). 2. `jump_with_permit` (AdminACL-protected, sponsored or self-sponsored). |
| **Transaction count** | 2 (permit issuance + jump execution) |
| **Shared objects touched** | Gate x2 (immutable for permit + jump), CivControlConfig (read for toll rule), AdminACL (read for verify_sponsor), Clock (read for permit expiry) |
| **Event dependencies** | `TollCollectedEvent` (extension), `JumpEvent` (world-contracts) |
| **Assumptions referenced** | A-01, A-02, A-03, A-06, A-14, A-15, A-16, A-17, A-18, A-20, A-27, A-29, A-30, A-33, A-41, A-45, A-54, A-81 |
| **Determinism score** | 2/5 |
| **Failure surface** | AdminACL enrollment not complete; sponsor address not authorized; permit expired before jump tx submits; toll coin splitting fails; ally pilot has insufficient funds; network latency causes permit expiry; dual-sign pattern fails; self-sponsorship fallback does not work on test server |
| **Recoverability** | Hard — AdminACL enrollment requires GovernorCap holder cooperation (potentially hours/days); permit expiry requires re-issuance; insufficient funds requires faucet + wait |
| **Mitigation** | Validate AdminACL enrollment on Day-1 before any demo work; set generous permit expiry (24h); pre-fund ally pilot with 50+ SUI; test self-sponsorship path first (simpler); have devnet fallback ready |

---

#### Beat 6 — Defense Mode (1:36-2:06) ★ Climax

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | Single PTB: `set_posture` + `set_tribe_config` + `clear_toll_config` + N × (borrow OwnerCap<Turret> → `authorize_extension<DefenseAuth>` → return OwnerCap) |
| **Transaction count** | 1 (single PTB, 7-9 Move calls) |
| **Shared objects touched** | Gate(s) (mutable for config changes), Turret(s) (mutable via OwnerCap borrow), Character (mutable for OwnerCap borrow/return), NetworkNode (immutable for energy validation) |
| **Event dependencies** | `PostureChangedEvent` (CC extension), N × `DefenseTargetingEvent` (CC extension — turret posture swap) |
| **Assumptions referenced** | A-30, A-33, A-39, A-41, A-81 (posture switch validated on localnet — see posture-switch-localnet-validation.md) |
| **Determinism score** | 3/5 |
| **Failure surface** | Extension already authorized with same type; NetworkNode not producing energy; gas budget exceeded for multi-call PTB; OwnerCap borrow/return ordering wrong; shared object contention on turrets |
| **Recoverability** | Moderate — fallback Strategy B: separate per-turret txs (~3s total, still impressive); pre-check all turret states + NWN energy before recording |
| **Mitigation** | Pre-verify current posture DF matches expected state and NWN producing energy; validated on localnet (BUSINESS→DEFENSE and reverse both pass, ~2.3s e2e); have Strategy B fallback ready |

---

#### Beat 7 — Commerce (2:06-2:28)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | 1. `withdraw_item<TradeAuth>` from seller SSU (now with `quantity: u32` in v0.0.15). 2. `transfer::public_transfer` item to buyer. 3. `splitCoins` + transfer toll to seller. All in one atomic PTB. |
| **Transaction count** | 1 (atomic settlement PTB) |
| **Shared objects touched** | StorageUnit (mutable for withdraw), CivControlConfig (read for listing), Listing object (shared, read + state update) |
| **Event dependencies** | `TradeSettledEvent` (extension), `ItemWithdrawnEvent` (world-contracts) |
| **Assumptions referenced** | A-25, A-28, A-30, A-41, A-68, A-71, A-73, A-74, A-81 |
| **Determinism score** | 2/5 |
| **Failure surface** | SSU offline (withdraw fails); `withdraw_item` requires OwnerCap (assumption A-73 wrong); Item lacks `store` ability; listing not created; buyer insufficient funds; SSU shared object contention; listing already purchased by another buyer |
| **Recoverability** | Hard — SSU offline requires bring-online tx chain; OwnerCap requirement would break entire TradePost design; Item ability is compile-time-fixed |
| **Mitigation** | Verify SSU online status before recording; validate `withdraw_item` and `Item` abilities on Day-1; pre-create listing well before recording; fund buyer with 100+ SUI; use dedicated SSU with no other concurrent users |

---

#### Beat 8 — Command (2:28-2:43)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | RPC reads only: `suix_queryEvents` for revenue aggregation, `sui_multiGetObjects` for structure state |
| **Transaction count** | 0 (read-only) |
| **Shared objects touched** | None (reads only) |
| **Event dependencies** | `TollCollectedEvent` + `TradeSettledEvent` + `PostureChangedEvent` + `StatusChangedEvent` from Beats 5-7 must be queryable |
| **Assumptions referenced** | A-30, A-36, A-37, A-54, A-81 |
| **Determinism score** | 3/5 |
| **Failure surface** | Event queries return empty or stale data (polling lag); revenue aggregation calculation error; prior beat events not yet indexed; Command Overview shows incomplete state |
| **Recoverability** | Moderate — wait for next poll cycle (10s); if events never appear, hold on existing Signal Feed entries and capture what is visible |
| **Mitigation** | Wait 15-30 seconds after Beat 7 before recording Beat 8; verify event queries return expected data before starting camera; consider manual poll trigger in UI |

---

#### Beat 9 — Close (2:43-2:56)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | None (title card overlay) |
| **Transaction count** | 0 |
| **Shared objects touched** | None |
| **Event dependencies** | None |
| **Assumptions referenced** | None |
| **Determinism score** | 5/5 |
| **Failure surface** | Title card asset missing |
| **Recoverability** | Easy — post-production asset |
| **Mitigation** | Prepare "CivilizationControl" title card in advance |

---

#### ZK Accent (Optional, 30 seconds before Beat 8)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | 1. Browser generates Groth16 proof. 2. PTB submits proof to on-chain verifier. 3. If valid, issue ZK-based permit. |
| **Transaction count** | 1-2 |
| **Shared objects touched** | Gate x2 (immutable), CivControlConfig (read), VerifyingKey object |
| **Event dependencies** | `VerificationResult` event |
| **Assumptions referenced** | A-77, A-78, A-79, A-80 |
| **Determinism score** | 2/5 |
| **Failure surface** | Proof generation exceeds 5s; WASM blocked by CSP; hash mismatch between browser and circuit; gas cost exceeds budget; on-chain verification fails; verifying key object not published |
| **Recoverability** | Easy — ZK is optional accent segment; drop entirely if unstable |
| **Mitigation** | Kill ZK feature immediately if any kill criterion triggers; pre-generate proof and cache for demo; test full flow on devnet before attempting on test server |

---

#### Gate Preset Switching Accent (Optional, 10 seconds after Beat 3)

| Attribute | Value |
|-----------|-------|
| **On-chain actions** | `unlink_gates` (player-callable, no AdminACL). `link_gates` (requires AdminACL + distance proof). |
| **Transaction count** | 2-5 (depending on number of topology changes) |
| **Shared objects touched** | Gate x N (mutable for link/unlink), GateConfig (immutable for link), AdminACL (read for link) |
| **Event dependencies** | `GateLinkedEvent`, `GateUnlinkedEvent` (v0.0.13) |
| **Assumptions referenced** | A-06, A-56, A-57 |
| **Determinism score** | 1/5 |
| **Failure surface** | Distance proof unavailable (no game server key access) blocks re-linking; AdminACL enrollment required for link; multiple shared object mutations in sequence; topology visualization not ready |
| **Recoverability** | Hard — distance proof acquisition is off-chain dependency; AdminACL enrollment is same blocker as Beat 5 |
| **Mitigation** | Show only unlinking (tear-down) if distance proof unavailable; or drop segment entirely |

---

### 2.2 Beat Classification

#### Deterministic (Score 4-5)

| Beat | Score | Rationale |
|------|-------|-----------|
| Beat 1 — Pain | 5/5 | Text-on-black frames; no live dependencies |
| Beat 9 — Close | 5/5 | Title card overlay; no live dependencies |

#### Conditionally Deterministic (Score 3-4)

| Beat | Score | Condition |
|------|-------|-----------|
| Beat 2 — Power Reveal | 4/5 | Deterministic if wallet connects and RPC is healthy; pre-verified in rehearsal |
| Beat 3 — Policy | 3/5 | Deterministic if extension package published and gate in clean state |
| Beat 4 — Denial | 3/5 | Deterministic if Beat 3 confirmed and hostile account tribe verified |
| Beat 6 — Defense Mode | 3/5 | Deterministic if turrets OFFLINE, NWN producing energy, OwnerCaps accessible; validated on localnet |
| Beat 8 — Command | 3/5 | Deterministic if Beats 5-7 events indexed before recording |

#### Fragile (Score 2)

| Beat | Score | Primary Fragility |
|------|-------|-------------------|
| Beat 5 — Revenue | 2/5 | AdminACL enrollment dependency; two-transaction flow with permit expiry window; sponsorship configuration |
| Beat 7 — Commerce | 2/5 | Cross-address atomic settlement depends on unvalidated `withdraw_item` behavior; SSU online requirement |
| ZK Accent | 2/5 | Browser proof generation timing; circuit/hash compatibility; optional — can be dropped |

#### High-Risk Demo Moments

| Beat | Score | Risk Description |
|------|-------|-----------------|
| Gate Preset Accent | 1/5 | Distance proof dependency makes re-linking nearly impossible without game server cooperation; unlink-only is partial demo |

---

## Part 3 — Structural Risk Summary

### 3.1 Top 5 Structural Risks

**SR-1: AdminACL Enrollment Requires GovernorCap Cooperation (A-01, A-02, A-24)**

The entire sponsored-transaction flow (`jump_with_permit`, `link_gates`, `deposit_fuel`) depends on the CivControl address being in `AdminACL.authorized_sponsors`. Only the GovernorCap holder can add sponsors. On the hackathon test server, this is CCP/organizers. If enrollment cannot be arranged before demo recording, Beats 5, 6, and all gate infrastructure setup are blocked.

Impact: Blocks 3 of 5 non-negotiable proof moments. Blocks gate linking and fueling.

Self-sponsorship mitigation (A-03): If the CivControl address can be added to AdminACL and signs its own transactions (non-sponsored), the dual-sign pattern is unnecessary. This simplification depends on the verify_sponsor fallback remaining intact.

**SR-2: Distance Proof for Gate Linking (A-06, A-56, A-57)**

Gate linking in v0.0.13 requires a server-signed distance proof (Ed25519 over BCS LocationProof). The proof is sender-bound and requires a registered server key. On devnet, the operator can register their own server key. On the test server, this requires either:
(a) Access to a registered server key and proof-signing tooling, or
(b) Using pre-linked gates provided by the test server admin tools.

If neither is available, gates cannot be linked and the demo requires pre-existing linked gate pairs.

Impact: Blocks gate linking, which is a prerequisite for all jump-related demo beats (3-5).

**SR-3: Extension Package Stability (A-46, A-11, A-09)**

The CivControl extension package must be published correctly on the first attempt. A bug discovered after publishing requires either:
(a) A compatible upgrade (preserves TypeName, additive only), or
(b) A full redeploy + re-authorization on every enrolled gate.

With all rule types (tribe, toll, trade, optionally ZK) composing inside a single package with a single extension witness (A-09), a bug in any rule type forces re-authorization of all gates.

Impact: Time-critical during hackathon; no safety net for Move logic bugs.

**SR-4: World-Contracts API Stability (A-53, A-08, A-73, A-25)**

CivControl depends on specific function signatures, struct abilities, and access patterns in world-contracts. Key assumptions:
- `authorize_extension` accepts any `Auth: drop` type (A-08)
- `withdraw_item` does not require OwnerCap (A-73)
- `Item` has `key, store` abilities (A-25)

If the test server runs a different world-contracts version than v0.0.13 (commit e508451), any of these assumptions could be invalidated.

Impact: Compilation failures, runtime aborts, or architectural infeasibility.

**SR-5: Event Queryability on Test Server (A-30, A-37, A-55)**

The Signal Feed, revenue aggregation, and listing discovery all depend on `suix_queryEvents` with `MoveEventType` filter working on the hackathon RPC endpoint. If the test server uses custom RPC middleware (A-55), rate-limits event queries, or does not index custom extension events, the entire read-path architecture breaks.

Impact: Signal Feed empty; Command Overview shows no revenue; listing discovery fails; 2 of 5 proof moments lack evidence.

### 3.2 Top 3 Demo-Breaking Risks

**DR-1: AdminACL Not Enrolled Before Recording**

If the CivControl sponsor address is not in AdminACL when recording begins, Beat 5 (revenue — ally tolled jump) cannot execute. This is the single highest-impact demo-breaking risk because:
- It requires external cooperation (GovernorCap holder)
- There is no code-level workaround
- It blocks the proof moment that demonstrates revenue generation
- Fallback to devnet loses test-server credibility

Probability: Medium (unknown whether organizers provide builder-accessible AdminACL enrollment).

**DR-2: Gate Pair Not Linkable**

If distance proofs are unavailable and no pre-linked gate pairs exist, the entire gate demo is impossible. Even with AdminACL, gate linking requires a valid distance proof. This is a distinct dependency from AdminACL.

Probability: Medium (distance proof tooling may not be builder-accessible).

**DR-3: TradePost Atomic Buy Fails**

The atomic buy flow (withdraw + transfer + payment in one PTB) depends on `withdraw_item<Auth>` NOT requiring OwnerCap (A-73). This assumption has been validated against source code but not tested on the live test server. If the test server runs a version where this behavior differs, Beat 7 (commerce) is impossible and the primary ~2:56 demo must fall back to the 2-minute GateControl-only variant.

Probability: Low (source-validated) but consequence is high.

### 3.3 Pre-Recording Checklist

Derived from the fragility audit. Complete ALL items before pressing record.

**Infrastructure Verification (Day 1)**

| # | Check | Validates | Assumptions |
|---|-------|-----------|-------------|
| 1 | Verify test server RPC endpoint responds to `sui_getLatestCheckpoint` | Server available | A-50 |
| 2 | Query `suix_queryEvents` with any MoveEventType filter | Event pipeline working | A-37, A-55 |
| 3 | Verify world-contracts package IDs (lookup via `sui_getObject` on known structure) | Correct dependency IDs | A-52, A-53 |
| 4 | Attempt `add_sponsor_to_acl` or confirm sponsor enrollment with organizers | AdminACL access | A-01, A-02 |
| 5 | Test `verify_sponsor` self-sponsorship path (sender in AdminACL, non-sponsored tx) | Self-sponsorship works | A-03 |
| 6 | Verify wallet connects to test server (`@mysten/dapp-kit` compatibility) | Wallet provider working | A-60 |

**Extension Deployment (Day 1-2)**

| # | Check | Validates | Assumptions |
|---|-------|-----------|-------------|
| 7 | Publish CivControl extension package on test server | Package compiles against test server world-contracts | A-46, A-48 |
| 8 | Call `authorize_extension<GateAuth>` on a test gate | Extension registration works | A-08, A-09 |
| 9 | Verify gate object shows `extension: Some(TypeName)` with correct defining package ID | TypeName stable | A-11 |
| 10 | Verify `withdraw_item<TradeAuth>` succeeds without OwnerCap on test server | Cross-address buy viable | A-73 |
| 11 | Verify `Item` can be `public_transfer`-ed to buyer address | Item has `store` ability | A-25 |

**Demo State Setup (Pre-Recording)**

| # | Check | Validates | Assumptions |
|---|-------|-----------|-------------|
| 12 | Create/configure 3 demo accounts (Operator, Hostile, Ally) with distinct tribes | Account roles ready | A-83 |
| 13 | Fund Ally pilot with 50+ SUI | Sufficient for toll + buy + gas | A-45 |
| 14 | Fund Hostile pilot with 10+ SUI | Sufficient for failed tx gas | A-43 |
| 15 | Ensure 2 gates are linked, online, fueled, and extension-authorized | Gate demo prerequisite | A-06, A-14, A-56 |
| 16 | Ensure SSU Trade Post is deployed, authorized, online, with 1+ listed item | TradePost demo prerequisite | A-71, A-68 |
| 17 | Ensure recording gate has NO current extension (clean state for Beat 3) OR plan to show re-deploy | Beat 3 precondition | A-10 |
| 18 | Note operator balance before recording (for toll revenue delta evidence) | Beat 5 evidence | A-81 |
| 19 | Note buyer/seller balances before recording (for trade delta evidence) | Beat 7 evidence | A-81 |
| 20 | Verify Signal Feed shows prior events (warm cache for Beat 2 reveal) | Beat 2 visual | A-36, A-37 |

### 3.4 If X Fails on March 11

**Scenario 1: Test server unavailable (A-50)**

Response:
1. Switch to local devnet (Docker + genesis)
2. Self-publish world-contracts (1-2 hours)
3. Self-hold GovernorCap — eliminates AdminACL enrollment blocker
4. Self-register server key — eliminates distance proof blocker
5. Proceed with all demo beats on devnet
6. Demo loses "running on shared hackathon chain" credibility but all functionality is provable

Time cost: 2-3 hours. Acceptable within 72h window.

**Scenario 2: AdminACL enrollment refused or delayed (A-01, A-02)**

Response:
1. Test self-sponsorship path (add own address to AdminACL on devnet, sign non-sponsored tx)
2. If self-sponsorship works: proceed on devnet with GovernorCap control
3. If test server access is available but AdminACL is not: record all non-AdminACL beats (Beats 1-4, Beat 7) on test server; record Beat 5-6 on devnet
4. Worst case: switch entirely to devnet; still meets submission requirements

Time cost: 1-2 hours for devnet setup + re-recording.

**Scenario 3: Extension package has a Move bug after publish (A-46)**

Response:
1. Attempt compatible upgrade (additive only) — if successful, TypeName preserved, no re-authorization needed
2. If bug requires signature change: full redeploy → new package ID → new TypeName → re-authorize every gate
3. With 2 demo gates, re-authorization is 2 PTBs (minutes, not hours)
4. With many gates: prioritize demo gates only

Time cost: 30 minutes (compatible upgrade) to 2 hours (full redeploy + re-auth).

**Scenario 4: TradePost buy flow fails (A-73, A-74)**

Response:
1. Immediately switch to 2-minute fallback demo variant (GateControl-only)
2. Fallback covers: pain narrative, policy deploy, hostile denied, ally tolled, revenue visible
3. Fallback omits Beat 6 (Defense Mode) and Beat 7 (commerce)
4. Captures 3 of 5 non-negotiable proof moments (policy, denial, toll)
5. Begin TradePost debugging in parallel; re-attempt if fixed within 4 hours

Time cost: 0 (fallback variant is pre-planned).

**Scenario 5: Gate linking impossible — no distance proof access (A-56)**

Response:
1. Ask organizers for pre-linked gate pairs via admin tools
2. If unavailable: use local devnet with self-registered server key
3. If devnet only: demo on devnet; link gates with local proof signing
4. Gate preset switching accent is dropped entirely

Time cost: 1 hour (devnet) to unknown (waiting for organizer response).

**Scenario 6: Wallet adapter incompatible with test server (A-60)**

Response:
1. Try Sui Wallet browser extension (standard fallback)
2. If no wallet works: construct and sign transactions via CLI, capture CLI demo
3. Adjust demo narrative to focus on on-chain proof rather than UI smoothness
4. Lose "one-click governance" UX story but retain all proof moments

Time cost: 30 minutes to pivot recording approach.

---

## Appendix: Assumption Count Summary

| Category | Count | High | Medium | Low |
|----------|-------|------|--------|-----|
| AdminACL and Sponsor Enrollment | 7 | 4 | 3 | 0 |
| Extension Authorization | 7 | 4 | 2 | 1 |
| Permit Issuance and Validation | 6 | 0 | 3 | 3 |
| Object Ownership and Capabilities | 5 | 2 | 3 | 0 |
| Shared Object Contention | 4 | 0 | 1 | 3 |
| Event Emission and Indexing | 9 | 1 | 6 | 2 |
| PTB Composition | 4 | 0 | 2 | 2 |
| Gas and Transaction Costs | 3 | 0 | 1 | 2 |
| Package Publishing and Upgrades | 4 | 2 | 2 | 0 |
| Infrastructure and Environment | 10 | 4 | 4 | 2 |
| Wallet and Connection | 4 | 1 | 3 | 0 |
| Character Resolution and Discovery | 5 | 1 | 3 | 1 |
| On-Chain vs Game Client Boundary | 4 | 0 | 3 | 1 |
| TradePost-Specific | 4 | 2 | 0 | 2 |
| ZK Proof Dependencies | 4 | 0 | 4 | 0 |
| Demo Sequencing and Timing | 7 | 4 | 1 | 2 |
| **Total** | **87** | **25** | **41** | **21** |

| Demo Classification | Beat Count |
|---------------------|------------|
| Deterministic | 2 (Beat 1, Beat 9) |
| Conditionally Deterministic | 5 (Beats 2-4, 6, 8) |
| Fragile | 3 (Beats 5, 7, ZK accent) |
| High-Risk | 1 (Gate Preset accent) |

---

## Appendix: Referenced Document Paths

All paths verified against workspace structure as of 2026-02-28.

| Short Name | Path |
|------------|------|
| spec.md | docs/core/spec.md |
| march-11-checklist | docs/core/march-11-reimplementation-checklist.md |
| gate-lifecycle-runbook | docs/operations/gate-lifecycle-runbook.md |
| implementation-plan | docs/core/civilizationcontrol-implementation-plan.md |
| demo-beat-sheet | docs/core/civilizationcontrol-demo-beat-sheet.md |
| hackathon-portfolio-roadmap | docs/strategy/hackathon-portfolio-roadmap.md |
| access_control.move | vendor/world-contracts/contracts/world/sources/access/access_control.move |
| gate.move | vendor/world-contracts/contracts/world/sources/assemblies/gate.move |
| storage_unit.move | vendor/world-contracts/contracts/world/sources/assemblies/storage_unit.move |
| location.move | vendor/world-contracts/contracts/world/sources/primitives/location.move |
| inventory.move | vendor/world-contracts/contracts/world/sources/primitives/inventory.move |
