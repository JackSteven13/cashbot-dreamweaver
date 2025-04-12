// If this file doesn't exist yet, we need to create it with the proper exports
let currentBalance = 0;
let highestBalance = 0;
let dailyGains = 0;
let lastGainDate = '';
let subscribers: Array<(state: { lastKnownBalance: number, userId?: string }) => void> = [];

// Function to initialize the balance manager with values from localStorage or API
const initialize = (initialBalance: number, userId?: string) => {
  // Get values from localStorage
  const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
  const storedHighest = parseFloat(localStorage.getItem('highestBalance') || '0');
  
  // Determine the highest possible value
  currentBalance = Math.max(initialBalance, storedBalance);
  highestBalance = Math.max(currentBalance, storedHighest, initialBalance);
  
  // Store the values back to localStorage
  localStorage.setItem('currentBalance', currentBalance.toString());
  localStorage.setItem('highestBalance', highestBalance.toString());
  
  // Initialize daily gains
  initializeDailyGains();
  
  console.log(`Balance manager initialized: current=${currentBalance}, highest=${highestBalance}`);
  
  // Notify subscribers of the initial state
  notifySubscribers(userId);
  
  return currentBalance;
};

// Function to notify all subscribers of state changes
const notifySubscribers = (userId?: string) => {
  subscribers.forEach(callback => {
    callback({
      lastKnownBalance: currentBalance,
      userId
    });
  });
};

// Function to subscribe to balance changes
const subscribe = (callback: (state: { lastKnownBalance: number, userId?: string }) => void) => {
  subscribers.push(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
};

// Function to get the current balance
const getCurrentBalance = () => {
  const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
  return Math.max(currentBalance, storedBalance);
};

// Function to get the balance for consistency - alias for getCurrentBalance
const getBalance = () => {
  return getCurrentBalance();
};

// Function to get the highest recorded balance
const getHighestBalance = () => {
  const storedHighest = parseFloat(localStorage.getItem('highestBalance') || '0');
  return Math.max(highestBalance, storedHighest);
};

// Function to initialize daily gains
const initializeDailyGains = () => {
  const today = new Date().toISOString().split('T')[0];
  const storedDate = localStorage.getItem('lastGainDate');
  
  // If it's a new day, reset daily gains
  if (storedDate !== today) {
    dailyGains = 0;
    localStorage.setItem('dailyGains', '0');
    localStorage.setItem('lastGainDate', today);
  } else {
    // Otherwise load stored gains
    dailyGains = parseFloat(localStorage.getItem('dailyGains') || '0');
  }
  
  return dailyGains;
};

// Function to get daily gains
const getDailyGains = () => {
  // Check if we need to reset for a new day
  const today = new Date().toISOString().split('T')[0];
  if (lastGainDate !== today) {
    initializeDailyGains();
  }
  
  return dailyGains;
};

// Function to add to daily gains
const addDailyGain = (gain: number) => {
  // Make sure daily gains are initialized
  if (dailyGains === 0) {
    initializeDailyGains();
  }
  
  const today = new Date().toISOString().split('T')[0];
  lastGainDate = today;
  localStorage.setItem('lastGainDate', today);
  
  dailyGains += gain;
  localStorage.setItem('dailyGains', dailyGains.toString());
  
  // Trigger an event to inform other components
  window.dispatchEvent(new CustomEvent('dailyGains:updated', {
    detail: { total: dailyGains, lastGain: gain }
  }));
  
  return dailyGains;
};

// Function to reset daily gains counters without affecting balance
const resetDailyCounters = () => {
  dailyGains = 0;
  const today = new Date().toISOString().split('T')[0];
  lastGainDate = today;
  
  localStorage.setItem('dailyGains', '0');
  localStorage.setItem('lastGainDate', today);
  
  // Trigger an event to inform other components
  window.dispatchEvent(new CustomEvent('dailyGains:reset'));
  
  return dailyGains;
};

// Function to update the current balance
const updateBalance = (newGain: number) => {
  const currentBalanceValue = getCurrentBalance();
  const newBalance = currentBalanceValue + newGain;
  
  currentBalance = newBalance;
  localStorage.setItem('currentBalance', currentBalance.toString());
  
  // Update highest balance if needed
  if (newBalance > highestBalance) {
    highestBalance = newBalance;
    localStorage.setItem('highestBalance', highestBalance.toString());
  }
  
  // Add to daily gains if it's a positive gain
  if (newGain > 0) {
    addDailyGain(newGain);
  }
  
  // Notify subscribers
  notifySubscribers();
  
  return currentBalance;
};

// Function to force update balance to a specific value
const forceUpdate = (newBalance: number) => {
  currentBalance = newBalance;
  localStorage.setItem('currentBalance', currentBalance.toString());
  
  // Update highest balance if needed
  if (newBalance > highestBalance) {
    highestBalance = newBalance;
    localStorage.setItem('highestBalance', highestBalance.toString());
  }
  
  return currentBalance;
};

// Function to reset the balance
const resetBalance = () => {
  currentBalance = 0;
  localStorage.setItem('currentBalance', '0');
  return currentBalance;
};

// Function to add a transaction to the database
const addTransaction = async (userId: string, gain: number, report: string) => {
  try {
    // This is a placeholder function - it should integrate with actual DB logic
    // For now, we'll just return a success flag
    console.log(`Adding transaction for user ${userId}: ${gain}€ - ${report}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false };
  }
};

// Function to sync balance with database
const syncWithDatabase = async () => {
  try {
    // This is a placeholder function - it should integrate with actual DB logic
    console.log("Syncing balance with database...");
    return { success: true };
  } catch (error) {
    console.error("Error syncing with database:", error);
    return { success: false };
  }
};

// Function to clean up user balance data
const cleanupUserBalanceData = () => {
  // Reset all local values
  currentBalance = 0;
  highestBalance = 0;
  dailyGains = 0;
  lastGainDate = '';
  
  // Clean up localStorage items
  localStorage.removeItem('currentBalance');
  localStorage.removeItem('highestBalance');
  localStorage.removeItem('dailyGains');
  localStorage.removeItem('lastGainDate');
  localStorage.removeItem('lastBalanceUpdateTime');
  
  console.log("User balance data cleaned up");
};

// Export all functions as methods of the balanceManager object
const balanceManager = {
  initialize,
  getCurrentBalance,
  getBalance,
  getHighestBalance,
  updateBalance,
  resetBalance,
  getDailyGains,
  addDailyGain,
  resetDailyCounters,
  forceUpdate,
  addTransaction,
  syncWithDatabase,
  cleanupUserBalanceData,
  subscribe
};

export default balanceManager;

// Export individual functions for direct use
export {
  initialize,
  getCurrentBalance,
  getHighestBalance,
  updateBalance,
  resetBalance,
  getDailyGains,
  addDailyGain,
  resetDailyCounters
};
