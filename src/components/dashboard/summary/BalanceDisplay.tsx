
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';

interface BalanceDisplayProps {
  balance: number;
  isLoading?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance, isLoading = false }) => {
  const [displayedBalance, setDisplayedBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // Update balance with animation when it changes
  useEffect(() => {
    if (balance !== displayedBalance) {
      if (displayedBalance !== 0) {
        // Store previous balance for gain calculation
        setPreviousBalance(displayedBalance);
        
        // Calculate the gain
        const gainAmount = balance - displayedBalance;
        if (gainAmount > 0) {
          setGain(gainAmount);
        }
      }
      
      // Start animation
      setIsAnimating(true);
      
      // Set new balance
      setDisplayedBalance(balance);
      
      // End animation after duration
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
        setGain(null);
      }, 2500);
      
      return () => clearTimeout(animationTimer);
    }
  }, [balance, displayedBalance]);
  
  // Listen for balance update events
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const amount = event.detail?.amount;
      const newBalance = event.detail?.currentBalance;
      
      if (amount > 0) {
        setGain(amount);
        setIsAnimating(true);
        
        // If new balance is provided, use it
        if (newBalance !== undefined) {
          setPreviousBalance(displayedBalance);
          setDisplayedBalance(newBalance);
        }
        
        setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 2500);
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    window.addEventListener('balance:force-update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
      window.removeEventListener('balance:force-update' as any, handleBalanceUpdate);
    };
  }, [displayedBalance]);
  
  return (
    <Card className={cn(
      "balance-display hover:shadow-md transition-all duration-300",
      isAnimating && "pulse-animation"
    )}>
      <CardContent className="p-6 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Votre solde
          </h2>
          <Coins className={cn(
            "h-5 w-5 text-blue-600",
            isAnimating && "animate-bounce"
          )} />
        </div>
        
        <div className="relative">
          {/* Main balance display */}
          <div ref={balanceRef} className={cn(
            "text-3xl md:text-4xl font-bold text-slate-900 dark:text-white transition-all duration-300",
            isAnimating && "text-green-600 dark:text-green-400"
          )}>
            {isLoading ? (
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
            ) : (
              <>
                <CountUp
                  start={previousBalance || 0}
                  end={displayedBalance}
                  duration={1.5}
                  decimals={2}
                  suffix="€"
                  useEasing={true}
                />
                
                {/* Floating gain number */}
                {gain && isAnimating && (
                  <span className="floating-number">
                    +{gain.toFixed(2)}€
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
