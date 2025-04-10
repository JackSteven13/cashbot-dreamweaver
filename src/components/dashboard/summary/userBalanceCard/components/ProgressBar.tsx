
import React from 'react';
import { InfoIcon } from 'lucide-react';
import { ReferralSuggestion } from '../../buttons/ReferralSuggestion';
import { getWithdrawalThreshold } from '@/utils/referral/withdrawalUtils';

interface ProgressBarProps {
  displayBalance: number;
  withdrawalThreshold?: number;
  subscription?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  displayBalance = 0,
  withdrawalThreshold,
  subscription = 'freemium'
}) => {
  // Obtenir le seuil de retrait basé sur l'abonnement si non fourni
  const actualThreshold = withdrawalThreshold || getWithdrawalThreshold(subscription);
  
  // Ensure valid numbers and calculate progress
  const safeBalance = typeof displayBalance === 'number' ? displayBalance : 0;
  const progress = Math.min(100, (safeBalance / actualThreshold) * 100);
  
  // Déterminer si nous devons montrer une suggestion de parrainage
  // (moins de 30% du seuil atteint)
  const shouldShowReferralSuggestion = progress < 30;
  
  return (
    <div className="mt-2 mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span>Progression retrait</span>
        <div className="flex items-center">
          <span>{safeBalance.toFixed(2)}€ / {actualThreshold}€</span>
          
          {shouldShowReferralSuggestion && (
            <div className="ml-1">
              <ReferralSuggestion 
                triggerElement={
                  <button className="p-0.5 hover:bg-slate-700 rounded-full transition-colors">
                    <InfoIcon size={14} className="text-amber-400" />
                  </button>
                }
                subscription={subscription}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
