
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { checkDailyLimit } from '@/utils/subscriptionUtils';
import { supabase } from "@/integrations/supabase/client";
import { UserData } from '@/types/userData';
import { 
  fetchUserProfile, 
  fetchUserBalance, 
  fetchUserTransactions 
} from '@/utils/userDataFetch';
import { useUserSession } from './useUserSession';
import { useNavigate } from 'react-router-dom';

export type { UserData };

export const useUserData = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({
    username: '',
    balance: 0,
    subscription: 'freemium',
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: []
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { incrementSessionCount: incrementSession, updateBalance: updateUserBalance, resetBalance: resetUserBalance } = useUserSession();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error("No session found");
          navigate('/login');
          setIsLoading(false);
          return;
        }

        // Récupérer le profil utilisateur
        const profileData = await fetchUserProfile(session.user.id, session.user.email);
        
        if (!profileData) {
          console.log("Création d'un nouveau profil pour l'utilisateur");
          // Tentative de création de profil
          await supabase.rpc('create_profile', {
            user_id: session.user.id,
            user_name: session.user.email?.split('@')[0] || 'utilisateur',
            user_email: session.user.email || ''
          }).catch(async (error) => {
            console.error("Error creating profile with RPC:", error);
            // Tentative directe
            await supabase.from('profiles').insert({
              id: session.user.id,
              full_name: session.user.email?.split('@')[0] || 'utilisateur',
              email: session.user.email
            });
          });
        }
        
        // Récupérer à nouveau le profil
        const { data: refreshedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const balanceResult = await fetchUserBalance(session.user.id);
        
        if (!balanceResult) {
          console.error("Impossible de récupérer les données de solde");
          
          // Tentative de création du bilan utilisateur
          try {
            const { data: newBalance } = await supabase
              .rpc('create_user_balance', {
                user_id: session.user.id
              });
              
            if (!newBalance) {
              throw new Error("Échec de la création du bilan");
            }
            
            balanceResult = { data: newBalance[0], isNewUser: true };
          } catch (error) {
            console.error("Échec de la création du bilan:", error);
            toast({
              title: "Erreur",
              description: "Impossible d'initialiser votre compte. Veuillez vous reconnecter.",
              variant: "destructive"
            });
            navigate('/login');
            setIsLoading(false);
            return;
          }
        }
        
        const { data: balanceData, isNewUser: newUser } = balanceResult;
        
        if (newUser) {
          setIsNewUser(true);
          
          toast({
            title: "Bienvenue sur CashBot !",
            description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
          });
        }

        const transactionsData = await fetchUserTransactions(session.user.id);

        const displayName = refreshedProfile?.full_name || 
                           session.user.user_metadata?.full_name || 
                           (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

        setUserData({
          username: displayName,
          balance: balanceData?.balance || 0,
          subscription: balanceData?.subscription || 'freemium',
          referrals: [],
          referralLink: `https://cashbot.com?ref=${session.user.id.substring(0, 8)}`,
          transactions: transactionsData ? transactionsData.map(t => ({
            date: t.date,
            gain: t.gain,
            report: t.report
          })) : []
        });

        setDailySessionCount(balanceData?.daily_session_count || 0);
        
        if (checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium')) {
          setShowLimitAlert(true);
        }

      } catch (error) {
        console.error("Error in fetchUserData:", error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const incrementSessionCount = async () => {
    const newCount = await incrementSession(dailySessionCount);
    if (typeof newCount === 'number') {
      setDailySessionCount(newCount);
    }
  };

  const updateBalance = async (gain: number, report: string) => {
    const result = await updateUserBalance(gain, report);
    
    if (result.success) {
      setUserData(prev => ({
        ...prev,
        balance: result.newBalance || prev.balance,
        transactions: result.transaction ? [
          result.transaction,
          ...prev.transactions
        ] : prev.transactions
      }));
      
      if (result.limitReached) {
        setShowLimitAlert(true);
      }
    }
  };

  const resetBalance = async () => {
    const result = await resetUserBalance();
    
    if (result.success) {
      setUserData(prev => ({
        ...prev,
        balance: 0,
        transactions: result.transaction ? [
          result.transaction,
          ...prev.transactions
        ] : prev.transactions
      }));
    }
  };

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount,
    isLoading
  };
};
