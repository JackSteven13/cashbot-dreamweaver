
import React, { memo, useEffect, useState, useCallback } from 'react';
import { useTransactions } from './transactions/hooks/useTransactions';
import { Transaction } from '@/types/userData';
import { TransactionListItem, TransactionEmptyState, TransactionListActions, TransactionFooter } from './transactions';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TransactionsListProps {
  transactions: Transaction[];
  isNewUser?: boolean;
  subscription?: string;
}

const TransactionsList = memo(({ 
  transactions: initialTransactions, 
  isNewUser = false,
  subscription = 'freemium'
}: TransactionsListProps) => {
  const {
    showAllTransactions,
    setShowAllTransactions,
    validTransactions,
    displayedTransactions,
    refreshKey,
    handleManualRefresh,
    hiddenTransactionsCount,
    setTransactions,
    fetchTransactionsFromDB
  } = useTransactions(initialTransactions);
  
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Fonction pour récupérer les transactions directement depuis la base de données
  const fetchLatestTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsRefreshing(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        // Formater les transactions pour correspondre au format attendu
        const formattedTransactions = data.map((tx: any) => ({
          id: tx.id,
          date: tx.created_at || tx.date,
          amount: tx.gain,
          gain: tx.gain,
          report: tx.report,
          type: tx.type || 'system'
        }));
        
        // Mettre à jour les transactions dans le hook
        setTransactions(formattedTransactions);
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('transactions:updated', {
          detail: { transactions: formattedTransactions }
        }));
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  }, [user, setTransactions]);
  
  // Mettre en place la réception des événements et le polling pour les mises à jour des transactions
  useEffect(() => {
    // Fonction pour gérer les événements de mise à jour
    const handleRealtimeUpdate = () => {
      console.log("Transaction update event received - fetching latest transactions");
      fetchLatestTransactions();
    };
    
    // Écouter plus d'événements pour s'assurer que les transactions sont à jour
    window.addEventListener('transactions:refresh', handleRealtimeUpdate);
    window.addEventListener('balance:update', handleRealtimeUpdate);
    window.addEventListener('automatic:revenue', handleRealtimeUpdate);
    window.addEventListener('balance:daily-growth', handleRealtimeUpdate);
    window.addEventListener('session:completed', handleRealtimeUpdate);
    window.addEventListener('transactions:updated', handleRealtimeUpdate);
    
    // Configurer un canal Supabase pour les mises à jour en temps réel
    const setupRealtimeSubscription = async () => {
      if (!user?.id) return;
      
      // S'abonner aux changements dans la table des transactions pour cet utilisateur
      const channel = supabase
        .channel('transactions_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          console.log('Realtime update detected for transactions');
          fetchLatestTransactions();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const realtimeCleanup = setupRealtimeSubscription();
    
    // Mise en place d'un rafraîchissement périodique toutes les 30 secondes
    const pollingInterval = setInterval(() => {
      console.log("Polling for transaction updates");
      fetchLatestTransactions();
    }, 30000);
    
    // Rafraîchissement initial des transactions
    fetchLatestTransactions();
    
    return () => {
      window.removeEventListener('transactions:refresh', handleRealtimeUpdate);
      window.removeEventListener('balance:update', handleRealtimeUpdate);
      window.removeEventListener('automatic:revenue', handleRealtimeUpdate);
      window.removeEventListener('balance:daily-growth', handleRealtimeUpdate);
      window.removeEventListener('session:completed', handleRealtimeUpdate);
      window.removeEventListener('transactions:updated', handleRealtimeUpdate);
      clearInterval(pollingInterval);
      
      // Nettoyer l'abonnement Realtime
      realtimeCleanup.then(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, [fetchLatestTransactions, user]);
  
  // Handle manual refresh with direct database fetch
  const onManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchLatestTransactions();
    setIsRefreshing(false);
    
    toast({
      title: "Historique mis à jour",
      description: "Les transactions ont été synchronisées avec succès",
      duration: 2000,
    });
  };
  
  return (
    <div className="mb-8" key={refreshKey}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Historique des transactions</h3>
        {isRefreshing && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Synchronisation...
          </div>
        )}
      </div>
      
      <TransactionListActions
        showAllTransactions={showAllTransactions}
        setShowAllTransactions={setShowAllTransactions}
        validTransactionsCount={validTransactions.length}
        onManualRefresh={onManualRefresh}
      />
      
      {displayedTransactions.length > 0 ? (
        <div className="space-y-4">
          {displayedTransactions.map((transaction, index) => (
            <TransactionListItem
              key={`${transaction.id || ''}-${index}-${refreshKey}`}
              transaction={transaction}
              refreshKey={refreshKey}
              index={index}
              subscription={subscription}
            />
          ))}
        </div>
      ) : (
        <TransactionEmptyState isNewUser={isNewUser} />
      )}
      
      <TransactionFooter 
        showAllTransactions={showAllTransactions} 
        hiddenTransactionsCount={hiddenTransactionsCount} 
      />
      
      <div className="text-xs text-muted-foreground mt-2 text-right">
        Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
});

// Set display name for debugging
TransactionsList.displayName = 'TransactionsList';

export default TransactionsList;
