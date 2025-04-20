
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserTransactions } from '@/utils/userData/transactionUtils';
import { UserData, Transaction } from '@/types/userData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { generateReferralLink } from '@/utils/referral/referralLinks';

/**
 * Hook pour récupérer et gérer les données utilisateur
 */
export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const { user } = useAuth();

  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = useCallback(async () => {
    if (!user?.id) {
      console.error('No user found, cannot refresh data');
      return null;
    }

    setIsLoading(true);
    
    try {
      // Récupérer les données de profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }
      
      // Récupérer les données de solde
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (balanceError && balanceError.code !== 'PGRST116') {
        // PGRST116 est l'erreur "aucune ligne trouvée", ce qui est normal pour un nouvel utilisateur
        console.error('Error fetching balance:', balanceError);
        throw balanceError;
      }
      
      // Récupérer les transactions explicitement
      console.log('Fetching transactions for user:', user.id);
      const transactions = await fetchUserTransactions(user.id);
      console.log('Fetched transactions:', transactions);

      // Récupérer les parrainages de l'utilisateur
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      }
      
      // Générer le lien de parrainage avec l'ID utilisateur
      const userReferralLink = generateReferralLink(user.id);
      console.log('Generated referral link:', userReferralLink);
      
      // Construire l'objet de données utilisateur
      const newUserData: UserData = {
        username: profileData?.full_name || user.email?.split('@')[0] || 'User',
        balance: balanceData?.balance || 0,
        subscription: balanceData?.subscription || 'freemium',
        transactions: transactions || [],
        profile: profileData || { id: user.id },
        referrals: referralsData || [],
        referralLink: userReferralLink
      };
      
      setUserData(newUserData);
      setIsNewUser(!balanceData);
      
      // Mettre en cache les données clés pour un accès rapide
      try {
        localStorage.setItem('lastKnownUsername', newUserData.username);
        localStorage.setItem('lastKnownBalance', newUserData.balance.toString());
        localStorage.setItem('subscription', newUserData.subscription);
        localStorage.setItem('referralLink', newUserData.referralLink);
      } catch (e) {
        console.error('Error caching user data', e);
      }
      
      return newUserData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer vos données. Veuillez réessayer.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les données initiales
  useEffect(() => {
    if (user?.id) {
      refreshUserData();
    } else {
      setIsLoading(false);
    }
  }, [user, refreshUserData]);
  
  // Fonction pour mettre à jour le solde
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate = false) => {
    if (!user?.id || !userData) return;
    
    try {
      // Optimistic update with type safety
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedBalance: number = (prev.balance || 0) + gain;
        
        return {
          ...prev,
          balance: updatedBalance,
          transactions: [{
            date: new Date().toISOString(),
            gain,
            report,
            type: 'Session'
          }, ...(prev.transactions || [])]
        };
      });
      
      // Mettre à jour le solde dans la base de données en utilisant une mise à jour directe
      // au lieu de l'appel RPC increase_balance qui n'est pas disponible
      const { error } = await supabase
        .from('user_balances')
        .update({ 
          balance: (userData.balance || 0) + gain,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating balance:', error);
        throw error;
      }
      
      // Ajouter la transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          gain,
          report,
          date: new Date().toISOString().split('T')[0]
        });
        
      if (txError) {
        console.error('Error adding transaction:', txError);
        throw txError;
      }
      
      // Si forceUpdate est vrai, actualiser les données
      if (forceUpdate) {
        await refreshUserData();
      }
    } catch (error) {
      console.error('Error in updateBalance:', error);
      // Rollback optimistic update
      refreshUserData();
    }
  }, [user, userData, refreshUserData]);
  
  return {
    userData,
    isNewUser,
    isLoading,
    refreshUserData,
    updateBalance
  };
};

export default useUserData;
