import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stationsRouter } from './routes/stationsRouter.js';
import { corridorsRouter } from './routes/corridorsRouter.js';
import { trainsRouter } from './routes/trainsRouter.js';
import { resourcesRouter } from './routes/resourcesRouter.js';
import { planRouter } from './routes/planRouter.js';

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
    status: 'ok',
    data: {
      service: 'SIH26027 Indian Railways JSON-RPC Block Planning Backend',
      version: '2.0.0',
      endpoints: {
        health: 'GET /api/health',
        stations: 'GET /api/stations',
        corridors: 'GET /api/corridors',
        corridorDetail: 'GET /api/corridors/:corridor',
        train: 'GET /api/train/:trainid',
        resource: 'GET /api/resource/:resourceid',
        resourceIssues: 'GET /api/resource/:resourceid/issue',
        reportIssue: 'POST /api/resource/:resourceid/issue',
        resolveIssue: 'DELETE /api/resource/:resourceid/issue/:issueid',
        blockResource: 'POST /api/resource/:resourceid/block',
        plan: 'POST /api/plan',
      },
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    },
  });
});

// Mount modular sub-routers
app.use('/api/stations', stationsRouter);
app.use('/api/corridors', corridorsRouter);
app.use('/api/train', trainsRouter);
app.use('/api/resource', resourcesRouter);
app.use('/api/plan', planRouter);

// 404 Handler (always 404 with JSON-RPC error format)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    data: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global Error Handler (HTTP 200 with status: "error" per JSON-RPC spec)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(200).json({
    status: 'error',
    data: {
      message: err.message || 'Internal Server Error',
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚂 SIH26027 Railway JSON-RPC Backend running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Corridors: http://localhost:${PORT}/api/corridors/NDLS_AGC`);
  console.log(`🛤️  Resources: http://localhost:${PORT}/api/resource/1010`);
  console.log(`========================================================\n`);
});
