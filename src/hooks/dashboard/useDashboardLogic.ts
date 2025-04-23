import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import balanceManager from '@/utils/balance/balanceManager';
import { toast } from '@/components/ui/use-toast';
import useInitUserData from '@/hooks/useInitUserData';
import { useBalanceUpdater } from '@/hooks/useBalanceUpdater';
import { useBalanceSync } from '@/hooks/useBalanceSync';
import { useUserDataRefresh } from '@/hooks/session/useUserDataRefresh';
import { useAutomaticRevenue } from '@/hooks/useAutomaticRevenue';
import { useAutoSessionScheduler } from '@/hooks/useAutoSessionScheduler';
import { usePeriodicUpdates } from '@/hooks/usePeriodicUpdates';

export function useDashboardLogic() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInitializing, username, refreshData, userData } = useInitUserData();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);
  const todaysGainsRef = useRef<number>(0);
  const { updateBalance } = useBalanceUpdater();
  const { lastBalanceUpdate, setLastBalanceUpdate, fetchLatestBalance } = useBalanceSync(userData, isPreloaded);
  const { refreshUserData } = useUserDataRefresh();
  const {
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress
  } = useAutomaticRevenue({ userData, updateBalance });

  useAutoSessionScheduler(todaysGainsRef, generateAutomaticRevenue, userData, isBotActive);

  const forceBalanceRefresh = useCallback(() => {
    if (!userData) return;
    if (userData.id || userData.profile?.id) {
      const userId = userData.id || userData.profile?.id;
      balanceManager.setUserId(userId);
    }
    const currentBalance = balanceManager.getCurrentBalance();
    if (currentBalance <= 0) {
      if (userData?.id) {
        fetchLatestBalance(userData.id)
          .then(result => {
            if (result && result.balance > 0) {
              balanceManager.forceBalanceSync(result.balance, userData.id);
              setLastBalanceUpdate(Date.now());
            }
          });
      }
      return;
    }
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: {
        newBalance: currentBalance,
        timestamp: Date.now(),
        userId: userData.id || userData.profile?.id
      }
    }));
    setLastBalanceUpdate(Date.now());
  }, [userData, fetchLatestBalance, setLastBalanceUpdate]);

  usePeriodicUpdates(
    userData,
    generateAutomaticRevenue,
    lastProcessTime,
    setLastProcessTime,
    lastBalanceUpdate,
    forceBalanceRefresh
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (!authLoading && user) {
      if (user.id) {
        balanceManager.setUserId(user.id);
        const cachedBalance = parseFloat(localStorage.getItem(`lastKnownBalance_${user.id}`) || '0');
        if (cachedBalance > 0) {
          balanceManager.forceBalanceSync(cachedBalance, user.id);
        }
      }
      setTimeout(() => {
        setDashboardReady(true);
      }, 300);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isInitializing && username && isFirstLoad && user?.id) {
      setIsFirstLoad(false);
      toast({
        title: `Bienvenue, ${username}!`,
        description: "Votre tableau de bord est prêt. Les agents IA sont en cours d'analyse.",
        duration: 3000,
      });
      window.dispatchEvent(new CustomEvent('dashboard:ready', {
        detail: { username, timestamp: Date.now() }
      }));
      const initTimestamp = Date.now();
      localStorage.setItem('dashboardLastInit', initTimestamp.toString());
      setLastProcessTime(initTimestamp);
      if (userData) {
        if (userData.id || userData.profile?.id) {
          const userId = userData.id || userData.profile?.id;
          balanceManager.setUserId(userId);
          if (userId) {
            fetchLatestBalance(userId).then(result => {
              if (result && result.balance > 0) {
                balanceManager.forceBalanceSync(result.balance, userId);
              }
            });
          }
        }
        setTimeout(() => {
          if (userData.balance !== undefined && userData.balance > 0) {
            balanceManager.forceBalanceSync(userData.balance, userData.id || userData.profile?.id);
          } else {
            const localBalance = balanceManager.getCurrentBalance();
            if (localBalance > 0) {
              forceBalanceRefresh();
            }
          }
          const lastVisit = localStorage.getItem('last_visit_date');
          const now = new Date().toDateString();
          if (lastVisit && lastVisit !== now) {
            const lastVisitDate = new Date(lastVisit);
            lastVisitDate.setHours(0, 0, 0, 0);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const daysDifference = Math.floor((currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDifference > 0) {
              setTimeout(() => {
                generateAutomaticRevenue(true);
                toast({
                  title: "Mise à jour de votre solde",
                  description: `Progression pendant votre absence: +${(Math.random() * 0.1 + 0.05).toFixed(2)}€`,
                  duration: 4000
                });
              }, 2000);
            }
          }
          localStorage.setItem('last_visit_date', now);
          generateAutomaticRevenue(true);
          refreshUserData();
        }, 1000);
      }
    }
  }, [isInitializing, username, isFirstLoad, userData, generateAutomaticRevenue, forceBalanceRefresh, user, refreshUserData, fetchLatestBalance]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      forceBalanceRefresh();
    }, 15000);

    const handleBeforeUnload = () => {
      const currentBalance = balanceManager.getCurrentBalance();
      if (currentBalance > 0 && user?.id) {
        localStorage.setItem(`lastKnownBalance_${user.id}`, currentBalance.toString());
        localStorage.setItem(`currentBalance_${user.id}`, currentBalance.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [forceBalanceRefresh, user]);

  return {
    user,
    authLoading,
    navigate,
    isInitializing,
    username,
    refreshData,
    userData,
    isFirstLoad,
    dashboardReady,
    isPreloaded,
    setIsPreloaded,
    lastProcessTime,
    setLastProcessTime,
    updateBalance,
    lastBalanceUpdate,
    setLastBalanceUpdate,
    fetchLatestBalance,
    refreshUserData,
    generateAutomaticRevenue,
    isBotActive,
    dailyLimitProgress
  };
}
