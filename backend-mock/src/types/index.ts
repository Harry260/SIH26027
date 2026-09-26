// ==========================================
// SIH26027 API & Domain Types (JSON-RPC)
// ==========================================

// Standard JSON-RPC Response Envelope
export interface ApiResponse<T = any> {
  status: "ok" | "error";
  data: T;
}

// ------------------------------------------
// Integer IDs
// ------------------------------------------
export type TrainId = number;
export type TripId = number;
export type ResourceId = number;
export type IssueId = number;
export type StationId = number;
export type CorridorId = number;

// Relative time in minutes from midnight (0..1440) or duration offset
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
  arrival: Time;     // Relative Time in minutes
  departure: Time;   // Relative Time in minutes
  min_dwell: Time;   // Minimum dwell Time in minutes
}

export interface ResourceAllocation {
  resource_id: ResourceId;
  entry_time: Time;
  exit_time: Time;
  planned_speed_kmh: number;
  headway_seconds: number;
}

export interface Trip {
  id: TripId;
  train: TrainId;
  train_name?: string;
  start_time: string; // ISO8601 absolute timestamp
  stations: TripStationStop[];
  resource_allocations?: ResourceAllocation[];
}

// ------------------------------------------
// Resource Entities (Tracks, Blocks, Platforms, Junctions)
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
  location: [number, number];       // [lng, lat]
  coordinates: [number, number][];   // GeoJSON LineString coordinates [[lng, lat], ...]
  length_m: number;
  max_speed_kmh: number;
  gradient?: string;
  occupancy: "free" | "occupied" | "reserved";
  active_train?: TrainId;
  train_name?: string;
  issues: BlockIssue[];
}

// ------------------------------------------
// Issue & Telemetry Entities
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
  timestamp: string; // ISO8601 absolute timestamp
}

export interface SubmitIssueBody {
  issue_type: IssueType;
  description: string;
  severity?: IssueSeverity; // Optional: predicted automatically by backend if omitted
  reported_by?: string;
  timestamp?: string;
}

// ------------------------------------------
// Repairs & Resource Blocks
// ------------------------------------------
export interface RepairRequest {
  resource_id: ResourceId;
  time_start: Time;
  time_end: Time;
}

export interface ResourceBlock {
  resource_id: ResourceId;
  start: Time;
  end: Time;
}

// ------------------------------------------
// Timetable Planning (LP Solver Interface)
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

export type AppMode = "report" | "ai-plan";
