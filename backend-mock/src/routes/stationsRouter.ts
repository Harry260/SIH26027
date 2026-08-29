import { Router, Request, Response } from 'express';
import {
  INDIAN_RAILWAY_STATIONS,
  POPULAR_CORRIDORS,
  findStationByCode,
} from '../data/stations.js';

export const stationsRouter = Router();

/**
 * GET /api/stations
 * Query params:
 *  - q: search keyword matching code, name, state, or zone
 *  - zone: filter by railway zone (e.g. NR, WR, SR)
 */
stationsRouter.get('/', (req: Request, res: Response) => {
  const { q, zone } = req.query;
  let stations = [...INDIAN_RAILWAY_STATIONS];

  if (typeof zone === 'string' && zone.trim()) {
    stations = stations.filter(
      (s) => s.zone.toUpperCase() === zone.trim().toUpperCase()
    );
  }

  if (typeof q === 'string' && q.trim()) {
    const query = q.trim().toLowerCase();
    stations = stations.filter(
      (s) =>
        s.code.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.state.toLowerCase().includes(query) ||
        s.zone.toLowerCase().includes(query)
    );
  }

  res.json({
    success: true,
    total: stations.length,
    data: stations,
  });
});

/**
 * GET /api/stations/:code
 */
stationsRouter.get('/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const station = findStationByCode(code);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: `Station with code '${code}' not found`,
    });
  }

  res.json({
    success: true,
    data: station,
  });
});

/**
 * GET /api/corridors
 */
stationsRouter.get('/meta/corridors', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: POPULAR_CORRIDORS.length,
    data: POPULAR_CORRIDORS,
  });
});

