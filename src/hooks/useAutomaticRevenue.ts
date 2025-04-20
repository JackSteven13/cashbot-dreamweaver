
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { calculateAutoSessionGain } from '@/utils/subscription/sessionGain';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';

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
  const lastGainTimeRef = useRef(Date.now() - 60000);
  const minTimeBetweenGains = 10000; // 10 secondes minimum entre deux gains
  
  // Référence pour les valeurs persistantes entre rendus
  const dataRef = useRef({
    balanceHistory: [] as {amount: number, timestamp: number}[],
    lastDayProcessed: localStorage.getItem('last_day_processed') || '',
    dailyIncrement: parseFloat(localStorage.getItem('daily_progress_increment') || '0.05')
  });

  // NOUVEAU - Forcer l'activation du bot
  useEffect(() => {
    if (!isBotActive) {
      console.log("Force activating bot");
      setIsBotActive(true);
      localStorage.setItem('bot_active', 'true');
      
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: true }
      }));
      
      // Afficher un toast pour informer l'utilisateur
      toast({
        title: "Bot activé",
        description: "Le bot d'analyse a été activé automatiquement.",
        duration: 3000
      });
    }
  }, [isBotActive]);

  // NOUVEAU - Générer un revenu immédiat au chargement
  useEffect(() => {
    // Déclencher une génération de revenus après 2 secondes
    const timer = setTimeout(() => {
      if (!isNewUser) {
        console.log("Generating immediate revenue on load");
        generateAutomaticRevenue(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // MODIFIÉ - Générer des revenus plus fréquemment - toutes les 15-30 secondes
  useEffect(() => {
    if (isBotActive && userData && !isNewUser) {
      console.log("Setting up frequent revenue generation");
      
      // Intervalle court pour les générations fréquentes
      const frequentInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastGainTimeRef.current > 15000) { // 15 secondes minimum
          console.log("Generating automatic revenue from frequent interval");
          generateAutomaticRevenue();
        }
      }, 15000 + Math.floor(Math.random() * 15000)); // 15-30 secondes
      
      return () => clearInterval(frequentInterval);
    }
  }, [isBotActive, userData, isNewUser]);
  
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
    const todaysTransactions = userData.transactions?.filter(tx => 
      tx.date && tx.date.startsWith(today) && (tx.gain || 0) > 0
    ) || [];
    
    const dailyGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
    setTodaysGains(dailyGains);
    
    // Calculer le pourcentage de la limite quotidienne
    const percentage = Math.min(100, (dailyGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // MODIFIÉ - Ne pas désactiver le bot quand la limite est atteinte
    // Permettre de continuer à générer des revenus même si la limite est atteinte
    if (percentage >= 100 && isBotActive) {
      console.log("Limite quotidienne atteinte, mais le bot reste actif");
      // Notification mais pas de désactivation
      toast({
        title: "Limite quotidienne atteinte",
        description: "Vous continuez à générer des revenus à vitesse réduite.",
        duration: 5000
      });
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
    // Force activer le bot dans tous les cas
    setIsBotActive(true);
    localStorage.setItem('bot_active', 'true');
    console.log("Bot activé automatiquement au chargement initial");
    
    // Déclencher une première génération de revenus après 5 secondes
    setTimeout(() => {
      generateAutomaticRevenue(true);
    }, 5000);
  }, []);
  
  // Fonction de génération de revenus automatiques
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    // Vérifier si nous pouvons générer des revenus
    if (!userData && !forceUpdate) {
      console.log("No userData available for revenue generation");
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
      const effectiveSub = userData?.subscription ? getEffectiveSubscription(userData.subscription) : 'freemium';
      
      // Si on a atteint la limite, mais forceUpdate est actif, appliquer un gain réduit
      let finalGain = 0;
      
      if (dailyLimitProgress >= 100 && !forceUpdate) {
        // Gain très faible si la limite est atteinte
        finalGain = parseFloat((0.01 + Math.random() * 0.02).toFixed(2));
      } else {
        // Gain normal basé sur l'abonnement
        const baseGain = calculateAutoSessionGain(effectiveSub, todaysGains, userData?.referrals?.length || 0);
        
        // Appliquer une bonification basée sur les jours consécutifs (jusqu'à +30%)
        const loyaltyMultiplier = 1 + Math.min(0.3, (consecutiveVisitDays - 1) * 0.01);
        finalGain = parseFloat((baseGain * loyaltyMultiplier).toFixed(2));
        
        // Assurer un gain minimum
        finalGain = Math.max(finalGain, 0.01);
      }
      
      // Créer un rapport pour la transaction
      const report = `Analyse automatique de contenu (jour ${consecutiveVisitDays})`;
      
      // Mettre à jour le solde avec le gain généré
      console.log(`Generating revenue: ${finalGain}€`);
      await updateBalance(finalGain, report, forceUpdate);
      lastGainTimeRef.current = now;
      
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
      
      // Déclencher une mise à jour forcée du solde
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          timestamp: now,
          animate: true
        }
      }));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération de revenus automatiques:", error);
      return false;
    }
  }, [userData, updateBalance, todaysGains, consecutiveVisitDays, dailyLimitProgress]);
  
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
