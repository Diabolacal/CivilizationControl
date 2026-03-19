Update the existing CivilizationControl mock in place.

This is PASS 4 OF 4.
This is the final polish pass.

Do not redesign the app.
Do not change the information architecture.
Do not make major structural changes.
Do not remove the Strategic Network panel.
Do not revisit the overall theme again.
Preserve the current dark tactical command identity and the current page structures.

Primary goal of this pass:
Polish the mock so it feels intentionally composed, production-minded, and demo-ready for a 1440p primary layout, while still allowing compact mode to later serve 1080p users.

Important layout principle:
Treat the current “comfortable” layout as the primary 1440p presentation mode.
Do not optimize the default layout around 1080p constraints in this pass.
Instead, make the comfortable/default presentation look balanced, readable, and authoritative on a 1440p desktop canvas.
Assume compact mode will later be the accommodation path for 1080p users.

WHAT TO FOCUS ON IN THIS PASS

1. 1440P-FIRST HIERARCHY AND VIEWPORT COMPOSITION
Refine spacing, section rhythm, and visual hierarchy so the dashboard feels composed at 1440p.
Goals:
- the Command Overview should feel intentionally framed, not loosely stacked
- top metrics, Strategic Network, Recent Signals, and Attention Required should feel like one coherent command page
- preserve single-page readability for demo purposes
- avoid unnecessary vertical sprawl
- tighten dead space where helpful, but do not make the screen cramped
- maintain a strong visual center of gravity in the main content column

Do not redesign the page.
Only tune spacing, heights, section rhythm, and hierarchy so the page feels cleaner and more deliberate.

2. DENSITY SYSTEM DISCIPLINE
Refine the current density so it feels deliberate rather than incidental.
Use this principle:
- comfortable mode = primary 1440p command layout
- compact mode = future 1080p accommodation mode

For this pass:
- make sure tables, cards, panels, and logs feel consistent with a comfortable but dense tactical interface
- do not let any page feel too airy or too loose
- do not over-compress the UI either
- tune row heights, panel padding, chip sizing, and section spacing for consistency

The result should feel:
- efficient
- serious
- readable
- demo-friendly
- not bloated
- not cramped

3. FINAL HIERARCHY POLISH
Across all shown pages, tighten hierarchy for:
- section titles
- subtitles / helper text
- card headings
- table headers
- metadata labels
- badges/chips
- accordion labels
- summary card labels

Aim for a more authoritative command tone and cleaner hierarchy.
Important metrics and operational states should pop first.
Secondary metadata should recede more cleanly.

4. SMALL COPY CORRECTIONS ONLY
Do not rewrite the product.
Do only light polish to remove any wording that still sounds too generic, too template-like, or too SaaS-admin-like.

Good direction:
- precise
- operational
- infrastructure-focused
- command-oriented

Examples of the kind of refinement allowed:
- improve a subtitle if it reads too generic
- tighten button labels if they feel too ordinary
- improve a section label if it sounds like a template
- make telemetry/log wording slightly more operational if needed

Do not overdo this.
Visual hierarchy is more important than copy changes in this pass.

5. COMPONENT POLISH
Do a final consistency sweep across:
- button weights and padding
- chip sizing and border treatment
- icon size consistency
- border visibility
- panel header treatment
- readout card styling
- table header emphasis
- accordion/header consistency
- selected-state clarity
- muted text balance

Keep everything restrained.
Avoid adding more visual noise.
Avoid dramatic contrast increases.
This is about refinement, not escalation.

6. DASHBOARD-SPECIFIC TUNING
On Command Overview specifically:
- ensure the Revenue card still reads clearly but does not dominate the emotional center
- ensure the Strategic Network panel feels like a primary surface
- ensure Recent Signals feels important but not louder than the map/posture layer
- ensure Attention Required reads as actionable oversight, not visual leftovers
- make the overall page feel balanced and intentional on a 1440p screen

7. NON-OVERVIEW PAGE POLISH
On Gates, Gate Detail, and Signal Feed:
- preserve the current structure
- refine spacing and hierarchy so they feel equally finished
- keep them visually aligned with Command Overview
- make sure none of these pages still feel like remnants of a dashboard template

FINAL OBJECTIVE
After this pass, the mock should feel:
- demo-ready
- 1440p-first in its comfortable/default presentation
- visually disciplined
- coherent across pages
- less template-derived
- more like a deliberate frontier infrastructure command product

Important:
- preserve existing structure
- preserve current theme
- no new major features
- no structural redesign
- polish hierarchy, density, spacing, and wording only