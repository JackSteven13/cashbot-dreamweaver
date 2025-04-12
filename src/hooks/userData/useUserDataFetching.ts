
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

      // Récupérer le profil utilisateur
      const refreshedProfile = await loadUserProfile(session.user.id, session.user.email);
      
      // Récupérer les données de solde
      const balanceResult = await loadUserBalance(session.user.id);
      if (!balanceResult) {
        setIsLoading(false);
        return;
      }
      
      const { balanceData } = balanceResult;

      // Récupérer explicitement les transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
      }
      
      // Déterminer le nom d'affichage de l'utilisateur
      const displayName = refreshedProfile?.full_name || 
                         session.user.user_metadata?.full_name || 
                         (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

      // Calculate today's gains by filtering transactions from today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const transactions = transactionsData || [];
      const todaysTransactions = transactions.filter(tx => 
        tx.created_at && tx.created_at.startsWith(today) && (tx.gain > 0 || tx.amount > 0)
      );
      
      const todaysGains = todaysTransactions.reduce((sum, tx) => {
        // Calculer les gains totaux en utilisant gain ou amount selon ce qui est disponible
        return sum + (typeof tx.gain === 'number' ? tx.gain : (typeof tx.amount === 'number' ? tx.amount : 0));
      }, 0);

      // Calculer la progression de la limite quotidienne
      const dailyLimit = getDailyLimitForSubscription(balanceData?.subscription || 'freemium');
      const dailyLimitProgress = Math.min(100, (todaysGains / dailyLimit) * 100);
      
      // Stocker les gains quotidiens dans localStorage pour la persistance
      localStorage.setItem(`dailyGains_${session.user.id}`, todaysGains.toString());
      localStorage.setItem(`dailyLimitProgress_${session.user.id}`, dailyLimitProgress.toString());

      // Déclencher un événement pour mettre à jour la jauge de limite quotidienne
      window.dispatchEvent(new CustomEvent('dailyGains:updated', { 
        detail: { gains: todaysGains, progress: dailyLimitProgress } 
      }));

      // Créer l'objet de données utilisateur
      const userData = {
        username: displayName,
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        transactions: transactions,
        profile: { ...refreshedProfile, id: session.user.id, full_name: displayName }
      };
      
      const newDailySessionCount = balanceData?.daily_session_count || 0;
      
      // Vérifier si la limite quotidienne est atteinte
      const limitReached = todaysGains >= dailyLimit;
      
      // Mettre à jour les données avec protection contre les boucles
      updateUserData({
        userData,
        isNewUser: balanceResult.isNewUser || isNewUser,
        dailySessionCount: newDailySessionCount,
        showLimitAlert: limitReached,
        isLoading: false,
        dailyLimitProgress
      });
      
      console.log("Données utilisateur mises à jour:", userData);
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
      
      // Réinitialiser les données de limite quotidienne
      localStorage.setItem(`dailyGains_${session.user.id}`, '0');
      localStorage.setItem(`dailyLimitProgress_${session.user.id}`, '0');
      
      // Déclencher un événement pour réinitialiser la jauge
      window.dispatchEvent(new CustomEvent('dailyGains:reset'));
      
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

// Fonction pour obtenir la limite quotidienne selon l'abonnement
function getDailyLimitForSubscription(subscription: string): number {
  switch (subscription) {
    case 'starter':
    case 'alpha':
      return 2;
    case 'gold':
      return 5;
    case 'elite':
      return 10;
    case 'freemium':
    default:
      return 0.5;
  }
}
