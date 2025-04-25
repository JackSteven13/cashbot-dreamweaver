
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import useDashboardInitialization from './initialization/useDashboardInitialization';
import useInitUserData from '@/hooks/useInitUserData';

export const useDashboardLogic = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { isAuthChecking, isReady, fastInit } = useDashboardInitialization();
  const {
    isInitializing,
    username,
    subscription,
    balance,
    userData,
    isNewUser,
    refreshData
  } = useInitUserData();

  // Force immediate data synchronization when dashboard mounts
  useEffect(() => {
    let mounted = true;

    const syncData = async () => {
      if (user && mounted) {
        try {
          console.log('Syncing user data on dashboard mount');
          await refreshData();
          
          // Force a refresh of transactions
          window.dispatchEvent(new CustomEvent('transactions:refresh', {
            detail: { force: true, timestamp: Date.now() }
          }));
          
          if (mounted) {
            setIsFirstLoad(false);
          }
        } catch (error) {
          console.error('Error syncing dashboard data:', error);
          toast({
            title: "Erreur de synchronisation",
            description: "Impossible de synchroniser les données. Veuillez rafraîchir la page.",
            variant: "destructive"
          });
        }
      }
    };

    // Sync data as soon as user is authenticated
    if (user && !isInitializing) {
      console.log('User authenticated, syncing data...');
      syncData();
    }

    return () => {
      mounted = false;
    };
  }, [user, isInitializing, refreshData]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // More responsive dashboard ready state handling
  const dashboardReady = Boolean(
    !authLoading && 
    user && 
    (fastInit || !isAuthChecking) && 
    (!isInitializing || isReady)
  );

  return {
    authLoading,
    user,
    isInitializing,
    isFirstLoad,
    username,
    subscription,
    balance,
    userData,
    isNewUser,
    dashboardReady,
    refreshData
  };
};

export default useDashboardLogic;
