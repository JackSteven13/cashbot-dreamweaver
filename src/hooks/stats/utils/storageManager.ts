
/**
 * Utilitaires de gestion du stockage local pour les statistiques et gains
 */

/**
 * Ajoute un gain au total quotidien
 */
export const addDailyGain = (gain: number): void => {
  if (isNaN(gain) || gain <= 0) return;
  
  const current = getDailyGains();
  const newTotal = parseFloat((current + gain).toFixed(2));
  
  localStorage.setItem('dailyGains', newTotal.toString());
  
  // Déclencher un événement pour informer les autres composants
  window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
    detail: { amount: newTotal } 
  }));
};

/**
 * Récupère le total des gains quotidiens
 */
export const getDailyGains = (): number => {
  try {
    const stored = localStorage.getItem('dailyGains');
    return stored ? parseFloat(stored) : 0;
  } catch (e) {
    console.error("Error reading daily gains:", e);
    return 0;
  }
};

/**
 * Réinitialise les gains quotidiens
 */
export const resetDailyGains = (): void => {
  localStorage.setItem('dailyGains', '0');
  
  // Déclencher un événement pour informer les autres composants
  window.dispatchEvent(new CustomEvent('dailyGains:reset'));
};

/**
 * Sauvegarde les statistiques utilisateur
 */
export const saveUserStats = (stats: Record<string, any>): void => {
  try {
    localStorage.setItem('userStats', JSON.stringify(stats));
  } catch (e) {
    console.error("Error saving user stats:", e);
  }
};

/**
 * Récupère les statistiques utilisateur
 */
export const getUserStats = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem('userStats');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Error reading user stats:", e);
    return {};
  }
};
