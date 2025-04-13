
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { checkDailyLimit } from '@/utils/subscription';
import { generateReferralLink } from '@/utils/referralUtils';
import { UserFetcherState } from './useUserDataState';
import { getCurrentSession } from '@/utils/auth/sessionUtils';
import { toast } from '@/components/ui/use-toast';

export const useUserDataFetching = (
  loadUserProfile: (userId: string, userEmail?: string | null) => Promise<any>,
  loadUserBalance: (userId: string, isNewUser: boolean) => Promise<any>,
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

      console.log("Session found, user:", session.user.email);

      // Récupérer toutes les données utilisateur en incluant les parrainages
      const userData = await fetchCompleteUserData(session.user.id, session.user.email);
      
      if (!userData) {
        console.error("Failed to fetch complete user data");
        setIsLoading(false);
        return;
      }
      
      // Récupérer explicitement le profil utilisateur pour garantir des données à jour
      const refreshedProfile = await loadUserProfile(session.user.id, session.user.email);
      console.log("Refreshed profile:", refreshedProfile);
      
      // Récupérer les données de solde
      const balanceResult = await loadUserBalance(session.user.id, isNewUser);
      if (!balanceResult) {
        console.error("Failed to load balance data");
        setIsLoading(false);
        return;
      }
      
      const { balanceData } = balanceResult;

      // Récupérer explicitement les transactions
      const transactionsData = await fetchUserTransactions(session.user.id);
      
      // Obtenir le nom complet de l'utilisateur depuis différentes sources
      // Priorité: 1. Profil rafraîchi, 2. Métadonnées de session, 3. Email, 4. Fallback
      const fullName = refreshedProfile?.full_name || 
                      session.user.user_metadata?.full_name || 
                      session.user.email?.split('@')[0] || 
                      'Utilisateur';
      
      // Stocker dans localStorage pour une récupération rapide
      localStorage.setItem('lastKnownUsername', fullName);
      
      console.log("User full name detected:", fullName);

      // Créer l'objet de données utilisateur
      const newUserData = {
        username: fullName,
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        referrals: userData.referrals || [],
        referralLink: userData.referralLink || generateReferralLink(session.user.id),
        email: session.user.email || undefined,
        transactions: transactionsData,
        profile: {
          ...refreshedProfile,
          id: session.user.id,
          full_name: fullName
        }
      };
      
      const newDailySessionCount = balanceData?.daily_session_count || 0;
      
      // Calculer les gains du jour pour vérifier la limite
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const todaysTransactions = transactionsData?.filter(tx => 
        tx.date && tx.date.startsWith(today) && tx.gain > 0
      ) || [];
      const todaysGains = todaysTransactions.reduce((sum, tx) => sum + (tx.gain || 0), 0);
      
      // Vérifier si la limite quotidienne est atteinte
      const limitReached = checkDailyLimit(todaysGains, balanceData?.subscription || 'freemium');
      
      // Mettre à jour les données
      updateUserData({
        userData: newUserData,
        isNewUser: userData.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
      
      console.log("User data updated successfully:", newUserData);
      
      // Dispatch un événement pour informer le reste de l'application
      window.dispatchEvent(new CustomEvent('user:data-loaded', {
        detail: { username: fullName }
      }));
      
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, isNewUser, updateUserData, setIsLoading]);

  // Fonction pour réinitialiser les compteurs quotidiens
  const resetDailyCounters = useCallback(async () => {
    try {
      console.log("Réinitialisation des compteurs de sessions quotidiens...");
      
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("Pas de session active pour la réinitialisation");
        return;
      }
      
      const { error } = await supabase
        .from('user_balances')
        .update({
          daily_session_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      
      if (error) {
        console.error("Erreur lors de la réinitialisation:", error);
        return;
      }
      
      console.log("Réinitialisation réussie");
      
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
