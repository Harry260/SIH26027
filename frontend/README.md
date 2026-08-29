# AI-Powered Automatic Block Planning (Indian Railways - SIH26027)

A React 18 + TypeScript + Vite frontend for Indian Railways automatic block signaling and AI-powered train dispatch planning.

---

## ⚡ Tech Stack & Architecture

- **Framework**: React 18+ (Strict Mode) + TypeScript
- **Build Tool**: Vite
- **Mapping & GIS**: Leaflet + `react-leaflet` with free **CartoDB Positron** (Light) & **CartoDB Dark Matter** (Dark) raster tiles (zero API key required).
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Custom Apple Design System tokens (`DESIGN.md` / `taste-SKILL.md`)
- **Icons**: Lucide React

---

## 🔌 Backend Connectivity & Mock Architecture

> [!NOTE]
> Currently, **no live backend is connected**; all stations, block LineStrings, AI dispatch schedules, and asset utilization metrics are served locally via high-fidelity mock modules under `src/mockData/` with simulated network latency (300–600ms).

### Where to plug in a real backend API:
All data fetching and incident submission operations are decoupled inside **[`src/services/api.ts`](file:///home/harry/Projects/SIH26027/frontend/src/services/api.ts)**.

To connect this application to a real backend (e.g. FastAPI, Spring Boot, Go, or Express):
1. Open `src/services/api.ts`.
2. Replace mock function implementations with standard `fetch()` or `axios` calls pointing to your backend endpoints:
   - `fetchStations()` $\rightarrow$ `GET /api/v1/stations`
   - `fetchSupportedCorridors()` $\rightarrow$ `GET /api/v1/corridors`
   - `fetchBlockSection(from, to)` $\rightarrow$ `GET /api/v1/sections/:from/:to/blocks`
   - `fetchAiPlan(corridorId, blockIds)` $\rightarrow$ `POST /api/v1/ai/dispatch-plan`
   - `fetchAssetData(corridorId, blockIds)` $\rightarrow$ `GET /api/v1/assets/utilization`
   - `submitBlockReport(payload)` $\rightarrow$ `POST /api/v1/blocks/incidents`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🎯 Key Features & Modes

1. **Screen 1: Station Selection**:
   - Full-screen India map showing major hub nodes.
   - Floating frosted-glass selector with autocomplete search and one-click corridor presets (NDLS ↔ AGC, MAS ↔ SBC, MMCT ↔ BRC).

2. **Screen 2: Section View**:
   - **Report Mode**: Clickable railway blocks. Shows multi-issue cards, resolve actions, incident reporting form, and pure derived status derivation (`getDerivedStatus`).
   - **AI Plan Mode**: Color-coded train allocations across sequential blocks with tooltips showing planned entry/exit time windows, speeds, and headway.
   - **Asset View Mode**: Multi-step idle delay continuous scale (0m–120m+) with telemetry details for locomotives and rakes.
   - **Dark / Light Theme Toggle**: Persists in `localStorage` and synchronizes map tile layers.

