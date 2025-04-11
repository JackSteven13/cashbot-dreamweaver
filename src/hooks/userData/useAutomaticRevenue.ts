
import { useState, useEffect, useCallback } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';

/**
 * Hook pour gérer les revenus automatiques
 */
export const useAutomaticRevenue = (
  userData: UserData | null,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  isNewUser: boolean
) => {
  // État pour savoir si le bot est actif
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  // Progression vers la limite quotidienne (en pourcentage)
  const [dailyLimitProgress, setDailyLimitProgress] = useState<number>(0);
  
  // Effet d'initialisation - vérifier l'état stocké du bot
  useEffect(() => {
    try {
      // Essayer de récupérer l'état stocké du bot
      const storedBotActive = localStorage.getItem('botActive');
      if (storedBotActive !== null) {
        setIsBotActive(storedBotActive === 'true');
      } else {
        // Par défaut, activer le bot pour les utilisateurs existants
        setIsBotActive(!isNewUser);
        localStorage.setItem('botActive', !isNewUser ? 'true' : 'false');
      }
    } catch (e) {
      console.error("Erreur lors de la récupération de l'état du bot:", e);
      // Par défaut, l'activer quand même
      setIsBotActive(!isNewUser);
    }
  }, [isNewUser]);
  
  // Mettre à jour la progression de la limite quotidienne
  useEffect(() => {
    if (!userData || isNewUser) {
      setDailyLimitProgress(0);
      return;
    }
    
    // Obtenir la limite de l'abonnement
    const subscription = userData.subscription || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculer les gains du jour
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = userData.transactions?.filter(tx => 
      tx.date?.startsWith(today) && tx.gain > 0
    ) || [];
    
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
    // Calculer le pourcentage de progression
    const progress = Math.min(100, (todaysGains / dailyLimit) * 100);
    setDailyLimitProgress(progress);
    
    // Si la limite est atteinte, désactiver le bot
    if (progress >= 100 && isBotActive) {
      setIsBotActive(false);
      localStorage.setItem('botActive', 'false');
      
      // Déclencher un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('bot:status-change', {
        detail: { active: false, reason: 'limitReached' }
      }));
    }
  }, [userData, isNewUser, isBotActive]);
  
  // Écouter les demandes externes de changement d'état du bot
  useEffect(() => {
    const handleExternalStatusChange = (event: CustomEvent) => {
      const newStatus = event.detail?.active;
      const checkLimit = event.detail?.checkLimit;
      const subscription = event.detail?.subscription || 'freemium';
      const balance = event.detail?.balance || 0;
      
      if (typeof newStatus !== 'boolean') return;
      
      // Si on veut activer et qu'on demande de vérifier la limite
      if (newStatus && checkLimit) {
        // Obtenir la limite quotidienne
        const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
        
        // Si le solde dépasse déjà la limite, ne pas activer
        if (balance >= dailyLimit) {
          // Ne pas changer l'état mais notifier qu'on a refusé
          window.dispatchEvent(new CustomEvent('bot:activation-rejected', {
            detail: { reason: 'limitReached' }
          }));
          return;
        }
      }
      
      // Mettre à jour l'état
      setIsBotActive(newStatus);
      localStorage.setItem('botActive', newStatus ? 'true' : 'false');
    };
    
    window.addEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    
    return () => {
      window.removeEventListener('bot:external-status-change' as any, handleExternalStatusChange);
    };
  }, []);
  
  // Fonction pour générer des revenus automatiques
  const generateAutomaticRevenue = useCallback((isInitial: boolean = false) => {
    // Ne rien faire pour les nouveaux utilisateurs ou si le bot est inactif
    if (isNewUser || !isBotActive || !userData) {
      return;
    }
    
    // Déterminer le type d'abonnement pour les montants et intervalles
    const subscription = userData.subscription || 'freemium';
    
    // Configurer les montants en fonction de l'abonnement
    let minAmount = 0.01;
    let maxAmount = 0.05;
    let baseInterval = 60000; // 1 minute par défaut
    
    switch (subscription) {
      case 'premium':
        minAmount = 0.02;
        maxAmount = 0.08;
        baseInterval = 45000; // 45 secondes
        break;
      case 'pro':
        minAmount = 0.03;
        maxAmount = 0.10;
        baseInterval = 30000; // 30 secondes
        break;
      case 'expert':
        minAmount = 0.05;
        maxAmount = 0.15;
        baseInterval = 20000; // 20 secondes
        break;
      default:
        // Freemium et starter conservent les valeurs par défaut
        break;
    }
    
    // Ajouter de la variabilité à l'intervalle (±20%)
    const interval = baseInterval * (0.8 + Math.random() * 0.4);
    
    // Générer un gain aléatoire dans la plage définie
    const gain = parseFloat((minAmount + Math.random() * (maxAmount - minAmount)).toFixed(2));
    
    // Message de rapport pour la transaction
    const report = `Analyse automatique de contenu ${subscription} - Gain: ${gain.toFixed(2)}€`;
    
    // Mettre à jour le solde avec animation
    updateBalance(gain, report, true);
    
    // Programmer la prochaine génération
    const timer = setTimeout(() => {
      generateAutomaticRevenue(false);
    }, interval);
    
    // Stocker l'horodatage pour statistiques
    localStorage.setItem('lastAutoUpdateTime', new Date().toISOString());
    
    return () => clearTimeout(timer);
  }, [userData, updateBalance, isNewUser, isBotActive]);
  
  return {
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};
