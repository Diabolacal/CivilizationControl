Update the existing CivilizationControl mock in place.

This is PASS 1 OF 4.
Focus ONLY on visual retheming and component color roles.
Do not redesign the layout.
Do not add new sections yet.
Do not change the information architecture.
Do not move major blocks around.
Do not rewrite copy unless needed for tiny label consistency.
Preserve the current structure and page layouts.

Goal of this pass:
Shift the UI away from a generic green SaaS dashboard look and toward a dark tactical infrastructure command interface.

The target visual feel should be:
- dark
- restrained
- operational
- tactical
- infrastructure-focused
- command-oriented

The UI should NOT feel like:
- fintech
- KPI analytics software
- startup SaaS
- friendly productivity software
- consumer web app styling

Apply this visual system consistently across all currently shown screens:

BASE PALETTE
- Use near-black / charcoal backgrounds
- Use muted slate / steel neutrals for borders, dividers, inactive surfaces, and low-emphasis metadata
- Keep the interface dark and high-contrast, but restrained

SEMANTIC COLOR ROLES
1. Amber / orange = primary product accent and active control language
Use amber/orange for:
- selected navigation state
- active tabs and filters
- primary action buttons
- selected pills/chips where relevant
- focus states
- active outlines
- active control surfaces
This amber/orange should feel muted and tactical, not bright consumer orange

2. Green = success-only semantic
Use green only for:
- positive revenue values
- positive Lux / CRDT deltas
- successful trade or toll outcomes
- healthy operating status where success is explicitly being shown
Do NOT use green as the main brand/theme color anymore

3. Red / amber-red = danger / degraded / offline / low fuel / hostile
Use for:
- warnings
- offline structures
- degraded states
- critical alerts
- losses or negative values where appropriate

4. Neutral gray / slate = structure and inactive UI
Use for:
- borders
- dividers
- secondary chips
- inactive tabs
- low-priority metadata
- subdued labels

COMPONENT RULES
- Replace all blue or purple CTA/button styling with the new amber/orange command accent system
- Restyle Connect Wallet so it feels native to the interface and no longer reads as blue/purple LLM default styling
- Restyle Configure Rules and similar primary actions to use the amber/orange system
- Keep secondary buttons subdued and neutral
- Make tags/chips feel more tactical and less like generic SaaS pills
- Slightly sharpen card and panel styling so surfaces feel more operational and less soft/friendly
- Avoid gradients, glassmorphism, pastel colors, or trendy startup styling
- Maintain strong readability

INTENT
After this pass, the interface should still be the same product with the same structure, but it should look like a dark frontier infrastructure command surface rather than a green analytics dashboard.

Important:
- preserve layout
- preserve page structure
- preserve current sections
- change visual language only
- no new map section yet
- no major structural edits yet