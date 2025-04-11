
import React from 'react';

interface TransactionEmptyStateProps {
  isNewUser?: boolean;
}

const TransactionEmptyState: React.FC<TransactionEmptyStateProps> = ({ isNewUser = false }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
        <svg className="h-8 w-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
        Aucune transaction
      </h3>
      
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
        {isNewUser 
          ? "Vous n'avez pas encore effectué de transactions. Commencez par lancer une session pour générer vos premiers revenus." 
          : "Vous n'avez pas encore d'historique de transactions. Les transactions apparaîtront ici une fois que vous commencerez à générer des revenus."}
      </p>
    </div>
  );
};

export default TransactionEmptyState;
