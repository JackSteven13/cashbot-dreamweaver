
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
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  // S'abonner au balanceManager avec limitations de fréquence
  useEffect(() => {
    const unsubscribe = balanceManager.addWatcher((newBalance) => {
      // Limiter strictement les mises à jour (minimum 15 secondes entre chaque)
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 15000) {
        console.log("Mise à jour du solde trop fréquente, ignorée");
        return;
      }
      
      lastUpdateTimeRef.current = now;
      
      // Get the current balance before update for comparison
      const oldBalance = displayedBalance;
      
      if (Math.abs(newBalance - oldBalance) > 0.1) { // Seuil de différence significative
        // Store previous balance for gain calculation
        setPreviousBalance(oldBalance);
        
        // Calculate the gain - toujours limité à un montant réaliste pour une vidéo
        const gainAmount = Math.min(0.5, newBalance - oldBalance);
        if (gainAmount > 0) {
          setGain(gainAmount);
        }
        
        // Start animation
        setIsAnimating(true);
        
        // Set new balance
        setDisplayedBalance(oldBalance + gainAmount);
        
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
  
  // Update balance with animation when it changes externally, with strict limits
  useEffect(() => {
    // Ne pas mettre à jour trop fréquemment
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 30000) { // Minimum 30 secondes entre les mises à jour
      return;
    }
    
    // Si le solde externe est significativement différent, le prendre en compte
    if (Math.abs(balance - displayedBalance) > 0.2) {
      // Limiter le gain à un montant réaliste pour une vidéo
      const gainAmount = Math.min(0.5, balance - displayedBalance);
      
      if (gainAmount > 0) {
        // Store previous balance for gain calculation
        setPreviousBalance(displayedBalance);
        setGain(gainAmount);
        
        // Start animation
        setIsAnimating(true);
        
        // Mettre à jour progressivement
        setDisplayedBalance(prev => prev + gainAmount);
        
        // Synchroniser avec le balanceManager
        if (Math.abs(balance - balanceManager.getCurrentBalance()) > 0.2) {
          balanceManager.forceBalanceSync(displayedBalance + gainAmount);
        }
        
        // End animation after duration
        const animationTimer = setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 2500);
        
        // Mettre à jour le timestamp
        lastUpdateTimeRef.current = now;
        
        return () => clearTimeout(animationTimer);
      }
    }
  }, [balance, displayedBalance]);
  
  // Listen for balance update events with limitation
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      // Limiter la fréquence
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 15000) { // Minimum 15 secondes
        console.log("Événement balance:update ignoré - trop fréquent");
        return;
      }
      
      const amount = event.detail?.amount;
      const newBalance = event.detail?.currentBalance;
      
      // Limiter le montant à un gain réaliste par vidéo
      const limitedAmount = amount !== undefined ? Math.min(0.5, amount) : 0;
      
      if (limitedAmount > 0) {
        lastUpdateTimeRef.current = now;
        
        setGain(limitedAmount);
        setIsAnimating(true);
        
        // If new balance is provided, use it with limitation
        if (newBalance !== undefined) {
          setPreviousBalance(displayedBalance);
          // Progression lente et limitée
          setDisplayedBalance(prev => prev + limitedAmount);
        } else {
          // Calculer nous-mêmes
          setPreviousBalance(displayedBalance);
          setDisplayedBalance(prev => prev + limitedAmount);
        }
        
        setTimeout(() => {
          setIsAnimating(false);
          setGain(null);
        }, 2500);
      } else if (newBalance !== undefined && Math.abs(newBalance - displayedBalance) > 0.2) {
        // Progression lente si différence significative
        lastUpdateTimeRef.current = now;
        
        setPreviousBalance(displayedBalance);
        // Augmenter de max 0.5€
        const increment = Math.min(0.5, newBalance - displayedBalance);
        setDisplayedBalance(prev => prev + increment);
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
