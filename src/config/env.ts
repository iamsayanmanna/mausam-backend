import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),

  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:3000,http://localhost:8080,http://localhost:5173',
    ),

  OPEN_METEO_BASE_URL: z
    .string()
    .url()
    .default('https://api.open-meteo.com/v1/forecast'),

  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(12000),

  WEATHER_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(0)
    .max(3600)
    .default(60),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(900000),

  RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .default(100),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    'Invalid environment configuration:',
    result.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = {
  ...result.data,
  corsOrigins: result.data.CORS_ORIGINS
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
};