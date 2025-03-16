
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
  const [dailySessionCount, setDailySessionCount] = useState(0);
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

        // Get user balance data
        let balanceData;
        const { data: userBalanceData, error: balanceError } = await supabase
          .from('user_balances')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (balanceError) {
          console.error("Error fetching balance:", balanceError);
          // If balance not found, create a new entry
          if (balanceError.code === 'PGRST116') {
            const { data: newBalance, error: insertError } = await supabase
              .from('user_balances')
              .insert([{ id: session.user.id }])
              .select();
              
            if (insertError) {
              console.error("Error creating balance:", insertError);
            } else {
              balanceData = newBalance[0];
              setIsNewUser(true);
              
              // Show welcome message for new users
              toast({
                title: "Bienvenue sur CashBot !",
                description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
              });
            }
          }
        } else {
          balanceData = userBalanceData;
        }

        // Get user transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
        }

        // Set username from profile data or from user email
        const displayName = profileData?.full_name || 
                           userData.user?.user_metadata?.full_name || 
                           (userData.user?.email ? userData.user.email.split('@')[0] : 'utilisateur');

        // Set user data
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
        
        // Check if daily limit alert should be shown
        if (checkDailyLimit(balanceData?.balance || 0, balanceData?.subscription || 'freemium')) {
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
    
    try {
      // Update balance in database
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Error updating balance:", updateError);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour votre solde. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }
      
      // Add transaction in database
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          gain: positiveGain,
          report: report
        }]);
        
      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
      }
      
      // Update local state
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
    } catch (error) {
      console.error("Error in updateBalance:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Reset balance (for withdrawals)
  const resetBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    const currentBalance = userData.balance;
    
    try {
      // Reset balance in database
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Error resetting balance:", updateError);
        toast({
          title: "Erreur",
          description: "Impossible de traiter votre retrait. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }
      
      // Add withdrawal transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          gain: -currentBalance,
          report: `Retrait de ${currentBalance.toFixed(2)}€ effectué avec succès. Le transfert vers votre compte bancaire est en cours.`
        }]);
        
      if (transactionError) {
        console.error("Error creating withdrawal transaction:", transactionError);
      }
      
      // Update local state
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
    } catch (error) {
      console.error("Error in resetBalance:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Update session count
  const incrementSessionCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    const newCount = dailySessionCount + 1;
    
    try {
      // Update session count in database
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          daily_session_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Error updating session count:", updateError);
        return;
      }
      
      // Update local state
      setDailySessionCount(newCount);
    } catch (error) {
      console.error("Error in incrementSessionCount:", error);
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
