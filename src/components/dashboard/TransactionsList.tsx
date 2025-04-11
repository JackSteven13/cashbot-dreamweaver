
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SessionCard from '@/components/SessionCard';
import { Transaction } from '@/types/userData';
import { PlusCircle } from 'lucide-react';
import { fetchUserTransactions } from '@/hooks/user/transactionUtils';
import { supabase } from '@/integrations/supabase/client';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsList = ({ transactions: initialTransactions, isNewUser = false, subscription }: TransactionsListProps) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions || []);
  
  // Effet pour écouter les événements de nouvelles transactions
  useEffect(() => {
    // Mettre à jour les transactions quand les props changent
    setTransactions(initialTransactions);
    
    // Fonction pour actualiser les transactions
    const handleTransactionRefresh = async (event: CustomEvent) => {
      const userId = event.detail?.userId;
      
      if (!userId) return;
      
      // Obtenir la session actuelle
      const { data: { session } } = await supabase.auth.getSession();
      
      // Vérifier si l'événement concerne l'utilisateur actuel
      if (session?.user?.id === userId) {
        console.log("Refreshing transactions for user:", userId);
        
        // Récupérer les transactions mises à jour
        const updatedTransactions = await fetchUserTransactions(userId);
        if (updatedTransactions && updatedTransactions.length > 0) {
          setTransactions(updatedTransactions);
        }
      }
    };
    
    // Fonction pour ajouter une nouvelle transaction à la liste
    const handleTransactionAdded = async (event: CustomEvent) => {
      const { userId, gain, report, date } = event.detail || {};
      
      // Obtenir la session actuelle
      const { data: { session } } = await supabase.auth.getSession();
      
      // Vérifier si l'événement concerne l'utilisateur actuel
      if (session?.user?.id === userId) {
        console.log("New transaction added:", { gain, report });
        
        // Ajouter la nouvelle transaction au début de la liste
        const newTransaction: Transaction = {
          id: `temp-${Date.now()}`, // ID temporaire
          date,
          amount: gain,
          type: report,
          report,
          gain
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
      }
    };
    
    // Écouter l'événement de rafraîchissement des transactions
    window.addEventListener('transactions:refresh' as any, handleTransactionRefresh);
    window.addEventListener('transaction:added' as any, handleTransactionAdded);
    
    return () => {
      window.removeEventListener('transactions:refresh' as any, handleTransactionRefresh);
      window.removeEventListener('transaction:added' as any, handleTransactionAdded);
    };
  }, [initialTransactions]);
  
  // Vérifier que les transactions sont valides et non vides
  const validTransactions = Array.isArray(transactions) ? 
    transactions.filter(tx => tx && typeof tx.gain === 'number' && tx.date) : [];
  
  // Afficher 3 transactions récentes par défaut, ou toutes si showAllTransactions est true
  const displayedTransactions = showAllTransactions 
    ? validTransactions 
    : validTransactions.slice(0, 3);
    
  const handleViewFullHistory = () => {
    setShowAllTransactions(true);
  };
  
  // Debug
  console.log("Transactions reçues:", transactions);
  console.log("Transactions valides:", validTransactions);
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
        {validTransactions.length > 3 && !showAllTransactions && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewFullHistory}
            className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]"
          >
            Voir l'historique complet
          </Button>
        )}
        {showAllTransactions && validTransactions.length > 3 && (
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
              key={transaction.id || index}
              date={transaction.date}
              gain={transaction.gain || transaction.amount || 0}
              report={transaction.report || transaction.type || ''}
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
              <div className="flex flex-col items-center mt-4">
                <PlusCircle className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-sm text-[#486581]">
                  Lancez une analyse manuelle ou attendez la prochaine session automatique.
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Afficher un message si l'historique est réduit et qu'il y a plus de transactions */}
      {!showAllTransactions && validTransactions.length > 3 && (
        <div className="text-center mt-4">
          <p className="text-sm text-[#486581]">
            {validTransactions.length - 3} {validTransactions.length - 3 > 1 ? 'autres sessions' : 'autre session'} non affichée{validTransactions.length - 3 > 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
