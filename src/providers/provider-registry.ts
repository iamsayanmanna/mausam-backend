import { OpenMeteoProvider } from './open-meteo.provider.js';

import type {
  WeatherProvider,
} from '../types/weather.js';

import type {
  WeatherProviderHealth,
  WeatherProviderRegistry,
} from './weather-provider.js';

export class ImdProviderBoundary
  implements WeatherProvider {
  readonly source = 'imd' as const;

  async fetchWeather(): Promise<never> {
    throw new Error(
      'Authorized IMD provider integration is not configured.',
    );
  }
}

export class DefaultWeatherProviderRegistry
  implements WeatherProviderRegistry {
  private readonly openMeteo =
    new OpenMeteoProvider();

  private readonly imd =
    new ImdProviderBoundary();

  getActiveProvider(): WeatherProvider {
    return this.openMeteo;
  }

  async getProviderHealth(): Promise<
    WeatherProviderHealth[]
  > {
    return [
      {
        source: 'open_meteo',
        available: true,
        checkedAt: new Date().toISOString(),
      },
      {
        source: 'imd',
        available: false,
        checkedAt: new Date().toISOString(),
      },
    ];
  }

  getImdBoundary(): WeatherProvider {
    return this.imd;
  }
}