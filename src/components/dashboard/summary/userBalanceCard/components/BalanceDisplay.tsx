
import React from 'react';
import { Sparkles } from 'lucide-react';

interface BalanceDisplayProps {
  displayBalance: number;
  balanceAnimating: boolean;
  animatedBalance: number;
  previousBalance: number;
  referralBonus: number;
  totalGeneratedBalance: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  displayBalance,
  balanceAnimating,
  animatedBalance,
  previousBalance,
  referralBonus,
  totalGeneratedBalance
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <span className={`text-3xl font-bold ${balanceAnimating ? 'balance-increase text-green-300' : ''}`}>
          {animatedBalance.toFixed(2)}€
        </span>
        {balanceAnimating && (
          <span className="text-green-400 text-sm animate-fade-in">
            +{(animatedBalance - previousBalance).toFixed(2)}€
          </span>
        )}
        {referralBonus > 0 && (
          <div className="bg-green-500/30 text-green-200 text-xs px-2 py-1 rounded-full flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            +{referralBonus}%
          </div>
        )}
      </div>
      <p className="text-xs text-white/60 mt-1">
        sur {totalGeneratedBalance.toFixed(2)}€ générés
      </p>
    </div>
  );
};

export default BalanceDisplay;
