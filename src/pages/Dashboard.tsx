
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
  
  // Fonction pour mettre à jour le solde avec persistance
  const updateBalance = async (gain: number, report: string, forceUpdate: boolean = false) => {
    console.log(`Updating balance with gain: ${gain}, report: ${report}, forceUpdate: ${forceUpdate}`);
    
    // Mise à jour locale du solde dans le balanceManager
    const currentBalance = balanceManager.getCurrentBalance();
    const newBalance = parseFloat((currentBalance + gain).toFixed(2));
    
    // Forcer la mise à jour de l'UI via événements
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: { 
        amount: gain, 
        currentBalance: newBalance, 
        animate: true 
      }
    }));
    
    // Également forcer la mise à jour directe
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: { 
        newBalance: newBalance,
        gain: gain,
        timestamp: Date.now() 
      }
    }));
    
    // Mettre à jour timestamp
    setLastBalanceUpdate(Date.now());
    
    // Rafraîchir les données utilisateur depuis le serveur si demandé
    if (forceUpdate) {
      await refreshData();
    }
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
  
  // Utiliser le planificateur de sessions automatiques
  useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, userData, isBotActive);
  
  // Préchargement et initialisation du solde
  useEffect(() => {
    if (!isPreloaded && userData && userData.balance) {
      // Initialiser immédiatement le balanceManager avec le solde de l'utilisateur
      balanceManager.forceBalanceSync(userData.balance, userData.id || userData.profile?.id);
      
      // Déclencher un événement de mise à jour du solde pour mettre à jour l'UI
      window.dispatchEvent(new CustomEvent('balance:force-update', {
        detail: { 
          newBalance: userData.balance,
          timestamp: Date.now() 
        }
      }));
      
      // Marquer comme préchargé
      setIsPreloaded(true);
    }
  }, [userData, isPreloaded]);
  
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
  
  // Fonction pour forcer une mise à jour périodique du solde dans l'interface
  const forceBalanceRefresh = useCallback(() => {
    if (!userData) return;
    
    const currentBalance = balanceManager.getCurrentBalance();
    if (currentBalance <= 0) return;
    
    console.log("Forçage d'une mise à jour du solde sur l'interface:", currentBalance);
    
    // Déclencher la mise à jour de l'UI
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: { 
        newBalance: currentBalance,
        timestamp: Date.now(),
        userId: userData.id || userData.profile?.id
      }
    }));
    
    setLastBalanceUpdate(Date.now());
  }, [userData]);
  
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
        console.log("Initialisation des revenus automatiques et du solde");
        setTimeout(() => {
          // Pour tous les utilisateurs, initialiser le solde correctement
          balanceManager.forceBalanceSync(userData.balance || 0, userData.id || userData.profile?.id);
          
          // Vérifier s'il faut simuler une progression depuis la dernière connexion
          const lastVisit = localStorage.getItem('last_visit_date');
          const now = new Date().toDateString();
          
          if (lastVisit && lastVisit !== now) {
            // Calculer le nombre de jours écoulés
            const lastVisitDate = new Date(lastVisit);
            lastVisitDate.setHours(0, 0, 0, 0);
            
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            const daysDifference = Math.floor((currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDifference > 0) {
              // Déclencher plusieurs sessions pour simuler la progression pendant l'absence
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
          
          // Enregistrer la visite d'aujourd'hui
          localStorage.setItem('last_visit_date', now);
          
          // Générer un premier revenu automatique
          setTimeout(() => {
            generateAutomaticRevenue(true);
          }, 3000);
        }, 1000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue]);

  // Mise à jour périodique du solde (toutes les 15 secondes)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      forceBalanceRefresh();
    }, 15000);
    
    return () => clearInterval(refreshInterval);
  }, [forceBalanceRefresh]);

  // Génération de revenus périodique
  useEffect(() => {
    if (userData) {
      // Intervalle pour les mises à jour automatiques
      const revenueInterval = setInterval(() => {
        const now = Date.now();
        
        // Attendre au moins 40 secondes entre les générations de gains
        if (now - lastProcessTime > 40000) {
          console.log("Génération de revenus automatique périodique");
          setLastProcessTime(now);
          
          // Générer un nouveau revenu automatique
          generateAutomaticRevenue();
        }
        
        // Forcer une mise à jour du solde dans l'UI 
        // (moins fréquemment, seulement si le dernier update est ancien)
        if (now - lastBalanceUpdate > 20000) { 
          forceBalanceRefresh();
        }
      }, 40000 + Math.random() * 15000); // Entre 40-55 secondes
      
      return () => clearInterval(revenueInterval);
    }
  }, [userData, generateAutomaticRevenue, lastProcessTime, lastBalanceUpdate, forceBalanceRefresh]);

  // Heartbeat moins fréquent pour forcer la génération de revenus
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (userData) {
        const now = Date.now();
        
        // Au moins 3 minutes entre les heartbeats
        if (now - lastProcessTime > 180000) {
          console.log("Dashboard heartbeat - vérification et génération de revenus");
          
          // Mettre à jour le timestamp du dernier processus
          setLastProcessTime(now);
          
          // Générer un revenu avec une probabilité élevée
          if (Math.random() < 0.9) {
            generateAutomaticRevenue();
          }
          
          // Forcer la mise à jour de l'UI
          forceBalanceRefresh();
        }
      }
    }, 180000); // Heartbeat toutes les 3 minutes
    
    return () => clearInterval(heartbeatInterval);
  }, [userData, generateAutomaticRevenue, lastProcessTime, forceBalanceRefresh]);
  
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
