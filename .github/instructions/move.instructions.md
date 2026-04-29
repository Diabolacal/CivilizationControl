---
description: "Sui Move conventions for CivilizationControl Move packages"
applyTo: "**/*.move"
---

# Move Code — Workspace Conventions

> Revalidate against the current vendored `world-contracts` source, package metadata, and live runtime/original guidance before generating call sites.
> These are agent guardrails, not canonical truth. Authority hierarchy:
> repo-owned package/config truth (`contracts/civilization_control/Move.toml`, `contracts/civilization_control/Move.lock`, `config/chain/stillness.ts`) and vendored world metadata > Sui docs > EVE Frontier docs > focused repo ops docs > this file.
> See also: `docs/operations/world-runtime-original-split-20260429.md`, `docs/operations/mvr-world-package-audit-20260429.md`, and `docs/llm-reference-guide.md`.

## Core Rules

- **Never assume function signatures.** Always verify against the current `vendor/world-contracts` commit before generating call sites. Signatures and auth requirements change between releases.
- **Extension witness must be `public(package)`, not `public`.** The `x_auth()` function that mints your Auth witness type must use `public(package)` to prevent external packages from forging it. Verify the pattern against current `builder-scaffold` before scaffolding.
- **Dynamic fields: use typed key structs, not strings.** Define explicit `has copy, drop, store` key structs (e.g., `TollConfigKey`) rather than raw `vector<u8>` or `String` keys. This prevents key collisions and aids discoverability.
- **Hot-potato discipline: borrow and return in the same PTB.** If world-contracts uses a borrow/return pattern for capabilities (e.g., `borrow_owner_cap` / `return_owner_cap`), the borrowed object must be returned in the same transaction. Verify current function names before generating call sites.
- **MoveAbort emits no events.** Do not rely on events for proof-of-execution in flows that may abort. Use transaction digest + effects as the evidence path. See `docs/ptb/proof-extraction-moveabort.md`.
- **Prefer explicit error codes.** Define errors with `#[error(code = N)]` and descriptive `vector<u8>` messages. Keep codes sequential within each module.

## Pre-Planning / Module Decomposition (Mandatory)

Before generating any new Move module or making significant additions to an existing one, the agent **must** outline the module decomposition in its plan:

1. **Estimate scope first.** Before writing code, estimate the line count of the feature. If a single module is likely to exceed ~500 lines, design it as multiple modules in the plan.
2. **Declare module boundaries upfront.** The plan must list every module to be created or modified, with a one-line purpose for each. Do not start writing code until the decomposition is explicit.
3. **Split proactively, not reactively.** Never write a module past the ~500 line limit and then split afterward. If mid-generation you realize a module will exceed its limit, stop, revise the plan to extract helper modules, and restart from the revised plan.
4. **Common split points:** Extract config structs + DF helpers into a `_config` module, extract event definitions into an `_events` module, extract view/getter functions into a `_queries` module, extract test helpers into `tests/` test-only modules.

## Structure & Style

- **Module organization:** Use `// === Section ===` headers. Order: Errors → Structs → Events → `init` → Public → View → Admin → Package → Private → Test.
- **One core object per module.** Shared primitives go in a `primitives/` subdirectory. If a module exceeds ~500 lines, extract helper logic.
- **Package naming:** `PascalCase` in `Move.toml` (`name = "CivilizationControl"`), `snake_case` for named address (`civilization_control = "0x0"`).
- **Always commit the repo-owned `Move.lock`.** Commit `contracts/civilization_control/Move.lock` for reproducible builds. This rule does not apply to vendor submodule lockfile churn.
- **Include a `README.md`** in the package root explaining purpose, key objects, and deployment instructions.

### Naming

- **Modules:** `snake_case` (`gate_extension`, `toll_collector`)
- **Structs:** `PascalCase` (`Gate`, `JumpPermit`)
- **Capabilities:** `PascalCase` + `Cap` suffix (`AdminCap`, `OwnerCap`)
- **Events:** `PascalCase` + `Event` suffix, prefer past tense (`TollCollectedEvent`, `CharacterCreatedEvent`)
- **DF key structs:** `PascalCase` + `Key` suffix (`TribeRuleKey`, `CoinTollKey`)
- **Errors:** `EPascalCase` (`ENotAuthorized`, `EGateNotOnline`)
- **Constants:** `SCREAMING_SNAKE_CASE` (`MAX_NAME_LENGTH`)
- **Functions:** `snake_case` (`issue_jump_permit`)
- **Getters:** field name directly — no `get_` prefix. Use `_mut` suffix for mutable variants (`name()`, `details_mut()`)

### Abilities

- **Ability order:** always `key, copy, drop, store` (this canonical order).
- Event structs need `copy, drop`.
- Capability structs need `key` (owned objects) or `key` (shared objects).
- Witness/auth types need only `drop`.

### Comments

- Use `///` for doc comments on public functions and structs (rendered by tooling).
- Use `//` for internal implementation notes.
- Do NOT use JavaDoc-style `/** */` — Move tooling doesn't support it.
- Doc-comment every public function. Annotate non-obvious patterns (witness, hot-potato, swap_or_fill).

### Modern Move Idioms (Move 2024)

- Use struct method syntax: `ctx.sender()` not `tx_context::sender(ctx)`.
- Use `b"hello".to_string()` not `std::string::utf8(b"hello")`.
- Use `id.delete()` not `object::delete(id)`.
- Use vector literals `vector[1, 2, 3]` not `vector::empty()` + `push_back`.
- Use `public fun` (composable) or `entry fun` (non-composable) — **never `public entry fun`**.

## Composability

- **Return objects, don't self-transfer.** Let the PTB handle `transfer::transfer`. This enables composability.
- **Exact Coin arguments** — prefer `fun f(payment: Coin<SUI>)` over `fun f(payment: &mut Coin<SUI>, amount: u64)`.
- **Collection sizing:** `vector` for ≤1000 items. Beyond that, use `Table`, `Bag`, or `ObjectTable`. Never allow unbounded vector growth.
- **Capability parameter position:** the primary object goes first, capability second — `fun set(account: &mut Account, _: &AdminCap, ...)`.

## Tests

- Place tests in the `tests/` directory (not uploaded on-chain). Mirror source structure.
- Test module name: `<module>_tests` (e.g., `gate_extension_tests`).
- Use `#[test_only]` module annotation.
- **Do NOT prefix test functions with `test_`** in `_tests` modules — describe the behavior: `toll_collection_charges_correct_amount()`.
- Merge test attributes: `#[test, expected_failure(abort_code = ENotAuthorized)]`.
- Use `tx_context::dummy()` for simple tests; `test_scenario` only for multi-tx/multi-sender.
- Use `assert_eq!` (prints both values on failure). Don't use abort codes in `assert!` in tests.
- Use `sui::test_utils::destroy` as a cleanup sink instead of custom `destroy_for_testing`.

## Auth & Access Control (verify against current world-contracts)

> These patterns were observed in a prior world-contracts version. Confirm each
> claim in the deployed contracts before coding against them.

- **Three-tier capability pattern:** World-contracts uses GovernorCap → AdminACL → OwnerCap<T>. Verify the current hierarchy and which functions require which tier.
- **Sponsor fallback:** Verify whether `verify_sponsor` falls back to `ctx.sender()` when no sponsor is present — if so, self-sponsorship may work without dual-sign when the sender is in AdminACL.
- **Permit issuance auth:** Verify what auth `issue_jump_permit` requires (extension witness only? AdminACL? OwnerCap?). Do not add auth dependencies beyond what the function signature demands.
- **Jump auth:** Verify whether `jump_with_permit` requires AdminACL sponsorship and dual-sign.
- **Extension replacement:** All three assembly types (Gate, SSU, Turret) use the same `authorize_extension<Auth>/swap_or_fill` pattern. Verify whether `authorize_extension` silently replaces an existing extension and whether any event is emitted.

> **Version-sensitive note:** `authorize_extension` has previously included a freeze guard — if extension config is frozen via `freeze_extension_config()`, further authorize calls revert with `EExtensionConfigFrozen`. Verify the current vendored implementation before relying on this behavior.

- **Turret closed-world constraint:** Turret extension `get_target_priority_list` has a fixed signature (`turret, character, candidates_bcs, receipt`). Extensions cannot access external objects (e.g., ExtensionConfig, dynamic fields). All targeting logic must derive from candidate BCS data alone. Default turret behavior already excludes same-tribe non-aggressors.

## Minimal Surface Area

- Prefer `public(package)` over `public` for state-mutating primitives.
- Add the smallest possible function surface. Compose from existing world-contracts primitives and assemblies.
- One responsibility per function. Split config reads from config writes.

## Common Code Smells

| Smell | Fix |
|-------|-----|
| `public entry fun` | Use `public fun` or `entry fun` separately |
| Self-transfers inside functions | Return the object; let PTB handle transfers |
| Unbounded `vector` from user input | Use `Table`/`Bag` for dynamic collections |
| Address arrays for access control | Use capability objects instead |
| Raw `vector<u8>` string keys for DFs | Use typed key structs with `copy, drop, store` |
| `assert!(condition, 0)` in tests | Use `assert!(condition)` or `assert_eq!` |
| `test_scenario` for single-tx tests | Use `tx_context::dummy()` instead |

## GateControl Extension Package — Reference Structure (Anti-God-File)

> **Paradox:** world-contracts requires a **single `Auth` witness type** for each assembly extension,
> but our rules forbid files over ~500 lines. The resolution: define the witness in a small `config`
> module and use `public(package)` to let sibling modules mint it. Each rule gets its own file.

### Canonical Layout

```
contracts/civcontrol/
├── Move.toml
├── README.md
└── sources/
    ├── config.move          # ~50 lines — GateAuth + TradeAuth witnesses, AdminCap, init
    ├── gate_rules.move       # ~120 lines — tribe filter + coin toll DF helpers
    ├── gate_permit.move      # ~100 lines — request_jump_permit (evaluates rules, calls gate::issue_jump_permit)
    ├── trade_post.move       # ~200 lines — listing, atomic buy, cancel
    ├── trade_events.move     # ~40 lines  — TollCollectedEvent, ListingCreatedEvent, etc.
    └── tests/
        ├── gate_rules_tests.move
        └── trade_post_tests.move
```

**Each source file stays well under 500 lines.** If `trade_post.move` grows beyond ~300 lines,
extract listing management into `trade_listing.move`.

### config.move — Witness + Init (Reference)

```move
module civcontrol::config;

use sui::dynamic_field as df;

/// Auth witness for gate extension operations.
/// drop-only — cannot be stored, copied, or transferred.
public struct GateAuth has drop {}

/// Auth witness for SSU/trade extension operations.
public struct TradeAuth has drop {}

public struct CivControlConfig has key {
    id: UID,
}

public struct AdminCap has key, store {
    id: UID,
}

fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::share_object(CivControlConfig { id: object::new(ctx) });
}

/// Mint a GateAuth witness. Callable ONLY within this package.
public(package) fun gate_auth(): GateAuth { GateAuth {} }

/// Mint a TradeAuth witness. Callable ONLY within this package.
public(package) fun trade_auth(): TradeAuth { TradeAuth {} }

// --- Dynamic field helpers for attached rule configs ---

public fun has_rule<K: copy + drop + store>(config: &CivControlConfig, key: K): bool {
    df::exists_(&config.id, key)
}

public fun borrow_rule<K: copy + drop + store, V: store>(
    config: &CivControlConfig, key: K
): &V {
    df::borrow(&config.id, key)
}

public(package) fun borrow_rule_mut<K: copy + drop + store, V: store>(
    config: &mut CivControlConfig, key: K
): &mut V {
    df::borrow_mut(&mut config.id, key)
}

public(package) fun set_rule<K: copy + drop + store, V: store>(
    config: &mut CivControlConfig, key: K, value: V
) {
    if (df::exists_(&config.id, key)) {
        let _old: V = df::remove(&mut config.id, key);
        // old value dropped
    };
    df::add(&mut config.id, key, value);
}
```

### gate_permit.move — Rule Dispatch (Reference)

```move
module civcontrol::gate_permit;

use world::gate::{Self, Gate};
use world::character::Character;
use sui::clock::Clock;
use civcontrol::config::{Self, CivControlConfig, GateAuth};
use civcontrol::gate_rules;

/// Evaluate all attached rules, then issue permit via world-contracts.
public fun request_jump_permit(
    config: &CivControlConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Rule 1: Tribe filter (if configured)
    gate_rules::enforce_tribe_rule(config, character);

    // Rule 2: Coin toll (if configured) — handled in a separate moveCall
    // so the coin argument comes from the PTB, not from this function.

    // Issue the permit through world-contracts
    gate::issue_jump_permit<GateAuth>(
        source_gate,
        destination_gate,
        character,
        config::gate_auth(),    // mint witness via public(package)
        clock.timestamp_ms() + gate_rules::get_expiry_ms(config),
        ctx,
    );
}
```

### Why This Works

| Concern | Resolution |
|---------|------------|
| **Single witness per gate** | `GateAuth` is defined once in `config.move` and used by all rule modules |
| **No god file** | Each module handles one concern: config, rules, permits, trading, events |
| **Cross-module witness minting** | `public(package) fun gate_auth()` — only sibling modules can call it |
| **<500 lines per file** | Config ~50, rules ~120, permit ~100, trade ~200, events ~40 |
| **Extensibility** | New rules = new DF key struct + new helper in `gate_rules.move` (or a new `rules/` module) |

### v0.0.15 Breaking Changes (Agent Must-Know)

These world-contracts v0.0.15 signature changes are **not in LLM training data**.
Always verify against `vendor/world-contracts` before generating call sites.

| Function | Change | Impact |
|----------|--------|--------|
| `withdraw_item<Auth>` | Added `quantity: u32` + `ctx: &mut TxContext` params | All call sites must add quantity |
| `deposit_item<Auth>` | Now asserts `parent_id == storage_unit_id` | Items cannot cross SSUs via deposit_item |
| `deposit_to_owned<Auth>` | **New function** — deposit into any player's owned inventory | Enables cross-player delivery on same SSU |
| `create_killmail` | Completely new signature (takes registry, raw u64 IDs, Character ref, u8 loss_type) | Old call sites will not compile |
