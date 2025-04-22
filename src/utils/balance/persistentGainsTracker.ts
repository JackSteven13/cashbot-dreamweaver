
import { supabase } from "@/integrations/supabase/client";
import balanceManager from "./balanceManager";

/**
 * Reset daily gains to zero at midnight
 */
export const resetDailyGainsAtMidnight = () => {
  const now = new Date();
  
  // Get last reset date from localStorage
  const lastResetDate = localStorage.getItem('lastDailyGainsReset');
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // If last reset was not today, reset daily gains
  if (lastResetDate !== today) {
    console.log(`Resetting daily gains (last reset: ${lastResetDate || 'never'}, today: ${today})`);
    
    // Reset daily gains in balance manager
    const dailyGains = balanceManager.getDailyGains();
    if (dailyGains > 0) {
      // Store the previous value before resetting
      localStorage.setItem('previousDailyGains', dailyGains.toString());
      
      // Manually set dailyGains to 0 in localStorage since balanceManager might not have setDailyGains
      localStorage.setItem('dailyGains', '0');
      
      // Update the manager if possible
      if (typeof balanceManager.setDailyGains === 'function') {
        balanceManager.setDailyGains(0);
      }
    }
    
    // Reset freemium session limit
    localStorage.removeItem('freemium_daily_limit_reached');
    localStorage.removeItem('last_session_date');
    
    // Store reset date
    localStorage.setItem('lastDailyGainsReset', today);
    console.log("Daily gains reset to 0");
    
    return true;
  } else {
    console.log("Reset already happened today, skipping");
    return false;
  }
};

/**
 * Persists the daily gains to localStorage on unmount
 */
export const persistDailyGains = () => {
  try {
    const currentGains = balanceManager.getDailyGains();
    localStorage.setItem('dailyGains', currentGains.toString());
    console.log(`Daily gains (${currentGains}€) persisted to localStorage`);
    return true;
  } catch (error) {
    console.error("Error persisting daily gains:", error);
    return false;
  }
};

export default {
  resetDailyGainsAtMidnight,
  persistDailyGains
};
