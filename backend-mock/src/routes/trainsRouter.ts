import { Router, Request, Response } from 'express';
import { corridorStore } from '../services/sectionStore.js';

export const trainsRouter = Router();

/**
 * GET /api/train/:trainid
 */
trainsRouter.get('/:trainid', (req: Request, res: Response) => {
  const trainId = parseInt(req.params.trainid, 10);

  if (isNaN(trainId)) {
    return res.json({
      status: 'error',
      data: {
        message: 'Invalid train ID: must be an integer',
      },
    });
  }

  const train = corridorStore.findTrain(trainId);

  if (!train) {
    return res.json({
      status: 'error',
      data: {
        message: `Train with ID ${trainId} not found`,
      },
    });
  }

  res.json({
    status: 'ok',
    data: train,
  });
});

