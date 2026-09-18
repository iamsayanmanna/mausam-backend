import type {
  Coordinates,
  WeatherProvider,
} from '../types/weather.js';

export interface WeatherProviderHealth {
  source: string;
  available: boolean;
  checkedAt: string;
}

export interface WeatherProviderRegistry {
  getActiveProvider(): WeatherProvider;

  getProviderHealth(): Promise<WeatherProviderHealth[]>;
}

export function validateCoordinates(
  coordinates: Coordinates,
): void {
  if (
    !Number.isFinite(coordinates.latitude) ||
    !Number.isFinite(coordinates.longitude)
  ) {
    throw new Error('Invalid coordinates.');
  }

  if (
    coordinates.latitude < -90 ||
    coordinates.latitude > 90
  ) {
    throw new Error('Latitude must be between -90 and 90.');
  }

  if (
    coordinates.longitude < -180 ||
    coordinates.longitude > 180
  ) {
    throw new Error('Longitude must be between -180 and 180.');
  }
}