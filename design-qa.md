# Design QA

## Scope

- Reference: `design-target-dark-dashboard.png`
- Implementation: `home-implementation-dark.png`
- Comparison: `design-comparison-dark.png`
- Viewport: 1487 × 1058
- State: authenticated desktop view with live project data
- Constraint: frontend styling/layout only; existing APIs, menu data, routes, permissions, and business logic remain unchanged

## Visual comparison

- Overall direction matches the reference: near-black blue background, low-contrast panel borders, blue primary actions, restrained status colors, compact command-center density.
- Homepage hierarchy matches the reference: next match hero, season performance, recent form, team status, training, and pending schedule regions.
- Sidebar is intentionally narrower at 196px per the latest request. Active and hover states use the same blue system palette.
- Header search, fullscreen, size, avatar, and dropdown controls share one horizontal baseline and compact spacing.
- Team schedule, training management, match management, and season statistics use the same dark surface, border, text, tag, table, pagination, and button tokens.
- The reference chart was not fabricated because the current homepage API does not provide a points trend series; the existing summary data is shown without adding an API or altering data.

## Interaction checks

- Login and authenticated routing: passed
- Homepage data rendering: passed
- Team schedule route and list rendering: passed
- Training management route and table rendering: passed
- Match management route and card rendering: passed
- Season statistics route and table rendering: passed
- Sidebar collapse and restore: passed (`hideSidebar` → `openSidebar`)
- Expanded sidebar labels (including 球队日程、训练管理、比赛管理、赛季数据统计): passed without truncation
- Header tools alignment: passed
- Console error check across tested routes: no errors

## Build checks

- `git diff --check`: passed (line-ending notices only)
- `npm run build:prod`: passed
- Vite emitted the existing large-chunk advisory; it does not block the build.

final result: passed
