
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchCompleteUserData } from '@/utils/user/userDataFetch';
import { fetchUserTransactions } from '@/utils/user/transactionUtils';
import { checkDailyLimit } from '@/utils/subscription'; // Correction: import depuis le bon dossier
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

      // Récupérer les transactions
      const transactionsData = await fetchUserTransactions(session.user.id);

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
      
      // Vérifier si la limite quotidienne est atteinte
      const limitReached = checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium');
      
      // Mettre à jour les données avec protection contre les boucles
      updateUserData({
        userData: newUserData,
        isNewUser: userData.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false
      });
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setIsLoading(false);
    }
  }, [loadUserProfile, loadUserBalance, isNewUser, updateUserData, setIsLoading]);

  // Nouvelle fonction pour réinitialiser les compteurs quotidiens
  const resetDailyCounters = useCallback(async () => {
    try {
      console.log("Réinitialisation des compteurs quotidiens...");
      
      // Vérifier si une session existe
      const session = await getCurrentSession();
      
      if (!session) {
        console.error("Pas de session active pour la réinitialisation");
        return;
      }
      
      // Récupérer la souscription de l'utilisateur pour déterminer si c'est un compte gratuit
      const { data: userBalance } = await supabase
        .from('user_balances')
        .select('subscription')
        .eq('id', session.user.id)
        .single();
      
      if (!userBalance) {
        console.error("Impossible de récupérer les données de l'utilisateur");
        return;
      }
      
      // Pour les comptes freemium, réinitialiser le solde à 0 chaque jour
      if (userBalance.subscription === 'freemium') {
        const { data, error } = await supabase
          .from('user_balances')
          .update({
            balance: 0,
            daily_session_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)
          .select();
        
        if (error) {
          console.error("Erreur lors de la réinitialisation du solde:", error);
          return;
        }
        
        console.log("Réinitialisation quotidienne effectuée pour le compte freemium");
        
        // Ajouter une transaction pour documenter la réinitialisation
        await supabase.from('transactions').insert([{
          user_id: session.user.id,
          report: "Réinitialisation quotidienne du compte freemium",
          gain: 0,
          date: new Date().toISOString().split('T')[0]
        }]);
        
        // Mettre à jour l'interface utilisateur après réinitialisation
        await fetchUserData();
        
        // Notification à l'utilisateur
        toast({
          title: "Compteurs quotidiens réinitialisés",
          description: "Vous pouvez à nouveau gagner jusqu'à 0.50€ aujourd'hui avec votre compte freemium.",
        });
      } else {
        // Pour les comptes payants, réinitialiser uniquement le compteur de sessions
        const { error } = await supabase
          .from('user_balances')
          .update({
            daily_session_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
        
        if (error) {
          console.error("Erreur lors de la réinitialisation du compteur de sessions:", error);
        } else {
          console.log("Réinitialisation du compteur de sessions pour compte payant");
          // Rafraîchir les données
          await fetchUserData();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des compteurs:", error);
    }
  }, [fetchUserData]);

  return {
    fetchUserData,
    resetDailyCounters
  };
};
