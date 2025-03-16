import { useState, useEffect, useRef } from 'react';
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
  refetchUserData?: () => Promise<void>;
}

// Initial empty user data
const initialUserData: UserData = {
  username: '',
  balance: 0,
  subscription: 'freemium',
  referrals: [],
  referralLink: 'https://cashbot.com?ref=admin',
  transactions: []
};

export const useUserFetch = (): UserFetchResult => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState(0);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // Define fetchUserData function outside useEffect so it can be reused for refetch
  const fetchUserData = async () => {
    if (!isMounted.current) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("No session found");
        if (isMounted.current) setIsLoading(false);
        return;
      }

      // Get user profile
      const profileData = await fetchUserProfile(session.user.id, session.user.email);
      
      if (!profileData) {
        console.log("Création d'un nouveau profil pour l'utilisateur");
        try {
          // Try to create a profile
          await supabase.rpc('create_profile', {
            user_id: session.user.id,
            user_name: session.user.email?.split('@')[0] || 'utilisateur',
            user_email: session.user.email || ''
          });
        } catch (error) {
          console.error("Error creating profile with RPC:", error);
          // Direct attempt if RPC fails
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
      
      // Get updated profile
      const { data: refreshedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
      }

      // Get balance data
      let balanceData = null;
      let isUserNew = false;
      const balanceResult = await fetchUserBalance(session.user.id);
      
      // Process balance data
      if (balanceResult) {
        balanceData = balanceResult.data;
        isUserNew = balanceResult.isNewUser;
      } else {
        // Create new balance if needed
        try {
          const { data: newBalance, error: balanceError } = await supabase
            .rpc('create_user_balance', {
              user_id: session.user.id
            });
            
          if (balanceError) {
            throw balanceError;
          }
          
          if (newBalance) {
            balanceData = Array.isArray(newBalance) ? newBalance[0] : newBalance;
            isUserNew = true;
          } else {
            throw new Error("Failed to create balance");
          }
        } catch (error) {
          console.error("Failed to create balance:", error);
          if (isMounted.current) {
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Show welcome message for new users
      if (isUserNew && isMounted.current) {
        setIsNewUser(true);
        toast({
          title: "Bienvenue sur CashBot !",
          description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
        });
      }

      // Get transactions
      const transactionsData = await fetchUserTransactions(session.user.id);

      const displayName = refreshedProfile?.full_name || 
                         session.user.user_metadata?.full_name || 
                         (session.user.email ? session.user.email.split('@')[0] : 'utilisateur');

      if (isMounted.current) {
        const newUserData = {
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
        };
        
        setUserData(newUserData);
        setDailySessionCount(balanceData?.daily_session_count || 0);
        
        if (checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium')) {
          setShowLimitAlert(true);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;
    
    fetchUserData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [navigate]);

  // Create a refetch function that can be called to update user data
  const refetchUserData = async () => {
    if (isMounted.current) {
      setIsLoading(true);
      await fetchUserData();
    }
  };

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    isLoading,
    setShowLimitAlert,
    refetchUserData
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
