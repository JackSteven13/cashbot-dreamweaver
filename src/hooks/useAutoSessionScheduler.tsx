
import { useRef, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook for scheduling automatic sessions with improved persistence
 */
export const useAutoSessionScheduler = (
  todaysGainsRef: React.MutableRefObject<number>,
  generateAutomaticRevenue: (isFirst?: boolean) => Promise<void>,
  userData: any,
  isBotActive: boolean
) => {
  // Utiliser des références pour la stabilité entre les rendus
  const scheduleDataRef = useRef({
    primaryInterval: null as NodeJS.Timeout | null,
    secondaryInterval: null as NodeJS.Timeout | null,
    randomInterval: null as NodeJS.Timeout | null,
    lastSessionTime: Date.now(),
    sessionCount: 0,
    persistentSessionsEnabled: true,
    currentSubscription: userData?.subscription || 'freemium'
  });

  // Configuration du planificateur selon le niveau d'abonnement
  useEffect(() => {
    if (!generateAutomaticRevenue) return;
    
    // Nettoyer tous les intervalles existants
    if (scheduleDataRef.current.primaryInterval) {
      clearInterval(scheduleDataRef.current.primaryInterval);
    }
    if (scheduleDataRef.current.secondaryInterval) {
      clearInterval(scheduleDataRef.current.secondaryInterval);
    }
    if (scheduleDataRef.current.randomInterval) {
      clearInterval(scheduleDataRef.current.randomInterval);
    }
    
    // Charger l'état de persistance
    const persistentSessionsEnabled = localStorage.getItem('persistent_sessions_enabled') !== 'false';
    scheduleDataRef.current.persistentSessionsEnabled = persistentSessionsEnabled;
    
    // Mettre à jour le type d'abonnement
    scheduleDataRef.current.currentSubscription = userData?.subscription || 'freemium';
    
    // Ne pas démarrer de nouvelles sessions si le bot est inactif
    if (!isBotActive) return;

    // Configuration adaptée au type d'abonnement
    const getIntervalForSubscription = () => {
      const sub = scheduleDataRef.current.currentSubscription;
      switch (sub) {
        case 'pro':
        case 'ultimate':
          return { min: 25000, max: 45000 }; // 25-45 secondes
        case 'premium':
          return { min: 35000, max: 65000 }; // 35-65 secondes
        case 'basic':
          return { min: 45000, max: 75000 }; // 45-75 secondes
        case 'freemium':
        default:
          return { min: 60000, max: 120000 }; // 60-120 secondes
      }
    };
    
    const { min, max } = getIntervalForSubscription();
    
    // Intervalle principal - génération régulière
    scheduleDataRef.current.primaryInterval = setInterval(() => {
      const now = Date.now();
      
      // Vérifier le temps écoulé depuis la dernière session pour éviter le spam
      const timeSinceLastSession = now - scheduleDataRef.current.lastSessionTime;
      if (timeSinceLastSession < min * 0.8) {
        console.log("Session generation throttled - too soon");
        return;
      }
      
      if (isBotActive && scheduleDataRef.current.persistentSessionsEnabled) {
        scheduleDataRef.current.lastSessionTime = now;
        scheduleDataRef.current.sessionCount++;
        
        // Générer une nouvelle session avec progression
        generateAutomaticRevenue(false);
      }
    }, min + Math.random() * (max - min));
    
    // Intervalle secondaire - récupération après inactivité
    scheduleDataRef.current.secondaryInterval = setInterval(() => {
      // Vérifier si nous avons manqué des sessions pendant l'inactivité de la page
      if (isBotActive && scheduleDataRef.current.persistentSessionsEnabled) {
        const now = Date.now();
        const timeSinceLastSession = now - scheduleDataRef.current.lastSessionTime;
        
        // Si plus de 3 minutes sans session, rattraper une session manquée
        if (timeSinceLastSession > 3 * 60 * 1000) {
          console.log("Recovering missed session after inactivity");
          scheduleDataRef.current.lastSessionTime = now;
          scheduleDataRef.current.sessionCount++;
          
          // Session de récupération
          generateAutomaticRevenue(false);
        }
      }
    }, 60000); // Vérifier chaque minute
    
    // Sessions aléatoires - pour plus de variabilité
    scheduleDataRef.current.randomInterval = setInterval(() => {
      // 25% de chance de générer une session aléatoire supplémentaire
      if (isBotActive && scheduleDataRef.current.persistentSessionsEnabled && Math.random() < 0.25) {
        const now = Date.now();
        
        // Vérifier le temps écoulé pour éviter le spam
        const timeSinceLastSession = now - scheduleDataRef.current.lastSessionTime;
        if (timeSinceLastSession < min * 0.6) {
          return;
        }
        
        scheduleDataRef.current.lastSessionTime = now;
        scheduleDataRef.current.sessionCount++;
        
        // Session aléatoire bonus
        console.log("Random bonus session triggered");
        generateAutomaticRevenue(false);
      }
    }, 90000 + Math.random() * 60000); // Entre 1.5 et 2.5 minutes
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (scheduleDataRef.current.primaryInterval) {
        clearInterval(scheduleDataRef.current.primaryInterval);
      }
      if (scheduleDataRef.current.secondaryInterval) {
        clearInterval(scheduleDataRef.current.secondaryInterval);
      }
      if (scheduleDataRef.current.randomInterval) {
        clearInterval(scheduleDataRef.current.randomInterval);
      }
    };
  }, [generateAutomaticRevenue, isBotActive, userData?.subscription]);
  
  // Gérer les changements de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // À la réactivation de la page, vérifier si nous devons générer une session
        const now = Date.now();
        const timeSinceLastSession = now - scheduleDataRef.current.lastSessionTime;
        
        // Si plus de 2 minutes sans session et que le bot est actif
        if (timeSinceLastSession > 2 * 60 * 1000 && isBotActive && scheduleDataRef.current.persistentSessionsEnabled) {
          console.log("Generating catch-up session on page visibility");
          scheduleDataRef.current.lastSessionTime = now;
          scheduleDataRef.current.sessionCount++;
          
          // Session de rattrapage
          generateAutomaticRevenue(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [generateAutomaticRevenue, isBotActive]);
  
  // Écouter les changements dans les limites ou les paramètres de l'utilisateur
  useEffect(() => {
    const checkGainLimits = () => {
      const subscription = userData?.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Vérifier si nous avons dépassé les limites quotidiennes
      if (todaysGainsRef.current >= dailyLimit) {
        // Désactiver temporairement les sessions automatiques
        scheduleDataRef.current.persistentSessionsEnabled = false;
      } else {
        // Réactiver les sessions automatiques
        scheduleDataRef.current.persistentSessionsEnabled = true;
      }
      
      // Persister l'état
      localStorage.setItem('persistent_sessions_enabled', scheduleDataRef.current.persistentSessionsEnabled.toString());
    };
    
    // Vérification périodique des limites
    const limitsInterval = setInterval(checkGainLimits, 30000);
    
    // Vérification initiale
    checkGainLimits();
    
    return () => {
      clearInterval(limitsInterval);
    };
  }, [todaysGainsRef, userData]);
  
  return {
    sessionCount: scheduleDataRef.current.sessionCount,
    lastSessionTime: scheduleDataRef.current.lastSessionTime,
    persistentSessionsEnabled: scheduleDataRef.current.persistentSessionsEnabled,
    enablePersistentSessions: () => {
      scheduleDataRef.current.persistentSessionsEnabled = true;
      localStorage.setItem('persistent_sessions_enabled', 'true');
    },
    disablePersistentSessions: () => {
      scheduleDataRef.current.persistentSessionsEnabled = false;
      localStorage.setItem('persistent_sessions_enabled', 'false');
    }
  };
};

export default useAutoSessionScheduler;
