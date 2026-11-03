import express, { Express, Router, RequestHandler, ErrorRequestHandler } from "express";
import { DatabaseConfig } from "../database/config.ts";
import { getAllowedOrigins } from "../config/security.config.ts";
import { createCookieCsrfMiddleware } from "../middleware/csrf.middleware.ts";

/**
 * AppRegistry - Singleton service for managing the Express application instance
 *
 * This service provides a centralized way to manage the Express app instance,
 * allowing route classes and other parts of the application to register routes
 * and middleware without needing to instantiate the App class.
 */
class AppRegistry {
  private static instance: AppRegistry;
  private app: Express | null = null;
  private databases: DatabaseConfig | null = null;

  private constructor() { }

  /**
   * Get the singleton instance of AppRegistry
   */
  static getInstance(): AppRegistry {
    if (!AppRegistry.instance) {
      AppRegistry.instance = new AppRegistry();
    }
    return AppRegistry.instance;
  }

  /**
   * Initialize the Express app with database configuration.
   * Must be called before using registerRoute or registerMiddleware
   */
  async initialize(databases: DatabaseConfig): Promise<Express> {
    if (this.app) {
      return this.app;
    }

    const trustProxyHops = process.env.TRUST_PROXY_HOPS;
    let trustedHops: number | undefined;
    if (trustProxyHops !== undefined && trustProxyHops !== '') {
      trustedHops = Number(trustProxyHops);
      if (!Number.isSafeInteger(trustedHops) || trustedHops < 1) {
        throw new Error('TRUST_PROXY_HOPS must be a positive integer');
      }
    }

    this.databases = databases;
    this.app = express();
    if (trustedHops !== undefined) {
      this.app.set('trust proxy', trustedHops);
    }

    // Configure default middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Initialize cookie-parser and cors
    const cookieParser = await import('cookie-parser');
    const cors = await import('cors');
    const allowedOrigins = getAllowedOrigins();

    this.app.use(cookieParser.default());
    this.app.use(cors.default({
      origin: (origin, callback) => {
        callback(null, !origin || allowedOrigins.includes(origin));
      },
      credentials: true,
    }));
    this.app.use(createCookieCsrfMiddleware(allowedOrigins));

    return this.app;
  }

  /**
   * Register a route or router at a specific path
   */
  registerRoute(path: string, route: Router | RequestHandler): void {
    if (!this.app) {
      throw new Error("AppRegistry not initialized. Call initialize() first.");
    }
    this.app.use(path, route);
  }

  /**
   * Register middleware globally
   */
  registerMiddleware(middleware: RequestHandler): void {
    if (!this.app) {
      throw new Error("AppRegistry not initialized. Call initialize() first.");
    }
    this.app.use(middleware);
  }

  /**
   * Register error handling middleware (should be registered last)
   */
  registerErrorHandler(middleware: ErrorRequestHandler): void {
    if (!this.app) {
      throw new Error("AppRegistry not initialized. Call initialize() first.");
    }
    this.app.use(middleware);
  }

  /**
   * Get the Express application instance
   */
  getApp(): Express {
    if (!this.app) {
      throw new Error("AppRegistry not initialized. Call initialize() first.");
    }
    return this.app;
  }

  /**
   * Check if the app is initialized
   */
  isInitialized(): boolean {
    return this.app !== null;
  }

  /**
   * Get the database configuration
   */
  getDatabases(): DatabaseConfig {
    if (!this.databases) {
      throw new Error("AppRegistry not initialized. Call initialize() first.");
    }
    return this.databases;
  }

  /**
   * Reset the registry (useful for testing)
   */
  reset(): void {
    this.app = null;
    this.databases = null;
  }
}

export default AppRegistry;
