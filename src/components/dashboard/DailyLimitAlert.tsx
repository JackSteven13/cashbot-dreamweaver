
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_LIMITS } from '@/utils/subscriptionUtils';

interface DailyLimitAlertProps {
  show: boolean;
  subscription: string;
}

const DailyLimitAlert: FC<DailyLimitAlertProps> = ({ show, subscription }) => {
  if (!show || subscription !== 'freemium') {
    return null;
  }

  return (
    <Alert className="mb-6 bg-yellow-50 border-yellow-200">
      <AlertTitle className="text-yellow-800">Limite journalière atteinte</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="text-yellow-700">
          Vous avez atteint votre limite de gain journalier de {SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS]}€ avec votre compte Freemium.
        </span>
        <Link to="/offres">
          <Button variant="default" size="sm" className="whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 text-white">
            Voir les offres
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default DailyLimitAlert;
