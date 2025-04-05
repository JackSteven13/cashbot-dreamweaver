
import { useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
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
  const cumulativeBalanceRef = useRef<number | null>(null);
  const botStatusRef = useRef(isBotActive);
  
  // Use useEffect to update botStatusRef when isBotActive changes
  useEffect(() => {
    botStatusRef.current = isBotActive;
  }, [isBotActive]);
  
  // Initialiser cumulativeBalanceRef au montage avec localStorage
  useEffect(() => {
    // Essayer de récupérer le solde depuis localStorage
    try {
      const storedBalance = localStorage.getItem('lastKnownBalance');
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          cumulativeBalanceRef.current = parsedBalance;
          console.log(`[SessionOperations] Initialized cumulative balance from localStorage: ${parsedBalance}`);
        } else {
          cumulativeBalanceRef.current = userData.balance || 0;
        }
      } else {
        cumulativeBalanceRef.current = userData.balance || 0;
      }
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
      cumulativeBalanceRef.current = userData.balance || 0;
    }
    
    // Écouter les événements de mise à jour du solde pour maintenir la cohérence
    const handleBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.balance;
      if (typeof newBalance === 'number' && newBalance >= 0) {
        cumulativeBalanceRef.current = newBalance;
      }
    };
    
    window.addEventListener('balance:local-update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:local-update' as any, handleBalanceUpdate);
    };
  }, [userData.balance]);

  /**
   * Generate automatic revenue based on subscription type and limits
   */
  const generateAutomaticRevenue = async (isFirst = false) => {
    // Vérification stricte de l'état du bot avant de continuer
    if (!botStatusRef.current) {
      console.log("[SessionOperations] Bot inactif, arrêt de la génération de revenus");
      return;
    }

    // Autres vérifications de sécurité
    if (sessionInProgress.current || operationLock.current) {
      console.log("[SessionOperations] Session déjà en cours ou verrou actif, arrêt");
      return;
    }
    
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

      // Toujours récupérer le solde le plus à jour depuis localStorage
      if (cumulativeBalanceRef.current === null) {
        // Try to get it from localStorage first for persistence
        try {
          const storedBalance = localStorage.getItem('lastKnownBalance');
          if (storedBalance) {
            const parsedBalance = parseFloat(storedBalance);
            if (!isNaN(parsedBalance)) {
              cumulativeBalanceRef.current = parsedBalance;
            } else {
              cumulativeBalanceRef.current = userData.balance || 0;
            }
          } else {
            cumulativeBalanceRef.current = userData.balance || 0;
          }
        } catch (e) {
          console.error("Failed to read from localStorage:", e);
          cumulativeBalanceRef.current = userData.balance || 0;
        }
      }
      
      // Calculate remaining allowed gains for today
      const remainingAllowedGains = Math.max(0, dailyLimit - todaysGainsRef.current);
      
      if (remainingAllowedGains <= 0) {
        // Si limite atteinte, désactiver le bot et montrer l'alerte
        updateBotStatus(false);
        setShowLimitAlert(true);
        
        triggerDashboardEvent('terminal-update', { 
          line: "Limite journalière atteinte. Analyse automatique suspendue.",
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
      
      // Vérifier à nouveau si le bot est toujours actif
      if (!botStatusRef.current) {
        console.log("[SessionOperations] Bot désactivé pendant la préparation de la session, arrêt");
        sessionInProgress.current = false;
        operationLock.current = false;
        return;
      }
      
      // TOUJOURS utiliser background:true pour tous les événements automatiques
      triggerDashboardEvent('analysis-start', { background: true });
      
      // Simuler l'animation du terminal dans le dashboard - sans écran de chargement
      triggerDashboardEvent('terminal-update', { 
        line: "Initialisation de l'analyse du contenu vidéo...",
        background: true
      });
      
      // Attendre un court instant pour le retour visuel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      triggerDashboardEvent('terminal-update', { 
        line: "Traitement des données algorithmiques...",
        background: true
      });
      
      // Attendre un autre court instant
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Vérifier à nouveau si le bot est toujours actif
      if (!botStatusRef.current) {
        console.log("[SessionOperations] Bot désactivé pendant l'analyse, arrêt");
        triggerDashboardEvent('terminal-update', { 
          line: "Analyse interrompue: le bot a été désactivé.",
          background: true
        });
        sessionInProgress.current = false;
        operationLock.current = false;
        return;
      }
      
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
        line: `Analyse complétée. Optimisation des résultats: ${randomGain.toFixed(2)}€`,
        background: true
      });
      
      // Mettre à jour le tracker des gains journaliers
      todaysGainsRef.current += randomGain;
      
      // Récupérer la dernière valeur du solde persisté pour assurer la cohérence
      let currentPersistedBalance = cumulativeBalanceRef.current || 0;
      try {
        const storedBalance = localStorage.getItem('currentBalance');
        if (storedBalance) {
          const parsedBalance = parseFloat(storedBalance);
          if (!isNaN(parsedBalance) && parsedBalance > currentPersistedBalance) {
            currentPersistedBalance = parsedBalance;
          }
        }
      } catch (e) {
        console.error("Failed to read current stored balance:", e);
      }
      
      // Mettre à jour le solde cumulatif interne
      const updatedBalance = currentPersistedBalance + randomGain;
      cumulativeBalanceRef.current = updatedBalance;
      
      // Toujours stocker en localStorage pour persistence entre les rendus
      try {
        localStorage.setItem('lastKnownBalance', updatedBalance.toString());
        localStorage.setItem('currentBalance', updatedBalance.toString());
      } catch (e) {
        console.error("Failed to store updated balance in localStorage:", e);
      }
      
      console.log(`[SessionOperations] Updated cumulative balance: ${currentPersistedBalance} + ${randomGain} = ${updatedBalance}`);
      
      // Déclencher l'événement d'analyse complète avec le gain
      triggerDashboardEvent('analysis-complete', { 
        gain: randomGain, 
        noEffects: true, // Désactiver les effets visuels excessifs
        background: true 
      });
      
      // Mettre à jour le solde de l'utilisateur avec forceUpdate à true pour mise à jour UI immédiate
      await updateBalance(
        randomGain,
        `Notre système d'analyse de contenu vidéo a généré ${randomGain.toFixed(2)}€ de revenus. Performance basée sur le niveau d'abonnement ${userData.subscription}.`,
        true // Toujours forcer la mise à jour UI immédiate
      );
      
      // Déclencher directement l'événement de mise à jour du solde avec le solde actuel et le gain
      const balanceEvent = new CustomEvent('balance:update', {
        detail: { 
          amount: randomGain,
          currentBalance: updatedBalance
        }
      });
      window.dispatchEvent(balanceEvent);

      // Force-update balance display to ensure consistent UI
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: updatedBalance,
          gain: randomGain,
          transactionDate: new Date().toISOString()
        }
      }));

      // Afficher une notification pour la première session ou aléatoirement pour les suivantes
      if (isFirst || Math.random() > 0.6) {
        toast({
          title: "Analyse terminée",
          description: `Algorithme d'analyse vidéo: +${randomGain.toFixed(2)}€ comptabilisés`,
          className: "mobile-toast",
          duration: 4000
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
          line: "Limite journalière atteinte. Analyses automatiques suspendues.",
          background: true
        });
      }
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      toast({
        title: "Erreur système",
        description: "Une erreur technique est survenue. Réessayer ultérieurement.",
        variant: "destructive",
        className: "mobile-toast",
        duration: 4000
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
    isSessionInProgress: () => sessionInProgress.current,
    getCurrentBalance: () => cumulativeBalanceRef.current || 0
  };
};
