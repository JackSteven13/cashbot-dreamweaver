
import { FC } from 'react';
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
  if (!show) {
    return null;
  }

  const limit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  const isLimitReached = currentBalance >= limit;
  const limitPercentage = Math.min(100, (currentBalance / limit) * 100);
  const isNearLimit = limitPercentage >= 90;

  return (
    <Alert className={`mb-6 ${isLimitReached ? 'bg-amber-50 border-amber-300' : 'bg-yellow-50 border-yellow-200'}`}>
      <AlertTitle className={isLimitReached ? 'text-amber-800' : 'text-yellow-800'}>
        {isLimitReached ? 'Limite journalière atteinte' : 'Limite journalière presque atteinte'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <span className={isLimitReached ? 'text-amber-700' : 'text-yellow-700'}>
            {isLimitReached 
              ? `Vous avez atteint votre limite de gain journalier de ${limit}€ avec votre compte ${subscription.charAt(0).toUpperCase() + subscription.slice(1)}.
                 Votre solde actuel est de ${currentBalance.toFixed(2)}€.`
              : `Vous approchez de votre limite de gain journalier de ${limit}€ avec votre compte ${subscription.charAt(0).toUpperCase() + subscription.slice(1)}.
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
