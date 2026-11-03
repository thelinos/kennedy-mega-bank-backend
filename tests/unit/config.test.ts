import { describe, it, expect, beforeEach } from 'vitest';
import { assertDatabaseProvider, loadEnv, getEnvConfig } from '../../src/shared/config/index.js';

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
