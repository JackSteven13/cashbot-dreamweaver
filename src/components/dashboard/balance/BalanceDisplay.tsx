import React, { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { CardContent } from '@/components/ui/card';
import { Coins, TrendingUp, ChevronUp } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface BalanceDisplayProps {
  balance: number;
  currency?: string;
  isLoading?: boolean;
  subscription?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  balance, 
  currency = "EUR", 
  isLoading = false, 
  subscription = "freemium" 
}) => {
  // Use session storage as source of truth for page refreshes
  const [displayBalance, setDisplayBalance] = useState<number>(() => {
    // Pour garantir la stabilité du solde entre les rechargements, prioriser le solde stocké
    const storedBalance = parseFloat(localStorage.getItem('lastKnownBalance') || '0');
    
    // Utiliser la valeur stockée ou fournie sans limites artificielles
    return storedBalance || balance || 0;
  });
  
  const [prevBalance, setPrevBalance] = useState<number>(displayBalance);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(Date.now());
  
  const { formattedValue } = useAnimatedCounter({
    value: displayBalance,
    duration: 1200,
    decimals: 2,
    formatOptions: { style: 'currency', currency: 'EUR' }
  });
  
  // Keep sessionStorage and localStorage in sync with balance changes
  useEffect(() => {
    // Si le solde fourni est significativement différent, mettre à jour
    if (Math.abs(balance - displayBalance) > 0.01) {
      setDisplayBalance(balance);
      
      // Save to both storage types
      sessionStorage.setItem('currentBalance', balance.toString());
      localStorage.setItem('currentBalance', balance.toString());
      localStorage.setItem('lastKnownBalance', balance.toString());
      
      // Record update time
      lastUpdateTime.current = Date.now();
    }
  }, [balance, displayBalance]);
  
  // Listen for force update events
  useEffect(() => {
    const handleForceUpdate = (event: CustomEvent) => {
      // Check if we should force update (no recent updates)
      const timeSinceLastUpdate = Date.now() - lastUpdateTime.current;
      if (timeSinceLastUpdate > 60000) { // 1 minute
        // Force a small increment to show activity
        const smallIncrement = Math.random() * 0.05 + 0.01; // 0.01-0.06€
        
        // Calculer un incrément basé sur le niveau d'abonnement
        let actualIncrement = smallIncrement;
        if (subscription !== 'freemium') {
          // Les abonnements premium ont des incréments plus importants
          actualIncrement = smallIncrement * (subscription === 'premium' ? 3 : 
                                             subscription === 'professional' ? 5 : 2);
        }
        
        // Incrémenter le solde sans limite artificielle
        const newBalance = displayBalance + actualIncrement;
        
        setDisplayBalance(newBalance);
        setPrevBalance(displayBalance);
        setIsAnimating(true);
        
        // Save to both storage types
        sessionStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('currentBalance', newBalance.toString());
        localStorage.setItem('lastKnownBalance', newBalance.toString());
        
        // Record update time
        lastUpdateTime.current = Date.now();
        
        // Reset animation after delay
        setTimeout(() => setIsAnimating(false), 2000);
      }
    };
    
    window.addEventListener('balance:force-update', handleForceUpdate as EventListener);
    return () => window.removeEventListener('balance:force-update', handleForceUpdate as EventListener);
  }, [displayBalance, subscription]);
  
  // Save to session before unload for refresh protection
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current balance to session storage
      sessionStorage.setItem('currentBalance', displayBalance.toString());
      localStorage.setItem('currentBalance', displayBalance.toString());
      localStorage.setItem('lastKnownBalance', displayBalance.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [displayBalance]);
  
  useEffect(() => {
    // If balance increased, show animation
    if (displayBalance > prevBalance && prevBalance !== 0) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    setPrevBalance(displayBalance);
  }, [displayBalance, prevBalance]);
  
  // Determine premium styling based on subscription
  const isPremium = subscription !== 'freemium';
  
  return (
    <CardContent className={`p-6 transition-all duration-300 ${isAnimating ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/30 dark:from-blue-800/40 dark:to-indigo-800/30' : ''}`}>
      <div className="flex items-center">
        <div className={`${isAnimating ? 'bg-blue-700 dark:bg-blue-600' : 'bg-blue-100 dark:bg-blue-900'} p-3 rounded-lg mr-4 transition-colors duration-300`}>
          <Coins className={`h-8 w-8 ${isAnimating ? 'text-yellow-300 animate-bounce' : 'text-blue-600 dark:text-blue-400'}`} />
        </div>
        <div className="relative">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Solde disponible
            {isPremium && (
              <span className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                {subscription.toUpperCase()}
              </span>
            )}
          </p>
          <div 
            ref={balanceRef}
            className={`balance-display text-2xl md:text-3xl font-bold ${
              isAnimating ? 'text-green-400 dark:text-green-300' : ''
            } relative`}
          >
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              <>
                {formattedValue}
                {isAnimating && (
                  <span className="absolute -top-4 right-0 text-sm text-green-500 flex items-center animate-fade-in">
                    <ChevronUp className="h-3 w-3 mr-0.5" />
                    +{(displayBalance - prevBalance).toFixed(2)}€
                  </span>
                )}
              </>
            )}
          </div>
          <div className={`text-xs flex items-center mt-1 ${isAnimating ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{subscription === 'freemium' ? 'Limite: 0,50€/jour' : 'Robot actif'}</span>
          </div>
        </div>
      </div>
    </CardContent>
  );
};

export default BalanceDisplay;
