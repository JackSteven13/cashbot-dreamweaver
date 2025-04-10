
/**
 * Generates a random amount within a specified range
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random number between min and max
 */
export const getRandomAmount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
