
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
  
  // Utiliser le planificateur de sessions automatiques
  useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, userData, isBotActive);
  
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
                  toast({
                    title: "Mise à jour du solde",
                    description: `Progression pendant votre absence: ${daysDifference} jour(s)`,
                    duration: 4000
                  });
                }, 1500);
              }
            }
          }
          
          // Générer un premier revenu automatique
          generateAutomaticRevenue(true);
        }, 2000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue]);

  // Génération de revenus moins fréquente 
  useEffect(() => {
    if (userData) {
      // Intervalle pour les mises à jour automatiques avec fréquence réduite
      const revenueInterval = setInterval(() => {
        const now = Date.now();
        
        // Au moins 30 secondes entre les mises à jour
        if (now - lastProcessTime > 30000) {
          console.log("Generating revenue: automatic update");
          setLastProcessTime(now);
          
          // Probabilité réduite de générer un revenu
          if (Math.random() < 0.25) {
            // Générer un nouveau revenu automatique (petit)
            generateAutomaticRevenue();
          }
          
          // Forcer une mise à jour du solde
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: Math.random() < 0.2 }
          }));
        }
      }, 30000 + Math.random() * 30000); // Entre 30-60 secondes
      
      return () => clearInterval(revenueInterval);
    }
  }, [userData, generateAutomaticRevenue, lastProcessTime]);

  // Vérification moins fréquente
  useEffect(() => {
    if (userData) {
      const quickInterval = setInterval(() => {
        // Vérifier que le bot est toujours actif
        const botShouldBeActive = true;
        
        if (!isBotActive && botShouldBeActive) {
          // Réactiver le bot s'il n'est pas actif
          window.dispatchEvent(new CustomEvent('bot:status-change', {
            detail: { active: true }
          }));
          
          console.log("Bot réactivé par la vérification");
        }
        
        // Déclencher une mise à jour du solde seulement parfois
        if (Math.random() < 0.3) {
          window.dispatchEvent(new CustomEvent('balance:force-update', {
            detail: { timestamp: Date.now(), animate: false }
          }));
        }
        
      }, 20000); // Vérification toutes les 20 secondes
      
      return () => clearInterval(quickInterval);
    }
  }, [userData, isBotActive]);

  // Heartbeat moins fréquent
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (userData) {
        const now = Date.now();
        
        // Vérifier le temps écoulé depuis le dernier traitement
        if (now - lastProcessTime > 120000) { // Au moins 2 minutes entre les heartbeats
          console.log("Dashboard heartbeat - checking revenue generation");
          
          // Mettre à jour le timestamp du dernier processus
          setLastProcessTime(now);
          
          // Forcer une mise à jour du solde
          window.dispatchEvent(new CustomEvent('balance:force-update', { 
            detail: { timestamp: now, animate: Math.random() < 0.1 }
          }));
          
          // Génération de revenus avec faible probabilité
          if (Math.random() < 0.3) {
            generateAutomaticRevenue();
          }
        }
      }
    }, 120000); // Heartbeat toutes les 2 minutes
    
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
