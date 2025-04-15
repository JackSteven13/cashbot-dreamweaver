import { useState, useRef, useEffect } from 'react';
import { useAutoRevenueGenerator } from './useAutoRevenueGenerator';
import { useAutoSessionScheduler } from './useAutoSessionScheduler';
import { useDailyLimits } from './useDailyLimits';
import { useActivitySimulation } from './useActivitySimulation';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { toast } from '@/components/ui/use-toast';
import { addTransaction } from '@/hooks/user/transactionUtils';
import balanceManager from '@/utils/balance/balanceManager';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

export const useAutoSessions = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => setShowLimitAlert: (show: boolean) => void
) => {
  // References to ensure data stability
  const todaysGainsRef = useRef(0);
  const lastKnownBalanceRef = useRef(userData?.balance || 0);
  
  // Create a safe userData object with default values
  const safeUserData = userData || { subscription: 'freemium', profile: { id: null }, balance: 0 };
  
  // State to track bot activity
  const [isBotActive, setIsBotActive] = useState(true);
  const botActiveRef = useRef(true);
  
  // Pour suivre la limite quotidienne
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);

  // State to track initial session execution
  const isInitialSessionExecuted = useRef(false);
  
  // Update lastKnownBalanceRef when userData.balance changes
  useEffect(() => {
    if (userData?.balance !== undefined && userData.balance !== lastKnownBalanceRef.current) {
      lastKnownBalanceRef.current = userData.balance;
      
      // Also store in localStorage for persistence between renders
      try {
        localStorage.setItem('lastKnownBalance', userData.balance.toString());
      } catch (e) {
        console.error("Failed to store balance in localStorage:", e);
      }
    }
    
    // Calculate today's gains from both local storage and transactions
    updateDailyGains();
  }, [userData?.balance, userData?.transactions]);
  
  // Fonction pour récupérer et synchroniser les gains quotidiens
  const updateDailyGains = () => {
    // Récupérer les gains depuis le gestionnaire de solde
    const managerDailyGains = balanceManager.getDailyGains();
    
    // Calculer aussi depuis les transactions
    if (userData?.transactions) {
      const today = new Date().toISOString().split('T')[0];
      const todaysTransactions = userData.transactions.filter((tx: any) => 
        tx.date?.startsWith(today) && tx.gain > 0
      );
      const transactionsGains = todaysTransactions.reduce((sum: number, tx: any) => sum + (tx.gain || 0), 0);
      
      // Utiliser la valeur la plus élevée
      const actualDailyGains = Math.max(managerDailyGains, transactionsGains);
      todaysGainsRef.current = actualDailyGains;
      
      // Calculer le pourcentage atteint pour la limite quotidienne
      const subscription = safeUserData.subscription || 'freemium';
      const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const percentProgress = Math.min(100, (actualDailyGains / dailyLimit) * 100);
      setDailyLimitProgress(percentProgress);
      
      // Vérifier si la limite est atteinte
      if (actualDailyGains >= dailyLimit && botActiveRef.current) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'false');
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('bot:status-change', {
          detail: { active: false, userId: safeUserData?.profile?.id, reason: 'limit_reached' }
        }));
      }
    }
  };

  // Custom hooks for automatic generation logic
  const { getDailyLimit } = useDailyLimits(safeUserData.subscription);
  
  // Automatic session scheduler
  const { 
    lastAutoSessionTime,
    getLastAutoSessionTime,
    getCurrentPersistentBalance
  } = useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, safeUserData, isBotActive);
  
  // Synchronisez le solde avec la base de données périodiquement
  useEffect(() => {
    const syncTimerId = setInterval(() => {
      if (safeUserData?.profile?.id) {
        balanceManager.syncWithDatabase().catch(err => 
          console.error("Error during periodic balance sync:", err)
        );
      }
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(syncTimerId);
  }, [safeUserData?.profile?.id]);
  
  // Listen for bot status changes
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const newStatus = event.detail?.active;
      const userId = event.detail?.userId;
      
      // Only handle events for this user
      if (userId && safeUserData?.profile?.id && userId !== safeUserData.profile.id) {
        return;
      }
      
      if (typeof newStatus === 'boolean') {
        // Update local state and reference
        setIsBotActive(newStatus);
        botActiveRef.current = newStatus;
        console.log("Bot status updated to:", newStatus);
        
        // Enregistrer l'état du bot dans le localStorage
        try {
          localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, newStatus.toString());
        } catch (e) {
          console.error("Failed to store bot status in localStorage:", e);
        }
      }
    };
    
    // Restaurer l'état du bot à partir du localStorage
    try {
      const storedBotStatus = localStorage.getItem(`botActive_${safeUserData?.profile?.id}`);
      if (storedBotStatus !== null) {
        const isActive = storedBotStatus === 'true';
        setIsBotActive(isActive);
        botActiveRef.current = isActive;
      }
    } catch (e) {
      console.error("Failed to restore bot status from localStorage:", e);
    }
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    window.addEventListener('dailyGains:updated' as any, updateDailyGains);
    window.addEventListener('dailyGains:reset' as any, updateDailyGains);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
      window.removeEventListener('dailyGains:updated' as any, updateDailyGains);
      window.removeEventListener('dailyGains:reset' as any, updateDailyGains);
    };
  }, [safeUserData?.profile?.id]);

  // Fonction pour déclencher une première session automatique au chargement initial
  useEffect(() => {
    if (safeUserData?.profile?.id && botActiveRef.current && !isInitialSessionExecuted.current) {
      isInitialSessionExecuted.current = true;
      
      // Déclencher une première session automatique avec un petit délai
      setTimeout(() => {
        generateAutomaticRevenue(true);
      }, 1000);
      
      // Programmer la prochaine session avec un intervalle aléatoire
      const nextInterval = Math.random() * 15000 + 15000; // 15-30 secondes
      setTimeout(() => {
        if (botActiveRef.current) {
          generateAutomaticRevenue();
        }
      }, nextInterval);
    }
  }, [safeUserData?.profile?.id]);

  // Function to generate automatic revenue with improved animation
  async function generateAutomaticRevenue(isFirst = false): Promise<void> {
    if (!botActiveRef.current) {
      console.log("Bot is inactive, no automatic revenue will be generated");
      return;
    }
    
    // Create an animation sequence that doesn't display the loading screen
    const terminalAnimation = createBackgroundTerminalSequence([
      "Initialisation de l'analyse du contenu vidéo..."
    ], true);
    
    try {
      // Calculate potential gain
      const dailyLimit = getDailyLimit();
      
      // Récupérer les gains journaliers depuis le gestionnaire de solde
      const actualDailyGains = balanceManager.getDailyGains();
      todaysGainsRef.current = actualDailyGains;
      
      // Check if we've reached the limit
      const remainingAllowedGains = Math.max(0, dailyLimit - todaysGainsRef.current);
      if (remainingAllowedGains <= 0.01) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        terminalAnimation.complete(0);
        
        // Enregistrer l'état du bot
        localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'false');
        
        // Notification de limite atteinte
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de ${dailyLimit.toFixed(2)}€ pour aujourd'hui.`,
          duration: 5000,
          variant: "destructive"
        });
        
        // Déclencher l'événement de limite atteinte
        window.dispatchEvent(new CustomEvent('bot:limit-reached', {
          detail: { subscription: safeUserData.subscription, userId: safeUserData.profile?.id }
        }));
        
        return;
      }
      
      // Add animation lines progressively
      terminalAnimation.addLine("Traitement des données algorithmiques...");
      
      // Short delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a random gain between 0.01 and 0.1, limited by the remaining allowed amount
      const baseGain = Math.min(
        Math.random() * 0.09 + 0.01,
        remainingAllowedGains
      );
      
      // Round to 2 decimals
      const finalGain = parseFloat(baseGain.toFixed(2));
      
      // Simulate an additional short delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      terminalAnimation.addLine(`Analyse complétée. Optimisation des résultats: ${finalGain.toFixed(2)}€`);
      
      // Create a descriptive message for the transaction
      const transactionReport = `Notre système d'analyse de contenu vidéo a généré ${finalGain.toFixed(2)}€ de revenus. Performance basée sur le niveau d'abonnement ${safeUserData.subscription}.`;
      
      // Use balance manager to sync consistently
      if (safeUserData?.profile?.id) {
        // Add the transaction first
        const transactionResult = await balanceManager.addTransaction(safeUserData.profile.id, finalGain, transactionReport);
        
        if (transactionResult) {
          // Recalculer le nouveau solde
          const newBalance = (safeUserData.balance || 0) + finalGain;
          
          // Force update balance manager
          balanceManager.forceUpdate(newBalance);
          
          // Then update the balance with force update for immediate UI update
          await updateBalance(
            finalGain,
            transactionReport,
            true
          );
          
          // Trigger refresh event for transactions list
          window.dispatchEvent(new CustomEvent('transactions:refresh', {
            detail: { userId: safeUserData.profile.id }
          }));
          
          // Also sync with database immediately after transaction
          await balanceManager.syncWithDatabase();
          
          // Déclencher également un événement visuel pour montrer les gains en temps réel
          window.dispatchEvent(new CustomEvent('balance:update', {
            detail: { amount: finalGain, animate: true, userId: safeUserData.profile.id }
          }));
          
          // Mettre à jour la progression de la limite quotidienne
          const updatedGains = balanceManager.getDailyGains();
          const percentProgress = Math.min(100, (updatedGains / dailyLimit) * 100);
          setDailyLimitProgress(percentProgress);
        }
      }
      
      // Display a notification to confirm automatic generation
      if (isFirst || Math.random() > 0.7) {
        toast({
          title: `Gains automatiques +${finalGain.toFixed(2)}€`,
          description: `L'analyse automatique de contenu vidéo a généré des revenus.`,
          duration: 3000,
        });
      }
      
      // Complete the animation with the obtained gain
      terminalAnimation.complete(finalGain);
      
      // Programme la prochaine génération automatique avec un intervalle aléatoire
      // Utiliser un intervalle plus court pour plus de dynamisme
      const nextInterval = Math.random() * 20000 + 10000; // 10-30 secondes
      setTimeout(() => {
        if (botActiveRef.current) {
          generateAutomaticRevenue();
        }
      }, nextInterval);
      
      // If limit reached, deactivate the bot
      if (balanceManager.getDailyGains() >= dailyLimit) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        
        // Enregistrer l'état du bot
        localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'false');
        
        // Déclencher l'événement de limite atteinte
        window.dispatchEvent(new CustomEvent('bot:limit-reached', {
          detail: { subscription: safeUserData.subscription, userId: safeUserData.profile.id }
        }));
        
        toast({
          title: `Limite journalière atteinte`,
          description: `Le robot d'analyse est désactivé jusqu'à demain.`,
          duration: 5000,
        });
      }
      
      // Sync with database after any changes
      if (safeUserData?.profile?.id) {
        await supabase
          .from('user_balances')
          .update({ daily_session_count: Math.ceil(balanceManager.getDailyGains() / 0.1) })
          .eq('id', safeUserData.profile.id);
      }
    } catch (error) {
      console.error("Error in generateAutomaticRevenue:", error);
      // Complete the animation even in case of error
      terminalAnimation.complete(0);
    }
  }

  return {
    lastAutoSessionTime: getLastAutoSessionTime(),
    activityLevel: "medium", // Placeholder for compatibility
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress,
    isInitialSessionExecuted
  };
};
