import { Router } from 'express';

import { coordinatesSchema } from '../types/weather.js';
import { WeatherProviderError } from '../types/weather.js';

import type { WeatherService } from '../services/weather.service.js';
import type { WeatherProviderRegistry } from '../providers/weather-provider.js';

export function createWeatherRouter(
  weatherService: WeatherService,
  providerRegistry: WeatherProviderRegistry,
): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const parsed =
        coordinatesSchema.safeParse({
          latitude: req.query.latitude,
          longitude: req.query.longitude,
        });

      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'INVALID_COORDINATES',
            message:
              'Latitude and longitude are required and must be valid.',
          },
        });
        return;
      }

      const result =
        await weatherService.getWeather(
          parsed.data,
        );

      res.status(200).json({
        data: result.snapshot,
        meta: {
          cached: result.cached,
          provider: result.snapshot.source,
          status: result.snapshot.status,
          fetchedAt: result.snapshot.fetchedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/providers', async (_req, res, next) => {
    try {
      const providers =
        await providerRegistry.getProviderHealth();

      res.status(200).json({
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}