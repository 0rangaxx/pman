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

const app = express();

// Initialize start time for timing logs
const startTime = Date.now();

function logTimestamp(message: string) {
  const elapsed = Date.now() - startTime;
  console.log(`[${new Date().toISOString()}] (${elapsed}ms) ${message}`);
}

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add request timeout middleware
const REQUEST_TIMEOUT = 30000; // 30 seconds
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(REQUEST_TIMEOUT, () => {
    res.status(408).json({
      error: "Request timeout",
      timestamp: new Date().toISOString()
    });
  });
  next();
});

// Request logging middleware with error handling
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logTimestamp(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  // Handle response errors
  res.on('error', (error) => {
    console.error('Response error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        timestamp: new Date().toISOString()
      });
    }
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
}

// Run database migrations with improved error handling
async function runMigrations(): Promise<void> {
  logTimestamp("Starting database migrations...");
  
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
        logTimestamp("Database migrations completed successfully");
        resolve();
      } else {
        reject(new Error(`Migration failed with exit code ${code}`));
      }
    });

    migrationProcess.on('error', (error) => {
      clearTimeout(migrationTimeout);
      reject(new Error(`Failed to start migration process: ${error.message}`));
    });
  });
}

// Enhanced health check endpoint with database verification
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.select().from(users).limit(1);
    
    const response: HealthCheckResponse = {
      status: 'healthy',
      uptime: process.uptime(),
      database: 'connected',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Health check failed:', error);
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
          console.error('Error closing test server:', error);
        }
        resolve(false);
      }
    };

    // Set timeout for port check
    const timeoutId = setTimeout(cleanup, 3000);

    testServer.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error(`Error checking port ${port}:`, error.message);
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

async function startServer() {
  let server: ReturnType<typeof createServer>;
  let isShuttingDown = false;
  let shutdownTimeout: NodeJS.Timeout;
  
  const cleanup = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log('Starting cleanup process...');
    clearTimeout(shutdownTimeout);
    
    return new Promise<void>((resolve) => {
      server?.close(() => {
        console.log('Server closed successfully');
        resolve();
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.log('Force closing server after timeout');
        resolve();
      }, 10000);
    });
  };
  
  try {
    logTimestamp("Starting server initialization...");

    // Run migrations first
    await runMigrations();

    // Initialize database connection
    logTimestamp("Initializing database connection...");
    const db = await getDb();
    if (!db) {
      throw new AppError(500, "Database initialization failed");
    }

    // Test database connection
    await db.select().from(users).limit(1);
    logTimestamp("Database connection verified");

    const PORT = parseInt(process.env.PORT || "5000", 10);

    // Check port availability
    logTimestamp(`Checking port ${PORT} availability...`);
    const isPortAvailable = await checkPortAvailable(PORT);
    if (!isPortAvailable) {
      throw new AppError(500, `Port ${PORT} is not available`);
    }
    logTimestamp(`Port ${PORT} is available`);

    // Create HTTP server with proper error handling
    server = createServer(app);
    
    // Register routes and middleware
    registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error("Server error:", {
        status,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });

      if (!res.headersSent) {
        res.status(status).json({
          error: message,
          status,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Setup Vite or static files
    if (process.env.NODE_ENV !== "production") {
      try {
        await setupVite(app, server);
        logTimestamp("Vite development server initialized");
      } catch (error) {
        throw new AppError(500, "Failed to initialize Vite server", error);
      }
    } else {
      serveStatic(app);
      logTimestamp("Static file serving configured");
    }

    // Graceful shutdown handlers
    process.once('SIGTERM', cleanup);
    process.once('SIGINT', cleanup);
    
    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', async (error) => {
      console.error('Unhandled rejection:', error);
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
        await cleanup();
        reject(new AppError(500, "Server startup failed", error));
      });

      server.listen(PORT, "0.0.0.0", async () => {
        try {
          serverStarted = true;
          clearTimeout(startupTimeout);
          logTimestamp(`Server started on port ${PORT}`);

          // Verify server is responding with retries
          let retries = 3;
          while (retries > 0) {
            try {
              const response = await fetch(`http://0.0.0.0:${PORT}/health`);
              const data = await response.json() as HealthCheckResponse;
              
              if (data.status === 'healthy') {
                logTimestamp("Server health check passed");
                resolve(server);
                return;
              }
              throw new Error(`Unhealthy response: ${data.error || 'Unknown error'}`);
            } catch (error) {
              retries--;
              if (retries === 0) {
                throw error;
              }
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
    console.error("Server initialization failed:", error);
    throw error;
  }
}

// Start server with improved error handling
logTimestamp("Starting server...");
startServer().catch(async (error) => {
  console.error("Fatal server error:", error);
  process.exit(1);
});
