
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Calculate session gain based on subscription type
 */
export const calculateSessionGain = (subscriptionType = 'freemium') => {
  // Base gain ranges by subscription type
  const gainRanges = {
    freemium: { min: 0.01, max: 0.05 },
    starter: { min: 0.03, max: 0.08 },
    gold: { min: 0.05, max: 0.12 },
    elite: { min: 0.08, max: 0.15 }
  };
  
  // Get appropriate range based on subscription
  const range = gainRanges[subscriptionType as keyof typeof gainRanges] || gainRanges.freemium;
  
  // Generate random gain within the range
  const sessionGain = range.min + Math.random() * (range.max - range.min);
  
  // Return with 2 decimal precision
  return parseFloat(sessionGain.toFixed(2));
};

/**
 * Generate a report for a session
 */
export const generateSessionReport = (sessionType = 'Manuel', subscriptionType = 'freemium') => {
  const sessionTypes = {
    Manuel: [
      'Session manuelle d\'analyse publicitaire',
      'Analyse manuelle de contenu publicitaire',
      'Session d\'optimisation publicitaire'
    ],
    Auto: [
      'Analyse automatisée de publicités',
      'Optimisation automatique de contenu',
      'Session automatique d\'analyse'
    ]
  };
  
  // Get appropriate report templates
  const templates = sessionTypes[sessionType as keyof typeof sessionTypes] || sessionTypes.Manuel;
  
  // Pick a random template
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Return the formatted report
  return `${template} (${subscriptionType})`;
};

/**
 * Check if the daily session limit has been reached based on subscription
 */
export const checkSessionLimit = (dailySessionCount: number, subscription = 'freemium') => {
  // Session limits by subscription type
  const sessionLimits = {
    freemium: 1,
    starter: 3,
    gold: 5,
    elite: 7
  };
  
  // Get limit based on subscription
  const limit = sessionLimits[subscription as keyof typeof sessionLimits] || sessionLimits.freemium;
  
  // Check if limit reached
  return dailySessionCount >= limit;
};
