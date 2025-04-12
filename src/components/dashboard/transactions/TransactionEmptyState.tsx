
import React from 'react';
import { InfoCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface TransactionEmptyStateProps {
  isNewUser?: boolean;
}

const TransactionEmptyState: React.FC<TransactionEmptyStateProps> = ({ isNewUser = false }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
        <InfoCircle className="h-6 w-6 text-blue-500 dark:text-blue-400" />
      </div>
      
      {isNewUser ? (
        <>
          <h3 className="text-lg font-medium mb-1">Bienvenue !</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Lancez votre première analyse pour commencer à générer des revenus.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">Commencer</Link>
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-1">Aucune transaction trouvée</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Vos transactions apparaîtront ici dès que vous commencerez à générer des revenus. 
            Si vous avez déjà un solde et que vos transactions n'apparaissent pas, veuillez actualiser la page.
          </p>
        </>
      )}
    </div>
  );
};

export default TransactionEmptyState;
