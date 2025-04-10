
// Re-export all user data utils from their respective files
export { 
  fetchUserProfile,
  fetchUserBalance,
  fetchUserTransactions,
  fetchCompleteUserData
} from './user/userDataFetch';

export {
  updateUserBalance,
  resetUserBalance,
  updateSessionCount,
  // Include dormancy utilities
  checkAccountDormancy,
  calculateDormancyPenalties,
  applyDormancyPenalties,
  calculateReactivationFee,
  reactivateAccount,
  DORMANCY_CONSTANTS
} from './userBalanceUtils';

export {
  addTransaction
} from './transactionUtils';

export {
  fetchUserReferrals,
  generateReferralLink,
  calculateReferralBonus,
  applyReferralBonus
} from './referralUtils';

// Add new utility function to safely get subscription
export const getSubscription = (userData: any): string => {
  if (!userData) return 'freemium';
  
  // Try to get subscription from different locations in the userData object
  return userData.subscription || 
         (userData.profile && userData.profile.subscription) || 
         'freemium';
};
