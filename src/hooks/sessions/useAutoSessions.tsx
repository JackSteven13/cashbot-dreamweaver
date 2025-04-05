
import { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  calculateAutoSessionGain
} from '@/utils/subscription';
import { triggerDashboardEvent } from '@/utils/animations';

export const useAutoSessions = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);
  const [activityLevel, setActivityLevel] = useState(1); // 1-5 échelle d'activité
  
  // Track today's auto-generated gains
  const todaysGainsRef = useRef(0);
  
  // Calculate today's gains from transactions
  useEffect(() => {
    if (userData?.transactions) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todaysAutoTransactions = userData.transactions.filter(tx => 
        tx.date.startsWith(today) && 
        tx.gain > 0
      );
      
      todaysGainsRef.current = todaysAutoTransactions.reduce((sum, tx) => sum + tx.gain, 0);
      console.log("Today's total gains:", todaysGainsRef.current);
    }
  }, [userData?.transactions]);
  
  // Reset daily counters on day change
  useEffect(() => {
    const checkDayChange = () => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const storedDate = localStorage.getItem('lastAutoSessionDate');
      if (storedDate) {
        const [year, month, day] = storedDate.split('-').map(Number);
        
        if (year !== currentYear || month !== currentMonth || day !== currentDay) {
          console.log("New day detected, resetting auto session counters");
          todaysGainsRef.current = 0;
          localStorage.setItem('lastAutoSessionDate', 
            `${currentYear}-${currentMonth}-${currentDay}`);
        }
      } else {
        localStorage.setItem('lastAutoSessionDate', 
          `${currentYear}-${currentMonth}-${currentDay}`);
      }
    };
    
    // Check on component mount
    checkDayChange();
    
    // Set up interval to check (every 5 minutes)
    const dayCheckInterval = setInterval(checkDayChange, 5 * 60 * 1000);
    
    return () => {
      clearInterval(dayCheckInterval);
    };
  }, []);

  // Effect for simulating periodic visible activity
  useEffect(() => {
    const simulateActivity = () => {
      const newActivityLevel = Math.floor(Math.random() * 5) + 1;
      setActivityLevel(newActivityLevel);
      
      // Trigger an activity event for animations
      triggerDashboardEvent('activity', { level: newActivityLevel });
      
      // For high activity levels, trigger a micro-animation
      if (newActivityLevel >= 4 && !sessionInProgress.current) {
        const microGain = (Math.random() * 0.01).toFixed(2);
        triggerDashboardEvent('micro-gain', { amount: parseFloat(microGain) });
      }
    };
    
    // Start the activity interval that runs more frequently than actual sessions
    activityInterval.current = setInterval(simulateActivity, 15000);
    
    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
    };
  }, []);

  // Effect to simulate automatic ad analysis
  useEffect(() => {
    // Get the daily limit for the current subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Start an initial session immediately to show activity to the user
    setTimeout(() => {
      // Check if we're below the daily limit
      if (todaysGainsRef.current < dailyLimit) {
        generateAutomaticRevenue(true);
        setLastAutoSessionTime(Date.now());
      }
    }, 10000);
    
    const autoSessionInterval = setInterval(() => {
      // Check if 2-3 minutes have passed since the last session
      const timeSinceLastSession = Date.now() - lastAutoSessionTime;
      const randomInterval = Math.random() * 60000 + 120000; // Between 2 and 3 minutes
      
      if (timeSinceLastSession >= randomInterval && todaysGainsRef.current < dailyLimit) {
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(autoSessionInterval);
  }, [lastAutoSessionTime, userData.subscription]);

  const generateAutomaticRevenue = async (isFirst = false) => {
    if (sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // Trigger analysis start event - IMPORTANT: Always use background:true to prevent loading screen
      triggerDashboardEvent('analysis-start', { background: true });
      
      // Simulate terminal animation within the dashboard - no loading screen
      // Show progressive terminal outputs in the terminal component
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
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
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
          background: false // We want this to be visible
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
          background: false // We want this to be visible
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
    lastAutoSessionTime,
    setLastAutoSessionTime,
    activityLevel,
    generateAutomaticRevenue
  };
};
