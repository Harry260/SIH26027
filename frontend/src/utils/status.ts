import { BlockProperties, DerivedStatus, AppMode, AiPlanBlock, AssetBlock } from '../types';

/**
 * Pure function: Single source of truth for deriving a block's visual operational status
 * NEVER store derived status directly. Compute it from occupancy + issues.
 */
export function getDerivedStatus(props: BlockProperties): DerivedStatus {
  if (!props) return "free";
  const issues = props.issues || [];
  if (issues.some((i) => i.severity === "high")) return "fault";
  if (issues.length > 0) return "degraded";
  return props.occupancy || "free";
}

/**
 * Human-readable label for derived status
 */
export function getStatusLabel(status: DerivedStatus): string {
  switch (status) {
    case "fault":
      return "Critical Fault (Blocked)";
    case "degraded":
      return "Degraded (Caution)";
    case "occupied":
      return "Occupied (Train Active)";
    case "reserved":
      return "Reserved (Scheduled)";
    case "free":
      return "Clear / Free";
    default:
      return "Unknown";
  }
}

/**
 * Color codes for Report Mode (derived status)
 */
export function getReportModeColor(status: DerivedStatus, isDark: boolean = false): string {
  switch (status) {
    case "fault":
      return "#ff3b30"; // Apple System Red
    case "degraded":
      return "#ff9f0a"; // Apple System Orange/Amber
    case "occupied":
      return isDark ? "#2997ff" : "#0066cc"; // Apple Action Blue
    case "reserved":
      return "#af52de"; // Apple System Purple
    case "free":
      return isDark ? "#636366" : "#8e8e93"; // Apple System Gray
    default:
      return "#8e8e93";
  }
}

/**
 * Train color palette for AI Plan Mode to trace paths across blocks
 */
const TRAIN_COLOR_PALETTE = [
  "#2997ff", // Sky Blue (12002 Shatabdi)
  "#30d158", // Green (22436 Vande Bharat)
  "#bf5af2", // Purple (12952 Rajdhani)
  "#ff9f0a", // Amber (12424 Dibrugarh)
  "#ff375f", // Pink (Freight Container)
  "#64d2ff", // Cyan
  "#ffd60a", // Yellow
];

const TRAIN_COLOR_MAP: Record<string, string> = {
  "12002": "#0066cc", // Bhopal Shatabdi
  "22436": "#30d158", // Vande Bharat Express
  "12952": "#bf5af2", // Mumbai Rajdhani
  "12424": "#ff9f0a", // Dibrugarh Rajdhani
  "BOXN-8842": "#ff375f", // Freight Container Express
  "12626": "#30b0c7", // Kerala Express
  "20608": "#5856d6", // Vande Bharat MAS-SBC
  "12007": "#ff9f0a", // Shatabdi Express
};

export function getAiPlanColor(trainId?: string): string {
  if (!trainId) return "#8e8e93";
  if (TRAIN_COLOR_MAP[trainId]) return TRAIN_COLOR_MAP[trainId];

  // Deterministic color selection from string
  let hash = 0;
  for (let i = 0; i < trainId.length; i++) {
    hash = trainId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TRAIN_COLOR_PALETTE.length;
  return TRAIN_COLOR_PALETTE[index];
}

/**
 * Asset Mode continuous bucket color scale for idle minutes
 */
export function getAssetIdleColor(idleMinutes: number = 0): string {
  if (idleMinutes <= 10) return "#30d158"; // Optimal (0-10m) - Apple Green
  if (idleMinutes <= 25) return "#64d2ff"; // Low Idle (11-25m) - Sky Cyan
  if (idleMinutes <= 50) return "#ffd60a"; // Moderate Idle (26-50m) - Warm Yellow
  if (idleMinutes <= 90) return "#ff9f0a"; // High Idle (51-90m) - Amber Orange
  return "#ff453a"; // Severe Idle Bottleneck (90m+) - Alert Red
}

/**
 * Main color resolver for a block given the active mode
 */
export function getBlockColor(
  mode: AppMode,
  props: BlockProperties,
  aiPlan?: AiPlanBlock,
  asset?: AssetBlock,
  isDark: boolean = false
): string {
  if (mode === "report") {
    const status = getDerivedStatus(props);
    return getReportModeColor(status, isDark);
  }

  if (mode === "ai-plan") {
    const trainId = aiPlan?.train_id || props.train_id;
    return getAiPlanColor(trainId);
  }

  if (mode === "asset") {
    const idle = asset?.idle_minutes ?? 0;
    return getAssetIdleColor(idle);
  }

  return "#8e8e93";
}

