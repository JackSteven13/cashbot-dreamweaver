
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import balanceManager from '@/utils/balance/balanceManager';

interface BalanceDisplayProps {
  balance: number;
  isLoading?: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance, isLoading = false }) => {
  const [displayedBalance, setDisplayedBalance] = useState(() => {
    // Initialiser avec la valeur du balance manager pour plus de cohérence
    return balanceManager.getCurrentBalance() || balance;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  // S'abonner au balanceManager directement
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      // Get the current balance before update for comparison
      const oldBalance = displayedBalance;
      
      if (newBalance !== oldBalance) {
        // Store previous balance for gain calculation
        setPreviousBalance(oldBalance);
        
        // Calculate the gain
        const gainAmount = newBalance - oldBalance;
        if (gainAmount > 0) {
          setGain(gainAmount);
        }
        
        // Start animation
        setIsAnimating(true);
        
        // Set new balance
        setDisplayedBalance(newBalance);
        
        // End animation after duration
        const animationTimer = setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 2500);
        
        return () => clearTimeout(animationTimer);
      }
    });
    
    return unsubscribe;
  }, [displayedBalance]);
  
  // Update balance with animation when it changes externally
  useEffect(() => {
    // Si le solde externe est significativement différent, le prendre en compte
    if (Math.abs(balance - displayedBalance) > 0.01) {
      // Store previous balance for gain calculation
      setPreviousBalance(displayedBalance);
      
      // Calculate the gain
      const gainAmount = balance - displayedBalance;
      if (gainAmount > 0) {
        setGain(gainAmount);
      }
      
      // Start animation
      setIsAnimating(true);
      
      // Set new balance
      setDisplayedBalance(balance);
      
      // Synchroniser avec le balanceManager
      if (Math.abs(balance - balanceManager.getCurrentBalance()) > 0.01) {
        balanceManager.forceBalanceSync(balance);
      }
      
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
      
      if (amount !== undefined && amount > 0) {
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
      } else if (newBalance !== undefined && Math.abs(newBalance - displayedBalance) > 0.01) {
        // Si seulement le solde est fourni, mais différent
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(newBalance);
        setIsAnimating(true);
        
        setTimeout(() => {
          setIsAnimating(false);
        }, 2500);
      }
    };
    
    // Écouter les deux types d'événements
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
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
                  start={previousBalance || displayedBalance - (gain || 0)}
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
