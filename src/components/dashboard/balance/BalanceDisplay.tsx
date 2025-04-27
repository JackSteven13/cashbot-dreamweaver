
import React, { useState, useEffect, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { BalanceIndicators } from './components/BalanceIndicators';
import { BalanceValue } from './components/BalanceValue';
import { DailyLimitInfo } from './components/DailyLimitInfo';
import { GainNotification } from './components/GainNotification';

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
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (balance > displayBalance) {
      const gain = balance - displayBalance;
      setGainAmount(gain);
      setShowGain(true);
      setIsAnimating(true);
      setDisplayBalance(balance);
      
      // Clear any existing timer
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      
      // Set new timer
      animationTimerRef.current = setTimeout(() => {
        setIsAnimating(false);
        setShowGain(false);
      }, 2000);
    } else if (balance !== displayBalance) {
      // Handle case where balance decreases or is set to a different value
      setDisplayBalance(balance);
    }
    
    // Cleanup
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [balance, displayBalance]);

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
