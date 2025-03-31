import { supabase } from "@/integrations/supabase/client";

// Subscription plans and their limits (updated to match new values)
export const SUBSCRIPTION_LIMITS = {
  'freemium': 1,
  'starter': 7,
  'gold': 25,
  'elite': 75
};

// Base percentages for manual boost sessions
export const MANUAL_SESSION_GAIN_PERCENTAGES = {
  'freemium': { min: 0.10, max: 0.20 },  // 10-20% of daily limit
  'starter': { min: 0.05, max: 0.15 },   // 5-15% of daily limit
  'gold': { min: 0.03, max: 0.10 },      // 3-10% of daily limit
  'elite': { min: 0.02, max: 0.08 }      // 2-8% of daily limit
};

/**
 * Convertit l'ancien abonnement "alpha" en "starter"
 */
const normalizeSubscription = (subscription: string): string => {
  if (subscription === "alpha") {
    console.log('Normalisation d\'abonnement: alpha -> starter');
    return "starter";
  }
  return subscription;
};

/**
 * Vérifie le mode Pro temporaire et retourne la souscription effective
 */
export const getEffectiveSubscription = (subscription: string): string => {
  // Normaliser d'abonnement (convertir "alpha" en "starter")
  const normalizedSubscription = normalizeSubscription(subscription);
  
  // Vérifier si l'utilisateur a un essai Pro actif
  const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
  const proTrialExpires = localStorage.getItem('proTrialExpires');
  
  if (proTrialActive && proTrialExpires) {
    const expiryTime = parseInt(proTrialExpires, 10);
    const now = Date.now();
    
    // Vérification de l'expiration
    if (now < expiryTime) {
      console.log("Essai Pro actif, retourne 'starter'");
      return 'starter';
    } else {
      // Si expiré, nettoyer le localStorage et marquer comme utilisé
      console.log("Essai Pro expiré. Nettoyage des données d'essai.");
      localStorage.removeItem('proTrialActive');
      localStorage.removeItem('proTrialExpires');
      localStorage.removeItem('proTrialActivatedAt');
      localStorage.setItem('proTrialUsed', 'true');
      
      // Essayer de mettre à jour la base de données
      try {
        const updateProTrialStatus = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase
              .from('user_balances')
              .update({ 
                pro_trial_used: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
          }
        };
        
        updateProTrialStatus();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut de l'essai Pro:", error);
      }
    }
  }
  
  return normalizedSubscription;
};

/**
 * Checks if the user has reached the daily gain limit based on their subscription
 */
export const checkDailyLimit = (balance: number, subscription: string): boolean => {
  const normalizedSubscription = normalizeSubscription(subscription);
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return balance >= dailyLimit;
};

/**
 * Checks if the user can start a manual session
 */
export const canStartManualSession = (subscription: string, dailySessionCount: number, balance: number): boolean => {
  const normalizedSubscription = normalizeSubscription(subscription);
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  
  // Users with Pro trial or higher subscriptions have unlimited sessions
  if (effectiveSubscription !== 'freemium') {
    return balance < SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS];
  }
  
  // Freemium users are limited to 1 manual session per day
  return dailySessionCount < 1 && !checkDailyLimit(balance, subscription);
};

/**
 * Calculate the gain for a manual session
 */
export const calculateManualSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Normalize subscription first
  const normalizedSubscription = normalizeSubscription(subscription);
  
  // Use effective subscription for limit calculation
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  
  // Get daily limit for effective subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount before reaching limit
  const remainingAmount = dailyLimit - currentBalance;
  
  // If limit already reached, return 0
  if (remainingAmount <= 0) {
    return 0;
  }
  
  // Get base percentage ranges for this subscription
  const percentages = MANUAL_SESSION_GAIN_PERCENTAGES[effectiveSubscription as keyof typeof MANUAL_SESSION_GAIN_PERCENTAGES];
  
  // Base gain is a percentage of the subscription's daily limit
  const minPercentage = percentages.min;
  const maxPercentage = percentages.max;
  
  // Random percentage within the range
  const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
  
  // Calculate base gain
  let gain = dailyLimit * randomPercentage;
  
  // Referral bonus: each referral adds a small percentage (0.5-2%) to the gain, up to 25% extra
  if (referralCount > 0) {
    const referralBonus = Math.min(referralCount * 0.05, 0.25); // Max 25% bonus
    gain = gain * (1 + referralBonus);
  }
  
  // Ensure gain doesn't exceed remaining amount
  gain = Math.min(gain, remainingAmount);
  
  // Round to 2 decimal places and ensure positive
  return parseFloat(Math.max(0.01, gain).toFixed(2));
};

/**
 * Calculate the gain for an automatic session
 */
export const calculateAutoSessionGain = (
  subscription: string, 
  currentBalance: number,
  referralCount: number = 0
): number => {
  // Normalize subscription first
  const normalizedSubscription = normalizeSubscription(subscription);
  
  // Use effective subscription for limit calculation
  const effectiveSubscription = getEffectiveSubscription(normalizedSubscription);
  
  // Get daily limit for effective subscription
  const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Calculate remaining amount before reaching limit
  const remainingAmount = dailyLimit - currentBalance;
  
  // If limit already reached, return 0
  if (remainingAmount <= 0) {
    return 0;
  }
  
  // Auto sessions generate smaller gains than manual sessions
  // They are 10-30% of the manual session gains
  const minPercentage = 0.01;  // Min 1% of daily limit
  const maxPercentage = 0.03;  // Max 3% of daily limit
  
  // Random percentage within the range
  const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
  
  // Calculate base gain
  let gain = dailyLimit * randomPercentage;
  
  // Referral bonus: each referral adds a small percentage to the gain
  if (referralCount > 0) {
    const referralBonus = Math.min(referralCount * 0.02, 0.15); // Max 15% bonus
    gain = gain * (1 + referralBonus);
  }
  
  // Ensure gain doesn't exceed remaining amount
  gain = Math.min(gain, remainingAmount);
  
  // Round to 2 decimal places and ensure positive
  return parseFloat(Math.max(0.01, gain).toFixed(2));
};
