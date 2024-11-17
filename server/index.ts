import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

(async () => {
  const server = createServer(app);
  
  // Register API routes first
  registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Setup Vite or static file serving based on environment
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving...");
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "5000", 10);
  
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toLocaleTimeString()}] Server is running on port ${PORT}`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
})().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
