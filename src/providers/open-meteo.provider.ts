import { env } from '../config/env.js';

import type {
  Coordinates,
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  WeatherProvider,
  WeatherSnapshot,
} from '../types/weather.js';

import { WeatherProviderError } from '../types/weather.js';

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    rain: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    rain_sum: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertNumber(
  value: unknown,
  field: string,
): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      `Invalid weather field: ${field}`,
      502,
    );
  }
}

function assertString(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      `Invalid weather field: ${field}`,
      502,
    );
  }
}

function assertArray(
  value: unknown,
  field: string,
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      `Invalid weather array: ${field}`,
      502,
    );
  }
}

function validateResponse(
  value: unknown,
): OpenMeteoResponse {
  if (!isRecord(value)) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      'Weather provider returned an invalid response.',
      502,
    );
  }

  const current = value.current;
  const hourly = value.hourly;
  const daily = value.daily;

  if (!isRecord(current)) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      'Weather provider current data is missing.',
      502,
    );
  }

  if (!isRecord(hourly)) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      'Weather provider hourly data is missing.',
      502,
    );
  }

  if (!isRecord(daily)) {
    throw new WeatherProviderError(
      'INVALID_WEATHER_RESPONSE',
      'Weather provider daily data is missing.',
      502,
    );
  }

  assertNumber(value.latitude, 'latitude');
  assertNumber(value.longitude, 'longitude');
  assertString(value.timezone, 'timezone');

  assertString(current.time, 'current.time');
  assertNumber(
    current.temperature_2m,
    'current.temperature_2m',
  );
  assertNumber(
    current.apparent_temperature,
    'current.apparent_temperature',
  );
  assertNumber(
    current.relative_humidity_2m,
    'current.relative_humidity_2m',
  );
  assertNumber(
    current.wind_speed_10m,
    'current.wind_speed_10m',
  );
  assertNumber(
    current.wind_direction_10m,
    'current.wind_direction_10m',
  );
  assertNumber(current.rain, 'current.rain');
  assertNumber(
    current.precipitation,
    'current.precipitation',
  );
  assertNumber(
    current.weather_code,
    'current.weather_code',
  );
  assertNumber(current.is_day, 'current.is_day');

  const hourlyFields = [
    'time',
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation_probability',
    'precipitation',
    'rain',
    'wind_speed_10m',
    'wind_direction_10m',
    'weather_code',
    'is_day',
  ];

  for (const field of hourlyFields) {
    assertArray(hourly[field], `hourly.${field}`);
  }

  const dailyFields = [
    'time',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'precipitation_probability_max',
    'precipitation_sum',
    'rain_sum',
    'wind_speed_10m_max',
    'uv_index_max',
    'weather_code',
    'sunrise',
    'sunset',
  ];

  for (const field of dailyFields) {
    assertArray(daily[field], `daily.${field}`);
  }

  return value as unknown as OpenMeteoResponse;
}

function buildCurrent(
  current: OpenMeteoResponse['current'],
): CurrentWeather {
  return {
    time: current.time,
    temperatureC: current.temperature_2m,
    apparentTemperatureC: current.apparent_temperature,
    humidityPercent: current.relative_humidity_2m,
    windSpeedKmh: current.wind_speed_10m,
    windDirectionDegrees: current.wind_direction_10m,
    rainMm: current.rain,
    precipitationMm: current.precipitation,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
  };
}

function buildHourly(
  hourly: OpenMeteoResponse['hourly'],
): HourlyWeather[] {
  const length = Math.min(
    hourly.time.length,
    hourly.temperature_2m.length,
    hourly.apparent_temperature.length,
    hourly.relative_humidity_2m.length,
    hourly.precipitation_probability.length,
    hourly.precipitation.length,
    hourly.rain.length,
    hourly.wind_speed_10m.length,
    hourly.wind_direction_10m.length,
    hourly.weather_code.length,
    hourly.is_day.length,
  );

  const result: HourlyWeather[] = [];

  for (let i = 0; i < length; i += 1) {
    result.push({
      time: hourly.time[i],
      temperatureC: hourly.temperature_2m[i],
      apparentTemperatureC:
        hourly.apparent_temperature[i],
      humidityPercent:
        hourly.relative_humidity_2m[i],
      precipitationProbability:
        hourly.precipitation_probability[i],
      precipitationMm: hourly.precipitation[i],
      rainMm: hourly.rain[i],
      windSpeedKmh: hourly.wind_speed_10m[i],
      windDirectionDegrees:
        hourly.wind_direction_10m[i],
      weatherCode: hourly.weather_code[i],
      isDay: hourly.is_day[i] === 1,
    });
  }

  return result;
}

function buildDaily(
  daily: OpenMeteoResponse['daily'],
): DailyWeather[] {
  const length = Math.min(
    daily.time.length,
    daily.temperature_2m_max.length,
    daily.temperature_2m_min.length,
    daily.apparent_temperature_max.length,
    daily.apparent_temperature_min.length,
    daily.precipitation_probability_max.length,
    daily.precipitation_sum.length,
    daily.rain_sum.length,
    daily.wind_speed_10m_max.length,
    daily.uv_index_max.length,
    daily.weather_code.length,
    daily.sunrise.length,
    daily.sunset.length,
  );

  const result: DailyWeather[] = [];

  for (let i = 0; i < length; i += 1) {
    result.push({
      date: daily.time[i],
      temperatureMaxC:
        daily.temperature_2m_max[i],
      temperatureMinC:
        daily.temperature_2m_min[i],
      apparentTemperatureMaxC:
        daily.apparent_temperature_max[i],
      apparentTemperatureMinC:
        daily.apparent_temperature_min[i],
      precipitationProbabilityMax:
        daily.precipitation_probability_max[i],
      precipitationSumMm:
        daily.precipitation_sum[i],
      rainSumMm: daily.rain_sum[i],
      windSpeedMaxKmh:
        daily.wind_speed_10m_max[i],
      uvIndexMax: daily.uv_index_max[i],
      weatherCode: daily.weather_code[i],
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
    });
  }

  return result;
}

export class OpenMeteoProvider
  implements WeatherProvider {
  readonly source = 'open_meteo' as const;

  private readonly maxAttempts = 2;

  async fetchWeather(
    coordinates: Coordinates,
  ): Promise<WeatherSnapshot> {
    const url = new URL(env.OPEN_METEO_BASE_URL);

    url.searchParams.set(
      'latitude',
      coordinates.latitude.toString(),
    );

    url.searchParams.set(
      'longitude',
      coordinates.longitude.toString(),
    );

    url.searchParams.set(
      'current',
      [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'wind_direction_10m',
        'rain',
        'precipitation',
        'weather_code',
        'is_day',
      ].join(','),
    );

    url.searchParams.set(
      'hourly',
      [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'precipitation_probability',
        'precipitation',
        'rain',
        'wind_speed_10m',
        'wind_direction_10m',
        'weather_code',
        'is_day',
      ].join(','),
    );

    url.searchParams.set(
      'daily',
      [
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'precipitation_probability_max',
        'precipitation_sum',
        'rain_sum',
        'wind_speed_10m_max',
        'uv_index_max',
        'weather_code',
        'sunrise',
        'sunset',
      ].join(','),
    );

    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    let lastError: unknown = null;

    for (
      let attempt = 1;
      attempt <= this.maxAttempts;
      attempt += 1
    ) {
      try {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, env.REQUEST_TIMEOUT_MS);

        let response: Response;

        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          if (
            response.status >= 500 &&
            attempt < this.maxAttempts
          ) {
            continue;
          }

          throw new WeatherProviderError(
            'WEATHER_PROVIDER_UNAVAILABLE',
            'Weather provider is temporarily unavailable.',
            502,
          );
        }

        let json: unknown;

        try {
          json = await response.json();
        } catch {
          throw new WeatherProviderError(
            'INVALID_WEATHER_RESPONSE',
            'Weather provider returned invalid JSON.',
            502,
          );
        }

        const data = validateResponse(json);

        return {
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
          fetchedAt: new Date().toISOString(),
          source: this.source,
          status: 'fresh',
          current: buildCurrent(data.current),
          hourly: buildHourly(data.hourly),
          daily: buildDaily(data.daily),
        };
      } catch (error) {
        lastError = error;

        if (
          error instanceof WeatherProviderError
        ) {
          throw error;
        }

        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          if (attempt < this.maxAttempts) {
            continue;
          }

          throw new WeatherProviderError(
            'WEATHER_PROVIDER_TIMEOUT',
            'Weather provider request timed out.',
            504,
          );
        }

        if (attempt < this.maxAttempts) {
          continue;
        }
      }
    }

    throw new WeatherProviderError(
      'WEATHER_PROVIDER_UNAVAILABLE',
      'Weather provider could not be reached.',
      502,
    );
  }
}