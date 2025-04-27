
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

// RENFORCÉ: Vérifier strictement si les limites quotidiennes sont respectées
export const respectsDailyLimit = (
  subscription: string,
  currentDailyGains: number,
  potentialGain: number
): DailyLimitResult => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Log pour traçabilité et débogage
  console.log(`Vérification limite: ${subscription}, gains actuels ${currentDailyGains}€/${dailyLimit}€, gain potentiel ${potentialGain}€`);
  
  // RENFORCÉ: Vérification ultra stricte - si nous sommes déjà à 99.5% de la limite, bloquer tout gain
  if (currentDailyGains >= dailyLimit * 0.995) {
    console.log(`🛑 Limite pratiquement atteinte (${currentDailyGains}€/${dailyLimit}€): blocage complet des gains`);
    return {
      allowed: false,
      adjustedGain: 0
    };
  }
  
  // Check if adding the potential gain would exceed the daily limit
  if (currentDailyGains + potentialGain > dailyLimit) {
    // Calculate how much gain we can still add without exceeding the limit
    // RENFORCÉ: Appliquer une marge de sécurité de 1% pour éviter tout dépassement
    const remainingAllowance = Math.max(0, (dailyLimit - currentDailyGains) * 0.99);
    
    if (remainingAllowance <= 0.01) {
      // No more gains allowed today (seuil minimum de 0.01€)
      console.log(`⛔ Aucun gain autorisé: limite journalière effectivement atteinte`);
      return {
        allowed: false,
        adjustedGain: 0
      };
    }
    
    // RENFORCÉ: Allow a partial gain to reach nearly the daily limit (99% max)
    console.log(`✅ Gain ajusté de ${potentialGain}€ à ${remainingAllowance.toFixed(2)}€ pour respecter strictement la limite`);
    return {
      allowed: true,
      adjustedGain: parseFloat(remainingAllowance.toFixed(2))
    };
  }
  
  // RENFORCÉ: Limiter quand même pour être sûr de ne jamais dépasser
  const safeGain = Math.min(potentialGain, (dailyLimit - currentDailyGains) * 0.99);
  
  // Le gain est dans les limites, mais on applique une marge de sécurité
  console.log(`✅ Gain autorisé: ${safeGain.toFixed(2)}€ (total sera ${(currentDailyGains + safeGain).toFixed(2)}€/${dailyLimit}€)`);
  return {
    allowed: true,
    adjustedGain: parseFloat(safeGain.toFixed(2))
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
    
    // RENFORCÉ: Réinitialiser tous les drapeaux de limite pour tous les utilisateurs
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

// RENFORCÉ: Vérification stricte si une session manuelle peut être démarrée
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentDailyGains: number
): SessionCheckResult => {
  // RENFORCÉ: Vérifier s'il faut réinitialiser les compteurs quotidiens
  const shouldReset = shouldResetDailyCounters();
  if (shouldReset) {
    console.log("Compteurs quotidiens réinitialisés, nouvelle session autorisée");
    return { canStart: true };
  }
  
  // Vérification spéciale pour les comptes freemium (STRICTEMENT 1 session par jour)
  if (subscription === 'freemium') {
    if (dailySessionCount >= 1) {
      return {
        canStart: false,
        reason: `Limite quotidienne atteinte pour compte freemium (${dailySessionCount}/1)`
      };
    }
  }
  
  // Check subscription limit for number of sessions
  let maxSessions = 1;  // Default for freemium
  
  if (subscription === 'starter') {
    maxSessions = 10;
  } else if (subscription === 'gold') {
    maxSessions = 30;
  } else if (subscription === 'elite') {
    maxSessions = 60;
  }
  
  // Check if daily session limit is reached
  if (dailySessionCount >= maxSessions) {
    return {
      canStart: false,
      reason: `Limite de sessions quotidiennes atteinte (${dailySessionCount}/${maxSessions})`
    };
  }
  
  // RENFORCÉ: Vérification STRICTE de la limite de gains (99% de la limite pour bloquer tôt)
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  if (currentDailyGains >= dailyLimit * 0.99) {
    return {
      canStart: false,
      reason: `Limite de gains quotidiens atteinte (${currentDailyGains.toFixed(2)}€/${dailyLimit}€)`
    };
  }
  
  return {
    canStart: true
  };
};

// NOUVEAU: Vérifier quotidiennement les limites d'utilisateur spécifiques
export const checkUserDailyLimits = (userId: string, subscription: string = 'freemium'): boolean => {
  const today = new Date().toDateString();
  const lastLimitCheck = localStorage.getItem(`last_limit_check_${userId}`);
  
  // Si c'est un nouveau jour, réinitialiser
  if (lastLimitCheck !== today) {
    localStorage.removeItem(`daily_limit_reached_${userId}`);
    localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
    localStorage.removeItem(`last_session_date_${userId}`);
    localStorage.setItem(`last_limit_check_${userId}`, today);
    return false; // Limites pas atteintes car nouveau jour
  }
  
  // Vérifier si les limites sont marquées comme atteintes
  const dailyLimitReached = localStorage.getItem(`daily_limit_reached_${userId}`) === 'true';
  const freemiumLimitReached = subscription === 'freemium' && 
                              localStorage.getItem(`freemium_daily_limit_reached_${userId}`) === 'true';
  
  return dailyLimitReached || freemiumLimitReached;
};
