import type {
  ErrorRequestHandler,
} from 'express';

import { WeatherProviderError } from '../types/weather.js';

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof WeatherProviderError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });

    return;
  }

  console.error('Unhandled application error:', error);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'An unexpected server error occurred.',
    },
  });
};