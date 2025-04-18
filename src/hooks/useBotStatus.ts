
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

export const useBotStatus = () => {
  const [isBotActive, setIsBotActive] = useState(() => {
    // Vérifier le localStorage lors de l'initialisation
    const storedBotStatus = localStorage.getItem('bot_active');
    return storedBotStatus !== 'false'; // Par défaut actif si non défini
  });
  
  const [activityLevel, setActivityLevel] = useState(60);
  
  // Enregistrer l'état du bot dans localStorage lors des changements
  useEffect(() => {
    localStorage.setItem('bot_active', isBotActive ? 'true' : 'false');
    
    // Propager l'événement de changement d'état du bot
    window.dispatchEvent(new CustomEvent('bot:status-change', {
      detail: { active: isBotActive }
    }));
  }, [isBotActive]);
  
  // Écouter les événements de changement d'état du bot venant d'autres parties de l'application
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const { active, checkLimit, subscription, balance } = event.detail;
      
      // Si l'activation est demandée mais avec vérification de limite
      if (active && checkLimit && subscription) {
        // Vérifier si l'utilisateur a atteint sa limite quotidienne
        const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const dailyGains = localStorage.getItem('stats_daily_gains');
        const currentGains = dailyGains ? parseFloat(dailyGains) : 0;
        
        if (currentGains >= limit) {
          // La limite est atteinte, ne pas activer le bot
          toast({
            title: "Limite quotidienne atteinte",
            description: `Vous avez atteint votre limite quotidienne de ${limit.toFixed(2)}€. Le bot ne peut pas être activé aujourd'hui.`,
            variant: "destructive"
          });
          
          setIsBotActive(false);
          return;
        }
      }
      
      // Sinon, appliquer directement le changement demandé
      if (typeof active === 'boolean') {
        setIsBotActive(active);
      }
    };
    
    // Écouter les événements de force-status qui peuvent outrepasser d'autres considérations
    const handleBotForceStatus = (event: CustomEvent) => {
      const { active, reason } = event.detail;
      
      if (typeof active === 'boolean') {
        setIsBotActive(active);
        
        if (reason === 'limit_reached' && active === false) {
          // Ne pas afficher de toast car déjà géré ailleurs
        }
      }
    };
    
    // Écouter les événements d'activité pour ajuster le niveau d'activité
    const handleActivityEvent = (event: CustomEvent) => {
      const { level } = event.detail;
      
      if (level === 'high') {
        setActivityLevel(prev => Math.min(100, prev + 5));
      } else if (level === 'low') {
        setActivityLevel(prev => Math.max(20, prev - 3));
      } else {
        // Petites fluctuations aléatoires
        setActivityLevel(prev => {
          const change = Math.random() > 0.5 ? 2 : -2;
          return Math.max(20, Math.min(100, prev + change));
        });
      }
    };
    
    window.addEventListener('bot:external-status-change', handleBotStatusChange as EventListener);
    window.addEventListener('bot:force-status', handleBotForceStatus as EventListener);
    window.addEventListener('dashboard:activity', handleActivityEvent as EventListener);
    
    // S'assurer de nettoyer les écouteurs d'événements
    return () => {
      window.removeEventListener('bot:external-status-change', handleBotStatusChange as EventListener);
      window.removeEventListener('bot:force-status', handleBotForceStatus as EventListener);
      window.removeEventListener('dashboard:activity', handleActivityEvent as EventListener);
    };
  }, []);
  
  // Fonction pour activer le bot
  const activateBot = () => {
    setIsBotActive(true);
    toast({
      title: "Bot activé",
      description: "L'assistant d'analyse est maintenant actif et génère des revenus automatiquement.",
      duration: 3000
    });
  };
  
  // Fonction pour désactiver le bot
  const deactivateBot = () => {
    setIsBotActive(false);
    toast({
      title: "Bot désactivé",
      description: "L'assistant d'analyse est maintenant en pause.",
      duration: 3000
    });
  };
  
  return { 
    isBotActive, 
    activateBot, 
    deactivateBot,
    activityLevel
  };
};

export default useBotStatus;
