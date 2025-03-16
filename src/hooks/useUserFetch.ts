
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { 
  fetchUserProfile, 
  fetchUserBalance, 
  fetchUserTransactions 
} from '@/utils/userDataFetch';
import { UserData } from '@/types/userData';

interface UserFetchResult {
  userData: UserData;
  isNewUser: boolean;
  dailySessionCount: number;
  showLimitAlert: boolean;
  isLoading: boolean;
  setShowLimitAlert: (show: boolean) => void;
}

export const useUserFetch = (): UserFetchResult => {
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
          try {
            await supabase.rpc('create_profile', {
              user_id: session.user.id,
              user_name: session.user.email?.split('@')[0] || 'utilisateur',
              user_email: session.user.email || ''
            });
          } catch (error) {
            console.error("Error creating profile with RPC:", error);
            // Tentative directe
            try {
              await supabase.from('profiles').insert({
                id: session.user.id,
                full_name: session.user.email?.split('@')[0] || 'utilisateur',
                email: session.user.email
              });
            } catch (insertError) {
              console.error("Error with direct profile insertion:", insertError);
            }
          }
        }
        
        // Récupérer à nouveau le profil
        const { data: refreshedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Initialize variables outside the conditional blocks to avoid reassignment issues
        let balanceData = null;
        let isUserNew = false;
        
        // Try to fetch balance data
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
            
            // Instead of reassigning balanceResult, assign to the variables we created
            balanceData = Array.isArray(newBalance) ? newBalance[0] : newBalance;
            isUserNew = true;
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
        } else {
          // Extract data and isNewUser from successful balanceResult
          balanceData = balanceResult.data;
          isUserNew = balanceResult.isNewUser;
        }
        
        if (isUserNew) {
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

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    setShowLimitAlert
  };
};

// Helper function to check daily limit (moved from useEffect)
const checkDailyLimit = (balance: number, subscription: string) => {
  // Import this from subscriptionUtils if needed
  const SUBSCRIPTION_LIMITS: Record<string, number> = {
    'freemium': 0.5,
    'pro': 5,
    'visionnaire': 20,
    'alpha': 50
  };
  
  return balance >= (SUBSCRIPTION_LIMITS[subscription] || 0.5);
};
