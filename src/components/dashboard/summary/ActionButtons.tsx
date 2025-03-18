
import React from 'react';
import { ArrowUpCircle, Clock, PlayCircle, AlertTriangle } from 'lucide-react';
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white relative overflow-hidden shadow-md"
              disabled={isButtonDisabled || isStartingSession || limitReached}
              onClick={onBoostClick}
            >
              {/* Indicateur visuel de progression vers la limite */}
              <div 
                className="absolute bottom-0 left-0 h-1 bg-blue-300" 
                style={{ width: `${limitPercentage}%` }}
              />
              
              {isStartingSession ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Traitement...
                </span>
              ) : limitReached ? (
                <span className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Limite journalière atteinte
                </span>
              ) : (
                <span className="flex items-center">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Boost manuel
                </span>
              )}
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="w-full bg-slate-300 hover:bg-slate-300 text-slate-600 cursor-not-allowed shadow-md"
              disabled={true}
            >
              {limitReached ? (
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Limite journalière atteinte
                </span>
              ) : (
                <span className="flex items-center">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Boost manuel
                </span>
              )}
            </Button>
          )}
        </div>
        
        <div className="w-full">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 shadow-sm"
            disabled={isWithdrawing || isButtonDisabled}
            onClick={onWithdraw}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            {isWithdrawing ? (
              <span className="flex items-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                Traitement...
              </span>
            ) : (
              "Retirer les fonds"
            )}
          </Button>
        </div>
      </div>

      {/* Rangée conditionnelle pour le bouton d'augmentation de limite */}
      {(subscription === 'freemium' || limitReached) && (
        <div className="mt-1">
          <Link to="/offres" className="w-full block">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
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
