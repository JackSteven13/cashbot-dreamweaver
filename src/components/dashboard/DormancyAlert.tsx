
import React from 'react';
import { AlertTriangle, LockIcon, ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DORMANCY_CONSTANTS } from '@/utils/balance/dormancyUtils';

interface Penalty {
  type: string;
  amount: number;
  description: string;
}

interface DormancyAlertProps {
  show: boolean;
  dormancyDays: number;
  penalties: Penalty[];
  originalBalance: number;
  remainingBalance: number;
  reactivationFee: number;
  onReactivate: () => void;
}

const DormancyAlert: React.FC<DormancyAlertProps> = ({
  show,
  dormancyDays,
  penalties,
  originalBalance,
  remainingBalance,
  reactivationFee,
  onReactivate
}) => {
  if (!show) return null;

  // Calculate which stage of dormancy the account is in
  const getStage = () => {
    if (dormancyDays >= DORMANCY_CONSTANTS.STAGES[2].days) return 3;
    if (dormancyDays >= DORMANCY_CONSTANTS.STAGES[1].days) return 2;
    if (dormancyDays >= DORMANCY_CONSTANTS.STAGES[0].days) return 1;
    return 0;
  };
  
  const stage = getStage();
  const accountLocked = stage === 3;

  return (
    <Alert variant="destructive" className="mb-6 border-red-600 bg-red-50 dark:bg-red-900/20">
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-600 dark:text-red-400 font-bold text-lg flex items-center">
        <LockIcon className="mr-2 h-4 w-4" />
        Compte en sommeil
      </AlertTitle>
      <AlertDescription className="mt-2 text-red-800 dark:text-red-200">
        <p className="mb-2">
          Votre compte est actuellement en sommeil suite à une interruption des prélèvements depuis 
          <span className="font-bold"> {dormancyDays} jours</span>.
        </p>
        
        <div className="my-3 p-3 bg-white dark:bg-red-900/30 rounded-md text-sm space-y-1">
          <p className="font-semibold border-b pb-1 mb-1">Détail des pénalités appliquées :</p>
          {penalties.map((penalty, index) => (
            <div key={index} className="flex justify-between">
              <span>{penalty.description}</span>
              <span className="font-semibold">-{penalty.amount.toFixed(2)}€</span>
            </div>
          ))}
          <div className="border-t pt-1 mt-1 flex justify-between font-bold">
            <span>Solde restant :</span>
            <span>{remainingBalance.toFixed(2)}€</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          <ClockIcon className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
          <p className="text-sm font-semibold">
            {accountLocked
              ? "Votre compte a perdu tous ses avoirs suite au délai de 90 jours dépassé."
              : `Votre compte continuera à perdre des avoirs selon l'Article 11 des CGV.`}
          </p>
        </div>
        
        {!accountLocked && (
          <Button 
            variant="destructive" 
            className="mt-4 w-full"
            onClick={onReactivate}
          >
            Réactiver mon compte ({reactivationFee.toFixed(2)}€ de frais)
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DormancyAlert;
