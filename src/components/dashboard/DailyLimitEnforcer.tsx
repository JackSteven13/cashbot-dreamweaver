
import { FC, useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

const DailyLimitEnforcer: FC = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    // Fonction pour vérifier si nous devons réinitialiser les limites (nouveau jour)
    const checkForDayChange = () => {
      const userId = user.id;
      const lastSessionDate = localStorage.getItem(`last_session_date_${userId}`);
      const today = new Date().toDateString();
      
      // Si c'est un nouveau jour, réinitialiser toutes les limites
      if (lastSessionDate && lastSessionDate !== today) {
        console.log("Nouveau jour détecté! Réinitialisation des limites quotidiennes.");
        localStorage.removeItem(`daily_limit_reached_${userId}`);
        localStorage.removeItem(`freemium_daily_limit_reached_${userId}`);
        
        // Réinitialiser les gains quotidiens dans balanceManager
        balanceManager.resetDailyGains();
        
        // Réactiver le bot automatiquement pour le nouveau jour
        window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
          detail: { active: true, reason: 'new_day' } 
        }));
        
        // Mettre à jour la date de dernière session
        localStorage.setItem(`last_session_date_${userId}`, today);
      }
    };
    
    // Vérifier immédiatement pour la réinitialisation quotidienne
    checkForDayChange();
    
    const checkLimits = () => {
      const userId = user.id;
      const subscription = localStorage.getItem(`subscription_${userId}`) || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Récupérer les gains quotidiens
      const dailyGains = balanceManager.getDailyGains();
      
      // Vérifier si on approche de la limite (90%)
      if (dailyGains >= dailyLimit * 0.9 && dailyGains < dailyLimit) {
        console.log(`Limite quotidienne presque atteinte: ${dailyGains.toFixed(2)}€/${dailyLimit}€`);
        
        // Informer l'utilisateur qu'il approche de la limite
        toast({
          title: "Limite quotidienne proche",
          description: `Vous avez presque atteint votre limite quotidienne de ${dailyLimit}€`,
          duration: 5000,
        });
      }
      
      // Si la limite est atteinte, désactiver le bot
      if (dailyGains >= dailyLimit) {
        console.log(`Limite quotidienne atteinte: ${dailyGains.toFixed(2)}€/${dailyLimit}€`);
        
        // Désactiver le bot automatique
        window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
          detail: { active: false, reason: 'limit_reached' } 
        }));
        
        // Marquer la limite comme atteinte dans localStorage
        localStorage.setItem(`daily_limit_reached_${userId}`, 'true');
        localStorage.setItem(`last_session_date_${userId}`, new Date().toDateString());
        
        // Afficher une notification
        toast({
          title: "Limite quotidienne atteinte",
          description: `Vous avez atteint votre limite de ${dailyLimit}€ pour aujourd'hui.`,
          variant: "destructive",
          duration: 10000,
        });
        
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
    
    // Vérifier toutes les 15 secondes
    const interval = setInterval(checkLimits, 15000);
    
    // Vérifier immédiatement au chargement
    checkLimits();
    
    // Vérifier aussi le changement de jour toutes les minutes
    const dayChangeInterval = setInterval(checkForDayChange, 60000);
    
    // Écouter les événements de session terminée pour mettre à jour le solde
    const handleSessionCompleted = (event: CustomEvent) => {
      if (event.detail && event.detail.gain && event.detail.gain > 0) {
        console.log(`Session terminée, gain: ${event.detail.gain}€`);
        
        // Forcer une mise à jour du solde et de l'interface
        window.dispatchEvent(new CustomEvent('balance:update', {
          detail: {
            amount: event.detail.gain,
            animate: true,
            userId: userId,
            timestamp: Date.now()
          }
        }));
      }
    };
    
    window.addEventListener('session:completed', handleSessionCompleted as EventListener);
    
    return () => {
      clearInterval(interval);
      clearInterval(dayChangeInterval);
      window.removeEventListener('session:completed', handleSessionCompleted as EventListener);
    };
  }, [user]);

  return null;
};

export default DailyLimitEnforcer;
