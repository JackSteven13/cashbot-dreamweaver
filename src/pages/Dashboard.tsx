
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
import AutoProgressNotification from '@/components/dashboard/AutoProgressNotification';

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

  // Utilisation du hook useAutomaticRevenue
  const { 
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress 
  } = useAutomaticRevenue({
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
          
          // Utiliser la fonction generateAutomaticRevenue
          generateAutomaticRevenue(true);
        }, 3000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue]);

  // MODIFIÉ - Générer des revenus beaucoup plus fréquemment - toutes les 20-30 secondes
  useEffect(() => {
    if (userData && isBotActive) {
      // Intervalle pour les mises à jour automatiques régulières
      const revenueInterval = setInterval(() => {
        const now = Date.now();
        
        // Au moins 20 secondes entre les mises à jour
        if (now - lastProcessTime > 20000) {
          console.log("Generating automatic revenue - periodic update");
          setLastProcessTime(now);
          
          // Générer un nouveau revenu automatique
          generateAutomaticRevenue();
          
          // Force a balance update to show progress
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: true } 
          }));
        }
      }, 20000 + Math.random() * 10000); // Toutes les 20-30 secondes
      
      return () => clearInterval(revenueInterval);
    }
  }, [userData, isBotActive, generateAutomaticRevenue, lastProcessTime]);

  // NOUVEAU - Seconde vérification encore plus fréquente
  useEffect(() => {
    if (userData) {
      const quickInterval = setInterval(() => {
        // Vérifier que le bot est toujours actif
        const botShouldBeActive = localStorage.getItem('bot_active') !== 'false';
        
        if (!isBotActive && botShouldBeActive) {
          // Réactiver le bot s'il devrait être actif
          window.dispatchEvent(new CustomEvent('bot:status-change', {
            detail: { active: true }
          }));
          
          console.log("Bot réactivé par la vérification rapide");
        }
        
        // Déclencher une mise à jour forcée du solde
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: { timestamp: Date.now() }  
        }));
        
      }, 10000); // Vérification toutes les 10 secondes
      
      return () => clearInterval(quickInterval);
    }
  }, [userData, isBotActive]);

  // Heartbeat effect pour assurer des mises à jour périodiques plus lentes
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (userData) {
        const now = Date.now();
        
        // Vérifier le temps écoulé depuis le dernier traitement - intervalle plus court
        if (now - lastProcessTime > 60000) { // Au moins 1 minute entre les heartbeats
          console.log("Dashboard heartbeat - ensuring revenue generation is active");
          
          // Mettre à jour le timestamp du dernier processus
          setLastProcessTime(now);
          
          // Force a balance update to show progress
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: true } 
          }));
          
          // Générer un revenu avec une forte probabilité
          if (Math.random() > 0.2) { // 80% de chances
            generateAutomaticRevenue();
          }
        }
      }
    }, 60000); // Heartbeat toutes les minutes
    
    return () => clearInterval(heartbeatInterval);
  }, [userData, generateAutomaticRevenue, lastProcessTime]);
  
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
