
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

// Fonction de vérification des limites quotidiennes avec double validation
export const respectsDailyLimit = (
  subscription: string,
  currentDailyGains: number,
  potentialGain: number
): DailyLimitResult => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  
  // Traçabilité renforcée
  console.log(`[LIMIT CHECK] Subscription: ${subscription}, Current: ${currentDailyGains.toFixed(2)}€/${dailyLimit}€, Potential gain: ${potentialGain.toFixed(2)}€`);
  
  // Vérification primaire STRICTE: si on est à 97.5% ou plus de la limite, bloquer tout gain
  if (currentDailyGains >= dailyLimit * 0.975) {
    console.log(`[LIMIT REACHED] ${currentDailyGains.toFixed(2)}€/${dailyLimit}€: Complete block`);
    
    // Enregistrer l'état de limite atteinte
    localStorage.setItem('dailyLimitReached', 'true');
    
    // Déclencher un événement pour informer les composants
    window.dispatchEvent(new CustomEvent('daily:limit:reached', {
      detail: { 
        subscription,
        dailyLimit,
        currentGains: currentDailyGains
      }
    }));
    
    return {
      allowed: false,
      adjustedGain: 0
    };
  }
  
  // Vérification secondaire: si le gain potentiel ferait dépasser la limite
  if (currentDailyGains + potentialGain > dailyLimit * 0.975) {
    // Calculer combien on peut encore ajouter sans dépasser 97.5% de la limite
    const remainingAllowance = Math.max(0, (dailyLimit * 0.975) - currentDailyGains);
    
    // Si on ne peut plus rien gagner
    if (remainingAllowance <= 0) {
      console.log(`[LIMIT REACHED] No more gains allowed: daily limit almost reached`);
      localStorage.setItem('dailyLimitReached', 'true');
      return {
        allowed: false,
        adjustedGain: 0
      };
    }
    
    // Autoriser un gain partiel plafonné à 95% de la limite
    const adjustedGain = Math.min(remainingAllowance, potentialGain);
    console.log(`[LIMIT ADJUSTED] Gain adjusted from ${potentialGain.toFixed(2)}€ to ${adjustedGain.toFixed(2)}€ to respect limit`);
    
    // Si on approche de la limite, déclencher un avertissement
    if ((currentDailyGains + adjustedGain) / dailyLimit > 0.85) {
      window.dispatchEvent(new CustomEvent('daily:limit:warning', {
        detail: { 
          subscription,
          dailyLimit,
          currentGains: currentDailyGains + adjustedGain,
          percentage: ((currentDailyGains + adjustedGain) / dailyLimit) * 100
        }
      }));
    }
    
    return {
      allowed: true,
      adjustedGain: parseFloat(adjustedGain.toFixed(3))
    };
  }
  
  // Le gain potentiel est dans les limites, l'autoriser
  console.log(`[LIMIT OK] Gain authorized: ${potentialGain.toFixed(2)}€ (total will be ${(currentDailyGains + potentialGain).toFixed(2)}€/${dailyLimit}€)`);
  
  // Si on approche de la limite, déclencher un avertissement
  if ((currentDailyGains + potentialGain) / dailyLimit > 0.75) {
    window.dispatchEvent(new CustomEvent('daily:limit:warning', {
      detail: { 
        subscription,
        dailyLimit,
        currentGains: currentDailyGains + potentialGain,
        percentage: ((currentDailyGains + potentialGain) / dailyLimit) * 100
      }
    }));
  }
  
  return {
    allowed: true,
    adjustedGain: potentialGain
  };
};

// Fonction pour vérifier si les compteurs quotidiens doivent être réinitialisés
export const shouldResetDailyCounters = (): boolean => {
  const now = new Date();
  const lastResetTimeStr = localStorage.getItem('lastResetTime');
  
  if (!lastResetTimeStr) {
    // Première initialisation
    localStorage.setItem('lastResetTime', now.toISOString());
    return true;
  }
  
  const lastResetTime = new Date(lastResetTimeStr);
  
  // Vérifier si c'est un nouveau jour
  if (now.getDate() !== lastResetTime.getDate() || 
      now.getMonth() !== lastResetTime.getMonth() ||
      now.getFullYear() !== lastResetTime.getFullYear()) {
    
    // C'est un nouveau jour, mettre à jour le moment de la dernière réinitialisation
    localStorage.setItem('lastResetTime', now.toISOString());
    
    // Réinitialiser tous les compteurs quotidiens
    localStorage.removeItem('freemium_daily_limit_reached');
    localStorage.removeItem('last_session_date');
    localStorage.removeItem('dailyLimitReached');
    localStorage.removeItem('dailyGains');
    
    console.log("[DAILY RESET] New day detected, resetting all daily limits");
    
    // Informer les composants de la réinitialisation
    window.dispatchEvent(new CustomEvent('daily:counters:reset', {
      detail: { timestamp: now.getTime() }
    }));
    
    return true;
  }
  
  return false;
};

// Fonction pour vérifier si une session manuelle peut être démarrée
export const canStartManualSession = (
  subscription: string,
  dailySessionCount: number,
  currentDailyGains: number
): SessionCheckResult => {
  // Vérification spéciale pour les comptes freemium (STRICTEMENT 1 session par jour)
  if (subscription === 'freemium') {
    const limitReached = localStorage.getItem('freemium_daily_limit_reached');
    const lastSessionDate = localStorage.getItem('last_session_date');
    const today = new Date().toDateString();
    
    if (lastSessionDate === today && (limitReached === 'true' || dailySessionCount >= 1)) {
      return {
        canStart: false,
        reason: `Limite quotidienne atteinte pour compte freemium (${dailySessionCount}/1)`
      };
    }
  }
  
  // Vérifier la limite de sessions selon l'abonnement
  let maxSessions = 1;  // Par défaut pour freemium
  
  if (subscription === 'starter') {
    maxSessions = 10;
  } else if (subscription === 'gold') {
    maxSessions = 30;
  } else if (subscription === 'elite') {
    maxSessions = 60;
  }
  
  // Vérifier si la limite de sessions quotidiennes est atteinte
  if (dailySessionCount >= maxSessions) {
    return {
      canStart: false,
      reason: `Limite de sessions quotidiennes atteinte (${dailySessionCount}/${maxSessions})`
    };
  }
  
  // Vérifier la limite de gains quotidiens (avec seuil de sécurité à 90%)
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  if (currentDailyGains >= dailyLimit * 0.9) {
    return {
      canStart: false,
      reason: `Limite de gains quotidiens presque atteinte (${currentDailyGains.toFixed(2)}€/${dailyLimit}€)`
    };
  }
  
  // Vérifier si la limite quotidienne a déjà été marquée comme atteinte
  const dailyLimitReached = localStorage.getItem('dailyLimitReached');
  if (dailyLimitReached === 'true') {
    return {
      canStart: false,
      reason: `Limite quotidienne précédemment atteinte pour aujourd'hui`
    };
  }
  
  return {
    canStart: true
  };
};

// Fonction pour vérifier de manière stricte si la limite est dépassée
export const isStrictlyOverLimit = (
  subscription: string,
  currentDailyGains: number
): boolean => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return currentDailyGains >= dailyLimit;
};

// Fonction pour calculer le pourcentage d'utilisation de la limite
export const calculateLimitPercentage = (
  subscription: string,
  currentDailyGains: number
): number => {
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  return Math.min(100, (currentDailyGains / dailyLimit) * 100);
};
