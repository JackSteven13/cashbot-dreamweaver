
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

// Modifié: Permettre toujours la génération de gains
export const respectsDailyLimit = (
  subscription: string,
  currentDailyGains: number,
  potentialGain: number
): DailyLimitResult => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Log pour traçabilité et débogage
  console.log(`Vérification limite: ${subscription}, gains actuels ${currentDailyGains}€/${dailyLimit}€, gain potentiel ${potentialGain}€`);
  
  // MODIFIÉ: Toujours permettre le gain, même au-delà de la limite
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

// Modifié: Permettre toujours le démarrage d'une session manuelle
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentDailyGains: number
): SessionCheckResult => {
  return { canStart: true };
};

// Désactivé: Toujours retourner false pour permettre la génération continue de revenus
export const checkUserDailyLimits = (userId: string, subscription: string = 'freemium'): boolean => {
  return false;
};
