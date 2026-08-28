# Design QA

- Source visual truth: `C:\Users\liuru\Desktop\20260825105444\FC-UI\design-reference.png`
- Browser-rendered implementation: `C:\Users\liuru\Desktop\20260825105444\FC-UI\home-implementation.png`
- Density-normalized implementation: `C:\Users\liuru\Desktop\20260825105444\FC-UI\home-implementation-normalized.png`
- Side-by-side comparison: `C:\Users\liuru\Desktop\20260825105444\FC-UI\design-comparison.png`
- Route/state: `/index`, desktop homepage, default interaction state
- CSS viewport: 662 × 700; captured app-content region: 662 × 616
- Source pixels: 662 × 529
- Implementation pixels: 662 × 616
- Device pixel ratio: 1
- Density normalization: the Codex in-app browser capture showed Windows host scaling at 80%; the active 530 × 493 content region was bicubic-normalized to 662 × 616 before comparison.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: Microsoft YaHei/PingFang-compatible system stack, weights, hierarchy, nowrap behavior, and small UI labels match the reference closely. Small deadline and round labels remain slightly softer after host-scale normalization; acceptable P3 capture variance.
- Spacing and layout rhythm: hero proportions, two-column card split, card padding, dividers, badges, and status rhythm match the source. The implementation keeps a little more vertical whitespace below the cards at this capture height; acceptable because the page is responsive.
- Colors and visual tokens: navy stadium hero, royal-blue CTA, cool-gray surfaces, green/danger/orange semantic colors, borders, and shadows match the reference.
- Image quality and asset fidelity: real club badge assets are used; the Tianjin crest has transparent edges, the Shandong crest is sharp, and the stadium is a dedicated raster asset matching the source art direction. No CSS-drawn substitute imagery is present.
- Copy and content: the visual hierarchy matches the supplied design. User-requested live-data corrections intentionally replace the mock's fictional fixture, table, form, injury, and task values with public 2026 fixture, result, table, match-update, and schedule data verified on 2026-08-27.

## Full-view comparison evidence

`design-comparison.png` contains the source at left and the normalized browser render at right. Overall composition, major-region proportions, information hierarchy, color balance, and density are visibly aligned.

## Focused region comparison evidence

- Hero: compared club crests, VS lockup, date/venue line, stadium crop, and CTA placement.
- Overview panel: compared stat dividers, numeric hierarchy, result chips, scores, rounds, and footer link.
- Updates panel: compared section headers, counters, status/schedule icons, row dividers, update dates, kickoff times, and footer link.

## Comparison history

1. Initial pass — blocked.
   - P2: the hero was too tall at the reference width and the dashboard switched to one column too early.
   - P2: the first Tianjin crest asset had a white background.
   - P2: team-name wrapping pushed the away team below the hero edge.
   - Fixes: set the 3.35:1 hero proportion, delayed the stacked breakpoint to 620px, replaced the crest with a transparent PNG, resized badges, and prevented team-name wrapping.
   - Post-fix evidence: `home-implementation.png`.
2. Second pass — blocked.
   - P2: task deadlines and footer links collided at the compact reference size.
   - Fixes: tightened panel headers and rows, used bounded task columns, reduced deadline type, kept round labels on one line, and anchored footer links below content.
   - Post-fix evidence: `home-implementation-normalized.png` and `design-comparison.png`.
3. Final pass — passed.
   - No actionable P0/P1/P2 findings remain.

## Interaction and runtime checks

- Tested “进入赛前准备”; success feedback appeared.
- Tested the secondary list action; informational feedback appeared.
- Browser console errors: none.
- Production build: passed with exit code 0.
- Existing bundle-size warning remains unrelated to this page change.

## Follow-up polish

- P3: if exact subpixel matching is needed for a fixed kiosk viewport, tune the generated stadium's floodlight falloff and the hero CTA's horizontal position by a few pixels.

final result: passed
