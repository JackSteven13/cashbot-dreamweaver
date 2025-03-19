import React, { useEffect, useState } from 'react';
import { ArrowUpCircle, Clock, PlayCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscriptionUtils';

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
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(dailyLimit);
  
  // Vérifier l'abonnement effectif et la limite journalière
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    console.log("ActionButtons - Abonnement effectif:", effectiveSub);
    setEffectiveSubscription(effectiveSub);
    
    // Utiliser la limite correspondant à l'abonnement effectif
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    console.log("ActionButtons - Limite effective:", limit);
    setEffectiveLimit(limit);
  }, [subscription, dailyLimit]);
  
  // Vérifier si la limite est atteinte - check against the actual current balance
  const limitReached = currentBalance >= effectiveLimit;
  
  // Calculer le pourcentage de la limite atteinte pour l'affichage visuel
  const limitPercentage = Math.min(100, (currentBalance / effectiveLimit) * 100);
  
  // Vérifier si on peut démarrer une session en tenant compte de l'abonnement effectif
  const canStartSessionNow = effectiveSubscription !== 'freemium' ? !limitReached : canStartSession;

  return (
    <div className="grid grid-cols-1 gap-3 mb-6">
      {/* Rangée de boutons principale avec layout amélioré */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="w-full">
          {canStartSessionNow && !limitReached ? (
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white relative overflow-hidden shadow-md"
              disabled={isButtonDisabled || isStartingSession || limitReached}
              onClick={onBoostClick}
            >
              {/* Indicateur visuel de progression vers la limite */}
              <div 
                className="absolute bottom-0 left-0 h-1 bg-slate-400" 
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
            className="w-full border-slate-500 text-slate-600 hover:bg-slate-50 shadow-sm"
            disabled={isWithdrawing || isButtonDisabled}
            onClick={onWithdraw}
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            {isWithdrawing ? (
              <span className="flex items-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-slate-500 border-t-transparent rounded-full"></span>
                Traitement...
              </span>
            ) : (
              "Retirer les fonds"
            )}
          </Button>
        </div>
      </div>

      {/* Bouton d'accès aux offres toujours visible */}
      <div className="mt-1">
        <Link to="/offres" className="w-full block">
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md"
          >
            {limitReached ? "Augmenter votre limite" : "Voir les offres disponibles"}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ActionButtons;
