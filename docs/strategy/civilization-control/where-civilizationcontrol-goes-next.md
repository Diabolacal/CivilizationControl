# Where CivilizationControl Goes Next

CivilizationControl was built during the EVE Frontier Hackathon as a working governance layer for frontier infrastructure. It is deployed on the Utopia testnet, validated against live chain state, and used to govern a fleet of structures through a browser. This document describes the practical path from hackathon project to maintained product.

---

## Stillness deployment and live hardening

Utopia has been the validation environment. The next step is deploying CivilizationControl to Stillness, the wider live player testnet where more operators and more structures create real governance pressure.

The move to Stillness is not about reaching a different kind of network. It is about operating in a larger, more active player environment where gate policies, trade settlements, and posture switches face actual traffic from players who are not the developer. Bugs that survive quiet validation tend to surface under routine use by others.

Stillness deployment means republishing the Move package, repointing the frontend to the Stillness RPC and chain ID, and running the same extension-binding and configuration flows against live structures. The publish-once, configure-via-data architecture does not change. What changes is the population using it.

---

## Better support for routine player use

One-click preset application, batch deployment across multiple gates in a single PTB, and posture-aware preset switching are already among the strongest proven parts of the product. The near-term focus is making the experience even smoother for returning operators managing growing fleets.

Near-term improvements:

- **Smoother preset reuse at scale.** When an operator adds new gates to their fleet, applying an existing preset should feel like a single gesture. Reducing onboarding friction for new structures and streamlining the most common recurring workflows helps operators scale without rethinking their setup each time.
- **Earlier extension health visibility.** Extension state detection (stale bindings, missing auth) is implemented. Surfacing that information earlier in the workflow, before an operator attempts an action that will fail, would reduce friction.
- **Signal Feed filtering.** The feed currently shows all 13 event types. Operators with large fleets will want to filter by structure, by event category, or by time window without losing digests they have not yet seen.

---

## Broader sponsored transaction coverage

Sponsored governance transactions already work for a subset of operations through the Cloudflare Worker signer. The goal is to extend sponsorship to cover all routine governance actions so that operators rarely need to think about gas.

This means expanding the sponsor-eligible operation set, improving fallback behavior when the sponsor is unavailable, and ensuring the sponsor path handles edge cases (expired transactions, concurrent requests) without silent failures.

---

## Richer policy authoring

Gate policy presets currently support tribe-specific access filters and per-tribe toll amounts. The architecture supports richer rule types without contract changes, because presets are structured dynamic fields interpreted by the extension's witness logic.

Possible directions:

- **Time-based policies.** Open a gate to allies during specific intervals, then restrict access outside those windows.
- **Conditional toll scaling.** Adjust toll amounts based on posture mode or fleet status, rather than requiring manual reconfiguration.
- **Multi-rule composition.** Allow a single preset to combine access and toll rules with fallback logic, so operators can express "tribe A free, tribe B tolled, everyone else blocked" in one object instead of layering presets.
- **Subscription and pass-style access.** Gate access sold as a time-limited pass or recurring subscription is a natural extension of the governance model. An operator could sell passage rights rather than charging per-jump tolls, giving allies or paying customers a cleaner ongoing relationship with the infrastructure. This fits the existing preset and treasury architecture without requiring new on-chain primitives.

Each of these is feasible within the current contract model. The constraint is UX clarity: richer rules need a policy editor that remains understandable to operators who do not think in terms of access control lists.

---

## Expanding infrastructure visibility

CivilizationControl already surfaces power state, extension health, event history, and revenue across the operator's fleet. The Strategic Network Map renders the full fleet topology with live overlays, and the Signal Feed folds 13 event types into readable digests with transaction proof links.

As the EVE Frontier platform evolves, more useful signals will become available. New event emissions from world contracts, additional on-chain state fields on structures, or richer metadata on assemblies would all give CivilizationControl more to surface. The architecture is built to consume these signals: the read provider abstraction, the event parser, and the digest folding pipeline are designed to accept new event types and new state queries without structural changes.

One post-hackathon refinement area is dense infrastructure display. The topology map already has foundations for grouping and handling concentrated clusters of structures. As operators deploy more infrastructure into the same systems or regions, the map needs to present those dense concentrations cleanly without visual clutter. This is a scaling and legibility refinement, not a rebuild.

The direction here is not rebuilding the visibility layer. It is extending what gets surfaced and how clearly it is presented as operator fleets grow and the platform gives us more to work with.

---

## More complete commerce workflows

TradePost handles the core case: cross-address atomic buy settlement where a buyer pays EVE, the item transfers, and revenue lands in the seller's treasury in a single PTB. This works even when the seller is offline.

Gaps that matter for ongoing use:

- **Inventory management.** Operators currently stock SSUs through standard game flows. A storefront management view that shows what is listed, what has sold, and what needs restocking would reduce the need to cross-reference between the game client and the app.
- **Price adjustment.** Changing a listed item's price currently requires removing and relisting. A direct price-update flow would save time for operators adjusting to market conditions.
- **Revenue visibility.** The revenue counter with Lux/EVE normalization is implemented. Extending it with per-item or per-structure breakdowns would help operators understand which storefronts are earning and which are idle.

---

## Contract and upgrade discipline

The CivilizationControl package has been upgraded six times on Utopia using Sui's compatible upgrade policy, without breaking deployed state or existing public function signatures. That discipline continues.

Concrete practices:

- **Additive-only upgrades.** New functions and modules are added alongside existing ones. Public function signatures are never changed. This is enforced by Sui's compatible upgrade policy and by project convention.
- **Published.toml tracking.** Every upgrade records the new package ID and digest. The frontend's constants are updated to match. Type-origin package IDs (used for dynamic field keys and event type strings) are maintained separately from the runtime package ID.
- **World-contract monitoring.** CCP's world-contracts repository and builder documentation are reviewed regularly. During active hackathon development, upstream changes were checked frequently because new primitives, event emissions, or contract capabilities could materially affect what CivilizationControl can offer. That review cadence continues post-hackathon. Newly exposed state fields, additional event types, or changes to the extension model all feed directly into what CivilizationControl builds next.
- **Upstream contribution.** An upstream proposal was submitted to the world-contracts repository before the hackathon began. Where useful gaps in the world contracts or builder tooling are identified, continuing to propose improvements upstream is part of the longer-term discipline. If a contract change, new event emission, or documentation improvement would benefit the wider builder ecosystem, contributing that back is a natural extension of building on the platform.

---

## Future: industry governance

EVE Frontier's industry systems are still maturing, but CivilizationControl's governance and control-layer architecture fits naturally as a surface for industrial infrastructure once those systems are available.

Industry would be a new category of structure under governance, alongside gates, SSUs, turrets, and network nodes. Production pipelines, resource processing, and manufacturing workflows all involve the same pattern CivilizationControl already handles: owned structures with extension-based configuration, state that needs monitoring, and operations that benefit from click-level access instead of raw transactions. The publish-once, configure-via-data model, the OwnerCap authority pattern, and the event-driven Signal Feed all apply directly to industrial structures without architectural changes.

The Strategic Network Map's SVG topology surface could be reused in a more local drill-down form: a cluster-level view centered on a single network node and its associated production structures and pipelines. Rather than the fleet-wide strategic view, this would show what is being produced, what inputs are needed, and where bottlenecks exist around a specific industrial cluster. The rendering, layout, and overlay patterns from the existing map carry over.

This is clearly future-facing. None of it is represented as current capability. But the control-layer architecture, the extension model, and the topology surface are all designed in ways that make industry governance a natural next category rather than a separate product.

---

## Long-term direction

CivilizationControl is a governance product, not a hackathon demo that happens to work. The long-term direction is straightforward: as EVE Frontier's on-chain infrastructure grows in complexity and player participation, the need for a usable control layer grows with it.

The platform will add new structure types, new economic primitives, and new interaction patterns. CivilizationControl will track those additions, extend the governance surface to cover them, and maintain the principle that infrastructure owners should be able to govern what they own from a browser, without writing code.

That is the entire thesis. Everything described above is in service of it.
