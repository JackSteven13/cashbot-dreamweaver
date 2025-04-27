import balanceManager from '@/utils/balance/balanceManager';
import { cleanOtherUserData } from '@/utils/balance/balanceStorage';

// Detects if the current user has changed from a previous session
export const detectUserSwitch = async () => {
  try {
    // Retrieve previous user ID
    const previousUserId = localStorage.getItem('lastKnownUserId');
    
    // Get current user from Supabase Auth
    const { data } = await fetch('/api/auth/me').then(res => res.json());
    const currentUserId = data?.id;
    
    // If we have both IDs and they don't match, a switch occurred
    if (previousUserId && currentUserId && previousUserId !== currentUserId) {
      console.warn(`User switch detected: ${previousUserId} -> ${currentUserId}`);
      
      // Clean all data from previous user
      cleanOtherUserData(currentUserId);
      
      // Reset balance manager data with new user ID
      if (currentUserId) {
        balanceManager.setUserId(currentUserId);
        balanceManager.setDailyGains(0);
      }
      
      // Force balance reset in manager
      if (balanceManager.forceBalanceSync) {
        balanceManager.forceBalanceSync(0, currentUserId);  
      }
      
      // Update user ID
      localStorage.setItem('lastKnownUserId', currentUserId);
      
      return true;
    }
    
    // If we have a current user but no previous user, store it
    if (currentUserId && !previousUserId) {
      localStorage.setItem('lastKnownUserId', currentUserId);
      
      // Initialize balance manager with user ID
      balanceManager.setUserId(currentUserId);
    }
    
    return false;
  } catch (error) {
    console.error("Error detecting user switch:", error);
    return false;
  }
};

// Clear cached balance data when logging out
export const clearUserData = () => {
  const currentUserId = localStorage.getItem('lastKnownUserId');
  
  // If we know which user was logged in, only clear their data
  if (currentUserId) {
    cleanOtherUserData(null); // Clear all user data
  } else {
    // Otherwise, clear common keys
    localStorage.removeItem('cachedTransactions');
    localStorage.removeItem('lastKnownBalance');
    localStorage.removeItem('currentBalance');
    localStorage.removeItem('dailyGains');
    localStorage.removeItem('lastKnownUserId');
  }
  
  // Reset balance manager
  if (balanceManager.forceBalanceSync) {
    balanceManager.forceBalanceSync(0, null);
  }
  
  if (balanceManager.setDailyGains) {
    balanceManager.setDailyGains(0);
  }
  
  // Remove user ID from balance manager
  balanceManager.setUserId('');
};
