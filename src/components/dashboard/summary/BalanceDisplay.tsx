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
  const safeBalance = isNaN(balance) ? 0 : balance;
  
  const [displayedBalance, setDisplayedBalance] = useState(() => {
    const managerBalance = balanceManager.getCurrentBalance();
    const safeManagerBalance = isNaN(managerBalance) ? 0 : managerBalance;
    return Math.max(safeManagerBalance, safeBalance, 0);
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const updateDebounceTime = 2000;
  const forceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (safeBalance > displayedBalance) {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current > 5000) {
        console.log(`Synchronisation du solde affiché avec le prop balance: ${displayedBalance} -> ${safeBalance}`);
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(safeBalance);
        lastUpdateTimeRef.current = now;
        balanceManager.forceBalanceSync(safeBalance);
      }
    }
  }, [safeBalance, displayedBalance]);
  
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      if (isNaN(newBalance)) {
        console.error("Received NaN balance from watcher");
        return;
      }
      
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < updateDebounceTime) {
        console.log("Mise à jour du solde trop fréquente, débounce actif");
        
        if (forceUpdateTimeoutRef.current) {
          clearTimeout(forceUpdateTimeoutRef.current);
        }
        
        forceUpdateTimeoutRef.current = setTimeout(() => {
          const currentManagerBalance = balanceManager.getCurrentBalance();
          if (Math.abs(currentManagerBalance - displayedBalance) > 0.01) {
            setPreviousBalance(displayedBalance);
            setDisplayedBalance(currentManagerBalance);
            lastUpdateTimeRef.current = Date.now();
          }
        }, updateDebounceTime);
        
        return;
      }
      
      lastUpdateTimeRef.current = now;
      const oldBalance = displayedBalance;
      
      if (Math.abs(newBalance - oldBalance) > 0.001) {
        console.log(`Mise à jour du solde par watcher: ${oldBalance} -> ${newBalance}`);
        setPreviousBalance(oldBalance);
        const gainAmount = Math.max(0, newBalance - oldBalance);
        if (gainAmount > 0) {
          setGain(gainAmount);
          setIsAnimating(true);
        }
        setDisplayedBalance(newBalance);
        
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
    const handleBalanceUpdate = (event: CustomEvent) => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < updateDebounceTime) {
        if (forceUpdateTimeoutRef.current) {
          clearTimeout(forceUpdateTimeoutRef.current);
        }
        
        forceUpdateTimeoutRef.current = setTimeout(() => {
          processBalanceUpdate(event);
        }, updateDebounceTime);
        return;
      }
      
      processBalanceUpdate(event);
    };
    
    const processBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.newBalance || event.detail?.currentBalance;
      const gain = event.detail?.gain || event.detail?.amount;
      const shouldAnimate = event.detail?.animate === true;
      const oldBalanceFromEvent = event.detail?.oldBalance;
      
      if (typeof gain === 'number' && gain > 0) {
        console.log(`Mise à jour du solde avec gain: +${gain}€`);
        
        const oldBalance = oldBalanceFromEvent !== undefined ? oldBalanceFromEvent : displayedBalance;
        const calculatedNewBalance = parseFloat((oldBalance + gain).toFixed(2));
        
        balanceManager.updateBalance(gain);
        balanceManager.forceBalanceSync(calculatedNewBalance);
        
        setPreviousBalance(oldBalance);
        setDisplayedBalance(calculatedNewBalance);
        setIsAnimating(shouldAnimate !== false);
        setGain(gain);
        
        localStorage.setItem('currentBalance', calculatedNewBalance.toString());
        localStorage.setItem('lastKnownBalance', calculatedNewBalance.toString());
        
        lastUpdateTimeRef.current = Date.now();
        
        if (shouldAnimate !== false) {
          setTimeout(() => setIsAnimating(false), 2500);
        }
      }
      else if (typeof newBalance === 'number' && newBalance > 0 && 
          Math.abs(newBalance - displayedBalance) > 0.001) {
        console.log(`Mise à jour du solde avec nouvelle valeur: ${newBalance}€`);
        
        const implicitGain = Math.max(0, newBalance - displayedBalance);
        
        balanceManager.forceBalanceSync(newBalance);
        
        setPreviousBalance(displayedBalance);
        setDisplayedBalance(newBalance);
        setIsAnimating(shouldAnimate !== false && implicitGain > 0);
        
        if (implicitGain > 0) {
          setGain(implicitGain);
        }
        
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        lastUpdateTimeRef.current = Date.now();
        
        if (shouldAnimate !== false && implicitGain > 0) {
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
                  start={previousBalance !== null ? previousBalance : displayedBalance - (gain || 0)}
                  end={displayedBalance}
                  delay={0}
                  preserveValue={true}
                  decimals={2}
                  useEasing={true}
                  formattingFn={(value) => {
                    return isNaN(value) ? "0.00€" : `${value.toFixed(2)}€`;
                  }}
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
