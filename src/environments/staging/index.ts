import { App } from '../../shared/app/app.ts';
import { loadEnv, getEnvConfig } from '../../shared/config/index.ts';
import { connectPrismaWithMongo, disconnectAllDatabases } from '../../shared/database/config.ts';

loadEnv('staging');

const config = getEnvConfig();

const startServer = async () => {
  try {
    const databases = await connectPrismaWithMongo(config.mongoUri, config.mongoDbName);
    const appInstance = new App(databases);
    const app = await appInstance.app();

    app.listen(config.port, () => {
      console.log(`🚀 Staging server running on port ${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
      console.log(`💾 Database: Prisma (MongoDB)`);
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
