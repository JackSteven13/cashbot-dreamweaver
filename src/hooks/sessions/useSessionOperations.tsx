
import { useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { triggerDashboardEvent } from '@/utils/animations';
import { UserData } from '@/types/userData';
import { calculateAutoSessionGain } from '@/utils/subscription';

/**
 * Hook for session operations
 */
export const useSessionOperations = (
  userData: UserData,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void,
  todaysGainsRef: React.MutableRefObject<number>,
  getDailyLimit: () => number,
  isBotActive: boolean,
  updateBotStatus: (isActive: boolean) => void
) => {
  const sessionInProgress = useRef(false);
  const operationLock = useRef(false);

  /**
   * Generate automatic revenue based on subscription type and limits
   */
  const generateAutomaticRevenue = async (isFirst = false) => {
    // Check if bot is active before proceeding
    if (!isBotActive || sessionInProgress.current || operationLock.current) return;
    
    try {
      operationLock.current = true;
      sessionInProgress.current = true;
      
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
        // Si limite atteinte, montrer l'alerte, déclencher l'événement limite-atteinte, et arrêter
        setShowLimitAlert(true);
        updateBotStatus(false); // Désactiver le bot
        
        triggerDashboardEvent('terminal-update', { 
          line: "Limite journalière atteinte. Bot désactivé jusqu'à demain.",
          background: true
        });
        
        triggerDashboardEvent('limit-reached', { 
          subscription: userData.subscription,
          background: true
        });
        
        sessionInProgress.current = false;
        operationLock.current = false;
        return;
      }
      
      // TOUJOURS utiliser background:true pour tous les événements automatiques
      triggerDashboardEvent('analysis-start', { background: true });
      
      // Simuler l'animation du terminal dans le dashboard - sans écran de chargement
      triggerDashboardEvent('terminal-update', { 
        line: "Initialisation de l'analyse réseau...",
        background: true
      });
      
      // Attendre un court instant pour le retour visuel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      triggerDashboardEvent('terminal-update', { 
        line: "Calcul des revenus potentiels...",
        background: true
      });
      
      // Attendre un autre court instant
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Calculer le gain en utilisant la fonction utilitaire (en respectant la limite journalière)
      const baseGain = calculateAutoSessionGain(
        userData.subscription, 
        todaysGains, 
        userData.referrals.length
      );
      
      // S'assurer de ne pas dépasser la limite journalière
      const randomGain = Math.min(baseGain, remainingAllowedGains);
      
      // Mettre à jour le terminal avec un message de succès
      triggerDashboardEvent('terminal-update', { 
        line: `Analyse terminée avec succès! Revenus générés: ${randomGain.toFixed(2)}€`,
        background: true
      });
      
      // Mettre à jour le tracker des gains journaliers
      todaysGainsRef.current += randomGain;
      
      // Déclencher l'événement d'analyse complète avec le gain - TOUJOURS utiliser background:true
      triggerDashboardEvent('analysis-complete', { 
        gain: randomGain, 
        background: true 
      });
      
      // Mettre à jour le solde de l'utilisateur avec forceUpdate à true pour mise à jour UI immédiate
      await updateBalance(
        randomGain,
        `Le système a généré ${randomGain.toFixed(2)}€ de revenus grâce à notre technologie propriétaire. Votre abonnement ${userData.subscription} vous permet d'accéder à ce niveau de performance.`,
        true // Forcer la mise à jour UI immédiate
      );
      
      // Déclencher directement l'événement de mise à jour du solde avec le solde actuel et le gain
      const currentBalance = (userData.balance || 0) + randomGain;
      const balanceEvent = new CustomEvent('balance:update', {
        detail: { 
          amount: randomGain,
          currentBalance: currentBalance
        }
      });
      window.dispatchEvent(balanceEvent);

      // Afficher une notification pour la première session ou aléatoirement pour les suivantes
      if (isFirst || Math.random() > 0.6) {
        toast({
          title: "Revenus générés",
          description: `CashBot a généré ${randomGain.toFixed(2)}€ pour vous !`,
          className: "toast-notification" // Ajouter la classe pour le style responsive
        });
      }
      
      // Vérifier si nous avons atteint la limite journalière après cette transaction
      if (todaysGainsRef.current >= dailyLimit) {
        // Si la limite est atteinte maintenant, désactiver le bot et informer l'utilisateur
        updateBotStatus(false);
        
        // Déclencher l'événement limite-atteinte
        triggerDashboardEvent('limit-reached', { 
          subscription: userData.subscription,
          background: true
        });
        
        setShowLimitAlert(true);
        
        triggerDashboardEvent('terminal-update', { 
          line: "Limite journalière atteinte. Bot désactivé jusqu'à demain.",
          background: true
        });
      }
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer plus tard.",
        variant: "destructive",
        className: "toast-notification" // Ajouter la classe pour le style responsive
      });
    } finally {
      sessionInProgress.current = false;
      // Libérer le verrou après un petit délai pour éviter des appels rapides subséquents
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
