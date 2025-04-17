
import React, { useEffect, useState, Suspense } from 'react';
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

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInitializing, username, refreshData, userData } = useInitUserData();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  
  const updateBalance = async (gain: number, report: string) => {
    console.log(`Updating balance with gain: ${gain}, report: ${report}`);
    await refreshData();
  };

  const { automaticRevenue, processAutomaticRevenue } = useAutomaticRevenue({
    userData,
    updateBalance
  });
  
  useEffect(() => {
    if (!isPreloaded) {
      const timer = setTimeout(() => {
        setIsPreloaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isPreloaded]);
  
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

      // Stocker le timestamp de chargement initial
      const initTimestamp = Date.now();
      localStorage.setItem('dashboardLastInit', initTimestamp.toString());
      
      // Définir le dernier temps de traitement également pour éviter des doubles traitements
      setLastProcessTime(initTimestamp);

      if (userData) {
        console.log("Initiating first automatic revenue on dashboard ready");
        setTimeout(() => {
          // Vérifier si c'est un nouvel utilisateur
          const isNewUser = !userData.balance || userData.balance <= 0;
          
          // Pour les utilisateurs existants, initialiser le solde uniquement au premier chargement
          if (!isNewUser) {
            // Initialiser le gestionnaire de solde sans fluctuations aléatoires
            balanceManager.initialize(userData.balance);
          }
          
          processAutomaticRevenue();
        }, 5000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, processAutomaticRevenue]);

  // Heartbeat effect to ensure periodic updates
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (userData) {
        const now = Date.now();
        
        // Vérifier le temps écoulé depuis le dernier traitement pour éviter les mises à jour excessives
        if (now - lastProcessTime > 60000) { // Au moins 1 minute entre les mises à jour
          console.log("Dashboard heartbeat - ensuring revenue generation is active");
          
          // Mettre à jour le timestamp du dernier processus
          setLastProcessTime(now);
          
          // Force a balance update to show progress, but without random increments
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: true } 
          }));
          
          // Trigger more frequent automatic revenue generation
          if (Math.random() > 0.3) {
            processAutomaticRevenue();
          }
        }
      }
    }, 120000); // Heartbeat every 2 minutes
    
    return () => clearInterval(heartbeatInterval);
  }, [userData, processAutomaticRevenue, lastProcessTime]);
  
  // Supprimer l'effet de mise à jour micro qui provoque des fluctuations aléatoires du solde
  // Effect removed to prevent balance fluctuations on page refresh

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
      
      <SubscriptionSynchronizer onSync={(subscription) => {
        console.log("Subscription synchronized:", subscription);
        refreshData();
      }} />
    </div>
  );
};

export default Dashboard;
