---
description: "Use when designing or modifying CivilizationControl player-facing UI, layout, copy, states, topology, motion, or visual hierarchy."
applyTo: "src/**/*.{ts,tsx,css},docs/strategy/civilization-control/*.md,docs/ux/*.md,docs/architecture/spatial-embed-requirements.md,assets/icons/README.md"
---

# CivilizationControl Design Guidance

- Treat every player-facing surface as a command layer for sovereignty and governance, not a generic SaaS dashboard or admin console.
- Aim for calm power first, then governance, then authority. The interface should feel measured, spare, and operational.
- Keep backend and chain complexity behind simple operator actions. Normal users should see consequence and control, not protocol mechanics.
- Prioritize content in this order when space is tight: Governance > Authority > Control > Profit > Construction.
- Prefer canonical labels such as Command Overview, Gates, Trade Posts, Signal Feed, and Configuration. Avoid Dashboard, Admin, Notifications, Objects, and similar generic SaaS labels.
- Use short, factual labels and confirmations. No celebratory copy, filler, or over-explaining chain mechanics.
- Keep primary surfaces spare and high-signal. Avoid noisy panels, duplicate status text, speculative features, and decorative chrome.
- Use progressive disclosure: overview first, detail second, diagnostics last.
- Show consequence, not mere existence: policy, throughput or value, risk, and control state matter more than raw object identity.
- Treat the Strategic Network Map as a schematic governance surface, not a cinematic star map or HUD.
- Reuse the canonical topology grammar only: hexagon for network nodes, ring for gates, triangle for turrets, square-with-inner-square for trade posts.
- Encode state through overlays and semantic color, not by changing the base structure shape.
- Follow the current color doctrine: gray baseline, muted teal for online or healthy, amber for warning or defense, red for offline or denied, green for economic confirmation only, and orange only as a sparse accent or primary CTA.
- Use orange sparingly for interactive emphasis. Do not let orange become the default page accent.
- Do not use green as the default “online” status color.
- Motion exists only to explain change. Avoid decorative motion, HUD effects, starfields, scan lines, or neutral-state glows.
- New panels or controls must be product-justified. Do not expand the interface just because space is available.
- For deeper guidance, read `docs/strategy/civilization-control/civilizationcontrol-voice-and-narrative.md`, `docs/strategy/civilization-control/civilizationcontrol-hackathon-emotional-objective.md`, `docs/ux/civilizationcontrol-ux-architecture-spec.md`, `docs/ux/svg-topology-layer-spec.md`, `docs/ux/ui-polish-reference-brief.md`, `docs/architecture/spatial-embed-requirements.md`, and `assets/icons/README.md`.