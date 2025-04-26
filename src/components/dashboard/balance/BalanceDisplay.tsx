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
  const lastEventTimeRef = useRef<number>(Date.now());

  // Synchronize with balanceManager and prop balance, prioritizing highest value
  useEffect(() => {
    const synchronizeBalance = () => {
      // Get current balance from manager (most reliable source)
      const currentBalance = balanceManager.getCurrentBalance();
      
      // Only update if the manager balance is higher or prop balance is higher
      if (currentBalance > displayBalance) {
        console.log(`Updating displayed balance from manager: ${displayBalance} -> ${currentBalance}`);
        setDisplayBalance(currentBalance);
        // Check if we should show animation (only if it's been >1s since last event)
        const now = Date.now();
        if (now - lastEventTimeRef.current > 1000) {
          const gain = currentBalance - displayBalance;
          if (gain > 0) {
            setGainAmount(gain);
            setShowGain(true);
            setIsAnimating(true);
            setTimeout(() => {
              setIsAnimating(false);
              setShowGain(false);
            }, 2000);
          }
        }
      } else if (balance > displayBalance) {
        console.log(`Updating displayed balance from prop: ${displayBalance} -> ${balance}`);
        setDisplayBalance(balance);
        // Also update manager to ensure consistency
        balanceManager.forceBalanceSync(balance);
      }
    };
    
    // Initial sync
    synchronizeBalance();
    
    // More frequent sync for better reactivity
    refreshIntervalRef.current = setInterval(synchronizeBalance, 2000);
    
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
      lastEventTimeRef.current = Date.now();
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowGain(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);
  
  // Listen for balance update events with improved handling for automatic revenue
  useEffect(() => {
    // Generic handler that works for all balance-related events
    const handleBalanceEvent = (event: CustomEvent) => {
      const detail = event.detail;
      const amount = detail?.amount || detail?.gain;
      const newBalance = detail?.newBalance || detail?.currentBalance;
      const shouldAnimate = detail?.animate !== false;
      
      lastEventTimeRef.current = Date.now();
      
      if (typeof newBalance === 'number' && newBalance > 0) {
        console.log(`Balance event received: ${amount ? `+${amount}` : ''} (new balance: ${newBalance})`);
        
        // Calculate the gain amount if it exists
        const gainAmount = amount > 0 ? amount : (newBalance > displayBalance ? newBalance - displayBalance : 0);
        
        // Only show animation if there's an actual gain and animation flag is true
        if (gainAmount > 0 && shouldAnimate) {
          setGainAmount(gainAmount);
          setShowGain(true);
          setIsAnimating(true);
          
          setTimeout(() => {
            setIsAnimating(false);
            setShowGain(false);
          }, 2000);
        }
        
        // Always update the displayed balance to keep UI consistent
        setDisplayBalance(newBalance);
      }
    };
    
    // Register event listeners for all balance-related events
    window.addEventListener('balance:update', handleBalanceEvent as EventListener);
    window.addEventListener('balance:force-update', handleBalanceEvent as EventListener);
    window.addEventListener('automatic:revenue', handleBalanceEvent as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceEvent as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('balance:update', handleBalanceEvent as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceEvent as EventListener);
      window.removeEventListener('automatic:revenue', handleBalanceEvent as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceEvent as EventListener);
    };
  }, [displayBalance]);

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
