# Indian Railways AI Automatic Block Planning — API & Schema Reference (SIH26027)

This document is the definitive specification for the **SIH26027 JSON-RPC API and Data Models**. It is designed to allow any engineer or team member to implement or integrate compatible backend services, optimization solvers, and frontend clients.

---

## 1. Architectural Principles & Protocol Rules

### 1.1 JSON-RPC Response Protocol
Every endpoint returns an HTTP `200 OK` status code (unless an endpoint path does not exist, which returns standard `404 Not Found`). All application payloads and business errors are wrapped in a standard JSON envelope:

#### Success Response
```json
{
  "status": "ok",
  "data": { ... }
}
```

#### Error Response
```json
{
  "status": "error",
  "data": {
    "message": "Human-readable error description"
  }
}
```

---

### 1.2 Integer Identifier Standard
Every entity identifier across the entire system is strictly an **Integer (`number`)**:
- `TrainId`: Integer train number (e.g., `12002`, `12301`, `22436`)
- `TripId`: Integer trip schedule ID (e.g., `501`, `502`)
- `ResourceId`: Integer physical section/track/platform ID (e.g., `1001`, `1131`)
- `IssueId`: Integer incident telemetry ID (e.g., `1001`, `1002`)
- `StationId`: Integer station node ID (e.g., `1` for NDLS, `13` for AGC)
- `CorridorId`: Integer route ID (e.g., `101` for NDLS_AGC)

---

### 1.3 Time Standards
1. **Relative Time (`Time = number`)**:
   - Represents integer minutes from midnight (`0..1440`).
   - Example: `600` = `10:00 AM`, `605` = `10:05 AM`, `750` = `12:30 PM`.
   - Used for: `entry_time`, `exit_time`, `arrival`, `departure`, `min_dwell`, `time_start`, `time_end`, `start`, `end`.
2. **Absolute Time (`string`)**:
   - Represents ISO8601 UTC timestamp strings.
   - Example: `"2026-09-15T04:30:00.000Z"`.
   - Used for: `start_time` (Trip start) and `timestamp` (Issue reported time).

---

### 1.4 AI Severity Prediction & Manual Override
- When filing an incident on a resource (`POST /api/resource/:resourceid/issue`), the `severity` field is **optional**.
- **Default Behavior**: If `severity` is omitted or `null`, the backend automatically infers/predicts the severity (`low`, `medium`, `high`) using issue type and NLP/heuristics on the description (e.g., *obstruction*, *derailment*, *broken rail*, *emergency* $\to$ `high`; *TSR*, *caution*, *signal glitch* $\to$ `medium`; *maintenance* $\to$ `low`).
- **Manual Override**: If an operator explicitly specifies `severity` in the request body, the backend honors the override.
- The response returns `{ "status": "ok", "data": { "issue_id": 1001, "severity": "high" } }`.

---

## 2. Complete Data Models & Type Definitions

```typescript
// ==========================================
// SIH26027 Type Definitions (TypeScript)
// ==========================================

// JSON-RPC Generic Envelope
export interface ApiResponse<T = any> {
  status: "ok" | "error";
  data: T;
}

// Integer Identifiers
export type TrainId = number;
export type TripId = number;
export type ResourceId = number;
export type IssueId = number;
export type StationId = number;
export type CorridorId = number;

// Relative time in minutes from midnight (0..1440)
export type Time = number;

// ------------------------------------------
// Train & Trip Entities
// ------------------------------------------
export interface Train {
  id: TrainId;
  name: string;
  max_speed_kmh?: number;
  priority_tier?: "Premier" | "Express" | "Freight";
}

export interface TripStationStop {
  station_id: StationId;
  station_code: string;
  arrival: Time;     // Relative minutes (0..1440)
  departure: Time;   // Relative minutes (0..1440)
  min_dwell: Time;   // Minimum dwell time in minutes
}

export interface ResourceAllocation {
  resource_id: ResourceId;
  entry_time: Time;            // Relative minutes
  exit_time: Time;             // Relative minutes
  planned_speed_kmh: number;   // Calculated traversal speed
  headway_seconds: number;     // Headway spacing to preceding train
}

export interface Trip {
  id: TripId;
  train: TrainId;
  train_name?: string;
  start_time: string;          // ISO8601 absolute timestamp
  stations: TripStationStop[];
  resource_allocations?: ResourceAllocation[];
}

// ------------------------------------------
// Resource Entities (Tracks, Blocks, Platforms)
// ------------------------------------------
export type ResourceKind = "track" | "platform" | "junction" | "block_section";

export interface Resource {
  id: ResourceId;
  kind: ResourceKind;
  lane_count: number;
}

export interface ResourceInfo {
  resource: Resource;
  name: string;
  sequence: number;
  location: [number, number];       // [lng, lat] centroid
  coordinates: [number, number][];   // [[lng, lat], ...] GeoJSON LineString
  length_m: number;
  max_speed_kmh: number;
  gradient?: string;
  occupancy: "free" | "occupied" | "reserved";
  active_train?: TrainId;
  train_name?: string;
  issues: BlockIssue[];
}

// ------------------------------------------
// Issue & Incident Telemetry
// ------------------------------------------
export type IssueType =
  | "obstruction"
  | "signal_fault"
  | "speed_restriction"
  | "maintenance"
  | "other";

export type IssueSeverity = "low" | "medium" | "high";

export interface BlockIssue {
  issue_id: IssueId;
  issue_type: IssueType;
  description: string;
  severity: IssueSeverity;
  reported_by: string;
  timestamp: string; // ISO8601
}

export interface SubmitIssueBody {
  issue_type: IssueType;
  description: string;
  severity?: IssueSeverity; // Optional: AI-predicted in backend if omitted
  reported_by?: string;
  timestamp?: string;
}

// ------------------------------------------
// Maintenance & Resource Blocks
// ------------------------------------------
export interface RepairRequest {
  resource_id: ResourceId;
  time_start: Time;  // Relative minutes
  time_end: Time;    // Relative minutes
}

export interface ResourceBlock {
  resource_id: ResourceId;
  start: Time;       // Relative minutes
  end: Time;         // Relative minutes
}

// ------------------------------------------
// Timetable Optimization (LP Solver Interface)
// ------------------------------------------
export interface TimetableInput {
  trips: Trip[];
  resources: Resource[];
  repairs: RepairRequest[];
}

export interface TimetableOutput {
  trips: Trip[];
}

// ------------------------------------------
// Station & Corridor Metadata
// ------------------------------------------
export interface Station {
  id: StationId;
  code: string;
  name: string;
  division?: string;
  state: string;
  zone: string;
  lat: number;
  lng: number;
  isHub?: boolean;
}

export interface RouteCorridor {
  id: CorridorId;
  code: string;
  fromCode: string;
  toCode: string;
  name: string;
  zone: string;
  distance_km: number;
  total_blocks: number;
  description: string;
}

export type DerivedStatus = "free" | "occupied" | "reserved" | "degraded" | "fault";
export type AppMode = "report" | "ai-plan";
```

---

## 3. Complete API Endpoint Reference

### 3.1 `GET /api/health`
Health check and system telemetry.

- **Method**: `GET`
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "uptime": 128.45,
    "timestamp": "2026-09-15T11:30:00.000Z",
    "memoryUsage": {
      "rss": 76857344,
      "heapTotal": 10199040,
      "heapUsed": 8728544
    }
  }
}
```

---

### 3.2 `GET /api/stations`
Fetches the master list of all railway stations with coordinates and integer IDs.

- **Method**: `GET`
- **Response**:
```json
{
  "status": "ok",
  "data": [
    {
      "id": 1,
      "code": "NDLS",
      "name": "New Delhi",
      "division": "Delhi",
      "state": "Delhi",
      "zone": "NR",
      "lat": 28.6143,
      "lng": 77.2189,
      "isHub": true
    },
    {
      "id": 13,
      "code": "AGC",
      "name": "Agra Cantt",
      "division": "Agra",
      "state": "Uttar Pradesh",
      "zone": "NCR",
      "lat": 27.1591,
      "lng": 77.9944,
      "isHub": true
    }
  ]
}
```

---

### 3.3 `GET /api/corridors`
Fetches all supported and modeled high-density rail corridors.

- **Method**: `GET`
- **Response**:
```json
{
  "status": "ok",
  "data": [
    {
      "id": 101,
      "code": "NDLS_AGC",
      "fromCode": "NDLS",
      "toCode": "AGC",
      "name": "New Delhi ↔ Agra Cantt High-Density Corridor",
      "zone": "Northern / NCR Railway",
      "distance_km": 195,
      "total_blocks": 20,
      "description": "High-speed quadruple automatic block signaling section."
    }
  ]
}
```

---

### 3.4 `GET /api/corridors/:corridor`
Retrieves or dynamically initializes all track resources, block geometry coordinates, and active trains for a corridor.

- **Method**: `GET`
- **URL Parameter**: `corridor` (string, e.g. `NDLS_AGC`)
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "corridor": "NDLS_AGC",
    "meta": {
      "id": 101,
      "code": "NDLS_AGC",
      "fromCode": "NDLS",
      "toCode": "AGC",
      "name": "New Delhi ↔ Agra Cantt High-Density Corridor",
      "zone": "Northern / NCR Railway",
      "distance_km": 195,
      "total_blocks": 16,
      "description": "High-speed quadruple automatic block signaling section."
    },
    "trains": [
      {
        "id": 12002,
        "name": "Bhopal Shatabdi Express",
        "max_speed_kmh": 150,
        "priority_tier": "Premier"
      },
      {
        "id": 22436,
        "name": "Vande Bharat Express",
        "max_speed_kmh": 160,
        "priority_tier": "Premier"
      }
    ],
    "resources": [
      {
        "resource": {
          "id": 1131,
          "kind": "block_section",
          "lane_count": 2
        },
        "name": "ABS-NDLS-100UP",
        "sequence": 1,
        "location": [77.233365, 28.564161],
        "coordinates": [
          [77.2189, 28.6143],
          [77.226025, 28.589194],
          [77.233365, 28.564161],
          [77.241175, 28.539459],
          [77.249284, 28.514917]
        ],
        "length_m": 1000,
        "max_speed_kmh": 130,
        "gradient": "Level",
        "occupancy": "free",
        "issues": []
      }
    ]
  }
}
```

---

### 3.5 `GET /api/train/:trainid`
Fetches metadata for an individual train by integer ID.

- **Method**: `GET`
- **URL Parameter**: `trainid` (integer, e.g. `12002`)
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "id": 12002,
    "name": "Bhopal Shatabdi Express",
    "max_speed_kmh": 150,
    "priority_tier": "Premier"
  }
}
```

---

### 3.6 `GET /api/resource/:resourceid`
Fetches real-time status, geometry, telemetry, and active issues for an individual resource.

- **Method**: `GET`
- **URL Parameter**: `resourceid` (integer, e.g. `1131`)
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "resource": {
      "id": 1131,
      "kind": "block_section",
      "lane_count": 2
    },
    "name": "ABS-NDLS-100UP",
    "sequence": 1,
    "location": [77.233365, 28.564161],
    "coordinates": [
      [77.2189, 28.6143],
      [77.249284, 28.514917]
    ],
    "length_m": 1000,
    "max_speed_kmh": 130,
    "gradient": "Level",
    "occupancy": "free",
    "issues": []
  }
}
```

---

### 3.7 `GET /api/resource/:resourceid/issue`
Fetches all active issues filed against a specific resource.

- **Method**: `GET`
- **URL Parameter**: `resourceid` (integer, e.g. `1131`)
- **Response**:
```json
{
  "status": "ok",
  "data": [
    {
      "issue_id": 1001,
      "issue_type": "signal_fault",
      "description": "Signal aspect 3 lamp failure",
      "severity": "medium",
      "reported_by": "Chief Section Controller",
      "timestamp": "2026-09-15T11:45:00.000Z"
    }
  ]
}
```

---

### 3.8 `POST /api/resource/:resourceid/issue`
Reports an incident on a track or block resource. Severity is **optional** and automatically predicted by the backend if omitted.

- **Method**: `POST`
- **URL Parameter**: `resourceid` (integer, e.g. `1131`)
- **Headers**: `Content-Type: application/json`

#### Request Body (Auto Severity Prediction)
```json
{
  "issue_type": "obstruction",
  "description": "Heavy boulder fallen across track near km 12.4",
  "reported_by": "Chief Section Controller"
}
```

#### Request Body (Manual Severity Override)
```json
{
  "issue_type": "maintenance",
  "description": "Scheduled tie replacement",
  "severity": "low",
  "reported_by": "Permanent Way Inspector"
}
```

#### Response
```json
{
  "status": "ok",
  "data": {
    "issue_id": 1001,
    "severity": "high"
  }
}
```

---

### 3.9 `DELETE /api/resource/:resourceid/issue/:issueid`
Resolves and clears an incident from a resource.

- **Method**: `DELETE`
- **URL Parameters**:
  - `resourceid`: integer (e.g. `1131`)
  - `issueid`: integer (e.g. `1001`)
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "resolved": true
  }
}
```

---

### 3.10 `POST /api/resource/:resourceid/block`
Reserves a maintenance time window (block) on a resource.

- **Method**: `POST`
- **URL Parameter**: `resourceid` (integer, e.g. `1131`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "resource_id": 1131,
  "start": 600,
  "end": 660
}
```
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "success": true
  }
}
```

---

### 3.11 `POST /api/plan` (LP Timetable Solver)
Optimizes conflict-free train dispatching across track resources given trips, resources, and maintenance repair requests.

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "trips": [
    {
      "id": 501,
      "train": 12301,
      "start_time": "2026-09-15T04:30:00.000Z",
      "stations": [
        {
          "station_id": 1,
          "station_code": "NDLS",
          "arrival": 600,
          "departure": 605,
          "min_dwell": 5
        },
        {
          "station_id": 13,
          "station_code": "AGC",
          "arrival": 656,
          "departure": 666,
          "min_dwell": 10
        }
      ]
    }
  ],
  "resources": [
    {
      "id": 1131,
      "kind": "block_section",
      "lane_count": 2
    },
    {
      "id": 1132,
      "kind": "block_section",
      "lane_count": 2
    }
  ],
  "repairs": [
    {
      "resource_id": 1131,
      "time_start": 700,
      "time_end": 760
    }
  ]
}
```
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "trips": [
      {
        "id": 501,
        "train": 12301,
        "train_name": "Howrah Rajdhani Express",
        "start_time": "2026-09-15T04:30:00.000Z",
        "stations": [
          {
            "station_id": 1,
            "station_code": "NDLS",
            "arrival": 600,
            "departure": 605,
            "min_dwell": 5
          },
          {
            "station_id": 13,
            "station_code": "AGC",
            "arrival": 656,
            "departure": 666,
            "min_dwell": 10
          }
        ],
        "resource_allocations": [
          {
            "resource_id": 1131,
            "entry_time": 605,
            "exit_time": 607,
            "planned_speed_kmh": 129,
            "headway_seconds": 339
          },
          {
            "resource_id": 1132,
            "entry_time": 608,
            "exit_time": 611,
            "planned_speed_kmh": 123,
            "headway_seconds": 187
          }
        ]
      }
    ]
  }
}
```

---

### 3.12 `GET /api/plan?corridor=:corridor`
Helper endpoint to retrieve or solve the pre-computed timetable for a specific corridor.

- **Method**: `GET`
- **Query Parameter**: `corridor` (string, e.g. `NDLS_AGC`)
- **Response**:
```json
{
  "status": "ok",
  "data": {
    "trips": [ ... ]
  }
}
```

---

## 4. Frontend & Status Derivation Rules

### 4.1 Derived Status Calculation
The visual operational status of a block section is **never stored directly**; it is derived as a pure function from `occupancy` and `issues`:

```typescript
export function getDerivedStatus(resourceInfo: ResourceInfo): DerivedStatus {
  if (!resourceInfo) return "free";
  const issues = resourceInfo.issues || [];
  if (issues.some((i) => i.severity === "high")) return "fault";
  if (issues.length > 0) return "degraded";
  return resourceInfo.occupancy || "free";
}
```

### 4.2 Status Color Mapping

| Derived Status | Meaning | Light Mode Hex | Dark Mode Hex |
|---|---|---|---|
| `fault` | Critical Fault / Blocked | `#ff3b30` | `#ff3b30` |
| `degraded` | Caution / Speed Restricted | `#ff9f0a` | `#ff9f0a` |
| `occupied` | Active Train on Block | `#0066cc` | `#2997ff` |
| `reserved` | Route Locked / Scheduled | `#af52de` | `#af52de` |
| `free` | Available / Clear Track | `#8e8e93` | `#636366` |

---

## 5. Summary Checklist for Implementers

- [x] All IDs (`train.id`, `trip.id`, `resource.id`, `issue.issue_id`, `station.id`, `corridor.id`) are **integers**.
- [x] Relative time values are integer minutes from midnight (`0..1440`).
- [x] Absolute timestamps are ISO8601 strings.
- [x] All endpoints return HTTP 200 with `{ "status": "ok" | "error", "data": ... }`.
- [x] `POST /api/resource/:resourceid/issue` accepts optional `severity` (AI predicted if omitted; manual override if provided).
- [x] Frontend UI has no severity selected by default (`Auto` / AI prediction mode active with optional manual overrides).

