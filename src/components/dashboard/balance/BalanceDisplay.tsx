
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const previousBalanceRef = useRef<number>(balance);

  // Update display balance when prop changes, using a ref to track previous value
  useEffect(() => {
    // Only update if there's a real change to avoid render loops
    if (balance !== previousBalanceRef.current) {
      const gain = Math.max(0, balance - previousBalanceRef.current);
      previousBalanceRef.current = balance;
      
      // If it's a gain, show animation
      if (gain > 0) {
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
      } else {
        // If not a gain, just update the balance without animation
        setDisplayBalance(balance);
      }
    }
  }, [balance]);
  
  // Handle cleanup
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);

  // Memoize class string to prevent unnecessary rerenders
  const containerClasses = useCallback(() => {
    return `p-6 transition-all duration-300 ${
      isAnimating ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/30 dark:from-blue-800/40 dark:to-indigo-800/30' : ''
    }`;
  }, [isAnimating]);

  return (
    <CardContent className={containerClasses()}>
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
