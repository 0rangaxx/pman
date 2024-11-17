import { createLogger, format, transports } from 'winston';
import { join } from 'path';

const { combine, timestamp, printf, colorize } = format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logs directory if it doesn't exist
const logsDir = join(process.cwd(), 'logs');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    // Console transport with colors
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      )
    }),
    // File transport for errors
    new transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new transports.File({
      filename: join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add request context
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request
  logger.info(`Incoming ${req.method} ${req.url}`, {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
    ip: req.ip
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Outgoing ${req.method} ${req.url}`, {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

// Error logger middleware
export const errorLogger = (err: any, req: any, res: any, next: any) => {
  logger.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      ...err
    },
    request: {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers,
      ip: req.ip
    }
  });
  next(err);
};

export default logger;
