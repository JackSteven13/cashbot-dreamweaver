
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
  
  // Créer le lien de parrainage (cette fonction devrait exister ailleurs dans le code)
  const referralLink = `${window.location.origin}?ref=invite`;
  
  return (
    <div className="mt-2 mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span>Progression retrait</span>
        <div className="flex items-center">
          <span>{safeBalance.toFixed(2)}€ / {actualThreshold}€</span>
          
          {shouldShowReferralSuggestion && (
            <div className="ml-1">
              <InfoIcon 
                size={14} 
                className="text-amber-400 cursor-pointer" 
                onClick={() => {
                  // Afficher la fenêtre modale ou tooltip de suggestion de parrainage ici
                  const modal = document.getElementById('referral-suggestion-modal');
                  if (modal) {
                    modal.classList.remove('hidden');
                  }
                }}
              />
              
              {/* Modal pour le parrainage */}
              <div id="referral-suggestion-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="relative max-w-md mx-auto">
                  <ReferralSuggestion 
                    referralLink={referralLink}
                    withdrawalThreshold={actualThreshold}
                  />
                  <button 
                    className="absolute top-2 right-2 text-white bg-blue-600 rounded-full p-1"
                    onClick={() => {
                      const modal = document.getElementById('referral-suggestion-modal');
                      if (modal) {
                        modal.classList.add('hidden');
                      }
                    }}
                  >
                    X
                  </button>
                </div>
              </div>
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
