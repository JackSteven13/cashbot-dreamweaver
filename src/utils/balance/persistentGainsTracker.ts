
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
 * @returns {number} Le nouveau montant total des gains quotidiens
 */
export const addDailyGainTracker = (gain: number): number => {
  // Ajouter le gain et retourner le nouveau total
  balanceManager.addDailyGain(gain);
  // Retourner le nouveau total
  return balanceManager.getDailyGains();
};

/**
 * Réinitialise les compteurs quotidiens
 */
export const resetDailyGains = (): void => {
  // Now resetDailyGains is public so we can call it
  balanceManager.resetDailyGains();
};

export default {
  getDailyGains: getDailyGainsTracker,
  addDailyGain: addDailyGainTracker,
  resetDailyGains
};
