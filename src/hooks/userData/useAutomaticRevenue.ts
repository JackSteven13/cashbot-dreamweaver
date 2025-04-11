
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription';
import { getDailyGains } from '@/utils/balance/balanceManager';

// Constantes pour les revenus automatiques
const BOT_INTERVAL_MS = 25000; // 25 secondes entre chaque génération automatique
const MIN_GAIN = 0.01;
const MAX_GAIN = 0.05;

/**
 * Hook pour gérer la génération automatique de revenus
 */
export const useAutomaticRevenue = (
  userData: UserData | null,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  isNewUser: boolean
) => {
  // États pour le suivi du bot
  const [isBotActive, setIsBotActive] = useState(false);
  const [dailyLimitProgress, setDailyLimitProgress] = useState(0);
  
  // Référence pour le timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGenerationRef = useRef<number>(0);
  
  // Vérifier et mettre à jour la progression de la limite quotidienne
  useEffect(() => {
    if (!userData) return;
    
    // Calcul de la progression
    const dailyGains = getDailyGains();
    const subscription = userData.subscription || 'freemium';
    const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Mettre à jour la progression
    const progress = Math.min(100, (dailyGains / dailyLimit) * 100);
    setDailyLimitProgress(progress);
    
    // Déterminer si le bot doit être actif
    const shouldBotBeActive = progress < 100 && !isNewUser;
    setIsBotActive(shouldBotBeActive);
    
    // Enregistrer l'état du bot dans le stockage local
    try {
      localStorage.setItem('botActive', shouldBotBeActive.toString());
    } catch (e) {
      console.error('Erreur lors de l\'enregistrement de l\'état du bot:', e);
    }
  }, [userData, isNewUser]);
  
  // Fonction pour générer des revenus automatiques
  const generateAutomaticRevenue = useCallback(async (force = false): Promise<void> => {
    if (!userData || isNewUser) return;
    
    // Vérifier si le bot est actif
    if (!isBotActive && !force) return;
    
    // Vérifier si la limite quotidienne est atteinte
    if (dailyLimitProgress >= 100) {
      console.log('Limite quotidienne atteinte, pas de génération automatique');
      return;
    }
    
    // Vérifier si nous avons généré récemment
    const now = Date.now();
    if (now - lastGenerationRef.current < BOT_INTERVAL_MS && !force) {
      console.log('Génération trop rapprochée, attente...');
      return;
    }
    
    // Générer un gain aléatoire
    const subscription = userData.subscription || 'freemium';
    let gainMultiplier = 1;
    
    // Ajuster le multiplicateur selon l'abonnement
    switch (subscription) {
      case 'gold':
        gainMultiplier = 2.5;
        break;
      case 'elite':
        gainMultiplier = 4;
        break;
      case 'starter':
        gainMultiplier = 1.5;
        break;
      default:
        gainMultiplier = 1;
    }
    
    // Calculer le gain
    const baseGain = MIN_GAIN + Math.random() * (MAX_GAIN - MIN_GAIN);
    const adjustedGain = parseFloat((baseGain * gainMultiplier).toFixed(2));
    
    try {
      // Mettre à jour le solde
      await updateBalance(
        adjustedGain,
        `Bot: ${subscription} - Analyse automatique`,
        true
      );
      
      // Mettre à jour le timestamp
      lastGenerationRef.current = now;
      
      console.log(`Revenu automatique généré: ${adjustedGain}€`);
    } catch (error) {
      console.error('Erreur lors de la génération de revenus automatiques:', error);
    }
  }, [userData, isNewUser, isBotActive, dailyLimitProgress, updateBalance]);
  
  // Configurer le timer pour la génération automatique
  useEffect(() => {
    // Nettoyer tout timer existant
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Si le bot est actif, démarrer le timer
    if (isBotActive && !isNewUser) {
      timerRef.current = setInterval(() => {
        generateAutomaticRevenue();
      }, BOT_INTERVAL_MS);
    }
    
    // Nettoyage
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isBotActive, isNewUser, generateAutomaticRevenue]);
  
  return {
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue
  };
};
