
import React from 'react';
import { CircleDollarSign } from 'lucide-react';

interface UserBalanceDisplayProps {
  displayBalance: number;
  subscription?: string;
  isAnimate?: boolean;
}

const UserBalanceDisplay: React.FC<UserBalanceDisplayProps> = ({
  displayBalance,
  subscription = 'freemium',
  isAnimate = false
}) => {
  // Format balance to 2 decimal places
  const formattedBalance = Number(displayBalance).toFixed(2);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <CircleDollarSign className="h-6 w-6 text-blue-500 mr-2" />
        <div>
          <div className="text-sm text-muted-foreground">
            Votre solde actuel
          </div>
          <div className={`text-2xl md:text-3xl font-semibold ${isAnimate ? 'animate-pulse' : ''}`}>
            {formattedBalance} €
          </div>
        </div>
      </div>
      
      {subscription !== 'freemium' && (
        <div className="bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full text-xs font-medium text-blue-800 dark:text-blue-300">
          {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
        </div>
      )}
    </div>
  );
};

export default UserBalanceDisplay;
