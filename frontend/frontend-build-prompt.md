# Build prompt: AI-Powered Block Planning frontend (SIH26027)

Build a React + TypeScript frontend for an AI-powered railway block planning system for Indian Railways (SIH26027: "AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways"). This is a hackathon prototype — no real backend exists yet, so all data must be mocked, but the code must be structured as if a real backend API will be plugged in later (clean API layer / service abstraction, typed interfaces, no logic hardcoded into components).

Read `design.md` (uploaded separately) for visual/design system reference and follow it for styling, spacing, color, and component conventions. If design.md conflicts with anything below on visual style, design.md wins. On functional behavior, this prompt wins.

## Tech stack

- React 18+ with TypeScript (strict mode)
- Vite as the build tool
- Leaflet + react-leaflet for the map (do NOT use Mapbox — no API key should be required to run this project)
- Zustand or React Context for state management (pick whichever is simpler for this scope)
- CSS modules or Tailwind (match whatever design.md specifies; default to Tailwind if unspecified)
- No backend calls of any kind — all data comes from local mock modules described below

## Core concept

A controller selects a start and end station for a railway section. The map renders that section's track, split into "block sections" (the fundamental safety unit in railway signalling — track between two signals, only one train may occupy a block at a time). The controller can then toggle between three modes that change what's displayed on the same blocks: Report mode, AI-plan mode, and Asset-availability mode.

## Screen 1: Station selection (initial state)

- Full-screen map of India on load, showing only station markers (no blocks, no track detail yet) so there's a sense of scale and context.
- Two floating dropdown/autocomplete inputs, positioned as floating UI elements over the map (not a traditional form layout) for "From station" and "To station". Populate from a mock `stations.ts` data file (create ~15-20 real Indian Railway station codes/names with real approximate lat/lng, e.g. NDLS New Delhi, AGC Agra Cantt, CNB Kanpur Central, MMCT Mumbai Central, BCT Mumbai Central, HWH Howrah, MAS Chennai Central, SBC Bengaluru, etc. — pick ones that form a few plausible real corridors).
- A "Load section" button (disabled until both stations are chosen, and disabled if the pair isn't one of the pre-defined mock corridors — see below).
- On submit: fetch (mock) the block GeoJSON for that pair (see Mock data section), fit the map bounds to the returned geometry, and transition into Screen 2.

## Screen 2: Section view (main app screen)

Full-screen map is the entire background/canvas. All controls are floating elements layered on top (cards/panels with subtle elevation/shadow, per design.md), never a traditional sidebar-pushes-content layout. The map should always occupy 100% of the viewport beneath the floating UI.

### Floating elements required:

1. **Top-left or top-center: mode switcher** — a segmented control / toggle group with three options: "Report", "AI Plan", "Asset View". Only one active at a time. Switching modes should re-style the block layer (color-coding changes) based on mode-specific mock data — simulate this as if it were a lazy-loaded API call (i.e. show a brief loading state, ~300-600ms artificial delay, then apply).
2. **Top-right: dark mode / light mode toggle** — persists via localStorage. Map tile layer should also switch (use a light and dark tile provider — e.g. CartoDB Positron for light, CartoDB Dark Matter for dark — both are free, no-API-key raster tile sets suitable for this).
3. **Bottom-left or a corner: "change section" button** — returns to Screen 1 to pick a new station pair.
4. **Legend** — small floating card showing what the current mode's colors mean (e.g. in Report/live mode: free/occupied/reserved/fault; in Asset mode: a small gradient or bucketed color scale for idle time).

### Mode behaviors:

**Report mode:**
- Blocks are clickable (cursor pointer, hover highlight state on the block's line).
- A block can have MULTIPLE simultaneous issues (e.g. a signal fault AND a speed restriction on the same block at once). Do not model status as a single flat string driven directly by one report — see the "Issues data model" section below for the required schema.
- Clicking a block opens a floating panel/modal (not a full-page form) with two sections:
  1. **Existing issues list** (if any): each issue shown as a small card with issue type, description, severity, reported_by, timestamp, and a "Resolve" button to dismiss it (removes it from the block's issues array, purely client-side/mock).
  2. **Add new issue form** (always available, below the existing list): issue type dropdown (Obstruction, Signal fault, Speed restriction, Track maintenance, Other), severity dropdown (Low, Medium, High), free-text description field, submit button.
- On submit: append the new issue to that block's `issues` array (do not overwrite existing issues) and `console.log()` the submitted payload in this shape:
```ts
{
  block_id: string;
  issue_type: string;
  description: string;
  severity: "low" | "medium" | "high";
  reported_by: "controller_demo";
  timestamp: string; // ISO
}
```
- After submit, keep the panel open (so the user sees their new issue added to the list) or close with a toast confirmation — either is fine, but the map must immediately reflect the change: recompute that block's derived `status`/color from its updated `issues` array (see below) — simulate as if the backend responded.
- Blocks are color-coded by a DERIVED status, computed from the `issues` array plus base occupancy state, not a single raw field:
  - No issues + occupied by a train → occupied color (strong accent, e.g. from design.md's primary)
  - No issues + reserved → reserved color (distinct secondary)
  - No issues + nothing occupying → free (neutral/gray)
  - Any issue present with severity "high" → fault/red, regardless of occupancy
  - Only issues present with severity "low"/"medium" and no "high" → a distinct "degraded" color (e.g. amber), to visually differentiate "minor problem, still usable" from "blocked entirely"
  - Write this derivation as a small pure function, e.g. `getDerivedStatus(block: BlockProperties): DerivedStatus`, so it's reused consistently by both the map styling and the legend.

**AI Plan mode:**
- Blocks are NOT clickable for reporting in this mode (read-only view).
- Blocks are color-coded/labeled by which train is planned into them next, with a small on-hover tooltip showing: assigned train ID, planned entry time, planned exit time.
- Use a consistent color per train ID (a small palette, reused if there are more trains than colors) so users can visually trace one train's planned path across multiple blocks.

**Asset View mode:**
- Blocks are NOT clickable.
- Blocks are color-coded by a continuous scale (e.g. light to dark, or a 3-5 bucket scale) representing "asset idle time contributed by this block" in minutes — mock this data per block.
- Hover tooltip shows exact idle minutes and which asset (locomotive/rake ID) is affected.

## Mock data requirements

Create a `mockData/` folder with clearly typed, realistic mock data:

1. `stations.ts` — array of `{ code: string; name: string; lat: number; lng: number }`.
2. `blockSections.ts` — a function `getBlockSectionsForRoute(fromCode: string, toCode: string): BlockFeatureCollection | null` that returns pre-defined mock GeoJSON for 2-3 hardcoded station pairs only (e.g. NDLS→AGC, MAS→SBC). Return `null`/throw a clear error for any other pair, and have Screen 1 disable/reject unsupported pairs gracefully with a message like "Demo data only available for: [list pairs]".
   - Each route should have realistic-looking curved LineString geometry (don't just draw a straight line between two points — interpolate a few intermediate coordinate points to look like a real curved rail corridor), split into 15-30 block Features.
   - GeoJSON shape must follow this TypeScript interface exactly:
```ts
interface BlockIssue {
  issue_id: string;
  issue_type: "obstruction" | "signal_fault" | "speed_restriction" | "maintenance" | "other";
  description: string;
  severity: "low" | "medium" | "high";
  reported_by: string;
  timestamp: string; // ISO
}

type DerivedStatus = "free" | "occupied" | "reserved" | "degraded" | "fault";

interface BlockProperties {
  block_id: string;
  sequence: number;
  start_signal: string;
  end_signal: string;
  occupancy: "free" | "occupied" | "reserved"; // base occupancy state, independent of issues
  issues: BlockIssue[]; // zero or more simultaneous issues on this block
  train_id?: string;
  length_m: number;
}

interface BlockFeature {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] }; // [lng, lat]
  properties: BlockProperties;
}

interface BlockFeatureCollection {
  type: "FeatureCollection";
  features: BlockFeature[];
}
```

### Issues data model (important)

A block's visual/derived status is NEVER stored directly — it's always computed from `occupancy` + `issues`, via a shared pure function:

```ts
function getDerivedStatus(props: BlockProperties): DerivedStatus {
  if (props.issues.some(i => i.severity === "high")) return "fault";
  if (props.issues.length > 0) return "degraded";
  return props.occupancy; // "free" | "occupied" | "reserved"
}
```

This function must live in a shared `utils/` module and be the single source of truth used by: map layer styling, the legend, and the report panel's summary badge. Never duplicate this logic inline in a component. Seed at least one mock block in the initial data with 2+ simultaneous issues of different severities, to demonstrate the multi-issue case out of the box.
3. `aiPlanData.ts` — mock function returning per-block `{ block_id: string; train_id: string; entry_time: string; exit_time: string }[]` for the loaded route, simulating an AI-plan-mode API response.
4. `assetData.ts` — mock function returning per-block `{ block_id: string; idle_minutes: number; asset_id: string }[]`.

All three mock "API" functions should be `async` and include an artificial `setTimeout` delay (300-600ms) to simulate network latency, even though they're local — this makes loading states real and demoable.

## Architecture requirements

- Create a thin `services/api.ts` layer wrapping all the mock data calls behind function signatures that look like real API calls (e.g. `fetchStations()`, `fetchBlockSection(from, to)`, `fetchAiPlan(sectionId)`, `fetchAssetData(sectionId)`, `submitBlockReport(payload)`). Components should call these service functions, never import mock data directly — this makes swapping in a real backend later a one-file change.
- Keep a `block_id -> Leaflet layer` reference map so mode/status updates can restyle existing layers without re-parsing geometry (per the architecture we discussed: geometry is fetched once, everything else is a lightweight patch).
- Type everything. No `any`. Export shared types from a central `types/` folder.
- Component structure should roughly be: `MapCanvas`, `StationSelector`, `ModeSwitcher`, `ThemeToggle`, `Legend`, `ReportPanel`, `BlockTooltip` — as separate components, not one giant file.

## Non-functional requirements

- Map performance: since blocks per section are ~15-30 LineStrings, this is small — no special virtualization needed, but avoid re-rendering the entire GeoJSON layer on every state change; only restyle affected layers.
- Fully responsive is NOT required (this is a control-room desktop tool), but it should look correct on a standard laptop screen (1366x768 and up).
- Include a README section (as a comment block or separate file) noting: no backend is connected, all data is mocked, and where a real backend would plug in (the `services/api.ts` file).

## What NOT to build

- No authentication/login screens.
- No multi-day/multi-section split-screen — single active section at a time.
- No real Indian Railways track geometry (approximate/illustrative curves are fine and expected — state this as a known simplification in the code comments).
- No WebSocket/real-time push simulation — polling or manual mode-switch refetch only, per our discussion.

Build this as a complete, runnable Vite project (package.json, vite.config.ts, all source files). Prioritize getting the map + mode toggle + report flow fully working end-to-end over polishing every visual detail — but do follow design.md's color/spacing tokens where applicable.
