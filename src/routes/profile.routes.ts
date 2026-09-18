import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { profileService } from '../services/profile.service.js';
import { PERSONAS } from '../types/profile.js';

const userIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128);

const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  persona: z
    .enum(PERSONAS)
    .nullable()
    .optional(),

  preferences: z
    .object({
      temperatureUnit: z.enum(['celsius', 'fahrenheit']).optional(),
      precipitationAlerts: z.boolean().optional(),
      severeWeatherAlerts: z.boolean().optional(),
      dailySummary: z.boolean().optional(),
    })
    .optional(),
});

const locationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  timezone: z.string().trim().max(100).optional(),
});

const activitySchema = z.object({
  type: z.string().trim().min(1).max(100),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function getUserId(req: Request): string | null {
  const value = req.header('x-user-id');

  const result = userIdSchema.safeParse(value);

  return result.success ? result.data : null;
}

function requireUserId(req: Request, res: Response): string | null {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'A valid user identity is required.',
      },
    });

    return null;
  }

  return userId;
}

export function createProfileRouter(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const userId = requireUserId(req, res);

    if (!userId) {
      return;
    }

    res.status(200).json({
      profile: profileService.getOrCreateProfile(userId),
    });
  });

  router.patch('/', (req, res) => {
    const userId = requireUserId(req, res);

    if (!userId) {
      return;
    }

    const result = profileUpdateSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_PROFILE',
          message: 'The profile update payload is invalid.',
          details: result.error.flatten(),
        },
      });

      return;
    }

    res.status(200).json({
      profile: profileService.updateProfile(userId, result.data),
    });
  });

  router.post('/locations', (req, res) => {
    const userId = requireUserId(req, res);

    if (!userId) {
      return;
    }

    const result = locationSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_LOCATION',
          message: 'The saved location payload is invalid.',
          details: result.error.flatten(),
        },
      });

      return;
    }

    const location = profileService.addLocation(userId, result.data);

    res.status(201).json({ location });
  });

  router.delete('/locations/:locationId', (req, res) => {
    const userId = requireUserId(req, res);

    if (!userId) {
      return;
    }

    const locationId = z
      .string()
      .trim()
      .min(1)
      .max(128)
      .safeParse(req.params.locationId);

    if (!locationId.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_LOCATION_ID',
          message: 'The location ID is invalid.',
        },
      });

      return;
    }

    const removed = profileService.removeLocation(
      userId,
      locationId.data,
    );

    if (!removed) {
      res.status(404).json({
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'The saved location was not found.',
        },
      });

      return;
    }

    res.status(204).send();
  });

  router.post('/activities', (req, res) => {
    const userId = requireUserId(req, res);

    if (!userId) {
      return;
    }

    const result = activitySchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_ACTIVITY',
          message: 'The activity payload is invalid.',
          details: result.error.flatten(),
        },
      });

      return;
    }

    const activity = profileService.addActivity(userId, result.data);

    res.status(201).json({ activity });
  });

  return router;
}