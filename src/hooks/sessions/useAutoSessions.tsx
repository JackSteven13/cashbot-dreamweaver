
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

export const useAutoSessions = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  // References to ensure data stability
  const todaysGainsRef = useRef(0);
  const lastKnownBalanceRef = useRef(userData?.balance || 0);
  
  // State to track bot activity
  const [isBotActive, setIsBotActive] = useState(true);
  const botActiveRef = useRef(true);
  
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
    
    // Calculate today's gains from transactions
    if (userData?.transactions) {
      const today = new Date().toISOString().split('T')[0];
      const todaysTransactions = userData.transactions.filter((tx: any) => 
        tx.date?.startsWith(today) && tx.gain > 0
      );
      const todaysGains = todaysTransactions.reduce((sum: number, tx: any) => sum + (tx.gain || 0), 0);
      todaysGainsRef.current = todaysGains;
      
      // Stocker les gains quotidiens pour la persistance
      try {
        localStorage.setItem('todaysGains', todaysGains.toString());
        localStorage.setItem('todaysGainsDate', today);
      } catch (e) {
        console.error("Failed to store today's gains in localStorage:", e);
      }
    }
  }, [userData?.balance, userData?.transactions]);

  // Custom hooks for automatic generation logic
  const { getDailyLimit } = useDailyLimits(userData?.subscription);
  
  // Automatic session scheduler
  const { 
    lastAutoSessionTime,
    getLastAutoSessionTime,
    isInitialSessionExecuted,
    getCurrentPersistentBalance
  } = useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, userData, isBotActive);
  
  // Synchronisez le solde avec la base de données périodiquement
  useEffect(() => {
    const syncTimerId = setInterval(() => {
      if (userData?.profile?.id) {
        balanceManager.syncWithDatabase().catch(err => 
          console.error("Error during periodic balance sync:", err)
        );
      }
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(syncTimerId);
  }, [userData?.profile?.id]);
  
  // Listen for bot status changes
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const newStatus = event.detail?.active;
      const userId = event.detail?.userId;
      
      // Only handle events for this user
      if (userId && userData?.profile?.id && userId !== userData.profile.id) {
        return;
      }
      
      if (typeof newStatus === 'boolean') {
        // Update local state and reference
        setIsBotActive(newStatus);
        botActiveRef.current = newStatus;
        console.log("Bot status updated to:", newStatus);
        
        // Enregistrer l'état du bot dans le localStorage
        try {
          localStorage.setItem(`botActive_${userData?.profile?.id}`, newStatus.toString());
        } catch (e) {
          console.error("Failed to store bot status in localStorage:", e);
        }
      }
    };
    
    // Restaurer l'état du bot à partir du localStorage
    try {
      const storedBotStatus = localStorage.getItem(`botActive_${userData?.profile?.id}`);
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
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [userData?.profile?.id]);

  // Function to generate automatic revenue with improved animation
  async function generateAutomaticRevenue(isFirst = false): Promise<void> {
    if (!botActiveRef.current) {
      console.log("Bot is inactive, no automatic revenue will be generated");
      return;
    }
    
    // Create an animation sequence that doesn't display the loading screen
    const terminalAnimation = createBackgroundTerminalSequence([
      "Initialisation de l'analyse du contenu vidéo..."
    ]);
    
    try {
      // Calculate potential gain
      const dailyLimit = getDailyLimit();
      
      // Get today's transactions to accurately calculate today's gains
      const today = new Date().toISOString().split('T')[0];
      const storedGainsDate = localStorage.getItem('todaysGainsDate');
      
      // Si la date stockée n'est pas aujourd'hui, réinitialiser les gains
      if (storedGainsDate !== today) {
        todaysGainsRef.current = 0;
        localStorage.setItem('todaysGains', '0');
        localStorage.setItem('todaysGainsDate', today);
      } else {
        // Restaurer les gains d'aujourd'hui depuis le localStorage
        const storedGains = localStorage.getItem('todaysGains');
        if (storedGains) {
          todaysGainsRef.current = parseFloat(storedGains);
        }
      }
      
      // Vérifier aussi dans les transactions si disponibles
      if (userData?.transactions) {
        const todaysTransactions = userData.transactions.filter((tx: any) => 
          tx.date?.startsWith(today) && tx.gain > 0
        );
        const calculatedGains = todaysTransactions.reduce((sum: number, tx: any) => sum + (tx.gain || 0), 0);
        
        // Prendre la valeur la plus élevée entre les transactions et le localStorage
        todaysGainsRef.current = Math.max(todaysGainsRef.current, calculatedGains);
        localStorage.setItem('todaysGains', todaysGainsRef.current.toString());
      }
      
      // Check if we've reached the limit
      const remainingAllowedGains = Math.max(0, dailyLimit - todaysGainsRef.current);
      if (remainingAllowedGains <= 0.01) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        terminalAnimation.complete(0);
        
        // Enregistrer l'état du bot
        localStorage.setItem(`botActive_${userData?.profile?.id}`, 'false');
        
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
      const transactionReport = `Notre système d'analyse de contenu vidéo a généré ${finalGain.toFixed(2)}€ de revenus. Performance basée sur le niveau d'abonnement ${userData.subscription}.`;
      
      // Mettre à jour les gains quotidiens immédiatement
      todaysGainsRef.current += finalGain;
      localStorage.setItem('todaysGains', todaysGainsRef.current.toString());
      
      // Use balance manager to sync consistently
      if (userData?.profile?.id) {
        // Add the transaction first
        const transactionResult = await balanceManager.addTransaction(userData.profile.id, finalGain, transactionReport);
        
        if (transactionResult) {
          // Recalculer le nouveau solde
          const newBalance = (userData.balance || 0) + finalGain;
          
          // Force update balance manager
          balanceManager.forceUpdate(newBalance);
          
          // Then update the balance with force update for immediate UI update
          await updateBalance(
            finalGain,
            transactionReport,
            true
          );
          
          // Trigger refresh event
          window.dispatchEvent(new CustomEvent('transactions:refresh', {
            detail: { userId: userData.profile.id }
          }));
          
          // Also sync with database immediately after transaction
          await balanceManager.syncWithDatabase();
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
      
      // If limit reached, deactivate the bot
      if (todaysGainsRef.current >= dailyLimit) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        
        // Enregistrer l'état du bot
        localStorage.setItem(`botActive_${userData?.profile?.id}`, 'false');
        
        toast({
          title: `Limite journalière atteinte`,
          description: `Le robot d'analyse est désactivé jusqu'à demain.`,
          duration: 5000,
        });
      }
      
      // Sync with database after any changes
      if (userData?.profile?.id) {
        await supabase
          .from('user_balances')
          .update({ daily_session_count: Math.ceil(todaysGainsRef.current / 0.1) })
          .eq('id', userData.profile.id);
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
    isBotActive
  };
};
