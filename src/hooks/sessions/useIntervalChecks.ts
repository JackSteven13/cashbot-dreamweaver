
import { useEffect } from 'react';
import balanceManager from '@/utils/balance/balanceManager';

interface UseIntervalChecksOptions {
  displayedBalance: number;
  setDisplayedBalance: (value: number) => void;
  setPreviousBalance: (value: number | null) => void;
}

export const useIntervalChecks = ({
  displayedBalance,
  setDisplayedBalance,
  setPreviousBalance
}: UseIntervalChecksOptions) => {
  useEffect(() => {
    const checkBalanceInterval = setInterval(() => {
      const managerBalance = balanceManager.getCurrentBalance();
      if (!isNaN(managerBalance) && Math.abs(managerBalance - displayedBalance) > 0.01) {
        console.log(`Correction du solde affiché: ${displayedBalance} → ${managerBalance}`);
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(managerBalance);
      }
    }, 5000);
    
    return () => clearInterval(checkBalanceInterval);
  }, [displayedBalance, setDisplayedBalance, setPreviousBalance]);
};
