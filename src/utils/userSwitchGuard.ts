
import balanceManager from '@/utils/balance/balanceManager';

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
      
      // Reset local cache data
      localStorage.removeItem('cachedTransactions');
      localStorage.removeItem('lastKnownBalance');
      localStorage.removeItem('currentBalance');
      localStorage.removeItem('dailyGains');
      
      // Reset balance manager data
      if (balanceManager.setDailyGains) {
        balanceManager.setDailyGains(0);
      }
      
      // Force balance reset in manager
      if (balanceManager.forceBalanceSync) {
        balanceManager.forceBalanceSync(0);  
      }
      
      // Update user ID
      localStorage.setItem('lastKnownUserId', currentUserId);
      
      return true;
    }
    
    // If we have a current user but no previous user, store it
    if (currentUserId && !previousUserId) {
      localStorage.setItem('lastKnownUserId', currentUserId);
    }
    
    return false;
  } catch (error) {
    console.error("Error detecting user switch:", error);
    
    // Reset balance manager data
    if (balanceManager.setDailyGains) {
      balanceManager.setDailyGains(0);
    }
    
    return false;
  }
};

// Clear cached balance data when logging out
export const clearUserData = () => {
  localStorage.removeItem('cachedTransactions');
  localStorage.removeItem('lastKnownBalance');
  localStorage.removeItem('currentBalance');
  localStorage.removeItem('dailyGains');
  localStorage.removeItem('lastKnownUserId');
  
  // Reset balance manager
  if (balanceManager.forceBalanceSync) {
    balanceManager.forceBalanceSync(0);
  }
  
  if (balanceManager.setDailyGains) {
    balanceManager.setDailyGains(0);
  }
};
