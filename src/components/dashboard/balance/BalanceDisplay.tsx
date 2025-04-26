
import React, { useState, useEffect, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { BalanceIndicators } from './components/BalanceIndicators';
import { BalanceValue } from './components/BalanceValue';
import { DailyLimitInfo } from './components/DailyLimitInfo';
import { GainNotification } from './components/GainNotification';
import balanceManager from '@/utils/balance/balanceManager';

interface BalanceDisplayProps {
  balance: number;
  currency?: string;
  isLoading?: boolean;
  subscription?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  isLoading = false,
  subscription = 'freemium'
}) => {
  const [displayBalance, setDisplayBalance] = useState<number>(balance);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [gainAmount, setGainAmount] = useState<number>(0);
  const [showGain, setShowGain] = useState<boolean>(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize with balanceManager and prop balance, prioritizing highest value
  useEffect(() => {
    const synchronizeBalance = () => {
      // Get current balance from manager (most reliable source)
      const currentBalance = balanceManager.getCurrentBalance();
      
      // Only update if the manager balance is higher
      if (currentBalance > displayBalance) {
        setDisplayBalance(currentBalance);
      } else if (balance > displayBalance) {
        setDisplayBalance(balance);
        // Also update manager to ensure consistency
        balanceManager.forceBalanceSync(balance);
      }
    };
    
    // Initial sync
    synchronizeBalance();
    
    // Periodic sync
    refreshIntervalRef.current = setInterval(synchronizeBalance, 5000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [balance, displayBalance]);

  useEffect(() => {
    if (balance > displayBalance) {
      const gain = balance - displayBalance;
      setGainAmount(gain);
      setShowGain(true);
      setIsAnimating(true);
      setDisplayBalance(balance);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowGain(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);
  
  // Listen for balance update events
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const amount = detail?.amount;
      const newBalance = detail?.newBalance || detail?.currentBalance;
      
      if (amount && amount > 0) {
        setGainAmount(amount);
        setShowGain(true);
        setIsAnimating(true);
        
        // Ensure we always use the latest balance
        if (typeof newBalance === 'number' && newBalance > 0) {
          setDisplayBalance(newBalance);
        } else {
          setDisplayBalance(prev => prev + amount);
        }
        
        const timer = setTimeout(() => {
          setIsAnimating(false);
          setShowGain(false);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    };
    
    const handleForceUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      const newBalance = detail?.newBalance;
      const animate = detail?.animate;
      const gain = detail?.gain;
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        if (animate && gain) {
          setGainAmount(gain);
          setShowGain(true);
          setIsAnimating(true);
          setDisplayBalance(newBalance);
          
          const timer = setTimeout(() => {
            setIsAnimating(false);
            setShowGain(false);
          }, 2000);
          
          return () => clearTimeout(timer);
        } else {
          setDisplayBalance(newBalance);
        }
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleForceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleForceUpdate);
    };
  }, []);

  return (
    <CardContent className={`p-6 transition-all duration-300 ${
      isAnimating ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/30 dark:from-blue-800/40 dark:to-indigo-800/30' : ''
    }`}>
      <BalanceIndicators
        isAnimating={isAnimating}
        subscription={subscription}
      />
      <div className="relative">
        <BalanceValue
          balance={displayBalance}
          isLoading={isLoading}
        />
        <GainNotification
          gainAmount={gainAmount}
          showGain={showGain}
        />
        <DailyLimitInfo
          subscription={subscription}
          isAnimating={isAnimating}
        />
      </div>
    </CardContent>
  );
};

export default BalanceDisplay;
