import { Router, Request, Response } from 'express';
import { corridorStore } from '../services/sectionStore.js';
import { SubmitIssueBody, ResourceBlock } from '../types/index.js';

export const resourcesRouter = Router();

/**
 * GET /api/resource/:resourceid
 */
resourcesRouter.get('/:resourceid', (req: Request, res: Response) => {
  const resourceId = parseInt(req.params.resourceid, 10);

  if (isNaN(resourceId)) {
    return res.json({
      status: 'error',
      data: { message: 'Invalid resource ID: must be an integer' },
    });
  }

  const target = corridorStore.findResource(resourceId);

  if (!target) {
    return res.json({
      status: 'error',
      data: { message: `Resource with ID ${resourceId} not found` },
    });
  }

  res.json({
    status: 'ok',
    data: target.resourceInfo,
  });
});

/**
 * GET /api/resource/:resourceid/issue
 */
resourcesRouter.get('/:resourceid/issue', (req: Request, res: Response) => {
  const resourceId = parseInt(req.params.resourceid, 10);

  if (isNaN(resourceId)) {
    return res.json({
      status: 'error',
      data: { message: 'Invalid resource ID: must be an integer' },
    });
  }

  const issues = corridorStore.getResourceIssues(resourceId);

  res.json({
    status: 'ok',
    data: issues,
  });
});

/**
 * POST /api/resource/:resourceid/issue
 */
resourcesRouter.post('/:resourceid/issue', (req: Request, res: Response) => {
  const resourceId = parseInt(req.params.resourceid, 10);
  const body: SubmitIssueBody = req.body;

  if (isNaN(resourceId)) {
    return res.json({
      status: 'error',
      data: { message: 'Invalid resource ID: must be an integer' },
    });
  }

  if (!body.issue_type || !body.description) {
    return res.json({
      status: 'error',
      data: { message: 'Missing required issue fields: issue_type, description' },
    });
  }

  const result = corridorStore.addIssue(resourceId, body);

  console.log(`[Indian Railways S&T API] New Issue Reported on Resource ${resourceId}:`, {
    issue_id: result.issue_id,
    severity: result.severity,
    ...body,
  });

  res.json({
    status: 'ok',
    data: {
      issue_id: result.issue_id,
      severity: result.severity,
    },
  });
});

/**
 * DELETE /api/resource/:resourceid/issue/:issueid
 */
resourcesRouter.delete('/:resourceid/issue/:issueid', (req: Request, res: Response) => {
  const resourceId = parseInt(req.params.resourceid, 10);
  const issueId = parseInt(req.params.issueid, 10);

  if (isNaN(resourceId) || isNaN(issueId)) {
    return res.json({
      status: 'error',
      data: { message: 'Invalid IDs: resource ID and issue ID must be integers' },
    });
  }

  const result = corridorStore.resolveIssue(resourceId, issueId);

  res.json({
    status: 'ok',
    data: {
      resolved: result.resolved,
    },
  });
});

/**
 * POST /api/resource/:resourceid/block
 */
resourcesRouter.post('/:resourceid/block', (req: Request, res: Response) => {
  const resourceId = parseInt(req.params.resourceid, 10);
  const body: Partial<ResourceBlock> = req.body;

  if (isNaN(resourceId)) {
    return res.json({
      status: 'error',
      data: { message: 'Invalid resource ID: must be an integer' },
    });
  }

  const blockPayload: ResourceBlock = {
    resource_id: resourceId,
    start: typeof body.start === 'number' ? body.start : 0,
    end: typeof body.end === 'number' ? body.end : 60,
  };

  const result = corridorStore.addResourceBlock(blockPayload);

  res.json({
    status: 'ok',
    data: {
      success: result.success,
    },
  });
});

