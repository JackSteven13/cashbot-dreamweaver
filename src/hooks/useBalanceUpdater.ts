
import { useCallback } from 'react';
import balanceManager from '@/utils/balance/balanceManager';

export const useBalanceUpdater = () => {
  const updateBalance = useCallback(async (gain: number, report: string, forceUpdate: boolean = false) => {
    console.log(`Updating balance with gain: ${gain}, report: ${report}, forceUpdate: ${forceUpdate}`);
    
    const currentBalance = balanceManager.getCurrentBalance();
    const newBalance = parseFloat((currentBalance + gain).toFixed(2));
    
    window.dispatchEvent(new CustomEvent('balance:update', {
      detail: { 
        amount: gain, 
        currentBalance: newBalance, 
        animate: true 
      }
    }));
    
    window.dispatchEvent(new CustomEvent('balance:force-update', {
      detail: { 
        newBalance: newBalance,
        gain: gain,
        timestamp: Date.now() 
      }
    }));
    
    if (forceUpdate && localStorage.getItem('subscription') === 'freemium') {
      localStorage.setItem('freemium_daily_limit_reached', 'true');
      localStorage.setItem('last_session_date', new Date().toDateString());
    }
    
    return Promise.resolve();
  }, []);

  return { updateBalance };
};
