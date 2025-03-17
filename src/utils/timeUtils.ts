
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
 * Calculates time until next reset date (1st, 15th, or 29th of month)
 * @returns Time in milliseconds until the next reset
 */
export const calculateTimeUntilNextReset = (): number => {
  const parisTime = getParisTime();
  const currentDay = parisTime.getDate();
  const currentYear = parisTime.getFullYear();
  const currentMonth = parisTime.getMonth();
  
  let nextResetDate;
  
  if (currentDay < 15) {
    // Next reset is on the 15th
    nextResetDate = new Date(currentYear, currentMonth, 15);
  } else if (currentDay < 29) {
    // Next reset is on the 29th, but check if month has 29th
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    nextResetDate = new Date(currentYear, currentMonth, Math.min(29, lastDayOfMonth));
  } else {
    // Next reset is on the 1st of next month
    nextResetDate = new Date(currentYear, currentMonth + 1, 1);
  }
  
  // Set to midnight
  nextResetDate.setHours(0, 0, 0, 0);
  
  // If we're already past midnight, add a day
  if (parisTime.getHours() === 0 && parisTime.getMinutes() === 0 && 
      parisTime.getDate() === nextResetDate.getDate()) {
    nextResetDate.setDate(nextResetDate.getDate() + 1);
  }
  
  return nextResetDate.getTime() - parisTime.getTime();
};
