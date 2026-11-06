import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import { assertDatabaseProvider, loadEnv, getEnvConfig } from '../../src/shared/config/index.js';

const originalWorkingDirectory = process.cwd();
const envFixtureDirectory = mkdtempSync(join(tmpdir(), 'kennedy-config-tests-'));

for (const environment of ['development', 'staging', 'production']) {
  writeFileSync(join(envFixtureDirectory, `.env.${environment}`), `NODE_ENV=${environment}\n`);
}

beforeAll(() => {
  process.chdir(envFixtureDirectory);
});

afterAll(() => {
  process.chdir(originalWorkingDirectory);
  rmSync(envFixtureDirectory, { recursive: true, force: true });
});

describe('Shared Config - Unit Tests', () => {
  beforeEach(() => {
    // Reset NODE_ENV before each test
    delete process.env.NODE_ENV;
  });

  describe('loadEnv', () => {
    it('should load development environment variables', () => {
      loadEnv('development');
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should load staging environment variables', () => {
      loadEnv('staging');
      expect(process.env.NODE_ENV).toBe('staging');
    });

    it('should load production environment variables', () => {
      loadEnv('production');
      expect(process.env.NODE_ENV).toBe('production');
    });
  });

  describe('getEnvConfig', () => {
    it('should return default values when env vars are not set', () => {
      const config = getEnvConfig();
      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('databaseUrl');
      expect(config).not.toHaveProperty('mongoUri');
    });

    it('should parse port as number', () => {
      loadEnv('development');
      const config = getEnvConfig();
      expect(typeof config.port).toBe('number');
    });

    it('should have default node env if not set', () => {
      delete process.env.NODE_ENV;
      const config = getEnvConfig();
      expect(['development', 'staging', 'production']).toContain(config.nodeEnv);
    });

    describe('assertDatabaseProvider', () => {
      it('requires SQLite for development and PostgreSQL for staging/production', () => {
        expect(() => assertDatabaseProvider('file:./dev.db', 'sqlite')).not.toThrow();
        expect(() => assertDatabaseProvider('postgresql://db.example/bank', 'postgresql')).not.toThrow();
        expect(() => assertDatabaseProvider('file:./dev.db', 'postgresql')).toThrow('must use the postgresql provider');
        expect(() => assertDatabaseProvider('postgresql://db.example/bank', 'sqlite')).toThrow('must use the sqlite provider');
      });
    });
  });
});
