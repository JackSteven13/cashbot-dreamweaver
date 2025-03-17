
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

  return (
    <Alert className="mb-6 bg-yellow-50 border-yellow-200">
      <AlertTitle className="text-yellow-800">Limite journalière atteinte</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="text-yellow-700">
          Vous avez atteint votre limite de gain journalier de {limit}€ avec votre compte {subscription.charAt(0).toUpperCase() + subscription.slice(1)}.
          {isLimitReached ? ` Votre solde actuel est de ${currentBalance.toFixed(2)}€.` : ''}
        </span>
        <Link to="/offres">
          <Button variant="default" size="sm" className="whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 text-white">
            Augmenter ma limite
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default DailyLimitAlert;
