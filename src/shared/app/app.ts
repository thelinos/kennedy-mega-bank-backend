import { Express } from "express"
import swaggerUi from "swagger-ui-express";

import { DatabaseConfig } from "../database/config.ts";
import { requestLogger } from "../middleware/requestLogger.ts";
import { errorHandler } from "../middleware/errorHandler.ts";
import { JWTUtil } from "../utils/jwt.util.ts";
import AppRegistry from "./app-registry.ts";
import passport, { configureGoogleOAuth } from "../config/oauth.config.ts";
import { CreateAccount } from "../../features/account/index.ts";
import { CreateTransaction } from "../../features/transaction/index.ts";
import { CreateUser, ForgotPassword, GoogleOAuth, PhoneAuth, Me, ResetPassword, Refresh, Logout, Login, VerifyUser } from "../../features/user/authentication/index.ts";
import { CollectName, CollectProfilePicture, UpdateName, UpdateProfilePicture } from "../../features/user/account_details/index.ts";
import { openApiSpec } from "./openapi.ts";

/**
 * App - Main application class for configuring and initializing the Express server
 *
 * This class is responsible for:
 * - Initializing the Express application with database connections
 * - Registering all middleware (logging, error handling)
 * - Registering all authentication routes
 * - Configuring health check endpoint
 * - Managing the application lifecycle through AppRegistry singleton
 *
 * The App class uses the AppRegistry singleton pattern to ensure only one
 * Express instance exists per application, allowing centralized management of
 * routes and middleware across the application.
 *
 * @constructor Takes the active Prisma database configuration
 */
export class App {
  constructor(private databases: DatabaseConfig) { }

  /**
   * app - Initializes and returns the configured Express application
   *
   * This method:
   * 1. Gets the AppRegistry singleton instance
   * 2. Initializes the app with database connections (if not already initialized)
   * 3. Registers middleware (request logger, error handler)
   * 4. Registers all authentication routes
   * 5. Configures health check endpoint
   * 6. Returns the configured Express app
   *
   * @returns Promise<Express> - The configured Express application instance
   */
  public async app(): Promise<Express> {
    const registry = AppRegistry.getInstance();

    // Initialize the app with databases if not already initialized
    if (!registry.isInitialized()) {
      JWTUtil.validateConfiguration();
      await registry.initialize(this.databases);

      // Configure Google OAuth (must be called after env vars are loaded)
      configureGoogleOAuth();

      // Register middleware
      registry.registerMiddleware(requestLogger);

      // Initialize Passport
      const app = registry.getApp();
      app.use(passport.initialize());

      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
      app.get("/api-docs.json", (_req, res) => {
        res.json(openApiSpec);
      });

      // Register routes
      registry.registerRoute("/authentication", new CreateUser().createUserRoute);
      registry.registerRoute("/authentication", new VerifyUser().verifyUserRoutes);
      registry.registerRoute("/authentication", new Login().loginRoute);
      registry.registerRoute("/authentication", new Logout().logoutRoute);
      registry.registerRoute("/authentication", new Refresh().refreshRoute);
      registry.registerRoute("/authentication", new ForgotPassword().forgotPasswordRoute);
      registry.registerRoute("/authentication", new ResetPassword().resetPasswordRoute);
      registry.registerRoute("/authentication", new Me().meRoute);

      // Register OAuth2 routes
      const googleOAuth = new GoogleOAuth();
      registry.registerRoute("/authentication", googleOAuth.googleAuthRoute);
      registry.registerRoute("/authentication", googleOAuth.googleCallbackRoute);

      // Register phone authentication routes
      const phoneAuth = new PhoneAuth();
      registry.registerRoute("/authentication", phoneAuth.sendOTPRoute);
      registry.registerRoute("/authentication", phoneAuth.verifyOTPRoute);

      // Register account details routes
      registry.registerRoute("/account-details", new CollectName().collectNameRoute);
      registry.registerRoute("/account-details", new CollectProfilePicture().collectProfilePictureRoute);
      registry.registerRoute("/account-details", new UpdateName().updateNameRoute);
      registry.registerRoute("/account-details", new UpdateProfilePicture().updateProfilePictureRoute);

      registry.registerRoute("/accounts", new CreateAccount().createAccountRoute);
      registry.registerRoute("/transactions", new CreateTransaction().createTransactionRoute);

      // Register health check endpoint
      app.get('/health', (_req, res) => {
        const databaseUrl = process.env.DATABASE_URL || '';
        const dbType = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
          ? 'PostgreSQL'
          : 'SQLite';
        res.json({
          status: 'ok',
          environment: process.env.NODE_ENV,
          database: dbType
        });
      });

      // Register error handler (should be last)
      registry.registerErrorHandler(errorHandler);
    }

    return registry.getApp();
  }
}
