
// Re-export utility functions from specialized modules
export {
  fetchUserReferrals
} from './referral/fetchReferrals';

export {
  generateReferralLink,
  getReferralCodeFromUrl,
  storeReferralCode,
  getStoredReferralCode,
  clearStoredReferralCode
} from './referral/referralLinks';

export {
  validateReferralCode
} from './referral/validationUtils';

export {
  calculateCommissionRate,
  getCommissionRate,
  applyReferralBonus,
  calculateReferralBonus,
  getUserCommissionInfo
} from './referral/commissionUtils';

export {
  calculateWithdrawalFee,
  getWithdrawalThreshold,
  isWithdrawalAllowed
} from './referral/withdrawalUtils';
