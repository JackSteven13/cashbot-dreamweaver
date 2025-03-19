
// Re-export all user data utils from their respective files
export { 
  fetchUserProfile,
  fetchUserBalance,
  fetchUserTransactions,
  fetchCompleteUserData
} from './userDataFetch';

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
