import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { sql } from 'drizzle-orm';
import { getDb } from './db/index.js';
import { config } from './config.js';
import type { HealthResponse } from 'shared';
import authPlugin from './plugins/auth.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { serviceTypesRoutes } from './modules/service-types/service-types.routes.js';
import { serviceRecordsRoutes } from './modules/service-records/service-records.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { abandonmentReasonsRoutes } from './modules/abandonment-reasons/abandonment-reasons.routes.js';
import { contactAttemptsRoutes } from './modules/contact-attempts/contact-attempts.routes.js';
import { customersRoutes } from './modules/customers/customers.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.nodeEnv !== 'test',
  });

  // ── Plugins ─────────────────────────────────────────────
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await app.register(sensible);

  // Auth plugin (JWT + cookie) — must be registered before routes that need it
  await app.register(authPlugin);

  // ── Routes ──────────────────────────────────────────────
  app.get('/health', async (_request, _reply): Promise<HealthResponse> => {
    const db = getDb();

    // Verify DB connectivity with a lightweight query
    let dbStatus: 'connected' | 'error' = 'error';
    try {
      await db.run(sql`SELECT 1`);
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    };
  });

  // Auth module routes under /api/v1/auth
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Service types module routes under /api/v1/service-types
  await app.register(serviceTypesRoutes, { prefix: '/api/v1/service-types' });

  // Service records module routes under /api/v1/service-records
  await app.register(serviceRecordsRoutes, { prefix: '/api/v1/service-records' });

  // Tasks module routes under /api/v1/tasks
  await app.register(tasksRoutes, { prefix: '/api/v1/tasks' });

  // Abandonment reasons module routes under /api/v1/abandonment-reasons
  await app.register(abandonmentReasonsRoutes, { prefix: '/api/v1/abandonment-reasons' });

  // Contact attempts module routes under /api/v1/contact-attempts
  await app.register(contactAttemptsRoutes, { prefix: '/api/v1/contact-attempts' });

  // Customers module routes under /api/v1/customers
  await app.register(customersRoutes, { prefix: '/api/v1/customers' });

  return app;
}
