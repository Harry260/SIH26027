import { Router, Request, Response } from 'express';
import { sectionStore } from '../services/sectionStore.js';
import { SubmitIssuePayload } from '../types/index.js';

export const issuesRouter = Router();

/**
 * POST /api/issues
 * Submits a new telemetry / maintenance issue on a block
 */
issuesRouter.post('/', (req: Request, res: Response) => {
  const payload: SubmitIssuePayload = req.body;

  if (!payload.block_id || !payload.issue_type || !payload.description || !payload.severity) {
    return res.status(400).json({
      success: false,
      error: 'Missing required issue fields: block_id, issue_type, description, severity',
    });
  }

  // Exact payload logging as requested by SIH26027 spec
  console.log('[Indian Railways S&T API] New Issue Report Submitted:', {
    block_id: payload.block_id,
    issue_type: payload.issue_type,
    description: payload.description,
    severity: payload.severity,
    reported_by: payload.reported_by || 'controller_demo',
    timestamp: payload.timestamp || new Date().toISOString(),
  });

  const result = sectionStore.addIssue(payload);

  res.status(201).json({
    success: true,
    issue_id: result.issue.issue_id,
    timestamp: result.issue.timestamp,
    data: result.issue,
  });
});

/**
 * DELETE /api/issues/:issueId
 * Resolves / removes an active issue from a block
 */
issuesRouter.delete('/:issueId', (req: Request, res: Response) => {
  const { issueId } = req.params;
  const blockId = req.query.block_id as string | undefined;

  const result = sectionStore.resolveIssue(issueId, blockId);

  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: `Issue '${issueId}' not found or already resolved`,
    });
  }

  console.log(`[Indian Railways S&T API] Issue '${issueId}' resolved successfully.`);

  res.json({
    success: true,
    message: `Issue '${issueId}' resolved successfully`,
    resolvedCount: result.resolvedCount,
  });
});

/**
 * GET /api/blocks/:blockId
 * Retrieves real-time state and issues for an individual block
 */
issuesRouter.get('/blocks/:blockId', (req: Request, res: Response) => {
  const { blockId } = req.params;
  const target = sectionStore.findBlock(blockId);

  if (!target) {
    return res.status(404).json({
      success: false,
      error: `Block with ID '${blockId}' not found in active sections`,
    });
  }

  res.json({
    success: true,
    data: target.feature,
  });
});

