
import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLimitChecking } from '@/hooks/sessions/manual/useLimitChecking';
import { UserData } from '@/types/userData';

interface DailyLimitAlertProps {
  show: boolean;
  subscription: string;
  currentBalance: number;
  userData?: UserData;
  isLimitReached?: boolean;
}

const DailyLimitAlert: FC<DailyLimitAlertProps> = ({ show, subscription, currentBalance, userData, isLimitReached: propIsLimitReached }) => {
  const [effectiveSubscription, setEffectiveSubscription] = useState(subscription);
  const [effectiveLimit, setEffectiveLimit] = useState(0);
  const [todaysGains, setTodaysGains] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(propIsLimitReached || false);
  const isMobile = useIsMobile();
  const { getTodaysGains } = useLimitChecking();
  
  // Calculate today's gains
  useEffect(() => {
    if (!userData) return;

    // Obtenir les gains d'aujourd'hui depuis les transactions
    const actualTodaysGains = getTodaysGains(userData);
    setTodaysGains(actualTodaysGains);
    
    // Vérifier si la limite est atteinte
    const limit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setIsLimitReached(actualTodaysGains >= limit);
    
  }, [userData, effectiveSubscription, getTodaysGains]);
  
  // Check if temporary Pro mode is activated
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    
    // Update effective limit
    setEffectiveLimit(SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
  }, [subscription]);
  
  if (!show) {
    return null;
  }

  // Daily limit calculations - based on TODAY's gains, not total balance
  const limitPercentage = Math.min(100, (todaysGains / effectiveLimit) * 100);
  const isNearLimit = limitPercentage >= 80 && limitPercentage < 100;

  return (
    <Alert 
      className={`mb-4 md:mb-6 ${isLimitReached ? 'bg-amber-50 border-amber-300' : 'bg-yellow-50 border-yellow-200'}`}
      variant={isLimitReached ? "destructive" : "warning"} // Utilisez les variants pour la cohérence
    >
      <AlertTitle className={`text-sm md:text-base ${isLimitReached ? 'text-amber-800' : 'text-yellow-800'}`}>
        {isLimitReached ? 'Limite journalière atteinte' : 'Limite journalière presque atteinte'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
        <div className="flex-1">
          <span className={`text-xs md:text-sm ${isLimitReached ? 'text-amber-700' : 'text-yellow-700'}`}>
            {isLimitReached 
              ? `Vous avez atteint votre limite de gain journalier de ${effectiveLimit}€ avec votre compte ${effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}.
                 Votre solde total est de ${currentBalance.toFixed(2)}€.`
              : `Vous approchez de votre limite de gain journalier de ${effectiveLimit}€ avec votre compte ${effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}.
                 Votre solde total est de ${currentBalance.toFixed(2)}€.`
            }
          </span>
          
          {/* Progress bar for visual representation */}
          <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full mt-1.5 md:mt-2 overflow-hidden">
            <div 
              className={`h-full ${isLimitReached ? 'bg-amber-500' : isNearLimit ? 'bg-orange-500' : 'bg-yellow-500'}`}
              style={{ width: `${limitPercentage}%` }}
            />
          </div>
        </div>
        
        <Link to="/offres" className="whitespace-normal mt-2 sm:mt-0">
          <Button 
            variant="default" 
            size={isMobile ? "sm" : "default"}
            className={`w-full sm:w-auto whitespace-normal h-auto py-1.5 md:py-2 px-2 md:px-3 text-xs md:text-sm ${isLimitReached ? 'bg-amber-600 hover:bg-amber-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
          >
            Augmenter ma limite
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default DailyLimitAlert;
