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
    return balanceManager.getCurrentBalance() || balance;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const updateDebounceTime = 15000; // Temps minimum entre deux mises à jour
  
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 15000) {
        console.log("Mise à jour du solde trop fréquente, ignorée");
        return;
      }
      
      lastUpdateTimeRef.current = now;
      
      const oldBalance = displayedBalance;
      
      if (Math.abs(newBalance - oldBalance) > 0.1) {
        setPreviousBalance(oldBalance);
        const gainAmount = Math.min(0.5, newBalance - oldBalance);
        if (gainAmount > 0) {
          setGain(gainAmount);
        }
        setIsAnimating(true);
        setDisplayedBalance(oldBalance + gainAmount);
        const animationTimer = setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 2500);
        return () => clearTimeout(animationTimer);
      }
    });
    
    return unsubscribe;
  }, [displayedBalance]);
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 30000) {
      return;
    }
    
    if (Math.abs(balance - displayedBalance) > 0.2) {
      const gainAmount = Math.min(0.5, balance - displayedBalance);
      if (gainAmount > 0) {
        setPreviousBalance(displayedBalance);
        setGain(gainAmount);
        setIsAnimating(true);
        setDisplayedBalance(prev => prev + gainAmount);
        if (Math.abs(balance - balanceManager.getCurrentBalance()) > 0.2) {
          balanceManager.forceBalanceSync(displayedBalance + gainAmount);
        }
        const animationTimer = setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 2500);
        lastUpdateTimeRef.current = now;
        return () => clearTimeout(animationTimer);
      }
    }
  }, [balance, displayedBalance]);
  
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < updateDebounceTime) {
        console.log("Mise à jour ignorée pour éviter les fluctuations trop rapides");
        return;
      }
      
      const newBalance = event.detail?.newBalance || event.detail?.currentBalance;
      const gain = event.detail?.gain || event.detail?.amount;
      const shouldAnimate = event.detail?.animate === true;
      const oldBalanceFromEvent = event.detail?.oldBalance;
      
      if (typeof gain === 'number' && gain > 0) {
        console.log("Updating balance with gain:", gain);
        
        const oldBalance = oldBalanceFromEvent || displayedBalance;
        const calculatedNewBalance = parseFloat((oldBalance + gain).toFixed(2));
        
        setPreviousBalance(oldBalance);
        setDisplayedBalance(calculatedNewBalance);
        setIsAnimating(shouldAnimate !== false);
        setGain(gain);
        
        localStorage.setItem('currentBalance', calculatedNewBalance.toString());
        localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString());
        
        lastUpdateTimeRef.current = now;
        
        if (shouldAnimate !== false) {
          setTimeout(() => setIsAnimating(false), 2500);
        }
      }
      else if (typeof newBalance === 'number' && newBalance > 0 && 
          Math.abs(newBalance - displayedBalance) > 0.01) {
        console.log("Updating balance with new balance:", newBalance);
        
        const implicitGain = newBalance - displayedBalance;
        
        if (implicitGain < 0) {
          setDisplayedBalance(newBalance);
          return;
        }
        
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(newBalance);
        setIsAnimating(shouldAnimate !== false);
        
        if (implicitGain > 0) {
          setGain(implicitGain);
        }
        
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        lastUpdateTimeRef.current = now;
        
        if (shouldAnimate !== false) {
          setTimeout(() => setIsAnimating(false), 2500);
        }
      }
    };
    
    window.addEventListener('balance:update', handleBalanceUpdate as EventListener);
    window.addEventListener('balance:force-update', handleBalanceUpdate as EventListener);
    window.addEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balance:update', handleBalanceUpdate as EventListener);
      window.removeEventListener('balance:force-update', handleBalanceUpdate as EventListener);
      window.removeEventListener('dashboard:micro-gain', handleBalanceUpdate as EventListener);
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
