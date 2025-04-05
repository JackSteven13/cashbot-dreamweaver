
import { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types/userData';
import { toast } from '@/components/ui/use-toast';
import { 
  SUBSCRIPTION_LIMITS, 
  calculateAutoSessionGain,
  checkDailyLimit
} from '@/utils/subscription';
import { triggerDashboardEvent } from '@/utils/animations';

export const useAutoSessions = (
  userData: UserData,
  updateBalance: (gain: number, report: string) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  const [lastAutoSessionTime, setLastAutoSessionTime] = useState(Date.now());
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);
  const [activityLevel, setActivityLevel] = useState(1); // 1-5 échelle d'activité

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
    // Démarrer immédiatement une première session pour montrer l'activité à l'utilisateur
    setTimeout(() => {
      if (!checkDailyLimit(userData.balance, userData.subscription)) {
        generateAutomaticRevenue(true);
        setLastAutoSessionTime(Date.now());
      }
    }, 10000);
    
    const autoSessionInterval = setInterval(() => {
      // Vérifier si 2-3 minutes se sont écoulées depuis la dernière session
      const timeSinceLastSession = Date.now() - lastAutoSessionTime;
      const randomInterval = Math.random() * 60000 + 120000; // Entre 2 et 3 minutes
      
      if (timeSinceLastSession >= randomInterval && !checkDailyLimit(userData.balance, userData.subscription)) {
        generateAutomaticRevenue();
        setLastAutoSessionTime(Date.now());
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(autoSessionInterval);
  }, [lastAutoSessionTime, userData.subscription, userData.balance]);

  const generateAutomaticRevenue = async (isFirst = false) => {
    if (sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
      // Déclencher un événement d'analyse avant que le gain soit calculé
      triggerDashboardEvent('analysis-start');
      
      // Attendre un court instant pour l'animation d'analyse
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calculate gain using the utility function
      const randomGain = calculateAutoSessionGain(
        userData.subscription, 
        userData.balance, 
        userData.referrals.length
      );
      
      // If no gain was generated (due to limit being reached), show alert
      if (randomGain <= 0) {
        setShowLimitAlert(true);
        return;
      }
      
      // Déclencher l'événement d'analyse terminée avec le gain
      triggerDashboardEvent('analysis-complete', { gain: randomGain });
      
      // Update user balance and show notification
      await updateBalance(
        randomGain,
        `Le système a généré ${randomGain.toFixed(2)}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${userData.subscription} vous permet d'accéder à ce niveau de performance.`
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
          description: `CashBot a généré ${randomGain.toFixed(2)}€ pour vous !`,
          action: userData.subscription === 'freemium' ? {
            label: "Améliorer",
            onClick: () => {
              window.location.href = '/upgrade';
            }
          } : undefined
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
