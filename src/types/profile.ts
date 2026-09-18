export const PERSONAS = [
  'health',
  'fitness',
  'beach',
  'traveler',
  'family',
  'agriculture',
  'commuter',
  'eventPlanner',
] as const;

export type Persona = (typeof PERSONAS)[number];

export interface UserPreferences {
  temperatureUnit: 'celsius' | 'fahrenheit';
  precipitationAlerts: boolean;
  severeWeatherAlerts: boolean;
  dailySummary: boolean;
}

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface UserActivity {
  id: string;
  type: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  displayName: string;
  persona: Persona | null;
  preferences: UserPreferences;
  savedLocations: SavedLocation[];
  activities: UserActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdates {
  displayName?: string;
  persona?: Persona | null;
  preferences?: Partial<UserPreferences>;
}