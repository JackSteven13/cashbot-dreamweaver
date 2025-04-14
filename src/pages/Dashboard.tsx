
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardContainer from '../components/dashboard/DashboardContainer';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import useInitUserData from '@/hooks/useInitUserData';
import SubscriptionSynchronizer from '@/components/subscriptions/SubscriptionSynchronizer';
import { toast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInitializing, username, refreshData } = useInitUserData();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Not authenticated, redirecting to login");
      navigate('/login');
    } else if (!authLoading && user) {
      // Lorsque l'authentification est confirmée, marquer le tableau de bord comme prêt
      setTimeout(() => {
        setDashboardReady(true);
      }, 300);
    }
  }, [user, authLoading, navigate]);
  
  // Show welcome toast on first successful data load
  useEffect(() => {
    if (!isInitializing && username && isFirstLoad) {
      setIsFirstLoad(false);
      toast({
        title: `Bienvenue, ${username}!`,
        description: "Votre tableau de bord est prêt. Les agents IA sont en cours d'analyse.",
        duration: 3000,
      });
    }
  }, [isInitializing, username, isFirstLoad]);

  if (authLoading || !user) {
    return <DashboardSkeleton username="Chargement..." />;
  }

  if (isInitializing && isFirstLoad) {
    return <DashboardSkeleton username={username || "Chargement..."} />;
  }

  return (
    <div className={`transition-opacity duration-500 ${dashboardReady ? 'opacity-100' : 'opacity-0'}`}>
      <DashboardContainer />
      
      {/* Invisible component to ensure subscription is always in sync */}
      <SubscriptionSynchronizer onSync={(subscription) => {
        console.log("Subscription synchronized:", subscription);
        refreshData();
      }} />
    </div>
  );
};

export default Dashboard;
