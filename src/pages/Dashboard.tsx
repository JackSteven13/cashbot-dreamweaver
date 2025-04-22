import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../components/dashboard/DashboardContainer';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import useInitUserData from '@/hooks/useInitUserData';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';
import { toast } from '@/components/ui/use-toast';
import BalanceAnimation from '@/components/dashboard/BalanceAnimation';
import useAutomaticRevenue from '@/hooks/useAutomaticRevenue';
import balanceManager from '@/utils/balance/balanceManager';
import AutoProgressNotification from '@/components/dashboard/AutoProgressNotification';
import { useAutoSessionScheduler } from '@/hooks/useAutoSessionScheduler';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInitializing, username, refreshData, userData } = useInitUserData();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  const todaysGainsRef = React.useRef<number>(0);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(Date.now());
  
  useEffect(() => {
    if (!isPreloaded && userData && userData.balance) {
      balanceManager.forceBalanceSync(userData.balance, userData.id || userData.profile?.id);
      
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: userData.balance,
          timestamp: Date.now() 
        }
      }));
      
      setIsPreloaded(true);
    }
  }, [userData, isPreloaded]);
  
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Not authenticated, redirecting to login");
      navigate('/login');
    } else if (!authLoading && user) {
      setTimeout(() => {
        setDashboardReady(true);
      }, 300);
    }
  }, [user, authLoading, navigate]);
  
  const forceBalanceRefresh = useCallback(() => {
    if (!userData) return;
    
    const currentBalance = balanceManager.getCurrentBalance();
    if (currentBalance <= 0) return;
    
    console.log("Forçage d'une mise à jour du solde sur l'interface:", currentBalance);
    
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: { 
        newBalance: currentBalance,
        timestamp: Date.now(),
        userId: userData.id || userData.profile?.id
      }
    }));
    
    setLastBalanceUpdate(Date.now());
  }, [userData]);
  
  useEffect(() => {
    if (!isInitializing && username && isFirstLoad) {
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
        setTimeout(() => {
          balanceManager.forceBalanceSync(userData.balance || 0, userData.id || userData.profile?.id);
          
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
          
          generateAutomaticRevenue(true);
        }, 1000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue]);
  
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      forceBalanceRefresh();
    }, 15000);
    
    return () => clearInterval(refreshInterval);
  }, [forceBalanceRefresh]);
  
  useEffect(() => {
    if (userData) {
      const revenueInterval = setInterval(() => {
        const now = Date.now();
        
        if (now - lastProcessTime > 40000) {
          console.log("Génération de revenus automatique périodique");
          setLastProcessTime(now);
          
          generateAutomaticRevenue();
        }
        
        if (now - lastBalanceUpdate > 20000) { 
          forceBalanceRefresh();
        }
      }, 40000 + Math.random() * 15000);
      
      return () => clearInterval(revenueInterval);
    }
  }, [userData, generateAutomaticRevenue, lastProcessTime, lastBalanceUpdate, forceBalanceRefresh]);
  
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (userData) {
        const now = Date.now();
        
        if (now - lastProcessTime > 180000) {
          console.log("Dashboard heartbeat - vérification et génération de revenus");
          
          setLastProcessTime(now);
          
          if (Math.random() < 0.9) {
            generateAutomaticRevenue();
          }
          
          forceBalanceRefresh();
        }
      }
    }, 180000);
    
    return () => clearInterval(heartbeatInterval);
  }, [userData, generateAutomaticRevenue, lastProcessTime, forceBalanceRefresh]);
  
  useEffect(() => {
    if (!userData) return;
    
    if (userData.subscription === 'freemium') {
      // Vérifier si c'est un nouveau jour
      const lastSessionDate = localStorage.getItem('last_session_date');
      const today = new Date().toDateString();
      
      if (lastSessionDate !== today) {
        // Réinitialiser la limite pour un nouveau jour
        localStorage.removeItem('freemium_daily_limit_reached');
        localStorage.removeItem('last_session_date');
      }
    }
  }, [userData]);
  
  const updateBalance = async (gain: number, report: string, forceUpdate: boolean = false) => {
    console.log(`Updating balance with gain: ${gain}, report: ${report}, forceUpdate: ${forceUpdate}`);
    
    const currentBalance = balanceManager.getCurrentBalance();
    const newBalance = parseFloat((currentBalance + gain).toFixed(2));
    
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: { 
        amount: gain, 
        currentBalance: newBalance, 
        animate: true 
      }
    }));
    
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: { 
        newBalance: newBalance,
        gain: gain,
        timestamp: Date.now() 
      }
    }));
    
    setLastBalanceUpdate(Date.now());
    
    if (forceUpdate && userData?.subscription === 'freemium') {
      localStorage.setItem('freemium_daily_limit_reached', 'true');
      localStorage.setItem('last_session_date', new Date().toDateString());
    }
    
    if (forceUpdate) {
      await refreshData();
    }
  };
  
  const { 
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress 
  } = useAutomaticRevenue({
    userData,
    updateBalance
  });
  
  useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, userData, isBotActive);
  
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
