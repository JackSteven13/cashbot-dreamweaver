
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

interface DormantAccountAlertProps {
  data: {
    dormancyDays?: number;
    penalties?: Array<{ amount: number; description: string }>;
    originalBalance?: number;
    remainingBalance?: number;
    reactivationFee?: number;
  };
  onReactivate?: () => void;
}

const DormantAccountAlert: React.FC<DormantAccountAlertProps> = ({ 
  data = {}, 
  onReactivate 
}) => {
  const { 
    dormancyDays = 0, 
    penalties = [], 
    originalBalance = 0, 
    remainingBalance = 0,
    reactivationFee = 0
  } = data;

  return (
    <Alert 
      variant="destructive" 
      className="mb-6 border-red-500 bg-red-50 dark:bg-red-900/20"
    >
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-700 dark:text-red-300 font-bold">
        Compte inactif depuis {dormancyDays} jours
      </AlertTitle>
      <AlertDescription>
        <p className="text-red-600 dark:text-red-200 mt-2">
          Votre compte est actuellement en pause en raison d'une inactivité prolongée. Des pénalités ont été appliquées conformément à nos conditions générales.
        </p>
        
        {penalties.length > 0 && (
          <div className="mt-3 p-3 bg-white dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800">
            <p className="font-semibold text-sm text-red-700 dark:text-red-300 mb-2">Détail des pénalités :</p>
            {penalties.map((penalty, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-red-600 dark:text-red-200">{penalty.description}</span>
                <span className="font-semibold text-red-700 dark:text-red-300">-{penalty.amount.toFixed(2)}€</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700 flex justify-between">
              <span className="font-medium text-red-700 dark:text-red-300">Solde restant :</span>
              <span className="font-bold text-red-700 dark:text-red-300">{remainingBalance.toFixed(2)}€</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center mt-4">
          <Clock className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-200">
            Pour réactiver votre compte, des frais de {reactivationFee.toFixed(2)}€ seront appliqués.
          </p>
        </div>
        
        {onReactivate && (
          <Button 
            variant="destructive" 
            onClick={onReactivate}
            className="w-full mt-4"
          >
            Réactiver mon compte ({reactivationFee.toFixed(2)}€)
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DormantAccountAlert;
