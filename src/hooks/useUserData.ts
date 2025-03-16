
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS, checkDailyLimit } from '@/utils/subscriptionUtils';
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  date: string;
  gain: number;
  report: string;
}

export interface UserData {
  username: string;
  balance: number;
  subscription: string;
  referrals: any[];
  referralLink: string;
  transactions: Transaction[];
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    balance: 0,
    subscription: 'freemium',
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: []
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('daily_session_count') || '0');
  });
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from Supabase when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error("No session found");
          setIsLoading(false);
          return;
        }

        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // If no profile found, try to create one
          if (profileError.code === 'PGRST116') {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const { error: createError } = await supabase
                .rpc('create_profile', {
                  user_id: userData.user.id,
                  user_name: userData.user.email?.split('@')[0] || 'utilisateur',
                  user_email: userData.user.email || ''
                });
                
              if (createError) {
                console.error("Error creating profile:", createError);
              }
            }
          }
        }
        
        // Get user metadata
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError);
          setIsLoading(false);
          return;
        }

        // Get stored balance, or set to 0 for new users
        const storedBalance = parseFloat(localStorage.getItem(`balance_${session.user.id}`) || '0');
        const isNewUserFlag = !localStorage.getItem(`user_registered_${session.user.id}`);
        
        if (isNewUserFlag) {
          localStorage.setItem(`user_registered_${session.user.id}`, 'true');
          localStorage.setItem(`balance_${session.user.id}`, '0');
          
          // Show welcome message for new users
          toast({
            title: "Bienvenue sur CashBot !",
            description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
          });
        }

        // Set username from profile data or from user email
        const displayName = profileData?.full_name || 
                           userData.user?.user_metadata?.full_name || 
                           (userData.user?.email ? userData.user.email.split('@')[0] : 'utilisateur');

        // Get subscription type
        const subscription = localStorage.getItem(`subscription_${session.user.id}`) || 'freemium';
        
        // Get daily session count
        const sessionCount = parseInt(localStorage.getItem(`daily_session_count_${session.user.id}`) || '0');
        setDailySessionCount(sessionCount);

        // Set user data
        setUserData({
          username: displayName,
          balance: storedBalance,
          subscription: subscription,
          referrals: [],
          referralLink: `https://cashbot.com?ref=${session.user.id.substring(0, 8)}`,
          transactions: [
            {
              date: '2023-09-15',
              gain: 0.42,
              report: "Session réussie avec résultats supérieurs à la moyenne. Performance optimisée par nos algorithmes exclusifs."
            },
            {
              date: '2023-09-14',
              gain: 0.29,
              report: "Le système a généré des revenus constants tout au long de la session."
            },
            {
              date: '2023-09-13',
              gain: 0.48,
              report: "Performance exceptionnelle avec un rendement supérieur à la moyenne."
            }
          ]
        });

        setIsNewUser(isNewUserFlag);
        
        // Check if daily limit alert should be shown
        if (checkDailyLimit(storedBalance, subscription)) {
          setShowLimitAlert(true);
        }

      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Update user balance after a session
  const updateBalance = async (gain: number, report: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Ensure gain is always positive
    const positiveGain = Math.max(0, gain);
    
    const userId = session.user.id;
    const currentBalance = userData.balance;
    const newBalance = parseFloat((currentBalance + positiveGain).toFixed(2));
    
    // Check if limit reached
    const limitReached = newBalance >= SUBSCRIPTION_LIMITS[userData.subscription as keyof typeof SUBSCRIPTION_LIMITS] && userData.subscription === 'freemium';
    
    if (limitReached) {
      setShowLimitAlert(true);
    }
    
    // Save new balance to localStorage with user-specific key
    localStorage.setItem(`balance_${userId}`, newBalance.toString());
    
    setUserData(prev => ({
      ...prev,
      balance: newBalance,
      transactions: [
        {
          date: new Date().toISOString().split('T')[0],
          gain: positiveGain,
          report: report
        },
        ...prev.transactions
      ]
    }));
  };

  // Reset balance (for withdrawals)
  const resetBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    const currentBalance = userData.balance;
    
    localStorage.setItem(`balance_${userId}`, '0');
    
    setUserData(prev => ({
      ...prev,
      balance: 0,
      transactions: [
        {
          date: new Date().toISOString().split('T')[0],
          gain: -currentBalance,
          report: `Retrait de ${currentBalance.toFixed(2)}€ effectué avec succès. Le transfert vers votre compte bancaire est en cours.`
        },
        ...prev.transactions
      ]
    }));
  };

  // Update session count
  const incrementSessionCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    const newCount = dailySessionCount + 1;
    
    setDailySessionCount(newCount);
    localStorage.setItem(`daily_session_count_${userId}`, newCount.toString());
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
