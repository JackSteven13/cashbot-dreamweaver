
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

// Function to check if daily limits are respected
export const respectsDailyLimit = (
  subscription: string,
  currentDailyGains: number,
  potentialGain: number
): DailyLimitResult => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Log pour traçabilité et débogage
  console.log(`Vérification limite: ${subscription}, gains actuels ${currentDailyGains}€/${dailyLimit}€, gain potentiel ${potentialGain}€`);
  
  // Vérification stricte: si nous sommes déjà au-delà de 99.5% de la limite, bloquer tout gain
  if (currentDailyGains >= dailyLimit * 0.995) {
    console.log(`Limite atteinte (${currentDailyGains}€/${dailyLimit}€): blocage complet des gains`);
    return {
      allowed: false,
      adjustedGain: 0
    };
  }
  
  // Check if adding the potential gain would exceed the daily limit
  if (currentDailyGains + potentialGain > dailyLimit) {
    // Calculate how much gain we can still add without exceeding the limit
    const remainingAllowance = Math.max(0, dailyLimit - currentDailyGains);
    
    if (remainingAllowance <= 0) {
      // No more gains allowed today
      console.log(`Aucun gain autorisé: limite journalière atteinte`);
      return {
        allowed: false,
        adjustedGain: 0
      };
    }
    
    // Allow a partial gain to reach exactly the daily limit
    console.log(`Gain ajusté de ${potentialGain}€ à ${remainingAllowance.toFixed(2)}€ pour respecter la limite`);
    return {
      allowed: true,
      adjustedGain: parseFloat(remainingAllowance.toFixed(2))
    };
  }
  
  // The potential gain is within limits, allow it
  console.log(`Gain autorisé: ${potentialGain}€ (total sera ${(currentDailyGains + potentialGain).toFixed(2)}€/${dailyLimit}€)`);
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
    return true;
  }
  
  return false;
};

// Function to check if a manual session can be started
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentDailyGains: number
): SessionCheckResult => {
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
  
  // Check daily gains limit (95% pour être préventif)
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  if (currentDailyGains >= dailyLimit * 0.95) {
    return {
      canStart: false,
      reason: `Limite de gains quotidiens atteinte (${currentDailyGains.toFixed(2)}€/${dailyLimit}€)`
    };
  }
  
  return {
    canStart: true
  };
};

// These functions for backward compatibility
export const subscribeToAuthChanges = () => {
  console.log("Auth change subscription function called - deprecated");
  return () => {}; // Return noop cleanup function
};

export const unsubscribeFromAuthChanges = () => {
  console.log("Auth change unsubscription function called - deprecated");
};
