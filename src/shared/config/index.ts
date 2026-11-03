import dotenv from 'dotenv';

/**
 * loadEnv - Loads environment variables from .env files
 *
 * This function loads environment variables based on the specified environment.
 * It first tries to load from the environment-specific file (.env.development,
 * .env.staging, .env.production), then falls back to .env if the specific
 * file doesn't exist or doesn't contain DATABASE_URL.
 *
 * @param env - Environment name ('development' | 'staging' | 'production')
 */
export const loadEnv = (env: 'development' | 'staging' | 'production') => {
  const envFile = `.env.${env}`;
  dotenv.config({ path: envFile });

  // Fallback to .env if environment-specific file doesn't exist
  if (!process.env.DATABASE_URL) {
    dotenv.config();
  }
};

/**
 * getEnvConfig - Returns environment configuration object
 *
 * This function extracts and returns environment configuration as a typed object.
 * It provides default values for missing environment variables.
 *
 * @returns { nodeEnv, port, databaseUrl } - Configuration object
 */
export const getEnvConfig = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || ''
});

export const assertDatabaseProvider = (
  databaseUrl: string,
  provider: 'sqlite' | 'postgresql'
): void => {
  const isExpectedProvider = provider === 'sqlite'
    ? databaseUrl.startsWith('file:')
    : databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

  if (!isExpectedProvider) {
    throw new Error(`DATABASE_URL must use the ${provider} provider for this environment`);
  }
};
