
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';

export const useAutomaticRevenue = (
  userData: UserData | null, 
  updateBalance: (gain: number, report: string, forceUpdate: boolean) => Promise<void>,
  isNewUser: boolean
) => {
  const [isBotActive, setIsBotActive] = useState(false);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  
  // Calcul du pourcentage de la limite atteinte
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculer les gains quotidiens à partir des transactions du jour
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const todaysTransactions = userData.transactions.filter(tx => 
      tx.date && tx.date.startsWith(today) && (tx.gain || 0) > 0
    );
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
    // Calculer le pourcentage de la limite quotidienne
    const percentage = Math.min(100, (todaysGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // Si le pourcentage atteint 100%, désactiver le bot automatiquement
    if (percentage >= 100 && isBotActive) {
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
  
  // Fonction de génération de revenus automatiques
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || isNewUser || !isBotActive) {
      return;
    }
    
    try {
      // Générer un gain aléatoire basé sur le type d'abonnement
      const minGain = 0.01;
      const maxGain = 0.15;
      const gain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Créer un rapport pour la transaction
      const report = `Analyse automatique de contenu`;
      
      // Mettre à jour le solde avec le gain généré
      await updateBalance(gain, report, forceUpdate);
      
      console.log(`Revenu automatique généré: ${gain}€`);
      
      // Planifier la prochaine génération
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération de revenus automatiques:", error);
      return false;
    }
  }, [userData, isNewUser, isBotActive, updateBalance]);
  
  return {
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};

export default useAutomaticRevenue;
