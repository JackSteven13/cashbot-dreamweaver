
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
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  } catch (error) {
    console.error("Erreur lors de l'extraction du code de parrainage de l'URL:", error);
    return null;
  }
};

/**
 * Stocke le code de parrainage dans le stockage local pour une utilisation ultérieure lors de l'inscription
 * @param code Code de parrainage à stocker
 */
export const storeReferralCode = (code: string): void => {
  if (!code) return;
  
  try {
    localStorage.setItem('referralCode', code);
    console.log('Code de parrainage stocké:', code);
    
    // Également stocker la date pour une éventuelle expiration
    localStorage.setItem('referralCodeTimestamp', Date.now().toString());
  } catch (error) {
    console.error('Erreur lors du stockage du code de parrainage:', error);
  }
};

/**
 * Récupère le code de parrainage stocké
 * @param maxAgeHours Durée maximale de validité du code en heures (0 = pas d'expiration)
 * @returns Code de parrainage stocké ou null
 */
export const getStoredReferralCode = (maxAgeHours = 0): string | null => {
  try {
    const code = localStorage.getItem('referralCode');
    
    if (maxAgeHours > 0 && code) {
      const timestamp = parseInt(localStorage.getItem('referralCodeTimestamp') || '0', 10);
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      
      // Vérifier si le code a expiré
      if (now - timestamp > maxAgeMs) {
        console.log('Le code de parrainage a expiré, suppression');
        clearStoredReferralCode();
        return null;
      }
    }
    
    return code;
  } catch (error) {
    console.error('Erreur lors de la récupération du code de parrainage stocké:', error);
    return null;
  }
};

/**
 * Efface le code de parrainage stocké
 */
export const clearStoredReferralCode = (): void => {
  try {
    localStorage.removeItem('referralCode');
    localStorage.removeItem('referralCodeTimestamp');
    console.log('Code de parrainage supprimé');
  } catch (error) {
    console.error('Erreur lors de la suppression du code de parrainage:', error);
  }
};

/**
 * Vérifie si un code de parrainage est valide
 * @param code Code à vérifier
 * @returns Booléen indiquant si le code est valide
 */
export const isValidReferralCode = (code: string | null): boolean => {
  if (!code) return false;
  
  // Vérification basique - peut être étendue selon vos règles
  return code.length > 3 && code.length < 100;
};

/**
 * Obtient un code de parrainage de n'importe quelle source disponible
 * Ordre de priorité: URL > localStorage
 */
export const getAvailableReferralCode = (): string | null => {
  // Vérifier d'abord l'URL
  const urlCode = getReferralCodeFromUrl();
  if (urlCode) {
    // Si trouvé dans l'URL, aussi le stocker
    storeReferralCode(urlCode);
    return urlCode;
  }
  
  // Sinon, vérifier le localStorage
  return getStoredReferralCode();
};
