
/*
 index.ts — application entry point

 Order is critical:
   1. Load secrets from Vault into process.env
   2. THEN import server.ts (which imports routes → Prisma → reads DATABASE_URL)

 Using a dynamic import for server.ts guarantees it isn't evaluated
 until after loadVaultSecrets() has resolved, regardless of how the
 TypeScript compiler orders things.
 */

import { loadVaultSecrets } from './bootstrap';
import { execSync } from 'child_process';

async function main(): Promise<void> {
  await loadVaultSecrets();

  // Run migrations now that DATABASE_URL is in process.env
  console.log('[server] Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('[server] Migrations complete.');

  require('./server');
}

main().catch((err: unknown) => {
  console.error('[fatal] Failed to start server:', err);
  process.exit(1);
});