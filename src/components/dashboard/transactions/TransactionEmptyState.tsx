
import React, { memo } from 'react';
import { FileX } from 'lucide-react';

interface TransactionEmptyStateProps {
  isNewUser: boolean;
}

const TransactionEmptyState = memo(({ isNewUser }: TransactionEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-3 mb-3">
        <FileX className="h-6 w-6 text-slate-500 dark:text-slate-400" />
      </div>
      <h3 className="text-lg font-medium mb-1">Aucune transaction</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        {isNewUser 
          ? "Commencez à gagner des revenus en lançant votre première session !"
          : "Vous n'avez pas encore de transactions à afficher."
        }
      </p>
    </div>
  );
});

TransactionEmptyState.displayName = 'TransactionEmptyState';

export default TransactionEmptyState;
