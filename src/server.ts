import crypto from 'node:crypto';

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pino from 'pino';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { createWeatherRouter } from './routes/weather.routes.js';
import { WeatherCache } from './services/weather-cache.js';
import { WeatherService } from './services/weather.service.js';
import { DefaultWeatherProviderRegistry } from './providers/provider-registry.js';

import { createProfileRouter } from './routes/profile.routes.js';
import { createPersonalizationRouter } from './routes/personalization.routes.js';

const logger = pino({
  level:
    env.NODE_ENV === 'development'
      ? 'info'
      : 'warn',

  redact: {
    paths: [
      'authorization',
      'cookie',
    ],
    censor: '[REDACTED]',
  },
});

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const requestIdHeader =
    req.headers['x-request-id'];

  const requestId =
    typeof requestIdHeader === 'string' &&
    requestIdHeader.length > 0
      ? requestIdHeader
      : crypto.randomUUID();

  const startedAt = Date.now();

  res.setHeader(
    'X-Request-Id',
    requestId,
  );

  res.on('finish', () => {
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs:
          Date.now() - startedAt,
      },
      'http_request',
    );
  });

  next();
});

app.use(helmet());

app.use(
  cors({
   origin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (
    env.corsOrigins.includes('*') ||
    env.corsOrigins.includes(origin)
  ) {
    callback(null, true);
    return;
  }

  const isDevelopmentLocalOrigin =
    env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  if (isDevelopmentLocalOrigin) {
    callback(null, true);
    return;
  }

  callback(null, false);
},

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
    ],
  }),
);

app.use(
  express.json({
    limit: '100kb',
  }),
);

const apiRateLimiter = rateLimit({
  windowMs:
    env.RATE_LIMIT_WINDOW_MS,

  limit:
    env.RATE_LIMIT_MAX_REQUESTS,

  standardHeaders: 'draft-8',
  legacyHeaders: false,

  message: {
    error: {
      code: 'RATE_LIMITED',
      message:
        'Too many requests. Please try again later.',
    },
  },
});

app.use(
  '/api',
  apiRateLimiter,
);


app.use('/api/v1/profile', createProfileRouter());
app.use('/api/v1/personalization', createPersonalizationRouter());

const providerRegistry =
  new DefaultWeatherProviderRegistry();

const weatherCache =
  new WeatherCache(
    env.WEATHER_CACHE_TTL_SECONDS,
  );

const weatherService =
  new WeatherService(
    providerRegistry.getActiveProvider(),
    weatherCache,
  );

app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'MAUSAM Backend',
    status: 'online',
    version: '1.0.0',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mausam-backend',
    version: '1.0.0',
    timestamp:
      new Date().toISOString(),
  });
});

app.get(
  '/health/readiness',
  async (_req, res) => {
    const providers =
      await providerRegistry.getProviderHealth();

    res.status(200).json({
      status: 'ready',
      service: 'mausam-backend',
      providers,
      cacheEntries:
        weatherCache.size(),
      timestamp:
        new Date().toISOString(),
    });
  },
);

app.use(
  '/api/v1/weather',
  createWeatherRouter(
    weatherService,
    providerRegistry,
  ),
);

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message:
        'The requested resource was not found.',
    },
  });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
    },
    'mausam_backend_started',
  );
});