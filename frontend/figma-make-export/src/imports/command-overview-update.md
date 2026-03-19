Update the existing CivilizationControl mock in place.

This is PASS 2 OF 4.
Focus ONLY on Command Overview composition and adding a new strategic map panel.
Do not redesign the whole product.
Do not change the information architecture.
Do not restyle every page globally again.
Keep the current tactical dark/orange visual language from the previous pass, but use this pass to rebalance layout emphasis.

Primary goal of this pass:
Make the Command Overview read as a frontier infrastructure command surface rather than a revenue dashboard.

Important constraints:
- Preserve the existing left navigation
- Preserve the existing page shell and spacing rhythm
- Keep the current top row of four metric cards
- Keep Recent Signals and Attention Required on the Command Overview
- Do not remove any current sections
- Do not build a fully detailed real map implementation
- Add a mock strategic network panel only

TOP-LEVEL CHANGE REQUIRED
Insert a new wide strategic map panel directly below the four top metric cards and directly above Recent Signals.

Placement requirements:
- same content width as Recent Signals
- centered within the existing main content column
- approximately similar height to Recent Signals, or slightly taller if needed
- it must feel like a major dashboard section, not a tiny widget
- keep everything on one readable page for demo purposes

PURPOSE OF THE NEW PANEL
This new panel is a strategic infrastructure / topology view.
It should communicate:
- owned infrastructure
- network links
- command visibility
- posture control
- system-wide governance

It should NOT look like:
- a decorative illustration
- a geographic fantasy map
- a bright infographic
- a generic analytics chart

MAP PANEL VISUAL REQUIREMENTS
Create a mock schematic network view inside the panel using simple placeholder visual elements only.
No need for final SVG assets in this pass.

Use:
- dark background consistent with the current UI
- subtle topology / grid / node-link / network feel
- a small set of clearly readable structure nodes
- visible links between nodes
- selected / controlled structures highlighted in muted amber/orange
- neutral inactive structures in subdued slate/gray
- optional limited green only where semantically useful for healthy revenue-producing paths
- optional red/amber-red where useful for degraded/offline/hostile structure state

The map should feel like a command surface, not a decorative map.

POSTURE CONTROLS
Within the strategic map panel, add a visible control area for infrastructure posture.

Add these controls:
- Open for Business
- Defense Mode
- Save Preset (secondary action, optional but preferred)

Control behavior in the mock:
- Open for Business should read as the normal commercial posture
- Defense Mode should read as an infrastructure-wide defensive posture
- Defense Mode should feel more operational and serious than a standard app toggle
- these should look like command controls, not generic SaaS buttons

Use the current amber/orange command language for the active/primary posture control.
Keep secondary actions subdued.

COMMAND OVERVIEW REBALANCING
Do not remove the Revenue card, but reduce its emotional dominance slightly through composition.
The page should now read in this order:
1. top metrics
2. strategic map / command posture panel
3. Recent Signals
4. Attention Required

Recent Signals should still be important, but once the map panel is added, the page should feel more like command + oversight than finance + logs.

RECENT SIGNALS ADJUSTMENT WITHIN THIS PASS
Do only minimal tuning here:
- keep the table where it is
- do not redesign it fully
- reduce any unnecessary full-row amber fills if they make success events look like warnings or command states
- positive/completed economic events should be readable as positive outcomes, not as alert-state rows
- preserve the tactical feel

ATTENTION REQUIRED
Keep it where it is.
No major redesign needed in this pass.
Just ensure it still sits cleanly below Recent Signals after the new map panel is inserted.

COPY / LABELING
Do not rewrite the product broadly.
Only add a concise title/subtitle for the new map panel if needed.
Good examples of tone:
- Network Command
- Strategic Network
- Infrastructure Posture
- Controlled Topology

FINAL OBJECTIVE
After this pass, the Command Overview should feel like:
- a command console for governed infrastructure
- a place where the operator can see the network
- a place where the operator can switch posture across owned structures
- a page where revenue is visible but not the sole focal point

Important:
- preserve current design language
- preserve structure
- add the strategic map panel
- rebalance the page toward infrastructure command
- do not overcomplicate the map
- placeholder/mock network view is sufficient for now