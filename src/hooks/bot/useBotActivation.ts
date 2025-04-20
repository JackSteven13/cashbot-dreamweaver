
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

export const useBotActivation = () => {
  const { user } = useAuth();
  // TOUJOURS ACTIF - Sans condition
  const [isBotActive, setIsBotActive] = useState(true);
  const activationRef = useRef(true);
  
  // Activer le bot au montage
  useEffect(() => {
    if (user?.id) {
      // Forcer l'activation sans condition
      activationRef.current = true;
      setIsBotActive(true);
      localStorage.setItem(`botActive_${user.id}`, 'true');
      
      // Notifier que le bot est actif
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: true, userId: user.id }
      }));
      
      console.log("Bot activé automatiquement au démarrage");
      
      // Notification pour confirmer l'activation
      setTimeout(() => {
        toast({
          title: "Assistant d'analyse activé",
          description: "Votre assistant d'analyse est maintenant actif et génère des revenus automatiquement.",
          duration: 5000
        });
      }, 2000);
    }
  }, [user?.id]);
  
  // Intercepter toutes les tentatives de désactivation
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const { active, userId } = event.detail;
      
      // Ignorer toutes les tentatives de désactivation
      if (event.detail && typeof active === 'boolean') {
        if (active === false) {
          console.log("Ignorer la tentative de désactivation du bot");
          
          // Réactiver après un court délai
          setTimeout(() => {
            setIsBotActive(true);
            activationRef.current = true;
            
            if (user?.id) {
              localStorage.setItem(`botActive_${user?.id}`, 'true');
            }
            
            window.dispatchEvent(new CustomEvent('bot:status-change', {
              detail: { active: true, userId: userId || user?.id }
            }));
            
            console.log("Bot réactivé automatiquement");
          }, 500);
        } else {
          // Renforcer l'activation
          setIsBotActive(true);
          activationRef.current = true;
        }
      }
    };
    
    const handleUserDataLoaded = (event: CustomEvent) => {
      // Toujours activer le bot quand les données utilisateur sont chargées
      setIsBotActive(true);
      activationRef.current = true;
      
      if (user?.id) {
        localStorage.setItem(`botActive_${user.id}`, 'true');
      }
      
      console.log("Bot activé après chargement des données utilisateur");
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('bot:status-change', handleBotStatusChange as EventListener);
    window.addEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
    
    // Vérification périodique pour s'assurer que le bot reste actif
    const keepAliveInterval = setInterval(() => {
      if (!activationRef.current) {
        setIsBotActive(true);
        activationRef.current = true;
        
        if (user?.id) {
          localStorage.setItem(`botActive_${user.id}`, 'true');
        }
        
        console.log("Bot réactivé par le keepAlive");
      }
    }, 10000);
    
    return () => {
      window.removeEventListener('bot:status-change', handleBotStatusChange as EventListener);
      window.removeEventListener('user:data-loaded', handleUserDataLoaded as EventListener);
      clearInterval(keepAliveInterval);
    };
  }, [user?.id]);
  
  // Toujours retourner que le bot est actif
  return { 
    isBotActive: true,
    setIsBotActive: () => {
      // Ignorer toute tentative de désactivation
      setIsBotActive(true);
      activationRef.current = true;
      
      if (user?.id) {
        localStorage.setItem(`botActive_${user.id}`, 'true');
      }
    }
  };
};

export default useBotActivation;
