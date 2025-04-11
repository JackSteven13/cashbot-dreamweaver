
import { useState, useRef, useEffect } from 'react';
import { useAutoRevenueGenerator } from './useAutoRevenueGenerator';
import { useAutoSessionScheduler } from './useAutoSessionScheduler';
import { useDailyLimits } from './useDailyLimits';
import { useActivitySimulation } from './useActivitySimulation';
import { createBackgroundTerminalSequence } from '@/utils/animations/terminalAnimator';

export const useAutoSessions = (
  userData: any,
  updateBalance: (gain: number, report: string, forceUpdate?: boolean) => Promise<void>,
  setShowLimitAlert: (show: boolean) => void
) => {
  // Références pour garantir la stabilité des données
  const todaysGainsRef = useRef(0);
  const lastKnownBalanceRef = useRef(userData?.balance || 0);
  
  // State pour suivre l'activité du bot
  const [isBotActive, setIsBotActive] = useState(true);
  const botActiveRef = useRef(true);
  
  // Mettre à jour lastKnownBalanceRef quand userData.balance change
  useEffect(() => {
    if (userData?.balance !== undefined && userData.balance !== lastKnownBalanceRef.current) {
      lastKnownBalanceRef.current = userData.balance;
      
      // Stocker également en localStorage pour persistence entre les rendus
      try {
        localStorage.setItem('lastKnownBalance', userData.balance.toString());
      } catch (e) {
        console.error("Failed to store balance in localStorage:", e);
      }
    }
  }, [userData?.balance]);

  // Custom hooks pour la logique de génération automatique
  const { getDailyLimit } = useDailyLimits(userData?.subscription);
  
  // Écouter les changements d'état du bot
  useEffect(() => {
    const handleBotStatusChange = (event: CustomEvent) => {
      const newStatus = event.detail?.active;
      const userId = event.detail?.userId;
      
      // Vérifier si l'événement concerne cet utilisateur
      if (userId && userData?.profile?.id && userId !== userData.profile.id) {
        return;
      }
      
      if (typeof newStatus === 'boolean') {
        // Mettre à jour l'état local et la référence
        setIsBotActive(newStatus);
        botActiveRef.current = newStatus;
        console.log("Bot status updated to:", newStatus);
      }
    };
    
    window.addEventListener('bot:status-change' as any, handleBotStatusChange);
    window.addEventListener('bot:external-status-change' as any, handleBotStatusChange);
    
    return () => {
      window.removeEventListener('bot:status-change' as any, handleBotStatusChange);
      window.removeEventListener('bot:external-status-change' as any, handleBotStatusChange);
    };
  }, [userData?.profile?.id]);

  // Fonction pour générer des revenus automatiques avec animation améliorée
  const generateAutomaticRevenue = async (isFirst = false) => {
    if (!botActiveRef.current) {
      console.log("Bot is inactive, no automatic revenue will be generated");
      return;
    }
    
    // Créer une séquence d'animation qui n'affiche pas l'écran de chargement
    const terminalAnimation = createBackgroundTerminalSequence([
      "Initialisation de l'analyse du contenu vidéo..."
    ]);
    
    try {
      // Calculer le gain potentiel
      const dailyLimit = getDailyLimit();
      const todaysGains = todaysGainsRef.current;
      
      // Vérifier si on a atteint la limite
      const remainingAllowedGains = Math.max(0, dailyLimit - todaysGains);
      if (remainingAllowedGains <= 0.01) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
        terminalAnimation.complete(0);
        return;
      }
      
      // Ajouter des lignes d'animation progressivement
      terminalAnimation.addLine("Traitement des données algorithmiques...");
      
      // Court délai pour simuler un traitement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Générer un gain aléatoire entre 0.01 et 0.1, limité par le montant restant disponible
      const baseGain = Math.min(
        Math.random() * 0.09 + 0.01,
        remainingAllowedGains
      );
      
      // Arrondir à 2 décimales
      const finalGain = parseFloat(baseGain.toFixed(2));
      
      // Simuler un court délai supplémentaire
      await new Promise(resolve => setTimeout(resolve, 600));
      
      terminalAnimation.addLine(`Analyse complétée. Optimisation des résultats: ${finalGain.toFixed(2)}€`);
      
      // Mettre à jour le solde en utilisant forceUpdate=true pour une mise à jour UI immédiate
      await updateBalance(
        finalGain,
        `Notre système d'analyse de contenu vidéo a généré ${finalGain.toFixed(2)}€ de revenus. Performance basée sur le niveau d'abonnement ${userData.subscription}.`,
        true // Force update pour mise à jour UI immédiate
      );
      
      // Terminer l'animation avec le gain obtenu
      terminalAnimation.complete(finalGain);
      
      // Mettre à jour notre référence des gains du jour
      todaysGainsRef.current += finalGain;
      
      // Si limite atteinte, désactiver le bot
      if (todaysGainsRef.current >= dailyLimit) {
        setIsBotActive(false);
        botActiveRef.current = false;
        setShowLimitAlert(true);
      }
      
      return finalGain;
    } catch (error) {
      console.error("Error in generateAutomaticRevenue:", error);
      // Terminer l'animation même en cas d'erreur
      terminalAnimation.complete(0);
      return 0;
    }
  };

  return {
    lastAutoSessionTime: 0, // Placeholder pour compatibilité
    activityLevel: "medium", // Placeholder pour compatibilité
    generateAutomaticRevenue,
    isBotActive
  };
};
