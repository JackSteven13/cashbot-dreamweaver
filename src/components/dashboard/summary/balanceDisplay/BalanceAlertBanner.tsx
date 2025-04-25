
import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BalanceAlertBannerProps {
  type: 'limit-reached' | 'near-limit';
  dailyLimit: number;
  subscription: string;
  percentage?: number;
}

export const BalanceAlertBanner: React.FC<BalanceAlertBannerProps> = ({
  type,
  dailyLimit,
  subscription,
  percentage = 0
}) => {
  const isMobile = useIsMobile();
  
  if (type === 'limit-reached') {
    return (
      <Alert variant="destructive" className="border-red-600 bg-red-900/20 dark:border-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-red-500 font-semibold">
          Limite journalière atteinte
        </AlertTitle>
        <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <span className="text-red-300 dark:text-red-400">
            Vous avez atteint votre limite quotidienne de {dailyLimit.toFixed(2)}€ avec votre compte {subscription}. Revenez demain ou passez à un forfait supérieur.
          </span>
          <Link to="/offres" className="mt-2 md:mt-0">
            <Button 
              variant="destructive" 
              size={isMobile ? "sm" : "default"}
              className="w-full md:w-auto whitespace-nowrap"
            >
              Voir les offres
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert 
      variant="warning" 
      className="border-yellow-600 bg-yellow-900/20 dark:border-yellow-800"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-yellow-500 font-semibold">
        Limite journalière presque atteinte
      </AlertTitle>
      <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <span className="text-yellow-300 dark:text-yellow-400">
          Vous approchez de votre limite quotidienne de {dailyLimit.toFixed(2)}€ ({Math.round(percentage)}%). Passez à un forfait supérieur pour augmenter cette limite.
        </span>
        <Link to="/offres" className="mt-2 md:mt-0">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="border-yellow-600 text-yellow-600 hover:bg-yellow-600/20 w-full md:w-auto whitespace-nowrap"
          >
            Voir les offres
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};
