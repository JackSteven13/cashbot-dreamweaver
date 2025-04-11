
/**
 * Outil pour suivre et persister les gains générés automatiquement
 */

// Clés de stockage
const DAILY_GAINS_KEY = 'dailyGains';
const LAST_GAIN_DATE_KEY = 'lastGainDate';

/**
 * Récupère les gains quotidiens depuis le stockage local
 */
export const getDailyGains = (): number => {
  try {
    // Vérifier d'abord si la date est différente d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem(LAST_GAIN_DATE_KEY);
    
    // Si la dernière date enregistrée est différente d'aujourd'hui, réinitialiser
    if (lastDate !== today) {
      localStorage.setItem(DAILY_GAINS_KEY, '0');
      localStorage.setItem(LAST_GAIN_DATE_KEY, today);
      
      // Déclencher un événement de réinitialisation pour informer l'interface
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
      return 0;
    }
    
    // Sinon, récupérer la valeur actuelle
    const storedGains = localStorage.getItem(DAILY_GAINS_KEY);
    return storedGains ? parseFloat(storedGains) : 0;
  } catch (e) {
    console.error("Erreur lors de la récupération des gains quotidiens:", e);
    return 0;
  }
};

/**
 * Ajoute un nouveau gain au total quotidien
 */
export const addDailyGain = (gain: number): number => {
  try {
    // S'assurer que la date est correcte
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_GAIN_DATE_KEY, today);
    
    // Récupérer et mettre à jour les gains
    const currentGains = getDailyGains();
    const newTotal = currentGains + gain;
    
    // Sauvegarder la nouvelle valeur
    localStorage.setItem(DAILY_GAINS_KEY, newTotal.toString());
    
    // Déclencher un événement pour informer l'interface
    window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
      detail: { total: newTotal, lastGain: gain } 
    }));
    
    return newTotal;
  } catch (e) {
    console.error("Erreur lors de l'ajout d'un gain quotidien:", e);
    return getDailyGains(); // Retourner la valeur actuelle en cas d'échec
  }
};

/**
 * Réinitialise les compteurs quotidiens
 */
export const resetDailyGains = (): void => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(DAILY_GAINS_KEY, '0');
    localStorage.setItem(LAST_GAIN_DATE_KEY, today);
    
    // Déclencher un événement de réinitialisation
    window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  } catch (e) {
    console.error("Erreur lors de la réinitialisation des gains quotidiens:", e);
  }
};

export default {
  getDailyGains,
  addDailyGain,
  resetDailyGains
};
