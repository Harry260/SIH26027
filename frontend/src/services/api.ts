import {
  Station,
  RouteCorridor,
  BlockFeatureCollection,
  AiPlanBlock,
  AssetBlock,
  SubmitIssuePayload,
} from '../types';
import { MOCK_STATIONS, SUPPORTED_CORRIDORS } from '../mockData/stations';
import { getBlockSectionsForRoute } from '../mockData/blockSections';
import { generateMockAiPlan } from '../mockData/aiPlanData';
import { generateMockAssetData } from '../mockData/assetData';

// Safely access Vite env or default to port 4000
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:4000/api';

/**
 * Service API Layer
 * Connects directly to the Express backend-mock service running on port 4000.
 * If the mock backend is unavailable or offline, it gracefully falls back
 * to the client-side dynamic procedural generation engine.
 */

export async function fetchStations(): Promise<Station[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/stations`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (_err) {
    // Backend offline; fallback to local mock data
  }
  return [...MOCK_STATIONS];
}

export async function fetchSupportedCorridors(): Promise<RouteCorridor[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/stations/meta/corridors`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (_err) {
    // Backend offline; fallback
  }
  return [...SUPPORTED_CORRIDORS];
}

export async function fetchBlockSection(
  fromCode: string,
  toCode: string
): Promise<BlockFeatureCollection> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/sections?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`,
      { signal: AbortSignal.timeout(2500) }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.features) {
        return json.data;
      }
    }
  } catch (_err) {
    // Backend offline; fallback
  }

  const localData = getBlockSectionsForRoute(fromCode, toCode);
  if (!localData) {
    throw new Error(`Unable to generate block section between ${fromCode} and ${toCode}`);
  }
  return localData;
}

export async function fetchAiPlan(
  corridorKey: string,
  blockIds: string[],
  fromCode?: string,
  toCode?: string
): Promise<Record<string, AiPlanBlock>> {
  try {
    let url = `${API_BASE_URL}/ai-plan?`;
    if (fromCode && toCode) {
      url += `from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
    } else {
      url += `corridorKey=${encodeURIComponent(corridorKey)}&block_ids=${encodeURIComponent(blockIds.join(','))}`;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return json.data;
      }
    }
  } catch (_err) {
    // Fallback
  }
  return generateMockAiPlan(blockIds);
}

export async function fetchAssetData(
  corridorKey: string,
  blockIds: string[],
  fromCode?: string,
  toCode?: string
): Promise<Record<string, AssetBlock>> {
  try {
    let url = `${API_BASE_URL}/assets?`;
    if (fromCode && toCode) {
      url += `from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
    } else {
      url += `corridorKey=${encodeURIComponent(corridorKey)}&block_ids=${encodeURIComponent(blockIds.join(','))}`;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return json.data;
      }
    }
  } catch (_err) {
    // Fallback
  }
  return generateMockAssetData(blockIds);
}

export async function submitBlockReport(
  payload: SubmitIssuePayload
): Promise<{ success: boolean; issue_id: string; timestamp: string }> {
  // Required console logging per prompt
  console.log('[Indian Railways Signal & Telemetry API] Report Submitted:', {
    block_id: payload.block_id,
    issue_type: payload.issue_type,
    description: payload.description,
    severity: payload.severity,
    reported_by: payload.reported_by,
    timestamp: payload.timestamp,
  });

  try {
    const res = await fetch(`${API_BASE_URL}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        issue_id: json.issue_id || `ISSUE-${Date.now()}`,
        timestamp: json.timestamp || payload.timestamp,
      };
    }
  } catch (_err) {
    // Fallback
  }

  return {
    success: true,
    issue_id: `ISSUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: payload.timestamp,
  };
}

export async function resolveBlockIssue(
  issueId: string,
  blockId?: string
): Promise<{ success: boolean }> {
  try {
    const url = `${API_BASE_URL}/issues/${encodeURIComponent(issueId)}${
      blockId ? `?block_id=${encodeURIComponent(blockId)}` : ''
    }`;
    const res = await fetch(url, { method: 'DELETE', signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      return { success: true };
    }
  } catch (_err) {
    // Fallback
  }
  return { success: true };
}
