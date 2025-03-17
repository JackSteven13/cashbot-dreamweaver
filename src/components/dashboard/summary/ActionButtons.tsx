
import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

interface ActionButtonsProps {
  canStartSession: boolean;
  isButtonDisabled: boolean;
  isStartingSession: boolean;
  isWithdrawing: boolean;
  subscription: string;
  currentBalance: number;
  dailyLimit: number;
  onBoostClick: () => void;
  onWithdraw: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  canStartSession,
  isButtonDisabled,
  isStartingSession,
  isWithdrawing,
  subscription,
  currentBalance,
  dailyLimit,
  onBoostClick,
  onWithdraw
}) => {
  // Vérifier si la limite est atteinte - check against the actual current balance
  const limitReached = currentBalance >= dailyLimit;
  
  // Calculer le pourcentage de la limite atteinte pour l'affichage visuel
  const limitPercentage = Math.min(100, (currentBalance / dailyLimit) * 100);
  
  return (
    <div className="grid grid-cols-1 gap-3 mb-6">
      {/* Rangée de boutons principale avec layout amélioré */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="w-full">
          {canStartSession && !limitReached ? (
            <Button 
              size="lg" 
              className="w-full bg-[#2d5f8a] hover:bg-[#1e3a5f] text-white relative overflow-hidden"
              disabled={isButtonDisabled || isStartingSession || limitReached}
              onClick={onBoostClick}
            >
              {/* Indicateur visuel de progression vers la limite */}
              <div 
                className="absolute bottom-0 left-0 h-1 bg-yellow-400" 
                style={{ width: `${limitPercentage}%` }}
              />
              
              {isStartingSession ? (
                "Traitement en cours..."
              ) : limitReached ? (
                "Limite journalière atteinte"
              ) : (
                "▶️ Boost manuel"
              )}
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="w-full bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed"
              disabled={true}
            >
              {limitReached ? "Limite journalière atteinte" : "▶️ Boost manuel"}
            </Button>
          )}
        </div>
        
        <div className="w-full">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full border-[#2d5f8a] text-[#2d5f8a] hover:bg-[#e2e8f0]"
            disabled={isWithdrawing || isButtonDisabled}
            onClick={onWithdraw}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            {isWithdrawing ? "Traitement..." : "Retirer les fonds"}
          </Button>
        </div>
      </div>

      {/* Rangée conditionnelle pour le bouton d'augmentation de limite */}
      {(subscription === 'freemium' || limitReached) && (
        <div className="mt-1">
          <Link to="/offres" className="w-full block">
            <Button 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {limitReached ? "Augmenter votre limite" : "Passer à l'offre Pro"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
