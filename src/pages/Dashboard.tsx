
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
  
  // Fonction pour mettre à jour le solde
  const updateBalance = async (gain: number, report: string) => {
    console.log(`Updating balance with gain: ${gain}, report: ${report}`);
    await refreshData();
  };

  // Utilisation du hook useAutomaticRevenue avec activation forcée
  const { 
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress 
  } = useAutomaticRevenue({
    userData,
    updateBalance
  });
  
  // Préchargement
  useEffect(() => {
    if (!isPreloaded) {
      const timer = setTimeout(() => {
        setIsPreloaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isPreloaded]);
  
  // Redirection si non authentifié
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
  
  // Message de bienvenue et initialisation
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
      
      // Définir le dernier temps de traitement
      setLastProcessTime(initTimestamp);

      if (userData) {
        console.log("Initiating first automatic revenue on dashboard ready");
        setTimeout(() => {
          // Vérifier si c'est un nouvel utilisateur
          const isNewUser = !userData.balance || userData.balance <= 0;
          
          // Pour les utilisateurs existants, initialiser le solde
          if (!isNewUser) {
            balanceManager.forceBalanceSync(userData.balance || 0);
          }
          
          // Générer un premier revenu automatique
          generateAutomaticRevenue(true);
        }, 2000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue]);

  // AMÉLIORATION - Génération de revenus plus fréquente (10-20 secondes)
  useEffect(() => {
    if (userData) {
      // Intervalle pour les mises à jour automatiques très fréquentes
      const revenueInterval = setInterval(() => {
        const now = Date.now();
        
        // Au moins 10 secondes entre les mises à jour
        if (now - lastProcessTime > 10000) {
          console.log("Generating revenue: automatic update");
          setLastProcessTime(now);
          
          // Générer un nouveau revenu automatique
          generateAutomaticRevenue();
          
          // Forcer une mise à jour du solde
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: true } 
          }));
        }
      }, 10000 + Math.random() * 10000); // Toutes les 10-20 secondes
      
      return () => clearInterval(revenueInterval);
    }
  }, [userData, generateAutomaticRevenue, lastProcessTime]);

  // NOUVEAU - Vérification encore plus fréquente
  useEffect(() => {
    if (userData) {
      const quickInterval = setInterval(() => {
        // Vérifier que le bot est toujours actif
        const botShouldBeActive = true; // Toujours actif
        
        if (!isBotActive && botShouldBeActive) {
          // Réactiver le bot s'il n'est pas actif
          window.dispatchEvent(new CustomEvent('bot:status-change', {
            detail: { active: true }
          }));
          
          console.log("Bot réactivé par la vérification rapide");
        }
        
        // Déclencher une mise à jour forcée du solde
        window.dispatchEvent(new CustomEvent('balance:force-update', {
          detail: { timestamp: Date.now() }
        }));
        
      }, 5000); // Vérification toutes les 5 secondes
      
      return () => clearInterval(quickInterval);
    }
  }, [userData, isBotActive]);

  // AMÉLIORATION - Heartbeat plus fréquent
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (userData) {
        const now = Date.now();
        
        // Vérifier le temps écoulé depuis le dernier traitement
        if (now - lastProcessTime > 30000) { // Au moins 30 secondes entre les heartbeats
          console.log("Dashboard heartbeat - ensuring revenue generation");
          
          // Mettre à jour le timestamp du dernier processus
          setLastProcessTime(now);
          
          // Force a balance update to show progress
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: true } 
          }));
          
          // Garantir une génération de revenus
          generateAutomaticRevenue();
        }
      }
    }, 30000); // Heartbeat toutes les 30 secondes
    
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
