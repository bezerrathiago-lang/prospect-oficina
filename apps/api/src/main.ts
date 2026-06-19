import { buildApp } from './app.js';
import { config } from './config.js';

const app = await buildApp();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`ProspectMoto API running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
