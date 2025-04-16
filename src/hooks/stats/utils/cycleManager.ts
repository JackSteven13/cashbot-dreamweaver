
import { getTotalHourlyRate } from './hourlyRates';
import { activeLocations } from '../data/locationData';

export const scheduleMidnightReset = (
  resetCallback: () => void,
  dailyAdsTarget: number,
  dailyRevenueTarget: number
) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  // Calculer le taux horaire total basé sur tous les bots actifs
  const totalHourlyRate = getTotalHourlyRate(activeLocations);
  
  // Calculer le nombre total d'annonces attendues pour la journée
  const expectedDailyAds = totalHourlyRate * 24;
  
  console.log(`Total hourly rate: ${totalHourlyRate} ads/hour`);
  console.log(`Expected daily ads: ${expectedDailyAds}`);
  
  return setTimeout(resetCallback, timeUntilMidnight);
};
