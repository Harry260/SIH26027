import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stationsRouter } from './routes/stationsRouter.js';
import { sectionsRouter } from './routes/sectionsRouter.js';
import { aiPlanRouter } from './routes/aiPlanRouter.js';
import { assetsRouter } from './routes/assetsRouter.js';
import { issuesRouter } from './routes/issuesRouter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend clients
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON body parser
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root API Sitemap / Health Check
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'SIH26027 Indian Railways AI Block Planning Mock Backend',
    version: '1.0.0',
    status: 'ONLINE',
    endpoints: {
      health: 'GET /api/health',
      stations: 'GET /api/stations',
      corridors: 'GET /api/stations/meta/corridors',
      sections: 'GET /api/sections?from={CODE}&to={CODE}',
      aiPlan: 'GET /api/ai-plan?from={CODE}&to={CODE}',
      assets: 'GET /api/assets?from={CODE}&to={CODE}',
      issues: 'POST /api/issues',
      resolveIssue: 'DELETE /api/issues/:issueId',
      blockDetail: 'GET /api/issues/blocks/:blockId',
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// Mount modular sub-routers
app.use('/api/stations', stationsRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/ai-plan', aiPlanRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/issues', issuesRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚂 SIH26027 Railway Mock Backend is running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Stations: http://localhost:${PORT}/api/stations`);
  console.log(`🛤️  Dynamic Sections: http://localhost:${PORT}/api/sections?from=NDLS&to=AGC`);
  console.log(`========================================================\n`);
});

