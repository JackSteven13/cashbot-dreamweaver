import { SUBSCRIPTION_LIMITS } from './constants';
import { supabase } from '@/integrations/supabase/client';

// Define types
export interface SessionStartResult {
  success: boolean;
  error?: string;
  gain?: number;
}

export interface DailyLimitResult {
  allowed: boolean;
  adjustedGain: number;
}

export interface SessionCheckResult {
  canStart: boolean;
  reason?: string;
}

// Réactivé: Respect strict des limites quotidiennes
export const respectsDailyLimit = (
  subscription: string,
  currentDailyGains: number,
  potentialGain: number
): DailyLimitResult => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Log pour traçabilité et débogage
  console.log(`Vérification limite: ${subscription}, gains actuels ${currentDailyGains}€/${dailyLimit}€, gain potentiel ${potentialGain}€`);
  
  // Si la limite est déjà dépassée, bloquer tout gain supplémentaire
  if (currentDailyGains >= dailyLimit) {
    console.log(`LIMITE ATTEINTE: ${currentDailyGains}€/${dailyLimit}€, aucun gain autorisé`);
    return {
      allowed: false,
      adjustedGain: 0
    };
  }
  
  // Si le gain potentiel ferait dépasser la limite, ajuster le gain
  if (currentDailyGains + potentialGain > dailyLimit) {
    const adjustedGain = parseFloat((dailyLimit - currentDailyGains).toFixed(2));
    console.log(`GAIN AJUSTÉ: ${potentialGain}€ -> ${adjustedGain}€ pour respecter la limite de ${dailyLimit}€`);
    
    return {
      allowed: true,
      adjustedGain: adjustedGain
    };
  }
  
  // Si tout est en ordre, autoriser le gain complet
  return {
    allowed: true,
    adjustedGain: potentialGain
  };
};

// Function to check if daily counters should be reset
export const shouldResetDailyCounters = (): boolean => {
  const now = new Date();
  const lastResetTimeStr = localStorage.getItem('lastResetTime');
  
  if (!lastResetTimeStr) {
    // No previous reset, should reset now
    localStorage.setItem('lastResetTime', now.toISOString());
    return true;
  }
  
  const lastResetTime = new Date(lastResetTimeStr);
  
  // Check if it's a new day (comparing day components)
  if (now.getDate() !== lastResetTime.getDate() || 
      now.getMonth() !== lastResetTime.getMonth() ||
      now.getFullYear() !== lastResetTime.getFullYear()) {
    
    // It's a new day, update last reset time
    localStorage.setItem('lastResetTime', now.toISOString());
    
    // Réinitialiser tous les drapeaux de limite pour tous les utilisateurs
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.includes('daily_limit_reached') || 
          key.includes('freemium_daily_limit_reached') || 
          key.includes('last_session_date')) {
        localStorage.removeItem(key);
      }
    }
    
    console.log("🔄 Nouveau jour détecté, réinitialisation de toutes les limites quotidiennes");
    
    return true;
  }
  
  return false;
};

// Réactiver la vérification pour les sessions manuelles
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentDailyGains: number
): SessionCheckResult => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Pour les comptes freemium, limite stricte de 1 session par jour
  if (subscription === 'freemium' && dailySessionCount >= 1) {
    return { 
      canStart: false,
      reason: "Les comptes freemium sont limités à 1 session manuelle par jour."
    };
  }
  
  // Si la limite quotidienne est atteinte, bloquer les sessions
  if (currentDailyGains >= dailyLimit * 0.95) {
    return {
      canStart: false,
      reason: `Vous avez presque atteint votre limite quotidienne de ${dailyLimit}€.`
    };
  }
  
  return { canStart: true };
};

// Réactiver: Vérification des limites quotidiennes
export const checkUserDailyLimits = (userId: string, subscription: string = 'freemium'): boolean => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const limitReachedKey = `daily_limit_reached_${userId}`;
  const limitReached = localStorage.getItem(limitReachedKey) === 'true';
  
  return limitReached;
};
