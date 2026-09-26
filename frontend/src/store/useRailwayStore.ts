import { create } from 'zustand';
import {
  Station,
  RouteCorridor,
  ResourceInfo,
  Train,
  Trip,
  AppMode,
  ResourceId,
  IssueId,
  TripId,
  RepairRequest,
  SubmitIssueBody,
  BlockIssue,
} from '../types';
import {
  fetchStations,
  fetchSupportedCorridors,
  fetchCorridorData,
  fetchPlan,
  submitResourceIssue,
  resolveResourceIssue,
  solveTimetablePlanApi,
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
  resources: ResourceInfo[];
  trains: Train[];
  trips: Trip[];

  // Active View & Interactions
  mode: AppMode;
  isLoadingMode: boolean;
  isLoadingSection: boolean;
  selectedResourceId: ResourceId | null;
  hoveredResourceId: ResourceId | null;
  toastMessage: string | null;

  // Timetable State
  planStatus: 'proposed' | 'accepted' | 'rejected';
  isModifyModalOpen: boolean;
  activeModifyTripId: TripId | null;
  isSolvingPlan: boolean;

  // Actions
  initialize: () => Promise<void>;
  setFromStation: (code: string | null) => void;
  setToStation: (code: string | null) => void;
  selectCorridorPreset: (from: string, to: string) => void;
  loadSection: (fromCode?: string, toCode?: string) => Promise<void>;
  setMode: (mode: AppMode) => Promise<void>;
  setSelectedResource: (resourceId: ResourceId | null) => void;
  setHoveredResource: (resourceId: ResourceId | null) => void;
  addResourceIssue: (
    resourceId: ResourceId,
    body: SubmitIssueBody
  ) => Promise<void>;
  resolveResourceIssueAction: (
    resourceId: ResourceId,
    issueId: IssueId
  ) => Promise<void>;
  acceptPlan: () => void;
  rejectPlan: () => Promise<void>;
  openModifyModal: (tripId?: TripId) => void;
  closeModifyModal: () => void;
  updatePlanWithOptimization: (
    modifiedTrips: Trip[],
    repairs?: RepairRequest[]
  ) => Promise<void>;
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
  resources: [],
  trains: [],
  trips: [],

  mode: 'report',
  isLoadingMode: false,
  isLoadingSection: false,
  selectedResourceId: null,
  hoveredResourceId: null,
  toastMessage: null,

  planStatus: 'proposed',
  isModifyModalOpen: false,
  activeModifyTripId: null,
  isSolvingPlan: false,

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
      const corridorData = await fetchCorridorData(fromCode, toCode);
      const resourceIds = corridorData.resources.map((r) => r.resource.id);
      const trips = await fetchPlan(corridorData.corridor, resourceIds);

      set({
        resources: corridorData.resources,
        trains: corridorData.trains,
        trips,
        currentCorridor: corridorData.meta,
        screen: 'section',
        mode: 'report',
        planStatus: 'proposed',
        isModifyModalOpen: false,
        activeModifyTripId: null,
        selectedResourceId: null,
        hoveredResourceId: null,
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

    set({ isLoadingMode: true });

    if (newMode !== 'report') {
      set({ selectedResourceId: null });
    }

    await new Promise((resolve) => setTimeout(resolve, 380));

    set({
      mode: newMode,
      isLoadingMode: false,
    });
  },

  setSelectedResource: (resourceId) => {
    if (get().mode === 'report') {
      set({ selectedResourceId: resourceId });
    }
  },

  setHoveredResource: (resourceId) => {
    set({ hoveredResourceId: resourceId });
  },

  addResourceIssue: async (resourceId, body) => {
    const timestamp = body.timestamp || new Date().toISOString();
    const response = await submitResourceIssue(resourceId, {
      ...body,
      timestamp,
    });

    const assignedSeverity = response.severity || body.severity || 'medium';

    const newIssue: BlockIssue = {
      issue_id: response.issue_id,
      issue_type: body.issue_type,
      description: body.description,
      severity: assignedSeverity,
      reported_by: body.reported_by || 'Chief Section Controller',
      timestamp,
    };

    const currentResources = get().resources;
    const updated = currentResources.map((res) => {
      if (res.resource.id === resourceId) {
        return {
          ...res,
          issues: [newIssue, ...res.issues],
        };
      }
      return res;
    });

    set({
      resources: updated,
      toastMessage: `Issue #${response.issue_id} recorded on Resource #${resourceId} (${assignedSeverity.toUpperCase()} severity). Block status recalculated.`,
    });
  },

  resolveResourceIssueAction: async (resourceId, issueId) => {
    await resolveResourceIssue(resourceId, issueId);

    const currentResources = get().resources;
    const updated = currentResources.map((res) => {
      if (res.resource.id === resourceId) {
        return {
          ...res,
          issues: res.issues.filter((i) => i.issue_id !== issueId),
        };
      }
      return res;
    });

    set({
      resources: updated,
      toastMessage: `Issue #${issueId} resolved. Status recalculated.`,
    });
  },

  acceptPlan: () => {
    set({
      planStatus: 'accepted',
      toastMessage: 'Timetable Plan Approved. Dispatch schedule locked and sent to Section Controllers.',
    });
  },

  rejectPlan: async () => {
    const currentCorridor = get().currentCorridor;
    const resources = get().resources;
    set({
      planStatus: 'rejected',
      isSolvingPlan: true,
      toastMessage: 'Timetable Rejected. AI Solver re-optimizing alternative dispatch...',
    });

    try {
      if (currentCorridor) {
        const resourceIds = resources.map((r) => r.resource.id);
        const newTrips = await fetchPlan(currentCorridor.code, resourceIds);
        set({
          trips: newTrips,
          planStatus: 'proposed',
          isSolvingPlan: false,
          toastMessage: 'AI Alternative Timetable generated. Ready for review.',
        });
      }
    } catch (_err) {
      set({ isSolvingPlan: false, planStatus: 'proposed' });
    }
  },

  openModifyModal: (tripId) => {
    set({
      isModifyModalOpen: true,
      activeModifyTripId: tripId || (get().trips[0]?.id ?? null),
    });
  },

  closeModifyModal: () => {
    set({ isModifyModalOpen: false, activeModifyTripId: null });
  },

  updatePlanWithOptimization: async (modifiedTrips, repairs = []) => {
    set({
      isSolvingPlan: true,
      toastMessage: 'Running Mixed-Integer LP Solver to re-optimize schedule...',
    });

    try {
      const resources = get().resources.map((r) => r.resource);
      const solvedTrips = await solveTimetablePlanApi({
        trips: modifiedTrips,
        resources,
        repairs,
      });

      set({
        trips: solvedTrips,
        planStatus: 'proposed',
        isSolvingPlan: false,
        isModifyModalOpen: false,
        toastMessage: 'Timetable re-calculated by AI Solver with updated parameters.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown solver error';
      set({
        isSolvingPlan: false,
        toastMessage: `Optimization failed: ${msg}`,
      });
    }
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
      selectedResourceId: null,
      hoveredResourceId: null,
      mode: 'report',
      planStatus: 'proposed',
      isModifyModalOpen: false,
      activeModifyTripId: null,
    });
  },

  clearToast: () => {
    set({ toastMessage: null });
  },
}));
