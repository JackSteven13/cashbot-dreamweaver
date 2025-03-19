
import { useState, useEffect, useRef } from 'react';
import { refreshSession } from "@/utils/auth/sessionUtils";
import { verifyAuth } from "@/utils/auth/verificationUtils";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardInitialization = () => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const initComplete = useRef(false);
  
  useEffect(() => {
    if (initComplete.current) return;
    
    const initDashboard = async () => {
      try {
        setIsAuthChecking(true);
        setAuthError(false);
        
        // Rafraîchir la session et vérifier l'authentification
        await refreshSession();
        const isAuthenticated = await verifyAuth();
        
        if (!isAuthenticated) {
          setAuthError(true);
          setIsAuthChecking(false);
          return;
        }
        
        // Synchroniser la souscription entre Supabase et localStorage
        await syncSubscriptionWithServer();
        
        setIsAuthChecking(false);
        setIsReady(true);
        initComplete.current = true;
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        setAuthError(true);
        setIsAuthChecking(false);
      }
    };
    
    initDashboard();
    
    return () => {
      console.log("Dashboard initialization cleanup");
    };
  }, []);
  
  // Fonction pour s'assurer que la subscription en localStorage 
  // est synchronisée avec celle sur le serveur
  const syncSubscriptionWithServer = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data: userBalanceData, error } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
      
      if (error || !userBalanceData) {
        console.error("Error fetching subscription data:", error);
        return;
      }
      
      const localSubscription = localStorage.getItem('subscription');
      
      // Mettre à jour le localStorage si nécessaire
      if (localSubscription !== userBalanceData.subscription) {
        console.log("Syncing subscription:", localSubscription, "->", userBalanceData.subscription);
        localStorage.setItem('subscription', userBalanceData.subscription);
      }
    } catch (error) {
      console.error("Error syncing subscription:", error);
    }
  };
  
  return {
    isAuthChecking,
    isReady,
    authError
  };
};
