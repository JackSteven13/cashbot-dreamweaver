
import React from 'react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface BalanceValueProps {
  balance: number;
  isLoading: boolean;
}

export const BalanceValue: React.FC<BalanceValueProps> = ({
  balance,
  isLoading
}) => {
  const { formattedValue } = useAnimatedCounter({
    value: balance,
    duration: 1200,
    decimals: 2,
    formatOptions: { style: 'currency', currency: 'EUR' }
  });

  if (isLoading) {
    return <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />;
  }

  return (
    <div className="balance-display text-2xl md:text-3xl font-bold">
      {formattedValue}
    </div>
  );
};
