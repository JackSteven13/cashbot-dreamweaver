
/**
 * Utility functions for time-related operations
 */

/**
 * Gets the current time in Paris timezone
 * @returns Date object representing current Paris time
 */
export const getParisTime = (): Date => {
  const now = new Date();
  return new Date(now.getTime());
};

/**
 * Calculates time until next reset date (every 17 days)
 * @returns Time in milliseconds until the next reset
 */
export const calculateTimeUntilNextReset = (): number => {
  const parisTime = getParisTime();
  
  // Définir une date de référence (1er janvier 2024)
  const referenceDate = new Date(2024, 0, 1);
  referenceDate.setHours(0, 0, 0, 0);
  
  // Calculer le nombre de jours écoulés depuis la date de référence
  const daysSinceReference = Math.floor((parisTime.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculer le nombre de jours restants jusqu'au prochain cycle de 17 jours
  const daysUntilNextCycle = 17 - (daysSinceReference % 17);
  
  // Si on est au jour exact de reset, on passe au cycle suivant
  const currentHour = parisTime.getHours();
  const currentMinutes = parisTime.getMinutes();
  
  if (daysUntilNextCycle === 17 && currentHour === 0 && currentMinutes === 0) {
    return 0; // Reset immédiat
  }
  
  // Calculer la date du prochain reset
  const nextResetDate = new Date(parisTime);
  nextResetDate.setDate(parisTime.getDate() + daysUntilNextCycle);
  nextResetDate.setHours(0, 0, 0, 0);
  
  return nextResetDate.getTime() - parisTime.getTime();
};
