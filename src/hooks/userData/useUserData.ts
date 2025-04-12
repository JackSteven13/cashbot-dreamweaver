
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserDataState } from './useUserDataState';
import { syncTransactionsWithBalance, syncDailyLimitProgress } from '@/utils/transactions/transactionsSyncManager';
import { supabase } from "@/integrations/supabase/client";

export const useUserData = () => {
  // Utiliser le hook useUserDataState pour gérer l'état des données utilisateur
  const {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    updateUserData,
    userActions,
    generateAutomaticRevenue,
    refreshUserData
  } = useUserDataState();
  
  const lastRefreshRef = useRef(0);
  const syncErrorsCountRef = useRef(0);
  
  // Fonction pour rafraîchir les données utilisateur avec debounce
  const refreshUserDataDebounced = useCallback(async () => {
    const now = Date.now();
    
    // Limiter les appels à 1 par seconde pour éviter les surcharges
    if (now - lastRefreshRef.current < 1000) {
      console.log("Rafraîchissement limité - dernier appel il y a moins d'une seconde");
      return;
    }
    
    lastRefreshRef.current = now;
    
    try {
      await refreshUserData();
      syncErrorsCountRef.current = 0;
    } catch (error) {
      syncErrorsCountRef.current++;
      console.error(`Erreur lors du rafraîchissement des données (${syncErrorsCountRef.current}/3):`, error);
      
      // Si plusieurs erreurs consécutives, essayer de récupérer les transactions directement
      if (syncErrorsCountRef.current >= 3 && userData?.profile?.id) {
        try {
          console.log("Tentative de récupération directe des transactions");
          
          // Récupérer le solde actuel
          const storedBalance = localStorage.getItem(`user_balance_${userData.profile.id}`);
          const balance = storedBalance ? parseFloat(storedBalance) : userData.balance;
          
          // Synchroniser les transactions directement
          const transactions = await syncTransactionsWithBalance(userData.profile.id, balance);
          
          if (transactions.length > 0) {
            console.log("Transactions récupérées avec succès:", transactions.length);
            updateUserData({ 
              userData: { 
                ...userData, 
                transactions 
              } 
            });
          }
          
          // Synchroniser la jauge de limite quotidienne
          const progress = await syncDailyLimitProgress(userData.profile.id);
          updateUserData({ dailyLimitProgress: progress });
          
          syncErrorsCountRef.current = 0;
        } catch (e) {
          console.error("Erreur lors de la récupération directe des transactions:", e);
        }
      }
    }
  }, [refreshUserData, userData, updateUserData]);
  
  // Synchroniser les données utilisateur lors du changement de session
  useEffect(() => {
    const handleSessionChange = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log("Session active détectée, synchronisation des données utilisateur");
        refreshUserDataDebounced();
      }
    };
    
    handleSessionChange();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handleSessionChange();
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refreshUserDataDebounced]);
  
  // Synchroniser périodiquement les données utilisateur en arrière-plan
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (userData?.profile?.id) {
        refreshUserDataDebounced();
      }
    }, 60000); // Toutes les minutes
    
    return () => clearInterval(syncInterval);
  }, [userData, refreshUserDataDebounced]);
  
  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    isBotActive,
    dailyLimitProgress,
    userActions,
    generateAutomaticRevenue,
    refreshUserData: refreshUserDataDebounced
  };
};
