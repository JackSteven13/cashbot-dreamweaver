
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import balanceManager from '@/utils/balance/balanceManager';
import stableBalance from '@/utils/balance/stableBalance';
import { BalanceDisplayProps } from './types';
import { useBalanceState } from './useBalanceState';
import { useBalanceEvents } from './useBalanceEvents';
import { useIntervalChecks } from '@/hooks/sessions/useIntervalChecks';
import BalanceHeader from './BalanceHeader';
import BalanceAmount from './BalanceAmount';

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  balance, 
  isLoading = false, 
  currency, 
  subscription 
}) => {
  // Use stable balance instead of prop balance
  const [displayBalance, setDisplayBalance] = useState(() => {
    // Initialize with the highest of three sources
    return Math.max(
      stableBalance.getBalance(),
      balanceManager.getCurrentBalance(),
      !isNaN(balance) ? balance : 0
    );
  });
  const [previousBalance, setPreviousBalance] = useState(displayBalance);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gain, setGain] = useState(0);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // Register as a listener to the stable balance manager
  useEffect(() => {
    const unsubscribe = stableBalance.addListener((newBalance) => {
      if (newBalance > displayBalance) {
        // Calculate gain for animation
        const gainAmount = newBalance - displayBalance;
        setPreviousBalance(displayBalance);
        setDisplayBalance(newBalance);
        setGain(gainAmount);
        setIsAnimating(true);
        
        // End animation after 2 seconds
        setTimeout(() => {
          setIsAnimating(false);
        }, 2000);
      } else {
        // Even if not higher, still update for consistency
        setDisplayBalance(newBalance);
      }
    });
    
    return unsubscribe;
  }, [displayBalance]);
  
  // Synchronize with balanceManager and prop balance, but only for increases
  useEffect(() => {
    // Get the highest value from all sources
    const safeBalanceFromProp = !isNaN(balance) ? balance : 0;
    const managerBalance = balanceManager.getCurrentBalance();
    const currentStableBalance = stableBalance.getBalance();
    
    const maxBalance = Math.max(
      safeBalanceFromProp,
      managerBalance,
      currentStableBalance,
      displayBalance
    );
    
    // Only update if we have a higher value
    if (maxBalance > displayBalance) {
      // Use stable balance system to update
      stableBalance.setBalance(maxBalance);
      
      // Also ensure manager is synchronized
      balanceManager.forceBalanceSync(maxBalance);
      
      // And update localStorage for redundancy
      localStorage.setItem('currentBalance', maxBalance.toString());
      localStorage.setItem('highest_balance', maxBalance.toString());
    }
  }, [balance, displayBalance]);
  
  // Extra stability check every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force balanceManager to match our stable balance
      const currentManagerBalance = balanceManager.getCurrentBalance();
      const currentStableBalance = stableBalance.getBalance();
      
      if (currentManagerBalance !== currentStableBalance) {
        balanceManager.forceBalanceSync(currentStableBalance);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className={cn(
      "balance-display hover:shadow-md transition-all duration-300",
      isAnimating && "pulse-animation"
    )}>
      <CardContent className="p-6 flex flex-col">
        <BalanceHeader />
        <div className="relative">
          <BalanceAmount
            isLoading={isLoading}
            displayedBalance={displayBalance}
            previousBalance={previousBalance}
            gain={gain}
            isAnimating={isAnimating}
            balanceRef={balanceRef}
            currency={currency}
            subscription={subscription}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
