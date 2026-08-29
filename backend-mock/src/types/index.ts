export type IssueType =
  | "obstruction"
  | "signal_fault"
  | "speed_restriction"
  | "maintenance"
  | "other";

export type IssueSeverity = "low" | "medium" | "high";

export interface BlockIssue {
  issue_id: string;
  issue_type: IssueType;
  description: string;
  severity: IssueSeverity;
  reported_by: string;
  timestamp: string; // ISO
}

export type DerivedStatus = "free" | "occupied" | "reserved" | "degraded" | "fault";

export type BaseOccupancy = "free" | "occupied" | "reserved";

export interface BlockProperties {
  block_id: string;
  sequence: number;
  start_signal: string;
  end_signal: string;
  occupancy: BaseOccupancy; // base occupancy state, independent of issues
  issues: BlockIssue[]; // zero or more simultaneous issues on this block
  train_id?: string;
  train_name?: string;
  length_m: number;
  max_speed_kmh?: number;
  gradient?: string;
}

export interface BlockFeature {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat] per GeoJSON standard
  };
  properties: BlockProperties;
}

export interface BlockFeatureCollection {
  type: "FeatureCollection";
  features: BlockFeature[];
}

export interface Station {
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
  fromCode: string;
  toCode: string;
  name: string;
  zone: string;
  distance_km: number;
  total_blocks: number;
  description: string;
}

export interface AiPlanBlock {
  block_id: string;
  train_id: string;
  train_name?: string;
  entry_time: string;
  exit_time: string;
  planned_speed_kmh?: number;
  headway_seconds?: number;
  priority_tier?: "Premier" | "Express" | "Freight";
}

export interface AssetBlock {
  block_id: string;
  idle_minutes: number;
  asset_id: string;
  asset_type?: "Electric Loco (WAP-7)" | "Diesel Loco (WDM-3D)" | "EMU / Vande Bharat" | "Freight Rake";
  asset_status?: "Holding at Signal" | "Optimal Transit" | "Speed Restricted" | "Yard Staging";
}

export type AppMode = "report" | "ai-plan" | "asset";

export interface SubmitIssuePayload {
  block_id: string;
  issue_type: string;
  description: string;
  severity: IssueSeverity;
  reported_by: string;
  timestamp: string;
  fromCode?: string;
  toCode?: string;
}
