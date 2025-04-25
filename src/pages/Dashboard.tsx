
import React, { useEffect } from 'react';
import { useDashboardLogic } from '@/hooks/dashboard/useDashboardLogic';
import DashboardMain from '../components/dashboard/DashboardMain';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DailyBalanceUpdater from '../components/DailyBalanceUpdater';
import { useToast } from '@/components/ui/use-toast';
import balanceManager from '@/utils/balance/balanceManager';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscription/constants';
import { getEffectiveSubscription } from '@/utils/auth/subscriptionUtils';
import { shouldResetDailyCounters } from '@/utils/subscription/sessionManagement';

const Dashboard = () => {
  const {
    authLoading,
    user,
    isInitializing,
    isFirstLoad,
    username,
    dashboardReady,
    refreshData,
    userData
  } = useDashboardLogic();
  
  const { toast } = useToast();

  // Vérifier si un nouveau jour a commencé et réinitialiser les compteurs si nécessaire
  useEffect(() => {
    if (shouldResetDailyCounters()) {
      console.log("[DAILY RESET] Resetting daily counters from Dashboard component");
      balanceManager.resetDailyGains();
    }
  }, []);
  
  // Vérifier les limites au chargement
  useEffect(() => {
    if (user && userData && !isInitializing) {
      const effectiveSub = getEffectiveSubscription(userData.subscription || 'freemium');
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Récupérer les transactions du jour pour vérifier les gains
      const today = new Date().toISOString().split('T')[0];
      const todaysTransactions = (userData.transactions || []).filter(tx => 
        tx.date?.startsWith(today) && tx.gain > 0
      );
      
      const transactionGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
      
      // Mettre à jour le gestionnaire de solde avec cette valeur
      balanceManager.setDailyGains(transactionGains);
      
      // Vérifier si la limite est atteinte ou presque atteinte
      const percentage = Math.min(100, (transactionGains / dailyLimit) * 100);
      
      if (percentage >= 95) {
        console.log(`[LIMIT WARNING] Daily limit nearly reached at loading: ${transactionGains.toFixed(2)}€/${dailyLimit}€ (${percentage.toFixed(1)}%)`);
        localStorage.setItem('dailyLimitReached', 'true');
        
        // Désactiver le bot automatiquement
        window.dispatchEvent(new CustomEvent('bot:external-status-change', { 
          detail: { active: false, reason: 'limit_reached' } 
        }));
        
        if (percentage >= 99) {
          toast({
            title: "Limite journalière atteinte",
            description: `Vous avez atteint votre limite quotidienne de ${dailyLimit}€. Revenez demain ou passez à un abonnement supérieur.`,
            variant: "destructive",
            duration: 6000
          });
        } else {
          toast({
            title: "Limite presque atteinte",
            description: `Vous approchez de votre limite quotidienne de ${dailyLimit}€ (${Math.round(percentage)}%).`,
            variant: "warning",
            duration: 5000
          });
        }
      }
    }
  }, [user, isInitializing, userData, toast]);

  // Force a data refresh when dashboard is loaded
  useEffect(() => {
    if (user && !isInitializing) {
      // Add a slight delay to ensure everything is loaded
      const timer = setTimeout(() => {
        refreshData();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isInitializing, refreshData]);

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={username || "Chargement..."} />;
  }

  return (
    <>
      <DashboardMain
        dashboardReady={dashboardReady}
        username={username}
        refreshData={refreshData}
      />
      {/* Add the invisible component that handles background updates */}
      <DailyBalanceUpdater />
    </>
  );
};

export default Dashboard;
