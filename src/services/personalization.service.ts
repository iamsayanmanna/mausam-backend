import { Persona } from '../types/profile.js';

export interface PersonalizationContext {
  persona: Persona | null;
  temperatureC: number;
  precipitationProbability: number;
  rainMm: number;
  windSpeedKmh: number;
  uvIndex: number;
  weatherCode: number;
  isDay: boolean;
}

export interface PersonalizationDecision {
  priority: 'safety' | 'health' | 'comfort' | 'activity';
  headline: string;
  action: string;
  reason: string;
}

export class PersonalizationService {
  evaluate(context: PersonalizationContext): PersonalizationDecision {
    const {
      persona,
      temperatureC,
      precipitationProbability,
      rainMm,
      windSpeedKmh,
      uvIndex,
    } = context;

    // Safety always has priority.
    if (
      precipitationProbability >= 80 ||
      rainMm >= 10 ||
      windSpeedKmh >= 45
    ) {
      return {
        priority: 'safety',
        headline: 'Weather needs attention',
        action: 'Review current conditions before going outside.',
        reason:
          'High precipitation, rainfall, or wind conditions were detected.',
      };
    }

    if (uvIndex >= 8) {
      return {
        priority: 'health',
        headline: 'High UV conditions',
        action: 'Limit prolonged direct sun exposure and use sun protection.',
        reason: 'The current UV index is high.',
      };
    }

    switch (persona) {
      case 'fitness':
        if (temperatureC <= 32 && windSpeedKmh < 30) {
          return {
            priority: 'activity',
            headline: 'Outdoor activity window',
            action: 'Outdoor exercise conditions are currently reasonable.',
            reason:
              'Temperature, wind and precipitation indicators are within the activity range.',
          };
        }
        break;

      case 'beach':
        if (temperatureC >= 24 && precipitationProbability < 40) {
          return {
            priority: 'activity',
            headline: 'Beach conditions are workable',
            action: 'Check local conditions before heading out.',
            reason:
              'Temperature is comfortable and precipitation probability is moderate or low.',
          };
        }
        break;

      case 'traveler':
        return {
          priority: 'comfort',
          headline: 'Travel conditions update',
          action: 'Check the forecast for your planned travel window.',
          reason:
            'The personalized travel view considers current precipitation and temperature.',
        };

      case 'commuter':
        return {
          priority: 'comfort',
          headline: 'Commute weather update',
          action: 'Check precipitation and wind before starting your commute.',
          reason:
            'Current weather conditions can affect outdoor travel comfort.',
        };

      case 'family':
        return {
          priority: 'comfort',
          headline: 'Family weather update',
          action: 'Review the forecast before planning outdoor activities.',
          reason:
            'The current conditions are being evaluated for family activity planning.',
        };

      case 'agriculture':
        return {
          priority: 'activity',
          headline: 'Agriculture weather update',
          action: 'Review rainfall and upcoming forecast conditions.',
          reason:
            'Rainfall and forecast trends are relevant to outdoor agricultural activities.',
        };

      case 'eventPlanner':
        return {
          priority: 'activity',
          headline: 'Event weather update',
          action: 'Review the upcoming forecast before finalizing outdoor plans.',
          reason:
            'Precipitation and temperature can affect outdoor event planning.',
        };

      case 'health':
        return {
          priority: 'health',
          headline: 'Health-focused weather update',
          action: 'Plan outdoor exposure around the current conditions.',
          reason:
            'Temperature, UV and precipitation indicators are being considered.',
        };
    }

    return {
      priority: 'comfort',
      headline: 'Weather conditions are stable',
      action: 'Continue with your plans while checking the forecast for changes.',
      reason:
        'No higher-priority weather condition was detected from the available data.',
    };
  }
}

export const personalizationService = new PersonalizationService();