
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { fetchUserTransactions } from './transactionUtils';
import { checkDailyLimit } from '@/utils/subscription';
import { generateReferralLink } from '@/utils/referralUtils';
import { UserFetcherState } from './useUserDataState';
import { getCurrentSession } from '@/utils/auth/sessionUtils';
import { toast } from '@/components/ui/use-toast';

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string) => Promise<any>,
  updateUserData: (data: Partial<UserFetcherState>) => void,
  setIsLoading: (loading: boolean) => void,
  isNewUser: boolean
) => {
  // Fonction pour récupérer les données utilisateur avec protection contre les boucles
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si une session existe
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("No session found");
        setIsLoading(false);
        return;
      }

      // Récupérer toutes les données utilisateur en incluant les parrainages
      const userData = await fetchCompleteUserData(session.user.id, session.user.email);
      
      if (!userData || !userData.balance) {
        setIsLoading(false);
        return;
      }
      
      // Récupérer le profil utilisateur
      const refreshedProfile = await loadUserProfile(session.user.id, session.user.email);
      
      // Récupérer les données de solde
      const balanceResult = await loadUserBalance(session.user.id);
      if (!balanceResult) {
        setIsLoading(false);
        return;
      }
      
      const { balanceData } = balanceResult;

      // Récupérer explicitement les transactions avec le nouveau service
      const transactionsData = await fetchUserTransactions(session.user.id);
      
      console.log("Transactions récupérées:", transactionsData);
      
      // Calculate today's gains by filtering transactions from today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todaysTransactions = transactionsData.filter(tx => 
        tx.date && tx.date.startsWith(today) && tx.gain > 0
      );
      const todaysGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);

      // Déterminer le nom d'affichage de l'utilisateur
      const displayName = refreshedProfile?.full_name || 
                         session.user.user_metadata?.full_name || 
                         (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

      // Créer l'objet de données utilisateur
      const newUserData = {
        username: displayName,
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        referrals: userData.referrals || [],
        referralLink: userData.referralLink || generateReferralLink(session.user.id),
        email: session.user.email || undefined,
        transactions: transactionsData
      };
      
      const newDailySessionCount = balanceData?.daily_session_count || 0;
      
      // Vérifier si la limite quotidienne est atteinte - based on today's transactions
      const limitReached = checkDailyLimit(todaysGains, balanceData?.subscription || 'freemium');
      
      // Mettre à jour les données avec protection contre les boucles
      updateUserData({
        userData: newUserData,
        isNewUser: userData.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
      
      console.log("Données utilisateur mises à jour:", newUserData);
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, isNewUser, updateUserData, setIsLoading]);

  // Fonction pour réinitialiser uniquement les compteurs de sessions quotidiens
  const resetDailyCounters = useCallback(async () => {
    try {
      console.log("Réinitialisation des compteurs de sessions quotidiens...");
      
      // Vérifier si une session existe
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("Pas de session active pour la réinitialisation");
        return;
      }
      
      // Réinitialiser UNIQUEMENT le compteur de sessions pour tous les types de comptes
      // Sans toucher au solde
      const { error } = await supabase
        .from('user_balances')
        .update({
          daily_session_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      
      if (error) {
        console.error("Erreur lors de la réinitialisation du compteur de sessions:", error);
        return;
      }
      
      console.log("Réinitialisation du compteur de sessions quotidien réussie");
      
      // Rafraîchir les données
      await fetchUserData();
      
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des compteurs:", error);
    }
  }, [fetchUserData]);

  return {
    fetchUserData,
    resetDailyCounters
  };
};
