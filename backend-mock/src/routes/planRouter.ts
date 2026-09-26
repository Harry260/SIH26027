import { Router, Request, Response } from 'express';
import { corridorStore } from '../services/sectionStore.js';
import { solveTimetablePlan } from '../generators/planGenerator.js';
import { TimetableInput } from '../types/index.js';

export const planRouter = Router();

/**
 * POST /api/plan
 * Solves and optimizes train dispatching timetable
 */
planRouter.post('/', (req: Request, res: Response) => {
  const input: TimetableInput = req.body;

  if (!input || !Array.isArray(input.trips)) {
    return res.json({
      status: 'error',
      data: { message: "Invalid TimetableInput: 'trips' array is required" },
    });
  }

  const output = solveTimetablePlan({
    trips: input.trips,
    resources: Array.isArray(input.resources) ? input.resources : [],
    repairs: Array.isArray(input.repairs) ? input.repairs : [],
  });

  res.json({
    status: 'ok',
    data: output,
  });
});

/**
 * GET /api/plan?corridor=NDLS_AGC
 * Helper to fetch or optimize plan for a corridor
 */
planRouter.get('/', (req: Request, res: Response) => {
  const corridorParam = (req.query.corridor as string) || 'NDLS_AGC';

  try {
    const trips = corridorStore.optimizePlan(corridorParam);
    res.json({
      status: 'ok',
      data: {
        trips,
      },
    });
  } catch (err: any) {
    res.json({
      status: 'error',
      data: { message: err.message || 'Failed to generate plan' },
    });
  }
});

