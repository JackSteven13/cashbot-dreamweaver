
import React from 'react';
import { formatPrice } from '@/utils/balance/limitCalculations';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';

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
  return (
    <CardContent className="p-6">
      <div className="flex items-center">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mr-4">
          <Coins className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Solde disponible</p>
          <div className="balance-display text-2xl md:text-3xl font-bold">
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              <>{formatPrice(balance)}</>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  );
};

export default BalanceDisplay;
