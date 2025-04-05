
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
        tx.gain > 0 && 
        tx.report.includes('système a généré')
      );
      
      todaysGainsRef.current = todaysAutoTransactions.reduce((sum, tx) => sum + tx.gain, 0);
      console.log("Today's auto-generated gains:", todaysGainsRef.current);
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

  // Effet pour simuler une activité périodique visible
  useEffect(() => {
    const simulateActivity = () => {
      const newActivityLevel = Math.floor(Math.random() * 5) + 1;
      setActivityLevel(newActivityLevel);
      
      // Déclencher un événement d'activité pour les animations
      triggerDashboardEvent('activity', { level: newActivityLevel });
      
      // Pour les niveaux d'activité élevés, déclencher une micro-animation
      if (newActivityLevel >= 4 && !sessionInProgress.current) {
        const microGain = (Math.random() * 0.01).toFixed(2);
        triggerDashboardEvent('micro-gain', { amount: parseFloat(microGain) });
      }
    };
    
    // Démarrer l'intervalle d'activité qui s'exécute plus fréquemment que les sessions réelles
    activityInterval.current = setInterval(simulateActivity, 15000);
    
    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
    };
  }, []);

  // Effet pour simuler l'analyse automatique des publicités
  useEffect(() => {
    // Get the daily limit for the current subscription
    const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Démarrer immédiatement une première session pour montrer l'activité à l'utilisateur
    setTimeout(() => {
      // Check if we're below the daily limit
      if (todaysGainsRef.current < dailyLimit) {
        generateAutomaticRevenue(true);
        setLastAutoSessionTime(Date.now());
      }
    }, 10000);
    
    const autoSessionInterval = setInterval(() => {
      // Vérifier si 2-3 minutes se sont écoulées depuis la dernière session
      const timeSinceLastSession = Date.now() - lastAutoSessionTime;
      const randomInterval = Math.random() * 60000 + 120000; // Entre 2 et 3 minutes
      
      if (timeSinceLastSession >= randomInterval && todaysGainsRef.current < dailyLimit) {
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(autoSessionInterval);
  }, [lastAutoSessionTime, userData.subscription]);

  const generateAutomaticRevenue = async (isFirst = false) => {
    if (sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // Déclencher un événement d'analyse avant que le gain soit calculé
      triggerDashboardEvent('analysis-start');
      
      // Attendre un court instant pour l'animation d'analyse
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get the daily limit for the current subscription
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Calculate remaining allowed gains for today
      const remainingAllowedGains = Math.max(0, dailyLimit - todaysGainsRef.current);
      
      if (remainingAllowedGains <= 0) {
        // If limit reached, show alert and stop
        setShowLimitAlert(true);
        sessionInProgress.current = false;
        operationLock.current = false;
        return;
      }
      
      // Calculate gain using the utility function (respecting daily limit)
      const baseGain = calculateAutoSessionGain(
        userData.subscription, 
        todaysGainsRef.current, // Pass today's gains, not total balance
        userData.referrals.length
      );
      
      // Ensure we don't exceed daily limit
      const randomGain = Math.min(baseGain, remainingAllowedGains);
      
      // Update today's gains tracker
      todaysGainsRef.current += randomGain;
      
      // Déclencher l'événement d'analyse terminée avec le gain
      triggerDashboardEvent('analysis-complete', { gain: randomGain });
      
      // Update user balance with forceUpdate set to true for immediate UI update
      await updateBalance(
        randomGain,
        `Le système a généré ${randomGain.toFixed(2)}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${userData.subscription} vous permet d'accéder à ce niveau de performance.`,
        true // Force immediate UI update
      );
      
      // Déclencher directement l'événement de mise à jour du solde
      const balanceEvent = new CustomEvent('balance:update', {
        detail: { amount: randomGain }
      });
      window.dispatchEvent(balanceEvent);

      // Show notification for first session or randomly for subsequent sessions
      if (isFirst || Math.random() > 0.6) {
        toast({
          title: "Revenus générés",
          description: `CashBot a généré ${randomGain.toFixed(2)}€ pour vous !`
        });
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
