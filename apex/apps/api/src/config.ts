import { z } from 'zod';
import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid postgres URL" }),
  REDIS_URL: z.string().url({ message: "REDIS_URL must be a valid redis URL" }),
  DEFAULT_API_KEY: z.string().min(8, { message: "DEFAULT_API_KEY must be at least 8 characters long" }),
  ENV: z.enum(['development', 'production', 'test']).default('development'),
});

let parsedConfig: z.infer<typeof configSchema>;

try {
  parsedConfig = configSchema.parse({
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    DEFAULT_API_KEY: process.env.DEFAULT_API_KEY,
    ENV: process.env.ENV || process.env.NODE_ENV,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    logger.error('❌ Invalid environment variables configuration:');
    error.errors.forEach((err) => {
      logger.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    logger.error('❌ Failed to parse environment variables', error);
  }
  process.exit(1);
}

export const config = parsedConfig;
export type Config = typeof config;
