
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserData } from '@/hooks/userData';
import { useDashboardSessions } from '@/hooks/useDashboardSessions';
import { useDormancyCheck } from '@/hooks/useDormancyCheck';

/**
 * Hook pour gérer l'état global du dashboard
 */
export const useDashboardState = () => {
  // Compteur pour forcer les re-rendus
  const [renderKey, setRenderKey] = useState(0);
  
  // État de navigation
  const [selectedNavItem, setSelectedNavItem] = useState('dashboard');
  
  // Utiliser les hooks de données utilisateur
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    generateAutomaticRevenue,
    setShowLimitAlert: setShowLimit,
    refreshUserData,
    incrementSessionCount,
    updateBalance,
    resetBalance,
    resetDailyCounters
  } = useUserData();
  
  // Ensure userData is never null for downstream hooks
  const safeUserData = userData || {
    username: 'Utilisateur',
    balance: 0,
    subscription: 'freemium',
    referrals: [],
    referralLink: '',
    transactions: [],
    dailySessionCount: 0,
    lastLogin: new Date(),
    registeredAt: new Date()
  };
  
  // Vérification de la dormance du compte avec timeout de sécurité
  const { isDormant, isChecking, dormancyData, handleReactivate } = 
    useDormancyCheck(safeUserData, showLimitAlert);
  
  // Gestion des sessions - Pass safe userData directly and other required parameters
  const {
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    localBalance,
    isBotActive: sessionBotActive
  } = useDashboardSessions({
    userData: safeUserData,
    dailySessionCount,
    incrementSessionCount,
    updateBalance,
    setShowLimitAlert: setShowLimit,
    resetBalance
  });
  
  // Force refresh pour les erreurs avec debounce
  const forceRefresh = useCallback(() => {
    console.log("Forçage de la mise à jour du dashboard");
    refreshUserData();
    setRenderKey(prev => prev + 1);
  }, [refreshUserData]);
  
  // Démarrer la génération automatique si possible avec des gestions d'erreur
  useEffect(() => {
    if (!userData) return; // Protection contre null
    
    try {
      // Vérifier si l'utilisateur peut bénéficier de revenus automatiques
      if (!isNewUser && !isDormant && isBotActive && !isChecking) {
        // Initier la première génération automatique après un court délai
        const startTimer = setTimeout(() => {
          if (userData && !isNewUser && !isDormant) {
            console.log("Démarrage de la génération automatique de revenus");
            generateAutomaticRevenue(true).catch(err => {
              console.error("Erreur lors de la génération automatique:", err);
            });
          }
        }, 10000);
        
        return () => clearTimeout(startTimer);
      }
    } catch (error) {
      console.error("Erreur dans l'effet useDashboardState:", error);
    }
  }, [userData, isNewUser, isDormant, isBotActive, isChecking, generateAutomaticRevenue]);
  
  // Modifier les types de retour pour éviter les erreurs TS2322
  return {
    selectedNavItem,
    setSelectedNavItem,
    renderKey,
    userData: safeUserData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isDormant,
    dormancyData,
    isChecking,
    handleReactivate,
    isStartingSession,
    handleStartSession,
    handleWithdrawal,
    lastSessionTimestamp,
    forceRefresh,
    isLoading: isLoading || isChecking,
    isBotActive: sessionBotActive || isBotActive,
    dailyLimitProgress,
    // Adaptations pour correspondre aux types attendus
    incrementSessionCount: async (): Promise<void> => {
      await incrementSessionCount();
    },
    updateBalance: async (gain: number, report: string, forceUpdate?: boolean): Promise<void> => {
      await updateBalance(gain, report, forceUpdate);
    },
    resetBalance: async (): Promise<void> => {
      await resetBalance();
    }
  };
};

export default useDashboardState;
