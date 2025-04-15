
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import SessionCard from '@/components/SessionCard';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/types/userData';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTransactions } from '@/components/dashboard/transactions/hooks';
import { toast } from '@/components/ui/use-toast';

interface TransactionsTabProps {
  transactions: Array<{
    gain?: number;
    report?: string;
    date: string;
    amount?: number;
    type?: string;
  }>;
  isNewUser: boolean;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ 
  transactions: initialTransactions,
  isNewUser
}) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  
  // Use the transactions hook for more reliable transaction management
  const { 
    displayedTransactions, 
    handleManualRefresh 
  } = useTransactions(initialTransactions);
  
  // Handle manual refresh with animation
  const refreshTransactions = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await handleManualRefresh();
      setLocalRefreshKey(prev => prev + 1);
      toast({
        title: "Transactions actualisées",
        description: "Les dernières transactions ont été chargées",
      });
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Listen for transaction refresh events
  useEffect(() => {
    const handleTransactionRefresh = () => {
      refreshTransactions();
    };
    
    // Listen for multiple event types to ensure sync
    window.addEventListener('transactions:refresh', handleTransactionRefresh);
    window.addEventListener('balance:update', handleTransactionRefresh);
    window.addEventListener('automatic:revenue', handleTransactionRefresh);
    
    // Add automatic refresh every 3 minutes
    const autoRefreshInterval = setInterval(() => {
      if (!isRefreshing) {
        setLocalRefreshKey(prev => prev + 1);
      }
    }, 180000); 
    
    return () => {
      window.removeEventListener('transactions:refresh', handleTransactionRefresh);
      window.removeEventListener('balance:update', handleTransactionRefresh);
      window.removeEventListener('automatic:revenue', handleTransactionRefresh);
      clearInterval(autoRefreshInterval);
    };
  }, [isRefreshing]);
  
  const handleViewAll = () => {
    navigate('/dashboard/transactions');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Historique</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshTransactions} 
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {displayedTransactions.length > 0 ? (
        <div className="grid gap-4">
          {displayedTransactions.slice(0, 5).map((transaction, index) => (
            <SessionCard 
              key={`tx-${index}-${transaction.date}-${localRefreshKey}`}
              gain={transaction.gain || transaction.amount || 0}
              report={transaction.report || transaction.type || ''}
              date={transaction.date}
            />
          ))}
          {displayedTransactions.length > 5 && (
            <Button variant="outline" className="w-full mt-2" onClick={handleViewAll}>
              Voir toutes les transactions
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p>Aucune transaction à afficher.</p>
          {isNewUser && (
            <p className="mt-2">Commencez à gagner des revenus en lançant votre première session.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
