import crypto from 'node:crypto';

import {
  Persona,
  ProfileUpdates,
  SavedLocation,
  UserActivity,
  UserPreferences,
  UserProfile,
} from '../types/profile.js';

const DEFAULT_PREFERENCES: UserPreferences = {
  temperatureUnit: 'celsius',
  precipitationAlerts: true,
  severeWeatherAlerts: true,
  dailySummary: true,
};

export class ProfileService {
  private readonly profiles = new Map<string, UserProfile>();

  getOrCreateProfile(userId: string): UserProfile {
    const existing = this.profiles.get(userId);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();

    const profile: UserProfile = {
      id: userId,
      displayName: '',
      persona: null,
      preferences: { ...DEFAULT_PREFERENCES },
      savedLocations: [],
      activities: [],
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.set(userId, profile);

    return profile;
  }

  updateProfile(userId: string, updates: ProfileUpdates): UserProfile {
    const profile = this.getOrCreateProfile(userId);

    if (updates.displayName !== undefined) {
      profile.displayName = updates.displayName;
    }

    if (updates.persona !== undefined) {
      profile.persona = updates.persona;
    }

    if (updates.preferences !== undefined) {
      profile.preferences = {
        ...profile.preferences,
        ...updates.preferences,
      };
    }

    profile.updatedAt = new Date().toISOString();

    this.profiles.set(userId, profile);

    return profile;
  }

  addLocation(
    userId: string,
    location: Omit<SavedLocation, 'id'>,
  ): SavedLocation {
    const profile = this.getOrCreateProfile(userId);

    const savedLocation: SavedLocation = {
      id: crypto.randomUUID(),
      ...location,
    };

    profile.savedLocations.push(savedLocation);
    profile.updatedAt = new Date().toISOString();

    return savedLocation;
  }

  removeLocation(userId: string, locationId: string): boolean {
    const profile = this.getOrCreateProfile(userId);

    const originalLength = profile.savedLocations.length;

    profile.savedLocations = profile.savedLocations.filter(
      (location) => location.id !== locationId,
    );

    const removed = profile.savedLocations.length !== originalLength;

    if (removed) {
      profile.updatedAt = new Date().toISOString();
    }

    return removed;
  }

  addActivity(
    userId: string,
    activity: Omit<UserActivity, 'id' | 'timestamp'> & {
      timestamp?: string;
    },
  ): UserActivity {
    const profile = this.getOrCreateProfile(userId);

    const savedActivity: UserActivity = {
      id: crypto.randomUUID(),
      type: activity.type,
      timestamp: activity.timestamp ?? new Date().toISOString(),
      metadata: activity.metadata,
    };

    profile.activities.unshift(savedActivity);

    // Keep only the most recent 100 activities.
    profile.activities = profile.activities.slice(0, 100);

    profile.updatedAt = new Date().toISOString();

    return savedActivity;
  }
}

export const profileService = new ProfileService();