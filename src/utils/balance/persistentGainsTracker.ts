
import { getDailyGains, addDailyGain, resetDailyCounters } from './balanceManager';

/**
 * Outil pour suivre et persister les gains générés automatiquement
 * Ce fichier est maintenu pour la compatibilité avec le code existant
 */

/**
 * Récupère les gains quotidiens depuis le stockage local
 */
export const getDailyGains = (): number => {
  return getDailyGains();
};

/**
 * Ajoute un nouveau gain au total quotidien
 */
export const addDailyGain = (gain: number): number => {
  return addDailyGain(gain);
};

/**
 * Réinitialise les compteurs quotidiens
 */
export const resetDailyGains = (): void => {
  resetDailyCounters();
};

export default {
  getDailyGains,
  addDailyGain,
  resetDailyGains
};
