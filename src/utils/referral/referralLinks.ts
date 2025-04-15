
/**
 * Génère un lien de parrainage unique pour l'utilisateur
 * @param userId ID de l'utilisateur pour créer le lien de parrainage
 * @returns URL complet du lien de parrainage
 */
export const generateReferralLink = (userId: string): string => {
  // S'assurer que userId existe
  if (!userId) {
    console.error('User ID is required to generate referral link');
    return `${window.location.origin}/register`;
  }
  
  // Format optimisé pour le lien de parrainage
  return `${window.location.origin}/register?ref=${userId}`;
};

/**
 * Récupère le code de parrainage depuis l'URL
 * @returns Code de parrainage ou null si non trouvé
 */
export const getReferralCodeFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
};

/**
 * Stocke le code de parrainage dans le stockage local pour une utilisation ultérieure lors de l'inscription
 * @param code Code de parrainage à stocker
 */
export const storeReferralCode = (code: string): void => {
  try {
    localStorage.setItem('referralCode', code);
    console.log('Referral code stored:', code);
  } catch (error) {
    console.error('Error storing referral code:', error);
  }
};

/**
 * Récupère le code de parrainage stocké
 * @returns Code de parrainage stocké ou null
 */
export const getStoredReferralCode = (): string | null => {
  try {
    return localStorage.getItem('referralCode');
  } catch (error) {
    console.error('Error retrieving stored referral code:', error);
    return null;
  }
};

/**
 * Efface le code de parrainage stocké
 */
export const clearStoredReferralCode = (): void => {
  try {
    localStorage.removeItem('referralCode');
    console.log('Referral code cleared');
  } catch (error) {
    console.error('Error clearing referral code:', error);
  }
};
