
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { calculateAutoSessionGain } from '@/utils/subscription/sessionGain';
import balanceManager from '@/utils/balance/balanceManager';

interface AutomaticRevenueProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useAutomaticRevenue = ({
  userData,
  updateBalance
}: AutomaticRevenueProps) => {
  const [isBotActive, setIsBotActive] = useState(() => {
    // Récupérer l'état précédent ou activer par défaut
    return localStorage.getItem('bot_active') !== 'false';
  });
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const [todaysGains, setTodaysGains] = useState(0);
  
  // Détermine si l'utilisateur est nouveau
  const isNewUser = !userData?.balance || userData.balance <= 0;
  
  // Compteur de jours consécutifs
  const [consecutiveVisitDays, setConsecutiveVisitDays] = useState(() => {
    return parseInt(localStorage.getItem('consecutive_visit_days') || '1', 10);
  });
  
  // Référence pour éviter les gains trop fréquents
  const lastGainTimeRef = useRef(Date.now() - 60000); // Commencer avec un décalage pour permettre un gain initial immédiat
  const minTimeBetweenGains = 10000; // 10 secondes minimum entre deux gains
  
  // Référence pour les valeurs persistantes entre rendus
  const dataRef = useRef({
    balanceHistory: [] as {amount: number, timestamp: number}[],
    lastDayProcessed: localStorage.getItem('last_day_processed') || '',
    dailyIncrement: parseFloat(localStorage.getItem('daily_progress_increment') || '0.05')
  });
  
  // Traiter la progression journalière au chargement du composant
  useEffect(() => {
    const processDailyProgress = () => {
      const today = new Date().toDateString();
      
      if (today !== dataRef.current.lastDayProcessed) {
        const previousVisitDay = dataRef.current.lastDayProcessed 
          ? new Date(dataRef.current.lastDayProcessed) 
          : new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Calculer le nombre de jours écoulés
        const daysDifference = Math.floor(
          (new Date(today).getTime() - previousVisitDay.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDifference > 0) {
          // Incrémenter les jours consécutifs
          const newConsecutiveDays = Math.min(30, consecutiveVisitDays + 1);
          setConsecutiveVisitDays(newConsecutiveDays);
          localStorage.setItem('consecutive_visit_days', newConsecutiveDays.toString());
          
          // Augmenter l'incrément quotidien (0.01€ supplémentaire par jour, plafonné à 0.25€)
          const baseIncrement = 0.05;
          const loyaltyBonus = Math.min(0.20, (newConsecutiveDays - 1) * 0.01);
          const newDailyIncrement = baseIncrement + loyaltyBonus;
          
          dataRef.current.dailyIncrement = newDailyIncrement;
          localStorage.setItem('daily_progress_increment', newDailyIncrement.toString());
          
          // Si nous avons manqué plusieurs jours, appliquer une progression
          const catchupAmount = Math.min(daysDifference, 3) * newDailyIncrement;
          
          if (catchupAmount > 0 && userData?.balance && !isNewUser) {
            console.log(`Progression automatique de ${catchupAmount.toFixed(2)}€ après ${daysDifference} jours`);
            
            // Simuler une évolution du solde même pendant l'absence
            setTimeout(() => {
              balanceManager.updateBalance(catchupAmount);
              
              // Déclencher un événement pour montrer la progression
              window.dispatchEvent(new CustomEvent('balance:daily-growth', { 
                detail: { 
                  amount: catchupAmount, 
                  daysMissed: daysDifference,
                  consecutiveVisitDays: newConsecutiveDays
                }
              }));

              // Ajouter une transaction pour cette progression automatique
              const report = `Progression automatique de ${daysDifference} jour(s)`;
              updateBalance(catchupAmount, report, true);
            }, 3000);
          }
        }
        
        // Enregistrer la date du jour
        dataRef.current.lastDayProcessed = today;
        localStorage.setItem('last_day_processed', today);
      }
    };
    
    if (!isNewUser) {
      processDailyProgress();
    }
  }, [userData?.balance, isNewUser, consecutiveVisitDays, updateBalance]);
  
  // Calcul du pourcentage de la limite atteinte
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculer les gains quotidiens à partir des transactions du jour
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const todaysTransactions = userData.transactions.filter(tx => 
      tx.date && tx.date.startsWith(today) && (tx.gain || 0) > 0
    );
    const dailyGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
    setTodaysGains(dailyGains);
    
    // Calculer le pourcentage de la limite quotidienne
    const percentage = Math.min(100, (dailyGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // Si le pourcentage atteint 100%, désactiver le bot automatiquement
    if (percentage >= 100 && isBotActive) {
      setIsBotActive(false);
      localStorage.setItem('bot_active', 'false');
      console.log("Désactivation automatique du bot : limite quotidienne atteinte");
    }
  }, [userData, isBotActive, isNewUser]);
  
  // Écouter les événements externes qui modifient l'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`Mise à jour de l'état du bot dans useAutomaticRevenue: ${isActive ? 'actif' : 'inactif'}`);
        setIsBotActive(isActive);
        localStorage.setItem('bot_active', isActive.toString());
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, []);
  
  // Activer le bot par défaut au chargement initial
  useEffect(() => {
    if (localStorage.getItem('bot_active') === null) {
      // Si c'est la première fois, activer le bot
      setIsBotActive(true);
      localStorage.setItem('bot_active', 'true');
      console.log("Bot activé automatiquement au chargement initial");
      
      // Déclencher une première génération de revenus après 10 secondes
      setTimeout(() => {
        generateAutomaticRevenue(true);
      }, 10000);
    }
  }, []);
  
  // Fonction de génération de revenus automatiques
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || isNewUser || (!isBotActive && !forceUpdate)) {
      return false;
    }
    
    const now = Date.now();
    // Vérifier le temps écoulé depuis le dernier gain
    if (!forceUpdate && now - lastGainTimeRef.current < minTimeBetweenGains) {
      console.log("Throttling automatic revenue generation - too frequent");
      return false;
    }
    
    try {
      // Utiliser la fonction de calcul de gain pour les sessions automatiques
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const gain = calculateAutoSessionGain(effectiveSub, todaysGains, userData.referrals?.length || 0);
      
      // Appliquer une bonification basée sur les jours consécutifs (jusqu'à +30%)
      const loyaltyMultiplier = 1 + Math.min(0.3, (consecutiveVisitDays - 1) * 0.01);
      const finalGain = parseFloat((gain * loyaltyMultiplier).toFixed(2));
      
      if (finalGain <= 0) {
        console.log("Limite quotidienne atteinte, gain nul");
        return false;
      }
      
      // Créer un rapport pour la transaction
      const report = `Analyse automatique de contenu (jour ${consecutiveVisitDays})`;
      
      // Mettre à jour le solde avec le gain généré
      await updateBalance(finalGain, report, forceUpdate);
      lastGainTimeRef.current = now;
      
      console.log(`Revenu automatique généré: ${finalGain}€ (multiplicateur de fidélité: ${loyaltyMultiplier.toFixed(2)})`);
      
      // Enregistrer la progression pour persistance
      dataRef.current.balanceHistory.push({
        amount: finalGain,
        timestamp: now
      });
      
      // Limiter l'historique à 50 entrées
      if (dataRef.current.balanceHistory.length > 50) {
        dataRef.current.balanceHistory.shift();
      }
      
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('automatic:revenue', { 
        detail: { 
          gain: finalGain, 
          timestamp: now
        }
      }));
      
      // Rafraîchir également l'affichage des transactions
      window.dispatchEvent(new CustomEvent('transactions:refresh', { 
        detail: { 
          timestamp: now 
        }
      }));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération de revenus automatiques:", error);
      return false;
    }
  }, [userData, isNewUser, isBotActive, updateBalance, todaysGains, consecutiveVisitDays]);
  
  return {
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue,
    todaysGains,
    consecutiveVisitDays,
    dailyIncrement: dataRef.current.dailyIncrement
  };
};

export default useAutomaticRevenue;
