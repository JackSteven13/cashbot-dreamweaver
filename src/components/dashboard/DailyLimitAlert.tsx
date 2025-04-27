
import { FC, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_LIMITS, getEffectiveSubscription } from '@/utils/subscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLimitChecking } from '@/hooks/sessions/manual/useLimitChecking';
import { UserData } from '@/types/userData';
import balanceManager from '@/utils/balance/balanceManager';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  
  // Améliorer le monitoring des gains quotidiens
  useEffect(() => {
    if (!userData) return;

    // Assurer que le balanceManager utilise le bon ID utilisateur
    if (user?.id) {
      balanceManager.setUserId(user.id);
    }

    // Obtenir les gains d'aujourd'hui depuis le gestionnaire de solde
    const actualTodaysGains = balanceManager.getDailyGains();
    setTodaysGains(actualTodaysGains);
    
    // Vérifier si la limite est atteinte (95% pour être encore plus strict)
    const limit = SUBSCRIPTION_LIMITS[effectiveSubscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
    const newIsLimitReached = actualTodaysGains >= limit * 0.95;
    
    // Si l'état de la limite a changé, mettre à jour et diffuser l'événement
    if (newIsLimitReached !== isLimitReached) {
      setIsLimitReached(newIsLimitReached);
      
      // Diffuser l'événement de limite atteinte pour informer les autres composants
      if (newIsLimitReached) {
        window.dispatchEvent(new CustomEvent('daily-limit:reached', {
          detail: {
            subscription: effectiveSubscription,
            limit: limit,
            currentGains: actualTodaysGains,
            userId: user?.id // Ajouter l'ID utilisateur à l'événement
          }
        }));
      }
    }
    
    // Double vérification avec les transactions pour être absolument sûr
    const checkTransactionGains = async () => {
      if (!userData) return;
      const transactionGains = await getTodaysGains(userData);
      
      // Si les transactions montrent plus de gains, utiliser cette valeur
      if (transactionGains > actualTodaysGains) {
        console.log(`Mise à jour des gains quotidiens: ${actualTodaysGains}€ -> ${transactionGains}€ (transactions)`);
        setTodaysGains(transactionGains);
        balanceManager.setDailyGains(transactionGains);
        
        // Vérifier à nouveau si la limite est atteinte
        const newLimitStatus = transactionGains >= limit * 0.95;
        setIsLimitReached(newLimitStatus);
        
        // Diffuser l'événement si la limite est maintenant atteinte
        if (newLimitStatus && !isLimitReached) {
          window.dispatchEvent(new CustomEvent('daily-limit:reached', {
            detail: {
              subscription: effectiveSubscription,
              limit: limit,
              currentGains: transactionGains,
              userId: user?.id // Ajouter l'ID utilisateur à l'événement
            }
          }));
        }
      }
    };
    
    checkTransactionGains();
    
    // Écouter les événements de mise à jour des gains
    const handleBalanceUpdate = (event: CustomEvent) => {
      // Vérifier si l'événement concerne cet utilisateur
      if (event.detail?.userId && user?.id && event.detail.userId !== user.id) {
        return;
      }
      
      if (event.detail?.dailyGains) {
        const updatedGains = event.detail.dailyGains;
        setTodaysGains(updatedGains);
        
        // Vérifier à nouveau si la limite est atteinte
        const updatedLimitStatus = updatedGains >= limit * 0.95;
        setIsLimitReached(updatedLimitStatus);
      }
    };
    
    window.addEventListener('balance:update' as any, handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balance:update' as any, handleBalanceUpdate);
    };
  }, [userData, effectiveSubscription, getTodaysGains, isLimitReached, user]);
  
  // Vérifier si le mode Pro temporaire est activé
  useEffect(() => {
    const effectiveSub = getEffectiveSubscription(subscription);
    setEffectiveSubscription(effectiveSub);
    
    // Mettre à jour la limite effective
    setEffectiveLimit(SUBSCRIPTION_LIMITS[effectiveSub as keyof typeof SUBSCRIPTION_LIMITS] || 0.5);
  }, [subscription]);
  
  if (!show) {
    return null;
  }

  // Calculs de limite quotidienne basés sur les gains d'AUJOURD'HUI, pas le solde total
  const limitPercentage = Math.min(100, (todaysGains / effectiveLimit) * 100);
  const isNearLimit = limitPercentage >= 80 && limitPercentage < 100;

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
              ? `Félicitations! Vous avez atteint votre objectif quotidien de ${effectiveLimit}€ avec votre compte ${effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}.
                 Votre solde total est de ${currentBalance.toFixed(2)}€ (Gains aujourd'hui: ${todaysGains.toFixed(2)}€)`
              : `Vous approchez de votre objectif quotidien de ${effectiveLimit}€ avec votre compte ${effectiveSubscription.charAt(0).toUpperCase() + effectiveSubscription.slice(1)}.
                 Votre solde total est de ${currentBalance.toFixed(2)}€ (Gains aujourd'hui: ${todaysGains.toFixed(2)}€)`
            }
          </span>
          
          {/* Barre de progression pour la représentation visuelle */}
          <div className="w-full h-1.5 md:h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 md:mt-2 overflow-hidden">
            <div 
              className={`h-full ${isLimitReached ? 'bg-green-500' : isNearLimit ? 'bg-blue-500' : 'bg-blue-500'}`}
              style={{ width: `${limitPercentage}%` }}
            />
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
