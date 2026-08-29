import { Router, Request, Response } from 'express';
import { sectionStore } from '../services/sectionStore.js';
import { generateAssetDataForBlocks } from '../generators/assetGenerator.js';

export const assetsRouter = Router();

/**
 * GET /api/assets
 * Accepts either:
 *  - from & to query parameters
 *  - block_ids (comma-separated list of IDs)
 */
assetsRouter.get('/', (req: Request, res: Response) => {
  const from = req.query.from as string;
  const to = req.query.to as string;
  const blockIdsQuery = req.query.block_ids as string;
  const corridorKey = (req.query.corridorKey as string) || (from && to ? `${from}-${to}` : 'default');

  let blockIds: string[] = [];

  if (blockIdsQuery) {
    blockIds = blockIdsQuery.split(',').map((id) => id.trim()).filter(Boolean);
  } else if (from && to) {
    try {
      const section = sectionStore.getOrCreateSection(from, to);
      blockIds = section.features.map((f) => f.properties.block_id);
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }
  }

  if (blockIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Provide either 'from' & 'to' station codes, or a 'block_ids' list",
    });
  }

  const assetData = generateAssetDataForBlocks(blockIds, corridorKey);

  res.json({
    success: true,
    corridor: corridorKey,
    total_tracked_assets: Object.keys(assetData).length,
    data: assetData,
  });
});

