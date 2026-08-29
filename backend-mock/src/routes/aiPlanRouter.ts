import { Router, Request, Response } from 'express';
import { sectionStore } from '../services/sectionStore.js';
import { generateAiPlanForBlocks } from '../generators/aiPlanGenerator.js';

export const aiPlanRouter = Router();

/**
 * GET /api/ai-plan
 * Accepts either:
 *  - from & to query parameters
 *  - block_ids (comma-separated list of IDs)
 */
aiPlanRouter.get('/', (req: Request, res: Response) => {
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

  const aiPlan = generateAiPlanForBlocks(blockIds, corridorKey);

  res.json({
    success: true,
    corridor: corridorKey,
    total_planned_blocks: Object.keys(aiPlan).length,
    data: aiPlan,
  });
});

