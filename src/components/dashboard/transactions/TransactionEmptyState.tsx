
import React from 'react';

interface TransactionEmptyStateProps {
  isNewUser?: boolean;
}

const TransactionEmptyState: React.FC<TransactionEmptyStateProps> = ({ isNewUser = false }) => {
  return (
    <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
      <p className="text-muted-foreground">
        {isNewUser 
          ? "Commencez à générer des gains pour voir vos transactions apparaître ici."
          : "Aucune transaction à afficher pour le moment."
        }
      </p>
    </div>
  );
};

export default TransactionEmptyState;
