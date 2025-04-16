
/**
 * Central balance manager for consistent balance tracking across the application
 */
const balanceManager = (() => {
  // Private variables
  let currentBalance = 0;
  let highestBalance = 0;
  let lastUpdateTime = 0;
  let dailyGains = 0;
  
  // Initialize from localStorage if available
  try {
    const storedBalance = localStorage.getItem('currentBalance');
    const storedHighestBalance = localStorage.getItem('highestBalance');
    const storedDailyGains = localStorage.getItem('dailyGains');
    
    if (storedBalance) {
      currentBalance = parseFloat(storedBalance);
    }
    
    if (storedHighestBalance) {
      highestBalance = parseFloat(storedHighestBalance);
    }
    
    if (storedDailyGains) {
      dailyGains = parseFloat(storedDailyGains);
    }
    
    // Always use the highest value
    currentBalance = Math.max(currentBalance, highestBalance);
    highestBalance = currentBalance;
  } catch (e) {
    console.error('Failed to read balance from localStorage:', e);
  }
  
  return {
    /**
     * Get the current balance
     */
    getCurrentBalance: () => currentBalance,
    
    /**
     * Get the highest recorded balance
     */
    getHighestBalance: () => highestBalance,
    
    /**
     * Update balance with a new gain amount
     * @param gain - Amount to add (can be negative for deductions)
     * @returns Updated balance
     */
    updateBalance: (gain) => {
      // Ensure gain is properly formatted
      const formattedGain = typeof gain === 'number' ? gain : parseFloat(String(gain)) || 0;
      const previousBalance = currentBalance;
      
      // Apply the gain to the current balance
      currentBalance = Math.max(0, currentBalance + formattedGain);
      
      // Update highest balance if needed
      if (currentBalance > highestBalance) {
        highestBalance = currentBalance;
        localStorage.setItem('highestBalance', highestBalance.toString());
      }
      
      // Update localStorage
      localStorage.setItem('currentBalance', currentBalance.toString());
      lastUpdateTime = Date.now();
      
      // If this is a positive gain, add it to daily gains
      if (formattedGain > 0) {
        dailyGains += formattedGain;
        localStorage.setItem('dailyGains', dailyGains.toString());
        
        // Broadcast daily gains update event
        window.dispatchEvent(new CustomEvent('dailyGains:updated', {
          detail: {
            gains: dailyGains,
            timestamp: lastUpdateTime
          }
        }));
      }
      
      // Broadcast update event for real-time sync
      if (formattedGain !== 0) {
        window.dispatchEvent(new CustomEvent('balance:updated', { 
          detail: { 
            previousBalance,
            currentBalance,
            gain: formattedGain,
            timestamp: lastUpdateTime
          }
        }));
      }
      
      return currentBalance;
    },
    
    /**
     * Add to daily gains counter without affecting balance
     * @param gain - Amount to add to daily gains
     * @returns Updated daily gains
     */
    addDailyGain: (gain) => {
      const formattedGain = typeof gain === 'number' ? gain : parseFloat(String(gain)) || 0;
      
      if (formattedGain > 0) {
        dailyGains += formattedGain;
        localStorage.setItem('dailyGains', dailyGains.toString());
        
        // Broadcast daily gains update event
        window.dispatchEvent(new CustomEvent('dailyGains:updated', {
          detail: {
            gains: dailyGains,
            timestamp: Date.now()
          }
        }));
      }
      
      return dailyGains;
    },
    
    /**
     * Get the current daily gains
     */
    getDailyGains: () => dailyGains,
    
    /**
     * Reset daily counters
     */
    resetDailyCounters: () => {
      dailyGains = 0;
      localStorage.setItem('dailyGains', '0');
      
      // Broadcast reset event
      window.dispatchEvent(new CustomEvent('dailyGains:reset', {
        detail: {
          timestamp: Date.now()
        }
      }));
    },
    
    /**
     * Force set the balance to a specific value
     * @param newBalance - New balance value
     */
    forceBalanceSync: (newBalance) => {
      if (typeof newBalance !== 'number' || isNaN(newBalance)) return currentBalance;
      
      const previousBalance = currentBalance;
      currentBalance = Math.max(0, newBalance);
      
      // Update highest balance if needed
      if (currentBalance > highestBalance) {
        highestBalance = currentBalance;
        localStorage.setItem('highestBalance', highestBalance.toString());
      }
      
      localStorage.setItem('currentBalance', currentBalance.toString());
      lastUpdateTime = Date.now();
      
      // Broadcast update event
      window.dispatchEvent(new CustomEvent('balance:force-update', { 
        detail: { 
          previousBalance,
          newBalance: currentBalance,
          timestamp: lastUpdateTime
        }
      }));
      
      return currentBalance;
    },
    
    /**
     * Reset balance to zero (for withdrawals)
     */
    resetBalance: () => {
      const previousBalance = currentBalance;
      currentBalance = 0;
      localStorage.setItem('currentBalance', '0');
      lastUpdateTime = Date.now();
      
      // Broadcast reset event
      window.dispatchEvent(new CustomEvent('balance:reset-complete', { 
        detail: { 
          previousBalance,
          timestamp: lastUpdateTime
        }
      }));
      
      return 0;
    },
    
    /**
     * Initialize with a specific balance value
     * @param initialBalance - Initial balance to set
     */
    initialize: (initialBalance) => {
      if (typeof initialBalance !== 'number' || isNaN(initialBalance)) return currentBalance;
      
      // Only update if initialBalance is higher than current
      if (initialBalance > currentBalance) {
        currentBalance = initialBalance;
        
        // Update highest balance if needed
        if (currentBalance > highestBalance) {
          highestBalance = currentBalance;
          localStorage.setItem('highestBalance', highestBalance.toString());
        }
        
        localStorage.setItem('currentBalance', currentBalance.toString());
      }
      
      return currentBalance;
    },
    
    /**
     * Get the last update timestamp
     */
    getLastUpdateTime: () => lastUpdateTime,
    
    /**
     * Synchronize balance with database (placeholder for actual implementation)
     */
    syncWithDatabase: async () => {
      // This is a placeholder that would be implemented to sync with the backend
      // For now, just return a resolved promise
      return Promise.resolve({ success: true, balance: currentBalance });
    },
    
    /**
     * Clean up user balance data when switching users
     */
    cleanupUserBalanceData: () => {
      // Reset all balance-related data
      currentBalance = 0;
      highestBalance = 0;
      dailyGains = 0;
      lastUpdateTime = 0;
      
      // Clear localStorage
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('highestBalance');
      localStorage.removeItem('dailyGains');
      localStorage.removeItem('lastBalanceUpdateTime');
      
      console.log('User balance data cleaned up');
    }
  };
})();

export default balanceManager;

// Export the getHighestBalance function directly for imports that need it
export const getHighestBalance = () => balanceManager.getHighestBalance();
