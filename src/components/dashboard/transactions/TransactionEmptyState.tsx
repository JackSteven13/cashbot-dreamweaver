
import React from 'react';

interface TransactionEmptyStateProps {
  isNewUser?: boolean;
}

const TransactionEmptyState: React.FC<TransactionEmptyStateProps> = ({ isNewUser = false }) => {
  return (
    <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <p>Aucune transaction à afficher.</p>
      {isNewUser && (
        <p className="mt-2">Commencez à gagner des revenus en lançant votre première session!</p>
      )}
    </div>
  );
};

export default TransactionEmptyState;
