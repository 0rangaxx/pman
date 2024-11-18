import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { getDb } from "./db";
import { spawn } from "child_process";
import fetch from "node-fetch";
import { users } from "../db/schema";
import { join } from "path";
import { existsSync, mkdirSync } from 'fs';
import logger, { requestLogger, errorLogger } from './utils/logger';
import { validateEnv, getValidatedEnv } from './utils/env-validator';

// Create logs directory if it doesn't exist
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

const app = express();

// Initialize start time for timing logs
const startTime = Date.now();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add request logging middleware
app.use(requestLogger);

// Add request timeout middleware
const REQUEST_TIMEOUT = 30000; // 30 seconds
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(REQUEST_TIMEOUT, () => {
    logger.warn('Request timeout', {
      method: req.method,
      url: req.url,
      timeout: REQUEST_TIMEOUT
    });
    res.status(408).json({
      error: "Request timeout",
      timestamp: new Date().toISOString()
    });
  });
  next();
});

// Custom error types
class AppError extends Error {
  constructor(public statusCode: number, message: string, public cause?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  database: 'connected' | 'disconnected';
  timestamp: string;
  error?: string;
  environment?: string;
}

// Run database migrations with improved error handling
async function runMigrations(): Promise<void> {
  logger.info("Starting database migrations...");
  
  return new Promise((resolve, reject) => {
    const migrationProcess = spawn('tsx', ['scripts/migrate.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });

    const migrationTimeout = setTimeout(() => {
      migrationProcess.kill();
      reject(new Error('Migration timed out after 30 seconds'));
    }, 30000);

    migrationProcess.on('close', (code) => {
      clearTimeout(migrationTimeout);
      if (code === 0) {
        logger.info("Database migrations completed successfully");
        resolve();
      } else {
        reject(new Error(`Migration failed with exit code ${code}`));
      }
    });

    migrationProcess.on('error', (error) => {
      clearTimeout(migrationTimeout);
      logger.error("Migration process error", { error });
      reject(new Error(`Failed to start migration process: ${error.message}`));
    });
  });
}

// Enhanced health check endpoint with database and environment verification
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const env = getValidatedEnv();
    const db = await getDb();
    await db.select().from(users).limit(1);
    
    const response: HealthCheckResponse = {
      status: 'healthy',
      uptime: process.uptime(),
      database: 'connected',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
    
    logger.info("Health check successful", response);
    res.json(response);
  } catch (error) {
    logger.error("Health check failed", { error });
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      uptime: process.uptime(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    res.status(503).json(response);
  }
});

async function startServer() {
  let server: ReturnType<typeof createServer>;
  let isShuttingDown = false;
  
  const cleanup = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    logger.info('Starting cleanup process...');
    
    return new Promise<void>((resolve) => {
      server?.close(() => {
        logger.info('Server closed successfully');
        resolve();
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.warn('Force closing server after timeout');
        resolve();
      }, 10000);
    });
  };
  
  try {
    logger.info("Starting server initialization...");

    // Validate environment variables first
    const env = validateEnv();
    logger.info("Environment validation successful", { 
      nodeEnv: env.NODE_ENV,
      port: env.PORT 
    });

    // Run migrations
    await runMigrations();

    // Initialize database connection
    logger.info("Initializing database connection...");
    const db = await getDb();
    if (!db) {
      throw new AppError(500, "Database initialization failed");
    }

    // Test database connection
    await db.select().from(users).limit(1);
    logger.info("Database connection verified");

    // Check port availability
    logger.info(`Checking port ${env.PORT} availability...`);
    const isPortAvailable = await checkPortAvailable(env.PORT);
    if (!isPortAvailable) {
      throw new AppError(500, `Port ${env.PORT} is not available`);
    }
    logger.info(`Port ${env.PORT} is available`);

    // Create HTTP server with proper error handling
    server = createServer(app);
    
    // Register routes and middleware
    registerRoutes(app);

    // Add error logging middleware
    app.use(errorLogger);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      if (!res.headersSent) {
        res.status(status).json({
          error: message,
          status,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Setup Vite or static files based on environment
    if (env.NODE_ENV !== "production") {
      try {
        await setupVite(app, server);
        logger.info("Vite development server initialized");
      } catch (error) {
        throw new AppError(500, "Failed to initialize Vite server", error);
      }
    } else {
      serveStatic(app);
      logger.info("Static file serving configured");
    }

    // Graceful shutdown handlers
    process.once('SIGTERM', cleanup);
    process.once('SIGINT', cleanup);
    
    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception', { error });
      await cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', async (error) => {
      logger.error('Unhandled rejection', { error });
      await cleanup();
      process.exit(1);
    });

    return new Promise((resolve, reject) => {
      let serverStarted = false;
      
      const startupTimeout = setTimeout(() => {
        if (!serverStarted) {
          cleanup().then(() => {
            reject(new AppError(500, "Server failed to start within timeout period"));
          });
        }
      }, 30000);

      server.once('error', async (error) => {
        clearTimeout(startupTimeout);
        logger.error("Server startup error", { error });
        await cleanup();
        reject(new AppError(500, "Server startup failed", error));
      });

      server.listen(env.PORT, "0.0.0.0", async () => {
        try {
          serverStarted = true;
          clearTimeout(startupTimeout);
          logger.info(`Server started on port ${env.PORT}`);

          // Verify server is responding with retries
          let retries = 3;
          while (retries > 0) {
            try {
              const response = await fetch(`http://0.0.0.0:${env.PORT}/health`);
              const data = await response.json() as HealthCheckResponse;
              
              if (data.status === 'healthy') {
                logger.info("Server health check passed");
                resolve(server);
                return;
              }
              throw new Error(`Unhealthy response: ${data.error || 'Unknown error'}`);
            } catch (error) {
              retries--;
              if (retries === 0) {
                throw error;
              }
              logger.warn(`Health check failed, retrying... (${retries} attempts left)`, { error });
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          await cleanup();
          reject(new AppError(500, "Server health check failed", error));
        }
      });
    });
  } catch (error) {
    await cleanup();
    logger.error("Server initialization failed", { error });
    throw error;
  }
}

// Check port availability with timeout
async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const testServer = createServer();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          testServer.close();
        } catch (error) {
          logger.error("Error closing test server", { error });
        }
        resolve(false);
      }
    };

    const timeoutId = setTimeout(cleanup, 3000);

    testServer.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error(`Error checking port ${port}`, { error });
      }
      clearTimeout(timeoutId);
      cleanup();
    });

    testServer.once('listening', () => {
      clearTimeout(timeoutId);
      if (!resolved) {
        resolved = true;
        testServer.close(() => resolve(true));
      }
    });

    testServer.listen(port, '0.0.0.0');
  });
}

// Start server with improved error handling
logger.info("Starting server...");
startServer().catch(async (error) => {
  logger.error("Fatal server error", { error });
  process.exit(1);
});