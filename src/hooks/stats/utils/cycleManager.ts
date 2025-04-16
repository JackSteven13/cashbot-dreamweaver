
import { calculateTimeUntilMidnight } from '@/utils/timeUtils';

// Clés pour le stockage local
const STORAGE_KEYS = {
  RESET_DATE: 'stats_reset_date'
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
  
  // Schedule reset with initial values
  return setTimeout(() => {
    // Vérifier si une réinitialisation a déjà été effectuée aujourd'hui
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem(STORAGE_KEYS.RESET_DATE);
    
    // Si déjà réinitialisé aujourd'hui, ne pas réinitialiser à nouveau
    if (lastResetDate === today) {
      console.log("Counters were already reset today, skipping");
      return;
    }
    
    // Définir des valeurs initiales plus petites pour un démarrage plus lent
    const initialAdsCount = Math.floor(dailyAdsTarget * (0.05 + Math.random() * 0.03)); // Réduit de 0.10-0.15 à 0.05-0.08
    const initialRevenueCount = Math.floor(dailyRevenueTarget * (0.05 + Math.random() * 0.03)); // Réduit de 0.10-0.15 à 0.05-0.08
    
    // Stocker la date de réinitialisation
    localStorage.setItem(STORAGE_KEYS.RESET_DATE, today);
    
    // Appeler la fonction de réinitialisation
    resetCallback();
    
    // Planifier la prochaine réinitialisation
    scheduleMidnightReset(resetCallback, dailyAdsTarget, dailyRevenueTarget);
  }, timeUntilMidnight);
};
