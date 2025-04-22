
import { useRef, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getDailyGains } from '@/hooks/stats/utils/storageManager';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook pour la gestion des sessions automatiques avec progression même hors ligne
 */
export const useAutoSessionScheduler = (
  todaysGainsRef: React.MutableRefObject<number>,
  generateAutomaticRevenue: (forceUpdate?: boolean) => Promise<boolean>,
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
    currentSubscription: userData?.subscription || 'freemium',
    lastSavedBalance: userData?.balance || 0
  });

  // Référence pour suivre les sessions entre les visites
  const persistentDataRef = useRef({
    lastVisitDate: localStorage.getItem('last_visit_date') || new Date().toDateString(),
    lastBalance: parseFloat(localStorage.getItem('last_known_balance') || '0'),
    consecutiveVisitDays: parseInt(localStorage.getItem('consecutive_visit_days') || '1'),
    lastCheckedGains: 0
  });

  // Calcul AMÉLIORÉ des gains pour les jours d'absence
  useEffect(() => {
    if (!userData) return;
    
    const currentDate = new Date().toDateString();
    const lastVisitDate = persistentDataRef.current.lastVisitDate;
    
    // Vérifier si c'est un nouveau jour
    if (lastVisitDate !== currentDate) {
      console.log(`Nouvelle visite: dernière visite le ${lastVisitDate}, aujourd'hui: ${currentDate}`);
      
      try {
        // Calculer le nombre de jours écoulés
        const lastDate = new Date(lastVisitDate);
        const today = new Date(currentDate);
        const daysDifference = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Vérifier si c'est une visite consécutive (max 1 jour d'écart)
        const isConsecutiveVisit = daysDifference <= 1;
        
        // Mettre à jour le compteur de visites consécutives
        let consecutiveVisitDays = persistentDataRef.current.consecutiveVisitDays;
        if (isConsecutiveVisit) {
          consecutiveVisitDays++;
        } else {
          // Réinitialiser si la chaîne est brisée, mais garder au moins 1
          consecutiveVisitDays = Math.max(1, consecutiveVisitDays - Math.floor(daysDifference / 2));
        }
        
        // Enregistrer les nouvelles valeurs
        localStorage.setItem('last_visit_date', currentDate);
        localStorage.setItem('consecutive_visit_days', consecutiveVisitDays.toString());
        
        // Si au moins un jour s'est écoulé, calculer les gains pour l'absence
        if (daysDifference > 0) {
          // Déterminer la limite quotidienne
          const subscription = userData.subscription || 'freemium';
          const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
          
          // On simule que le bot a travaillé pendant l'absence
          // Plus l'absence est longue, plus les gains sont importants (avec une limite)
          // Pour freemium, gain maximum de 40% de la limite par jour d'absence
          // Pour les autres abonnements, gain maximum de 25% de la limite par jour d'absence
          const dailyAbsenceMultiplier = subscription === 'freemium' ? 0.4 : 0.25;
          
          // Calculer le gain total avec une variabilité aléatoire pour chaque jour
          let totalAbsenceGain = 0;
          const daysToCount = Math.min(daysDifference, 7); // Limiter à 7 jours max
          
          for (let i = 0; i < daysToCount; i++) {
            // Ajouter une variabilité aléatoire (70-100% de la valeur cible)
            const dailyVariability = 0.7 + (Math.random() * 0.3);
            
            // Réduire légèrement le gain pour chaque jour supplémentaire
            const dayFactor = Math.max(0.7, 1 - (i * 0.05));
            
            const dailyAbsenceGain = dailyLimit * dailyAbsenceMultiplier * dailyVariability * dayFactor;
            
            // Arrondir à 2 décimales pour éviter des nombres trop précis
            const roundedGain = parseFloat(dailyAbsenceGain.toFixed(2));
            totalAbsenceGain += roundedGain;
            
            console.log(`Jour d'absence ${i+1}: gain simulé de ${roundedGain}€`);
          }
          
          // Appliquer les gains accumulés pendant l'absence
          if (totalAbsenceGain > 0) {
            console.log(`Gains totaux pour ${daysToCount} jour(s) d'absence: ${totalAbsenceGain.toFixed(2)}€`);
            
            // Générer des transactions et mettre à jour le solde pour les jours d'absence
            setTimeout(async () => {
              // Ajouter un léger délai avant d'afficher la notification
              toast({
                title: "Revenus accumulés pendant votre absence",
                description: `Votre assistant a généré ${totalAbsenceGain.toFixed(2)}€ pendant votre absence de ${daysDifference} jour(s).`,
                duration: 8000
              });
              
              // Déclencher la mise à jour du solde
              await generateAutomaticRevenue(true);
              
              // Déclencher l'événement pour afficher la notification de progression
              window.dispatchEvent(new CustomEvent('balance:offline-growth', {
                detail: {
                  amount: totalAbsenceGain,
                  daysMissed: daysDifference,
                  consecutiveVisitDays: consecutiveVisitDays
                }
              }));
              
              // Forcer une mise à jour du solde dans l'UI
              window.dispatchEvent(new CustomEvent('balance:force-update', {
                detail: {
                  newBalance: userData?.balance + totalAbsenceGain,
                  gain: totalAbsenceGain,
                  animate: true
                }
              }));
            }, 3000);
          }
        }
      } catch (error) {
        console.error("Erreur lors du calcul des gains d'absence:", error);
      }
    }
    
    // Sauvegarder l'état actuel pour la prochaine visite
    persistentDataRef.current.lastVisitDate = currentDate;
    persistentDataRef.current.lastBalance = userData.balance || 0;
    localStorage.setItem('last_known_balance', (userData.balance || 0).toString());
    
    // Mettre à jour le compteur de jours de visite consécutifs dans la référence
    persistentDataRef.current.consecutiveVisitDays = parseInt(localStorage.getItem('consecutive_visit_days') || '1');
    
  }, [userData, generateAutomaticRevenue]);

  // Fonction pour gérer les sessions automatiques
  useEffect(() => {
    if (!userData || !generateAutomaticRevenue) return;

    // Nettoyer les intervalles existants
    const cleanupIntervals = () => {
      const { primaryInterval, secondaryInterval, randomInterval } = scheduleDataRef.current;
      if (primaryInterval) clearInterval(primaryInterval);
      if (secondaryInterval) clearInterval(secondaryInterval);
      if (randomInterval) clearInterval(randomInterval);
    };

    // Définir un nouvel intervalle primaire pour les mises à jour régulières
    const primaryInterval = setInterval(async () => {
      if (document.visibilityState === 'visible' && isBotActive) {
        // Vérifier la limite quotidienne
        const subscription = userData.subscription || 'freemium';
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const currentGains = balanceManager.getDailyGains();
        
        // Ne générer des revenus que si on est loin de la limite (max 90%)
        if (currentGains < dailyLimit * 0.9) {
          console.log("Session auto-programmée (primaire) déclenchée");
          await generateAutomaticRevenue(false);
        } else {
          console.log(`Limite quotidienne presque atteinte: ${currentGains}€/${dailyLimit}€, pas de génération auto`);
        }
      }
    }, 180000 + Math.random() * 60000); // 3-4 minutes

    // Définir un intervalle secondaire pour les mises à jour moins fréquentes
    const secondaryInterval = setInterval(async () => {
      if (document.visibilityState === 'visible' && Math.random() < 0.4 && isBotActive) {
        // Vérifier la limite quotidienne
        const subscription = userData.subscription || 'freemium';
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        const currentGains = balanceManager.getDailyGains();
        
        // Ne générer des revenus que si on est loin de la limite (max 90%)
        if (currentGains < dailyLimit * 0.9) {
          console.log("Session auto-programmée (secondaire) déclenchée");
          await generateAutomaticRevenue(false);
        }
      }
    }, 500000 + Math.random() * 250000); // 8-12 minutes

    // Mettre à jour les références
    scheduleDataRef.current.primaryInterval = primaryInterval;
    scheduleDataRef.current.secondaryInterval = secondaryInterval;
    scheduleDataRef.current.currentSubscription = userData.subscription;

    // Écouteur pour détecter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleDataRef.current.persistentSessionsEnabled = true;
        console.log("Page visible, sessions automatiques activées");
      } else {
        scheduleDataRef.current.persistentSessionsEnabled = false;
        console.log("Page masquée, sessions automatiques suspendues");
      }
    };

    // Ajouter l'écouteur de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyage à la désinstallation
    return () => {
      cleanupIntervals();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userData, generateAutomaticRevenue, isBotActive]);

  return null;
};

export default useAutoSessionScheduler;
