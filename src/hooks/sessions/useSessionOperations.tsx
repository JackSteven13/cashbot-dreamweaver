
import { useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { triggerDashboardEvent } from '@/utils/animations';
import { UserData } from '@/types/userData';
import { calculateAutoSessionGain } from '@/utils/subscription';
import { animateBalanceUpdate } from '@/utils/animations/animateBalanceUpdate';

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
  const highestBalanceRef = useRef<number | null>(null);
  const botStatusRef = useRef(isBotActive);
  
  // Use useEffect to update botStatusRef when isBotActive changes
  useEffect(() => {
    botStatusRef.current = isBotActive;
  }, [isBotActive]);
  
  // Initialiser cumulativeBalanceRef au montage avec localStorage
  useEffect(() => {
    // Essayer de récupérer le solde depuis localStorage
    try {
      const storedHighestBalance = localStorage.getItem('highestBalance');
      const storedBalance = localStorage.getItem('lastKnownBalance') || localStorage.getItem('currentBalance');
      
      if (storedHighestBalance) {
        const parsedHighestBalance = parseFloat(storedHighestBalance);
        if (!isNaN(parsedHighestBalance)) {
          highestBalanceRef.current = parsedHighestBalance;
          console.log(`[SessionOperations] Initialized highest balance from localStorage: ${parsedHighestBalance}`);
        }
      }
      
      if (storedBalance) {
        const parsedBalance = parseFloat(storedBalance);
        if (!isNaN(parsedBalance)) {
          // Comparer avec la valeur existante et utiliser la plus élevée
          const maxBalance = Math.max(
            parsedBalance, 
            userData.balance || 0,
            highestBalanceRef.current || 0
          );
          cumulativeBalanceRef.current = maxBalance;
          highestBalanceRef.current = maxBalance;
          console.log(`[SessionOperations] Initialized cumulative balance: ${maxBalance}`);
          
          // S'assurer que localStorage est à jour avec la valeur maximale
          localStorage.setItem('currentBalance', maxBalance.toString());
          localStorage.setItem('lastKnownBalance', maxBalance.toString());
          localStorage.setItem('highestBalance', maxBalance.toString());
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
        // Ne mettre à jour que si le nouveau solde est plus élevé
        const currentBalance = cumulativeBalanceRef.current || 0;
        const currentHighest = highestBalanceRef.current || 0;
        
        if (newBalance > currentBalance) {
          cumulativeBalanceRef.current = newBalance;
          console.log(`[SessionOperations] Updated cumulative balance: ${newBalance}`);
          
          // Mettre à jour aussi le solde le plus élevé si nécessaire
          if (newBalance > currentHighest) {
            highestBalanceRef.current = newBalance;
            localStorage.setItem('highestBalance', newBalance.toString());
          }
        }
      }
    };
    
    window.addEventListener('balance:local-update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:local-update' as any, handleBalanceUpdate);
    };
  }, [userData.balance]);

  /**
   * Generate automatic revenue based on subscription type and limits
   * Amélioration: gains plus fréquents et visibilité améliorée
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

      // Toujours récupérer le solde le plus à jour depuis localStorage ou notre référence
      let currentPersistedBalance = 0;
      if (cumulativeBalanceRef.current !== null) {
        currentPersistedBalance = cumulativeBalanceRef.current;
      } else {
        // Essayer de récupérer depuis localStorage
        try {
          const storedBalance = localStorage.getItem('currentBalance') || localStorage.getItem('lastKnownBalance');
          if (storedBalance) {
            const parsedBalance = parseFloat(storedBalance);
            if (!isNaN(parsedBalance)) {
              currentPersistedBalance = parsedBalance;
              cumulativeBalanceRef.current = parsedBalance;
            } else {
              currentPersistedBalance = userData.balance || 0;
              cumulativeBalanceRef.current = currentPersistedBalance;
            }
          } else {
            currentPersistedBalance = userData.balance || 0;
            cumulativeBalanceRef.current = currentPersistedBalance;
          }
        } catch (e) {
          console.error("Failed to read from localStorage:", e);
          currentPersistedBalance = userData.balance || 0;
          cumulativeBalanceRef.current = currentPersistedBalance;
        }
      }
      
      // Utiliser le solde le plus élevé pour les calculs mais limité par la limite journalière
      const highestBalance = highestBalanceRef.current || currentPersistedBalance;
      const effectiveBalance = Math.min(highestBalance, dailyLimit - 0.01);
      
      // Calculate remaining allowed gains for today
      const remainingAllowedGains = Math.max(0, dailyLimit - effectiveBalance);
      
      if (remainingAllowedGains <= 0.01) {
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
        
        // Notification toast bien visible
        toast({
          title: "Limite journalière atteinte",
          description: "Vous avez atteint votre limite de gains quotidiens. Revenez demain ou passez à un abonnement supérieur!",
          variant: "destructive",
          duration: 7000,
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
      
      // Assurer une animation fluide en déclenchant l'événement de début d'analyse
      triggerDashboardEvent('analysis-start', { background: true, animate: true });
      
      // Simuler l'animation du terminal dans le dashboard - sans écran de chargement
      triggerDashboardEvent('terminal-update', { 
        line: "Initialisation de l'analyse du contenu vidéo...",
        background: true,
        animate: true
      });
      
      // Attendre un court instant pour le retour visuel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      triggerDashboardEvent('terminal-update', { 
        line: "Traitement des données algorithmiques...",
        background: true,
        animate: true
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
      let baseGain = calculateAutoSessionGain(
        userData.subscription, 
        todaysGains, 
        userData.referrals?.length || 0
      );
      
      // Boost pour les utilisateurs récents (moins d'une semaine)
      const userCreationDate = userData?.profile?.created_at ? new Date(userData.profile.created_at) : 
                               userData?.registeredAt || null;
      const currentDate = new Date();
      const isNewUser = userCreationDate && 
        (currentDate.getTime() - userCreationDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
        
      if (isNewUser && userData.subscription === 'freemium') {
        baseGain *= 3; // Triple des gains pour les nouveaux utilisateurs freemium
      } else if (userData.subscription === 'freemium') {
        baseGain *= 1.5; // 50% de boost pour tous les utilisateurs freemium
      }
      
      // S'assurer de ne pas dépasser la limite journalière
      const randomGain = Math.min(baseGain, remainingAllowedGains);
      
      // Mettre à jour le terminal avec un message de succès
      triggerDashboardEvent('terminal-update', { 
        line: `Analyse complétée. Optimisation des résultats: ${randomGain.toFixed(2)}€`,
        background: true,
        animate: true
      });
      
      // Mettre à jour le tracker des gains journaliers
      todaysGainsRef.current += randomGain;
      
      // Récupérer la dernière valeur du solde persisté pour assurer la cohérence
      let updatedBalance = currentPersistedBalance + randomGain;
      
      // Mettre à jour le solde le plus élevé si nécessaire
      if (updatedBalance > (highestBalanceRef.current || 0)) {
        highestBalanceRef.current = updatedBalance;
      }
      
      // Mettre à jour le solde cumulatif interne
      cumulativeBalanceRef.current = updatedBalance;
      
      // Toujours stocker en localStorage pour persistence entre les rendus
      try {
        localStorage.setItem('lastKnownBalance', updatedBalance.toString());
        localStorage.setItem('currentBalance', updatedBalance.toString());
        localStorage.setItem('highestBalance', (highestBalanceRef.current || updatedBalance).toString());
      } catch (e) {
        console.error("Failed to store updated balance in localStorage:", e);
      }
      
      console.log(`[SessionOperations] Updated cumulative balance: ${currentPersistedBalance} + ${randomGain} = ${updatedBalance}`);
      
      // Déclencher l'événement d'analyse complète avec le gain
      // IMPORTANT: S'assurer que le noEffects est false pour permettre les animations
      triggerDashboardEvent('analysis-complete', { 
        gain: randomGain, 
        noEffects: false, 
        background: false, // Passer à false pour permettre les animations
        animate: true // Ajout d'un flag spécifique pour l'animation
      });
      
      // AMÉLIORATION: Déclencher directement l'événement de mise à jour du solde 
      // avec animation visible pour une meilleure expérience utilisateur
      window.dispatchEvent(new CustomEvent('balance:update', {
        detail: { 
          amount: randomGain,
          currentBalance: updatedBalance,
          animate: true,
          userId: userData.user_id || userData.profile?.id 
        }
      }));

      // AMÉLIORATION: Forcer la mise à jour de l'affichage du solde avec animation
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: updatedBalance,
          gain: randomGain,
          animate: true,
          transactionDate: new Date().toISOString(),
          userId: userData.user_id || userData.profile?.id
        }
      }));

      // Afficher une notification pour la première session ou aléatoirement pour les suivantes
      if (isFirst || Math.random() > 0.4) {
        toast({
          title: `+${randomGain.toFixed(2)}€ Générés!`,
          description: `Algorithme d'analyse vidéo: génération réussie. Total: ${updatedBalance.toFixed(2)}€`,
          className: "mobile-toast toast-notification",
          duration: 6000
        });
      }
      
      // Mettre à jour le solde de l'utilisateur avec forceUpdate à true pour mise à jour UI immédiate
      await updateBalance(
        randomGain,
        `Notre système d'analyse de contenu vidéo a généré ${randomGain.toFixed(2)}€ de revenus. Performance basée sur le niveau d'abonnement ${userData.subscription}.`,
        true // Toujours forcer la mise à jour UI immédiate
      );
      
      // Vérifier si nous avons atteint la limite journalière après cette transaction
      if (updatedBalance >= dailyLimit) {
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
    getCurrentBalance: () => {
      // Toujours retourner la valeur la plus élevée
      const currentBalance = cumulativeBalanceRef.current || 0;
      const highestBalance = highestBalanceRef.current || 0;
      return Math.max(currentBalance, highestBalance);
    }
  };
};
