
/**
 * Generate a referral link for the user
 * @param userId User ID to create referral link for
 * @returns Full referral URL with code
 */
export const generateReferralLink = (userId: string) => {
  // Get the stored access code for the user
  const accessCode = localStorage.getItem('access_code') || userId.substring(0, 8);
  // Return full URL with the code
  return `${window.location.origin}?ref=${accessCode}`;
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
  
  // Également stocker comme code d'accès si pas déjà présent
  if (!localStorage.getItem('access_code')) {
    localStorage.setItem('access_code', code);
  }
};

/**
 * Retrieve stored referral code
 * @returns Stored referral code or null
 */
export const getStoredReferralCode = () => {
  // Priorité au code d'accès stocké (qui est aussi le code de parrainage)
  return localStorage.getItem('access_code') || localStorage.getItem('referralCode');
};

/**
 * Clear stored referral code
 */
export const clearStoredReferralCode = () => {
  localStorage.removeItem('referralCode');
  // Ne pas supprimer le code d'accès, car il est nécessaire pour l'accès à la plateforme
};
