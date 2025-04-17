
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
import { loadUserStats, saveUserStats } from '@/hooks/stats/utils/storageManager';

export const useAutoSessions = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
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
  
  // Automatic session scheduler - activate immediately on component mount
  useEffect(() => {
    if (safeUserData?.profile?.id && !isInitialSessionExecuted.current) {
      isInitialSessionExecuted.current = true;
      
      // Déclencher une première session automatique immédiatement
      setTimeout(() => {
        generateAutomaticRevenue(true);
      }, 2000);
    }
  }, [safeUserData?.profile?.id]);

  // Set up periodic auto session generation
  useEffect(() => {
    // Skip if user data is not available
    if (!safeUserData?.profile?.id) return;

    // Setup interval for regular automatic sessions
    const autoSessionInterval = setInterval(() => {
      if (botActiveRef.current) {
        generateAutomaticRevenue();
      }
    }, 45000 + Math.random() * 30000); // Run every 45-75 seconds
    
    return () => {
      clearInterval(autoSessionInterval);
    };
  }, [safeUserData?.profile?.id]);
  
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
    
    // Restaurer l'état du bot à partir du localStorage, mais activer par défaut
    try {
      const storedBotStatus = localStorage.getItem(`botActive_${safeUserData?.profile?.id}`);
      if (storedBotStatus !== null) {
        const isActive = storedBotStatus === 'true';
        setIsBotActive(isActive);
        botActiveRef.current = isActive;
      } else {
        // Par défaut, le bot est actif s'il n'y a pas de valeur stockée
        setIsBotActive(true);
        botActiveRef.current = true;
        localStorage.setItem(`botActive_${safeUserData?.profile?.id}`, 'true');
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

  // Function to generate automatic revenue with improved limit checking
  async function generateAutomaticRevenue(isFirst = false): Promise<void> {
    if (!botActiveRef.current) {
      console.log("Bot is inactive, no automatic revenue will be generated");
      return;
    }

    const subscription = safeUserData.subscription || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Vérifier si on a atteint la limite quotidienne
    const userStats = loadUserStats(subscription);
    if (userStats.currentGains >= dailyLimit) {
      setIsBotActive(false);
      botActiveRef.current = false;
      setShowLimitAlert(true);
      
      toast({
        title: "Limite journalière atteinte",
        description: `Vous avez atteint votre limite de ${dailyLimit.toFixed(2)}€ pour aujourd'hui.`,
        variant: "destructive"
      });
      
      return;
    }

    console.log("Generating automatic revenue within limits...");
    
    try {
      // Calculate remaining allowed gains
      const remainingAllowed = dailyLimit - userStats.currentGains;
      
      // Generate a smaller gain (0.01-0.05€) to stay within limits
      const minGain = 0.01;
      const maxGain = Math.min(0.05, remainingAllowed);
      const gain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Proceed with the transaction
      const terminalAnimation = createBackgroundTerminalSequence([
        "Initialisation de l'analyse du contenu vidéo..."
      ], true);
      
      terminalAnimation.addLine("Traitement des données algorithmiques...");
      
      // Short delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      terminalAnimation.addLine(`Analyse complétée. Optimisation des résultats: ${gain.toFixed(2)}€`);
      
      // Create a descriptive message for the transaction
      const transactionReport = `Analyse automatique de contenu`;
      
      // Mettre à jour le solde
      await updateBalance(gain, transactionReport, true);
      
      // Update user stats
      saveUserStats(
        userStats.currentGains + gain,
        userStats.sessionCount + 1
      );
      
      // Trigger animated balance update with a custom event
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: {
          amount: gain,
          animate: true,
          automatic: true
        }
      }));
      
      // Display a notification to confirm automatic generation
      if (isFirst || Math.random() > 0.7) {
        toast({
          title: `Gains automatiques +${gain.toFixed(2)}€`,
          description: `L'analyse automatique de contenu vidéo a généré des revenus.`,
          duration: 3000,
        });
      }
      
      // Complete the animation with the obtained gain
      terminalAnimation.complete(gain);
      
    } catch (error) {
      console.error("Error in generateAutomaticRevenue:", error);
    }
  }

  return {
    lastAutoSessionTime: Date.now(), // Always return current time to avoid stale data
    activityLevel: "medium", // Placeholder for compatibility
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress,
    isInitialSessionExecuted
  };
};
