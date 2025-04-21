
/**
 * Hook optimisé pour la génération de revenus automatiques avec respect strict des limites
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { triggerDashboardEvent } from '@/utils/animations/triggerDashboardEvent';
import { addTransaction, calculateTodaysGains } from '@/utils/user/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';

interface UseRevenueGenerationProps {
  userData: UserData | null;
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>;
}

export const useRevenueGeneration = ({
  userData,
  updateBalance
}: UseRevenueGenerationProps) => {
  const [isBotActive, setIsBotActive] = useState(true);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const [lastGenerationTime, setLastGenerationTime] = useState(Date.now() - 60000);
  const [limitReached, setLimitReached] = useState(false);
  
  const isInitialized = useRef(false);
  const todaysGainsRef = useRef(0);
  
  // Fonction pour vérifier et mettre à jour l'état des limites quotidiennes
  const checkDailyLimits = useCallback(async () => {
    if (!userData) return;
    
    try {
      // Récupérer les gains quotidiens depuis la base de données
      const serverGains = await calculateTodaysGains(userData.id);
      
      // Récupérer les gains quotidiens depuis le gestionnaire local
      const localGains = balanceManager.getDailyGains();
      
      // Choisir la valeur la plus élevée pour être conservateur
      const actualGains = Math.max(serverGains, localGains);
      
      if (Math.abs(localGains - serverGains) > 0.1) {
        console.log(`Synchronisation des gains quotidiens: local=${localGains}€, serveur=${serverGains}€`);
        balanceManager.setDailyGains(actualGains);
      }
      
      todaysGainsRef.current = actualGains;
      
      // Calculer le pourcentage de la limite atteinte
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      const percentage = Math.min(100, (actualGains / limit) * 100);
      setDailyLimitProgress(percentage);
      
      // Vérifier si la limite est atteinte ou presque (99%)
      const isAtLimit = actualGains >= limit * 0.99;
      
      if (isAtLimit !== limitReached) {
        setLimitReached(isAtLimit);
        
        if (isAtLimit && isBotActive) {
          console.log(`Limite quotidienne atteinte: ${actualGains}€/${limit}€, désactivation du bot`);
          setIsBotActive(false);
          
          if (percentage >= 100) {
            toast({
              title: "Limite quotidienne atteinte",
              description: `Vous avez atteint votre limite journalière de ${limit}€. Les analyses sont automatiquement suspendues.`,
              duration: 5000
            });
          }
        }
      }
      
      return { actualGains, limit, percentage };
    } catch (error) {
      console.error("Erreur lors de la vérification des limites:", error);
      return null;
    }
  }, [userData, limitReached, isBotActive]);
  
  // Calcul du pourcentage de la limite atteinte
  useEffect(() => {
    if (!userData) {
      setDailyLimitProgress(0);
      return;
    }
    
    // Vérification initiale des limites
    checkDailyLimits();
    
    // Vérification périodique des limites (toutes les 30 secondes)
    const checkInterval = setInterval(() => {
      checkDailyLimits();
    }, 30000);
    
    return () => clearInterval(checkInterval);
  }, [userData, checkDailyLimits]);
  
  // Écouter les événements externes qui modifient l'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        // Vérifier d'abord si la limite n'est pas atteinte avant d'activer
        if (isActive && limitReached) {
          console.log("Tentative d'activation du bot avec limite atteinte, ignorée");
          return;
        }
        
        console.log(`Mise à jour de l'état du bot dans useRevenueGeneration: ${isActive ? 'actif' : 'inactif'}`);
        setIsBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [limitReached]);
  
  // Fonction principale de génération de revenus
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || limitReached || !isBotActive) {
      return false;
    }
    
    try {
      // Mettre à jour le timestamp de la dernière génération
      setLastGenerationTime(Date.now());
      
      // Vérifier les limites quotidiennes avant de générer des revenus
      const limitsCheck = await checkDailyLimits();
      
      if (!limitsCheck) {
        console.error("Impossible de vérifier les limites quotidiennes");
        return false;
      }
      
      const { actualGains, limit } = limitsCheck;
      
      // Si on est à la limite, ne pas générer de gains
      if (actualGains >= limit * 0.99) {
        console.log(`Limite quotidienne atteinte: ${actualGains}€/${limit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }
      
      // Générer un gain aléatoire (plus petit pour les comptes freemium)
      const minGain = userData.subscription === 'freemium' ? 0.01 : 0.02;
      const maxGain = userData.subscription === 'freemium' ? 0.03 : 0.08;
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Vérifier et ajuster le gain pour respecter strictement la limite quotidienne
      const { allowed, adjustedGain } = respectsDailyLimit(
        userData.subscription,
        actualGains,
        potentialGain
      );
      
      // Si le gain est bloqué, arrêter le bot
      if (!allowed) {
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }
      
      // Utiliser le gain ajusté (qui peut être égal au gain potentiel si dans les limites)
      const finalGain = adjustedGain;
      
      // Animation visuelle en arrière-plan
      const terminalAnimation = createBackgroundTerminalSequence(
        ["Analyse de contenu en cours..."], true
      );
      
      // Créer un rapport pour la transaction
      const dayCount = Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (1000 * 3600 * 24));
      const report = `Analyse automatique de contenu (jour ${dayCount})`;
      
      // Enregistrer la transaction dans la base de données
      const transactionAdded = await addTransaction(userData.id, finalGain, report);
      
      if (!transactionAdded) {
        console.error("Échec de l'enregistrement de la transaction");
        return false;
      }
      
      // Mettre à jour le solde avec le gain généré
      await updateBalance(finalGain, report, forceUpdate);
      
      // Mettre à jour le gestionnaire de solde
      balanceManager.updateBalance(finalGain);
      balanceManager.addDailyGain(finalGain);
      
      console.log(`Revenu automatique généré: ${finalGain}€`);
      terminalAnimation.complete(finalGain);
      
      // Déclencher des événements pour les animations
      triggerDashboardEvent('activity', { level: 'medium' });
      
      // Déclencher l'animation de mise à jour du solde
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { amount: finalGain, animate: true } 
      }));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération de revenus automatiques:", error);
      return false;
    }
  }, [userData, limitReached, isBotActive, updateBalance, checkDailyLimits]);
  
  return {
    generateAutomaticRevenue,
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached
  };
};

export default useRevenueGeneration;
