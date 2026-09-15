import {
  Station,
  RouteCorridor,
  ResourceInfo,
  Train,
  Trip,
  SubmitIssueBody,
  IssueId,
  ResourceId,
  ResourceBlock,
} from '../types';
import { MOCK_STATIONS, SUPPORTED_CORRIDORS } from '../mockData/stations';
import { getBlockSectionsForRoute } from '../mockData/blockSections';
import { generateMockTrips, MOCK_TRAINS } from '../mockData/aiPlanData';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:4000/api';

/**
 * Service API Layer
 * Connects to the JSON-RPC Express backend.
 * Unpacks { status: "ok", data: ... } responses.
 * Provides seamless local fallback if the backend is offline.
 */

export async function fetchStations(): Promise<Station[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/stations`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (_err) {
    // Backend offline; fallback
  }
  return [...MOCK_STATIONS];
}

export async function fetchSupportedCorridors(): Promise<RouteCorridor[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/corridors`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (_err) {
    // Backend offline; fallback
  }
  return [...SUPPORTED_CORRIDORS];
}

export async function fetchCorridorData(
  fromCode: string,
  toCode: string
): Promise<{ corridor: string; meta: RouteCorridor; trains: Train[]; resources: ResourceInfo[] }> {
  const corridorKey = `${fromCode}_${toCode}`;

  try {
    const res = await fetch(`${API_BASE_URL}/corridors/${encodeURIComponent(corridorKey)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && json.data && json.data.resources) {
        return json.data;
      }
    }
  } catch (_err) {
    // Fallback
  }

  const localResources = getBlockSectionsForRoute(fromCode, toCode) || [];
  const foundCorridor =
    SUPPORTED_CORRIDORS.find(
      (c) =>
        (c.fromCode === fromCode && c.toCode === toCode) ||
        (c.fromCode === toCode && c.toCode === fromCode)
    ) || {
      id: 101,
      code: corridorKey,
      fromCode,
      toCode,
      name: `${fromCode} ↔ ${toCode} Corridor`,
      zone: 'Indian Railways',
      distance_km: 195,
      total_blocks: localResources.length,
      description: 'Standard Automatic Block Signal Territory.',
    };

  return {
    corridor: corridorKey,
    meta: foundCorridor,
    trains: MOCK_TRAINS,
    resources: localResources,
  };
}

export async function fetchPlan(
  corridorKey: string,
  resourceIds: ResourceId[]
): Promise<Trip[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/plan?corridor=${encodeURIComponent(corridorKey)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && json.data?.trips) {
        return json.data.trips;
      }
    }
  } catch (_err) {
    // Fallback
  }
  return generateMockTrips(resourceIds);
}

export async function submitResourceIssue(
  resourceId: ResourceId,
  body: SubmitIssueBody
): Promise<{ success: boolean; issue_id: IssueId; severity: import('../types').IssueSeverity }> {
  console.log(`[Indian Railways S&T API] Submitting issue on Resource ${resourceId}:`, body);

  try {
    const res = await fetch(`${API_BASE_URL}/resource/${resourceId}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && json.data?.issue_id) {
        return {
          success: true,
          issue_id: json.data.issue_id,
          severity: json.data.severity || body.severity || 'medium',
        };
      }
    }
  } catch (_err) {
    // Fallback
  }

  const fallbackSeverity =
    body.severity ||
    (body.issue_type === 'obstruction'
      ? 'high'
      : body.issue_type === 'maintenance'
      ? 'low'
      : 'medium');

  return {
    success: true,
    issue_id: Math.floor(Date.now() / 1000),
    severity: fallbackSeverity,
  };
}

export async function resolveResourceIssue(
  resourceId: ResourceId,
  issueId: IssueId
): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/resource/${resourceId}/issue/${issueId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: json.status === 'ok' };
    }
  } catch (_err) {
    // Fallback
  }
  return { success: true };
}

export async function blockResource(
  resourceId: ResourceId,
  block: ResourceBlock
): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/resource/${resourceId}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(block),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: json.status === 'ok' };
    }
  } catch (_err) {
    // Fallback
  }
  return { success: true };
}
