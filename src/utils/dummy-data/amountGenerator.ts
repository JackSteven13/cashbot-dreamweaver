
/**
 * Génère un montant aléatoire entre min et max
 * @param min Montant minimum
 * @param max Montant maximum
 * @returns Montant généré
 */
export const getRandomAmount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
