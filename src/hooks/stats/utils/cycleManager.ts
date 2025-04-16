
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

// Storage keys
const STORAGE_KEYS = {
  RESET_DATE: 'stats_reset_date',
  GLOBAL_RESET_DATE: 'global_stats_reset_date'
};

export const scheduleMidnightReset = (
  resetCallback: () => void,
  dailyAdsTarget: number,
  dailyRevenueTarget: number
): ReturnType<typeof setTimeout> => {
  const timeUntilMidnight = calculateTimeUntilMidnight();
  
  // Convert to hours for logs
  const hoursUntilMidnight = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
  const minutesUntilMidnight = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
  
  console.log(`Next counter reset in ${hoursUntilMidnight} hours and ${minutesUntilMidnight} minutes`);
  
  // Schedule reset with natural initial values
  return setTimeout(() => {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
    const globalResetDate = localStorage.getItem(STORAGE_KEYS.GLOBAL_RESET_DATE);
    
    if (lastResetDate === today || globalResetDate === today) {
      console.log("Counters were already reset today, skipping");
      scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
      return;
    }
    
    // Progression beaucoup plus graduelle selon l'heure de la journée
    const hourOfDay = new Date().getHours();
    
    // Progression beaucoup plus substantielle - jamais de valeurs faibles
    let startPercentage;
    
    if (hourOfDay < 5) {
      // Très tôt le matin (minuit-5h): démarrage déjà significatif
      startPercentage = 0.05 + Math.random() * 0.02; // 5-7%
    } else if (hourOfDay < 8) {
      // Début de matinée (5h-8h): bon démarrage
      startPercentage = 0.08 + Math.random() * 0.03; // 8-11%
    } else if (hourOfDay < 12) {
      // Matin (8h-12h): croissance établie
      startPercentage = 0.12 + Math.random() * 0.04; // 12-16%
    } else if (hourOfDay < 17) {
      // Après-midi (12h-17h): activité soutenue
      startPercentage = 0.18 + Math.random() * 0.05; // 18-23%
    } else if (hourOfDay < 21) {
      // Soirée (17h-21h): pic d'activité
      startPercentage = 0.23 + Math.random() * 0.07; // 23-30%
    } else {
      // Nuit (21h-minuit): activité encore significative
      startPercentage = 0.15 + Math.random() * 0.04; // 15-19%
    }
    
    // Effets du jour de la semaine
    const dayOfWeek = new Date().getDay(); // 0-6 (Dimanche-Samedi)
    let dayFactor = 1;
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dayFactor = 0.85 + Math.random() * 0.1; // 85-95% (légèrement plus lent le weekend)
    } else if (dayOfWeek === 1) { // Lundi
      dayFactor = 0.9 + Math.random() * 0.1; // 90-100% (démarrage plus lent en début de semaine)
    } else if (dayOfWeek === 3 || dayOfWeek === 4) { // Mercredi/Jeudi pic
      dayFactor = 1.05 + Math.random() * 0.1; // 105-115% (pic milieu de semaine)
    }
    
    // Légères variations entre publicités et revenus pour un aspect naturel
    const adsDeviation = 0.97 + Math.random() * 0.06; // 97-103%
    const revenueDeviation = 0.96 + Math.random() * 0.08; // 96-104%
    
    // Calculer les valeurs initiales avec des valeurs jamais trop petites
    const initialAdsCount = Math.floor(dailyAdsTarget * startPercentage * dayFactor * adsDeviation);
    const initialRevenueCount = Math.floor(dailyRevenueTarget * startPercentage * dayFactor * revenueDeviation);
    
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, today);
    localStorage.setItem(STORAGE_KEYS.GLOBAL_RESET_DATE, today);
    
    resetCallback();
    
    // Peupler avec des valeurs initiales substantielles
    localStorage.setItem('global_ads_count', initialAdsCount.toString());
    localStorage.setItem('global_revenue_count', initialRevenueCount.toString());
    localStorage.setItem('displayed_ads_count', initialAdsCount.toString());
    localStorage.setItem('displayed_revenue_count', initialRevenueCount.toString());
    localStorage.setItem('stats_ads_count', initialAdsCount.toString());
    localStorage.setItem('stats_revenue_count', initialRevenueCount.toString());
    
    // Planifier la prochaine réinitialisation
    scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
  }, timeUntilMidnight);
};
