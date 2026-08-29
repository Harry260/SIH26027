import { create } from 'zustand';
import {
  Station,
  RouteCorridor,
  BlockFeatureCollection,
  AiPlanBlock,
  AssetBlock,
  AppMode,
  SubmitIssuePayload,
  BlockIssue,
} from '../types';
import {
  fetchStations,
  fetchSupportedCorridors,
  fetchBlockSection,
  fetchAiPlan,
  fetchAssetData,
  submitBlockReport,
} from '../services/api';

interface RailwayState {
  // Navigation & Screen
  screen: 'selection' | 'section';
  theme: 'light' | 'dark';

  // Master Data
  stations: Station[];
  supportedCorridors: RouteCorridor[];
  isLoadingInit: boolean;

  // Screen 1 Selection State
  fromStation: string | null;
  toStation: string | null;
  selectionError: string | null;

  // Screen 2 Section & Map State
  currentCorridor: RouteCorridor | null;
  blocksData: BlockFeatureCollection | null;
  aiPlanData: Record<string, AiPlanBlock> | null;
  assetData: Record<string, AssetBlock> | null;

  // Active View & Interactions
  mode: AppMode;
  isLoadingMode: boolean;
  isLoadingSection: boolean;
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  toastMessage: string | null;

  // Actions
  initialize: () => Promise<void>;
  setFromStation: (code: string | null) => void;
  setToStation: (code: string | null) => void;
  selectCorridorPreset: (from: string, to: string) => void;
  loadSection: (fromCode?: string, toCode?: string) => Promise<void>;
  setMode: (mode: AppMode) => Promise<void>;
  setSelectedBlock: (blockId: string | null) => void;
  setHoveredBlock: (blockId: string | null) => void;
  addBlockIssue: (payload: {
    block_id: string;
    issue_type: SubmitIssuePayload['issue_type'];
    description: string;
    severity: SubmitIssuePayload['severity'];
  }) => Promise<void>;
  resolveBlockIssue: (blockId: string, issueId: string) => void;
  toggleTheme: () => void;
  resetToSelection: () => void;
  clearToast: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('sih_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useRailwayStore = create<RailwayState>((set, get) => ({
  screen: 'selection',
  theme: getInitialTheme(),

  stations: [],
  supportedCorridors: [],
  isLoadingInit: true,

  fromStation: 'NDLS',
  toStation: 'AGC',
  selectionError: null,

  currentCorridor: null,
  blocksData: null,
  aiPlanData: null,
  assetData: null,

  mode: 'report',
  isLoadingMode: false,
  isLoadingSection: false,
  selectedBlockId: null,
  hoveredBlockId: null,
  toastMessage: null,

  initialize: async () => {
    try {
      const [stations, corridors] = await Promise.all([
        fetchStations(),
        fetchSupportedCorridors(),
      ]);
      set({
        stations,
        supportedCorridors: corridors,
        isLoadingInit: false,
      });

      // Apply theme to document
      const currentTheme = get().theme;
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to initialize stations:', err);
      set({ isLoadingInit: false });
    }
  },

  setFromStation: (code) => {
    set({ fromStation: code, selectionError: null });
  },

  setToStation: (code) => {
    set({ toStation: code, selectionError: null });
  },

  selectCorridorPreset: (from, to) => {
    set({ fromStation: from, toStation: to, selectionError: null });
  },

  loadSection: async (fromCodeParam, toCodeParam) => {
    const fromCode = fromCodeParam || get().fromStation;
    const toCode = toCodeParam || get().toStation;

    if (!fromCode || !toCode) {
      set({ selectionError: 'Please select both departure and destination stations.' });
      return;
    }

    if (fromCode === toCode) {
      set({ selectionError: 'Departure and destination stations cannot be the same.' });
      return;
    }

    set({ isLoadingSection: true, selectionError: null });

    try {
      const blocksGeoJson = await fetchBlockSection(fromCode, toCode);
      const corridorKey = `${fromCode}_${toCode}`;
      const blockIds = blocksGeoJson.features.map((f) => f.properties.block_id);

      // Fetch accompanying mock datasets for AI plan and Asset mode
      const [aiPlan, assetData] = await Promise.all([
        fetchAiPlan(corridorKey, blockIds),
        fetchAssetData(corridorKey, blockIds),
      ]);

      const foundCorridor =
        get().supportedCorridors.find(
          (c) =>
            (c.fromCode === fromCode && c.toCode === toCode) ||
            (c.fromCode === toCode && c.toCode === fromCode)
        ) || {
          fromCode,
          toCode,
          name: `${fromCode} ↔ ${toCode} Railway Section`,
          zone: 'Indian Railways Mainline',
          distance_km: 195,
          total_blocks: blocksGeoJson.features.length,
          description: 'Standard Automatic Block Signal Section.',
        };

      set({
        blocksData: blocksGeoJson,
        aiPlanData: aiPlan,
        assetData: assetData,
        currentCorridor: foundCorridor,
        screen: 'section',
        mode: 'report',
        selectedBlockId: null,
        hoveredBlockId: null,
        isLoadingSection: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading railway section';
      set({
        selectionError: errorMessage,
        isLoadingSection: false,
      });
    }
  },

  setMode: async (newMode: AppMode) => {
    if (get().mode === newMode || get().isLoadingMode) return;

    // Simulate lazy-loaded API call with 300-500ms delay per spec
    set({ isLoadingMode: true });

    // Deselect active block report panel if switching away from Report Mode
    if (newMode !== 'report') {
      set({ selectedBlockId: null });
    }

    await new Promise((resolve) => setTimeout(resolve, 380));

    set({
      mode: newMode,
      isLoadingMode: false,
    });
  },

  setSelectedBlock: (blockId) => {
    // Blocks are only clickable in report mode
    if (get().mode === 'report') {
      set({ selectedBlockId: blockId });
    }
  },

  setHoveredBlock: (blockId) => {
    set({ hoveredBlockId: blockId });
  },

  addBlockIssue: async ({ block_id, issue_type, description, severity }) => {
    const payload: SubmitIssuePayload = {
      block_id,
      issue_type,
      description,
      severity,
      reported_by: 'controller_demo',
      timestamp: new Date().toISOString(),
    };

    const response = await submitBlockReport(payload);

    const newIssue: BlockIssue = {
      issue_id: response.issue_id,
      issue_type: issue_type as BlockIssue['issue_type'],
      description,
      severity,
      reported_by: payload.reported_by,
      timestamp: payload.timestamp,
    };

    // Update block issues array immutably
    const currentBlocks = get().blocksData;
    if (!currentBlocks) return;

    const updatedFeatures = currentBlocks.features.map((feature) => {
      if (feature.properties.block_id === block_id) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            issues: [...feature.properties.issues, newIssue],
          },
        };
      }
      return feature;
    });

    set({
      blocksData: {
        ...currentBlocks,
        features: updatedFeatures,
      },
      toastMessage: `Issue recorded for ${block_id}. Derived block status updated.`,
    });
  },

  resolveBlockIssue: (blockId, issueId) => {
    const currentBlocks = get().blocksData;
    if (!currentBlocks) return;

    const updatedFeatures = currentBlocks.features.map((feature) => {
      if (feature.properties.block_id === blockId) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            issues: feature.properties.issues.filter((i) => i.issue_id !== issueId),
          },
        };
      }
      return feature;
    });

    set({
      blocksData: {
        ...currentBlocks,
        features: updatedFeatures,
      },
      toastMessage: `Issue resolved on block ${blockId}. Status recalculated.`,
    });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('sih_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  resetToSelection: () => {
    set({
      screen: 'selection',
      selectedBlockId: null,
      hoveredBlockId: null,
      mode: 'report',
    });
  },

  clearToast: () => {
    set({ toastMessage: null });
  },
}));

