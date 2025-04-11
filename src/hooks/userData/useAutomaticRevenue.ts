
import { useEffect, useRef, useState } from 'react';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { toast } from '@/components/ui/use-toast';
import balanceManager, { getDailyGains } from '@/utils/balance/balanceManager';
import { UserData } from '@/types/userData';

/**
 * Hook pour gérer la génération automatique de revenus
 */
export const useAutomaticRevenue = (
  userData: UserData | null,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  isNewUser: boolean
) => {
  const [isBotActive, setIsBotActive] = useState(true);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  
  // Références pour éviter les re-rendus
  const botActiveRef = useRef(true);
  const initialSessionExecutedRef = useRef(false);
  const generateTimerRef = useRef<number | null>(null);
  const userId = userData?.profile?.id;
  
  // Fonction pour générer un revenu automatique
  const generateAutomaticRevenue = async (isFirst = false): Promise<void> => {
    if (!botActiveRef.current || !userData || isNewUser) {
      console.log("Bot inactif ou utilisateur nouveau, pas de revenus générés");
      return;
    }
    
    // Créer une animation en arrière-plan
    const terminalAnimation = createBackgroundTerminalSequence([
      "Initialisation de l'analyse du contenu vidéo..."
    ], true);
    
    try {
      // Calculer le gain potentiel
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      const actualDailyGains = getDailyGains();
      
      // Vérifier si on a atteint la limite
      const remainingAllowedGains = Math.max(0, dailyLimit - actualDailyGains);
      if (remainingAllowedGains <= 0.01) {
        setIsBotActive(false);
        botActiveRef.current = false;
        terminalAnimation.complete(0);
        
        // Enregistrer l'état du bot
        try {
          localStorage.setItem(`botActive_${userId}`, 'false');
        } catch (e) {
          console.error("Failed to store bot status:", e);
        }
        
        // Notification de limite atteinte
        toast({
          title: "Limite journalière atteinte",
          description: `Vous avez atteint votre limite de ${dailyLimit.toFixed(2)}€ pour aujourd'hui.`,
          duration: 5000,
          variant: "destructive"
        });
        
        return;
      }
      
      // Ajouter des lignes d'animation progressivement
      terminalAnimation.addLine("Traitement des données algorithmiques...");
      
      // Court délai pour simuler le traitement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Générer un gain aléatoire entre 0.01 et 0.1, limité par le montant restant autorisé
      const baseGain = Math.min(
        Math.random() * 0.09 + 0.01,
        remainingAllowedGains
      );
      
      // Arrondir à 2 décimales
      const finalGain = parseFloat(baseGain.toFixed(2));
      
      // Simuler un délai supplémentaire
      await new Promise(resolve => setTimeout(resolve, 600));
      
      terminalAnimation.addLine(`Analyse complétée. Optimisation des résultats: ${finalGain.toFixed(2)}€`);
      
      // Créer un message descriptif pour la transaction
      const transactionReport = `Notre système d'analyse de contenu vidéo a généré ${finalGain.toFixed(2)}€ de revenus. Performance basée sur le niveau d'abonnement ${userData.subscription}.`;
      
      if (userId) {
        // Ajouter d'abord la transaction
        const transactionAdded = await balanceManager.addTransaction(userId, finalGain, transactionReport);
        
        if (transactionAdded) {
          // Mettre à jour la balance avec mise à jour forcée pour actualisation immédiate de l'UI
          await updateBalance(finalGain, transactionReport, true);
          
          // Déclencher un événement de rafraîchissement pour la liste des transactions
          window.dispatchEvent(new CustomEvent('transactions:refresh', {
            detail: { userId }
          }));
          
          // Synchroniser avec la base de données immédiatement après la transaction
          await balanceManager.syncWithDatabase();
          
          // Mettre à jour la progression de la limite quotidienne
          const updatedGains = getDailyGains();
          const percentProgress = Math.min(100, (updatedGains / dailyLimit) * 100);
          setDailyLimitProgress(percentProgress);
        }
      }
      
      // Afficher une notification pour confirmer la génération automatique
      if (isFirst || Math.random() > 0.7) {
        toast({
          title: `Gains automatiques +${finalGain.toFixed(2)}€`,
          description: `L'analyse automatique de contenu vidéo a généré des revenus.`,
          duration: 3000,
        });
      }
      
      // Terminer l'animation avec le gain obtenu
      terminalAnimation.complete(finalGain);
      
      // Si la limite est atteinte, désactiver le bot
      if (getDailyGains() >= dailyLimit) {
        setIsBotActive(false);
        botActiveRef.current = false;
        
        // Enregistrer l'état du bot
        try {
          localStorage.setItem(`botActive_${userId}`, 'false');
        } catch (e) {
          console.error("Failed to store bot status:", e);
        }
        
        toast({
          title: `Limite journalière atteinte`,
          description: `Le robot d'analyse est désactivé jusqu'à demain.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error in generateAutomaticRevenue:", error);
      // Terminer l'animation même en cas d'erreur
      terminalAnimation.complete(0);
    }
  };
  
  // Effet pour gérer les sessions automatiques
  useEffect(() => {
    // Restaurer l'état du bot à partir du localStorage
    try {
      const storedBotStatus = localStorage.getItem(`botActive_${userId}`);
      if (storedBotStatus !== null) {
        const isActive = storedBotStatus === 'true';
        setIsBotActive(isActive);
        botActiveRef.current = isActive;
      }
    } catch (e) {
      console.error("Failed to restore bot status from localStorage:", e);
    }
    
    // Sauter toutes les sessions automatiques si le bot n'est pas actif ou si c'est un nouvel utilisateur
    if (!botActiveRef.current || isNewUser) {
      console.log("Bot inactif ou nouvel utilisateur, aucune session automatique ne sera programmée");
      return () => {
        if (generateTimerRef.current) clearTimeout(generateTimerRef.current);
      };
    }
    
    // Démarrer une session initiale après un court délai si le bot est actif
    generateTimerRef.current = window.setTimeout(() => {
      if (botActiveRef.current && !initialSessionExecutedRef.current && !isNewUser && userData) {
        console.log("[AutoRevenue] Démarrage de la session initiale automatique");
        initialSessionExecutedRef.current = true; // Marquer comme exécuté
        generateAutomaticRevenue(true);
      }
    }, 10000);
    
    // Configurer l'intervalle pour les sessions automatiques (toutes les 2-3 minutes)
    const autoSessionInterval = setInterval(() => {
      if (botActiveRef.current && !isNewUser && userData) {
        // Générer un temps aléatoire pour éviter la prévisibilité
        const randomInterval = Math.random() * 60000 + 120000; // Entre 2 et 3 minutes
        
        // Programmer la prochaine génération
        generateTimerRef.current = window.setTimeout(() => {
          console.log("[AutoRevenue] Génération automatique de revenus");
          generateAutomaticRevenue();
        }, randomInterval);
      }
    }, 180000); // Vérifier toutes les 3 minutes
    
    // Écouter les changements d'état du bot
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        setIsBotActive(isActive);
        botActiveRef.current = isActive;
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    // Nettoyage
    return () => {
      clearInterval(autoSessionInterval);
      if (generateTimerRef.current) clearTimeout(generateTimerRef.current);
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [userData, isNewUser, userId, updateBalance]);
  
  // Calculer le pourcentage de progression vers la limite quotidienne
  useEffect(() => {
    if (userData && !isNewUser) {
      // Obtenir la limite quotidienne en fonction de l'abonnement
      const dailyLimit = SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Obtenir les gains quotidiens actuels
      const actualDailyGains = getDailyGains();
      
      // Calculer le pourcentage de progression
      const percentProgress = Math.min(100, (actualDailyGains / dailyLimit) * 100);
      setDailyLimitProgress(percentProgress);
    }
  }, [userData, isNewUser]);
  
  return {
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};
