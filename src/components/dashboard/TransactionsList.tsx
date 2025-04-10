
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SessionCard from '@/components/SessionCard';
import { Transaction } from '@/types/userData';
import { PlusCircle } from 'lucide-react';
import { generateInitialTransactions } from '@/utils/initialTransactionsGenerator';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
  userId?: string;
}

const TransactionsList = ({ transactions, isNewUser = false, subscription, userId }: TransactionsListProps) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [uniqueTransactions, setUniqueTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtrer les transactions en dédupliquant par ID et date+montant
  useEffect(() => {
    // S'assurer que transactions est un tableau avant de traiter
    if (!Array.isArray(transactions)) {
      console.log("Transactions n'est pas un tableau:", transactions);
      setUniqueTransactions([]);
      return;
    }
    
    console.log("Transactions brutes reçues dans TransactionsList:", transactions);
    
    // Vérifier que nous avons des transactions valides (avec une date et un montant/gain non nul)
    const validTransactions = transactions.filter(tx => 
      tx && 
      tx.date && 
      (
        (typeof tx.gain === 'number' && tx.gain > 0) || 
        (typeof tx.amount === 'number' && tx.amount > 0)
      )
    );
    
    console.log("Transactions valides avant déduplication:", validTransactions);
    
    // Utiliser un Map pour dédupliquer par ID ou combinaison date+montant
    const transactionMap = new Map();
    
    validTransactions.forEach(tx => {
      // Utiliser l'ID comme clé si disponible, sinon créer une clé composite
      const key = tx.id || `${tx.date}_${tx.gain || tx.amount}_${tx.report || tx.type || 'transaction'}`;
      
      if (!transactionMap.has(key)) {
        transactionMap.set(key, tx);
      }
    });
    
    const uniqueTxs = Array.from(transactionMap.values());
    console.log("Transactions uniques après déduplication:", uniqueTxs);
    setUniqueTransactions(uniqueTxs);
  }, [transactions]);
  
  // Si l'utilisateur a un solde mais pas de transactions, essayer de générer des transactions initiales
  useEffect(() => {
    const attemptGenerateInitialTransactions = async () => {
      // Vérifier si nous avons un ID utilisateur et un solde positif mais pas de transactions
      if (userId && uniqueTransactions.length === 0 && !isNewUser) {
        try {
          // Récupérer le solde actuel depuis le localStorage
          const storedBalance = localStorage.getItem('lastKnownBalance') || localStorage.getItem('currentBalance');
          const balance = storedBalance ? parseFloat(storedBalance) : 0;
          
          if (balance > 0) {
            console.log("Tentative de génération de transactions initiales pour l'historique");
            setLoading(true);
            // Générer des transactions initiales
            await generateInitialTransactions(userId, balance);
            setLoading(false);
            // Rafraîchir la page pour afficher les nouvelles transactions
            window.dispatchEvent(new CustomEvent('transactions:generated'));
          }
        } catch (error) {
          console.error("Erreur lors de la génération des transactions initiales:", error);
          setLoading(false);
        }
      }
    };
    
    attemptGenerateInitialTransactions();
  }, [userId, uniqueTransactions.length, isNewUser]);
    
  // Afficher 3 transactions récentes par défaut, ou toutes si showAllTransactions est true
  const displayedTransactions = showAllTransactions 
    ? uniqueTransactions 
    : uniqueTransactions.slice(0, 3);
    
  const handleViewFullHistory = () => {
    setShowAllTransactions(true);
  };
  
  // Format de date personnalisé pour l'affichage
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return dateString;
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1e3a5f]">Sessions récentes</h2>
        {uniqueTransactions.length > 3 && !showAllTransactions && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewFullHistory}
            className="border-[#cbd5e0] bg-[#f0f4f8] text-[#334e68] hover:bg-[#e2e8f0]"
          >
            Voir l'historique complet
          </Button>
        )}
        {showAllTransactions && uniqueTransactions.length > 3 && (
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
      
      {loading ? (
        <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-[#334e68]">Récupération de l'historique des transactions...</p>
        </div>
      ) : displayedTransactions.length > 0 ? (
        <div className="space-y-4">
          {displayedTransactions.map((transaction, index) => {
            // Utiliser gain s'il est disponible, sinon amount
            const transactionValue = transaction.gain || transaction.amount || 0;
            return (
              <SessionCard 
                key={transaction.id || `transaction_${index}`}
                date={formatDate(transaction.date)}
                gain={transactionValue}
                report={transaction.report || transaction.type || 'Session'}
              />
            );
          })}
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
              <p className="text-[#334e68]">Aucune session récente trouvée malgré un solde positif.</p>
              <div className="flex flex-col items-center mt-4">
                <PlusCircle className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-sm text-[#486581]">
                  Lancez une analyse manuelle ou attendez la synchronisation de votre historique.
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Afficher un message si l'historique est réduit et qu'il y a plus de transactions */}
      {!showAllTransactions && uniqueTransactions.length > 3 && (
        <div className="text-center mt-4">
          <p className="text-sm text-[#486581]">
            {uniqueTransactions.length - 3} {uniqueTransactions.length - 3 > 1 ? 'autres sessions' : 'autre session'} non affichée{uniqueTransactions.length - 3 > 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
