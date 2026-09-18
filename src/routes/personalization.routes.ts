import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { OpenMeteoProvider } from '../providers/open-meteo.provider.js';
import {
  PersonalizationContext,
  personalizationService,
} from '../services/personalization.service.js';
import { profileService } from '../services/profile.service.js';

const coordinatesSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
});

const userIdSchema = z.string().trim().min(1).max(128);

function getUserId(req: Request): string | null {
  const result = userIdSchema.safeParse(req.header('x-user-id'));

  return result.success ? result.data : null;
}

export function createPersonalizationRouter(): Router {
  const router = Router();

  const weatherProvider = new OpenMeteoProvider();

  router.get('/', async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'A valid user identity is required.',
        },
      });

      return;
    }

    const coordinates = coordinatesSchema.safeParse(req.query);

    if (!coordinates.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Valid latitude and longitude are required.',
          details: coordinates.error.flatten(),
        },
      });

      return;
    }

    try {
      const profile = profileService.getOrCreateProfile(userId);

      const weather = await weatherProvider.fetchWeather({
        latitude: coordinates.data.latitude,
        longitude: coordinates.data.longitude,
      });

      const currentHour = weather.hourly[0];

      const context: PersonalizationContext = {
        persona: profile.persona,
        temperatureC: weather.current.temperatureC,
        precipitationProbability:
          currentHour?.precipitationProbability ?? 0,
        rainMm: weather.current.rainMm,
        windSpeedKmh: weather.current.windSpeedKmh,
        uvIndex: weather.daily[0]?.uvIndexMax ?? 0,
        weatherCode: weather.current.weatherCode,
        isDay: weather.current.isDay,
      };

      const decision = personalizationService.evaluate(context);

      res.status(200).json({
        personalization: decision,
        context: {
          persona: profile.persona,
          weatherStatus: weather.status,
          weatherSource: weather.source,
          timezone: weather.timezone,
        },
      });
    } catch (error) {
      res.status(502).json({
        error: {
          code: 'PERSONALIZATION_UNAVAILABLE',
          message: 'Personalized weather information is temporarily unavailable.',
        },
      });
    }
  });

  return router;
}