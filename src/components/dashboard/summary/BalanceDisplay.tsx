
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
  // S'assurer que balance est toujours un nombre valide
  const safeBalance = isNaN(balance) ? 0 : balance;
  
  // Initialiser avec un solde valide en vérifiant toutes les sources
  const [displayedBalance, setDisplayedBalance] = useState(() => {
    const managerBalance = balanceManager.getCurrentBalance();
    const safeManagerBalance = isNaN(managerBalance) ? 0 : managerBalance;
    return safeManagerBalance || safeBalance;
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const updateDebounceTime = 15000; // Temps minimum entre deux mises à jour
  
  // S'abonner aux changements dans le gestionnaire de solde
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      // Vérifier que la nouvelle valeur n'est pas NaN
      if (isNaN(newBalance)) {
        console.error("Received NaN balance from watcher");
        return;
      }
      
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 15000) {
        console.log("Mise à jour du solde trop fréquente, ignorée");
        return;
      }
      
      lastUpdateTimeRef.current = now;
      
      const oldBalance = isNaN(displayedBalance) ? 0 : displayedBalance;
      
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
  
  // Mettre à jour si la prop balance change significativement
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 30000) {
      return;
    }
    
    // S'assurer que toutes les valeurs sont des nombres valides
    const safeDisplayed = isNaN(displayedBalance) ? 0 : displayedBalance;
    const safeBalanceProp = isNaN(balance) ? 0 : balance;
    const currentManagerBalance = isNaN(balanceManager.getCurrentBalance()) ? 0 : balanceManager.getCurrentBalance();
    
    if (safeBalanceProp > 0 && Math.abs(safeBalanceProp - safeDisplayed) > 0.2) {
      const gainAmount = Math.min(0.5, safeBalanceProp - safeDisplayed);
      if (gainAmount > 0) {
        setPreviousBalance(safeDisplayed);
        setGain(gainAmount);
        setIsAnimating(true);
        setDisplayedBalance(prev => {
          const safePrev = isNaN(prev) ? 0 : prev;
          return safePrev + gainAmount;
        });
        
        // Synchroniser avec le gestionnaire de solde si nécessaire
        if (Math.abs(safeBalanceProp - currentManagerBalance) > 0.2) {
          balanceManager.forceBalanceSync(safeDisplayed + gainAmount);
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
                  start={previousBalance !== null ? previousBalance : displayedBalance - (gain || 0)}
                  end={displayedBalance}
                  duration={1.5}
                  decimals={2}
                  suffix="€"
                  useEasing={true}
                  formattingFn={(value) => {
                    // Protection contre NaN
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
