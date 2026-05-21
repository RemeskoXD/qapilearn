import { execSync } from 'node:child_process';
import './lib/env.js'; // Automaticky načte dotenv a připojí ?schema=qhub pro izolaci

try {
  console.log('[Q-Hub] Synchronizuji databázové schéma ve schématu (schema=qhub)...');
  execSync('npx prisma db push --schema server/prisma/schema.prisma --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[Q-Hub] Schéma úspěšně synchronizováno.');
} catch (error) {
  console.error('[Q-Hub] Selhala synchronizace databázového schématu:', error);
  process.exit(1);
}
