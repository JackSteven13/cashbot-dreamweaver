
// If this file doesn't exist yet, we need to create it with the proper exports
let currentBalance = 0;
let highestBalance = 0;

// Function to initialize the balance manager with values from localStorage or API
const initialize = (initialBalance: number) => {
  // Get values from localStorage
  const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
  const storedHighest = parseFloat(localStorage.getItem('highestBalance') || '0');
  
  // Determine the highest possible value
  currentBalance = Math.max(initialBalance, storedBalance);
  highestBalance = Math.max(currentBalance, storedHighest, initialBalance);
  
  // Store the values back to localStorage
  localStorage.setItem('currentBalance', currentBalance.toString());
  localStorage.setItem('highestBalance', highestBalance.toString());
  
  console.log(`Balance manager initialized: current=${currentBalance}, highest=${highestBalance}`);
  return currentBalance;
};

// Function to get the current balance
const getCurrentBalance = () => {
  const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
  return Math.max(currentBalance, storedBalance);
};

// Function to get the highest recorded balance
const getHighestBalance = () => {
  const storedHighest = parseFloat(localStorage.getItem('highestBalance') || '0');
  return Math.max(highestBalance, storedHighest);
};

// Function to update the current balance
const updateBalance = (newBalance: number) => {
  if (newBalance > currentBalance) {
    currentBalance = newBalance;
    localStorage.setItem('currentBalance', currentBalance.toString());
    
    // Update highest balance if needed
    if (newBalance > highestBalance) {
      highestBalance = newBalance;
      localStorage.setItem('highestBalance', highestBalance.toString());
    }
  }
  return currentBalance;
};

// Function to reset the balance
const resetBalance = () => {
  currentBalance = 0;
  localStorage.setItem('currentBalance', '0');
  return currentBalance;
};

// Export all functions as methods of the balanceManager object
const balanceManager = {
  initialize,
  getCurrentBalance,
  getHighestBalance,
  updateBalance,
  resetBalance
};

export default balanceManager;

// Export individual functions for direct use
export {
  initialize,
  getCurrentBalance,
  getHighestBalance,
  updateBalance,
  resetBalance
};
