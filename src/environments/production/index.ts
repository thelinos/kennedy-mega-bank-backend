import { App } from '../../shared/app/app.ts';
import { assertDatabaseProvider, loadEnv, getEnvConfig } from '../../shared/config/index.ts';
import { connectPrismaOnly, disconnectAllDatabases } from '../../shared/database/config.ts';

loadEnv('production');

const config = getEnvConfig();

const startServer = async () => {
  try {
    assertDatabaseProvider(config.databaseUrl, 'postgresql');
    const databases = await connectPrismaOnly();
    const appInstance = new App(databases);
    const app = await appInstance.app();

    app.listen(config.port, () => {
      console.log(`🚀 Production server running on port ${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
      console.log(`💾 Database: PostgreSQL`);
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await disconnectAllDatabases(databases);
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
