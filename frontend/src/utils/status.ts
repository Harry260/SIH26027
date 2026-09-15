import { ResourceInfo, DerivedStatus, AppMode, TrainId, ResourceAllocation } from '../types';

/**
 * Pure function: Single source of truth for deriving a resource block's visual operational status
 * NEVER store derived status directly. Compute it from occupancy + issues.
 */
export function getDerivedStatus(resourceInfo: ResourceInfo): DerivedStatus {
  if (!resourceInfo) return "free";
  const issues = resourceInfo.issues || [];
  if (issues.some((i) => i.severity === "high")) return "fault";
  if (issues.length > 0) return "degraded";
  return resourceInfo.occupancy || "free";
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
const TRAIN_COLOR_MAP: Record<number, string> = {
  12002: "#0066cc", // Bhopal Shatabdi
  22436: "#30d158", // Vande Bharat Express
  12952: "#bf5af2", // Mumbai Rajdhani
  12301: "#af52de", // Howrah Rajdhani
  12260: "#5856d6", // Sealdah Duronto
  12626: "#30b0c7", // Kerala Express
  8842:  "#ff375f", // Coal Freight
  4491:  "#ff9f0a", // Container Freight
};

const TRAIN_COLOR_PALETTE = [
  "#2997ff",
  "#30d158",
  "#bf5af2",
  "#ff9f0a",
  "#ff375f",
  "#64d2ff",
  "#ffd60a",
];

export function getAiPlanColor(trainId?: TrainId): string {
  if (!trainId) return "#8e8e93";
  if (TRAIN_COLOR_MAP[trainId]) return TRAIN_COLOR_MAP[trainId];

  const index = Math.abs(trainId) % TRAIN_COLOR_PALETTE.length;
  return TRAIN_COLOR_PALETTE[index];
}

/**
 * Main color resolver for a block resource given the active mode
 */
export function getResourceBlockColor(
  mode: AppMode,
  resourceInfo: ResourceInfo,
  _allocation?: ResourceAllocation,
  activeTrainId?: TrainId,
  isDark: boolean = false
): string {
  if (mode === "report") {
    const status = getDerivedStatus(resourceInfo);
    return getReportModeColor(status, isDark);
  }

  if (mode === "ai-plan") {
    const targetTrain = activeTrainId || resourceInfo.active_train;
    return getAiPlanColor(targetTrain);
  }

  return "#8e8e93";
}
