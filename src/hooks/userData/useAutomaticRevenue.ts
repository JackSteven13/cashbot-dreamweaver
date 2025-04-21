
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import balanceManager from '@/utils/balance/balanceManager';
import { addTransaction, calculateTodaysGains } from '@/utils/user/transactionUtils';
import { respectsDailyLimit } from '@/utils/subscription/sessionManagement';

export const useAutomaticRevenue = (
  userData: UserData | null, 
  updateBalance: (gain: number, report: string, forceUpdate: boolean) => Promise<void>,
  isNewUser: boolean
) => {
  const [isBotActive, setIsBotActive] = useState(false);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  
  // Calcul du pourcentage de la limite atteinte
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Obtenir les gains quotidiens depuis le gestionnaire centralisé
    const dailyGains = balanceManager.getDailyGains();
    
    // Calculer le pourcentage de la limite quotidienne
    const percentage = Math.min(100, (dailyGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // Vérifier si la limite est atteinte
    const isLimitReached = dailyGains >= limit * 0.99; // 99% de la limite
    setLimitReached(isLimitReached);
    
    // Si le pourcentage atteint 99%, désactiver le bot automatiquement
    if (isLimitReached && isBotActive) {
      setIsBotActive(false);
      console.log("Désactivation automatique du bot : limite quotidienne atteinte");
    }
  }, [userData, isBotActive, isNewUser]);
  
  // Écouter les événements externes qui modifient l'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const isActive = event.detail?.active;
      if (typeof isActive === 'boolean') {
        console.log(`Mise à jour de l'état du bot dans useAutomaticRevenue: ${isActive ? 'actif' : 'inactif'}`);
        setIsBotActive(isActive);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, []);
  
  // Fonction de génération de revenus automatiques avec respect strict des limites
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || isNewUser || !isBotActive || limitReached) {
      return false;
    }
    
    try {
      // Récupérer le montant total déjà gagné aujourd'hui depuis le gestionnaire centralisé
      let todaysGains = balanceManager.getDailyGains();
      
      // Vérification supplémentaire avec les transactions de la base de données
      if (!forceUpdate) {
        const actualGains = await calculateTodaysGains(userData.id);
        
        // Si les gains réels sont supérieurs à nos gains locaux, mettre à jour notre suivi local
        if (actualGains > todaysGains) {
          console.log(`Mise à jour des gains quotidiens: ${todaysGains}€ -> ${actualGains}€ (d'après les transactions en DB)`);
          todaysGains = actualGains;
          balanceManager.setDailyGains(actualGains);
        }
      }
      
      // Déterminer la limite quotidienne basée sur l'abonnement
      const effectiveSub = getEffectiveSubscription(userData.subscription);
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Vérifier si la limite est atteinte (avec une marge de 1%)
      if (todaysGains >= dailyLimit * 0.99) {
        console.log(`Limite quotidienne atteinte: ${todaysGains}€/${dailyLimit}€`);
        setLimitReached(true);
        setIsBotActive(false);
        return false;
      }
      
      // Générer un gain aléatoire (plus petit pour les sessions automatiques)
      const minGain = 0.01;
      const maxGain = effectiveSub === 'freemium' ? 0.03 : 0.08;
      const potentialGain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Vérifier et ajuster le gain pour respecter strictement la limite quotidienne
      const { allowed, adjustedGain } = respectsDailyLimit(
        effectiveSub,
        todaysGains,
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
      
      console.log(`Revenu automatique généré: ${finalGain}€`);
      
      // Déclencher l'animation de mise à jour du solde
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { amount: finalGain, animate: true } 
      }));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération de revenus automatiques:", error);
      return false;
    }
  }, [userData, isNewUser, isBotActive, limitReached, updateBalance]);
  
  return {
    isBotActive,
    setIsBotActive,
    dailyLimitProgress,
    limitReached,
    generateAutomaticRevenue
  };
};

export default useAutomaticRevenue;
