
import React, { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
  const [showRecoveryButton, setShowRecoveryButton] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

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
          setShowRecoveryButton(true);
          
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
            
            // Cacher le bouton de récupération
            setShowRecoveryButton(false);
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
  
  // Fonction pour récupérer manuellement le solde
  const handleBalanceRecovery = async () => {
    if (!user) return;
    
    setIsRecovering(true);
    
    try {
      // Demander au gestionnaire de solde de récupérer les données
      balanceManager.requestBalanceRecovery();
      
      // Attendre un court instant pour permettre à la récupération de se produire
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Forcer une mise à jour des données du tableau de bord
      refreshData();
      
      // Si le bouton est toujours visible après la tentative de récupération
      setTimeout(() => {
        const currentBalance = balanceManager.getCurrentBalance();
        if (currentBalance > 0) {
          setShowRecoveryButton(false);
          toast({
            title: "Récupération réussie",
            description: `Votre solde a été récupéré avec succès.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Récupération en cours",
            description: "La récupération de votre solde est en cours. Veuillez patienter...",
            variant: "default"
          });
        }
      }, 1000);
    } catch (err) {
      console.error("Erreur lors de la récupération du solde:", err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer votre solde. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={username || "Chargement..."} />;
  }

  return (
    <>
      {showRecoveryButton && (
        <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Problème de synchronisation détecté</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Votre solde semble incorrect. Tentez une récupération de vos données.</p>
            </div>
          </div>
          <Button 
            onClick={handleBalanceRecovery} 
            variant="outline" 
            size="sm"
            disabled={isRecovering}
            className="ml-4 bg-white dark:bg-yellow-800/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Récupération...' : 'Récupérer mon solde'}
          </Button>
        </div>
      )}
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
