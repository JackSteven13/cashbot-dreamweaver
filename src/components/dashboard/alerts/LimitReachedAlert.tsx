
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calculator } from 'lucide-react';

interface LimitReachedAlertProps {
  subscription: string;
}

const LimitReachedAlert: React.FC<LimitReachedAlertProps> = ({ subscription }) => {
  return (
    <Alert 
      variant="warning" 
      className="mb-6 border-amber-600 bg-amber-50 dark:bg-amber-900/20"
    >
      <AlertTitle className="text-amber-800 dark:text-amber-300 font-bold flex items-center">
        <Calculator className="h-4 w-4 mr-2" />
        Limite journalière atteinte
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-amber-700 dark:text-amber-400">
          Vous avez atteint votre limite journalière pour un compte {subscription.charAt(0).toUpperCase() + subscription.slice(1)}. 
          Pour continuer à générer des revenus, veuillez attendre jusqu'à minuit ou passer à un abonnement supérieur.
        </p>
        <div className="mt-4 flex justify-end">
          <Link to="/offres">
            <Button 
              variant="outline" 
              className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 dark:text-amber-300"
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
