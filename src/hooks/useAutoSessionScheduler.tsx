
import { useRef, useEffect } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getDailyGains } from '@/hooks/stats/utils/storageManager';
import balanceManager from '@/utils/balance/balanceManager';

/**
 * Hook for scheduling automatic sessions with improved persistence
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

  // Calcul des gains pour les jours d'absence
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
          // Réinitialiser si la chaîne est brisée
          consecutiveVisitDays = 1;
        }
        
        // Enregistrer les nouvelles valeurs
        localStorage.setItem('last_visit_date', currentDate);
        localStorage.setItem('consecutive_visit_days', consecutiveVisitDays.toString());
        
        // Si au moins un jour s'est écoulé et que la limite n'est pas atteinte, calculer les gains pour l'absence
        if (daysDifference > 0) {
          // Déterminer la limite quotidienne
          const subscription = userData.subscription || 'freemium';
          const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
          
          // Gains actuels - IMPORTANT: ne jamais dépasser la limite
          const currentGains = balanceManager.getDailyGains();
          
          // Ne pas calculer de progression si la limite est déjà atteinte
          if (currentGains >= dailyLimit * 0.9) {
            console.log(`Limite presque atteinte (${currentGains}€/${dailyLimit}€), pas de progression pour l'absence`);
            return;
          }
          
          // Calculer un montant raisonnable par jour d'absence (limité à max 3 jours pour éviter les abus)
          const daysToCount = Math.min(daysDifference, 3);
          
          // Pour freemium, gain maximum de 50% de la limite par jour d'absence
          // Pour les autres abonnements, gain maximum de 20% de la limite par jour d'absence
          const dailyAbsenceMultiplier = subscription === 'freemium' ? 0.25 : 0.15;
          
          // Calculer le gain total avec une variabilité aléatoire
          let totalAbsenceGain = 0;
          for (let i = 0; i < daysToCount; i++) {
            // Ajouter une variabilité aléatoire (80-100% de la valeur cible)
            const dailyVariability = 0.8 + (Math.random() * 0.2);
            // Réduire progressivement les gains pour les jours plus éloignés
            const dayFactor = 1 - (i * 0.2);
            
            const dailyAbsenceGain = dailyLimit * dailyAbsenceMultiplier * dailyVariability * dayFactor;
            totalAbsenceGain += dailyAbsenceGain;
          }
          
          // Vérifier que le gain ne dépasse pas 75% de la limite quotidienne
          const maxAbsenceGain = dailyLimit * 0.75;
          totalAbsenceGain = Math.min(totalAbsenceGain, maxAbsenceGain);
          
          // S'assurer que le total (currentGains + totalAbsenceGain) ne dépasse pas 90% de la limite
          const remainingLimit = (dailyLimit * 0.9) - currentGains;
          totalAbsenceGain = Math.min(totalAbsenceGain, remainingLimit);
          
          // Arrondir à 2 décimales
          totalAbsenceGain = parseFloat(totalAbsenceGain.toFixed(2));
          
          if (totalAbsenceGain > 0) {
            console.log(`Gains pour ${daysToCount} jour(s) d'absence: ${totalAbsenceGain}€`);
            
            // Déclencher l'événement pour afficher la notification de progression
            window.dispatchEvent(new CustomEvent('balance:daily-growth', {
              detail: {
                amount: totalAbsenceGain,
                daysMissed: daysDifference,
                consecutiveVisitDays: consecutiveVisitDays
              }
            }));
            
            // Ne pas appliquer les gains automatiquement, juste notifier l'utilisateur
            persistentDataRef.current.lastCheckedGains = totalAbsenceGain;
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
    
  }, [userData]);

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

  return null; // Ce hook ne renvoie rien, il agit uniquement par effets de bord
};

export default useAutoSessionScheduler;
