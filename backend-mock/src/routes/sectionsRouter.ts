import { Router, Request, Response } from 'express';
import { sectionStore } from '../services/sectionStore.js';
import { findStationByCode } from '../data/stations.js';
import { calculateHaversineDistance } from '../generators/geometryGenerator.js';

export const sectionsRouter = Router();

/**
 * Helper to handle section request
 */
function handleGetSection(from: string, to: string, res: Response) {
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: "Missing required query parameters: 'from' and 'to'",
    });
  }

  if (from.toUpperCase() === to.toUpperCase()) {
    return res.status(400).json({
      success: false,
      error: "Origin and Destination stations cannot be identical",
    });
  }

  try {
    const fromStation = findStationByCode(from);
    const toStation = findStationByCode(to);

    if (!fromStation) {
      return res.status(404).json({
        success: false,
        error: `Origin station not recognized: '${from}'`,
      });
    }

    if (!toStation) {
      return res.status(404).json({
        success: false,
        error: `Destination station not recognized: '${to}'`,
      });
    }

    const featureCollection = sectionStore.getOrCreateSection(from, to);
    const straightDist = calculateHaversineDistance(
      fromStation.lat,
      fromStation.lng,
      toStation.lat,
      toStation.lng
    );

    res.json({
      success: true,
      meta: {
        from: fromStation,
        to: toStation,
        distance_km: Math.round(straightDist * 1.18),
        total_blocks: featureCollection.features.length,
      },
      data: featureCollection,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate block section',
    });
  }
}

/**
 * GET /api/sections?from=NDLS&to=AGC
 */
sectionsRouter.get('/', (req: Request, res: Response) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  handleGetSection(from, to, res);
});

/**
 * GET /api/sections/:from/:to
 */
sectionsRouter.get('/:from/:to', (req: Request, res: Response) => {
  const { from, to } = req.params;
  handleGetSection(from, to, res);
});

