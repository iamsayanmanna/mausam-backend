import type { WeatherSnapshot } from '../types/weather.js';

interface CacheEntry {
  snapshot: WeatherSnapshot;
  expiresAt: number;
}

export class WeatherCache {
  private readonly entries = new Map<
    string,
    CacheEntry
  >();

  constructor(
    private readonly ttlSeconds: number,
  ) {}

  private key(
    latitude: number,
    longitude: number,
  ): string {
    return `${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
  }

  get(
    latitude: number,
    longitude: number,
  ): WeatherSnapshot | null {
    const key = this.key(latitude, longitude);
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return entry.snapshot;
  }

  set(snapshot: WeatherSnapshot): void {
    const key = this.key(
      snapshot.latitude,
      snapshot.longitude,
    );

    this.entries.set(key, {
      snapshot,
      expiresAt:
        Date.now() + this.ttlSeconds * 1000,
    });
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }
}