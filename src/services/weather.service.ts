import type {
  Coordinates,
  WeatherProvider,
  WeatherSnapshot,
} from '../types/weather.js';

import { WeatherCache } from './weather-cache.js';

export class WeatherService {
  constructor(
    private readonly provider: WeatherProvider,
    private readonly cache: WeatherCache,
  ) {}

  async getWeather(
    coordinates: Coordinates,
  ): Promise<{
    snapshot: WeatherSnapshot;
    cached: boolean;
  }> {
    const cached = this.cache.get(
      coordinates.latitude,
      coordinates.longitude,
    );

    if (cached) {
      return {
        snapshot: cached,
        cached: true,
      };
    }

    const snapshot =
      await this.provider.fetchWeather(
        coordinates,
      );

    this.cache.set(snapshot);

    return {
      snapshot,
      cached: false,
    };
  }
}