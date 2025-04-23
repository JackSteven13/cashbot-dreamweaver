import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../components/dashboard/DashboardContainer';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import useInitUserData from '@/hooks/useInitUserData';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';
import { toast } from '@/components/ui/use-toast';
import BalanceAnimation from '@/components/dashboard/BalanceAnimation';
import AutoProgressNotification from '@/components/dashboard/AutoProgressNotification';
import { useAutoSessionScheduler } from '@/hooks/useAutoSessionScheduler';
import { useBalanceUpdater } from '@/hooks/useBalanceUpdater';
import { useBalanceSync } from '@/hooks/useBalanceSync';
import { usePeriodicUpdates } from '@/hooks/usePeriodicUpdates';
import balanceManager from '@/utils/balance/balanceManager';
import useUserDataRefresh from '@/hooks/session/useUserDataRefresh';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInitializing, username, refreshData, userData } = useInitUserData();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  const todaysGainsRef = React.useRef<number>(0);
  
  const { updateBalance } = useBalanceUpdater();
  const { lastBalanceUpdate, setLastBalanceUpdate, fetchLatestBalance } = useBalanceSync(userData, isPreloaded);
  const { refreshUserData } = useUserDataRefresh();
  
  const { 
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress 
  } = useAutomaticRevenue({
    userData,
    updateBalance
  });
  
  useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, userData, isBotActive);
  
  // Fonction pour forcer le rafraîchissement du solde
  const forceBalanceRefresh = useCallback(() => {
    if (!userData) return;
    
    // Associer l'ID utilisateur au gestionnaire de solde
    if (userData.id || userData.profile?.id) {
      const userId = userData.id || userData.profile?.id;
      balanceManager.setUserId(userId);
    }
    
    const currentBalance = balanceManager.getCurrentBalance();
    if (currentBalance <= 0) {
      console.log("Tentative de récupération du solde depuis le backend");
      if (userData?.id) {
        fetchLatestBalance(userData.id)
          .then(result => {
            if (result && result.balance > 0) {
              console.log("Solde récupéré depuis le backend:", result.balance);
              balanceManager.forceBalanceSync(result.balance, userData.id);
              setLastBalanceUpdate(Date.now());
            }
          });
      }
      return;
    }
    
    console.log("Forçage d'une mise à jour du solde sur l'interface:", currentBalance);
    
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: { 
        newBalance: currentBalance,
        timestamp: Date.now(),
        userId: userData.id || userData.profile?.id
      }
    }));
    
    setLastBalanceUpdate(Date.now());
  }, [userData, fetchLatestBalance, setLastBalanceUpdate]);
  
  usePeriodicUpdates(
    userData,
    generateAutomaticRevenue,
    lastProcessTime,
    setLastProcessTime,
    lastBalanceUpdate,
    forceBalanceRefresh
  );
  
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Not authenticated, redirecting to login");
      navigate('/login');
    } else if (!authLoading && user) {
      // Associer l'ID utilisateur au gestionnaire de solde dès que possible
      if (user.id) {
        balanceManager.setUserId(user.id);
        
        // Récupérer d'éventuelles données en cache du localStorage
        const cachedBalance = parseFloat(localStorage.getItem(`lastKnownBalance_${user.id}`) || '0');
        if (cachedBalance > 0) {
          console.log(`Balance trouvée en cache pour ${user.id}: ${cachedBalance}€`);
          balanceManager.forceBalanceSync(cachedBalance, user.id);
        }
      }
      
      setTimeout(() => {
        setDashboardReady(true);
      }, 300);
    }
  }, [user, authLoading, navigate]);
  
  // Synchroniser les données utilisateur au chargement
  useEffect(() => {
    if (!isInitializing && username && isFirstLoad && user?.id) {
      setIsFirstLoad(false);
      toast({
        title: `Bienvenue, ${username}!`,
        description: "Votre tableau de bord est prêt. Les agents IA sont en cours d'analyse.",
        duration: 3000,
      });
      
      window.dispatchEvent(new CustomEvent('dashboard:ready', { 
        detail: { username, timestamp: Date.now() } 
      }));

      const initTimestamp = Date.now();
      localStorage.setItem('dashboardLastInit', initTimestamp.toString());
      
      setLastProcessTime(initTimestamp);

      if (userData) {
        console.log("Initialisation des revenus automatiques et du solde");
        
        // Associer l'ID utilisateur au gestionnaire de solde
        if (userData.id || userData.profile?.id) {
          const userId = userData.id || userData.profile?.id;
          balanceManager.setUserId(userId);
          
          // Vérifier immédiatement s'il y a un solde en base de données
          if (userId) {
            fetchLatestBalance(userId).then(result => {
              if (result && result.balance > 0) {
                balanceManager.forceBalanceSync(result.balance, userId);
                console.log(`Solde initial récupéré depuis la BD: ${result.balance}€`);
              }
            });
          }
        }
        
        setTimeout(() => {
          // Si un solde existe en base de données, le synchroniser
          if (userData.balance !== undefined && userData.balance > 0) {
            balanceManager.forceBalanceSync(userData.balance, userData.id || userData.profile?.id);
          } else {
            // Sinon, vérifier s'il existe un solde en local
            const localBalance = balanceManager.getCurrentBalance();
            if (localBalance > 0) {
              forceBalanceRefresh();
            }
          }
          
          const lastVisit = localStorage.getItem('last_visit_date');
          const now = new Date().toDateString();
          
          if (lastVisit && lastVisit !== now) {
            const lastVisitDate = new Date(lastVisit);
            lastVisitDate.setHours(0, 0, 0, 0);
            
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            const daysDifference = Math.floor((currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDifference > 0) {
              setTimeout(() => {
                generateAutomaticRevenue(true);
                toast({
                  title: "Mise à jour de votre solde",
                  description: `Progression pendant votre absence: +${(Math.random() * 0.1 + 0.05).toFixed(2)}€`,
                  duration: 4000
                });
              }, 2000);
            }
          }
          
          localStorage.setItem('last_visit_date', now);
          
          // Générer des revenus automatiques au chargement
          generateAutomaticRevenue(true);
          
          // Rafraîchir les données utilisateur pour assurer la synchronisation
          refreshUserData();
        }, 1000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue, forceBalanceRefresh, user, refreshUserData, fetchLatestBalance]);
  
  // Synchroniser régulièrement le solde avec l'interface
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      forceBalanceRefresh();
    }, 15000);
    
    const handleBeforeUnload = () => {
      // Sauvegarder le solde en localStorage avant la fermeture
      const currentBalance = balanceManager.getCurrentBalance();
      if (currentBalance > 0 && user?.id) {
        localStorage.setItem(`lastKnownBalance_${user.id}`, currentBalance.toString());
        localStorage.setItem(`currentBalance_${user.id}`, currentBalance.toString());
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [forceBalanceRefresh, user]);

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={username || "Chargement..."} />;
  }

  return (
    <div className={`transition-opacity duration-500 ${dashboardReady ? 'opacity-100' : 'opacity-0'}`}>
      <Suspense fallback={<DashboardSkeleton username={username || "Préparation..."} />}>
        <DashboardContainer />
      </Suspense>
      
      <BalanceAnimation position="top-right" />
      <AutoProgressNotification />
      
      <SubscriptionSynchronizer onSync={(subscription) => {
        console.log("Subscription synchronized:", subscription);
        refreshData();
      }} />
    </div>
  );
};

export default Dashboard;
