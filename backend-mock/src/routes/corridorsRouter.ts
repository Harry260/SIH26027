import { Router, Request, Response } from 'express';
import { corridorStore } from '../services/sectionStore.js';
import { POPULAR_CORRIDORS } from '../data/stations.js';

export const corridorsRouter = Router();

/**
 * GET /api/corridors
 */
corridorsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    data: POPULAR_CORRIDORS,
  });
});

/**
 * GET /api/corridors/:corridor
 * Example: /api/corridors/NDLS_AGC
 */
corridorsRouter.get('/:corridor', (req: Request, res: Response) => {
  const { corridor } = req.params;

  try {
    const data = corridorStore.getOrCreateCorridor(corridor);
    res.json({
      status: 'ok',
      data: {
        corridor: data.corridor,
        meta: data.meta,
        trains: data.trains,
        resources: data.resources,
      },
    });
  } catch (err: any) {
    res.json({
      status: 'error',
      data: {
        message: err.message || 'Failed to retrieve corridor',
      },
    });
  }
});

