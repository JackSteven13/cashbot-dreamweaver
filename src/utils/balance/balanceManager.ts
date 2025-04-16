
/**
 * Balance Manager Module
 * Provides consistent tracking and management of user balance across the application
 */

// Balance state storage keys
const CURRENT_BALANCE_KEY = 'currentBalance';
const HIGHEST_BALANCE_KEY = 'highestBalance';
const DAILY_GAINS_KEY = 'dailyGains';
const LAST_UPDATE_KEY = 'lastBalanceUpdate';

// Get current balance from local storage or return 0
const getCurrentBalance = () => {
  const storedBalance = localStorage.getItem(CURRENT_BALANCE_KEY);
  return storedBalance ? parseFloat(storedBalance) : 0;
};

// Get highest recorded balance from local storage
const getHighestBalance = () => {
  const storedHighest = localStorage.getItem(HIGHEST_BALANCE_KEY);
  return storedHighest ? parseFloat(storedHighest) : 0;
};

// Get daily gains from local storage
const getDailyGains = () => {
  const storedGains = localStorage.getItem(DAILY_GAINS_KEY);
  return storedGains ? parseFloat(storedGains) : 0;
};

// Add to daily gains and update storage
const addDailyGain = (gain: number) => {
  const currentGains = getDailyGains();
  const newGains = currentGains + gain;
  
  localStorage.setItem(DAILY_GAINS_KEY, newGains.toString());
  
  // Dispatch event to notify the app of the update
  window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
    detail: { gains: newGains }
  }));
  
  return newGains;
};

// Reset daily counters (called at midnight)
const resetDailyCounters = () => {
  localStorage.setItem(DAILY_GAINS_KEY, '0');
  
  // Dispatch event to notify the app of the reset
  window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  
  console.log('Daily gains reset to 0');
  
  return 0;
};

// Update balance with a new gain
const updateBalance = (gain: number) => {
  // Get current values
  const currentBalance = getCurrentBalance();
  const highestBalance = getHighestBalance();
  
  // Calculate new balance
  const newBalance = currentBalance + gain;
  
  // Update current balance
  localStorage.setItem(CURRENT_BALANCE_KEY, newBalance.toString());
  
  // Track highest balance
  if (newBalance > highestBalance) {
    localStorage.setItem(HIGHEST_BALANCE_KEY, newBalance.toString());
  }
  
  // Track daily gains
  addDailyGain(gain);
  
  // Update last update time
  localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
  
  return newBalance;
};

// Force balance to a specific value (used for sync with server)
const forceBalanceSync = (newBalance: number) => {
  const highestBalance = getHighestBalance();
  
  // Update current balance
  localStorage.setItem(CURRENT_BALANCE_KEY, newBalance.toString());
  
  // Only update highest if the new value is higher
  if (newBalance > highestBalance) {
    localStorage.setItem(HIGHEST_BALANCE_KEY, newBalance.toString());
  }
  
  // Update last update time
  localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
  
  return newBalance;
};

// Reset balance to zero
const resetBalance = () => {
  localStorage.setItem(CURRENT_BALANCE_KEY, '0');
  
  // Update last update time
  localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
  
  return 0;
};

// Initialize balance (used when first loading app)
const initialize = (initialBalance: number) => {
  // Only initialize if we don't have a balance already
  // or if the new balance is higher than our current one
  const currentBalance = getCurrentBalance();
  const highestBalance = getHighestBalance();
  
  if (currentBalance === 0 || initialBalance > currentBalance) {
    localStorage.setItem(CURRENT_BALANCE_KEY, initialBalance.toString());
  }
  
  if (initialBalance > highestBalance) {
    localStorage.setItem(HIGHEST_BALANCE_KEY, initialBalance.toString());
  }
  
  // Set update time if we don't have one
  if (!localStorage.getItem(LAST_UPDATE_KEY)) {
    localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
  }
  
  return Math.max(currentBalance, initialBalance);
};

// Get last update timestamp
const getLastUpdateTime = () => {
  const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
  return lastUpdate ? parseInt(lastUpdate) : 0;
};

// Clean up user balance data when switching users
const cleanupUserBalanceData = () => {
  localStorage.removeItem(CURRENT_BALANCE_KEY);
  localStorage.removeItem(HIGHEST_BALANCE_KEY);
  localStorage.removeItem(DAILY_GAINS_KEY);
  localStorage.removeItem(LAST_UPDATE_KEY);
  
  console.log('Balance data cleared for user switch');
};

// Export all functions
export { 
  getCurrentBalance,
  getHighestBalance,
  getDailyGains,
  addDailyGain,
  resetDailyCounters,
  updateBalance,
  forceBalanceSync,
  resetBalance,
  initialize,
  getLastUpdateTime,
  cleanupUserBalanceData
};

// Default export for convenience
export default {
  getCurrentBalance,
  getHighestBalance,
  getDailyGains,
  addDailyGain,
  resetDailyCounters,
  updateBalance,
  forceBalanceSync,
  resetBalance,
  initialize,
  getLastUpdateTime,
  cleanupUserBalanceData
};
