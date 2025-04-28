
import { FC, useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { useAuth } from '@/hooks/useAuth';

const DailyLimitEnforcer: FC = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const checkLimits = () => {
      const userId = user.id;
      const subscription = localStorage.getItem(`subscription_${userId}`) || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Récupérer les gains quotidiens
      const dailyGains = balanceManager.getDailyGains();
      
      // Si la limite est atteinte, désactiver le bot
      if (dailyGains >= dailyLimit * 0.95) {
        console.log(`Limite quotidienne presque atteinte: ${dailyGains.toFixed(2)}€/${dailyLimit}€`);
        
        // Désactiver le bot automatique
        window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
          detail: { active: false, reason: 'limit_reached' } 
        }));
        
        // Marquer la limite comme atteinte dans localStorage
        localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
        localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
        
        // Informer tous les composants que la limite est atteinte
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription: subscription,
            limit: dailyLimit,
            currentGains: dailyGains,
            userId: userId
          }
        }));
      }
    };
    
    // Vérifier toutes les 10 secondes
    const interval = setInterval(checkLimits, 10000);
    
    // Vérifier immédiatement au chargement
    checkLimits();
    
    return () => clearInterval(interval);
  }, [user]);

  return null;
};

export default DailyLimitEnforcer;
