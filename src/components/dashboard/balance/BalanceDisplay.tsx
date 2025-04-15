
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
  const [prevBalance, setPrevBalance] = useState<number>(balance);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  const { formattedValue } = useAnimatedCounter({
    value: balance,
    duration: 1200,
    decimals: 2,
    formatOptions: { style: 'currency', currency: 'EUR' }
  });
  
  useEffect(() => {
    // If balance increased, show animation
    if (balance > prevBalance && prevBalance !== 0) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    setPrevBalance(balance);
  }, [balance, prevBalance]);
  
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
                    +{(balance - prevBalance).toFixed(2)}€
                  </span>
                )}
              </>
            )}
          </div>
          <div className={`text-xs flex items-center mt-1 ${isAnimating ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{isAnimating ? 'Revenu généré' : 'Robot actif'}</span>
          </div>
        </div>
      </div>
    </CardContent>
  );
};

export default BalanceDisplay;
