
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addTransaction, calculateTodaysGains } from '@/utils/user/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';

interface UseAutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
  isNewUser?: boolean;
}

export const useAutomaticRevenue = ({
  userData, 
  updateBalance,
  isNewUser = false
}: UseAutomaticRevenueProps) => {
  const [isBotActive, setIsBotActive] = useState(false); // Désactivé par défaut pour plus de sécurité
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [lastGainAmount, setLastGainAmount] = useState(0);
  const [consecutiveGenerationCount, setConsecutiveGenerationCount] = useState(0);
  const userId = userData?.id || userData?.profile?.id || null;
  
  // Forcer la vérification quotidienne au démarrage
  useEffect(() => {
    const lastResetDate = localStorage.getItem('lastDailyReset');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      // Réinitialiser les gains quotidiens si c'est un nouveau jour
      console.log("Réinitialisation des gains quotidiens au démarrage - nouveau jour détecté");
      if (userId) {
        balanceManager.setUserId(userId);
        balanceManager.setDailyGains(0);
      }
      localStorage.setItem('lastDailyReset', today);
      
      // Réinitialiser aussi les flags de limite
      if (userId) {
        localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
        localStorage.removeItem(`daily_limit_reached_${userId}`);
      }
    }
    
    // Vérifier l'état du bot sauvegardé
    const savedBotState = localStorage.getItem('botActive');
    if (savedBotState === 'true') {
      setIsBotActive(true);
    } else {
      setIsBotActive(false);
    }
    
    // Double vérification des limites au démarrage
    if (userData?.id && !isNewUser) {
      // Assurer que le balanceManager utilise le bon ID
      balanceManager.setUserId(userData.id);
      
      // Vérifier la base de données pour obtenir les gains réels d'aujourd'hui
      const fetchAndSyncTransactions = async () => {
        try {
          const actualDailyGains = await calculateTodaysGains(userData.id);
          
          // Vérifier si les gains rapportés sont cohérents
          const currentGains = balanceManager.getDailyGains();
          
          if (Math.abs(actualDailyGains - currentGains) > 0.01) {
            console.log(`Correction des gains quotidiens: ${currentGains}€ -> ${actualDailyGains}€ (base de données)`);
            // Synchroniser avec la valeur de la base de données (source de vérité)
            balanceManager.syncDailyGainsFromTransactions(actualDailyGains);
          }
          
          // Vérifier si la limite est atteinte
          const effectiveSub = getEffectiveSubscription(userData.subscription);
          const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
          if (actualDailyGains >= dailyLimit * 0.99) {
            setLimitReached(true);
            setIsBotActive(false);
            localStorage.setItem('botActive', 'false');
            localStorage.setItem(`daily_limit_reached_${userData.id}`, 'true');
            
            // Notification à l'interface
            window.dispatchEvent(new CustomEvent('daily-limit:reached', {
              detail: {
                userId: userData.id,
                currentGains: actualDailyGains,
                limit: dailyLimit,
                source: 'startup_verification'
              }
            }));
          }
        } catch (err) {
          console.error("Erreur lors de la vérification des gains quotidiens:", err);
        }
      };
      
      fetchAndSyncTransactions();
    }
  }, [userData, isNewUser, userId]);
  
  // Calculate daily limit progress percentage
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    // Assurer que le balanceManager utilise le bon ID
    if (userId) {
      balanceManager.setUserId(userId);
    }
    
    // Stocker l'abonnement actuel dans localStorage pour que le balanceManager y ait accès
    if (userData.subscription) {
      localStorage.setItem('currentSubscription', userData.subscription);
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Get daily gains from centralized manager
    const dailyGains = balanceManager.getDailyGains();
    
    // Calculate percentage of daily limit
    const percentage = Math.min(100, (dailyGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // Check if limit is reached (85% of limit for early prevention - plus strict)
    const isLimitReached = dailyGains >= limit * 0.85;
    setLimitReached(isLimitReached);
    
    // If percentage reaches 85%, automatically deactivate bot
    if (isLimitReached && isBotActive) {
      setIsBotActive(false);
      console.log("Bot automatically deactivated: daily limit reached");
      
      // Enregistrer l'état dans le localStorage
      localStorage.setItem('botActive', 'false');
    }
    
    // Vérification supplémentaire via le gestionnaire de limite
    if (userId) {
      const limitReachedKey = `daily_limit_reached_${userId}`;
      const limitReachedInStorage = localStorage.getItem(limitReachedKey) === 'true';
      
      if (limitReachedInStorage && isBotActive) {
        setIsBotActive(false);
        localStorage.setItem('botActive', 'false');
        console.log("Bot deactivated: limit flag found in storage");
      }
    }
  }, [userData, effectiveSub, isBotActive, isNewUser, userId]);
  
  // Mettre en place un système de vérification périodique
  useEffect(() => {
    if (!userData || isNewUser || !userId) return;
    
    const checkLimits = async () => {
      try {
        // Récupérer les gains quotidiens depuis la base de données
        const actualGains = await calculateTodaysGains(userId);
        
        // Mettre à jour le balanceManager
        if (Math.abs(actualGains - balanceManager.getDailyGains()) > 0.01) {
          balanceManager.syncDailyGainsFromTransactions(actualGains);
        }
        
        // Vérifier si la limite est atteinte
        const effectiveSub = getEffectiveSubscription(userData.subscription);
        const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        
        // Si on approche de la limite (95%), désactiver le bot
        if (actualGains >= limit * 0.95 && isBotActive) {
          setIsBotActive(false);
          localStorage.setItem('botActive', 'false');
          
          // Déclencher l'événement
          window.dispatchEvent(new CustomEvent('daily-limit:approaching', {
            detail: {
              userId,
              currentGains: actualGains,
              limit,
              percentage: actualGains / limit
            }
          }));
        }
        
        // Si la limite est atteinte, marquer
        if (actualGains >= limit * 0.999) {
          setLimitReached(true);
          localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
          
          // Déclencher l'événement
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: {
              userId,
              currentGains: actualGains,
              limit,
              source: 'periodic_check'
            }
          }));
        }
      } catch (err) {
        console.error("Erreur lors de la vérification périodique des limites:", err);
      }
    };
    
    // Vérifier toutes les 30 secondes
    const intervalId = setInterval(checkLimits, 30000);
    
    // Nettoyage
    return () => clearInterval(intervalId);
  }, [userData, isNewUser, isBotActive, userId]);
  
  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    lastGainAmount,
    setLastGainAmount,
    consecutiveGenerationCount,
    setConsecutiveGenerationCount
  };
};

export default useAutomaticRevenue;
