
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp } from 'lucide-react';

interface LimitReachedAlertProps {
  subscription: string;
  dailyLimit?: number;
  percentage?: number;
  variant?: 'warning' | 'critical';
}

const LimitReachedAlert: React.FC<LimitReachedAlertProps> = ({ 
  subscription,
  dailyLimit = 0,
  percentage = 100,
  variant = 'critical'
}) => {
  const isCritical = variant === 'critical' || percentage >= 98;
  const formattedSubscription = subscription.charAt(0).toUpperCase() + subscription.slice(1);
  
  return (
    <Alert 
      variant={isCritical ? "destructive" : "warning"} 
      className={isCritical
        ? "mb-6 border-red-600 bg-red-50 dark:bg-red-900/20"
        : "mb-6 border-amber-600 bg-amber-50 dark:bg-amber-900/20"
      }
    >
      <AlertTitle className={`${
        isCritical ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
      } font-bold flex items-center`}>
        {isCritical ? (
          <>
            <Calculator className="h-4 w-4 mr-2" />
            Limite journalière atteinte
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4 mr-2" />
            Limite journalière presque atteinte
          </>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className={isCritical ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}>
          {isCritical 
            ? `Vous avez atteint votre limite journalière de ${dailyLimit.toFixed(2)}€ pour un compte ${formattedSubscription}. Pour continuer à générer des revenus, veuillez attendre jusqu'à minuit ou passer à un abonnement supérieur.`
            : `Vous avez atteint ${Math.round(percentage)}% de votre limite journalière de ${dailyLimit.toFixed(2)}€ avec votre compte ${formattedSubscription}. Passez à un abonnement supérieur pour augmenter cette limite.`
          }
        </p>
        <div className="mt-4 flex justify-end">
          <Link to="/offres">
            <Button 
              variant={isCritical ? "destructive" : "outline"}
              className={isCritical 
                ? ""
                : "border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 dark:text-amber-300"}
            >
              Voir les offres
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default LimitReachedAlert;
