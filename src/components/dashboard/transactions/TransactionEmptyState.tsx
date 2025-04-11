
import React from 'react';
import { PlusCircle } from 'lucide-react';

interface TransactionEmptyStateProps {
  isNewUser: boolean;
}

const TransactionEmptyState = ({ isNewUser }: TransactionEmptyStateProps) => {
  return (
    <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-100">
      {isNewUser ? (
        <>
          <p className="text-[#334e68] font-medium">Bienvenue sur Stream Genius !</p>
          <p className="text-[#334e68] mt-2">Le système commencera bientôt à générer des revenus pour vous.</p>
          <p className="text-sm text-[#486581] mt-2">Votre première session sera automatiquement lancée.</p>
        </>
      ) : (
        <>
          <p className="text-[#334e68]">Aucune session récente.</p>
          <div className="flex flex-col items-center mt-4">
            <PlusCircle className="h-8 w-8 text-blue-400 mb-2" />
            <p className="text-sm text-[#486581]">
              Lancez une analyse manuelle ou attendez la prochaine session automatique.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionEmptyState;
