
import { FC } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
      <AlertDescription className="text-yellow-700">
        Vous avez atteint votre limite de gain journalier de {SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS]}€ avec votre compte Freemium. 
        <br />Passez à un forfait supérieur pour augmenter vos gains ou revenez demain.
      </AlertDescription>
    </Alert>
  );
};

export default DailyLimitAlert;
