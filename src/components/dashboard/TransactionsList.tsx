
import React, { useState } from 'react';
import Button from '@/components/Button';
import SessionCard from '@/components/SessionCard';
import { Transaction } from '@/types/userData';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsList = ({ transactions, isNewUser = false, subscription }: TransactionsListProps) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  // Afficher 3 transactions récentes par défaut, ou toutes si showAllTransactions est true
  const displayedTransactions = showAllTransactions 
    ? transactions 
    : transactions.slice(0, 3);
    
  const handleViewFullHistory = () => {
    setShowAllTransactions(true);
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
        {transactions.length > 3 && !showAllTransactions && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]"
            onClick={handleViewFullHistory}
          >
            Voir l'historique complet
          </Button>
        )}
        {showAllTransactions && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]"
            onClick={() => setShowAllTransactions(false)}
          >
            Réduire l'historique
          </Button>
        )}
      </div>
      
      {displayedTransactions.length > 0 ? (
        <div className="space-y-4">
          {displayedTransactions.map((transaction, index) => (
            <SessionCard 
              key={index}
              date={transaction.date}
              gain={transaction.gain}
              report={transaction.report}
            />
          ))}
        </div>
      ) : (
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
              <p className="text-sm text-[#486581] mt-2">Lancez une analyse manuelle ou attendez la prochaine session automatique.</p>
            </>
          )}
        </div>
      )}
      
      {/* Afficher un message si l'historique est réduit et qu'il y a plus de transactions */}
      {!showAllTransactions && transactions.length > 3 && (
        <div className="text-center mt-4">
          <p className="text-sm text-[#486581]">
            {transactions.length - 3} {transactions.length - 3 > 1 ? 'autres sessions' : 'autre session'} non affichée{transactions.length - 3 > 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
