import app from './app';
import { PORT } from './config';

// @ts-ignore - Bun global is available at runtime
Bun.serve({
  fetch: app.fetch,
  port: PORT,
  hostname: '0.0.0.0',
  idleTimeout: 120, // 2 minutes for long-running operations like bulk delete
});

console.log(`Server running on http://0.0.0.0:${PORT}`);
