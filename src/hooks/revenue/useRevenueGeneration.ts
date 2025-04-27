
/**
 * Hook optimisé pour la génération de revenus automatiques avec respect strict des limites
 * et des incréments BEAUCOUP PLUS RÉALISTES et crédibles
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
  const [lastGainAmount, setLastGainAmount] = useState(0);
  const [consecutiveGenerationCount, setConsecutiveGenerationCount] = useState(0);
  
  const isInitialized = useRef(false);
  const todaysGainsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction pour vérifier et mettre à jour l'état des limites quotidiennes
  const checkDailyLimits = useCallback(async () => {
    if (!userData) return null;
    
    try {
      // Récupérer les gains quotidiens depuis la base de données
      const serverGains = await calculateTodaysGains(userData.id);
      
      // Récupérer les gains quotidiens depuis le gestionnaire local
      const localGains = balanceManager.getDailyGains();
      
      // Choisir la valeur la plus élevée pour être conservateur
      const actualGains = Math.max(serverGains, localGains);
      
      if (Math.abs(localGains - serverGains) > 0.1) {
        console.log(`Synchronisation des gains quotidiens: local=${localGains}€, serveur=${serverGains}€`);
        balanceManager.syncDailyGainsFromTransactions(actualGains);
      }
      
      todaysGainsRef.current = actualGains;
      
      // Calculer le pourcentage de la limite atteinte
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      const percentage = Math.min(100, (actualGains / limit) * 100);
      setDailyLimitProgress(percentage);
      
      // Vérifier si la limite est atteinte ou presque (90%)
      const isAtLimit = actualGains >= limit * 0.9;
      
      if (isAtLimit !== limitReached) {
        setLimitReached(isAtLimit);
        
        if (isAtLimit && isBotActive) {
          console.log(`Limite quotidienne atteinte: ${actualGains}€/${limit}€, désactivation du bot`);
          setIsBotActive(false);
          
          // Enregistrer dans localStorage que la limite est atteinte
          localStorage.setItem(`freemium_daily_limit_reached_${userData.id || 'anonymous'}`, 'true');
          
          if (percentage >= 90) {
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
    
    // Stocker l'abonnement actuel dans localStorage pour que le balanceManager y ait accès
    if (userData.subscription) {
      localStorage.setItem('currentSubscription', userData.subscription);
    }
    
    // Vérification périodique des limites (toutes les 30 secondes)
    const checkInterval = setInterval(() => {
      checkDailyLimits();
    }, 30000);
    
    return () => clearInterval(checkInterval);
  }, [userData, checkDailyLimits]);
  
  // Fonction principale de génération de revenus avec contrôles de fréquence et de montant
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false): Promise<boolean> => {
    if (!userData || limitReached || !isBotActive) {
      return false;
    }
    
    try {
      // NOUVEAU: Vérifier les gains récents et espacer les générations
      const now = Date.now();
      const timeSinceLastGeneration = now - lastGenerationTime;
      
      // Imposer un délai entre les générations pour éviter les augmentations irréalistes
      // (sauf premier lancement avec forceUpdate)
      if (!forceUpdate && timeSinceLastGeneration < 60000) { // Au moins 1 minute entre chaque gain
        console.log("Génération trop rapprochée, skipping...");
        return false;
      }
      
      // NOUVEAU: Contrôle anti-spam pour éviter les gains trop fréquents
      if (consecutiveGenerationCount > 5) {
        // Au-delà de 5 gains consécutifs rapprochés, imposer un délai obligatoire plus long
        const cooldownPeriod = 180000; // 3 minutes de cooldown
        
        if (timeSinceLastGeneration < cooldownPeriod) {
          console.log(`Trop de générations consécutives, cooldown de ${(cooldownPeriod - timeSinceLastGeneration)/1000}s restant`);
          return false;
        } else {
          // Réinitialiser après un délai suffisant
          setConsecutiveGenerationCount(0);
        }
      }
      
      // Mettre à jour le timestamp de la dernière génération
      setLastGenerationTime(now);
      
      // Vérifier les limites quotidiennes avant de générer des revenus
      const limitsCheck = await checkDailyLimits();
      
      if (!limitsCheck) {
        console.error("Impossible de vérifier les limites quotidiennes");
        return false;
      }
      
      const { actualGains, limit } = limitsCheck;
      
      // Si on est à 85% de la limite, ne pas générer de gains (plus stricte qu'avant)
      if (actualGains >= limit * 0.85) {
        console.log(`Limite quotidienne presque atteinte: ${actualGains}€/${limit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        
        // Enregistrer dans localStorage que la limite est atteinte
        localStorage.setItem(`freemium_daily_limit_reached_${userData.id || 'anonymous'}`, 'true');
        
        return false;
      }
      
      // NOUVEAU: Générer un gain beaucoup plus petit et réaliste
      // Plus le nombre de générations consécutives est élevé, plus le gain est petit
      const reductionFactor = Math.min(consecutiveGenerationCount * 0.1 + 1, 2);
      const minGain = (userData.subscription === 'freemium' ? 0.001 : 0.0025) / reductionFactor;
      const maxGain = (userData.subscription === 'freemium' ? 0.005 : 0.01) / reductionFactor;
      
      // Gains très petits et réalistes
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(3));
      
      // NOUVEAU: Contrôle pour éviter les gains cumulés trop importants
      if (lastGainAmount > 0 && (potentialGain + lastGainAmount) > 0.05) {
        console.log("Gain cumulé trop important, réduction");
        // Réduire davantage si le gain cumulé serait trop important
        const adjustedPotentialGain = Math.min(potentialGain, 0.03 - lastGainAmount);
        
        // Si vraiment trop de gains, bloquer temporairement
        if (adjustedPotentialGain <= 0.001) {
          console.log("Trop de gains récents, skip pour éviter suspicion");
          return false;
        }
      }
      
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
        
        // Enregistrer dans localStorage que la limite est atteinte
        localStorage.setItem(`freemium_daily_limit_reached_${userData.id || 'anonymous'}`, 'true');
        
        return false;
      }
      
      // Utiliser le gain ajusté (qui peut être égal au gain potentiel si dans les limites)
      const finalGain = adjustedGain;
      
      // Vérification supplémentaire avec balanceManager pour être sûr de ne pas dépasser la limite
      if (!balanceManager.addDailyGain(finalGain)) {
        console.log("BalanceManager a rejeté l'ajout de gain - limite atteinte");
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }
      
      // Vérifier que le gain final ne dépasse pas la limite restante
      const remainingLimit = limit - actualGains;
      if (finalGain > remainingLimit * 0.9) {
        console.log(`Gain ajusté pour respecter la limite restante: ${finalGain}€ -> ${remainingLimit * 0.9}€`);
        // Ne pas générer de gains trop proches de la limite
        return false;
      }
      
      // Mettre à jour le compteur de générations consécutives
      setConsecutiveGenerationCount(prev => prev + 1);
      setLastGainAmount(finalGain);
      
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
      const updated = balanceManager.updateBalance(finalGain);
      if (!updated) {
        console.error("BalanceManager a rejeté la mise à jour du solde");
        return false;
      }
      
      console.log(`Revenu automatique généré: ${finalGain}€`);
      terminalAnimation.complete(finalGain);
      
      // Déclencher des événements pour les animations
      triggerDashboardEvent('activity', { level: 'medium' });
      
      // Déclencher l'animation de mise à jour du solde
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { amount: finalGain, animate: true } 
      }));
      
      // Réinitialiser le gain après un délai aléatoire pour permettre des gains ultérieurs
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setLastGainAmount(0);
      }, 120000 + Math.random() * 60000);
      
      return true;
    } catch (error) {
      console.error("Error generating automatic revenue:", error);
      return false;
    }
  }, [userData, limitReached, isBotActive, lastGenerationTime, consecutiveGenerationCount, lastGainAmount, updateBalance, checkDailyLimits]);
  
  // Écouter les événements de limite atteinte
  useEffect(() => {
    const handleLimitReached = () => {
      setLimitReached(true);
      setIsBotActive(false);
    };
    
    window.addEventListener('daily-limit:reached' as any, handleLimitReached);
    
    return () => {
      window.removeEventListener('daily-limit:reached' as any, handleLimitReached);
    };
  }, []);
  
  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};

export default useRevenueGeneration;
