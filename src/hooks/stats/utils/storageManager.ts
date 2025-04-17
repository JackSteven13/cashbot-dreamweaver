
// Storage keys as constants
export const STORAGE_KEYS = {
  GLOBAL_ADS_COUNT: 'global_ads_count',
  GLOBAL_REVENUE_COUNT: 'global_revenue_count',
  ADS_COUNT: 'stats_ads_count',
  REVENUE_COUNT: 'stats_revenue_count',
  LAST_UPDATE: 'stats_last_update',
  RESET_DATE: 'stats_reset_date',
  DISPLAYED_ADS: 'displayed_ads_count',
  DISPLAYED_REVENUE: 'displayed_revenue_count',
  DATE_LINKED_STATS: 'date_linked_stats',
  LANDING_PAGE_STATS: 'landing_page_stats'
};

// Import the subscription limits
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

// Minimum baseline values for landing page that should never be dropped below
const MINIMUM_ADS_COUNT = 40000;
const MINIMUM_REVENUE_COUNT = 50000;

// Function to generate date-based values for the landing page
export const generateDateBasedValues = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const monthFactor = (today.getMonth() + 1) * 1000; // Factor linked to month
  
  // Base constant that gradually increases each day of the year - For the landing page only
  const baseAdsCount = MINIMUM_ADS_COUNT + (dayOfYear * 250) + monthFactor;
  const baseRevenueCount = MINIMUM_REVENUE_COUNT + (dayOfYear * 350) + monthFactor;
  
  // Add an hourly component for progression during the day
  const hourFactor = today.getHours() * 120; // More activity as the day progresses
  
  return {
    adsCount: Math.round(baseAdsCount + hourFactor),
    revenueCount: Math.round(baseRevenueCount + hourFactor * 1.2)
  };
};

// New function to manage user stats with respect to daily limits
export const loadUserStats = (subscription = 'freemium') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Load user stats for today
    const userStats = localStorage.getItem(`user_stats_${today}`);
    if (userStats) {
      const stats = JSON.parse(userStats);
      return {
        currentGains: Math.min(stats.gains || 0, dailyLimit),
        sessionCount: stats.sessions || 0,
        lastUpdate: stats.lastUpdate || Date.now()
      };
    }
    
    // Initialize new stats for today
    return {
      currentGains: 0,
      sessionCount: 0,
      lastUpdate: Date.now()
    };
  } catch (e) {
    console.error("Error loading user stats:", e);
    return {
      currentGains: 0,
      sessionCount: 0,
      lastUpdate: Date.now()
    };
  }
};

// For landing page stats
export const loadStoredValues = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we have global statistics for the landing page
    const landingPageStats = localStorage.getItem(STORAGE_KEYS.LANDING_PAGE_STATS);
    const storedDate = landingPageStats ? JSON.parse(landingPageStats).date : null;
    
    if (storedDate === today) {
      const storedStats = JSON.parse(landingPageStats);
      return {
        hasStoredValues: true,
        adsCount: Math.max(MINIMUM_ADS_COUNT, storedStats.adsCount),
        revenueCount: Math.max(MINIMUM_REVENUE_COUNT, storedStats.revenueCount),
        lastUpdate: Date.now()
      };
    }
    
    // Generate new values for landing page
    const dateBasedValues = generateDateBasedValues();
    
    // Save new values
    localStorage.setItem(STORAGE_KEYS.LANDING_PAGE_STATS, JSON.stringify({
      date: today,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      generatedAt: Date.now()
    }));
    
    return {
      hasStoredValues: true,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      lastUpdate: Date.now()
    };
  } catch (e) {
    console.error("Error loading stored values:", e);
    const dateBasedValues = generateDateBasedValues();
    return {
      hasStoredValues: true,
      adsCount: dateBasedValues.adsCount,
      revenueCount: dateBasedValues.revenueCount,
      lastUpdate: Date.now()
    };
  }
};

// For user stats
export const saveUserStats = (gains: number, sessions: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`user_stats_${today}`, JSON.stringify({
      gains,
      sessions,
      lastUpdate: Date.now()
    }));
  } catch (e) {
    console.error("Error saving user stats:", e);
  }
};

// Add missing saveValues function
export const saveValues = (adsCount: number, revenueCount: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.LANDING_PAGE_STATS, JSON.stringify({
      date: today,
      adsCount,
      revenueCount,
      generatedAt: Date.now()
    }));
  } catch (e) {
    console.error("Error saving values:", e);
  }
};

// Add missing incrementDateLinkedStats function
export const incrementDateLinkedStats = () => {
  try {
    const stats = loadStoredValues();
    
    // Small random increments
    const adsIncrement = Math.floor(Math.random() * 50) + 20;
    const revenueIncrement = Math.floor(Math.random() * 70) + 25;
    
    const newAds = stats.adsCount + adsIncrement;
    const newRevenue = stats.revenueCount + revenueIncrement;
    
    saveValues(newAds, newRevenue);
    
    return {
      adsCount: newAds,
      revenueCount: newRevenue
    };
  } catch (e) {
    console.error("Error incrementing date-linked stats:", e);
    return loadStoredValues();
  }
};
