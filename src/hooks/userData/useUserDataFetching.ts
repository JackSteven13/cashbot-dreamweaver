
import { useCallback } from 'react';
import { UserData } from '@/types/userData';
import { supabase } from '@/integrations/supabase/client';

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string) => Promise<any>,
  updateUserData: (data: UserData) => void,
  setIsLoading: (isLoading: boolean) => void,
  isNewUser: boolean
) => {
  // Fonction pour récupérer les données utilisateur
  const fetchUserData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("Pas de session utilisateur");
        setIsLoading(false);
        return;
      }
      
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      // Charger le profil utilisateur
      const profile = await loadUserProfile(userId, userEmail);
      if (!profile) {
        console.error("Impossible de charger le profil utilisateur");
        setIsLoading(false);
        return;
      }
      
      // Charger le solde utilisateur
      const balanceResult = await loadUserBalance(userId);
      if (!balanceResult || !balanceResult.balanceData) {
        console.error("Impossible de charger le solde utilisateur");
        setIsLoading(false);
        return;
      }
      
      // Récupérer les transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Construire les données utilisateur complètes
      const userData: UserData = {
        id: userId,
        username: profile.full_name || 'Utilisateur',
        email: userEmail || '',
        balance: balanceResult.balanceData.balance || 0,
        subscription: balanceResult.balanceData.subscription || 'freemium',
        dailySessionCount: balanceResult.balanceData.daily_session_count || 0,
        transactions: transactions || [],
        referrals: [],
        referralLink: '',
        createdAt: profile.created_at || new Date().toISOString()
      };
      
      // Mettre à jour l'état avec les données récupérées
      updateUserData(userData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données utilisateur:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, updateUserData, setIsLoading]);
  
  // Fonction pour réinitialiser les compteurs quotidiens
  const resetDailyCounters = useCallback(async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }
      
      const userId = session.user.id;
      
      // Réinitialiser le compteur de sessions quotidiennes
      await supabase
        .from('user_balances')
        .update({ 
          daily_session_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      // Rafraîchir les données après réinitialisation
      await fetchUserData();
      
      console.log("Compteurs quotidiens réinitialisés avec succès");
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des compteurs quotidiens:", error);
    }
  }, [fetchUserData]);
  
  return {
    fetchUserData,
    resetDailyCounters
  };
};
