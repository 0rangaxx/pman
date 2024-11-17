import { z } from 'zod';
import logger from './logger';

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(5000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL')
});

export type EnvVars = z.infer<typeof envSchema>;

class EnvironmentError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

export function validateEnv(): EnvVars {
  try {
    logger.info('Validating environment variables...');
    
    const result = envSchema.safeParse(process.env);
    
    if (!result.success) {
      const errors = result.error.errors.map(error => ({
        path: error.path.join('.'),
        message: error.message
      }));
      
      logger.error('Environment validation failed', { errors });
      throw new EnvironmentError('Environment validation failed', errors);
    }
    
    logger.info('Environment variables validated successfully', {
      nodeEnv: result.data.NODE_ENV,
      port: result.data.PORT
    });
    
    return result.data;
  } catch (error) {
    if (error instanceof EnvironmentError) {
      throw error;
    }
    
    throw new EnvironmentError(
      'Failed to validate environment variables',
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Export singleton instance of validated env
let validatedEnv: EnvVars | null = null;

export function getValidatedEnv(): EnvVars {
  if (!validatedEnv) {
    validatedEnv = validateEnv();
  }
  return validatedEnv;
}
