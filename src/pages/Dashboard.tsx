
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
import { supabase } from '@/integrations/supabase/client';

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
      balanceManager.setDailyGains(0); // Using setDailyGains instead of resetDailyGains
    }
  }, []);
  
  // Vérifier la cohérence du solde au chargement
  useEffect(() => {
    const verifyBalance = async () => {
      if (!user || !userData) return;
      
      try {
        // Si le solde local est zéro, vérifier dans la base de données
        if (userData.balance <= 0) {
          const { data, error } = await supabase
            .from('user_balances')
            .select('balance')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Erreur vérification solde:", error);
            return;
          }
          
          if (data && data.balance > 0) {
            console.log(`Incohérence détectée: Local=${userData.balance}, DB=${data.balance}`);
            
            // Force la mise à jour du gestionnaire de solde
            balanceManager.forceBalanceSync(data.balance, user.id);
            
            // Déclenche un événement pour forcer l'interface à se mettre à jour
            window.dispatchEvent(new CustomEvent('balance:force-update', {
              detail: {
                newBalance: data.balance,
                userId: user.id
              }
            }));
            
            // Force un rafraîchissement des données
            setTimeout(() => {
              refreshData();
            }, 500);
            
            toast({
              title: "Solde restauré",
              description: `Votre solde a été restauré à ${data.balance.toFixed(2)}€`,
              variant: "default"
            });
          }
        }
      } catch (err) {
        console.error("Erreur vérification solde:", err);
      }
    };
    
    verifyBalance();
  }, [user, userData, toast, refreshData]);
  
  // Vérifier les limites au chargement
  useEffect(() => {
    if (user && userData && !isInitializing) {
      const effectiveSub = getEffectiveSubscription(userData.subscription || 'freemium');
      const dailyLimit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
      
      // Reset daily gains if balance is zero to fix inconsistency
      if (userData.balance <= 0) {
        balanceManager.setDailyGains(0);
        localStorage.removeItem('dailyGains');
        localStorage.removeItem('dailyLimitReached');
        console.log("Balance is zero, resetting daily gains tracking at dashboard load");
        return;
      }
      
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
            variant: "destructive",
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
