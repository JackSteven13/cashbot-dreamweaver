
import React from 'react';

interface BalanceAmountProps {
  isLoading?: boolean;
  displayedBalance: number;
  previousBalance: number | null;
  gain: number | null;
  isAnimating: boolean;
  balanceRef: React.RefObject<HTMLDivElement>;
  currency?: string;
  subscription?: string;
}

const BalanceAmount: React.FC<BalanceAmountProps> = ({
  isLoading = false,
  displayedBalance,
  previousBalance,
  gain,
  isAnimating,
  balanceRef,
  currency = "EUR",
  subscription
}) => {
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
