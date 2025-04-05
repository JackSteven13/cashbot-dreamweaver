
import { useState, useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { calculateAutoSessionGain } from '@/utils/subscription';
import { triggerDashboardEvent } from '@/utils/animations';

/**
 * Hook for generating automatic revenue
 */
export const useAutoRevenueGenerator = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: () => number
) => {
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);

  /**
   * Generate automatic revenue based on subscription type and limits
   */
  const generateAutomaticRevenue = async (isFirst = false) => {
    if (sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // ALWAYS use background:true for all automatic revenue events
      // This is critical to prevent the loading screen
      triggerDashboardEvent('analysis-start', { background: true });
      
      // Simulate terminal animation within the dashboard - no loading screen
      triggerDashboardEvent('terminal-update', { 
        line: "Initialisation de l'analyse réseau...",
        background: true
      });
      
      // Wait a short moment for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      
      triggerDashboardEvent('terminal-update', { 
        line: "Calcul des revenus potentiels...",
        background: true
      });
      
      // Wait another short moment
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Get the daily limit for the current subscription
      const dailyLimit = getDailyLimit();
      
      // Calculate today's gains from transactions
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todaysTransactions = userData.transactions.filter(tx => 
        tx.date.startsWith(today) && tx.gain > 0
      );
      const todaysGains = todaysTransactions.reduce((sum, tx) => sum + tx.gain, 0);
      todaysGainsRef.current = todaysGains;
      
      // Calculate remaining allowed gains for today
      const remainingAllowedGains = Math.max(0, dailyLimit - todaysGainsRef.current);
      
      if (remainingAllowedGains <= 0) {
        // If limit reached, show alert, trigger limit-reached event, and stop
        setShowLimitAlert(true);
        
        triggerDashboardEvent('terminal-update', { 
          line: "Limite journalière atteinte. Réessayez demain.",
          background: true
        });
        
        triggerDashboardEvent('limit-reached', { 
          subscription: userData.subscription,
          background: true // IMPORTANT: Always specify background:true
        });
        
        sessionInProgress.current = false;
        operationLock.current = false;
        return;
      }
      
      // Calculate gain using the utility function (respecting daily limit)
      const baseGain = calculateAutoSessionGain(
        userData.subscription, 
        todaysGains, 
        userData.referrals.length
      );
      
      // Ensure we don't exceed daily limit
      const randomGain = Math.min(baseGain, remainingAllowedGains);
      
      // Update terminal with success message
      triggerDashboardEvent('terminal-update', { 
        line: `Analyse terminée avec succès! Revenus générés: ${randomGain.toFixed(2)}€`,
        background: true
      });
      
      // Update today's gains tracker
      todaysGainsRef.current += randomGain;
      
      // Trigger the analysis complete event with the gain - ALWAYS use background:true
      triggerDashboardEvent('analysis-complete', { 
        gain: randomGain, 
        background: true 
      });
      
      // Update user balance with forceUpdate set to true for immediate UI update
      await updateBalance(
        randomGain,
        `Le système a généré ${randomGain.toFixed(2)}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${userData.subscription} vous permet d'accéder à ce niveau de performance.`,
        true // Force immediate UI update
      );
      
      // Directly trigger the balance update event with current balance
      const currentBalance = (userData.balance || 0) + randomGain;
      const balanceEvent = new CustomEvent('balance:update', {
        detail: { 
          amount: randomGain,
          currentBalance: currentBalance
        }
      });
      window.dispatchEvent(balanceEvent);

      // Show notification for first session or randomly for subsequent sessions
      if (isFirst || Math.random() > 0.6) {
        toast({
          title: "Revenus générés",
          description: `CashBot a généré ${randomGain.toFixed(2)}€ pour vous !`
        });
      }
      
      // Check if we've reached the daily limit after this transaction
      if (todaysGainsRef.current >= dailyLimit) {
        // If limit reached now, trigger the limit-reached event
        triggerDashboardEvent('limit-reached', { 
          subscription: userData.subscription,
          background: true // IMPORTANT: Always specify background:true
        });
        setShowLimitAlert(true);
      }
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      sessionInProgress.current = false;
      // Release lock after a small delay to prevent rapid subsequent calls
      setTimeout(() => {
        operationLock.current = false;
      }, 500);
    }
  };

  return {
    generateAutomaticRevenue,
    isSessionInProgress: () => sessionInProgress.current
  };
};
