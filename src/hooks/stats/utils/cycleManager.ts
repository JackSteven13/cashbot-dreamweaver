
import { getTotalHourlyRate } from './hourlyRates';
import { activeLocations } from '../data/locationData';

export const scheduleMidnightReset = (
  resetCallback: () => void,
  dailyAdsTarget: number = 28800,
  dailyRevenueTarget: number = 40000
) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  // Calculer un taux horaire plus réaliste avec 20 bots
  const totalHourlyRate = getTotalHourlyRate(activeLocations);
  
  // ~90 pubs/heure/bot × 20 bots × 24 heures
  const expectedDailyAds = totalHourlyRate * 24;
  
  console.log(`Total hourly rate: ${totalHourlyRate} ads/hour`);
  console.log(`Expected daily ads: ${expectedDailyAds}`);
  
  return setTimeout(resetCallback, timeUntilMidnight);
};
