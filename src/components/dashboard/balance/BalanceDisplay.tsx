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
    // Try sessionStorage first (priority for page refreshes)
    const sessionBalance = parseFloat(sessionStorage.getItem('currentBalance') || '0');
    const storedBalance = parseFloat(localStorage.getItem('currentBalance') || '0');
    
    // Use the highest value available, or the passed balance
    return Math.max(sessionBalance || 0, storedBalance || 0, balance || 0);
  });
  
  const [prevBalance, setPrevBalance] = useState<number>(displayBalance);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  
  const { formattedValue } = useAnimatedCounter({
    value: displayBalance,
    duration: 1200,
    decimals: 2,
    formatOptions: { style: 'currency', currency: 'EUR' }
  });
  
  // Keep sessionStorage and localStorage in sync with balance changes
  useEffect(() => {
    // If input balance is higher than our stored values, update
    if (balance > displayBalance) {
      setDisplayBalance(balance);
      
      // Save to both storage types
      sessionStorage.setItem('currentBalance', balance.toString());
      localStorage.setItem('currentBalance', balance.toString());
      localStorage.setItem('lastKnownBalance', balance.toString());
    }
  }, [balance, displayBalance]);
  
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
            <span>{isAnimating ? 'Revenu généré' : 'Robot actif'}</span>
          </div>
        </div>
      </div>
    </CardContent>
  );
};

export default BalanceDisplay;
