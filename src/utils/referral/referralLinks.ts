
/**
 * Generate a referral link for the user
 * @param userId User ID to create referral link for
 * @returns Full referral URL with code
 */
export const generateReferralLink = (userId: string) => {
  // Create a shorter referral code using just the first part of the UUID
  const referralCode = userId.substring(0, 8);
  // Return full URL with the referral code
  return `${window.location.origin}?ref=${referralCode}`;
};

/**
 * Get referral code from URL
 * @returns Referral code or null if not found
 */
export const getReferralCodeFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || null;
};

/**
 * Store referral code in local storage for later use during registration
 * @param code Referral code to store
 */
export const storeReferralCode = (code: string) => {
  localStorage.setItem('referralCode', code);
};

/**
 * Retrieve stored referral code
 * @returns Stored referral code or null
 */
export const getStoredReferralCode = () => {
  return localStorage.getItem('referralCode');
};

/**
 * Clear stored referral code
 */
export const clearStoredReferralCode = () => {
  localStorage.removeItem('referralCode');
};
