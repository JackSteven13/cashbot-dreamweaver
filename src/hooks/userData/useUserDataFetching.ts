
import { useCallback } from 'react';
import { fetchUserBalance, fetchUserTransactions } from '@/utils/user/userDataFetcher';
import { Transaction, UserData } from '@/types/userData';
import { syncTransactionsWithBalance, syncDailyLimitProgress } from '@/utils/transactions/transactionsSyncManager';
import { supabase } from "@/integrations/supabase/client";

type ProfileLoader = (userId: string) => Promise<any>;
type BalanceLoader = (userId: string) => Promise<any>;

export const useUserDataFetching = (
  loadUserProfile: ProfileLoader,
  loadUserBalance: BalanceLoader,
  updateUserData: (data: any) => void,
  setIsLoading: (loading: boolean) => void,
  isNewUser: boolean
) => {
  // Fonction pour récupérer toutes les données utilisateur et les synchroniser
  const fetchUserData = useCallback(async (): Promise<void> => {
    try {
      console.log("Récupération des données utilisateur...");
      setIsLoading(true);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Aucune session utilisateur active");
        setIsLoading(false);
        return;
      }
      
      const userId = session.user.id;
      
      // 1. Récupérer le profil utilisateur
      const profile = await loadUserProfile(userId);
      
      if (!profile) {
        console.log("Profil utilisateur non trouvé");
        setIsLoading(false);
        return;
      }
      
      // 2. Récupérer le solde et les données d'abonnement
      const balanceData = await loadUserBalance(userId);
      
      if (!balanceData) {
        console.log("Données de solde non trouvées");
        setIsLoading(false);
        return;
      }
      
      // 3. Synchroniser les transactions avec le solde pour assurer la cohérence
      const transactions = await syncTransactionsWithBalance(userId, balanceData.balance);
      
      // 4. Synchroniser la jauge de limite quotidienne
      const dailyLimitProgress = await syncDailyLimitProgress(userId);
      
      // 5. Mettre à jour les données utilisateur
      const userData: Partial<UserData> = {
        username: profile.full_name,
        balance: balanceData.balance,
        subscription: balanceData.subscription,
        dailySessionCount: balanceData.daily_session_count,
        transactions,
        profile
      };
      
      updateUserData({
        userData,
        dailyLimitProgress,
        dailySessionCount: balanceData.daily_session_count
      });
      
      console.log("Données utilisateur récupérées avec succès:", userData.username);
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, updateUserData, setIsLoading, isNewUser]);
  
  // Réinitialiser les compteurs quotidiens à minuit
  const resetDailyCounters = useCallback(async (): Promise<void> => {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Aucune session utilisateur active pour réinitialiser les compteurs");
        return;
      }
      
      const userId = session.user.id;
      
      // Réinitialiser le compteur de sessions quotidien
      const { error } = await supabase
        .from('user_balances')
        .update({ daily_session_count: 0 })
        .eq('id', userId);
      
      if (error) {
        console.error("Erreur lors de la réinitialisation des compteurs:", error);
        return;
      }
      
      console.log("Compteurs quotidiens réinitialisés avec succès");
      
      // Mettre à jour l'état local
      updateUserData({ dailySessionCount: 0, dailyLimitProgress: 0 });
      localStorage.setItem(`dailySessionCount_${userId}`, '0');
      localStorage.setItem(`dailyLimitProgress_${userId}`, '0');
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des compteurs:", error);
    }
  }, [updateUserData]);
  
  return {
    fetchUserData,
    resetDailyCounters
  };
};
