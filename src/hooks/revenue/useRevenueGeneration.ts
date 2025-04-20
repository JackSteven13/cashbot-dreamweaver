
/**
 * Hook optimisé pour la génération de revenus automatiques
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserData } from '@/types/userData';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { toast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';
import { triggerDashboardEvent } from '@/utils/animations/triggerDashboardEvent';

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
  
  // Fonction pour calculer le pourcentage de la limite atteinte
  useEffect(() => {
    if (!userData) {
      setDailyLimitProgress(0);
      return;
    }
    
    const effectiveSub = getEffectiveSubscription(userData.subscription);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    
    // Calculer les gains quotidiens
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = (userData.transactions || []).filter(tx => 
      tx.date && tx.date.startsWith(today) && (tx.gain || 0) > 0
    );
    const todaysGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
    
    todaysGainsRef.current = todaysGains;
    balanceManager.addDailyGain(todaysGains);
    
    const percentage = Math.min(100, (todaysGains / limit) * 100);
    setDailyLimitProgress(percentage);
    
    // Vérifier si la limite est atteinte
    if (percentage >= 100) {
      setLimitReached(true);
    } else {
      setLimitReached(false);
    }
  }, [userData]);

  // Générer des revenus immédiatement au chargement
  useEffect(() => {
    if (userData && !isInitialized.current && !limitReached) {
      isInitialized.current = true;
      
      // Première génération rapide
      setTimeout(() => {
        console.log("Génération initiale de revenus automatiques");
        generateAutomaticRevenue(true);
        
        // Puis programmer une seconde génération rapide
        if (!limitReached) {
          setTimeout(() => {
            generateAutomaticRevenue();
          }, 5000);
        }
      }, 2000);
    }
  }, [userData, limitReached]);
  
  // Génération régulière de revenus si le bot est actif
  useEffect(() => {
    if (!userData || limitReached) return;
    
    // Intervalle principal - génération fréquente
    const mainInterval = setInterval(() => {
      if (isBotActive && !limitReached) {
        console.log("Génération de revenus par intervalle principal");
        generateAutomaticRevenue();
      }
    }, 15000 + Math.random() * 10000); // 15-25 secondes
    
    // Intervalle secondaire - contrôle et backup
    const backupInterval = setInterval(() => {
      const now = Date.now();
      
      // Si aucune génération depuis plus de 30 secondes et que le bot est actif, forcer une génération
      if (now - lastGenerationTime > 30000 && isBotActive && !limitReached) {
        console.log("Génération de secours après inactivité prolongée");
        generateAutomaticRevenue();
      }
    }, 10000); // Vérification toutes les 10 secondes
    
    return () => {
      clearInterval(mainInterval);
      clearInterval(backupInterval);
    };
  }, [userData, isBotActive, limitReached]);
  
  // Fonction principale de génération de revenus
  const generateAutomaticRevenue = useCallback(async (forceUpdate = false) => {
    if (!userData || limitReached) {
      return;
    }
    
    try {
      setLastGenerationTime(Date.now());
      
      // Générer un gain aléatoire
      const minGain = 0.02;
      const maxGain = 0.08;
      const gain = parseFloat((Math.random() * (maxGain - minGain) + minGain).toFixed(2));
      
      // Animation visuelle en arrière-plan
      const terminalAnimation = createBackgroundTerminalSequence(
        ["Analyse de contenu en cours..."], true
      );
      
      // Créer un rapport pour la transaction
      const dayCount = Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (1000 * 3600 * 24));
      const report = `Analyse automatique de contenu (jour ${dayCount})`;
      
      // Mettre à jour le solde avec le gain généré
      await updateBalance(gain, report, forceUpdate);
      
      // Mettre à jour le gestionnaire de solde
      balanceManager.updateBalance(gain);
      balanceManager.addDailyGain(gain);
      
      console.log(`Revenu automatique généré: ${gain}€`);
      terminalAnimation.complete(gain);
      
      // Notification visuelle occasionnelle (20% de chance)
      if (Math.random() > 0.8) {
        toast({
          title: "Revenus générés",
          description: `Le bot a généré ${gain.toFixed(2)}€ automatiquement`,
          duration: 3000
        });
      }
      
      // Déclencher des événements pour les animations
      triggerDashboardEvent('activity', { level: 'medium' });
      
      // Déclencher l'animation de mise à jour du solde
      window.dispatchEvent(new CustomEvent('balance:update', { 
        detail: { amount: gain, animate: true } 
      }));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la génération de revenus automatiques:", error);
      return false;
    }
  }, [userData, limitReached, updateBalance]);
  
  return {
    generateAutomaticRevenue,
    isBotActive: true, // Toujours actif
    dailyLimitProgress,
    limitReached
  };
};

export default useRevenueGeneration;
