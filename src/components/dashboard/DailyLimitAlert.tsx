
import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

interface DailyLimitAlertProps {
  show: boolean;
  subscription: string;
  currentBalance: number;
}

const DailyLimitAlert: FC<DailyLimitAlertProps> = ({ show, subscription, currentBalance }) => {
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(0);
  
  // Vérifier si le mode Pro temporaire est activé
  useEffect(() => {
    const proTrialActive = localStorage.getItem('proTrialActive') === 'true';
    const proTrialExpires = localStorage.getItem('proTrialExpires');
    
    if (proTrialActive && proTrialExpires) {
      const expiryTime = parseInt(proTrialExpires, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setEffectiveSubscription('pro');
      } else {
        setEffectiveSubscription(subscription);
      }
    } else {
      setEffectiveSubscription(subscription);
    }
  }, [subscription]);
  
  // Mettre à jour la limite effective
  useEffect(() => {
    setEffectiveLimit(SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
  }, [effectiveSubscription]);
  
  if (!show) {
    return null;
  }

  const isLimitReached = currentBalance >= effectiveLimit;
  const limitPercentage = Math.min(100, (currentBalance / effectiveLimit) * 100);
  const isNearLimit = limitPercentage >= 90;

  // Si l'utilisateur est en mode Pro temporaire, ne pas afficher l'alerte s'il n'a pas vraiment atteint la limite Pro
  if (effectiveSubscription === 'pro' && subscription === 'freemium' && currentBalance < effectiveLimit) {
    return null;
  }

  return (
    <Alert className={`mb-6 ${isLimitReached ? 'bg-amber-50 border-amber-300' : 'bg-yellow-50 border-yellow-200'}`}>
      <AlertTitle className={isLimitReached ? 'text-amber-800' : 'text-yellow-800'}>
        {isLimitReached ? 'Limite journalière atteinte' : 'Limite journalière presque atteinte'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <span className={isLimitReached ? 'text-amber-700' : 'text-yellow-700'}>
            {isLimitReached 
              ? `Vous avez atteint votre limite de gain journalier de ${effectiveLimit.toFixed(1)}€ avec votre compte ${effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}.
                 Votre solde actuel est de ${currentBalance.toFixed(2)}€.`
              : `Vous approchez de votre limite de gain journalier de ${effectiveLimit.toFixed(1)}€ avec votre compte ${effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}.
                 Votre solde actuel est de ${currentBalance.toFixed(2)}€.`
            }
          </span>
          
          {/* Barre de progression visuelle */}
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${isLimitReached ? 'bg-amber-500' : isNearLimit ? 'bg-orange-500' : 'bg-yellow-500'}`}
              style={{ width: `${limitPercentage}%` }}
            />
          </div>
        </div>
        
        <Link to="/offres" className="whitespace-nowrap">
          <Button 
            variant="default" 
            size="sm" 
            className={`whitespace-nowrap ${isLimitReached ? 'bg-amber-600 hover:bg-amber-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
          >
            Augmenter ma limite
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default DailyLimitAlert;
