
import balanceManager from './balanceManager';

/**
 * Outil pour suivre et persister les gains générés automatiquement
 * Ce fichier est maintenu pour la compatibilité avec le code existant
 */

/**
 * Récupère les gains quotidiens depuis le stockage local
 */
export const getDailyGainsTracker = (): number => {
  return balanceManager.getDailyGains();
};

/**
 * Ajoute un nouveau gain au total quotidien
 */
export const addDailyGainTracker = (gain: number): number => {
  // Make sure to return the numerical result
  return balanceManager.addDailyGain(gain);
};

/**
 * Réinitialise les compteurs quotidiens
 */
export const resetDailyGains = (): void => {
  balanceManager.resetDailyGains();
};

export default {
  getDailyGains: getDailyGainsTracker,
  addDailyGain: addDailyGainTracker,
  resetDailyGains
};
