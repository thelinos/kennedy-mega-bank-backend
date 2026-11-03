import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default function setupTestDatabase(): void {
  const databaseUrl = `file:${resolve(process.cwd(), 'tests/test.db')}`;

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
  };

  execFileSync('npx', ['prisma', 'generate', '--schema', 'prisma/schema.prisma'], {
    env,
    stdio: 'inherit',
  });
  execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], {
    env,
    stdio: 'inherit',
  });
}
