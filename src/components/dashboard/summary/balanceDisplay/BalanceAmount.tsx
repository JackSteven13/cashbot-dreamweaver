
import React, { useRef, useState, useEffect } from 'react';

interface BalanceAmountProps {
  balance: number;
  isLoading?: boolean;
  currency?: string;
  subscription?: string;
}

const BalanceAmount: React.FC<BalanceAmountProps> = ({
  balance,
  isLoading = false,
  currency = "EUR",
  subscription
}) => {
  const [displayedBalance, setDisplayedBalance] = useState(balance);
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [gain, setGain] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (balance !== displayedBalance && !isLoading) {
      // If there's an increase in balance, animate it
      if (balance > displayedBalance) {
        setPreviousBalance(displayedBalance);
        setGain(balance - displayedBalance);
        setIsAnimating(true);
        
        // End animation after some time
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
      setDisplayedBalance(balance);
    }
  }, [balance, displayedBalance, isLoading]);

  return (
    <div className="text-center py-4">
      {isLoading ? (
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded mx-auto"></div>
      ) : (
        <div ref={balanceRef} className="relative">
          <p className="text-3xl font-bold">
            {displayedBalance.toFixed(2)} {currency}
          </p>
          {isAnimating && previousBalance !== null && gain !== null && (
            <div className="absolute -top-4 right-0 text-sm text-green-500 bg-green-100 px-2 py-1 rounded-md animate-bounce">
              +{gain.toFixed(2)} {currency}
            </div>
          )}
          {subscription && (
            <div className="mt-2 text-xs text-gray-500">
              Plan: {subscription}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceAmount;
