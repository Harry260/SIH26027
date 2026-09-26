import { Router, Request, Response } from 'express';
import {
  INDIAN_RAILWAY_STATIONS,
  findStationByCode,
  findStationById,
} from '../data/stations.js';

export const stationsRouter = Router();

/**
 * GET /api/stations
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
    status: 'ok',
    data: stations,
  });
});

/**
 * GET /api/stations/:idOrCode
 */
stationsRouter.get('/:idOrCode', (req: Request, res: Response) => {
  const { idOrCode } = req.params;
  const num = parseInt(idOrCode, 10);
  const station = !isNaN(num)
    ? findStationById(num)
    : findStationByCode(idOrCode);

  if (!station) {
    return res.json({
      status: 'error',
      data: {
        message: `Station '${idOrCode}' not found`,
      },
    });
  }

  res.json({
    status: 'ok',
    data: station,
  });
});
