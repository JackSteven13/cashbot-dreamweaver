
import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLimitChecking } from '@/hooks/sessions/manual/useLimitChecking';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import { 
  formatPrice, 
  calculateUsagePercentage, 
  getUsageColor,
  getDailyLimitDetails
} from '@/utils/balance/limitCalculations';

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
  const [limitDetails, setLimitDetails] = useState<ReturnType<typeof getDailyLimitDetails> | null>(null);
  const isMobile = useIsMobile();
  const { getTodaysGains } = useLimitChecking();
  
  // Calculate today's gains and update limit details
  useEffect(() => {
    if (!userData) return;

    // Obtenir les gains d'aujourd'hui depuis le gestionnaire de solde
    const actualTodaysGains = balanceManager.getDailyGains();
    setTodaysGains(actualTodaysGains);
    
    // Obtenir l'abonnement effectif et la limite
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    const limit = SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    setEffectiveLimit(limit);
    
    // Vérifier si la limite est atteinte (98% pour être préventif)
    setIsLimitReached(actualTodaysGains >= limit * 0.98);
    
    // Calculer les détails complets des limitations
    const details = getDailyLimitDetails(actualTodaysGains, limit, effectiveSub);
    setLimitDetails(details);
    
    // Obtenir les gains d'aujourd'hui depuis les transactions (méthode secondaire)
    const checkTransactionGains = async () => {
      if (!userData) return;
      const transactionGains = await getTodaysGains(userData);
      
      // Si les transactions montrent plus de gains, utiliser cette valeur
      if (transactionGains > actualTodaysGains) {
        console.log(`Mise à jour des gains quotidiens: ${actualTodaysGains}€ -> ${transactionGains}€ (transactions)`);
        setTodaysGains(transactionGains);
        balanceManager.setDailyGains(transactionGains);
        setIsLimitReached(transactionGains >= limit * 0.98);
        
        // Mettre à jour les détails des limitations
        const updatedDetails = getDailyLimitDetails(transactionGains, limit, effectiveSub);
        setLimitDetails(updatedDetails);
      }
    };
    
    checkTransactionGains();
  }, [userData, subscription, getTodaysGains]);
  
  if (!show || !limitDetails) {
    return null;
  }

  return (
    <Alert 
      className={`mb-4 md:mb-6 ${isLimitReached ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/40 dark:border-blue-600' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700'}`}
      variant={isLimitReached ? "default" : "default"}
    >
      <AlertTitle className={`text-sm md:text-base ${isLimitReached ? 'text-blue-800 dark:text-blue-300' : 'text-blue-800 dark:text-blue-300'}`}>
        {isLimitReached ? 'Objectif quotidien atteint!' : 'Objectif quotidien presque atteint!'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
        <div className="flex-1">
          <span className={`text-xs md:text-sm ${isLimitReached ? 'text-blue-700 dark:text-blue-400' : 'text-blue-700 dark:text-blue-400'}`}>
            {isLimitReached 
              ? `Félicitations! Vous avez atteint votre objectif quotidien de ${limitDetails.formattedLimit} avec votre compte ${limitDetails.subscription}.
                 Votre solde total est de ${formatPrice(currentBalance)}.`
              : `Vous approchez de votre objectif quotidien de ${limitDetails.formattedLimit} avec votre compte ${limitDetails.subscription}.
                 Votre solde total est de ${formatPrice(currentBalance)}.`
            }
          </span>
          
          {/* Progress bar for visual representation with positive colors */}
          <div className="w-full h-1.5 md:h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 md:mt-2 overflow-hidden">
            <div 
              className={`h-full ${isLimitReached ? 'bg-green-500' : limitDetails.percentage >= 80 ? 'bg-blue-500' : 'bg-blue-500'}`}
              style={{ width: `${limitDetails.percentage}%` }}
            />
          </div>
          
          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            <span>Réinitialisation dans: {limitDetails.resetTime}</span>
          </div>
        </div>
        
        <Link to="/offres" className="whitespace-normal mt-2 sm:mt-0">
          <Button 
            variant="default" 
            size={isMobile ? "sm" : "default"}
            className={`w-full sm:w-auto whitespace-normal h-auto py-1.5 md:py-2 px-2 md:px-3 text-xs md:text-sm ${isLimitReached ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            Augmenter mon potentiel
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default DailyLimitAlert;
