
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SUBSCRIPTION_LIMITS, checkDailyLimit } from '@/utils/subscriptionUtils';

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

// Get initial user data from localStorage
const getInitialUserData = (): UserData => {
  // Check if user is new by looking for a stored flag in localStorage
  const isNewUser = !localStorage.getItem('user_registered');
  const subscription = localStorage.getItem('subscription') || 'freemium';
  
  // Ensure consistency with subscription limits
  const storedBalance = parseFloat(localStorage.getItem('user_balance') || '0');
  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS];
  
  // If balance exceeds daily limit for freemium accounts, cap it
  const balanceToUse = subscription === 'freemium' && storedBalance > dailyLimit 
    ? dailyLimit 
    : storedBalance;
  
  // Save the corrected balance
  if (subscription === 'freemium' && storedBalance > dailyLimit) {
    localStorage.setItem('user_balance', balanceToUse.toString());
  }
  
  return {
    username: localStorage.getItem('username') || 'utilisateur',
    balance: balanceToUse,
    subscription: subscription,
    referrals: [],
    referralLink: 'https://cashbot.com?ref=admin',
    transactions: isNewUser ? [] : [
      {
        date: '2023-09-15',
        gain: 0.42,
        report: "Session réussie avec résultats supérieurs à la moyenne. Performance optimisée par nos algorithmes exclusifs. Notre technologie a identifié les meilleures opportunités disponibles avec un taux de conversion exceptionnel."
      },
      {
        date: '2023-09-14',
        gain: 0.29,
        report: "Le système a généré des revenus constants tout au long de la session. Notre technologie propriétaire a utilisé sa stratégie adaptive pour maximiser le rendement dans les conditions du marché actuel."
      },
      {
        date: '2023-09-13',
        gain: 0.48,
        report: "Performance exceptionnelle avec un rendement supérieur à la moyenne. Notre système propriétaire a identifié des opportunités de premier ordre, générant un revenu significativement plus élevé que prévu pour cette session."
      }
    ]
  };
};

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData>(getInitialUserData);
  const [isNewUser, setIsNewUser] = useState(false);
  const [dailySessionCount, setDailySessionCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('daily_session_count') || '0');
  });
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  // Check if this is the first visit
  useEffect(() => {
    const isNew = !localStorage.getItem('user_registered');
    setIsNewUser(isNew);
    
    if (isNew) {
      // Show welcome message for new users
      toast({
        title: "Bienvenue sur CashBot !",
        description: "Votre compte a été créé avec succès. Notre système est maintenant actif pour vous.",
      });
      // Set the flag for future visits
      localStorage.setItem('user_registered', 'true');
      // Initialize the balance to 0 for new users
      localStorage.setItem('user_balance', '0');
      setUserData(prev => ({
        ...prev,
        balance: 0,
        transactions: []
      }));
      localStorage.setItem('daily_session_count', '0');
    }
    
    // Check if daily limit alert should be shown
    if (checkDailyLimit(userData.balance, userData.subscription)) {
      setShowLimitAlert(true);
    }
  }, [userData.balance, userData.subscription]);

  // Update user balance after a session
  const updateBalance = (gain: number, report: string) => {
    setUserData(prev => {
      const newBalance = parseFloat((prev.balance + gain).toFixed(2));
      // Check if limit reached
      const limitReached = newBalance >= SUBSCRIPTION_LIMITS[prev.subscription as keyof typeof SUBSCRIPTION_LIMITS] && prev.subscription === 'freemium';
      
      if (limitReached) {
        setShowLimitAlert(true);
      }
      
      // Save new balance to localStorage
      localStorage.setItem('user_balance', newBalance.toString());
      
      return {
        ...prev,
        balance: newBalance,
        transactions: [
          {
            date: new Date().toISOString().split('T')[0],
            gain: gain,
            report: report
          },
          ...prev.transactions
        ]
      };
    });
  };

  // Reset balance (for withdrawals)
  const resetBalance = () => {
    const currentBalance = userData.balance;
    setUserData(prev => {
      localStorage.setItem('user_balance', '0');
      
      return {
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
      };
    });
  };

  // Update session count
  const incrementSessionCount = () => {
    const newCount = dailySessionCount + 1;
    setDailySessionCount(newCount);
    localStorage.setItem('daily_session_count', newCount.toString());
  };

  return {
    userData,
    isNewUser,
    dailySessionCount,
    showLimitAlert,
    setShowLimitAlert,
    updateBalance,
    resetBalance,
    incrementSessionCount
  };
};
