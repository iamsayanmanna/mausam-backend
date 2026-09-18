import { z } from 'zod';

export const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

export interface CurrentWeather {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  rainMm: number;
  precipitationMm: number;
  weatherCode: number;
  isDay: boolean;
}

export interface HourlyWeather {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  precipitationProbability: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyWeather {
  date: string;
  temperatureMaxC: number;
  temperatureMinC: number;
  apparentTemperatureMaxC: number;
  apparentTemperatureMinC: number;
  precipitationProbabilityMax: number;
  precipitationSumMm: number;
  rainSumMm: number;
  windSpeedMaxKmh: number;
  uvIndexMax: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
}

export type WeatherSource = 'open_meteo' | 'imd';

export type WeatherStatus = 'fresh' | 'degraded' | 'stale';

export interface WeatherSnapshot {
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: string;
  source: WeatherSource;
  status: WeatherStatus;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
}

export interface WeatherProvider {
  readonly source: WeatherSource;

  fetchWeather(
    coordinates: Coordinates,
  ): Promise<WeatherSnapshot>;
}

export class WeatherProviderError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    code: string,
    message: string,
    statusCode = 502,
  ) {
    super(message);
    this.name = 'WeatherProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}