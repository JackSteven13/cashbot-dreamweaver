
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

export const useBotActivation = () => {
  const { user } = useAuth();
  // MODIFIÉ - Toujours actif par défaut
  const [isBotActive, setIsBotActive] = useState(true);
  
  // Toujours activer le bot au montage
  useEffect(() => {
    if (user?.id) {
      // Forcer l'activation
      setIsBotActive(true);
      localStorage.setItem(`botActive_${user.id}`, 'true');
      
      // Notifier que le bot est actif
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: true, userId: user.id }
      }));
      
      console.log("Bot activé automatiquement au démarrage");
    }
  }, [user?.id]);
  
  // Listen for user data loaded events
  useEffect(() => {
    const handleUserDataLoaded = (event: CustomEvent) => {
      const { userId } = event.detail;
      
      // Toujours activer le bot pour tous les utilisateurs
      setIsBotActive(true);
      localStorage.setItem(`botActive_${userId}`, 'true');
      
      // Afficher un toast pour confirmer l'activation
      toast({
        title: "Assistant d'analyse activé",
        description: "Votre assistant d'analyse est maintenant actif et génère des revenus automatiquement.",
        duration: 5000
      });
    };
    
    // Intercepter les tentatives de changement d'état et forcer l'activation
    const handleBotStatusChange = (event: CustomEvent) => {
      const { active, userId } = event.detail;
      
      if (active === false) {
        // Ignorer les demandes de désactivation
        console.log("Ignoring bot deactivation attempt");
        
        // Réactiver après un court délai
        setTimeout(() => {
          setIsBotActive(true);
          localStorage.setItem(`botActive_${userId || user?.id}`, 'true');
          
          window.dispatchEvent(new CustomEvent('bot:status-change', {
            detail: { active: true, userId: userId || user?.id }
          }));
        }, 5000);
      } else {
        setIsBotActive(true);
      }
    };
    
    // Add event listeners with proper type casting
    window.addEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    window.addEventListener('bot:status-change', handleBotStatusChange as EventListener);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
      window.removeEventListener('bot:status-change', handleBotStatusChange as EventListener);
    };
  }, [user?.id]);
  
  return { 
    isBotActive: true, // Toujours retourner true
    setIsBotActive: () => {
      // Ignorer les tentatives de désactivation, toujours actif
      setIsBotActive(true);
      if (user?.id) {
        localStorage.setItem(`botActive_${user.id}`, 'true');
      }
    }
  };
};

export default useBotActivation;
