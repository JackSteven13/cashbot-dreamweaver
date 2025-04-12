
import { useState, useEffect, useRef } from 'react';
import { useUserData } from './userData';
import { toast } from '@/components/ui/use-toast';

const REVENUE_INTERVALS = {
  freemium: { min: 60000, max: 180000, amount: { min: 0.01, max: 0.03 } },
  starter: { min: 45000, max: 120000, amount: { min: 0.03, max: 0.08 } },
  gold: { min: 30000, max: 90000, amount: { min: 0.08, max: 0.15 } },
  elite: { min: 15000, max: 45000, amount: { min: 0.15, max: 0.25 } }
};

export const useAutomaticRevenue = () => {
  const { 
    userData,
    isNewUser,
    showLimitAlert,
    userActions,
    dailyLimitProgress
  } = useUserData();
  
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const limitCheckedRef = useRef(false);
  const iterationsRef = useRef(0);
  
  const calculateNextInterval = (subscription: string) => {
    const settings = REVENUE_INTERVALS[subscription as keyof typeof REVENUE_INTERVALS] || REVENUE_INTERVALS.freemium;
    const baseMin = settings.min;
    const baseMax = settings.max;
    
    let varianceFactor = 1;
    
    // Ajouter de la variance pour éviter la prédictibilité
    if (iterationsRef.current > 0) {
      // Plus d'itérations = plus de variance
      const variancePercent = Math.min(50, iterationsRef.current * 5);
      const randomVariance = (Math.random() * variancePercent / 100) - (variancePercent / 200);
      varianceFactor = 1 + randomVariance;
    }
    
    // Appliquer la variance sur l'intervalle
    const min = Math.max(baseMin * 0.6, baseMin * varianceFactor);
    const max = Math.min(baseMax * 1.4, baseMax * varianceFactor);
    
    return Math.floor(min + Math.random() * (max - min));
  };
  
  const calculateRevenueAmount = (subscription: string) => {
    const settings = REVENUE_INTERVALS[subscription as keyof typeof REVENUE_INTERVALS] || REVENUE_INTERVALS.freemium;
    let { min, max } = settings.amount;
    
    // Convertir les chaînes en nombres si nécessaire
    if (typeof min === 'string') min = parseFloat(min);
    if (typeof max === 'string') max = parseFloat(max);
    
    return +(min + Math.random() * (max - min)).toFixed(2);
  };
  
  const checkLimitAndGenerateRevenue = async () => {
    if (!isMountedRef.current || !userData) return;
    
    try {
      // Vérifier si la limite quotidienne est déjà atteinte
      if (showLimitAlert || dailyLimitProgress >= 100) {
        console.log("Limite quotidienne atteinte, arrêt de la génération automatique");
        setIsRunning(false);
        return;
      }
      
      // Générer un revenu automatique
      const subscription = userData.subscription || 'freemium';
      const amount = calculateRevenueAmount(subscription);
      
      // Limiter les notifications de génération automatique
      if (iterationsRef.current % 3 === 0) {
        // Show toast only every few iterations to avoid spam
        toast({
          title: "Bot actif",
          description: `Analyse publicitaire en cours...`,
          variant: "default"
        });
      }
      
      // Mettre à jour le solde avec un rapport automatique
      await userActions.updateBalance(
        amount, 
        `Analyse publicitaire automatique : +${amount}€`,
        iterationsRef.current % 5 === 0 // Force update every 5 iterations
      );
      
      // Incrémenter le compteur d'itérations
      iterationsRef.current += 1;
      
      // Planifier la prochaine génération automatique
      if (isMountedRef.current && !showLimitAlert) {
        const nextInterval = calculateNextInterval(subscription);
        timerRef.current = window.setTimeout(checkLimitAndGenerateRevenue, nextInterval);
      }
    } catch (error) {
      console.error("Erreur lors de la génération automatique de revenus:", error);
    }
  };
  
  // Démarrer ou arrêter la génération automatique
  useEffect(() => {
    const isBotActive = localStorage.getItem(`botActive_${userData?.profile?.id}`) === 'true';
    
    // Si le bot est actif et que la limite n'est pas atteinte, démarrer la génération
    if (userData && isBotActive && !isNewUser && !showLimitAlert) {
      if (!isRunning) {
        setIsRunning(true);
        // Démarrer avec un court délai initial
        timerRef.current = window.setTimeout(checkLimitAndGenerateRevenue, 5000);
      }
    } else if (isRunning) {
      // Arrêter la génération si le bot est désactivé ou la limite atteinte
      setIsRunning(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Nettoyage lors du démontage
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [userData, isNewUser, showLimitAlert]);
  
  // Effet de nettoyage lors du démontage complet
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
  
  return {
    isRunning
  };
};

export default useAutomaticRevenue;
