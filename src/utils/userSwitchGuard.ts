
import balanceManager from './balance/balanceManager';

// Function to clean up user data when switching users
export const cleanupUserData = (userId: string | null) => {
  console.log(`Cleaning up data for user ${userId || 'unknown'}`);
  
  // Clean up balance data
  balanceManager.forceBalanceSync(0);
  
  // Clean up other user-specific data
  localStorage.removeItem('lastSessionTime');
  localStorage.removeItem('sessionCount');
  localStorage.removeItem('lastKnownUsername');
  localStorage.removeItem('lastKnownBalance');
  localStorage.removeItem('referralLink');
  localStorage.removeItem('welcomeMessageShown');
  
  console.log("User data cleanup completed");
};

export default cleanupUserData;
