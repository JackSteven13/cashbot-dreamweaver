
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { balanceManager } from '@/utils/balance/balanceManager';

export const useUserData = () => {
  const { session } = useUserSession();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchUserData = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Récupérer les données utilisateur de base
      const { data: userBalance, error: userError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (userError) {
        console.error("Error fetching user data:", userError);
        setIsLoading(false);
        return;
      }
      
      // Récupérer les transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
        
      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
      }
      
      // Récupérer les parrainages
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', session.user.id);
        
      if (referralsError) {
        console.error("Error fetching referrals:", referralsError);
      }
      
      // Construire le lien de parrainage
      const referralLink = `${window.location.origin}/register?ref=${session.user.id}`;
      
      // Obtenir le solde du gestionnaire central (qui peut être différent de celui de la BD)
      balanceManager.initialize(userBalance?.balance || 0, session.user.id);
      const balanceValue = balanceManager.getCurrentBalance();
      
      // Réinitialiser les compteurs quotidiens si nécessaire (nouveau jour)
      const today = new Date().toISOString().split('T')[0];
      const lastDayKey = `lastActiveDay_${session.user.id}`;
      const lastActiveDay = localStorage.getItem(lastDayKey);
      
      if (lastActiveDay && lastActiveDay !== today) {
        // C'est un nouveau jour, réinitialisons les compteurs quotidiens
        balanceManager.resetDailyCounters(session.user.id);
        localStorage.setItem(lastDayKey, today);
      } else if (!lastActiveDay) {
        // Premier chargement, définir le jour actuel
        localStorage.setItem(lastDayKey, today);
      }
      
      // Combiner les données
      setUserData({
        ...userBalance,
        balance: balanceValue, // Utiliser le solde du gestionnaire
        transactions: transactions || [],
        referrals: referrals || [],
        referralLink
      });
      
    } catch (error) {
      console.error("Error in useUserData:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserData();
    
    // Écouter les événements de mise à jour
    const handleBalanceUpdate = () => {
      fetchUserData();
    };
    
    window.addEventListener('balance:updated', handleBalanceUpdate);
    window.addEventListener('referral:update', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:updated', handleBalanceUpdate);
      window.removeEventListener('referral:update', handleBalanceUpdate);
    };
  }, [session?.user?.id]);
  
  return { userData, isLoading, refetchUserData: fetchUserData };
};
