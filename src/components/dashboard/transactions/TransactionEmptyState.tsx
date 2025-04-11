
import React from 'react';

interface TransactionEmptyStateProps {
  isNewUser?: boolean;
}

const TransactionEmptyState: React.FC<TransactionEmptyStateProps> = ({ isNewUser = false }) => {
  return (
    <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg">
      <div className="flex flex-col items-center justify-center space-y-2">
        <p className="text-slate-600 dark:text-slate-300">
          {isNewUser 
            ? "Bienvenue ! Lancez votre première session pour commencer." 
            : "Aucune session à afficher."}
        </p>
        {isNewUser && (
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Cliquez sur le bouton "Lancer une session" pour générer vos premiers revenus.
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionEmptyState;
