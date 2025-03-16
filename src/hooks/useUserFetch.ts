
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
    let isMounted = true;
    
    const fetchUserData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error("No session found");
          navigate('/login');
          if (isMounted) setIsLoading(false);
          return;
        }

        // Récupérer le profil utilisateur
        const profileData = await fetchUserProfile(session.user.id, session.user.email);
        
        if (!profileData) {
          console.log("Création d'un nouveau profil pour l'utilisateur");
          try {
            // Essayer de créer un profil
            await supabase.rpc('create_profile', {
              user_id: session.user.id,
              user_name: session.user.email?.split('@')[0] || 'utilisateur',
              user_email: session.user.email || ''
            });
          } catch (error) {
            console.error("Error creating profile with RPC:", error);
            // Tentative directe en cas d'échec de la RPC
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
        
        // Récupérer le profil mis à jour
        const { data: refreshedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Erreur lors de la récupération du profil:", profileError);
        }

        // Récupérer les données de balance
        const balanceResult = await fetchUserBalance(session.user.id);
        let balanceData = null;
        let isUserNew = false;
        
        // Traiter les données de balance
        if (balanceResult) {
          balanceData = balanceResult.data;
          isUserNew = balanceResult.isNewUser;
        } else {
          // Créer un nouveau bilan si nécessaire
          try {
            const { data: newBalance, error: balanceError } = await supabase
              .rpc('create_user_balance', {
                user_id: session.user.id
              });
              
            if (balanceError) {
              throw balanceError;
            }
            
            if (newBalance) {
              // Extraire les données correctement
              balanceData = Array.isArray(newBalance) ? newBalance[0] : newBalance;
              isUserNew = true;
            } else {
              throw new Error("Échec de la création du bilan");
            }
          } catch (error) {
            console.error("Échec de la création du bilan:", error);
            if (isMounted) {
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
        }
        
        if (isUserNew && isMounted) {
          setIsNewUser(true);
          toast({
            title: "Bienvenue sur CashBot !",
            description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
          });
        }

        // Récupérer les transactions
        const transactionsData = await fetchUserTransactions(session.user.id);

        const displayName = refreshedProfile?.full_name || 
                           session.user.user_metadata?.full_name || 
                           (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

        if (isMounted) {
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
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        if (isMounted) {
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
    
    return () => {
      isMounted = false;
    };
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

// Helper function to check daily limit
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
